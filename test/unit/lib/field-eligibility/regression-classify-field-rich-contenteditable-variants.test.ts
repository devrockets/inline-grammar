import { beforeAll, describe, expect, it, vi } from 'vitest';
import { classifyField } from '@/lib/field-eligibility';

type Sut = {
  emptyAttributeResult: ReturnType<typeof classifyField>;
  plaintextOnlyResult: ReturnType<typeof classifyField>;
  proseMirrorResult: ReturnType<typeof classifyField>;
};

describe('Given rich text editor contenteditable variants, when classifyField runs, then it marks them eligible', () => {
  let sut: Sut;

  beforeAll(() => {
    const proseMirrorEditor = makeVisible(document.createElement('div'));
    const emptyAttributeEditor = makeVisible(document.createElement('div'));
    const plaintextOnlyEditor = makeVisible(document.createElement('div'));

    proseMirrorEditor.className = 'tiptap ProseMirror';
    proseMirrorEditor.setAttribute('contenteditable', 'true');
    proseMirrorEditor.setAttribute('role', 'textbox');
    proseMirrorEditor.innerHTML =
      '<p>i has been working on this project since yesterday and its going good</p>';

    emptyAttributeEditor.setAttribute('contenteditable', '');
    plaintextOnlyEditor.setAttribute('contenteditable', 'plaintext-only');

    sut = {
      emptyAttributeResult: classifyField(emptyAttributeEditor),
      plaintextOnlyResult: classifyField(plaintextOnlyEditor),
      proseMirrorResult: classifyField(proseMirrorEditor),
    };
  });

  it('classifies a Tiptap ProseMirror textbox as eligible', () => {
    expect(sut.proseMirrorResult).toEqual({
      reason: 'supported-writing-field',
      status: 'eligible',
    });
  });

  it('classifies an empty contenteditable attribute as eligible', () => {
    expect(sut.emptyAttributeResult).toEqual({
      reason: 'supported-writing-field',
      status: 'eligible',
    });
  });

  it('classifies a plaintext-only contenteditable editor as eligible', () => {
    expect(sut.plaintextOnlyResult).toEqual({
      reason: 'supported-writing-field',
      status: 'eligible',
    });
  });
});

function makeVisible<TElement extends HTMLElement>(element: TElement): TElement {
  element.getBoundingClientRect = vi.fn(
    () =>
      ({
        bottom: 40,
        height: 32,
        left: 0,
        right: 200,
        top: 8,
        width: 200,
        x: 0,
        y: 8,
        toJSON: () => '',
      }) as DOMRect,
  );

  return element;
}
