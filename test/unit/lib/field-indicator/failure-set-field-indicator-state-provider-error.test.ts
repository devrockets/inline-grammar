import { beforeAll, describe, expect, it } from 'vitest';
import { attachFieldIndicator, setFieldIndicatorState } from '@/lib/field-indicator';

type Sut = {
  indicatorState: string | null;
  indicatorText: string | null;
  popoverText: string | null;
};

describe('Given a field indicator receives a provider error, when the indicator is opened, then it shows the provider failure message', () => {
  let sut: Sut;

  beforeAll(() => {
    const input = document.createElement('input');
    document.body.append(input);

    attachFieldIndicator(input, { reason: 'supported-writing-field', status: 'eligible' });
    setFieldIndicatorState(input, 'provider-error', [], 'Gemini check timed out.');

    const indicator = document.querySelector<HTMLElement>('[data-inline-grammar-indicator]');
    indicator?.click();

    sut = {
      indicatorState: indicator?.dataset.inlineGrammarState ?? null,
      indicatorText: indicator?.textContent ?? null,
      popoverText:
        document.querySelector<HTMLElement>('[data-inline-grammar-popover]')?.textContent ?? null,
    };
  });

  it('marks the indicator with the provider error state', () => {
    expect(sut.indicatorState).toBe('provider-error');
  });

  it('uses the provider error indicator label', () => {
    expect(sut.indicatorText).toBe('!');
  });

  it('shows the provider failure message in the popover', () => {
    expect(sut.popoverText).toContain('Gemini check timed out.');
  });
});
