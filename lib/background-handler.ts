import type { BackgroundMessage, ContentSettings } from './background-messages';
import { isBackgroundMessage } from './background-messages';
import { type ProviderConnectionResult, testProviderConnection } from './provider-client';
import { createGeminiProviderConfig, type ExtensionSettings, loadSettings } from './settings';
import type { TextCheckResult } from './text-check-result';
import { createTextChecker } from './text-checker';

type BackgroundHandlerDependencies = {
  checkText: (
    settings: ExtensionSettings,
    request: { presetId: BackgroundMessagePresetId; signal: AbortSignal; text: string },
  ) => Promise<TextCheckResult>;
  loadSettings: () => Promise<ExtensionSettings>;
  testProvider: (values: { apiKey: string; model: string }) => Promise<ProviderConnectionResult>;
};

type BackgroundMessagePresetId = Extract<
  BackgroundMessage,
  { type: 'inline-grammar/check-text' }
>['presetId'];

export function createBackgroundMessageHandler(
  dependencies: BackgroundHandlerDependencies = defaultDependencies,
) {
  const activeChecks = new Map<string, AbortController>();

  return async function handleBackgroundMessage(message: unknown): Promise<unknown> {
    if (!isBackgroundMessage(message)) return undefined;

    if (message.type === 'inline-grammar/get-content-settings') {
      return toContentSettings(await dependencies.loadSettings());
    }

    if (message.type === 'inline-grammar/cancel-text-check') {
      activeChecks.get(message.requestId)?.abort();
      return undefined;
    }

    if (message.type === 'inline-grammar/test-provider') {
      return dependencies.testProvider({ apiKey: message.apiKey, model: message.model });
    }

    const abortController = new AbortController();
    activeChecks.set(message.requestId, abortController);

    try {
      const settings = await dependencies.loadSettings();
      return await dependencies.checkText(settings, {
        presetId: message.presetId,
        signal: abortController.signal,
        text: message.text,
      });
    } finally {
      if (activeChecks.get(message.requestId) === abortController) {
        activeChecks.delete(message.requestId);
      }
    }
  };
}

const defaultDependencies: BackgroundHandlerDependencies = {
  checkText: (settings, request) =>
    createTextChecker(settings.provider, settings.providerDataConsent)(request),
  loadSettings,
  testProvider: async ({ apiKey, model }) => {
    const provider = createGeminiProviderConfig({ apiKey, model });

    if (!provider) {
      return {
        message: 'The provider requires a model and API key before testing.',
        status: 'invalid_request',
      };
    }

    return testProviderConnection(provider);
  },
};

function toContentSettings(settings: ExtensionSettings): ContentSettings {
  return {
    enabled: settings.enabled,
    presetId: settings.presetId,
    providerDataConsent: settings.providerDataConsent,
    providerStatus: settings.providerStatus,
  };
}
