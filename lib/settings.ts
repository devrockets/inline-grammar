import { browser } from 'wxt/browser';
import { defaultPresetId, isPresetId, type PresetId } from './presets';

const settingsStorageKey = 'inlineGrammarSettings';

export type ProviderStatus = 'not_configured' | 'configured';

export type ProviderType = 'openai_compatible';

export const geminiProviderDefaults = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-3.6-flash',
  type: 'openai_compatible',
} as const satisfies Pick<ProviderConfig, 'baseUrl' | 'model' | 'type'>;

export type ProviderConfig = {
  type: ProviderType;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export type ExtensionSettings = {
  enabled: boolean;
  language: 'en';
  presetId: PresetId;
  provider: ProviderConfig | null;
  providerDataConsent: boolean;
  providerStatus: ProviderStatus;
};

export const defaultSettings = {
  enabled: true,
  language: 'en',
  presetId: defaultPresetId,
  provider: null,
  providerDataConsent: false,
  providerStatus: 'not_configured',
} as const satisfies ExtensionSettings;

type StoredSettings = Partial<ExtensionSettings>;

export async function loadSettings(): Promise<ExtensionSettings> {
  const stored = await browser.storage.local.get(settingsStorageKey);
  return normalizeSettings(stored[settingsStorageKey]);
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await browser.storage.local.set({
    [settingsStorageKey]: normalizeSettings(settings),
  });
}

export async function updateSettings(
  changes: Partial<
    Pick<ExtensionSettings, 'enabled' | 'presetId' | 'provider' | 'providerDataConsent'>
  >,
): Promise<ExtensionSettings> {
  const currentSettings = await loadSettings();
  const nextSettings = normalizeSettings({
    ...currentSettings,
    ...changes,
  });

  await saveSettings(nextSettings);
  return nextSettings;
}

export function createGeminiProviderConfig(values: {
  apiKey: string;
  model?: string;
}): ProviderConfig | null {
  const apiKey = normalizeRequiredString(values.apiKey);
  const model = normalizeRequiredString(values.model ?? geminiProviderDefaults.model);

  if (!apiKey || !model) return null;

  return {
    apiKey,
    baseUrl: geminiProviderDefaults.baseUrl,
    model,
    type: geminiProviderDefaults.type,
  };
}

function normalizeSettings(value: unknown): ExtensionSettings {
  if (!isRecord(value)) return { ...defaultSettings };

  const stored = value as StoredSettings;
  const provider = normalizeProviderConfig(stored.provider);

  return {
    enabled: typeof stored.enabled === 'boolean' ? stored.enabled : defaultSettings.enabled,
    language: 'en',
    presetId: isPresetId(stored.presetId) ? stored.presetId : defaultSettings.presetId,
    provider,
    providerDataConsent: stored.providerDataConsent === true,
    providerStatus: getProviderStatus(provider),
  };
}

function normalizeProviderConfig(value: unknown): ProviderConfig | null {
  if (!isRecord(value)) return null;

  const type = value.type === 'openai_compatible' ? value.type : null;
  const baseUrl = normalizeUrl(value.baseUrl);
  const model = normalizeRequiredString(value.model);
  const apiKey = normalizeRequiredString(value.apiKey);

  if (!type || !baseUrl || !model || !apiKey) return null;

  return {
    apiKey,
    baseUrl,
    model,
    type,
  };
}

function getProviderStatus(provider: ProviderConfig | null): ProviderStatus {
  return provider ? 'configured' : 'not_configured';
}

function normalizeRequiredString(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeUrl(value: unknown): string | null {
  const url = normalizeRequiredString(value);

  if (!url) return null;

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'https:') return null;

    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
