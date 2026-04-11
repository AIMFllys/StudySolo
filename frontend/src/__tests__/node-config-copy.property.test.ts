import { describe, expect, it } from 'vitest';
import { resolveNodeConfigCopy } from '@/features/workflow/components/node-config/resolve-node-config-copy';

describe('node config copy resolver', () => {
  it('keeps the node label as the highest-priority title', () => {
    const copy = resolveNodeConfigCopy({
      nodeLabel: '我的自定义标题',
      nodeType: 'summary',
      manifestItem: {
        display_name: 'Manifest 标题',
        description: 'Manifest 描述',
      },
    });

    expect(copy.title).toBe('我的自定义标题');
    expect(copy.description).toBe('Manifest 描述');
  });

  it('uses manifest display_name when the node label is missing', () => {
    const copy = resolveNodeConfigCopy({
      nodeLabel: undefined,
      nodeType: 'summary',
      manifestItem: {
        display_name: 'Manifest 标题',
        description: 'Manifest 描述',
      },
    });

    expect(copy.title).toBe('Manifest 标题');
  });

  it('falls back to workflow meta when manifest title is blank', () => {
    const copy = resolveNodeConfigCopy({
      nodeLabel: '   ',
      nodeType: 'summary',
      manifestItem: {
        display_name: '   ',
        description: 'Manifest 描述',
      },
    });

    expect(copy.title).toBe('总结归纳');
  });

  it('prefers manifest description over workflow meta', () => {
    const copy = resolveNodeConfigCopy({
      nodeType: 'summary',
      manifestItem: {
        display_name: 'Manifest 标题',
        description: '更具体的 Manifest 描述',
      },
    });

    expect(copy.description).toBe('更具体的 Manifest 描述');
  });

  it('falls back to workflow meta description when manifest description is blank', () => {
    const copy = resolveNodeConfigCopy({
      nodeType: 'summary',
      manifestItem: {
        display_name: 'Manifest 标题',
        description: '   ',
      },
    });

    expect(copy.description).toBe('整理重点、结论与复习摘要');
  });
});
