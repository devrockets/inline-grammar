import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, chromium, expect, test } from '@playwright/test';

type Sut = {
  isOverflowing: boolean;
  isPopoverVisibleAfterInternalScroll: boolean;
  scrollTop: number;
};

const extensionPath = path.resolve('.output/chrome-mv3');
const playgroundUrl = pathToFileURL(
  path.resolve('test/global-fixtures/playground.html'),
).toString();

test.describe('Given a suggestion list exceeds the available viewport, when the user scrolls inside it, then the popover remains open', () => {
  let sut: Sut;
  let context: BrowserContext | undefined;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
      viewport: { height: 240, width: 600 },
    });
    const page = await context.newPage();
    await page.goto(playgroundUrl);

    const input = page.getByTestId('plain-input');
    await expect(input).toHaveAttribute('data-inline-grammar-field-id');
    const fieldId = await input.getAttribute('data-inline-grammar-field-id');

    if (!fieldId) throw new Error('Inline Grammar field id was not available.');

    await input.fill('Their is a problem. This are wrong. lets fix what already exists.');

    const indicator = page.locator(
      `[data-inline-grammar-indicator][data-inline-grammar-field-id="${fieldId}"]`,
    );
    await expect(indicator).toHaveAttribute('data-inline-grammar-suggestion-count', '4');
    await indicator.dispatchEvent('click');

    const popover = page.locator('[data-inline-grammar-popover]');
    await popover.waitFor();
    const scrollMetrics = await popover.evaluate((element) => {
      const isOverflowing = element.scrollHeight > element.clientHeight;
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event('scroll'));

      return {
        isOverflowing,
        scrollTop: element.scrollTop,
      };
    });

    sut = {
      ...scrollMetrics,
      isPopoverVisibleAfterInternalScroll: await popover.isVisible(),
    };
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('creates an overflowing suggestion panel for the regression scenario', () => {
    expect(sut.isOverflowing).toBe(true);
  });

  test('scrolls through the suggestion list', () => {
    expect(sut.scrollTop).toBeGreaterThan(0);
  });

  test('keeps the popover open during its own scroll event', () => {
    expect(sut.isPopoverVisibleAfterInternalScroll).toBe(true);
  });
});
