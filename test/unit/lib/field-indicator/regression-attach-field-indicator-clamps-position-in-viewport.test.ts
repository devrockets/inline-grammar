import { beforeAll, describe, expect, it, vi } from 'vitest';
import { attachFieldIndicator } from '@/lib/field-indicator';

type Sut = {
  indicatorLeft: string | null;
  indicatorPosition: string | null;
  indicatorTop: string | null;
};

describe('Given a rich editor sits near the viewport edge, when attachFieldIndicator positions the icon, then it keeps the icon visible in the viewport', () => {
  let sut: Sut;

  beforeAll(() => {
    vi.stubGlobal('innerWidth', 320);
    vi.stubGlobal('innerHeight', 160);

    const editor = document.createElement('div');
    editor.getBoundingClientRect = vi.fn(
      () =>
        ({
          bottom: 180,
          height: 120,
          left: 20,
          right: 390,
          top: 140,
          width: 370,
          x: 20,
          y: 140,
          toJSON: () => '',
        }) as DOMRect,
    );

    attachFieldIndicator(editor, { reason: 'supported-writing-field', status: 'eligible' });

    const indicator = document.querySelector<HTMLElement>('[data-inline-grammar-indicator]');

    sut = {
      indicatorLeft: indicator?.style.left ?? null,
      indicatorPosition: indicator?.style.position ?? null,
      indicatorTop: indicator?.style.top ?? null,
    };
  });

  it('uses fixed positioning', () => {
    expect(sut.indicatorPosition).toBe('fixed');
  });

  it('clamps the indicator left position inside the viewport', () => {
    expect(sut.indicatorLeft).toBe('288px');
  });

  it('clamps the indicator top position inside the viewport', () => {
    expect(sut.indicatorTop).toBe('128px');
  });
});
