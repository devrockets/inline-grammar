import { beforeAll, describe, expect, it } from 'vitest';
import {
  getVisibleTextFromTextNodeRanges,
  getVisibleTextNodeRanges,
  mapSuggestionToDomRange,
} from '@/lib/dom-text-ranges';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  rangeText: string;
  visibleText: string;
};

const suggestion: TextSuggestion = {
  id: 'test-multiline',
  message: 'Use the contraction.',
  original: 'lets',
  replacement: "let's",
  range: { start: 53, end: 57 },
};

describe('Given a multiline nested contenteditable field with a suggestion on the second line, when mapSuggestionToDomRange runs, then it maps offsets across block lines', () => {
  let sut: Sut;

  beforeAll(() => {
    const editor = document.createElement('div');
    editor.innerHTML =
      '<p>This are a draft post with their is a grammar issue.</p><p>lets keep this second line visible.</p>';

    const textNodeRanges = getVisibleTextNodeRanges(editor);
    const range = mapSuggestionToDomRange(textNodeRanges, suggestion);

    sut = {
      rangeText: range?.toString() ?? '',
      visibleText: getVisibleTextFromTextNodeRanges(textNodeRanges),
    };
  });

  it('successfully maps to the second-line suggestion text', () => {
    expect(sut.rangeText).toBe('lets');
  });

  it('successfully includes line breaks in visible text', () => {
    expect(sut.visibleText).toContain('issue.\nlets');
  });
});
