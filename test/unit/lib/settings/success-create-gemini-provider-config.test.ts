import { beforeAll, describe, expect, it } from 'vitest';

type Sut = {
  result: ReturnType<typeof import('@/lib/settings').createGeminiProviderConfig>;
};

describe('Given Gemini credentials, when createGeminiProviderConfig runs, then it creates the default Gemini provider config', () => {
  let sut: Sut;

  beforeAll(async () => {
    const { createGeminiProviderConfig } = await import('@/lib/settings');

    sut = {
      result: createGeminiProviderConfig({
        apiKey: ' test-key ',
        model: ' gemini-3.6-flash ',
      }),
    };
  });

  it('successfully creates an OpenAI-compatible provider', () => {
    expect(sut.result?.type).toBe('openai_compatible');
  });

  it('successfully uses the Gemini compatibility endpoint', () => {
    expect(sut.result?.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta');
  });

  it('successfully trims the Gemini model', () => {
    expect(sut.result?.model).toBe('gemini-3.6-flash');
  });

  it('successfully trims the Gemini API key', () => {
    expect(sut.result?.apiKey).toBe('test-key');
  });
});
