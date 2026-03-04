import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

const NODE_STATUSES = ['pending', 'running', 'done', 'error'] as const;
type NodeStatus = (typeof NODE_STATUSES)[number];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: '待执行', className: 'bg-gray-500/20 text-gray-300' },
  running: { label: '执行中', className: 'bg-blue-500/20 text-blue-300' },
  done: { label: '已完成', className: 'bg-green-500/20 text-green-300' },
  error: { label: '错误', className: 'bg-red-500/20 text-red-300' },
};

function extractDrawerDisplayData(nodeData: { label: string; status: string; output: string }) {
  const badge = STATUS_BADGE[nodeData.status] ?? STATUS_BADGE.pending;
  return {
    label: nodeData.label || '未命名节点',
    statusLabel: badge.label,
    statusClassName: badge.className,
    output: nodeData.output,
    hasOutput: nodeData.output.length > 0,
  };
}

const nodeStatusArb: fc.Arbitrary<NodeStatus> = fc.constantFrom(...NODE_STATUSES);
const nodeLabelArb = fc.string({ minLength: 1, maxLength: 50 }).filter((value) => value.trim().length > 0);
const nodeOutputArb = fc.string({ minLength: 0, maxLength: 300 });

const drawerNodeDataArb = fc.record({
  label: nodeLabelArb,
  status: nodeStatusArb,
  output: nodeOutputArb,
});

describe('integration-fixes: bottom drawer display completeness', () => {
  it('always resolves label, status badge and output', () => {
    fc.assert(
      fc.property(drawerNodeDataArb, (nodeData) => {
        const display = extractDrawerDisplayData(nodeData);

        expect(display.label.length).toBeGreaterThan(0);
        expect(Object.values(STATUS_BADGE).map((item) => item.label)).toContain(display.statusLabel);
        expect(Object.values(STATUS_BADGE).map((item) => item.className)).toContain(display.statusClassName);
        expect(display.output).toBe(nodeData.output);
      }),
      { numRuns: 100 }
    );
  });

  it('uses fallback label for empty label', () => {
    const display = extractDrawerDisplayData({ label: '', status: 'pending', output: 'x' });
    expect(display.label).toBe('未命名节点');
  });

  it('sets hasOutput based on output length', () => {
    fc.assert(
      fc.property(drawerNodeDataArb, (nodeData) => {
        expect(extractDrawerDisplayData(nodeData).hasOutput).toBe(nodeData.output.length > 0);
      }),
      { numRuns: 100 }
    );
  });
});

function countNodesByStatus(nodes: Array<{ data: { status?: string } }>): Record<string, number> {
  return nodes.reduce<Record<string, number>>((counts, node) => {
    const status = node.data?.status ?? 'pending';
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});
}

const nodeWithStatusArb = fc.record({
  data: fc.record({
    status: fc.constantFrom('pending', 'running', 'done', 'error') as fc.Arbitrary<string>,
  }),
});

const nodeListArb = fc.array(nodeWithStatusArb, { minLength: 0, maxLength: 20 });

describe('integration-fixes: right panel status counting', () => {
  it('sum of status counts equals total nodes', () => {
    fc.assert(
      fc.property(nodeListArb, (nodes) => {
        const counts = countNodesByStatus(nodes);
        const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
        expect(total).toBe(nodes.length);
      }),
      { numRuns: 100 }
    );
  });

  it('per-status counts match source list', () => {
    fc.assert(
      fc.property(nodeListArb, (nodes) => {
        const counts = countNodesByStatus(nodes);
        ['pending', 'running', 'done', 'error'].forEach((status) => {
          const actual = nodes.filter((node) => (node.data.status ?? 'pending') === status).length;
          expect(counts[status] ?? 0).toBe(actual);
        });
      }),
      { numRuns: 100 }
    );
  });
});
