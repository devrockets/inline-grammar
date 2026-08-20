import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, chromium, expect, type Page, test } from '@playwright/test';

type Sut = {
  context: BrowserContext;
  indicatorCountAfterAttach: number;
  indicatorCountAfterDetach: number;
};

const extensionPath = path.resolve('.output/chrome-mv3');
const playgroundUrl = pathToFileURL(
  path.resolve('test/global-fixtures/playground.html'),
).toString();

test.describe('Given an SPA dynamically removes an eligible field, when the MutationObserver receives the removal, then Inline Grammar removes the detached field indicator', () => {
  let sut: Sut;
  let context: BrowserContext | undefined;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    const page = await openPlaygroundPage(context);
    const indicatorCountBeforeAttach = await page
      .locator('[data-inline-grammar-indicator]')
      .count();

    await page.evaluate(() => {
      const container = document.createElement('section');
      const input = document.createElement('input');

      container.dataset.testid = 'spa-dynamic-container';
      input.dataset.testid = 'spa-dynamic-input';
      input.type = 'text';
      input.value = 'This are a dynamic SPA field.';
      container.append(input);
      document.querySelector('main')?.append(container);
    });
    await page.waitForFunction(
      (expectedCount) =>
        document.querySelectorAll('[data-inline-grammar-indicator]').length === expectedCount,
      indicatorCountBeforeAttach + 1,
    );

    const indicatorCountAfterAttach = await page.locator('[data-inline-grammar-indicator]').count();

    await page.getByTestId('spa-dynamic-container').evaluate((element) => element.remove());
    await page.waitForFunction(
      (expectedCount) =>
        document.querySelectorAll('[data-inline-grammar-indicator]').length === expectedCount,
      indicatorCountBeforeAttach,
    );

    sut = {
      context,
      indicatorCountAfterAttach,
      indicatorCountAfterDetach: await page.locator('[data-inline-grammar-indicator]').count(),
    };
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('successfully attaches an indicator for the dynamic SPA field', () => {
    expect(sut.indicatorCountAfterAttach).toBe(7);
  });

  test('successfully removes the indicator after the SPA field detaches', () => {
    expect(sut.indicatorCountAfterDetach).toBe(6);
  });
});

async function openPlaygroundPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();

  await page.goto(playgroundUrl);

  return page;
}
