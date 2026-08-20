import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { CheckingState } from '@/lib/checking-controller';

const checkTextWithMockProviderMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/mock-provider', () => ({
  checkTextWithMockProvider: checkTextWithMockProviderMock,
}));

type Sut = {
  providerCallCount: number;
  states: CheckingState[];
};

describe('Given an eligible field with fewer than the minimum words, when attachCheckingController runs, then it skips provider checks', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    checkTextWithMockProviderMock.mockResolvedValue([]);

    const { attachCheckingController } = await import('@/lib/checking-controller');
    const input = document.createElement('input');
    const states: CheckingState[] = [];

    input.value = 'too short';
    attachCheckingController(input, {
      debounceMs: 800,
      minimumWords: 3,
      presetId: 'clear',
      setState: (state) => {
        states.push(state);
      },
    });
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));

    await vi.advanceTimersByTimeAsync(800);

    sut = {
      providerCallCount: checkTextWithMockProviderMock.mock.calls.length,
      states,
    };
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('does not call the provider', () => {
    expect(sut.providerCallCount).toBe(0);
  });

  it('sets the final state to too short', () => {
    expect(sut.states.at(-1)).toBe('too-short');
  });
});
