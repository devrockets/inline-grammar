import { beforeAll, describe, expect, it, vi } from 'vitest';
import { browserMock, resetSettingsStorage } from './settings-storage.mock';

vi.mock('wxt/browser', () => ({
  browser: browserMock,
}));

type Sut = {
  result: Awaited<ReturnType<typeof import('@/lib/settings').loadSettings>>;
};

describe('Given empty local storage, when loadSettings runs, then it returns default settings', () => {
  let sut: Sut;

  beforeAll(async () => {
    resetSettingsStorage();
    const { loadSettings } = await import('@/lib/settings');

    sut = {
      result: await loadSettings(),
    };
  });

  it('enables Inline Grammar by default', () => {
    expect(sut.result.enabled).toBe(true);
  });

  it('uses English as the default language', () => {
    expect(sut.result.language).toBe('en');
  });

  it('uses the clear preset by default', () => {
    expect(sut.result.presetId).toBe('clear');
  });

  it('uses not configured as the default provider status', () => {
    expect(sut.result.providerStatus).toBe('not_configured');
  });

  it('uses no provider config by default', () => {
    expect(sut.result.provider).toBeNull();
  });
});
