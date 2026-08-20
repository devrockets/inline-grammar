import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = {
  body: unknown;
  result: Awaited<ReturnType<typeof import('@/lib/gemini-provider').checkTextWithGeminiProvider>>;
  url: string;
};

describe('Given Gemini returns valid suggestion JSON, when checkTextWithGeminiProvider runs, then it returns normalized suggestions', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { checkTextWithGeminiProvider } = await import('@/lib/gemini-provider');
    const fetchClient = vi.fn(async (url: string, init?: RequestInit) => {
      sut = {
        body: init?.body ? JSON.parse(String(init.body)) : null,
        result: {
          status: 'ok',
          suggestions: [],
        },
        url,
      };

      return {
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      suggestions: [
                        {
                          end: 4,
                          message: 'Use the contraction.',
                          original: 'lets',
                          replacement: "let's",
                          start: 0,
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        ok: true,
        status: 200,
      } as Response;
    });

    const result = await checkTextWithGeminiProvider({
      fetchClient: fetchClient as unknown as typeof fetch,
      presetId: 'clear',
      provider: createProvider(),
      text: 'lets write better',
    });

    sut = {
      ...sut,
      result,
    };
  });

  it('successfully targets the Gemini native generateContent endpoint', () => {
    expect(sut.url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    );
  });

  it('successfully sends native Gemini contents', () => {
    expect((sut.body as { contents: unknown[] }).contents).toHaveLength(1);
  });

  it('successfully requests low thinking for grammar checks', () => {
    expect(
      (sut.body as { generationConfig: { thinkingConfig: { thinkingLevel: string } } })
        .generationConfig.thinkingConfig.thinkingLevel,
    ).toBe('low');
  });

  it('successfully omits deprecated sampling parameters', () => {
    expect(sut.body).not.toHaveProperty('temperature');
  });

  it('successfully returns one normalized suggestion', () => {
    expect(sut.result.status === 'ok' ? sut.result.suggestions : []).toHaveLength(1);
  });

  it('successfully preserves the suggestion replacement', () => {
    expect(sut.result.status === 'ok' ? sut.result.suggestions[0]?.replacement : null).toBe(
      "let's",
    );
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
