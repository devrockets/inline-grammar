import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { CheckingState } from '@/lib/checking-controller';
import type { TextSuggestion } from '@/lib/mock-provider';

const checkTextWithMockProviderMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/mock-provider', () => ({
  checkTextWithMockProvider: checkTextWithMockProviderMock,
}));

type Sut = {
  providerCallCount: number;
  states: CheckingState[];
  suggestions: TextSuggestion[];
};

const suggestion: TextSuggestion = {
  id: 'test-cache',
  message: 'Fix cached text.',
  original: 'lets',
  replacement: "let's",
  range: { start: 0, end: 4 },
};

describe('Given identical text checked twice, when attachCheckingController handles input, then it reuses the session cache', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    checkTextWithMockProviderMock.mockResolvedValue([suggestion]);

    const { attachCheckingController } = await import('@/lib/checking-controller');
    const input = document.createElement('input');
    const states: CheckingState[] = [];
    let suggestions: TextSuggestion[] = [];

    input.value = 'lets write better';
    attachCheckingController(input, {
      debounceMs: 800,
      minimumWords: 3,
      presetId: 'clear',
      setState: (state, nextSuggestions) => {
        states.push(state);
        suggestions = nextSuggestions;
      },
    });
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));

    await vi.advanceTimersByTimeAsync(800);
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(800);

    sut = {
      providerCallCount: checkTextWithMockProviderMock.mock.calls.length,
      states,
      suggestions,
    };
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('calls the provider only once', () => {
    expect(sut.providerCallCount).toBe(1);
  });

  it('sets the final state from cached suggestions', () => {
    expect(sut.states.at(-1)).toBe('has-suggestions');
  });

  it('returns cached suggestions', () => {
    expect(sut.suggestions).toEqual([suggestion]);
  });
});
