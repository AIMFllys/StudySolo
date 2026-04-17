import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkflowStore } from '@/stores/workflow/use-workflow-store';
import { executeCanvasActions } from '@/features/workflow/hooks/use-action-executor';

const ZH_WORKFLOW = '\u6d4b\u8bd5\u5de5\u4f5c\u6d41';
const ZH_AGENT = '\u4ee3\u7801\u5ba1\u67e5 Agent';
const ZH_INPUT = '\u4e2d\u6587\u8f93\u5165';
const ZH_MATERIAL = '\u4e2d\u6587\u6750\u6599';
const ZH_SUMMARY = '\u4e2d\u6587\u603b\u7ed3';

describe('action executor', () => {
  beforeEach(() => {
    useWorkflowStore.setState({
      nodes: [],
      edges: [],
      currentWorkflowId: 'wf-1',
      currentWorkflowName: ZH_WORKFLOW,
      isDirty: false,
    });
  });

  it('adds Agent nodes as regular canvas nodes when the type is registered', async () => {
    const result = await executeCanvasActions([
      {
        operation: 'ADD_NODE',
        payload: {
          type: 'agent_code_review',
          label: ZH_AGENT,
          position: { x: 120, y: 120 },
        },
      },
    ]);

    expect(result).toEqual({ success: true, appliedCount: 1 });
    const state = useWorkflowStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0]?.type).toBe('agent_code_review');
    const data = state.nodes[0]?.data as {
      label?: string;
      type?: string;
      model_route?: string;
      status?: string;
      output?: string;
      config?: Record<string, unknown>;
    };
    expect(data.label).toBe(ZH_AGENT);
    expect(data.type).toBe('agent_code_review');
    expect(data.model_route).toBe('');
    expect(data.status).toBe('pending');
    expect(data.output).toBe('');
    expect(data.config).toEqual({});
  });

  it('adds complete sequential edges with handles', async () => {
    useWorkflowStore.setState({
      nodes: [
        {
          id: 'source',
          type: 'trigger_input',
          position: { x: 120, y: 120 },
          data: {
            label: ZH_INPUT,
            type: 'trigger_input',
            system_prompt: '',
            model_route: '',
            status: 'pending',
            output: '',
            config: {},
            user_content: ZH_MATERIAL,
          },
        },
        {
          id: 'target',
          type: 'summary',
          position: { x: 460, y: 120 },
          data: {
            label: ZH_SUMMARY,
            type: 'summary',
            system_prompt: '',
            model_route: '',
            status: 'pending',
            output: '',
            config: {},
          },
        },
      ],
      edges: [],
      currentWorkflowId: 'wf-1',
      currentWorkflowName: ZH_WORKFLOW,
      isDirty: false,
    });

    const result = await executeCanvasActions([
      {
        operation: 'ADD_EDGE',
        payload: { source_id: 'source', target_id: 'target' },
      },
    ]);

    expect(result).toEqual({ success: true, appliedCount: 1 });
    const edge = useWorkflowStore.getState().edges[0];
    expect(edge).toMatchObject({
      source: 'source',
      target: 'target',
      sourceHandle: 'source-right',
      targetHandle: 'target-left',
      type: 'sequential',
      animated: false,
      data: {},
    });
  });
});
