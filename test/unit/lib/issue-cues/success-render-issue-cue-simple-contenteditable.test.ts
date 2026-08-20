import { beforeAll, describe, expect, it } from 'vitest';
import { renderIssueCue } from '@/lib/issue-cues';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  highlightedText: string;
  styleText: string;
};

class TestHighlight {
  readonly ranges: Range[];

  constructor(...ranges: Range[]) {
    this.ranges = ranges;
  }
}

const suggestion: TextSuggestion = {
  id: 'test-contenteditable',
  message: 'Fix agreement.',
  original: 'This are',
  replacement: 'This is',
  range: { start: 0, end: 8 },
};

describe('Given a simple contenteditable field with a ranged suggestion, when renderIssueCue runs, then it highlights the issue text', () => {
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
    editor.textContent = 'This are editable.';
    document.body.append(editor);

    renderIssueCue(editor, [suggestion]);

    const highlight = highlights.get('inline-grammar-issues');

    sut = {
      highlightedText: highlight?.ranges[0]?.toString() ?? '',
      styleText:
        document.querySelector('[data-inline-grammar-highlight-styles]')?.textContent ?? '',
    };
  });

  it('successfully highlights the suggested text range', () => {
    expect(sut.highlightedText).toBe('This are');
  });

  it('successfully uses a background highlight style', () => {
    expect(sut.styleText).toContain('background-color');
    expect(sut.styleText).toContain('inline-grammar-active-issue');
  });
});
