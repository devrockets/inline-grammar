import {
  applySuggestion,
  applySuggestions,
  canApplySuggestions,
  hasUndoEntry,
  undoLastSuggestionApplication,
} from './apply-suggestions';
import type { CheckingState } from './checking-controller';
import type { FieldEligibility } from './field-eligibility';
import { clearFocusedIssueCue, focusIssueCue, renderIssueCue } from './issue-cues';
import type { TextSuggestion } from './mock-provider';
import { closeSuggestionPopover, showSuggestionPopover } from './suggestion-popover';

const indicatorAttribute = 'data-inline-grammar-indicator';
const attachedElements = new WeakMap<HTMLElement, true>();
const indicatorByElement = new WeakMap<HTMLElement, HTMLElement>();
const elementByIndicator = new WeakMap<HTMLElement, HTMLElement>();
const suggestionsByElement = new WeakMap<HTMLElement, TextSuggestion[]>();
const providerErrorByElement = new WeakMap<HTMLElement, string>();
const animationByIndicator = new WeakMap<HTMLElement, Animation>();
let isPositionWatcherAttached = false;
let nextFieldId = 1;

export function attachFieldIndicator(element: HTMLElement, eligibility: FieldEligibility): void {
  if (attachedElements.has(element)) return;

  attachedElements.set(element, true);

  if (eligibility.status === 'ignored') return;

  const indicator = document.createElement('button');
  const fieldId = getOrCreateFieldId(element);

  indicator.type = 'button';
  indicator.setAttribute(indicatorAttribute, eligibility.status);
  indicator.dataset.inlineGrammarFieldId = fieldId;
  indicator.setAttribute(
    'aria-label',
    eligibility.status === 'eligible'
      ? 'Inline Grammar is available for this field'
      : 'Inline Grammar cannot edit this field',
  );
  indicator.setAttribute('aria-expanded', 'false');
  indicator.setAttribute('aria-haspopup', 'dialog');
  indicator.style.alignItems = 'center';
  indicator.style.appearance = 'none';
  indicator.style.background = eligibility.status === 'eligible' ? '#0369a1' : '#52525b';
  indicator.style.border = '2px solid #ffffff';
  indicator.style.borderRadius = '999px';
  indicator.style.boxShadow = '0 2px 8px rgb(24 24 27 / 18%)';
  indicator.style.boxSizing = 'border-box';
  indicator.style.color = '#ffffff';
  indicator.style.display = 'flex';
  indicator.style.font = '700 11px/1 system-ui, sans-serif';
  indicator.style.height = '24px';
  indicator.style.justifyContent = 'center';
  indicator.style.padding = '0';
  indicator.style.pointerEvents = 'auto';
  indicator.style.position = 'fixed';
  indicator.style.width = '24px';
  indicator.style.zIndex = '2147483647';
  indicator.textContent = 'i';
  indicator.tabIndex = 0;

  indicator.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    showIndicatorPopover(element, indicator);
  });

  getIndicatorMountRoot(element).append(indicator);
  showIndicatorInTopLayer(indicator);
  indicatorByElement.set(element, indicator);
  elementByIndicator.set(indicator, element);
  setFieldIndicatorState(element, eligibility.status === 'eligible' ? 'idle' : 'too-short', []);
  positionIndicator(element, indicator);
  attachPositionWatcher();
}

function getIndicatorMountRoot(element: HTMLElement): HTMLElement {
  return (
    element.closest<HTMLElement>('dialog[open], [role="dialog"], [aria-modal="true"]') ??
    document.body
  );
}

function showIndicatorInTopLayer(indicator: HTMLButtonElement): void {
  if (typeof indicator.showPopover !== 'function') return;

  indicator.popover = 'manual';
  indicator.style.inset = 'auto';
  indicator.style.margin = '0';
  indicator.showPopover();
}

export function detachFieldIndicator(element: HTMLElement): void {
  const indicator = indicatorByElement.get(element);

  if (indicator) {
    stopCheckingAnimation(indicator);
    indicator.remove();
    elementByIndicator.delete(indicator);
  }

  closeSuggestionPopover();
  renderIssueCue(element, []);
  attachedElements.delete(element);
  indicatorByElement.delete(element);
  suggestionsByElement.delete(element);
}

function getOrCreateFieldId(element: HTMLElement): string {
  const existingFieldId = element.dataset.inlineGrammarFieldId;

  if (existingFieldId) return existingFieldId;

  const fieldId = String(nextFieldId);
  nextFieldId += 1;
  element.dataset.inlineGrammarFieldId = fieldId;

  return fieldId;
}

