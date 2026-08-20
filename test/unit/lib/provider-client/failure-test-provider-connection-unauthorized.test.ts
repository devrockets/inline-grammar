import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/provider-client').testProviderConnection>>;
};

describe('Given Gemini rejects credentials, when testProviderConnection runs, then it reports unauthorized credentials', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { testProviderConnection } = await import('@/lib/provider-client');
    const fetchClient = vi.fn(async () => {
      return {
        ok: false,
        status: 401,
      } as Response;
    });

    sut = {
      result: await testProviderConnection(
        createProvider(),
        fetchClient as unknown as typeof fetch,
      ),
    };
  });

  it('fails with an unauthorized status', () => {
    expect(sut.result.status).toBe('unauthorized');
  });

  it('fails with a safe credential error message', () => {
    expect('message' in sut.result ? sut.result.message : '').toBe('Gemini rejected the API key.');
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
