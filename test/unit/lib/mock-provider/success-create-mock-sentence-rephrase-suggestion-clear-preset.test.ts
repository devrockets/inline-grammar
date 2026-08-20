import { beforeAll, describe, expect, it } from 'vitest';
import { createMockSentenceRephraseSuggestion, type TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  suggestion: TextSuggestion | null;
};

describe('Given text with grammar issues and the clear preset, when createMockSentenceRephraseSuggestion runs, then it returns a corrected sentence suggestion', () => {
  let sut: Sut;

  beforeAll(() => {
    sut = {
      suggestion: createMockSentenceRephraseSuggestion({
        cursorOffset: 10,
        presetId: 'clear',
        text: 'This are a draft post with their is a grammar issue.',
      }),
    };
  });

  it('successfully returns the original sentence', () => {
    expect(sut.suggestion?.original).toBe('This are a draft post with their is a grammar issue.');
  });

  it('successfully returns a corrected replacement sentence', () => {
    expect(sut.suggestion?.replacement).toBe(
      'This is a draft post with there are a grammar issue.',
    );
  });

  it('successfully returns the sentence range start', () => {
    expect(sut.suggestion?.range.start).toBe(0);
  });

  it('successfully returns the sentence range end', () => {
    expect(sut.suggestion?.range.end).toBe(52);
  });
});
