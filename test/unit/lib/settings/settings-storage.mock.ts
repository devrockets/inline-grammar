import { vi } from 'vitest';

export const settingsStorage = new Map<string, unknown>();

export const browserMock = {
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({
        [key]: settingsStorage.get(key),
      })),
      set: vi.fn(async (items: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(items)) {
          settingsStorage.set(key, value);
        }
      }),
    },
  },
};

export function resetSettingsStorage(): void {
  settingsStorage.clear();
  browserMock.storage.local.get.mockClear();
  browserMock.storage.local.set.mockClear();
}
