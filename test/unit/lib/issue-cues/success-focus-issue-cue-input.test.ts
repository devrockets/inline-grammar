import { beforeAll, describe, expect, it } from 'vitest';
import { clearFocusedIssueCue, focusIssueCue } from '@/lib/issue-cues';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  restoredSelection: string;
  selectedIssueText: string;
};

const suggestion: TextSuggestion = {
  id: 'input-issue',
  message: 'Fix agreement.',
  original: 'This are',
  replacement: 'This is',
  range: { start: 0, end: 8 },
};

describe('Given a native input with an existing cursor, when a suggestion is focused and blurred, then its source is selected temporarily and the cursor is restored', () => {
  let sut: Sut;

  beforeAll(() => {
    const input = document.createElement('input');
    input.value = 'This are editable.';
    document.body.append(input);
    input.focus();
    input.setSelectionRange(17, 17);

    focusIssueCue(input, suggestion);
    const selectedIssueText = input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0);
    clearFocusedIssueCue(input);

    sut = {
      restoredSelection: `${input.selectionStart}:${input.selectionEnd}`,
      selectedIssueText,
    };
  });

  it('selects the exact issue range while focused', () => {
    expect(sut.selectedIssueText).toBe('This are');
  });

  it('restores the previous cursor position afterward', () => {
    expect(sut.restoredSelection).toBe('17:17');
  });
});
