import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createBackgroundMessageHandler } from '@/lib/background-handler';
import type { ExtensionSettings } from '@/lib/settings';
import { createFailedTextCheck, type TextCheckResult } from '@/lib/text-check-result';

const settings = {
  enabled: true,
  language: 'en',
  presetId: 'clear',
  provider: null,
  providerDataConsent: false,
  providerStatus: 'not_configured',
} as const satisfies ExtensionSettings;

type Sut = {
  receivedAbortedSignal: boolean;
  result: TextCheckResult;
};

describe('Given an active provider request, when the content script cancels it, then the background aborts the request', () => {
  let sut: Sut;

  beforeAll(async () => {
    let notifyCheckStarted: (() => void) | undefined;
    const checkStarted = new Promise<void>((resolve) => {
      notifyCheckStarted = resolve;
    });
    let receivedSignal: AbortSignal | undefined;
    const handleMessage = createBackgroundMessageHandler({
      checkText: vi.fn((_settings, request) => {
        receivedSignal = request.signal;
        notifyCheckStarted?.();

        return new Promise<TextCheckResult>((resolve) => {
          request.signal.addEventListener(
            'abort',
            () => resolve(createFailedTextCheck('Provider check was superseded.')),
            { once: true },
          );
        });
      }),
      loadSettings: vi.fn().mockResolvedValue(settings),
      testProvider: vi.fn(),
    });
    const resultPromise = handleMessage({
      presetId: 'clear',
      requestId: 'request-1',
      text: 'This sentence needs checking.',
      type: 'inline-grammar/check-text',
    }) as Promise<TextCheckResult>;

    await checkStarted;
    await handleMessage({
      requestId: 'request-1',
      type: 'inline-grammar/cancel-text-check',
    });

    sut = {
      receivedAbortedSignal: receivedSignal?.aborted ?? false,
      result: await resultPromise,
    };
  });

  it('aborts the provider signal', () => {
    expect(sut.receivedAbortedSignal).toBe(true);
  });

  it('finishes the superseded request without suggestions', () => {
    expect(sut.result).toEqual({
      message: 'Provider check was superseded.',
      status: 'failed',
    });
  });
});
