import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function validateNoticeContent(title: string, content: string, expiresAt?: string): ValidationResult {
  const errors: Record<string, string> = {};

  if (!title.trim()) {
    errors.title = 'Title is required';
  } else if (title.trim().length > 200) {
    errors.title = 'Title must be <= 200 characters';
  }

  if (!content.trim()) {
    errors.content = 'Content is required';
  } else if (content.trim().length > 10000) {
    errors.content = 'Content must be <= 10,000 characters';
  }

  if (expiresAt) {
    const date = new Date(expiresAt);
    if (isNaN(date.getTime())) {
      errors.expires_at = 'Invalid date';
    } else if (date <= new Date()) {
      errors.expires_at = 'Expiry must be in the future';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function hasPreviewContent(content: string): boolean {
  return content.trim().length > 0;
}

const validTitleArb = fc.string({ minLength: 1, maxLength: 200 }).filter((value) => value.trim().length >= 1);
const validContentArb = fc.string({ minLength: 1, maxLength: 10000 }).filter((value) => value.trim().length >= 1);
const whitespaceArb = fc.stringMatching(/^\s+$/).filter((value) => value.length > 0);
const tooLongContentArb = fc.integer({ min: 1, max: 500 }).map((extra) => 'a'.repeat(10000 + extra));

const markdownContentArb = fc.oneof(
  fc.constant('# Heading\n\nSome **bold** text.'),
  fc.constant('- item 1\n- item 2\n- item 3'),
  fc.constant('```js\nconsole.log("hello")\n```'),
  fc.constant('> blockquote\n\n[link](https://example.com)'),
  fc.constant('| col1 | col2 |\n|------|------|\n| a    | b    |'),
  fc.string({ minLength: 1, maxLength: 500 }).filter((value) => value.trim().length > 0)
);

describe('admin markdown preview: validation properties', () => {
  it('accepts any non-empty content <= 10000 chars with valid title', () => {
    fc.assert(
      fc.property(validTitleArb, validContentArb, (title, content) => {
        const result = validateNoticeContent(title, content);
        expect(result.valid).toBe(true);
        expect(result.errors.content).toBeUndefined();
        expect(result.errors.title).toBeUndefined();
      }),
      { numRuns: 20 }
    );
  });

  it('rejects whitespace content and disables preview', () => {
    fc.assert(
      fc.property(validTitleArb, whitespaceArb, (title, content) => {
        const result = validateNoticeContent(title, content);
        expect(result.valid).toBe(false);
        expect(result.errors.content).toBeDefined();
        expect(hasPreviewContent(content)).toBe(false);
      }),
      { numRuns: 20 }
    );
  });

  it('rejects content longer than 10000 chars', () => {
    fc.assert(
      fc.property(validTitleArb, tooLongContentArb, (title, content) => {
        const result = validateNoticeContent(title, content);
        expect(result.valid).toBe(false);
        expect(result.errors.content).toBeDefined();
      }),
      { numRuns: 20 }
    );
  });

  it('accepts markdown-rich content and keeps preview enabled', () => {
    fc.assert(
      fc.property(validTitleArb, markdownContentArb, (title, content) => {
        const result = validateNoticeContent(title, content);
        if (content.trim().length > 0 && content.trim().length <= 10000) {
          expect(result.errors.content).toBeUndefined();
          expect(hasPreviewContent(content)).toBe(true);
        }
      }),
      { numRuns: 20 }
    );
  });
});
