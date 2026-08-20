import type { TextSuggestion } from './mock-provider';

const popoverAttribute = 'data-inline-grammar-popover';
let activePopover: HTMLElement | null = null;
let activeSuggestionCleanup: (() => void) | null = null;
let activeAnchor: HTMLElement | null = null;
let nextPopoverId = 1;

export type SuggestionPopoverOptions = {
  anchor: HTMLElement;
  canApply: boolean;
  providerErrorMessage: string | null;
  suggestions: TextSuggestion[];
  onApply: (suggestion: TextSuggestion) => void;
  onApplyAll: (suggestions: TextSuggestion[]) => void;
  onSuggestionBlur: () => void;
  onSuggestionFocus: (suggestion: TextSuggestion, interaction: 'keyboard' | 'pointer') => void;
  canUndo: boolean;
  onUndo: () => void;
};

export function showSuggestionPopover({
  anchor,
  canApply,
  providerErrorMessage,
  suggestions,
  onApply,
  onApplyAll,
  onSuggestionBlur,
  onSuggestionFocus,
  canUndo,
  onUndo,
}: SuggestionPopoverOptions): void {
  closeSuggestionPopover();

  const popover = document.createElement('section');
  popover.id = `inline-grammar-suggestions-${nextPopoverId}`;
  nextPopoverId += 1;
  popover.setAttribute(popoverAttribute, 'true');
  popover.setAttribute('aria-label', 'Inline Grammar suggestions');
  popover.setAttribute('role', 'dialog');
  popover.style.background = '#18181b';
  popover.style.border = '1px solid #3f3f46';
  popover.style.borderRadius = '8px';
  popover.style.boxShadow = '0 16px 40px rgb(24 24 27 / 24%)';
  popover.style.boxSizing = 'border-box';
  popover.style.color = '#f4f4f5';
  popover.style.font = '13px/1.4 system-ui, sans-serif';
  popover.style.maxWidth = '320px';
  popover.style.minWidth = '240px';
  popover.style.padding = '10px';
  popover.style.zIndex = '2147483647';

  if (suggestions.length === 0) {
    popover.append(
      createEmptyState({
        canUndo,
        onUndo,
        providerErrorMessage,
      }),
    );
  } else {
    popover.append(
      createSuggestionList({
        canApply,
        canUndo,
        onApply,
        onApplyAll,
        onSuggestionBlur,
        onSuggestionFocus,
        onUndo,
        suggestions,
      }),
    );
  }

  getPopoverMountRoot(anchor).append(popover);
  activePopover = popover;
  activeAnchor = anchor;
  activeSuggestionCleanup = onSuggestionBlur;
  anchor.setAttribute('aria-controls', popover.id);
  anchor.setAttribute('aria-expanded', 'true');
  const isTopLayerPopover = showPopoverInTopLayer(popover);
  popover.style.position = isTopLayerPopover ? 'fixed' : 'absolute';
  positionPopover(anchor, popover, isTopLayerPopover);

  window.addEventListener('keydown', closeOnEscape);
  window.addEventListener('pointerdown', closeOnOutsidePointerDown, true);
  window.addEventListener('scroll', closeOnExternalScroll, true);
  window.addEventListener('resize', closeOnResize);
}

function getPopoverMountRoot(anchor: HTMLElement): HTMLElement {
  return (
    anchor.closest<HTMLElement>('dialog[open], [role="dialog"], [aria-modal="true"]') ??
    document.body
  );
}

function showPopoverInTopLayer(popover: HTMLElement): boolean {
  if (typeof popover.showPopover !== 'function') return false;

  popover.popover = 'manual';
  popover.style.inset = 'auto';
  popover.style.margin = '0';
  popover.showPopover();

  return true;
}

export function closeSuggestionPopover(restoreFocus = false): void {
  if (!activePopover) return;

  const anchor = activeAnchor;
  activePopover.remove();
  activePopover = null;
  activeAnchor = null;
  anchor?.setAttribute('aria-expanded', 'false');
  anchor?.removeAttribute('aria-controls');
  activeSuggestionCleanup?.();
  activeSuggestionCleanup = null;
  window.removeEventListener('keydown', closeOnEscape);
  window.removeEventListener('pointerdown', closeOnOutsidePointerDown, true);
  window.removeEventListener('scroll', closeOnExternalScroll, true);
  window.removeEventListener('resize', closeOnResize);

  if (restoreFocus && anchor?.isConnected) {
    anchor.focus({ preventScroll: true });
  }
}

