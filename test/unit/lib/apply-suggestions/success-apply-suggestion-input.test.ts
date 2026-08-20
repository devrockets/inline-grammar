import { beforeAll, describe, expect, it } from 'vitest';
import {
  applySuggestion,
  hasUndoEntry,
  undoLastSuggestionApplication,
} from '@/lib/apply-suggestions';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  applyResult: boolean;
  input: HTMLInputElement;
  otherInput: HTMLInputElement;
  otherUndoResult: boolean;
};

const letsSuggestion: TextSuggestion = {
  id: 'test-lets',
  message: 'Use the contraction.',
  original: 'lets',
  replacement: "let's",
  range: { start: 0, end: 4 },
};

describe('Given an input field with a matching suggestion, when applySuggestion runs, then it applies the replacement', () => {
  let sut: Sut;

  beforeAll(() => {
    const input = document.createElement('input');
    const otherInput = document.createElement('input');

    input.value = 'lets write better';
    otherInput.value = 'unchanged';

    sut = {
      applyResult: applySuggestion(input, letsSuggestion),
      input,
      otherInput,
      otherUndoResult: undoLastSuggestionApplication(otherInput),
    };
  });

  it('reports that the suggestion was applied', () => {
    expect(sut.applyResult).toBe(true);
  });

  it('updates the input value', () => {
    expect(sut.input.value).toBe("let's write better");
  });

  it('stores undo for the edited input', () => {
    expect(hasUndoEntry(sut.input)).toBe(true);
  });

  it('does not store undo for another input', () => {
    expect(hasUndoEntry(sut.otherInput)).toBe(false);
  });

  it('does not undo when another input requests undo', () => {
    expect(sut.otherUndoResult).toBe(false);
  });
});
