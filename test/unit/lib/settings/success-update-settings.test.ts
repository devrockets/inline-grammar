import { beforeAll, describe, expect, it, vi } from 'vitest';
import { browserMock, resetSettingsStorage, settingsStorage } from './settings-storage.mock';

vi.mock('wxt/browser', () => ({
  browser: browserMock,
}));

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/settings').updateSettings>>;
  storedSettings: unknown;
};

describe('Given existing settings, when updateSettings runs, then it merges allowed changes', () => {
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
    const result = await updateSettings({
      enabled: false,
      presetId: 'concise',
    });

    sut = {
      result,
      storedSettings: settingsStorage.get('inlineGrammarSettings'),
    };
  });

  it('returns the merged settings', () => {
    expect(sut.result).toEqual({
      enabled: false,
      language: 'en',
      presetId: 'concise',
      provider: {
        apiKey: 'test-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4.1-mini',
        type: 'openai_compatible',
      },
      providerStatus: 'configured',
    });
  });

  it('stores the merged settings', () => {
    expect(sut.storedSettings).toEqual({
      enabled: false,
      language: 'en',
      presetId: 'concise',
      provider: {
        apiKey: 'test-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4.1-mini',
        type: 'openai_compatible',
      },
      providerStatus: 'configured',
    });
  });
});
