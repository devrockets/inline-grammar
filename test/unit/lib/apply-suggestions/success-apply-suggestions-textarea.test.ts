import { beforeAll, describe, expect, it } from 'vitest';
import { applySuggestions } from '@/lib/apply-suggestions';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  applyResult: boolean;
  textarea: HTMLTextAreaElement;
};

const agreementSuggestion: TextSuggestion = {
  id: 'test-agreement',
  message: 'Fix agreement.',
  original: 'This are',
  replacement: 'This is',
  range: { start: 0, end: 8 },
};

const letsSuggestion: TextSuggestion = {
  id: 'test-lets',
  message: 'Use the contraction.',
  original: 'lets',
  replacement: "let's",
  range: { start: 20, end: 24 },
};

describe('Given a textarea field with multiple matching suggestions, when applySuggestions runs, then it applies every replacement', () => {
  let sut: Sut;

  beforeAll(() => {
    const textarea = document.createElement('textarea');
    textarea.value = 'This are rough, but lets fix it.';

    sut = {
      applyResult: applySuggestions(textarea, [agreementSuggestion, letsSuggestion]),
      textarea,
    };
  });

  it('reports that all suggestions were applied', () => {
    expect(sut.applyResult).toBe(true);
  });

  it('updates the textarea value with all replacements', () => {
    expect(sut.textarea.value).toBe("This is rough, but let's fix it.");
  });
});
