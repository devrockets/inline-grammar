import { getVisibleTextNodeRanges, mapSuggestionToDomRange } from './dom-text-ranges';
import type { TextSuggestion } from './mock-provider';

export type EditableTextField = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

export type UndoEntry = {
  field: EditableTextField;
  value: string;
  html: string | null;
  selectionStart: number | null;
  selectionEnd: number | null;
};

let lastUndoEntry: UndoEntry | null = null;

export function canApplySuggestions(element: HTMLElement): element is EditableTextField {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    isContentEditable(element)
  );
}

export function applySuggestion(field: EditableTextField, suggestion: TextSuggestion): boolean {
  return applySuggestions(field, [suggestion]);
}

export function applySuggestions(field: EditableTextField, suggestions: TextSuggestion[]): boolean {
  if (isRichContentEditable(field)) {
    return applyContentEditableSuggestions(field, suggestions);
  }

  return applyPlainTextSuggestions(field, suggestions);
}

function applyPlainTextSuggestions(
  field: HTMLInputElement | HTMLTextAreaElement | HTMLElement,
  suggestions: TextSuggestion[],
): boolean {
  const originalValue = getEditableValue(field);
  const nextValue = replacePlainTextSuggestions(originalValue, suggestions);

  if (nextValue === originalValue) return false;

  lastUndoEntry = {
    field,
    html: null,
    value: originalValue,
    selectionStart: getSelectionStart(field),
    selectionEnd: getSelectionEnd(field),
  };

  setEditableValue(field, nextValue);
  field.dispatchEvent(
    new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText' }),
  );
  field.focus();

  return true;
}

function applyContentEditableSuggestions(
  field: HTMLElement,
  suggestions: TextSuggestion[],
): boolean {
  const originalText = field.textContent ?? '';
  const originalHtml = field.innerHTML;
  const textNodeRanges = getVisibleTextNodeRanges(field);
  const orderedSuggestions = [...suggestions].sort(
    (left, right) => right.range.start - left.range.start,
  );

  let didApply = false;

  for (const suggestion of orderedSuggestions) {
    const mappedRange = mapSuggestionToDomRange(textNodeRanges, suggestion);

    if (!mappedRange) continue;

    mappedRange.deleteContents();
    mappedRange.insertNode(document.createTextNode(suggestion.replacement));
    didApply = true;
  }

  if (!didApply || (field.textContent ?? '') === originalText) return false;

  lastUndoEntry = {
    field,
    html: originalHtml,
    value: originalText,
    selectionStart: null,
    selectionEnd: null,
  };

  field.dispatchEvent(
    new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText' }),
  );
  field.focus();

  return true;
}

export function undoLastSuggestionApplication(field: EditableTextField): boolean {
  if (!lastUndoEntry || lastUndoEntry.field !== field) return false;

  const { field: undoField, html, value, selectionStart, selectionEnd } = lastUndoEntry;
  lastUndoEntry = null;

  if (html !== null && isContentEditable(undoField)) {
    undoField.innerHTML = html;
  } else {
    setEditableValue(undoField, value);
  }

  if (
    (undoField instanceof HTMLInputElement || undoField instanceof HTMLTextAreaElement) &&
    selectionStart !== null &&
    selectionEnd !== null
  ) {
    undoField.setSelectionRange(selectionStart, selectionEnd);
  }

  undoField.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'historyUndo' }));
  undoField.focus();

  return true;
}

export function hasUndoEntry(field: EditableTextField): boolean {
  return lastUndoEntry?.field === field;
}

function getEditableValue(field: EditableTextField): string {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return field.value;
  }

  return field.textContent ?? '';
}

function setEditableValue(field: EditableTextField, value: string): void {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    field.value = value;
    return;
  }

  field.textContent = value;
}

function getSelectionStart(field: EditableTextField): number | null {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return field.selectionStart;
  }

  return null;
}

function getSelectionEnd(field: EditableTextField): number | null {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return field.selectionEnd;
  }

  return null;
}

function replacePlainTextSuggestions(text: string, suggestions: TextSuggestion[]): string {
  return [...suggestions]
    .sort((left, right) => right.range.start - left.range.start)
    .reduce((nextText, suggestion) => {
      if (nextText.slice(suggestion.range.start, suggestion.range.end) === suggestion.original) {
        return `${nextText.slice(0, suggestion.range.start)}${suggestion.replacement}${nextText.slice(
          suggestion.range.end,
        )}`;
      }

      return nextText.replace(suggestion.original, suggestion.replacement);
    }, text);
}

function isContentEditable(element: HTMLElement): boolean {
  return element.isContentEditable || element.getAttribute('contenteditable') === 'true';
}

function isRichContentEditable(element: EditableTextField): element is HTMLElement {
  return (
    !(element instanceof HTMLInputElement) &&
    !(element instanceof HTMLTextAreaElement) &&
    isContentEditable(element)
  );
}
