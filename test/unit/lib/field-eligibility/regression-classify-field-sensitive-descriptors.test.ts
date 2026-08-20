import { beforeAll, describe, expect, it, vi } from 'vitest';
import { classifyField } from '@/lib/field-eligibility';

type Sut = {
  apiKeyLabelResult: ReturnType<typeof classifyField>;
  creditCardNameResult: ReturnType<typeof classifyField>;
  verificationPlaceholderResult: ReturnType<typeof classifyField>;
};

describe('Given sensitive writing fields use labels and separator-based names, when classifyField runs, then it ignores those fields', () => {
  let sut: Sut;

  beforeAll(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 40,
      height: 32,
      left: 0,
      right: 200,
      top: 8,
      width: 200,
      x: 0,
      y: 8,
      toJSON: () => '',
    } as DOMRect);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      display: 'block',
      visibility: 'visible',
    } as CSSStyleDeclaration);

    const creditCardName = document.createElement('input');
    creditCardName.name = 'credit_card_number';

    const verificationPlaceholder = document.createElement('input');
    verificationPlaceholder.placeholder = 'Enter verification code';

    const label = document.createElement('label');
    const apiKey = document.createElement('textarea');
    label.textContent = 'API key';
    label.append(apiKey);
    document.body.append(label);

    sut = {
      apiKeyLabelResult: classifyField(apiKey),
      creditCardNameResult: classifyField(creditCardName),
      verificationPlaceholderResult: classifyField(verificationPlaceholder),
    };
  });

  it('ignores underscore-separated credit-card names', () => {
    expect(sut.creditCardNameResult).toEqual({ reason: 'sensitive', status: 'ignored' });
  });

  it('ignores verification-code placeholders', () => {
    expect(sut.verificationPlaceholderResult).toEqual({ reason: 'sensitive', status: 'ignored' });
  });

  it('ignores sensitive associated-label text', () => {
    expect(sut.apiKeyLabelResult).toEqual({ reason: 'sensitive', status: 'ignored' });
  });
});
