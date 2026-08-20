import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { CheckingState } from '@/lib/checking-controller';

type Sut = {
  finalMessage: string | undefined;
  finalState: CheckingState | undefined;
};

describe('Given the provider check fails, when attachCheckingController finishes checking, then it reports a provider error state', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.useFakeTimers();

    const { attachCheckingController } = await import('@/lib/checking-controller');
    const input = document.createElement('input');
    const messages: Array<string | undefined> = [];
    const states: CheckingState[] = [];

    input.value = 'lets write better';
    attachCheckingController(input, {
      checkText: async () => ({
        message: 'Gemini check timed out.',
        status: 'failed',
      }),
      debounceMs: 800,
      minimumWords: 3,
      presetId: 'clear',
      setState: (state, _suggestions, message) => {
        states.push(state);
        messages.push(message);
      },
    });
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));

    await vi.advanceTimersByTimeAsync(800);

    sut = {
      finalMessage: messages.at(-1),
      finalState: states.at(-1),
    };
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('sets the final state to provider error', () => {
    expect(sut.finalState).toBe('provider-error');
  });

  it('passes the provider failure message to the state callback', () => {
    expect(sut.finalMessage).toBe('Gemini check timed out.');
  });
});
