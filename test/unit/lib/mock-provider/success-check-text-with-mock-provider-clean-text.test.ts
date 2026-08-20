import { beforeAll, describe, expect, it } from 'vitest';
import { checkTextWithMockProvider, type TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  suggestions: TextSuggestion[];
};

describe('Given clean text, when checkTextWithMockProvider runs, then it returns no suggestions', () => {
  let sut: Sut;

  beforeAll(async () => {
    sut = {
      suggestions: await checkTextWithMockProvider({
        presetId: 'formal',
        text: 'This sentence is fine for now.',
      }),
    };
  });

  it('returns no suggestions', () => {
    expect(sut.suggestions).toEqual([]);
  });
});
