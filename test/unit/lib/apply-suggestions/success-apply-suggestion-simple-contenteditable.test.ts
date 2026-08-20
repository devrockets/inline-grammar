import { beforeAll, describe, expect, it } from 'vitest';
import {
  applySuggestion,
  canApplySuggestions,
  undoLastSuggestionApplication,
} from '@/lib/apply-suggestions';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  applyResult: boolean;
  canApplyResult: boolean;
  editor: HTMLElement;
  undoResult: boolean;
};

const agreementSuggestion: TextSuggestion = {
  id: 'test-agreement',
  message: 'Fix agreement.',
  original: 'This are',
  replacement: 'This is',
  range: { start: 0, end: 8 },
};

describe('Given a simple contenteditable field with a matching suggestion, when applySuggestion runs, then it applies the replacement', () => {
  let sut: Sut;

  beforeAll(() => {
    const editor = document.createElement('div');

    editor.setAttribute('contenteditable', 'true');
    editor.textContent = 'This are editable.';

    const canApplyResult = canApplySuggestions(editor);
    const applyResult = applySuggestion(editor, agreementSuggestion);
    const appliedText = editor.textContent;
    const undoResult = undoLastSuggestionApplication(editor);

    editor.dataset.appliedText = appliedText ?? '';

    sut = {
      applyResult,
      canApplyResult,
      editor,
      undoResult,
    };
  });

  it('allows applying suggestions', () => {
    expect(sut.canApplyResult).toBe(true);
  });

  it('reports that the suggestion was applied', () => {
    expect(sut.applyResult).toBe(true);
  });

  it('updates the contenteditable text content', () => {
    expect(sut.editor.dataset.appliedText).toBe('This is editable.');
  });

  it('reports that undo was applied', () => {
    expect(sut.undoResult).toBe(true);
  });

  it('restores the previous contenteditable text content', () => {
    expect(sut.editor.textContent).toBe('This are editable.');
  });
});
