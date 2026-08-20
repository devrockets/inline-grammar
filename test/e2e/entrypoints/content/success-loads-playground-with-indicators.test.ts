import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, chromium, expect, type Page, test } from '@playwright/test';

type Sut = {
  context: BrowserContext;
  eligibleIndicatorCount: number;
  ineligibleIndicatorCount: number;
  totalIndicatorCount: number;
};

const extensionPath = path.resolve('.output/chrome-mv3');
const playgroundUrl = pathToFileURL(
  path.resolve('test/global-fixtures/playground.html'),
).toString();

test.describe('Given the built extension and playground fixture, when the playground loads, then field indicators match eligibility', () => {
  let sut: Sut;

  test.beforeAll(async () => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });

    const page = await openPlaygroundPage(context);
    const indicators = page.locator('[data-inline-grammar-indicator]');

    await indicators.first().waitFor();

    sut = {
      context,
      eligibleIndicatorCount: await page
        .locator('[data-inline-grammar-indicator="eligible"]')
        .count(),
      ineligibleIndicatorCount: await page
        .locator('[data-inline-grammar-indicator="ineligible"]')
        .count(),
      totalIndicatorCount: await indicators.count(),
    };
  });

  test.afterAll(async () => {
    await sut.context.close();
  });

  test('successfully renders eligible indicators for editable writing fields', () => {
    expect(sut.eligibleIndicatorCount).toBe(4);
  });

  test('successfully renders ineligible indicators for readonly and disabled writing fields', () => {
    expect(sut.ineligibleIndicatorCount).toBe(2);
  });

  test('successfully ignores sensitive fields without rendering indicators', () => {
    expect(sut.totalIndicatorCount).toBe(6);
  });
});

async function openPlaygroundPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();

  await page.goto(playgroundUrl);

  return page;
}
