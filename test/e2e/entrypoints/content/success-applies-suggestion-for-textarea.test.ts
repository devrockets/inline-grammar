import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, chromium, expect, type Page, test } from '@playwright/test';

type Sut = {
  context: BrowserContext;
  textareaValue: string;
};

const extensionPath = path.resolve('.output/chrome-mv3');
const playgroundUrl = pathToFileURL(
  path.resolve('test/global-fixtures/playground.html'),
).toString();

test.describe('Given a textarea with a grammar suggestion, when apply runs, then it updates the textarea value', () => {
  let sut: Sut;
  let context: BrowserContext | undefined;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    const page = await openPlaygroundPage(context);
    const fieldId = await waitForFieldId(page, 'message-textarea');
    const indicator = page.locator(
      `[data-inline-grammar-indicator][data-inline-grammar-field-id="${fieldId}"]`,
    );

    await waitForSuggestionCount(page, fieldId, '1');
    await indicator.click();
    await page.locator('[data-inline-grammar-popover]').waitFor();
    await page.getByRole('button', { name: 'Apply' }).click();

    sut = {
      context,
      textareaValue: await page.getByTestId('message-textarea').inputValue(),
    };
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('successfully applies the textarea suggestion', () => {
    expect(sut.textareaValue).toContain('there are a few things');
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
