import { beforeAll, describe, expect, it } from 'vitest';
import { writingFieldSelector } from '@/lib/field-selectors';

type Sut = {
  matchedElementCount: number;
};

describe('Given rich editor candidates use role and contenteditable attributes, when writingFieldSelector runs, then it includes those candidates', () => {
  let sut: Sut;

  beforeAll(() => {
    const root = document.createElement('div');

    root.innerHTML = `
      <div class="tiptap ProseMirror" contenteditable="true" role="textbox">
        <p>i has been working on this project</p>
      </div>
      <div role="textbox"></div>
      <div contenteditable="plaintext-only"></div>
    `;

    sut = {
      matchedElementCount: root.querySelectorAll(writingFieldSelector).length,
    };
  });

  it('matches contenteditable and role textbox candidates', () => {
    expect(sut.matchedElementCount).toBe(3);
  });
});
