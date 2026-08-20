import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/provider-client').testProviderConnection>>;
};

describe('Given Gemini cannot be reached, when testProviderConnection runs, then it reports a network error', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { testProviderConnection } = await import('@/lib/provider-client');
    const fetchClient = vi.fn(async () => {
      throw new Error('offline');
    });

    sut = {
      result: await testProviderConnection(
        createProvider(),
        fetchClient as unknown as typeof fetch,
      ),
    };
  });

  it('fails with a network error status', () => {
    expect(sut.result.status).toBe('network_error');
  });

  it('fails with a safe network error message', () => {
    expect('message' in sut.result ? sut.result.message : '').toBe(
      'Gemini could not be reached. Check your network and browser permissions.',
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
