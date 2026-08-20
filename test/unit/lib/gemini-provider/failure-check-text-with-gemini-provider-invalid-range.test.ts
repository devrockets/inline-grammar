import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/gemini-provider').checkTextWithGeminiProvider>>;
};

describe('Given Gemini returns a suggestion range that does not match the source text, when checkTextWithGeminiProvider runs, then it drops the unsafe suggestion', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { checkTextWithGeminiProvider } = await import('@/lib/gemini-provider');
    const fetchClient = vi.fn(async () => {
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
                          end: 10,
                          message: 'Unsafe range.',
                          original: 'missing',
                          replacement: 'replacement',
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

    sut = {
      result: await checkTextWithGeminiProvider({
        fetchClient: fetchClient as unknown as typeof fetch,
        presetId: 'clear',
        provider: createProvider(),
        text: 'lets write better',
      }),
    };
  });

  it('fails safely by returning no suggestions', () => {
    expect(sut.result.status === 'ok' ? sut.result.suggestions : []).toEqual([]);
  });
});

function createProvider(): ProviderConfig {
  return {
    apiKey: 'test-key',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-3.6-flash',
    type: 'openai_compatible',
  };
}
