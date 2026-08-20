import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

type Sut = {
  providerCallCount: number;
};

describe('Given a prefilled eligible field, when the user has not changed it, then attachCheckingController does not call the provider', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.useFakeTimers();

    const { attachCheckingController } = await import('@/lib/checking-controller');
    const input = document.createElement('input');
    const checkText = vi.fn();

    input.value = 'prefilled text should not be checked';
    attachCheckingController(input, {
      checkText,
      debounceMs: 1_500,
      minimumWords: 3,
      presetId: 'clear',
      setState: vi.fn(),
    });

    await vi.advanceTimersByTimeAsync(1_500);

    sut = {
      providerCallCount: checkText.mock.calls.length,
    };
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('does not call the provider', () => {
    expect(sut.providerCallCount).toBe(0);
  });
});
