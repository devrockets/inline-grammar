import { beforeAll, describe, expect, it, vi } from 'vitest';
import { browserMock, resetSettingsStorage, settingsStorage } from './settings-storage.mock';

vi.mock('wxt/browser', () => ({
  browser: browserMock,
}));

type Sut = {
  storedSettings: unknown;
};

describe('Given valid settings, when saveSettings runs, then it stores normalized settings', () => {
  let sut: Sut;

  beforeAll(async () => {
    resetSettingsStorage();
    const { saveSettings } = await import('@/lib/settings');

    await saveSettings({
      enabled: false,
      language: 'en',
      presetId: 'formal',
      provider: {
        apiKey: 'test-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4.1-mini',
        type: 'openai_compatible',
      },
      providerDataConsent: true,
      providerStatus: 'configured',
    });

    sut = {
      storedSettings: settingsStorage.get('inlineGrammarSettings'),
    };
  });

  it('stores the provided settings', () => {
    expect(sut.storedSettings).toEqual({
      enabled: false,
      language: 'en',
      presetId: 'formal',
      provider: {
        apiKey: 'test-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4.1-mini',
        type: 'openai_compatible',
      },
      providerDataConsent: true,
      providerStatus: 'configured',
    });
  });
});
