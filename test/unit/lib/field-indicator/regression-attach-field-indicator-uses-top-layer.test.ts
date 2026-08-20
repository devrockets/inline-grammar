import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { attachFieldIndicator } from '@/lib/field-indicator';

type Sut = {
  indicatorInset: string | null;
  indicatorMargin: string | null;
  indicatorPopover: string | null;
  showPopoverCallCount: number;
};

describe('Given a page can show popovers, when attachFieldIndicator mounts the icon, then it promotes the icon to the top layer', () => {
  let sut: Sut;

  beforeAll(() => {
    const showPopover = vi.fn();

    Object.defineProperty(HTMLButtonElement.prototype, 'showPopover', {
      configurable: true,
      value: showPopover,
    });

    const editor = document.createElement('textarea');
    document.body.append(editor);

    attachFieldIndicator(editor, { reason: 'supported-writing-field', status: 'eligible' });

    const indicator = document.querySelector<HTMLButtonElement>('[data-inline-grammar-indicator]');

    sut = {
      indicatorInset: indicator?.style.inset ?? null,
      indicatorMargin: indicator?.style.margin ?? null,
      indicatorPopover: indicator?.popover ?? null,
      showPopoverCallCount: showPopover.mock.calls.length,
    };
  });

  afterAll(() => {
    Reflect.deleteProperty(HTMLButtonElement.prototype, 'showPopover');
    document.body.replaceChildren();
  });

  it('uses a manual popover', () => {
    expect(sut.indicatorPopover).toBe('manual');
  });

  it('removes the user-agent centered inset', () => {
    expect(sut.indicatorInset).toBe('auto');
  });

  it('removes the user-agent automatic margin', () => {
    expect(sut.indicatorMargin).toBe('0px');
  });

  it('shows the indicator in the top layer', () => {
    expect(sut.showPopoverCallCount).toBe(1);
  });
});
