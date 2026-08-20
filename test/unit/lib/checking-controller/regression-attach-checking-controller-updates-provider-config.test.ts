import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createSuccessfulTextCheck } from '@/lib/text-check-result';

type Sut = {
  firstProviderCalls: number;
  secondProviderCalls: number;
};

describe('Given a field controller already exists, when its provider configuration is updated, then the next input uses the new provider', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.useFakeTimers();
    vi.resetModules();

    const { attachCheckingController } = await import('@/lib/checking-controller');
    const input = document.createElement('input');
    const firstProvider = vi.fn(async () => createSuccessfulTextCheck([]));
    const secondProvider = vi.fn(async () => createSuccessfulTextCheck([]));
    const commonOptions = {
      debounceMs: 1_500,
      minimumWords: 3,
      presetId: 'clear' as const,
      setState: vi.fn(),
    };

    input.value = 'I has written this.';
    attachCheckingController(input, {
      ...commonOptions,
      cacheNamespace: 'settings-0',
      checkText: firstProvider,
    });
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(1_500);

    attachCheckingController(input, {
      ...commonOptions,
      cacheNamespace: 'settings-1',
      checkText: secondProvider,
    });
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(1_500);

    sut = {
      firstProviderCalls: firstProvider.mock.calls.length,
      secondProviderCalls: secondProvider.mock.calls.length,
    };
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('does not call the old provider again', () => {
    expect(sut.firstProviderCalls).toBe(1);
  });

  it('uses the updated provider even when the text is unchanged', () => {
    expect(sut.secondProviderCalls).toBe(1);
  });
});