function createEmptyState({
  canUndo,
  onUndo,
  providerErrorMessage,
}: Pick<SuggestionPopoverOptions, 'canUndo' | 'onUndo'> & {
  providerErrorMessage: string | null;
}): HTMLElement {
  const container = document.createElement('div');
  container.style.display = 'grid';
  container.style.gap = '8px';

  const message = document.createElement('p');
  message.textContent = providerErrorMessage ?? 'No suggestions available.';
  message.style.color = providerErrorMessage ? '#fdba74' : '#d4d4d8';
  message.style.margin = '0';

  container.append(message);

  if (canUndo) {
    container.append(createUndoButton(onUndo));
  }

  return container;
}

function createSuggestionList({
  canApply,
  canUndo,
  suggestions,
  onApply,
  onApplyAll,
  onSuggestionBlur,
  onSuggestionFocus,
  onUndo,
}: Omit<SuggestionPopoverOptions, 'anchor' | 'providerErrorMessage'>): HTMLElement {
  const container = document.createElement('div');
  container.style.display = 'grid';
  container.style.gap = '8px';

  if (canApply && suggestions.length > 1) {
    const applyAllButton = createButton('Apply all');
    applyAllButton.addEventListener('click', () => onApplyAll(suggestions));
    container.append(applyAllButton);
  }

  const list = document.createElement('div');
  list.style.display = 'grid';
  list.style.gap = '8px';

  suggestions.forEach((suggestion, index) => {
    const item = document.createElement('article');
    item.dataset.inlineGrammarSuggestionIndex = String(index + 1);
    item.style.border = '1px solid #3f3f46';
    item.style.borderRadius = '6px';
    item.style.padding = '8px';
    const heading = document.createElement('div');
    heading.style.alignItems = 'start';
    heading.style.display = 'flex';
    heading.style.gap = '7px';

    const marker = document.createElement('span');
    marker.dataset.inlineGrammarSuggestionMarker = String(index + 1);
    marker.setAttribute('aria-label', `Suggestion ${index + 1}`);
    marker.textContent = String(index + 1);
    marker.style.alignItems = 'center';
    marker.style.background = '#d4d4d8';
    marker.style.borderRadius = '999px';
    marker.style.color = '#18181b';
    marker.style.display = 'inline-flex';
    marker.style.flex = '0 0 auto';
    marker.style.font = '700 11px/1 system-ui, sans-serif';
    marker.style.height = '20px';
    marker.style.justifyContent = 'center';
    marker.style.width = '20px';

    const message = document.createElement('p');
    message.textContent = suggestion.message;
    message.style.margin = '1px 0 8px';

    heading.append(marker, message);

    const comparison = document.createElement('div');
    comparison.style.display = 'grid';
    comparison.style.gap = '6px';

    const original = createComparisonRow('Current', suggestion.original, '#fecaca', '#7f1d1d');
    const replacement = createComparisonRow(
      'Suggested',
      suggestion.replacement,
      '#bbf7d0',
      '#14532d',
    );

    comparison.append(original, replacement);

    item.append(heading, comparison);
    attachSuggestionFocusCue(item, suggestion, onSuggestionFocus, onSuggestionBlur);

    if (canApply) {
      const applyButton = createButton('Apply');
      applyButton.addEventListener('click', () => onApply(suggestion));
      applyButton.style.marginTop = '8px';
      item.append(applyButton);
    }

    list.append(item);
  });

  container.append(list);

  if (canUndo) {
    container.append(createUndoButton(onUndo));
  }

  if (!canApply) {
    const unsupportedMessage = document.createElement('p');
    unsupportedMessage.textContent = 'Applying suggestions is not supported for this field yet.';
    unsupportedMessage.style.color = '#a1a1aa';
    unsupportedMessage.style.margin = '0';
    container.append(unsupportedMessage);
  }

  return container;
}

