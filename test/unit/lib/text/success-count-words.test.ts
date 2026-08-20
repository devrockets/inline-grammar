import { beforeAll, describe, expect, it } from 'vitest';
import { countWords } from '@/lib/text';

type Sut = {
  emptyTextResult: number;
  spacedTextResult: number;
};

describe('Given whitespace-normalized text, when countWords runs, then it returns the word count', () => {
  let sut: Sut;

  beforeAll(() => {
    sut = {
      emptyTextResult: countWords(''),
      spacedTextResult: countWords('  one   two three  '),
    };
  });

  it('counts words after trimming extra whitespace', () => {
    expect(sut.spacedTextResult).toBe(3);
  });

  it('returns zero for empty text', () => {
    expect(sut.emptyTextResult).toBe(0);
  });
});
