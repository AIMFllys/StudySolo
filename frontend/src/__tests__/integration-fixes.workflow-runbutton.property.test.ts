import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

function simulateStoreInjection(
  _currentState: { nodes: unknown[]; edges: unknown[] },
  newNodes: unknown[],
  newEdges: unknown[]
): { nodes: unknown[]; edges: unknown[] } {
  return {
    nodes: newNodes,
    edges: newEdges,
  };
}

const storeNodeArb = fc.record({
  id: fc.uuid(),
  type: fc.constant('default'),
  position: fc.record({ x: fc.integer({ min: 0, max: 1000 }), y: fc.integer({ min: 0, max: 1000 }) }),
  data: fc.record({
    label: fc.string({ minLength: 1, maxLength: 30 }),
    status: fc.constantFrom('pending', 'running', 'done', 'error'),
    output: fc.string({ minLength: 0, maxLength: 100 }),
  }),
});

const storeEdgeArb = fc.record({
  id: fc.uuid(),
  source: fc.uuid(),
  target: fc.uuid(),
});

const nodesAndEdgesArb = fc.record({
  nodes: fc.array(storeNodeArb, { minLength: 0, maxLength: 10 }),
  edges: fc.array(storeEdgeArb, { minLength: 0, maxLength: 10 }),
});

describe('integration-fixes: workflow generation result store injection', () => {
  it('injects nodes/edges exactly as provided', () => {
    fc.assert(
      fc.property(nodesAndEdgesArb, ({ nodes, edges }) => {
        const nextState = simulateStoreInjection({ nodes: [], edges: [] }, nodes, edges);

        expect(nextState.nodes).toBe(nodes);
        expect(nextState.edges).toBe(edges);
        expect(nextState.nodes).toHaveLength(nodes.length);
        expect(nextState.edges).toHaveLength(edges.length);
      }),
      { numRuns: 100 }
    );
  });

  it('overwrites previous state on repeated injections', () => {
    fc.assert(
      fc.property(nodesAndEdgesArb, nodesAndEdgesArb, (first, second) => {
        const state1 = simulateStoreInjection({ nodes: [], edges: [] }, first.nodes, first.edges);
        const state2 = simulateStoreInjection(state1, second.nodes, second.edges);

        expect(state2.nodes).toBe(second.nodes);
        expect(state2.edges).toBe(second.edges);
      }),
      { numRuns: 100 }
    );
  });

  it('preserves deep equality of node/edge contents', () => {
    fc.assert(
      fc.property(nodesAndEdgesArb, ({ nodes, edges }) => {
        const nextState = simulateStoreInjection({ nodes: [], edges: [] }, nodes, edges);

        nodes.forEach((node, index) => {
          expect(nextState.nodes[index]).toEqual(node);
        });
        edges.forEach((edge, index) => {
          expect(nextState.edges[index]).toEqual(edge);
        });
      }),
      { numRuns: 100 }
    );
  });
});

type TestExecutionStatus = 'idle' | 'running' | 'completed' | 'error';
type ButtonState = 'stop' | 'run_enabled' | 'run_disabled';

function determineButtonState(executionStatus: TestExecutionStatus, nodeCount: number): ButtonState {
  if (executionStatus === 'running') {
    return 'stop';
  }

  if (nodeCount > 0) {
    return 'run_enabled';
  }

  return 'run_disabled';
}

const nodeCountArb = fc.integer({ min: 0, max: 10 });

describe('integration-fixes: run button state mapping', () => {
  it('running always maps to stop', () => {
    fc.assert(
      fc.property(nodeCountArb, (nodeCount) => {
        expect(determineButtonState('running', nodeCount)).toBe('stop');
      }),
      { numRuns: 100 }
    );
  });

  it('non-running with nodes maps to enabled run button', () => {
    const nonRunning = fc.constantFrom('idle', 'completed', 'error') as fc.Arbitrary<TestExecutionStatus>;
    const positiveCount = fc.integer({ min: 1, max: 10 });

    fc.assert(
      fc.property(nonRunning, positiveCount, (status, nodeCount) => {
        expect(determineButtonState(status, nodeCount)).toBe('run_enabled');
      }),
      { numRuns: 100 }
    );
  });

  it('non-running with zero nodes maps to disabled run button', () => {
    const nonRunning = fc.constantFrom('idle', 'completed', 'error') as fc.Arbitrary<TestExecutionStatus>;

    fc.assert(
      fc.property(nonRunning, (status) => {
        expect(determineButtonState(status, 0)).toBe('run_disabled');
      }),
      { numRuns: 100 }
    );
  });
});
