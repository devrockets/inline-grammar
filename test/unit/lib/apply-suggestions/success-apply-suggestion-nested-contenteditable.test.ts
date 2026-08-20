import { beforeAll, describe, expect, it } from 'vitest';
import {
  applySuggestion,
  canApplySuggestions,
  undoLastSuggestionApplication,
} from '@/lib/apply-suggestions';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  appliedHtml: string;
  applyResult: boolean;
  canApplyResult: boolean;
  editor: HTMLElement;
  undoResult: boolean;
};

const agreementSuggestion: TextSuggestion = {
  id: 'test-rich-agreement',
  message: 'Fix agreement.',
  original: 'This are',
  replacement: 'This is',
  range: { start: 0, end: 8 },
};

describe('Given a nested contenteditable field with a matching suggestion, when applySuggestion runs, then it replaces text without flattening markup', () => {
  let sut: Sut;

  beforeAll(() => {
    const editor = document.createElement('div');

    editor.setAttribute('contenteditable', 'true');
    editor.innerHTML = '<p><strong>This are</strong> rich text.</p>';

    const canApplyResult = canApplySuggestions(editor);
    const applyResult = applySuggestion(editor, agreementSuggestion);
    const appliedHtml = editor.innerHTML;
    const undoResult = undoLastSuggestionApplication(editor);

    sut = {
      appliedHtml,
      applyResult,
      canApplyResult,
      editor,
      undoResult,
    };
  });

  it('successfully allows applying suggestions', () => {
    expect(sut.canApplyResult).toBe(true);
  });

  it('successfully reports that the suggestion was applied', () => {
    expect(sut.applyResult).toBe(true);
  });

  it('successfully updates the rich editor text content', () => {
    expect(sut.appliedHtml).toContain('This is');
  });

  it('successfully preserves surrounding markup', () => {
    expect(sut.appliedHtml).toContain('<strong>');
  });

  it('successfully reports that undo was applied', () => {
    expect(sut.undoResult).toBe(true);
  });

  it('successfully restores the previous rich editor markup', () => {
    expect(sut.editor.innerHTML).toBe('<p><strong>This are</strong> rich text.</p>');
  });
});
