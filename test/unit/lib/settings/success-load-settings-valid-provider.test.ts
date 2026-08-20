import { beforeAll, describe, expect, it, vi } from 'vitest';
import { browserMock, resetSettingsStorage, settingsStorage } from './settings-storage.mock';

vi.mock('wxt/browser', () => ({
  browser: browserMock,
}));

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/settings').loadSettings>>;
};

describe('Given valid Gemini provider settings, when loadSettings runs, then it normalizes a configured provider', () => {
  let sut: Sut;

  beforeAll(async () => {
    resetSettingsStorage();
    settingsStorage.set('inlineGrammarSettings', {
      enabled: true,
      language: 'en',
      presetId: 'clear',
      provider: {
        apiKey: ' test-key ',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/',
        model: ' gemini-3.6-flash ',
        type: 'openai_compatible',
      },
      providerStatus: 'not_configured',
    });

    const { loadSettings } = await import('@/lib/settings');

    sut = {
      result: await loadSettings(),
    };
  });

  it('successfully marks the provider as configured', () => {
    expect(sut.result.providerStatus).toBe('configured');
  });

  it('successfully normalizes the provider base URL', () => {
    expect(sut.result.provider?.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta');
  });

  it('successfully trims the provider model', () => {
    expect(sut.result.provider?.model).toBe('gemini-3.6-flash');
  });

  it('successfully trims the provider API key', () => {
    expect(sut.result.provider?.apiKey).toBe('test-key');
  });
});
