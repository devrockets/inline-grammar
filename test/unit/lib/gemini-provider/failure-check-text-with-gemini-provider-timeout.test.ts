import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/gemini-provider').checkTextWithGeminiProvider>>;
};

describe('Given Gemini does not respond before the timeout, when checkTextWithGeminiProvider runs, then it reports a timeout failure', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.useFakeTimers();

    const { checkTextWithGeminiProvider } = await import('@/lib/gemini-provider');
    const fetchClient = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Request timed out.', 'AbortError'));
          });
        }),
    );

    const resultPromise = checkTextWithGeminiProvider({
      fetchClient: fetchClient as unknown as typeof fetch,
      presetId: 'clear',
      provider: createProvider(),
      text: 'lets write better',
    });

    await vi.advanceTimersByTimeAsync(45_000);

    sut = {
      result: await resultPromise,
    };
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('fails with a provider failure status', () => {
    expect(sut.result.status).toBe('failed');
  });

  it('fails with a timeout-specific message', () => {
    expect(sut.result.status === 'failed' ? sut.result.message : '').toBe(
      'Gemini check timed out.',
    );
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
