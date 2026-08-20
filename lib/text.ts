import { getVisibleTextFromTextNodeRanges, getVisibleTextNodeRanges } from './dom-text-ranges';

export function getFieldText(element: HTMLElement): string {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value;
  }

  return getVisibleTextFromTextNodeRanges(getVisibleTextNodeRanges(element));
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
