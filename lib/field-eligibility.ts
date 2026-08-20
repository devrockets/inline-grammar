export type SupportedField =
  | HTMLTextAreaElement
  | HTMLInputElement
  | (HTMLElement & { isContentEditable: true });

export type FieldEligibility =
  | { status: 'eligible'; reason: 'supported-writing-field' }
  | { status: 'ineligible'; reason: 'readonly' | 'disabled' }
  | { status: 'ignored'; reason: 'hidden' | 'sensitive' | 'unsupported-type' };

const supportedTextInputTypes = new Set(['', 'email', 'search', 'text', 'url']);
const sensitiveAutocompleteTokens = new Set([
  'cc-csc',
  'cc-exp',
  'cc-exp-month',
  'cc-exp-year',
  'cc-family-name',
  'cc-given-name',
  'cc-name',
  'cc-number',
  'cc-type',
  'current-password',
  'new-password',
  'one-time-code',
]);

export function classifyField(element: Element): FieldEligibility {
  if (element instanceof HTMLInputElement && element.type === 'password') {
    return { status: 'ignored', reason: 'sensitive' };
  }

  if (!isCandidateField(element)) {
    return { status: 'ignored', reason: 'unsupported-type' };
  }

  if (isHidden(element)) {
    return { status: 'ignored', reason: 'hidden' };
  }

  if (isSensitiveField(element)) {
    return { status: 'ignored', reason: 'sensitive' };
  }

  if (isDisabled(element)) {
    return { status: 'ineligible', reason: 'disabled' };
  }

  if (isReadonly(element)) {
    return { status: 'ineligible', reason: 'readonly' };
  }

  return { status: 'eligible', reason: 'supported-writing-field' };
}

export function shouldShowFieldIndicator(eligibility: FieldEligibility): boolean {
  return eligibility.status === 'eligible' || eligibility.status === 'ineligible';
}

function isCandidateField(element: Element): element is SupportedField {
  if (element instanceof HTMLTextAreaElement) return true;

  if (element instanceof HTMLInputElement) {
    return supportedTextInputTypes.has(element.type.toLowerCase());
  }

  return element instanceof HTMLElement && isContentEditable(element);
}

function isHidden(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    element.hidden === true ||
    rect.width === 0 ||
    rect.height === 0 ||
    style.display === 'none' ||
    style.visibility === 'hidden'
  );
}

function isSensitiveField(element: SupportedField): boolean {
  if (element instanceof HTMLInputElement) {
    return hasSensitiveAutocomplete(element) || hasSensitiveName(element);
  }

  return hasSensitiveAutocomplete(element) || hasSensitiveName(element);
}

function isDisabled(element: SupportedField): boolean {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.disabled;
  }

  return element.ariaDisabled === 'true';
}

function isReadonly(element: SupportedField): boolean {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.readOnly;
  }

  return element.getAttribute('aria-readonly') === 'true';
}

function hasSensitiveAutocomplete(element: Element): boolean {
  const autocomplete = element.getAttribute('autocomplete');

  if (!autocomplete) return false;

  return autocomplete
    .toLowerCase()
    .split(/\s+/)
    .some((token) => sensitiveAutocompleteTokens.has(token));
}

function hasSensitiveName(element: Element): boolean {
  const labels =
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      ? Array.from(element.labels ?? [], (label) => label.textContent)
      : [element.closest('label')?.textContent];
  const value = [
    element.getAttribute('name'),
    element.getAttribute('id'),
    element.getAttribute('aria-label'),
    element.getAttribute('placeholder'),
    ...labels,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');

  return /\b(card|cc|credit|cvv|cvc|otp|password|passcode|pin|secret|security code|one time code|verification code|authentication code|api key|access token|private key)\b/.test(
    value,
  );
}

function isContentEditable(element: HTMLElement): boolean {
  const contentEditableValue = element.getAttribute('contenteditable')?.toLowerCase();

  return (
    element.isContentEditable ||
    contentEditableValue === '' ||
    contentEditableValue === 'true' ||
    contentEditableValue === 'plaintext-only'
  );
}
