import { beforeAll, describe, expect, it } from 'vitest';
import { clearFocusedIssueCue, focusIssueCue, renderIssueCue } from '@/lib/issue-cues';
import type { TextSuggestion } from '@/lib/mock-provider';

class TestHighlight {
  readonly ranges: Range[];

  constructor(...ranges: Range[]) {
    this.ranges = ranges;
  }
}

const suggestions: TextSuggestion[] = [
  {
    id: 'first',
    message: 'Fix agreement.',
    original: 'This are',
    replacement: 'This is',
    range: { start: 0, end: 8 },
  },
  {
    id: 'second',
    message: 'Fix contraction.',
    original: 'lets',
    replacement: "let's",
    range: { start: 9, end: 13 },
  },
];

type Sut = {
  activeTextAfterClear: string | undefined;
  activeTextWhileFocused: string | undefined;
  baseRangeCount: number;
};

describe('Given multiple suggestions in an editable field, when one suggestion receives focus, then only its source range is emphasized temporarily', () => {
  let sut: Sut;

  beforeAll(() => {
    const highlights = new Map<string, TestHighlight>();

    Object.defineProperty(window, 'Highlight', {
      configurable: true,
      value: TestHighlight,
    });
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: {
        highlights: {
          delete: (name: string) => highlights.delete(name),
          set: (name: string, highlight: TestHighlight) => highlights.set(name, highlight),
        },
      },
    });

    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    editor.textContent = 'This are lets write.';
    document.body.append(editor);

    renderIssueCue(editor, suggestions);
    const focusedSuggestion = suggestions[1];

    if (!focusedSuggestion) throw new Error('Focused suggestion fixture was not available.');

    focusIssueCue(editor, focusedSuggestion);

    const activeTextWhileFocused = highlights
      .get('inline-grammar-active-issue')
      ?.ranges[0]?.toString();
    const baseRangeCount = highlights.get('inline-grammar-issues')?.ranges.length ?? 0;

    clearFocusedIssueCue(editor);

    sut = {
      activeTextAfterClear: highlights.get('inline-grammar-active-issue')?.ranges[0]?.toString(),
      activeTextWhileFocused,
      baseRangeCount,
    };
  });

  it('keeps all issues in one neutral base highlight', () => {
    expect(sut.baseRangeCount).toBe(2);
  });

  it('emphasizes only the focused suggestion text', () => {
    expect(sut.activeTextWhileFocused).toBe('lets');
  });

  it('removes the temporary emphasis after focus leaves', () => {
    expect(sut.activeTextAfterClear).toBeUndefined();
  });
});
