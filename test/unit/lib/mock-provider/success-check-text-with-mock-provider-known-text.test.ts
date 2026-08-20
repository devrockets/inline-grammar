import { beforeAll, describe, expect, it } from 'vitest';
import { checkTextWithMockProvider, type TextSuggestion } from '@/lib/mock-provider';

type Sut = {
  suggestions: TextSuggestion[];
};

describe('Given known fixture text, when checkTextWithMockProvider runs, then it returns deterministic suggestions', () => {
  let sut: Sut;

  beforeAll(async () => {
    sut = {
      suggestions: await checkTextWithMockProvider({
        presetId: 'clear',
        text: 'Inlineai seems to already exists, lets create a name no one is using',
      }),
    };
  });

  it('returns two suggestions', () => {
    expect(sut.suggestions).toHaveLength(2);
  });

  it('returns a contraction suggestion for lets', () => {
    expect(sut.suggestions[0]).toMatchObject({
      original: 'lets',
      replacement: "let's",
    });
  });

  it('returns an agreement suggestion for already exists', () => {
    expect(sut.suggestions[1]).toMatchObject({
      original: 'already exists',
      replacement: 'already exist',
    });
  });
});
