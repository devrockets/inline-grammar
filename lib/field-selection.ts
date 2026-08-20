import { getVisibleTextNodeRanges } from './dom-text-ranges';

export function getFieldSelectionOffset(element: HTMLElement): number {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.selectionStart ?? element.value.length;
  }

  return getContentEditableSelectionOffset(element) ?? getContentEditableTextLength(element);
}

function getContentEditableSelectionOffset(element: HTMLElement): number | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) return null;

  const anchorNode = selection.anchorNode;

  if (!anchorNode || !element.contains(anchorNode)) return null;

  const textNodeRanges = getVisibleTextNodeRanges(element);

  for (const textNodeRange of textNodeRanges) {
    if (textNodeRange.node !== anchorNode) continue;

    return (
      textNodeRange.start + Math.max(0, selection.anchorOffset - textNodeRange.nodeStartOffset)
    );
  }

  return null;
}

function getContentEditableTextLength(element: HTMLElement): number {
  const textNodeRanges = getVisibleTextNodeRanges(element);
  const lastRange = textNodeRanges.at(-1);

  return lastRange?.end ?? 0;
}
