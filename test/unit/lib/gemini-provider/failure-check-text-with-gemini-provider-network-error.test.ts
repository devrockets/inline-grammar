import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/gemini-provider').checkTextWithGeminiProvider>>;
};

describe('Given Gemini cannot be reached, when checkTextWithGeminiProvider runs, then it reports a provider failure', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { checkTextWithGeminiProvider } = await import('@/lib/gemini-provider');
    const fetchClient = vi.fn(async () => {
      throw new Error('offline');
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

  it('fails with a provider failure status', () => {
    expect(sut.result.status).toBe('failed');
  });

  it('fails with a safe provider failure message', () => {
    expect(sut.result.status === 'failed' ? sut.result.message : '').toBe(
      'Gemini check could not be completed.',
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
