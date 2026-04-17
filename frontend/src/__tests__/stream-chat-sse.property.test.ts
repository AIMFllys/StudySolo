import { describe, expect, it, vi } from 'vitest';
import { parseSSEStream, type AgentStreamEvent } from '@/features/workflow/hooks/stream-chat-sse';

function sseReader(events: Array<Record<string, unknown> | '[DONE]'>) {
  const encoder = new TextEncoder();
  const body = events
    .map((event) => `data: ${event === '[DONE]' ? event : JSON.stringify(event)}\n\n`)
    .join('');
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  }).getReader();
}

describe('agent stream SSE parser', () => {
  it('builds answer segments incrementally and preserves Chinese text', async () => {
    const snapshots: unknown[] = [];
    const tokens: string[] = [];

    const parsed = await parseSSEStream(sseReader([
      { event: 'segment_start', tag: 'answer' },
      { event: 'segment_delta', tag: 'answer', delta: '工作流 / ' },
      { event: 'segment_delta', tag: 'answer', delta: '节点 / 本轮变更' },
      { event: 'segment_end', tag: 'answer' },
      '[DONE]',
    ]), {
      onToken: (token) => tokens.push(token),
      onSegments: (segments) => snapshots.push(segments),
    });

    expect(tokens.join('')).toBe('工作流 / 节点 / 本轮变更');
    expect(parsed.fullText).toBe('工作流 / 节点 / 本轮变更');
    expect(parsed.segments).toMatchObject([
      { kind: 'answer', text: '工作流 / 节点 / 本轮变更' },
    ]);
    expect(snapshots.length).toBeGreaterThan(0);
  });

  it('updates tool call status from running to ok and error', async () => {
    const parsed = await parseSSEStream(sseReader([
      { event: 'tool_call', call_id: 'call-1', tool: 'list_workflows', params: { limit: 5 } },
      { event: 'tool_result', call_id: 'call-1', ok: true, data: { count: 1 } },
      { event: 'tool_call', call_id: 'call-2', tool: 'rename_workflow', params: { id: 'wf' } },
      { event: 'tool_result', call_id: 'call-2', ok: false, error: '失败' },
      '[DONE]',
    ]), { onToken: vi.fn() });

    expect(parsed.segments).toMatchObject([
      { kind: 'tool_call', id: 'call-1', status: 'ok', result: { count: 1 } },
      { kind: 'tool_call', id: 'call-2', status: 'error', error: '失败' },
    ]);
  });

  it('extracts summary changes and forwards canvas mutation events', async () => {
    const summarySnapshots: unknown[] = [];
    const events: AgentStreamEvent[] = [];

    const parsed = await parseSSEStream(sseReader([
      { event: 'segment_start', tag: 'summary' },
      {
        event: 'segment_delta',
        tag: 'summary',
        delta: '<changes><change>新增节点</change><change>本轮变更已同步</change></changes>',
      },
      { event: 'segment_end', tag: 'summary' },
      { event: 'canvas_mutation', workflow_id: 'wf-1', nodes: [], edges: [] },
      '[DONE]',
    ]), {
      onToken: vi.fn(),
      onSummary: (summary) => summarySnapshots.push(summary),
      onEvent: (event) => events.push(event),
    });

    expect(parsed.summary).toEqual([
      { text: '新增节点' },
      { text: '本轮变更已同步' },
    ]);
    expect(summarySnapshots.at(-1)).toEqual(parsed.summary);
    expect(events.some((event) => event.type === 'canvas_mutation')).toBe(true);
  });
});
