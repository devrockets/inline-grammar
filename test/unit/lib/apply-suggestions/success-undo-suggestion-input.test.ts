import { beforeAll, describe, expect, it } from 'vitest';
import { applySuggestion, undoLastSuggestionApplication } from '@/lib/apply-suggestions';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  input: HTMLInputElement;
  undoResult: boolean;
};

const letsSuggestion: TextSuggestion = {
  id: 'test-lets',
  message: 'Use the contraction.',
  original: 'lets',
  replacement: "let's",
  range: { start: 0, end: 4 },
};

describe('Given an edited input field, when undoLastSuggestionApplication runs, then it restores the previous value', () => {
  let sut: Sut;

  beforeAll(() => {
    const input = document.createElement('input');
    input.value = 'lets write better';

    applySuggestion(input, letsSuggestion);

    sut = {
      input,
      undoResult: undoLastSuggestionApplication(input),
    };
  });

  it('reports that undo was applied', () => {
    expect(sut.undoResult).toBe(true);
  });

  it('restores the previous input value', () => {
    expect(sut.input.value).toBe('lets write better');
  });
});
