import { beforeAll, describe, expect, it } from 'vitest';
import { getVisibleTextNodeRanges, mapSuggestionToDomRange } from '@/lib/dom-text-ranges';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  rangeText: string;
  textNodeRangeCount: number;
};

const suggestion: TextSuggestion = {
  id: 'test-indented-contenteditable',
  message: 'Fix agreement.',
  original: 'This are',
  replacement: 'This is',
  range: { start: 0, end: 8 },
};

describe('Given an indented contenteditable text node with a visible suggestion range, when mapSuggestionToDomRange runs, then it ignores markup indentation', () => {
  let sut: Sut;

  beforeAll(() => {
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    editor.textContent = `
This are editable.
    `;

    const textNodeRanges = getVisibleTextNodeRanges(editor);
    const range = mapSuggestionToDomRange(textNodeRanges, suggestion);

    sut = {
      rangeText: range?.toString() ?? '',
      textNodeRangeCount: textNodeRanges.length,
    };
  });

  it('successfully maps to the expected visible text', () => {
    expect(sut.rangeText).toBe('This are');
  });

  it('successfully keeps one visible text node range', () => {
    expect(sut.textNodeRangeCount).toBe(1);
  });
});
