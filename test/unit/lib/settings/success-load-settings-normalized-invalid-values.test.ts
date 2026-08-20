import { beforeAll, describe, expect, it, vi } from 'vitest';
import { browserMock, resetSettingsStorage, settingsStorage } from './settings-storage.mock';

vi.mock('wxt/browser', () => ({
  browser: browserMock,
}));

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/settings').loadSettings>>;
};

describe('Given invalid stored settings, when loadSettings runs, then it normalizes unsafe values', () => {
  let sut: Sut;

  beforeAll(async () => {
    resetSettingsStorage();
    settingsStorage.set('inlineGrammarSettings', {
      enabled: 'yes',
      language: 'pt',
      presetId: 'pirate',
      provider: {
        apiKey: '',
        baseUrl: 'http://insecure.example.test/v1',
        model: '',
        type: 'openai_compatible',
      },
      providerDataConsent: true,
      providerStatus: 'connected',
    });

    const { loadSettings } = await import('@/lib/settings');

    sut = {
      result: await loadSettings(),
    };
  });

  it('falls back to the default enabled value', () => {
    expect(sut.result.enabled).toBe(true);
  });

  it('forces the supported language', () => {
    expect(sut.result.language).toBe('en');
  });

  it('falls back to the default preset', () => {
    expect(sut.result.presetId).toBe('clear');
  });

  it('falls back to the default provider status', () => {
    expect(sut.result.providerStatus).toBe('not_configured');
  });

  it('drops invalid provider config', () => {
    expect(sut.result.provider).toBeNull();
  });

  it('preserves affirmative consent independently of provider validity', () => {
    expect(sut.result.providerDataConsent).toBe(true);
  });
});
