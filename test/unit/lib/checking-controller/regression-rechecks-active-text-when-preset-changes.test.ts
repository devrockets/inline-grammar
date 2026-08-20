import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PresetId } from '@/lib/presets';
import { createSuccessfulTextCheck } from '@/lib/text-check-result';

type Sut = {
  firstRequestWasAborted: boolean;
  formalCalls: number;
  formalPresetId: string | undefined;
};

describe('Given a text check is in progress, when the configured preset changes, then the old request is cancelled and the text is checked immediately with the new tone', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.useFakeTimers();
    vi.resetModules();

    const { attachCheckingController } = await import('@/lib/checking-controller');
    const input = document.createElement('input');
    let firstRequestSignal: AbortSignal | undefined;
    let formalPresetId: PresetId | undefined;
    const clearProvider = vi.fn(
      async ({ signal }: { signal?: AbortSignal }) =>
        new Promise<ReturnType<typeof createSuccessfulTextCheck>>(() => {
          firstRequestSignal = signal;
        }),
    );
    const formalProvider = vi.fn(async ({ presetId }: { presetId: PresetId }) => {
      formalPresetId = presetId;
      return createSuccessfulTextCheck([]);
    });
    const commonOptions = {
      debounceMs: 1_500,
      minimumWords: 3,
      setState: vi.fn(),
    };

    input.value = 'This text should be checked again.';
    attachCheckingController(input, {
      ...commonOptions,
      cacheNamespace: 'settings-0',
      checkText: clearProvider,
      presetId: 'clear',
    });
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(1_500);

    attachCheckingController(input, {
      ...commonOptions,
      cacheNamespace: 'settings-1',
      checkText: formalProvider,
      presetId: 'formal',
    });
    await vi.advanceTimersByTimeAsync(0);

    sut = {
      firstRequestWasAborted: firstRequestSignal?.aborted ?? false,
      formalCalls: formalProvider.mock.calls.length,
      formalPresetId,
    };
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('cancels the superseded request', () => {
    expect(sut.firstRequestWasAborted).toBe(true);
  });

  it('starts a replacement request without another input event', () => {
    expect(sut.formalCalls).toBe(1);
  });

  it('uses the newly configured tone', () => {
    expect(sut.formalPresetId).toBe('formal');
  });
});
