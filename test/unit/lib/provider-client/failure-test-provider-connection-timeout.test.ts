import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/provider-client').testProviderConnection>>;
};

describe('Given Gemini does not respond before the timeout, when testProviderConnection runs, then it reports a timeout', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.useFakeTimers();

    const { testProviderConnection } = await import('@/lib/provider-client');
    const fetchClient = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Request timed out.', 'AbortError'));
          });
        }),
    );

    const resultPromise = testProviderConnection(
      createProvider(),
      fetchClient as unknown as typeof fetch,
    );

    await vi.advanceTimersByTimeAsync(15_000);

    sut = {
      result: await resultPromise,
    };
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('fails with a timeout status', () => {
    expect(sut.result.status).toBe('timeout');
  });

  it('fails with a safe timeout error message', () => {
    expect('message' in sut.result ? sut.result.message : '').toBe(
      'Gemini connection timed out after 15 seconds.',
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
