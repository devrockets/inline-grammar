import { beforeAll, describe, expect, it } from 'vitest';
import { createMockSentenceRephraseSuggestion, type TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  suggestion: TextSuggestion | null;
};

describe('Given text with unnecessary wording and the concise preset, when createMockSentenceRephraseSuggestion runs, then it returns a shorter sentence suggestion', () => {
  let sut: Sut;

  beforeAll(() => {
    sut = {
      suggestion: createMockSentenceRephraseSuggestion({
        cursorOffset: 10,
        presetId: 'concise',
        text: 'Inlineai seems to already exists.',
      }),
    };
  });

  it('successfully returns a concise replacement sentence', () => {
    expect(sut.suggestion?.replacement).toBe('Inlineai already exist.');
  });
});
