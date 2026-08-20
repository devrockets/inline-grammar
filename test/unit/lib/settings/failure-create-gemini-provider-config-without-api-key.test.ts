import { beforeAll, describe, expect, it } from 'vitest';

type Sut = {
  result: ReturnType<typeof import('@/lib/settings').createGeminiProviderConfig>;
};

describe('Given missing Gemini credentials, when createGeminiProviderConfig runs, then it rejects the provider config', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { createGeminiProviderConfig } = await import('@/lib/settings');

    sut = {
      result: createGeminiProviderConfig({
        apiKey: ' ',
      }),
    };
  });

  it('fails to create a provider config', () => {
    expect(sut.result).toBeNull();
  });
});
