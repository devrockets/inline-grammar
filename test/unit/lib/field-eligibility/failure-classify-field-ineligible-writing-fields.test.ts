import { beforeAll, describe, expect, it, vi } from 'vitest';
import { classifyField, shouldShowFieldIndicator } from '@/lib/field-eligibility';

type Sut = {
  disabledTextareaIndicatorResult: boolean;
  disabledTextareaResult: ReturnType<typeof classifyField>;
  readonlyInputIndicatorResult: boolean;
  readonlyInputResult: ReturnType<typeof classifyField>;
};

describe('Given unavailable writing fields, when classifyField runs, then it marks them ineligible', () => {
  let sut: Sut;

  beforeAll(() => {
    const readonlyInput = makeVisible(document.createElement('input'));
    const disabledTextarea = makeVisible(document.createElement('textarea'));

    readonlyInput.type = 'text';
    readonlyInput.readOnly = true;
    disabledTextarea.disabled = true;

    const readonlyInputResult = classifyField(readonlyInput);
    const disabledTextareaResult = classifyField(disabledTextarea);

    sut = {
      disabledTextareaIndicatorResult: shouldShowFieldIndicator(disabledTextareaResult),
      disabledTextareaResult,
      readonlyInputIndicatorResult: shouldShowFieldIndicator(readonlyInputResult),
      readonlyInputResult,
    };
  });

  it('classifies a readonly input as ineligible', () => {
    expect(sut.readonlyInputResult).toEqual({ status: 'ineligible', reason: 'readonly' });
  });

  it('shows an indicator for a readonly input', () => {
    expect(sut.readonlyInputIndicatorResult).toBe(true);
  });

  it('classifies a disabled textarea as ineligible', () => {
    expect(sut.disabledTextareaResult).toEqual({ status: 'ineligible', reason: 'disabled' });
  });

  it('shows an indicator for a disabled textarea', () => {
    expect(sut.disabledTextareaIndicatorResult).toBe(true);
  });
});

function makeVisible<TElement extends HTMLElement>(element: TElement): TElement {
  element.getBoundingClientRect = vi.fn(
    () =>
      ({
        bottom: 40,
        height: 32,
        left: 0,
        right: 200,
        top: 8,
        width: 200,
        x: 0,
        y: 8,
        toJSON: () => '',
      }) as DOMRect,
  );

  return element;
}
