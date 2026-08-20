import { beforeAll, describe, expect, it } from 'vitest';
import {
  attachFieldIndicator,
  detachFieldIndicator,
  setFieldIndicatorState,
} from '@/lib/field-indicator';
import type { TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  indicatorCountAfterDetach: number;
  indicatorCountAfterReattach: number;
  issueCueAfterDetach: string | undefined;
  outlineAfterDetach: string;
};

const suggestion: TextSuggestion = {
  id: 'test-detached-field',
  message: 'Fix agreement.',
  original: 'This are',
  replacement: 'This is',
  range: { start: 0, end: 8 },
};

describe('Given a field with an attached Inline Grammar indicator, when detachFieldIndicator runs after the field is removed, then stale inline UI is cleared', () => {
  let sut: Sut;

  beforeAll(() => {
    const input = document.createElement('input');
    input.value = 'This are detached.';
    document.body.append(input);

    attachFieldIndicator(input, { status: 'eligible', reason: 'supported-writing-field' });
    setFieldIndicatorState(input, 'has-suggestions', [suggestion]);

    input.remove();
    detachFieldIndicator(input);

    const indicatorCountAfterDetach = document.querySelectorAll(
      '[data-inline-grammar-indicator]',
    ).length;
    const issueCueAfterDetach = input.dataset.inlineGrammarIssueCue;
    const outlineAfterDetach = input.style.outline;

    document.body.append(input);
    attachFieldIndicator(input, { status: 'eligible', reason: 'supported-writing-field' });

    sut = {
      indicatorCountAfterDetach,
      indicatorCountAfterReattach: document.querySelectorAll('[data-inline-grammar-indicator]')
        .length,
      issueCueAfterDetach,
      outlineAfterDetach,
    };
  });

  it('successfully removes the detached field indicator', () => {
    expect(sut.indicatorCountAfterDetach).toBe(0);
  });

  it('successfully clears the detached field issue cue marker', () => {
    expect(sut.issueCueAfterDetach).toBeUndefined();
  });

  it('successfully restores the detached field outline', () => {
    expect(sut.outlineAfterDetach).toBe('');
  });

  it('successfully allows the same field node to attach again', () => {
    expect(sut.indicatorCountAfterReattach).toBe(1);
  });
});
