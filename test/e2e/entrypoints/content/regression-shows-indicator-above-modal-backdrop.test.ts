import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { type BrowserContext, chromium, expect, test } from '@playwright/test';

type Sut = {
  indicatorIsInsideDialog: boolean;
  indicatorIsOpenPopover: boolean;
  indicatorIsTopmost: boolean;
  indicatorPopoverMode: string | null;
  suggestionPanelIsInsideDialog: boolean;
  suggestionPanelIsOpenPopover: boolean;
  suggestionPanelIsTopmost: boolean;
  suggestionPanelPopoverMode: string | null;
};

const extensionPath = path.resolve('.output/chrome-mv3');
const modalPlaygroundUrl = pathToFileURL(
  path.resolve('test/global-fixtures/modal-playground.html'),
).toString();

test.describe('Given a writing field inside a native modal, when Inline Grammar attaches its indicator, then the modal backdrop does not cover the indicator', () => {
  let sut: Sut;
  let context: BrowserContext | undefined;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    const page = await context.newPage();

    await page.goto(modalPlaygroundUrl);
    await expect(page.getByTestId('native-modal')).toBeVisible();
    await expect(page.getByTestId('modal-editor')).toHaveAttribute(
      'data-inline-grammar-field-id',
      /\d+/,
    );

    const fieldId = await page
      .getByTestId('modal-editor')
      .getAttribute('data-inline-grammar-field-id');

    if (!fieldId) {
      throw new Error('Inline Grammar did not attach to the modal textarea');
    }

    const indicator = page.locator(
      `[data-inline-grammar-indicator][data-inline-grammar-field-id="${fieldId}"]`,
    );

    await indicator.waitFor();
    await indicator.click();

    const suggestionPanel = page.locator('[data-inline-grammar-popover]');
    await suggestionPanel.waitFor();

    sut = {
      indicatorIsInsideDialog: await indicator.evaluate(
        (element) => element.closest('dialog') !== null,
      ),
      indicatorIsOpenPopover: await indicator.evaluate((element) =>
        element.matches(':popover-open'),
      ),
      indicatorIsTopmost: await indicator.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const elementAtIndicatorCenter = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );

        return elementAtIndicatorCenter === element;
      }),
      indicatorPopoverMode: await indicator.getAttribute('popover'),
      suggestionPanelIsInsideDialog: await suggestionPanel.evaluate(
        (element) => element.closest('dialog') !== null,
      ),
      suggestionPanelIsOpenPopover: await suggestionPanel.evaluate((element) =>
        element.matches(':popover-open'),
      ),
      suggestionPanelIsTopmost: await suggestionPanel.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const elementAtPanelCenter = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );

        return elementAtPanelCenter === element || element.contains(elementAtPanelCenter);
      }),
      suggestionPanelPopoverMode: await suggestionPanel.getAttribute('popover'),
    };
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('successfully uses manual popover mode for the indicator', () => {
    expect(sut.indicatorPopoverMode).toBe('manual');
  });

  test('successfully mounts the indicator inside the field dialog', () => {
    expect(sut.indicatorIsInsideDialog).toBe(true);
  });

  test('successfully opens the indicator in the browser top layer', () => {
    expect(sut.indicatorIsOpenPopover).toBe(true);
  });

  test('successfully keeps the indicator above the modal backdrop', () => {
    expect(sut.indicatorIsTopmost).toBe(true);
  });

  test('successfully uses manual popover mode for the suggestion panel', () => {
    expect(sut.suggestionPanelPopoverMode).toBe('manual');
  });

  test('successfully mounts the suggestion panel inside the field dialog', () => {
    expect(sut.suggestionPanelIsInsideDialog).toBe(true);
  });

  test('successfully opens the suggestion panel in the browser top layer', () => {
    expect(sut.suggestionPanelIsOpenPopover).toBe(true);
  });

  test('successfully keeps the suggestion panel above the modal backdrop', () => {
    expect(sut.suggestionPanelIsTopmost).toBe(true);
  });
});
