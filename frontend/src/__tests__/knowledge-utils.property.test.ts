import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { formatFileSize, getErrorMessage } from '@/features/knowledge';

describe('knowledge utils', () => {
  it('formatFileSize always returns a non-empty human-readable string', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 20 * 1024 * 1024 }), (bytes) => {
        const result = formatFileSize(bytes);
        expect(result.length).toBeGreaterThan(0);
        expect(typeof result).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  it('getErrorMessage prefers Error.message and falls back safely', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 40 }), fc.string({ minLength: 1, maxLength: 40 }), (message, fallback) => {
        expect(getErrorMessage(new Error(message), fallback)).toBe(message);
        expect(getErrorMessage({ detail: message }, fallback)).toBe(message);
        expect(getErrorMessage(null, fallback)).toBe(fallback);
      }),
      { numRuns: 100 }
    );
  });
});
