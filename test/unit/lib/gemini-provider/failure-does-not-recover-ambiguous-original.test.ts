import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = Awaited<ReturnType<typeof import('@/lib/gemini-provider').checkTextWithGeminiProvider>>;

describe('Given an incorrect range and repeated original text, when Gemini suggestions are normalized, then the ambiguous replacement is rejected', () => {
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
                      text: JSON.stringify({
                        suggestions: [
                          {
                            start: 2,
                            end: 8,
                            original: 'really',
                            replacement: 'truly',
                            message: 'Ambiguous occurrence.',
                          },
                        ],
                      }),
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
      presetId: 'clear',
      provider: createProvider(),
      text: 'really useful and really clear',
    });
  });

  it('returns no unsafe suggestion', () => {
    expect(sut.status === 'ok' ? sut.suggestions : []).toEqual([]);
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
