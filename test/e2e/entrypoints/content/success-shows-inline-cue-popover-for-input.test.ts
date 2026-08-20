import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, chromium, expect, type Page, test } from '@playwright/test';

type Sut = {
  applyAllButtonCount: number;
  context: BrowserContext;
  issueCue: string | undefined;
  currentLabels: number;
  popoverText: string;
  selectedTextOnHover: string;
  suggestionMarkers: string[];
  suggestedLabels: number;
  suggestionCount: string | null;
};

const extensionPath = path.resolve('.output/chrome-mv3');
const playgroundUrl = pathToFileURL(
  path.resolve('test/global-fixtures/playground.html'),
).toString();

test.describe('Given a regular input with multiple grammar suggestions, when the indicator opens, then the inline cue popover shows actionable suggestions', () => {
  let sut: Sut;
  let context: BrowserContext | undefined;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    const page = await openPlaygroundPage(context);
    const fieldId = await waitForFieldId(page, 'plain-input');
    const indicator = page.locator(
      `[data-inline-grammar-indicator][data-inline-grammar-field-id="${fieldId}"]`,
    );

    await waitForSuggestionCount(page, fieldId, '2');
    await indicator.click();
    await page.locator('[data-inline-grammar-popover]').waitFor();
    await page.locator('[data-inline-grammar-suggestion-index="1"]').hover();
    const selectedTextOnHover = await page.getByTestId('plain-input').evaluate((element) => {
      if (!(element instanceof HTMLInputElement)) return '';

      return element.value.slice(element.selectionStart ?? 0, element.selectionEnd ?? 0);
    });

    sut = {
      applyAllButtonCount: await page.getByRole('button', { name: 'Apply all' }).count(),
      context,
      currentLabels: await page.getByText('Current', { exact: true }).count(),
      issueCue: await page.getByTestId('plain-input').evaluate((element) => {
        if (!(element instanceof HTMLElement)) return undefined;

        return element.dataset.inlineGrammarIssueCue;
      }),
      popoverText: (await page.locator('[data-inline-grammar-popover]').textContent()) ?? '',
      selectedTextOnHover,
      suggestionMarkers: await page
        .locator('[data-inline-grammar-suggestion-marker]')
        .allTextContents(),
      suggestionCount: await indicator.getAttribute('data-inline-grammar-suggestion-count'),
      suggestedLabels: await page.getByText('Suggested', { exact: true }).count(),
    };
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('successfully marks the input with an issue cue', () => {
    expect(sut.issueCue).toBe('true');
  });

  test('successfully tracks multiple suggestions on the indicator', () => {
    expect(sut.suggestionCount).toBe('2');
  });

  test('successfully shows the agreement suggestion in the popover', () => {
    expect(sut.popoverText).toContain('Use plural agreement with the subject.');
  });

  test('successfully shows the contraction suggestion in the popover', () => {
    expect(sut.popoverText).toContain('Use the contraction for "let us".');
  });

  test('successfully offers apply all for multiple suggestions', () => {
    expect(sut.applyAllButtonCount).toBe(1);
  });

  test('visually numbers each suggestion', () => {
    expect(sut.suggestionMarkers).toEqual(['1', '2']);
  });

  test('visually separates current and suggested text', () => {
    expect(sut.currentLabels).toBe(2);
    expect(sut.suggestedLabels).toBe(2);
  });

  test('temporarily selects the corresponding native input text on hover', () => {
    expect(sut.selectedTextOnHover).toBe('lets');
  });
});

async function openPlaygroundPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();

  await page.goto(playgroundUrl);

  return page;
}

async function waitForFieldId(page: Page, testId: string): Promise<string> {
  await page.waitForFunction(
    (targetTestId) =>
      document
        .querySelector(`[data-testid="${targetTestId}"]`)
        ?.getAttribute('data-inline-grammar-field-id') !== null,
    testId,
  );

  const fieldId = await page.getByTestId(testId).getAttribute('data-inline-grammar-field-id');

  if (!fieldId) {
    throw new Error(`Inline Grammar field id was not available for ${testId}`);
  }

  return fieldId;
}

async function waitForSuggestionCount(
  page: Page,
  fieldId: string,
  expectedSuggestionCount: string,
): Promise<void> {
  await page
    .locator(`[data-inline-grammar-field-id="${fieldId}"]:not([data-inline-grammar-indicator])`)
    .dispatchEvent('input');

  await page.waitForFunction(
    ([targetFieldId, suggestionCount]) =>
      document
        .querySelector(
          `[data-inline-grammar-indicator][data-inline-grammar-field-id="${targetFieldId}"]`,
        )
        ?.getAttribute('data-inline-grammar-suggestion-count') === suggestionCount,
    [fieldId, expectedSuggestionCount] as const,
  );
}
