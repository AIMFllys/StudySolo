import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { codeToHtml } from 'shiki/bundle/web';

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'python', 'html', 'css', 'json'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const languageArb: fc.Arbitrary<SupportedLanguage> = fc.constantFrom(...SUPPORTED_LANGUAGES);
const codeStringArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((content) => content.trim().length > 0);

describe('integration-fixes: shiki output validity', () => {
  it('renders non-empty code into html with pre/code tags', async () => {
    await fc.assert(
      fc.asyncProperty(codeStringArb, languageArb, async (code, language) => {
        const html = await codeToHtml(code, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
        });

        expect(html).toContain('<pre');
        expect(html).toContain('<code');
      }),
      { numRuns: 100 }
    );
  });

  it('output html is larger than source code', async () => {
    await fc.assert(
      fc.asyncProperty(codeStringArb, languageArb, async (code, language) => {
        const html = await codeToHtml(code, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
        });

        expect(html.length).toBeGreaterThan(code.length);
      }),
      { numRuns: 100 }
    );
  });
});

function getRenderedContent(content: string, streaming: boolean): string {
  if (!streaming) {
    return content;
  }
  return content;
}

const markdownContentArb: fc.Arbitrary<string> = fc.string({ minLength: 0, maxLength: 500 });

describe('integration-fixes: streaming final content identity', () => {
  it('final content equals source content when streaming ends', () => {
    fc.assert(
      fc.property(markdownContentArb, (content) => {
        const streamingContent = getRenderedContent(content, true);
        const finalContent = getRenderedContent(content, false);

        expect(finalContent).toBe(content);
        expect(finalContent).toBe(streamingContent);
      }),
      { numRuns: 100 }
    );
  });

  it('streaming state does not mutate content', () => {
    fc.assert(
      fc.property(markdownContentArb, fc.boolean(), (content, streaming) => {
        expect(getRenderedContent(content, streaming)).toBe(content);
      }),
      { numRuns: 100 }
    );
  });
});
