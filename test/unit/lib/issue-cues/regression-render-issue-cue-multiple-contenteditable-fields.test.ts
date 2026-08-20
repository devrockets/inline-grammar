import { beforeAll, describe, expect, it } from 'vitest';
import { renderIssueCue } from '@/lib/issue-cues';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  highlightedText: string;
  rangeCount: number;
};

class TestHighlight {
  readonly ranges: Range[];

  constructor(...ranges: Range[]) {
    this.ranges = ranges;
  }
}

const simpleSuggestion: TextSuggestion = {
  id: 'test-simple',
  message: 'Fix agreement.',
  original: 'This are',
  replacement: 'This is',
  range: { start: 0, end: 8 },
};

const nestedSuggestion: TextSuggestion = {
  id: 'test-nested',
  message: 'Fix phrasing.',
  original: 'their is',
  replacement: 'there are',
  range: { start: 23, end: 31 },
};

describe('Given simple and nested contenteditable fields with suggestions, when renderIssueCue runs for both, then both fields keep text highlights', () => {
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

    const simpleEditor = document.createElement('div');
    simpleEditor.setAttribute('contenteditable', 'true');
    simpleEditor.textContent = 'This are editable.';

    const nestedEditor = document.createElement('div');
    nestedEditor.setAttribute('contenteditable', 'true');
    nestedEditor.innerHTML = '<p>This are a draft where <em>their is</em> a mistake.</p>';

    renderIssueCue(simpleEditor, [simpleSuggestion]);
    renderIssueCue(nestedEditor, [nestedSuggestion]);

    const highlight = highlights.get('inline-grammar-issues');

    sut = {
      highlightedText: highlight?.ranges.map((range) => range.toString()).join('|') ?? '',
      rangeCount: highlight?.ranges.length ?? 0,
    };
  });

  it('successfully keeps both highlight ranges registered', () => {
    expect(sut.rangeCount).toBe(2);
  });

  it('successfully keeps the simple editor highlight registered', () => {
    expect(sut.highlightedText).toContain('This are');
  });

  it('successfully keeps the nested editor highlight registered', () => {
    expect(sut.highlightedText).toContain('their is');
  });
});
