import { beforeAll, describe, expect, it, vi } from 'vitest';
import { classifyField } from '@/lib/field-eligibility';

type Sut = {
  editorResult: ReturnType<typeof classifyField>;
  inputResult: ReturnType<typeof classifyField>;
  textareaResult: ReturnType<typeof classifyField>;
};

describe('Given supported writing fields, when classifyField runs, then it marks them eligible', () => {
  let sut: Sut;

  beforeAll(() => {
    const input = makeVisible(document.createElement('input'));
    const textarea = makeVisible(document.createElement('textarea'));
    const editor = makeVisible(document.createElement('div'));

    input.type = 'text';
    editor.setAttribute('contenteditable', 'true');

    sut = {
      editorResult: classifyField(editor),
      inputResult: classifyField(input),
      textareaResult: classifyField(textarea),
    };
  });

  it('classifies a text input as eligible', () => {
    expect(sut.inputResult).toEqual({
      status: 'eligible',
      reason: 'supported-writing-field',
    });
  });

  it('classifies a textarea as eligible', () => {
    expect(sut.textareaResult).toEqual({
      status: 'eligible',
      reason: 'supported-writing-field',
    });
  });

  it('classifies a contenteditable editor as eligible', () => {
    expect(sut.editorResult).toEqual({
      status: 'eligible',
      reason: 'supported-writing-field',
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
