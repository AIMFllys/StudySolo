import { describe, expect, it } from 'vitest';
import type { NodeExecutionTrace, WorkflowChain } from '@/types';
import {
  buildExecutionRequestBody,
  getExecutionFailureMessage,
  shouldFinalizeExecutionAsInterrupted,
} from '@/features/workflow/utils/execution-state';
import {
  buildLoopGroupConfigPatch,
  buildMergedConfigPatch,
} from '@/features/workflow/components/node-config/config-patch';
import {
  buildTraceListItems,
  filterTracesByChain,
  shouldShowChainTabs,
} from '@/features/workflow/components/execution/trace-list-utils';
import { applyWorkflowExecutionEvent } from '@/features/workflow/utils/workflow-execution-events';

function makeTrace(overrides: Partial<NodeExecutionTrace>): NodeExecutionTrace {
  return {
    nodeId: overrides.nodeId ?? 'node-1',
    nodeType: overrides.nodeType ?? 'summary',
    nodeName: overrides.nodeName ?? '节点 1',
    category: overrides.category ?? 'generation',
    status: overrides.status ?? 'pending',
    executionOrder: overrides.executionOrder ?? 1,
    isParallel: overrides.isParallel ?? false,
    streamingOutput: overrides.streamingOutput ?? '',
    ...overrides,
  };
}

