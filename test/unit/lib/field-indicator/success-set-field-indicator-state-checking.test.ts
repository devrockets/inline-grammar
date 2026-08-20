import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { attachFieldIndicator, setFieldIndicatorState } from '@/lib/field-indicator';

type Sut = {
  animationCancelCalls: number;
  animationCalls: number;
  busyAfterCompletion: string | null;
  busyWhileChecking: string | null;
  labelWhileChecking: string | null;
  textAfterCompletion: string | null;
  textWhileChecking: string | null;
};

describe('Given Gemini is checking a field, when its indicator state changes, then it shows and clears an accessible progress animation', () => {
  let sut: Sut;

  beforeAll(() => {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel }) as unknown as Animation);

    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: animate,
    });

    const input = document.createElement('input');
    document.body.append(input);
    attachFieldIndicator(input, { reason: 'supported-writing-field', status: 'eligible' });
    setFieldIndicatorState(input, 'checking', []);

    const indicator = document.querySelector<HTMLElement>('[data-inline-grammar-indicator]');
    const busyWhileChecking = indicator?.getAttribute('aria-busy') ?? null;
    const labelWhileChecking = indicator?.getAttribute('aria-label') ?? null;
    const textWhileChecking = indicator?.textContent ?? null;

    setFieldIndicatorState(input, 'no-suggestions', []);

    sut = {
      animationCancelCalls: cancel.mock.calls.length,
      animationCalls: animate.mock.calls.length,
      busyAfterCompletion: indicator?.getAttribute('aria-busy') ?? null,
      busyWhileChecking,
      labelWhileChecking,
      textAfterCompletion: indicator?.textContent ?? null,
      textWhileChecking,
    };
  });

  afterAll(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
    document.body.replaceChildren();
  });

  it('marks the indicator as busy while checking', () => {
    expect(sut.busyWhileChecking).toBe('true');
  });

  it('uses a checking-specific accessible label', () => {
    expect(sut.labelWhileChecking).toBe('Inline Grammar is checking this field');
  });

  it('shows the rotating progress symbol', () => {
    expect(sut.textWhileChecking).toBe('↻');
    expect(sut.animationCalls).toBe(1);
  });

  it('clears progress when checking finishes', () => {
    expect(sut.busyAfterCompletion).toBeNull();
    expect(sut.textAfterCompletion).toBe('i');
    expect(sut.animationCancelCalls).toBe(1);
  });
});
