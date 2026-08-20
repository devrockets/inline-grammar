import { beforeAll, describe, expect, it } from 'vitest';

type Sut = {
  result: ReturnType<typeof import('@/lib/settings').createGeminiProviderConfig>;
};

describe('Given a Gemini auth-key formatted credential, when createGeminiProviderConfig runs, then it accepts the credential without changing layout-sensitive characters', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { createGeminiProviderConfig } = await import('@/lib/settings');

    sut = {
      result: createGeminiProviderConfig({
        apiKey: 'AQ.example-token-with-dots-and-dashes',
      }),
    };
  });

  it('successfully creates the provider config', () => {
    expect(sut.result).not.toBeNull();
  });

  it('successfully preserves the auth key string', () => {
    expect(sut.result?.apiKey).toBe('AQ.example-token-with-dots-and-dashes');
  });
});