describe('workflow execution closure helpers', () => {
  it('builds POST execution payload from in-memory graph', () => {
    const body = buildExecutionRequestBody(
      [{ id: 'n1' }] as never[],
      [{ id: 'e1' }] as never[],
    );

    expect(body).toEqual({
      nodes_json: [{ id: 'n1' }],
      edges_json: [{ id: 'e1' }],
    });
  });

  it('maps execution errors to stable user-facing messages', () => {
    expect(getExecutionFailureMessage(new Error('HTTP 403'))).toBe('启动执行失败：HTTP 403');
    expect(getExecutionFailureMessage(new Error('boom'))).toBe('执行流异常中断，请手动重新运行');
    expect(getExecutionFailureMessage('bad')).toBe('执行流异常中断，请手动重新运行');
  });

  it('marks interrupted execution only when stream did not complete and was not aborted', () => {
    expect(shouldFinalizeExecutionAsInterrupted(false, false)).toBe(true);
    expect(shouldFinalizeExecutionAsInterrupted(true, false)).toBe(false);
    expect(shouldFinalizeExecutionAsInterrupted(false, true)).toBe(false);
  });

  it('builds config patches for generic nodes and loop groups', () => {
    expect(buildMergedConfigPatch({ temperature: 0.7 }, { maxTokens: 2048 })).toEqual({
      temperature: 0.7,
      maxTokens: 2048,
    });
    expect(buildMergedConfigPatch({ temperature: 0.7 }, { maxTokens: 2048 }, true)).toEqual({
      maxTokens: 2048,
    });
    expect(buildLoopGroupConfigPatch({
      maxIterations: 5,
      intervalSeconds: 2,
      description: '批处理',
      ignored: true,
    })).toEqual({
      maxIterations: 5,
      intervalSeconds: 2,
      description: '批处理',
    });
  });

  it('filters traces by chain and hides tabs when only one chain exists', () => {
    const traces = [
      makeTrace({ nodeId: 'start', chainIds: [1, 2], executionOrder: 1 }),
      makeTrace({ nodeId: 'a', chainIds: [1], executionOrder: 2 }),
      makeTrace({ nodeId: 'b', chainIds: [2], executionOrder: 3 }),
    ];
    const chains: WorkflowChain[] = [
      { chainId: 1, label: '线路 1', nodeIds: ['start', 'a'] },
      { chainId: 2, label: '线路 2', nodeIds: ['start', 'b'] },
    ];

    expect(filterTracesByChain(traces, null).map((trace) => trace.nodeId)).toEqual(['start', 'a', 'b']);
    expect(filterTracesByChain(traces, 1).map((trace) => trace.nodeId)).toEqual(['start', 'a']);
    expect(shouldShowChainTabs(chains)).toBe(true);
    expect(shouldShowChainTabs([chains[0]])).toBe(false);
  });

  it('groups filtered traces without duplicating parallel entries', () => {
    const traces = [
      makeTrace({ nodeId: 'n1', executionOrder: 1, parallelGroupId: 'p1' }),
      makeTrace({ nodeId: 'n2', executionOrder: 2, parallelGroupId: 'p1' }),
      makeTrace({ nodeId: 'n3', executionOrder: 3 }),
    ];

    expect(buildTraceListItems(traces)).toEqual([
      { kind: 'parallel', traces: [traces[0], traces[1]] },
      { kind: 'single', trace: traces[2] },
    ]);
  });

  it('applies node_input events with parallel metadata and input summary', () => {
    const updateNodeTraceCalls: Array<{ nodeId: string; updates: Record<string, unknown> }> = [];
    const registerCalls: Array<{ nodeId: string; executionOrder: number; isParallel?: boolean; parallelGroupId?: string }> = [];
    const nodeDataState: Record<string, Record<string, unknown>> = {};

    const didComplete = applyWorkflowExecutionEvent(
      'node_input',
      JSON.stringify({
        type: 'node_input',
        node_id: 'new-node',
        input_snapshot: JSON.stringify({
          topic: '工作流',
          section_text: '执行面板重构',
        }),
      }),
      {
        getExecutionSession: () => ({
          sessionId: 'session-1',
          workflowId: 'wf-1',
          workflowName: '执行测试',
          startedAt: 0,
          overallStatus: 'running',
          traces: [makeTrace({ nodeId: 'existing', status: 'running' })],
          completedCount: 0,
          totalCount: 1,
          chains: [],
        }),
        now: () => 120,
        nextTraceOrder: () => 1,
        startTimeMap: {},
        setStatus: () => {},
        setError: () => {},
        setSelectedNodeId: () => {},
        updateNodeData: (nodeId, update) => {
          nodeDataState[nodeId] = { ...(nodeDataState[nodeId] ?? {}), ...(update as Record<string, unknown>) };
        },
        registerNodeTrace: (nodeId, executionOrder, isParallel, parallelGroupId) => {
          registerCalls.push({ nodeId, executionOrder, isParallel, parallelGroupId });
        },
        updateNodeTrace: (nodeId, updates) => {
          updateNodeTraceCalls.push({ nodeId, updates });
        },
        appendNodeTraceToken: () => {},
        finalizeExecutionSession: () => {},
        closeStream: () => {},
        resetTrackingState: () => {},
      },
    );

    expect(didComplete).toBe(false);
    expect(registerCalls).toHaveLength(1);
    expect(registerCalls[0].nodeId).toBe('new-node');
    expect(registerCalls[0].executionOrder).toBe(1);
    expect(registerCalls[0].isParallel).toBe(true);
    expect(registerCalls[0].parallelGroupId).toBeTruthy();
    expect(updateNodeTraceCalls[0]).toEqual({
      nodeId: 'existing',
      updates: {
        isParallel: true,
        parallelGroupId: registerCalls[0].parallelGroupId,
      },
    });
    expect(updateNodeTraceCalls[1].nodeId).toBe('new-node');
    expect(updateNodeTraceCalls[1].updates).toMatchObject({
      status: 'running',
      inputSummary: '',
      rawInputSnapshot: JSON.stringify({
        topic: '工作流',
        section_text: '执行面板重构',
      }),
    });
    expect(nodeDataState['new-node']).toEqual({
      input_snapshot: JSON.stringify({
        topic: '工作流',
        section_text: '执行面板重构',
      }),
    });
  });

  it('applies token, status, node_done and workflow_done events through one execution flow', () => {
    const nodeDataState: Record<string, Record<string, unknown>> = {
      node: { output: '前缀' },
    };
    const selectedNodeIds: string[] = [];
    const traceUpdates: Array<{ nodeId: string; updates: Record<string, unknown> }> = [];
    const traceTokens: string[] = [];
    const terminalStatuses: string[] = [];
    const errors: Array<string | null> = [];
    let now = 130;
    const startTimeMap: Record<string, number> = { node: 100 };
    let closed = 0;
    let reset = 0;

    const deps = {
      getExecutionSession: () => null,
      now: () => now,
      nextTraceOrder: () => 1,
      startTimeMap,
      setStatus: (status: 'completed' | 'error') => {
        terminalStatuses.push(status);
      },
      setError: (error: string | null) => {
        errors.push(error);
      },
      setSelectedNodeId: (nodeId: string) => {
        selectedNodeIds.push(nodeId);
      },
      updateNodeData: (nodeId: string, update: unknown) => {
        const next = typeof update === 'function'
          ? (update as (prev: Record<string, unknown>) => Record<string, unknown>)(nodeDataState[nodeId] ?? {})
          : (update as Record<string, unknown>);
        nodeDataState[nodeId] = { ...(nodeDataState[nodeId] ?? {}), ...next };
      },
      registerNodeTrace: () => {},
      updateNodeTrace: (nodeId: string, updates: Record<string, unknown>) => {
        traceUpdates.push({ nodeId, updates });
      },
      appendNodeTraceToken: (_nodeId: string, token: string) => {
        traceTokens.push(token);
      },
      finalizeExecutionSession: (status: 'completed' | 'error') => {
        terminalStatuses.push(`final:${status}`);
      },
      closeStream: () => {
        closed += 1;
      },
      resetTrackingState: () => {
        reset += 1;
      },
    };

    expect(applyWorkflowExecutionEvent(
      'node_token',
      JSON.stringify({ type: 'node_token', node_id: 'node', token: ' 输出' }),
      deps,
    )).toBe(false);
    expect(nodeDataState.node.output).toBe('前缀 输出');
    expect(traceTokens).toEqual([' 输出']);

    now = 145;
    expect(applyWorkflowExecutionEvent(
      'node_status',
      JSON.stringify({ type: 'node_status', node_id: 'node', status: 'done' }),
      deps,
    )).toBe(false);
    expect(nodeDataState.node.status).toBe('done');
    expect(nodeDataState.node.execution_time_ms).toBe(45);
    expect(startTimeMap.node).toBeUndefined();

    expect(applyWorkflowExecutionEvent(
      'node_done',
      JSON.stringify({ type: 'node_done', node_id: 'node', full_output: '最终输出' }),
      deps,
    )).toBe(false);
    expect(nodeDataState.node.output).toBe('最终输出');

    const completed = applyWorkflowExecutionEvent(
      'workflow_done',
      JSON.stringify({ type: 'workflow_done', status: 'completed' }),
      deps,
    );

    expect(completed).toBe(true);
    expect(selectedNodeIds).toEqual(['node', 'node', 'node']);
    expect(traceUpdates).toEqual([
      {
        nodeId: 'node',
        updates: {
          status: 'done',
          errorMessage: undefined,
          durationMs: 45,
          finishedAt: 145,
        },
      },
      {
        nodeId: 'node',
        updates: {
          status: 'done',
          finalOutput: '最终输出',
        },
      },
    ]);
    expect(terminalStatuses).toEqual(['completed', 'final:completed']);
    expect(errors).toEqual([null]);
    expect(closed).toBe(1);
    expect(reset).toBe(1);
  });
});
