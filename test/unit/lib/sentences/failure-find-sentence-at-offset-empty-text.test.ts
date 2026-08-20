import { beforeAll, describe, expect, it } from 'vitest';
import { findSentenceAtOffset, type SentenceRange } from '@/lib/sentences';

type Sut = {
  sentence: SentenceRange | null;
};

describe('Given empty text, when findSentenceAtOffset runs, then it returns no sentence range', () => {
  let sut: Sut;

  beforeAll(() => {
    sut = {
      sentence: findSentenceAtOffset('   ', 0),
    };
  });

  it('successfully returns no sentence', () => {
    expect(sut.sentence).toBeNull();
  });
});
