import { beforeAll, describe, expect, it } from 'vitest';
import { renderIssueCue } from '@/lib/issue-cues';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  highlightedText: string;
  outline: string;
};

class TestHighlight {
  readonly ranges: Range[];

  constructor(...ranges: Range[]) {
    this.ranges = ranges;
  }
}

const suggestion: TextSuggestion = {
  id: 'test-linkedin-like',
  message: 'Fix phrasing.',
  original: 'their is',
  replacement: 'there are',
  range: { start: 23, end: 31 },
};

describe('Given a nested contenteditable field with a ranged suggestion, when renderIssueCue runs, then it highlights nested issue text', () => {
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
    editor.innerHTML = '<p>This are a draft where <em>their is</em> a mistake.</p>';

    renderIssueCue(editor, [suggestion]);

    const highlight = highlights.get('inline-grammar-issues');

    sut = {
      highlightedText: highlight?.ranges[0]?.toString() ?? '',
      outline: editor.style.outline,
    };
  });

  it('successfully highlights the nested suggested text range', () => {
    expect(sut.highlightedText).toBe('their is');
  });

  it('successfully keeps the field-level issue outline', () => {
    expect(sut.outline).toBe('2px solid rgba(250, 204, 21, 0.75)');
  });
});
