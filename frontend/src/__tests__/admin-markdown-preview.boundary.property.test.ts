import { describe, expect, it } from 'vitest';

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function validateNoticeContent(title: string, content: string): ValidationResult {
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

  return { valid: Object.keys(errors).length === 0, errors };
}

describe('admin markdown preview: boundary checks', () => {
  it('title exactly 200 chars is valid', () => {
    const title = 'a'.repeat(200);
    const result = validateNoticeContent(title, 'Some content');
    expect(result.errors.title).toBeUndefined();
  });

  it('title 201 chars is invalid', () => {
    const title = 'a'.repeat(201);
    const result = validateNoticeContent(title, 'Some content');
    expect(result.errors.title).toBeDefined();
  });

  it('content exactly 10000 chars is valid', () => {
    const content = 'a'.repeat(10000);
    const result = validateNoticeContent('Title', content);
    expect(result.errors.content).toBeUndefined();
  });

  it('content 10001 chars is invalid', () => {
    const content = 'a'.repeat(10001);
    const result = validateNoticeContent('Title', content);
    expect(result.errors.content).toBeDefined();
  });
});
