import { beforeAll, describe, expect, it, vi } from 'vitest';
import { classifyField, shouldShowFieldIndicator } from '@/lib/field-eligibility';

type Sut = {
  cardIndicatorResult: boolean;
  cardResult: ReturnType<typeof classifyField>;
  colorResult: ReturnType<typeof classifyField>;
  hiddenResult: ReturnType<typeof classifyField>;
  passwordResult: ReturnType<typeof classifyField>;
};

describe('Given sensitive and unsupported fields, when classifyField runs, then it ignores them', () => {
  let sut: Sut;

  beforeAll(() => {
    const password = makeVisible(document.createElement('input'));
    const card = makeVisible(document.createElement('input'));
    const hidden = document.createElement('input');
    const color = makeVisible(document.createElement('input'));

    password.type = 'password';
    card.type = 'text';
    card.autocomplete = 'cc-number';
    hidden.type = 'text';
    color.type = 'color';

    const cardResult = classifyField(card);

    sut = {
      cardIndicatorResult: shouldShowFieldIndicator(cardResult),
      cardResult,
      colorResult: classifyField(color),
      hiddenResult: classifyField(hidden),
      passwordResult: classifyField(password),
    };
  });

  it('classifies a password input as sensitive', () => {
    expect(sut.passwordResult).toEqual({ status: 'ignored', reason: 'sensitive' });
  });

  it('classifies a credit card input as sensitive', () => {
    expect(sut.cardResult).toEqual({ status: 'ignored', reason: 'sensitive' });
  });

  it('does not show an indicator for a credit card input', () => {
    expect(sut.cardIndicatorResult).toBe(false);
  });

  it('classifies a hidden text input as hidden', () => {
    expect(sut.hiddenResult).toEqual({ status: 'ignored', reason: 'hidden' });
  });

  it('classifies a color input as unsupported', () => {
    expect(sut.colorResult).toEqual({ status: 'ignored', reason: 'unsupported-type' });
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
