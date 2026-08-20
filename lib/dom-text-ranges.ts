import type { TextSuggestion } from './mock-provider';

export type TextNodeRange = {
  node: Text;
  nodeStartOffset: number;
  start: number;
  end: number;
};

const blockTextElements = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DIV',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'UL',
]);

export function getVisibleTextNodeRanges(element: HTMLElement): TextNodeRange[] {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const ranges: TextNodeRange[] = [];
  let start = 0;
  let previousRange: TextNodeRange | undefined;
  let node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    const isMarkupWhitespace = /^\s*$/.test(textNode.data);

    if (isMarkupWhitespace) {
      node = walker.nextNode();
      continue;
    }

    const nodeStartOffset = getLeadingMarkupWhitespaceLength(textNode.data);
    const nodeEndOffset = textNode.data.length - getTrailingMarkupWhitespaceLength(textNode.data);
    const visibleLength = nodeEndOffset - nodeStartOffset;

    if (visibleLength <= 0) {
      node = walker.nextNode();
      continue;
    }

    if (previousRange && startsNewTextLine(textNode, previousRange.node)) {
      start += 1;
    }

    const end = start + visibleLength;
    const range = { node: textNode, nodeStartOffset, start, end };

    ranges.push(range);
    previousRange = range;
    start = end;
    node = walker.nextNode();
  }

  return ranges;
}

export function getVisibleTextFromTextNodeRanges(textNodeRanges: TextNodeRange[]): string {
  return textNodeRanges.reduce((text, range, index) => {
    const visibleText = range.node.data.slice(
      range.nodeStartOffset,
      range.nodeStartOffset + range.end - range.start,
    );
    const separator = index > 0 && range.start > text.length ? '\n' : '';

    return `${text}${separator}${visibleText}`;
  }, '');
}

export function mapSuggestionToDomRange(
  textNodeRanges: TextNodeRange[],
  suggestion: TextSuggestion,
): Range | null {
  const startPosition = findTextPosition(textNodeRanges, suggestion.range.start);
  const endPosition = findTextPosition(textNodeRanges, suggestion.range.end);

  if (!startPosition || !endPosition) return null;

  const range = document.createRange();
  range.setStart(startPosition.node, startPosition.offset);
  range.setEnd(endPosition.node, endPosition.offset);

  if (range.toString() !== suggestion.original) return null;

  return range;
}

function findTextPosition(
  textNodeRanges: TextNodeRange[],
  offset: number,
): { node: Text; offset: number } | null {
  for (const range of textNodeRanges) {
    if (offset >= range.start && offset <= range.end) {
      return { node: range.node, offset: range.nodeStartOffset + offset - range.start };
    }
  }

  return null;
}

function getLeadingMarkupWhitespaceLength(text: string): number {
  return text.match(/^\s*\n\s*/)?.[0].length ?? 0;
}

function getTrailingMarkupWhitespaceLength(text: string): number {
  return text.match(/\s*\n\s*$/)?.[0].length ?? 0;
}

function startsNewTextLine(textNode: Text, previousTextNode: Text): boolean {
  const blockAncestor = closestBlockAncestor(textNode);
  const previousBlockAncestor = closestBlockAncestor(previousTextNode);

  return blockAncestor !== null && blockAncestor !== previousBlockAncestor;
}

function closestBlockAncestor(textNode: Text): Element | null {
  let node = textNode.parentElement;

  while (node) {
    if (blockTextElements.has(node.tagName)) return node;

    node = node.parentElement;
  }

  return null;
}
