import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, chromium, expect, type Page, test } from '@playwright/test';

type Sut = {
  applyButtonCount: number;
  context: BrowserContext;
  popoverText: string;
  suggestionCount: string | null;
};

const extensionPath = path.resolve('.output/chrome-mv3');
const playgroundUrl = pathToFileURL(
  path.resolve('test/global-fixtures/playground.html'),
).toString();

test.describe('Given an ineligible readonly field, when the indicator opens, then the popover shows no available suggestions', () => {
  let sut: Sut;
  let context: BrowserContext | undefined;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    const page = await openPlaygroundPage(context);
    const fieldId = await waitForFieldId(page, 'readonly-input');
    const indicator = page.locator(
      `[data-inline-grammar-indicator][data-inline-grammar-field-id="${fieldId}"]`,
    );

    await indicator.focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-inline-grammar-popover]').waitFor();

    sut = {
      applyButtonCount: await page.getByRole('button', { name: /^Apply/ }).count(),
      context,
      popoverText: (await page.locator('[data-inline-grammar-popover]').textContent()) ?? '',
      suggestionCount: await indicator.getAttribute('data-inline-grammar-suggestion-count'),
    };
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('successfully tracks zero suggestions on the indicator', () => {
    expect(sut.suggestionCount).toBe('0');
  });

  test('successfully shows the empty suggestion message', () => {
    expect(sut.popoverText).toContain('No suggestions available.');
  });

  test('successfully hides apply actions', () => {
    expect(sut.applyButtonCount).toBe(0);
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
