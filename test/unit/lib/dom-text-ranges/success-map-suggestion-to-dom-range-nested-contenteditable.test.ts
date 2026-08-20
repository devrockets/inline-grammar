import { beforeAll, describe, expect, it } from 'vitest';
import { getVisibleTextNodeRanges, mapSuggestionToDomRange } from '@/lib/dom-text-ranges';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  rangeText: string;
  textNodeRangeCount: number;
};

const suggestion: TextSuggestion = {
  id: 'test-dom-range',
  message: 'Fix phrasing.',
  original: 'their is',
  replacement: 'there are',
  range: { start: 23, end: 31 },
};

describe('Given a nested contenteditable field with visible text nodes, when mapSuggestionToDomRange runs, then it maps offsets to the nested text range', () => {
  let sut: Sut;

  beforeAll(() => {
    const editor = document.createElement('div');
    editor.innerHTML = '<p>This are a draft where <em>their is</em> a mistake.</p>';

    const textNodeRanges = getVisibleTextNodeRanges(editor);
    const range = mapSuggestionToDomRange(textNodeRanges, suggestion);

    sut = {
      rangeText: range?.toString() ?? '',
      textNodeRangeCount: textNodeRanges.length,
    };
  });

  it('successfully maps to the expected text', () => {
    expect(sut.rangeText).toBe('their is');
  });

  it('successfully tracks nested text nodes separately', () => {
    expect(sut.textNodeRangeCount).toBe(3);
  });
});
