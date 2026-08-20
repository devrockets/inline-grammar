import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { CheckingState } from '@/lib/checking-controller';
import type { TextSuggestion } from '@/lib/mock-provider';

const checkTextWithMockProviderMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/mock-provider', () => ({
  checkTextWithMockProvider: checkTextWithMockProviderMock,
}));

type DeferredSuggestions = {
  promise: Promise<TextSuggestion[]>;
  resolve: (suggestions: TextSuggestion[]) => void;
};

type Sut = {
  providerCallCount: number;
  states: CheckingState[];
  suggestions: TextSuggestion[];
};

const firstSuggestion: TextSuggestion = {
  id: 'stale-suggestion',
  message: 'Stale result.',
  original: 'first',
  replacement: 'stale',
  range: { start: 0, end: 5 },
};

const secondSuggestion: TextSuggestion = {
  id: 'fresh-suggestion',
  message: 'Fresh result.',
  original: 'second',
  replacement: 'fresh',
  range: { start: 0, end: 6 },
};

describe('Given a slower previous check and a faster newer check, when both resolve, then attachCheckingController ignores the stale result', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.useFakeTimers();
    vi.resetModules();

    const firstDeferred = createDeferredSuggestions();
    const secondDeferred = createDeferredSuggestions();

    checkTextWithMockProviderMock
      .mockReturnValueOnce(firstDeferred.promise)
      .mockReturnValueOnce(secondDeferred.promise);

    const { attachCheckingController } = await import('@/lib/checking-controller');
    const input = document.createElement('input');
    const states: CheckingState[] = [];
    let suggestions: TextSuggestion[] = [];

    input.value = 'first text here';
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
    input.value = 'second text here';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(800);

    secondDeferred.resolve([secondSuggestion]);
    await Promise.resolve();
    firstDeferred.resolve([firstSuggestion]);
    await Promise.resolve();

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

  it('calls the provider for both checks', () => {
    expect(sut.providerCallCount).toBe(2);
  });

  it('keeps the final state as has suggestions', () => {
    expect(sut.states.at(-1)).toBe('has-suggestions');
  });

  it('keeps suggestions from the newer check', () => {
    expect(sut.suggestions).toEqual([secondSuggestion]);
  });
});

function createDeferredSuggestions(): DeferredSuggestions {
  let resolvePromise: DeferredSuggestions['resolve'] | undefined;
  const promise = new Promise<TextSuggestion[]>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: (suggestions) => resolvePromise?.(suggestions),
  };
}
