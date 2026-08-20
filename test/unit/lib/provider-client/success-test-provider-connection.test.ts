import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = {
  method: string | undefined;
  result: Awaited<ReturnType<typeof import('@/lib/provider-client').testProviderConnection>>;
  url: string;
};

describe('Given a valid Gemini response, when testProviderConnection runs, then it reports a connected provider', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { testProviderConnection } = await import('@/lib/provider-client');
    const provider = createProvider();
    const fetchClient = vi.fn(async (_url: string, init?: RequestInit) => {
      sut = {
        method: init?.method,
        result: { status: 'network_error', message: 'pending' },
        url: _url,
      };

      return {
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'OK' }] } }],
        }),
        ok: true,
        status: 200,
      } as Response;
    });

    const result = await testProviderConnection(provider, fetchClient as unknown as typeof fetch);

    sut = {
      ...sut,
      result,
    };
  });

  it('successfully reports a connected provider', () => {
    expect(sut.result.status).toBe('connected');
  });

  it('successfully targets the Gemini native model endpoint', () => {
    expect(sut.url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash',
    );
  });

  it('successfully sends the selected Gemini model', () => {
    expect(sut.url).toContain('gemini-3.6-flash');
  });

  it('successfully uses a metadata request without generation', () => {
    expect(sut.method).toBe('GET');
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
