import { browser } from 'wxt/browser';
import type { ContentSettings } from './background-messages';
import type { PresetId } from './presets';
import type { ProviderConnectionResult } from './provider-client';
import type { ProviderConfig } from './settings';
import { createFailedTextCheck, type TextCheckResult } from './text-check-result';

let nextRequestId = 1;

export async function getContentSettingsFromBackground(): Promise<ContentSettings> {
  return browser.runtime.sendMessage({
    type: 'inline-grammar/get-content-settings',
  }) as Promise<ContentSettings>;
}

export async function checkTextInBackground(request: {
  presetId: PresetId;
  signal?: AbortSignal;
  text: string;
}): Promise<TextCheckResult> {
  const requestId = `text-check-${Date.now()}-${nextRequestId}`;
  nextRequestId += 1;

  if (request.signal?.aborted) {
    return createFailedTextCheck('Provider check was superseded.');
  }

  const cancelRequest = () => {
    void browser.runtime
      .sendMessage({
        requestId,
        type: 'inline-grammar/cancel-text-check',
      })
      .catch(() => undefined);
  };
  request.signal?.addEventListener('abort', cancelRequest, { once: true });

  try {
    const result = (await browser.runtime.sendMessage({
      presetId: request.presetId,
      requestId,
      text: request.text,
      type: 'inline-grammar/check-text',
    })) as TextCheckResult;

    return request.signal?.aborted
      ? createFailedTextCheck('Provider check was superseded.')
      : result;
  } catch {
    return createFailedTextCheck('Inline Grammar background service is unavailable.');
  } finally {
    request.signal?.removeEventListener('abort', cancelRequest);
  }
}

export async function testProviderInBackground(
  provider: ProviderConfig,
): Promise<ProviderConnectionResult> {
  return browser.runtime.sendMessage({
    apiKey: provider.apiKey,
    model: provider.model,
    type: 'inline-grammar/test-provider',
  }) as Promise<ProviderConnectionResult>;
}
