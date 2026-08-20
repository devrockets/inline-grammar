import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/provider-client').testProviderConnection>>;
};

describe('Given Gemini returns HTTP success with an unexpected body, when testProviderConnection runs, then it reports a connected provider', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { testProviderConnection } = await import('@/lib/provider-client');
    const fetchClient = vi.fn(async () => {
      return {
        json: async () => ({
          candidates: [],
        }),
        ok: true,
        status: 200,
      } as Response;
    });

    sut = {
      result: await testProviderConnection(
        createProvider(),
        fetchClient as unknown as typeof fetch,
      ),
    };
  });

  it('successfully reports a connected provider', () => {
    expect(sut.result.status).toBe('connected');
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
