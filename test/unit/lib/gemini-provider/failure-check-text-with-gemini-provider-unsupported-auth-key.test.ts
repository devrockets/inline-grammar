import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = Awaited<ReturnType<typeof import('@/lib/gemini-provider').checkTextWithGeminiProvider>>;

describe('Given Gemini rejects an auth-key type for generation, when text is checked, then the failure explains that distinction', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { checkTextWithGeminiProvider } = await import('@/lib/gemini-provider');
    const fetchClient = vi.fn(async () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: {
              code: 401,
              details: [
                {
                  '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
                  reason: 'ACCESS_TOKEN_TYPE_UNSUPPORTED',
                },
              ],
              message: 'Request had invalid authentication credentials.',
              status: 'UNAUTHENTICATED',
            },
          }),
          { status: 401 },
        ),
      ),
    );

    sut = await checkTextWithGeminiProvider({
      fetchClient: fetchClient as unknown as typeof fetch,
      presetId: 'clear',
      provider: createProvider(),
      text: 'I has written this sentence.',
    });
  });

  it('reports a provider failure', () => {
    expect(sut.status).toBe('failed');
  });

  it('explains that generation rejected the recognized authentication type', () => {
    expect(sut.status === 'failed' ? sut.message : '').toBe(
      'Gemini recognized the key but rejected its authentication type for text generation.',
    );
  });
});

function createProvider(): ProviderConfig {
  return {
    apiKey: 'AQ.synthetic-auth-key',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-3.6-flash',
    type: 'openai_compatible',
  };
}
