import { beforeAll, describe, expect, it, vi } from 'vitest';
import { browserMock, resetSettingsStorage, settingsStorage } from './settings-storage.mock';

vi.mock('wxt/browser', () => ({
  browser: browserMock,
}));

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/settings').updateSettings>>;
  storedSettings: unknown;
};

describe('Given configured provider settings, when updateSettings clears the provider, then it marks the provider as not configured', () => {
  let sut: Sut;

  beforeAll(async () => {
    resetSettingsStorage();
    settingsStorage.set('inlineGrammarSettings', {
      enabled: true,
      language: 'en',
      presetId: 'clear',
      provider: {
        apiKey: 'test-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4.1-mini',
        type: 'openai_compatible',
      },
      providerStatus: 'configured',
    });

    const { updateSettings } = await import('@/lib/settings');
    const result = await updateSettings({ provider: null });

    sut = {
      result,
      storedSettings: settingsStorage.get('inlineGrammarSettings'),
    };
  });

  it('successfully returns no provider config', () => {
    expect(sut.result.provider).toBeNull();
  });

  it('successfully returns not configured provider status', () => {
    expect(sut.result.providerStatus).toBe('not_configured');
  });

  it('successfully stores no provider config', () => {
    expect(sut.storedSettings).toMatchObject({ provider: null });
  });
});
