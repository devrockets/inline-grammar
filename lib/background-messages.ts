import type { PresetId } from './presets';
import type { ProviderStatus } from './settings';

export type ContentSettings = {
  enabled: boolean;
  presetId: PresetId;
  providerDataConsent: boolean;
  providerStatus: ProviderStatus;
};

export type ContentSettingsChangedMessage = {
  type: 'inline-grammar/content-settings-changed';
};

export type GetContentSettingsMessage = {
  type: 'inline-grammar/get-content-settings';
};

export type CheckTextMessage = {
  presetId: PresetId;
  requestId: string;
  text: string;
  type: 'inline-grammar/check-text';
};

export type CancelTextCheckMessage = {
  requestId: string;
  type: 'inline-grammar/cancel-text-check';
};

export type TestProviderMessage = {
  apiKey: string;
  model: string;
  type: 'inline-grammar/test-provider';
};

export type BackgroundMessage =
  | CancelTextCheckMessage
  | CheckTextMessage
  | GetContentSettingsMessage
  | TestProviderMessage;

export function isBackgroundMessage(value: unknown): value is BackgroundMessage {
  if (!isRecord(value) || typeof value.type !== 'string') return false;

  if (value.type === 'inline-grammar/get-content-settings') return true;

  if (value.type === 'inline-grammar/cancel-text-check') {
    return typeof value.requestId === 'string';
  }

  if (value.type === 'inline-grammar/check-text') {
    return (
      typeof value.requestId === 'string' &&
      typeof value.text === 'string' &&
      isPresetId(value.presetId)
    );
  }

  if (value.type === 'inline-grammar/test-provider') {
    return typeof value.apiKey === 'string' && typeof value.model === 'string';
  }

  return false;
}

export function isContentSettingsChangedMessage(
  value: unknown,
): value is ContentSettingsChangedMessage {
  return isRecord(value) && value.type === 'inline-grammar/content-settings-changed';
}

function isPresetId(value: unknown): value is PresetId {
  return value === 'clear' || value === 'formal' || value === 'friendly' || value === 'concise';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
