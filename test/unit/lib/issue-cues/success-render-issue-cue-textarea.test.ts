import { beforeAll, describe, expect, it } from 'vitest';
import { clearIssueCue, renderIssueCue } from '@/lib/issue-cues';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  activeCueAttribute: string | undefined;
  activeOutline: string;
  restoredOutline: string;
  restoredOutlineOffset: string;
};

const suggestion: TextSuggestion = {
  id: 'test-textarea',
  message: 'Use the contraction.',
  original: 'lets',
  replacement: "let's",
  range: { start: 0, end: 4 },
};

describe('Given a textarea field with a suggestion, when renderIssueCue runs and clears, then it restores the previous field outline', () => {
  let sut: Sut;

  beforeAll(() => {
    const textarea = document.createElement('textarea');
    textarea.style.outline = '1px solid rgb(255, 0, 0)';
    textarea.style.outlineOffset = '1px';

    renderIssueCue(textarea, [suggestion]);

    const activeOutline = textarea.style.outline;
    const activeCueAttribute = textarea.dataset.inlineGrammarIssueCue;

    clearIssueCue(textarea);

    sut = {
      activeCueAttribute,
      activeOutline,
      restoredOutline: textarea.style.outline,
      restoredOutlineOffset: textarea.style.outlineOffset,
    };
  });

  it('successfully marks the textarea as having an issue cue', () => {
    expect(sut.activeCueAttribute).toBe('true');
  });

  it('successfully applies an amber outline', () => {
    expect(sut.activeOutline).toBe('2px solid rgba(250, 204, 21, 0.75)');
  });

  it('successfully restores the previous outline', () => {
    expect(sut.restoredOutline).toBe('1px solid rgb(255, 0, 0)');
  });

  it('successfully restores the previous outline offset', () => {
    expect(sut.restoredOutlineOffset).toBe('1px');
  });
});
