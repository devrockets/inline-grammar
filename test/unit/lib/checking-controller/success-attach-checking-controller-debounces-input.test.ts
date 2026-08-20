import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { CheckingState } from '@/lib/checking-controller';
import type { TextSuggestion } from '@/lib/mock-provider';

const checkTextWithMockProviderMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/mock-provider', () => ({
  checkTextWithMockProvider: checkTextWithMockProviderMock,
}));

type Sut = {
  providerCallCountBeforeDebounce: number;
  providerCallCountAfterDebounce: number;
  states: CheckingState[];
  suggestions: TextSuggestion[];
};

const suggestion: TextSuggestion = {
  id: 'test-suggestion',
  message: 'Fix this text.',
  original: 'lets',
  replacement: "let's",
  range: { start: 0, end: 4 },
};

describe('Given an eligible field with enough words, when attachCheckingController waits for debounce, then it checks the text', () => {
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

    const providerCallCountBeforeDebounce = checkTextWithMockProviderMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(800);

    sut = {
      providerCallCountAfterDebounce: checkTextWithMockProviderMock.mock.calls.length,
      providerCallCountBeforeDebounce,
      states,
      suggestions,
    };
  });

  afterAll(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('does not call the provider before the debounce delay', () => {
    expect(sut.providerCallCountBeforeDebounce).toBe(0);
  });

  it('calls the provider after the debounce delay', () => {
    expect(sut.providerCallCountAfterDebounce).toBe(1);
  });

  it('sets the final state to has suggestions', () => {
    expect(sut.states.at(-1)).toBe('has-suggestions');
  });

  it('stores the returned suggestions', () => {
    expect(sut.suggestions).toEqual([suggestion]);
  });
});