function attachSuggestionFocusCue(
  item: HTMLElement,
  suggestion: TextSuggestion,
  onSuggestionFocus: (suggestion: TextSuggestion, interaction: 'keyboard' | 'pointer') => void,
  onSuggestionBlur: () => void,
): void {
  function activate(interaction: 'keyboard' | 'pointer'): void {
    item.style.background = 'rgba(56, 189, 248, 0.1)';
    item.style.borderColor = '#38bdf8';
    onSuggestionFocus(suggestion, interaction);
  }

  function deactivate(): void {
    item.style.background = '';
    item.style.borderColor = '#3f3f46';
    onSuggestionBlur();
  }

  item.addEventListener('pointerenter', () => activate('pointer'));
  item.addEventListener('pointerleave', () => {
    if (!item.contains(document.activeElement)) deactivate();
  });
  item.addEventListener('focusin', () => activate('keyboard'));
  item.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node) || !item.contains(event.relatedTarget)) deactivate();
  });
}

function createComparisonRow(
  label: string,
  value: string,
  color: string,
  background: string,
): HTMLElement {
  const row = document.createElement('div');
  row.style.display = 'grid';
  row.style.gap = '2px';

  const rowLabel = document.createElement('span');
  rowLabel.textContent = label;
  rowLabel.style.color = '#a1a1aa';
  rowLabel.style.font = '700 10px/1.2 system-ui, sans-serif';
  rowLabel.style.letterSpacing = '0.04em';
  rowLabel.style.textTransform = 'uppercase';

  const text = document.createElement('span');
  text.textContent = value;
  text.style.background = background;
  text.style.borderRadius = '4px';
  text.style.color = color;
  text.style.overflowWrap = 'anywhere';
  text.style.padding = '5px 6px';

  row.append(rowLabel, text);
  return row;
}

function createButton(label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = label;
  button.type = 'button';
  button.style.background = '#0369a1';
  button.style.border = '0';
  button.style.borderRadius = '6px';
  button.style.color = '#ffffff';
  button.style.cursor = 'pointer';
  button.style.font = '600 12px/1 system-ui, sans-serif';
  button.style.padding = '7px 9px';

  return button;
}

function createUndoButton(onUndo: () => void): HTMLButtonElement {
  const button = createButton('Undo');
  button.addEventListener('click', onUndo);
  button.style.background = '#3f3f46';

  return button;
}

function positionPopover(
  anchor: HTMLElement,
  popover: HTMLElement,
  isTopLayerPopover: boolean,
): void {
  const anchorRect = anchor.getBoundingClientRect();
  const viewportPadding = 8;
  const anchorGap = 8;
  const viewportOffsetX = isTopLayerPopover ? 0 : window.scrollX;
  const viewportOffsetY = isTopLayerPopover ? 0 : window.scrollY;
  const availableBelow = window.innerHeight - anchorRect.bottom - viewportPadding - anchorGap;
  const availableAbove = anchorRect.top - viewportPadding - anchorGap;

  popover.style.maxHeight = `${Math.max(120, Math.max(availableBelow, availableAbove))}px`;
  popover.style.overflowY = 'auto';

  const popoverRect = popover.getBoundingClientRect();
  const shouldOpenAbove = availableBelow < popoverRect.height && availableAbove > availableBelow;
  const top = shouldOpenAbove
    ? viewportOffsetY + anchorRect.top - popoverRect.height - anchorGap
    : viewportOffsetY + anchorRect.bottom + anchorGap;
  const unclampedLeft = viewportOffsetX + anchorRect.left;
  const minLeft = viewportOffsetX + viewportPadding;
  const maxLeft = viewportOffsetX + window.innerWidth - popoverRect.width - viewportPadding;
  const left = Math.min(Math.max(unclampedLeft, minLeft), maxLeft);

  popover.style.left = `${left}px`;
  popover.style.top = `${Math.max(viewportOffsetY + viewportPadding, top)}px`;
}

function closeOnEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeSuggestionPopover(true);
  }
}

function closeOnOutsidePointerDown(event: PointerEvent): void {
  if (!activePopover) return;

  const target = event.target;

  if (target instanceof Node && activePopover.contains(target)) return;

  closeSuggestionPopover();
}

function closeOnExternalScroll(event: Event): void {
  if (!activePopover) return;

  const target = event.target;

  if (target instanceof Node && activePopover.contains(target)) return;

  closeSuggestionPopover();
}

function closeOnResize(): void {
  closeSuggestionPopover();
}
