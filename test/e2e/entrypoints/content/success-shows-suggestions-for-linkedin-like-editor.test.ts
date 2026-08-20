import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, chromium, expect, type Page, test } from '@playwright/test';

type Sut = {
  context: BrowserContext;
  editorHtml: string;
  editorText: string;
  highlightedTextOnHover: string;
  suggestionCount: string | null;
};

const extensionPath = path.resolve('.output/chrome-mv3');
const playgroundUrl = pathToFileURL(
  path.resolve('test/global-fixtures/playground.html'),
).toString();

test.describe('Given a LinkedIn-like nested contenteditable editor with grammar issues, when apply all runs, then suggestions are applied without flattening markup', () => {
  let sut: Sut;
  let context: BrowserContext | undefined;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    const page = await openPlaygroundPage(context);
    const fieldId = await waitForFieldId(page, 'linkedin-like-editor');
    const indicator = page.locator(
      `[data-inline-grammar-indicator][data-inline-grammar-field-id="${fieldId}"]`,
    );

    await waitForSuggestionCount(page, fieldId, '3');
    const suggestionCount = await indicator.getAttribute('data-inline-grammar-suggestion-count');
    await indicator.click();
    await page.locator('[data-inline-grammar-popover]').waitFor();
    await page.locator('[data-inline-grammar-suggestion-index="1"]').hover();
    const highlightedTextOnHover = await page.evaluate(() => {
      const highlights = (
        CSS as typeof CSS & {
          highlights?: { get: (name: string) => Set<Range> | undefined };
        }
      ).highlights;
      const activeHighlight = highlights?.get('inline-grammar-active-issue');

      return activeHighlight ? ([...activeHighlight][0]?.toString() ?? '') : '';
    });
    await page.getByRole('button', { name: 'Apply all' }).click();

    sut = {
      context,
      editorHtml: await page
        .getByTestId('linkedin-like-editor')
        .evaluate((element) => element.innerHTML),
      editorText: await page
        .getByTestId('linkedin-like-editor')
        .evaluate((element) => (element.textContent ?? '').trim().replace(/\s+/g, ' ')),
      highlightedTextOnHover,
      suggestionCount,
    };
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('successfully tracks suggestions for the nested editor', () => {
    expect(sut.suggestionCount).toBe('3');
  });

  test('successfully applies every suggestion to the editor text', () => {
    expect(sut.editorText).toContain(
      "This is a draft post with there are a grammar issue. let's keep this second line visible like a real LinkedIn post.",
    );
  });

  test('successfully preserves nested paragraph markup', () => {
    expect(sut.editorHtml).toContain('<p>');
  });

  test('temporarily highlights the corresponding editor text on hover', () => {
    expect(sut.highlightedTextOnHover).toBe('their is');
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
