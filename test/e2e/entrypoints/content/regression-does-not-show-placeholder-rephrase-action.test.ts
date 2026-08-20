import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, chromium, expect, test } from '@playwright/test';

type Sut = {
  rephraseButtonCountAfterAnalysis: number;
  rephraseButtonCountBeforeAnalysis: number;
};

const extensionPath = path.resolve('.output/chrome-mv3');
const playgroundUrl = pathToFileURL(
  path.resolve('test/global-fixtures/playground.html'),
).toString();

test.describe('Given rephrasing is not backed by an API response, when the suggestion popover opens, then no placeholder rephrase action is offered', () => {
  let sut: Sut;
  let context: BrowserContext | undefined;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    const page = await context.newPage();
    await page.goto(playgroundUrl);

    const input = page.getByTestId('plain-input');
    await expect(input).toHaveAttribute('data-inline-grammar-field-id');
    const fieldId = await input.getAttribute('data-inline-grammar-field-id');

    if (!fieldId) throw new Error('Inline Grammar field id was not available.');

    const indicator = page.locator(
      `[data-inline-grammar-indicator][data-inline-grammar-field-id="${fieldId}"]`,
    );
    await indicator.click();
    await page.locator('[data-inline-grammar-popover]').waitFor();
    const rephraseButtonCountBeforeAnalysis = await page
      .getByRole('button', { name: 'Rephrase sentence' })
      .count();

    await page.keyboard.press('Escape');
    await input.dispatchEvent('input');
    await expect(indicator).toHaveAttribute('data-inline-grammar-suggestion-count', '2');
    await indicator.click();
    await page.locator('[data-inline-grammar-popover]').waitFor();

    sut = {
      rephraseButtonCountAfterAnalysis: await page
        .getByRole('button', { name: 'Rephrase sentence' })
        .count(),
      rephraseButtonCountBeforeAnalysis,
    };
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('does not show a mock rephrase action before analysis', () => {
    expect(sut.rephraseButtonCountBeforeAnalysis).toBe(0);
  });

  test('does not show a mock rephrase action after grammar suggestions arrive', () => {
    expect(sut.rephraseButtonCountAfterAnalysis).toBe(0);
  });
});
