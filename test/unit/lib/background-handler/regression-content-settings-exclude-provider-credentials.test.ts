import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createBackgroundMessageHandler } from '@/lib/background-handler';
import type { ExtensionSettings } from '@/lib/settings';
import { createSuccessfulTextCheck } from '@/lib/text-check-result';

const settings = {
  enabled: true,
  language: 'en',
  presetId: 'formal',
  provider: {
    apiKey: 'credential-that-must-stay-in-the-background',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-3.6-flash',
    type: 'openai_compatible',
  },
  providerDataConsent: true,
  providerStatus: 'configured',
} as const satisfies ExtensionSettings;

type Sut = {
  result: unknown;
};

describe('Given stored provider credentials, when the content script requests settings, then the background returns only safe settings', () => {
  let sut: Sut;

  beforeAll(async () => {
    const handleMessage = createBackgroundMessageHandler({
      checkText: vi.fn().mockResolvedValue(createSuccessfulTextCheck([])),
      loadSettings: vi.fn().mockResolvedValue(settings),
      testProvider: vi.fn(),
    });

    sut = {
      result: await handleMessage({ type: 'inline-grammar/get-content-settings' }),
    };
  });

  it('returns the settings needed for page behavior', () => {
    expect(sut.result).toEqual({
      enabled: true,
      presetId: 'formal',
      providerDataConsent: true,
      providerStatus: 'configured',
    });
  });

  it('does not return the provider configuration or API key', () => {
    expect(JSON.stringify(sut.result)).not.toContain(settings.provider.apiKey);
    expect(sut.result).not.toHaveProperty('provider');
  });
});
