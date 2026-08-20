import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, chromium, expect, type Page, test } from '@playwright/test';

type Sut = {
  context: BrowserContext;
  editorText: string;
  highlightRegistryHasCue: boolean;
  issueCue: string | undefined;
};

const extensionPath = path.resolve('.output/chrome-mv3');
const playgroundUrl = pathToFileURL(
  path.resolve('test/global-fixtures/playground.html'),
).toString();

test.describe('Given a contenteditable editor with a grammar suggestion, when apply runs, then it updates text while keeping the highlight cue available', () => {
  let sut: Sut;
  let context: BrowserContext | undefined;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    const page = await openPlaygroundPage(context);
    const fieldId = await waitForFieldId(page, 'contenteditable-editor');
    const indicator = page.locator(
      `[data-inline-grammar-indicator][data-inline-grammar-field-id="${fieldId}"]`,
    );

    await waitForSuggestionCount(page, fieldId, '1');
    const issueCue = await page.getByTestId('contenteditable-editor').evaluate((element) => {
      if (!(element instanceof HTMLElement)) return undefined;

      return element.dataset.inlineGrammarIssueCue;
    });
    const highlightRegistryHasCue = await page.evaluate(() => {
      const cssWithHighlights = CSS as typeof CSS & {
        highlights?: { has: (name: string) => boolean };
      };

      return cssWithHighlights.highlights?.has('inline-grammar-issues') ?? false;
    });

    await indicator.click();
    await page.locator('[data-inline-grammar-popover]').waitFor();
    await page.getByRole('button', { name: 'Apply' }).click();

    sut = {
      context,
      editorText: await page
        .getByTestId('contenteditable-editor')
        .evaluate((element) => (element.textContent ?? '').trim().replace(/\s+/g, ' ')),
      highlightRegistryHasCue,
      issueCue,
    };
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('successfully marks the contenteditable editor with an issue cue', () => {
    expect(sut.issueCue).toBe('true');
  });

  test('successfully registers a text highlight cue', () => {
    expect(sut.highlightRegistryHasCue).toBe(true);
  });

  test('successfully applies the contenteditable suggestion', () => {
    expect(sut.editorText).toContain('This is a editable area');
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
