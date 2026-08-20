import { beforeAll, describe, expect, it } from 'vitest';
import { getFieldText } from '@/lib/text';

type Sut = {
  editorResult: string;
  inputResult: string;
  nestedEditorResult: string;
  textareaResult: string;
};

describe('Given supported field types, when getFieldText runs, then it returns their text', () => {
  let sut: Sut;

  beforeAll(() => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const editor = document.createElement('div');
    const nestedEditor = document.createElement('div');

    input.value = 'input text';
    textarea.value = 'textarea text';
    editor.textContent = 'editor text';
    nestedEditor.innerHTML = '<p>first line</p><p>second line</p>';

    sut = {
      editorResult: getFieldText(editor),
      inputResult: getFieldText(input),
      nestedEditorResult: getFieldText(nestedEditor),
      textareaResult: getFieldText(textarea),
    };
  });

  it('reads text from an input value', () => {
    expect(sut.inputResult).toBe('input text');
  });

  it('reads text from a textarea value', () => {
    expect(sut.textareaResult).toBe('textarea text');
  });

  it('reads text from a contenteditable inner text', () => {
    expect(sut.editorResult).toBe('editor text');
  });

  it('reads visible lines from a nested contenteditable editor', () => {
    expect(sut.nestedEditorResult).toBe('first line\nsecond line');
  });
});
