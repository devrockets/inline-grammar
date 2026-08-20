import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { attachFieldIndicator } from '@/lib/field-indicator';

type Sut = {
  ariaExpanded: string | null;
  ariaHasPopup: string | null;
  height: string | null;
  width: string | null;
};

describe('Given an eligible writing field, when its indicator is attached, then it exposes an accessible dialog control', () => {
  let sut: Sut;

  beforeAll(() => {
    const input = document.createElement('input');
    document.body.append(input);
    attachFieldIndicator(input, { reason: 'supported-writing-field', status: 'eligible' });

    const indicator = document.querySelector<HTMLElement>('[data-inline-grammar-indicator]');

    sut = {
      ariaExpanded: indicator?.getAttribute('aria-expanded') ?? null,
      ariaHasPopup: indicator?.getAttribute('aria-haspopup') ?? null,
      height: indicator?.style.height ?? null,
      width: indicator?.style.width ?? null,
    };
  });

  afterAll(() => {
    document.body.replaceChildren();
  });

  it('identifies the controlled popup as a dialog', () => {
    expect(sut.ariaHasPopup).toBe('dialog');
  });

  it('starts in the collapsed state', () => {
    expect(sut.ariaExpanded).toBe('false');
  });

  it('uses a 24-pixel target width', () => {
    expect(sut.width).toBe('24px');
  });

  it('uses a 24-pixel target height', () => {
    expect(sut.height).toBe('24px');
  });
});