export function setFieldIndicatorState(
  element: HTMLElement,
  state: CheckingState,
  suggestions: TextSuggestion[],
  message?: string,
): void {
  const indicator = indicatorByElement.get(element);

  if (!indicator) return;

  suggestionsByElement.set(element, suggestions);
  if (state === 'provider-error' && message) {
    providerErrorByElement.set(element, message);
  } else {
    providerErrorByElement.delete(element);
  }
  renderIssueCue(element, state === 'has-suggestions' ? suggestions : []);
  indicator.dataset.inlineGrammarState = state;
  indicator.dataset.inlineGrammarSuggestionCount = String(suggestions.length);
  const indicatorTitle = getIndicatorTitle(state, suggestions);
  indicator.title = indicatorTitle;
  indicator.setAttribute('aria-label', indicatorTitle);
  stopCheckingAnimation(indicator);

  if (state === 'checking') {
    indicator.setAttribute('aria-busy', 'true');
    startCheckingAnimation(indicator);
  } else {
    indicator.removeAttribute('aria-busy');
  }

  indicator.textContent =
    state === 'checking'
      ? '↻'
      : state === 'provider-error'
        ? '!'
        : suggestions.length > 0
          ? String(suggestions.length)
          : 'i';
  indicator.style.background =
    state === 'checking'
      ? '#6d28d9'
      : state === 'provider-error'
        ? '#c2410c'
        : indicator.getAttribute(indicatorAttribute) === 'ineligible'
          ? '#52525b'
          : '#0369a1';
}

function startCheckingAnimation(indicator: HTMLElement): void {
  if (typeof indicator.animate !== 'function') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const animation = indicator.animate(
    [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
    {
      duration: 800,
      iterations: Number.POSITIVE_INFINITY,
    },
  );
  animationByIndicator.set(indicator, animation);
}

function stopCheckingAnimation(indicator: HTMLElement): void {
  animationByIndicator.get(indicator)?.cancel();
  animationByIndicator.delete(indicator);
}

function attachPositionWatcher(): void {
  if (isPositionWatcherAttached) return;

  isPositionWatcherAttached = true;

  window.addEventListener('scroll', updateAllIndicatorPositions, true);
  window.addEventListener('resize', updateAllIndicatorPositions);
}

function updateAllIndicatorPositions(): void {
  for (const indicator of document.querySelectorAll<HTMLElement>(`[${indicatorAttribute}]`)) {
    const element = elementByIndicator.get(indicator);

    if (element?.isConnected) {
      positionIndicator(element, indicator);
    } else if (element) {
      detachFieldIndicator(element);
    } else {
      indicator.remove();
    }
  }
}

function positionIndicator(element: HTMLElement, indicator: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const indicatorSize = 24;
  const viewportPadding = 8;
  const maxLeft = window.innerWidth - indicatorSize - viewportPadding;
  const maxTop = window.innerHeight - indicatorSize - viewportPadding;
  const left = clamp(rect.right - 26, viewportPadding, maxLeft);
  const top = clamp(rect.top + 8, viewportPadding, maxTop);

  indicator.style.left = `${left}px`;
  indicator.style.top = `${top}px`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function showIndicatorPopover(element: HTMLElement, indicator: HTMLElement): void {
  const canApply = canApplySuggestions(element);

  showSuggestionPopover({
    anchor: indicator,
    canApply,
    canUndo: canApply && hasUndoEntry(element),
    providerErrorMessage: providerErrorByElement.get(element) ?? null,
    suggestions: suggestionsByElement.get(element) ?? [],
    onApply: (suggestion) => {
      if (canApply && applySuggestion(element, suggestion)) {
        closeSuggestionPopover();
      }
    },
    onApplyAll: (suggestions) => {
      if (canApply && applySuggestions(element, suggestions)) {
        closeSuggestionPopover();
      }
    },
    onSuggestionBlur: () => clearFocusedIssueCue(element),
    onSuggestionFocus: (suggestion, interaction) =>
      focusIssueCue(element, suggestion, interaction === 'pointer'),
    onUndo: () => {
      if (canApply && undoLastSuggestionApplication(element)) {
        closeSuggestionPopover();
      }
    },
  });
}

function getIndicatorTitle(state: CheckingState, suggestions: TextSuggestion[]): string {
  if (state === 'checking') return 'Inline Grammar is checking this field';
  if (state === 'has-suggestions')
    return `${suggestions.length} Inline Grammar suggestion(s) found`;
  if (state === 'no-suggestions') return 'No Inline Grammar suggestions found';
  if (state === 'provider-error') return 'Inline Grammar provider check failed';
  if (state === 'too-short') return 'Write at least three words for Inline Grammar suggestions';

  return 'Inline Grammar is available for this field';
}
