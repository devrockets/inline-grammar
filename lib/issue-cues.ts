import { getVisibleTextNodeRanges, mapSuggestionToDomRange } from './dom-text-ranges';
import type { TextSuggestion } from './mock-provider';

type Highlight = object;

type HighlightConstructor = new (...ranges: Range[]) => Highlight;

type HighlightRegistry = {
  delete: (name: string) => void;
  set: (name: string, highlight: Highlight) => void;
};

type CssWithHighlights = typeof CSS & {
  highlights?: HighlightRegistry;
};

type WindowWithHighlight = Window &
  typeof globalThis & {
    Highlight?: HighlightConstructor;
  };

const highlightName = 'inline-grammar-issues';
const activeHighlightName = 'inline-grammar-active-issue';
const highlightedElements = new Map<HTMLElement, TextSuggestion[]>();
const focusedSuggestions = new Map<HTMLElement, TextSuggestion>();
const nativeSelectionSnapshots = new WeakMap<
  HTMLInputElement | HTMLTextAreaElement,
  {
    activeElement: Element | null;
    selectionDirection: 'backward' | 'forward' | 'none' | null;
    selectionEnd: number | null;
    selectionStart: number | null;
  }
>();
const outlinedElements = new WeakMap<
  HTMLElement,
  {
    outline: string;
    outlineOffset: string;
  }
>();
let styleElement: HTMLStyleElement | null = null;

export function renderIssueCue(element: HTMLElement, suggestions: TextSuggestion[]): void {
  if (suggestions.length === 0) {
    clearIssueCue(element);
    return;
  }

  applyFieldOutline(element);

  if (canHighlightTextRange(element)) {
    highlightedElements.set(element, suggestions);
  } else {
    highlightedElements.delete(element);
  }

  rebuildHighlights();
}

export function clearIssueCue(element: HTMLElement): void {
  clearFocusedIssueCue(element);
  restoreFieldOutline(element);
  highlightedElements.delete(element);
  rebuildHighlights();
}

export function focusIssueCue(
  element: HTMLElement,
  suggestion: TextSuggestion,
  selectNativeText = true,
): void {
  if (canHighlightTextRange(element)) {
    focusedSuggestions.set(element, suggestion);
    rebuildHighlights();
    return;
  }

  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;
  if (!selectNativeText) return;

  if (!nativeSelectionSnapshots.has(element)) {
    nativeSelectionSnapshots.set(element, {
      activeElement: document.activeElement,
      selectionDirection: element.selectionDirection,
      selectionEnd: element.selectionEnd,
      selectionStart: element.selectionStart,
    });
  }

  element.focus({ preventScroll: true });
  element.setSelectionRange(suggestion.range.start, suggestion.range.end);
}

export function clearFocusedIssueCue(element: HTMLElement): void {
  if (focusedSuggestions.delete(element)) {
    rebuildHighlights();
  }

  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;

  const snapshot = nativeSelectionSnapshots.get(element);

  if (!snapshot) return;

  if (snapshot.selectionStart !== null && snapshot.selectionEnd !== null) {
    element.setSelectionRange(
      snapshot.selectionStart,
      snapshot.selectionEnd,
      snapshot.selectionDirection ?? undefined,
    );
  }

  if (snapshot.activeElement instanceof HTMLElement && snapshot.activeElement !== element) {
    snapshot.activeElement.focus({ preventScroll: true });
  } else if (!snapshot.activeElement || snapshot.activeElement === document.body) {
    element.blur();
  }

  nativeSelectionSnapshots.delete(element);
}

function applyFieldOutline(element: HTMLElement): void {
  if (!outlinedElements.has(element)) {
    outlinedElements.set(element, {
      outline: element.style.outline,
      outlineOffset: element.style.outlineOffset,
    });
  }

  element.dataset.inlineGrammarIssueCue = 'true';
  element.style.outline = '2px solid rgba(250, 204, 21, 0.75)';
  element.style.outlineOffset = '2px';
}

function restoreFieldOutline(element: HTMLElement): void {
  const previousStyles = outlinedElements.get(element);

  if (!previousStyles) return;

  element.style.outline = previousStyles.outline;
  element.style.outlineOffset = previousStyles.outlineOffset;
  delete element.dataset.inlineGrammarIssueCue;
  outlinedElements.delete(element);
}

function rebuildHighlights(): void {
  const api = getHighlightApi();

  if (!api) return;

  const ranges = [...highlightedElements.entries()].flatMap(([element, suggestions]) =>
    suggestions.flatMap((suggestion) => {
      const range = mapSuggestionToDomRange(getVisibleTextNodeRanges(element), suggestion);

      return range ? [range] : [];
    }),
  );
  const activeRanges = [...focusedSuggestions.entries()].flatMap(([element, suggestion]) => {
    const range = mapSuggestionToDomRange(getVisibleTextNodeRanges(element), suggestion);

    return range ? [range] : [];
  });

  if (ranges.length > 0) {
    api.registry.set(highlightName, new api.Highlight(...ranges));
  } else {
    api.registry.delete(highlightName);
  }

  if (activeRanges.length > 0) {
    api.registry.set(activeHighlightName, new api.Highlight(...activeRanges));
  } else {
    api.registry.delete(activeHighlightName);
  }

  if (ranges.length > 0 || activeRanges.length > 0) ensureHighlightStyles();
}

function ensureHighlightStyles(): void {
  if (styleElement) return;

  styleElement = document.createElement('style');
  styleElement.dataset.inlineGrammarHighlightStyles = 'true';
  styleElement.textContent = `
    ::highlight(${highlightName}) {
      background-color: rgba(250, 204, 21, 0.22);
      text-decoration: underline 2px rgba(250, 204, 21, 0.9);
    }

    ::highlight(${activeHighlightName}) {
      background-color: rgba(56, 189, 248, 0.5);
      text-decoration: underline 3px #38bdf8;
    }
  `;
  document.documentElement.append(styleElement);
}

function canHighlightTextRange(element: HTMLElement): boolean {
  return isContentEditable(element);
}

function isContentEditable(element: HTMLElement): boolean {
  return element.isContentEditable || element.getAttribute('contenteditable') === 'true';
}

function getHighlightApi(): {
  Highlight: HighlightConstructor;
  registry: HighlightRegistry;
} | null {
  const Highlight = (window as WindowWithHighlight).Highlight;
  const registry = typeof CSS === 'undefined' ? undefined : (CSS as CssWithHighlights).highlights;

  if (!Highlight || !registry) return null;

  return { Highlight, registry };
}
