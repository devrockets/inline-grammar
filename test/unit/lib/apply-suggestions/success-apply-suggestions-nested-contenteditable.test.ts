import { beforeAll, describe, expect, it } from 'vitest';
import { applySuggestions } from '@/lib/apply-suggestions';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  applyResult: boolean;
  editor: HTMLElement;
};

const agreementSuggestion: TextSuggestion = {
  id: 'test-rich-agreement',
  message: 'Fix agreement.',
  original: 'This are',
  replacement: 'This is',
  range: { start: 0, end: 8 },
};

const theirIsSuggestion: TextSuggestion = {
  id: 'test-rich-there-are',
  message: 'Fix phrasing.',
  original: 'their is',
  replacement: 'there are',
  range: { start: 23, end: 31 },
};

describe('Given a nested contenteditable field with multiple matching suggestions, when applySuggestions runs, then it applies replacements from the end of the text', () => {
  let sut: Sut;

  beforeAll(() => {
    const editor = document.createElement('div');

    editor.setAttribute('contenteditable', 'true');
    editor.innerHTML = '<p>This are a draft where <em>their is</em> a mistake.</p>';

    sut = {
      applyResult: applySuggestions(editor, [agreementSuggestion, theirIsSuggestion]),
      editor,
    };
  });

  it('successfully reports that suggestions were applied', () => {
    expect(sut.applyResult).toBe(true);
  });

  it('successfully applies every replacement', () => {
    expect(sut.editor.textContent).toBe('This is a draft where there are a mistake.');
  });

  it('successfully preserves nested emphasis markup', () => {
    expect(sut.editor.innerHTML).toContain('<em>');
  });
});
