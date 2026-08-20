import { beforeAll, describe, expect, it } from 'vitest';
import { findSentenceAtOffset, type SentenceRange } from '@/lib/sentences';

type Sut = {
  sentence: SentenceRange | null;
};

describe('Given text with multiple sentences, when findSentenceAtOffset runs inside the second sentence, then it returns the active sentence range', () => {
  let sut: Sut;

  beforeAll(() => {
    sut = {
      sentence: findSentenceAtOffset('First sentence. This are the active sentence. Last one.', 20),
    };
  });

  it('successfully returns the active sentence text', () => {
    expect(sut.sentence?.text).toBe('This are the active sentence.');
  });

  it('successfully returns the active sentence start offset', () => {
    expect(sut.sentence?.start).toBe(16);
  });

  it('successfully returns the active sentence end offset', () => {
    expect(sut.sentence?.end).toBe(45);
  });
});
