import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { attachFieldIndicator, setFieldIndicatorState } from '@/lib/field-indicator';

type Sut = {
  activeElementAfterEscape: Element | null;
  controlsAfterEscape: string | null;
  controlsWhileOpen: string | null;
  expandedAfterEscape: string | null;
  expandedWhileOpen: string | null;
  indicator: HTMLButtonElement;
  popoverId: string | null;
};

describe('Given a keyboard user opens the suggestion dialog, when Escape closes it, then focus returns to the field indicator', () => {
  let sut: Sut;

  beforeAll(() => {
    const input = document.createElement('input');
    document.body.append(input);
    attachFieldIndicator(input, { reason: 'supported-writing-field', status: 'eligible' });
    setFieldIndicatorState(input, 'has-suggestions', [
      {
        id: 'agreement-1',
        message: 'Use the correct verb.',
        original: 'are',
        range: { end: 7, start: 4 },
        replacement: 'is',
      },
    ]);

    const indicator = document.querySelector<HTMLButtonElement>('[data-inline-grammar-indicator]');

    if (!indicator) throw new Error('Expected the field indicator to exist.');

    indicator.focus();
    indicator.click();

    const popover = document.querySelector<HTMLElement>('[data-inline-grammar-popover]');
    const controlsWhileOpen = indicator.getAttribute('aria-controls');
    const expandedWhileOpen = indicator.getAttribute('aria-expanded');

    popover?.querySelector<HTMLButtonElement>('button')?.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    sut = {
      activeElementAfterEscape: document.activeElement,
      controlsAfterEscape: indicator.getAttribute('aria-controls'),
      controlsWhileOpen,
      expandedAfterEscape: indicator.getAttribute('aria-expanded'),
      expandedWhileOpen,
      indicator,
      popoverId: popover?.id ?? null,
    };
  });

  afterAll(() => {
    document.body.replaceChildren();
  });

  it('marks the indicator as expanded while the dialog is open', () => {
    expect(sut.expandedWhileOpen).toBe('true');
  });

  it('associates the indicator with the open dialog', () => {
    expect(sut.controlsWhileOpen).toBe(sut.popoverId);
  });

  it('marks the indicator as collapsed after Escape', () => {
    expect(sut.expandedAfterEscape).toBe('false');
  });

  it('removes the stale dialog association after Escape', () => {
    expect(sut.controlsAfterEscape).toBeNull();
  });

  it('restores focus to the indicator after Escape', () => {
    expect(sut.activeElementAfterEscape).toBe(sut.indicator);
  });
});
