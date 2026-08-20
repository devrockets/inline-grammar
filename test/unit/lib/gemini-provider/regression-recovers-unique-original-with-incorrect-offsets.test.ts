import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = Awaited<ReturnType<typeof import('@/lib/gemini-provider').checkTextWithGeminiProvider>>;

const sourceText =
  'I has been working on this project since yesterday, and its going good. The new feature help users write more clear.';
const firstOriginal = 'I has been working on this project since yesterday';
const secondOriginal = 'its going good';

describe('Given Gemini quotes unique source text but returns incorrect numeric offsets, when suggestions are normalized, then exact source matches recover safe ranges', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { checkTextWithGeminiProvider } = await import('@/lib/gemini-provider');
    const fetchClient = vi.fn(async () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: `\`\`\`json\n${JSON.stringify({
                        suggestions: [
                          {
                            start: 0,
                            end: 44,
                            original: firstOriginal,
                            replacement: "I've worked on this project since yesterday",
                            message: 'Correct agreement and improve concision.',
                          },
                          {
                            start: 50,
                            end: 64,
                            original: secondOriginal,
                            replacement: "it's going well",
                            message: 'Correct the contraction and adverb.',
                          },
                        ],
                      })}\n\`\`\``,
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    sut = await checkTextWithGeminiProvider({
      fetchClient: fetchClient as unknown as typeof fetch,
      presetId: 'concise',
      provider: createProvider(),
      text: sourceText,
    });
  });

  it('keeps both uniquely identifiable suggestions', () => {
    expect(sut.status === 'ok' ? sut.suggestions : []).toHaveLength(2);
  });

  it('recovers the first exact source range', () => {
    const suggestion = sut.status === 'ok' ? sut.suggestions[0] : null;
    const expectedStart = sourceText.indexOf(firstOriginal);

    expect(suggestion?.range).toEqual({
      start: expectedStart,
      end: expectedStart + firstOriginal.length,
    });
  });

  it('recovers the later exact source range', () => {
    const suggestion = sut.status === 'ok' ? sut.suggestions[1] : null;
    const expectedStart = sourceText.indexOf(secondOriginal);

    expect(suggestion?.range).toEqual({
      start: expectedStart,
      end: expectedStart + secondOriginal.length,
    });
  });
});

function createProvider(): ProviderConfig {
  return {
    apiKey: 'test-key',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-3.6-flash',
    type: 'openai_compatible',
  };
}
