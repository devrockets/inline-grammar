import { beforeAll, describe, expect, it, vi } from 'vitest';
import { browserMock, resetSettingsStorage, settingsStorage } from './settings-storage.mock';

vi.mock('wxt/browser', () => ({
  browser: browserMock,
}));

type Sut = {
  providerDataConsent: boolean;
  providerStatus: string;
};

describe('Given a legacy provider config without recorded consent, when settings load, then Gemini remains configured but data use is not consented', () => {
  let sut: Sut;

  beforeAll(async () => {
    resetSettingsStorage();
    settingsStorage.set('inlineGrammarSettings', {
      enabled: true,
      language: 'en',
      presetId: 'clear',
      provider: {
        apiKey: 'test-key',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-3.6-flash',
        type: 'openai_compatible',
      },
      providerStatus: 'configured',
    });

    const { loadSettings } = await import('@/lib/settings');
    const settings = await loadSettings();

    sut = {
      providerDataConsent: settings.providerDataConsent,
      providerStatus: settings.providerStatus,
    };
  });

  it('keeps the valid provider configured', () => {
    expect(sut.providerStatus).toBe('configured');
  });

  it('requires new affirmative consent', () => {
    expect(sut.providerDataConsent).toBe(false);
  });
});
