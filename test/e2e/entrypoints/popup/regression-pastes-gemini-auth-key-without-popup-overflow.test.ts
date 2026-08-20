import { createReadStream, existsSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { chromium, expect, type Page, test } from '@playwright/test';

type Sut = {
  bodyScrollWidth: number;
  browser: Awaited<ReturnType<typeof chromium.launch>>;
  htmlScrollWidth: number;
  inputValue: string;
  page: Page;
  server: Server;
};

const popupWidth = 320;
const fakeGeminiAuthKey =
  'AQ.synthetic-key-with-dots-and-dashes-1234567890abcdefghijklmnopqrstuvwxyz';

test.describe('Given the popup provider form, when a Gemini auth-key formatted credential is pasted, then the popup does not overflow horizontally', () => {
  let sut: Sut | null = null;

  test.beforeAll(async () => {
    const server = await serveBuiltExtension();
    const browser = await chromium.launch({
      channel: 'chromium',
      headless: true,
    });
    const page = await browser.newPage();

    await page.addInitScript(() => {
      (
        globalThis as unknown as {
          chrome: unknown;
        }
      ).chrome = {
        storage: {
          local: {
            get: async (key: string) => ({
              [key]: { providerDataConsent: true },
            }),
            set: async () => undefined,
          },
        },
      };
    });

    await page.setViewportSize({
      height: 600,
      width: popupWidth,
    });
    await page.goto(`http://127.0.0.1:${getServerPort(server)}/popup.html`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(() => {
      const input = document.querySelector<HTMLInputElement>('input[type="password"]');

      return input && !input.disabled;
    });
    const apiKeyInput = page.locator('input[type="password"]');

    await apiKeyInput.fill(fakeGeminiAuthKey);

    sut = {
      bodyScrollWidth: await page.evaluate(() => document.body.scrollWidth),
      browser,
      htmlScrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
      inputValue: await page.evaluate(() => {
        const input = document.querySelector<HTMLInputElement>('input[type="password"]');

        return input?.value ?? '';
      }),
      page,
      server,
    };
  });

  test.afterAll(async () => {
    await sut?.page.close();
    await sut?.browser.close();

    const activeSut = sut;

    if (!activeSut) return;

    await new Promise<void>((resolve, reject) => {
      activeSut.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  test('successfully preserves the pasted key value', () => {
    expect(getSut(sut).inputValue).toBe(fakeGeminiAuthKey);
  });

  test('successfully keeps body width inside the popup viewport', () => {
    expect(getSut(sut).bodyScrollWidth).toBeLessThanOrEqual(popupWidth);
  });

  test('successfully keeps document width inside the popup viewport', () => {
    expect(getSut(sut).htmlScrollWidth).toBeLessThanOrEqual(popupWidth);
  });
});

async function serveBuiltExtension(): Promise<Server> {
  const outputRoot = path.resolve('.output/chrome-mv3');
  const server = createServer((request, response) => {
    const requestPath = request.url === '/' ? '/popup.html' : request.url?.split('?')[0];
    const filePath = path.join(outputRoot, requestPath ?? '/popup.html');

    if (!filePath.startsWith(outputRoot) || !existsSync(filePath)) {
      response.writeHead(404);
      response.end();
      return;
    }

    response.writeHead(200, {
      'Content-Type': getContentType(filePath),
    });
    createReadStream(filePath).pipe(response);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  return server;
}

function getSut(sut: Sut | null): Sut {
  if (!sut) {
    throw new Error('Popup regression test setup did not complete.');
  }

  return sut;
}

function getServerPort(server: Server): number {
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Popup fixture server did not start with a TCP port.');
  }

  return (address as AddressInfo).port;
}

function getContentType(filePath: string): string {
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.js')) return 'text/javascript';
  if (filePath.endsWith('.html')) return 'text/html';

  return 'application/octet-stream';
}
