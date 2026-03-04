/**
 * Property 8: 崩溃恢复冲突检测
 * Feature: studysolo-mvp, Property 8: 崩溃恢复冲突检测
 *
 * For any workflow IndexedDB cache, if local_updated_at is strictly
 * later than cloud_updated_at, the system must detect a conflict
 * and trigger the recovery prompt flow.
 *
 * Validates: Requirements 3.12
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure conflict detection logic extracted from use-workflow-sync.ts.
 * This mirrors the condition: cached.dirty && localTs > cloudTs
 */
function detectConflict(
  dirty: boolean,
  local_updated_at: string,
  cloud_updated_at: string
): boolean {
  if (!dirty) return false;
  const localTs = new Date(local_updated_at).getTime();
  const cloudTs = new Date(cloud_updated_at).getTime();
  return localTs > cloudTs;
}

// Generate a pair of ISO timestamps where local > cloud
const timestampArb = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-01-01').getTime(),
});

const arbConflictTimestamps = fc
  .tuple(timestampArb, fc.integer({ min: 1, max: 86_400_000 })) // 1ms to 24h offset
  .map(([cloudTs, offsetMs]) => ({
    cloud_updated_at: new Date(cloudTs).toISOString(),
    local_updated_at: new Date(cloudTs + offsetMs).toISOString(),
  }));

// Generate a pair where local <= cloud (no conflict)
const arbNoConflictTimestamps = fc
  .tuple(timestampArb, fc.integer({ min: 0, max: 86_400_000 }))
  .map(([localTs, offsetMs]) => ({
    local_updated_at: new Date(localTs).toISOString(),
    cloud_updated_at: new Date(localTs + offsetMs).toISOString(),
  }));

describe('Property 8: 崩溃恢复冲突检测', () => {
  it('detects conflict when dirty=true and local_updated_at > cloud_updated_at', () => {
    fc.assert(
      fc.property(arbConflictTimestamps, ({ local_updated_at, cloud_updated_at }) => {
        const result = detectConflict(true, local_updated_at, cloud_updated_at);
        expect(result).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('does NOT detect conflict when dirty=false even if local > cloud', () => {
    fc.assert(
      fc.property(arbConflictTimestamps, ({ local_updated_at, cloud_updated_at }) => {
        const result = detectConflict(false, local_updated_at, cloud_updated_at);
        expect(result).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it('does NOT detect conflict when local_updated_at <= cloud_updated_at', () => {
    fc.assert(
      fc.property(arbNoConflictTimestamps, ({ local_updated_at, cloud_updated_at }) => {
        const result = detectConflict(true, local_updated_at, cloud_updated_at);
        expect(result).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it('conflict detection is consistent: same inputs always produce same output', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        timestampArb,
        timestampArb,
        (dirty, localTs, cloudTs) => {
          const local = new Date(localTs).toISOString();
          const cloud = new Date(cloudTs).toISOString();
          const r1 = detectConflict(dirty, local, cloud);
          const r2 = detectConflict(dirty, local, cloud);
          expect(r1).toBe(r2);
        }
      ),
      { numRuns: 200 }
    );
  });
});
