import { createReadStream, existsSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { chromium, expect, type Page, test } from '@playwright/test';

type Sut = {
  apiKeyInputCountAfterConsent: number;
  apiKeyInputCountBeforeConsent: number;
  browser: Awaited<ReturnType<typeof chromium.launch>>;
  providerDataConsent: boolean | null;
  page: Page;
  server: Server;
};

test.describe('Given a user has not reviewed provider data use, when they agree and continue, then the popup remembers consent and reveals AI provider setup', () => {
  let sut: Sut | null = null;

  test.beforeAll(async () => {
    const server = await serveBuiltExtension();
    const browser = await chromium.launch({ channel: 'chromium', headless: true });
    const page = await browser.newPage();

    await page.addInitScript(() => {
      const state: { providerDataConsent: boolean | null } = { providerDataConsent: null };

      (
        globalThis as unknown as {
          __inlineGrammarTestState: typeof state;
          chrome: unknown;
        }
      ).__inlineGrammarTestState = state;
      (
        globalThis as unknown as {
          chrome: unknown;
        }
      ).chrome = {
        storage: {
          local: {
            get: async (key: string) => ({ [key]: undefined }),
            set: async (value: Record<string, { providerDataConsent?: boolean }>) => {
              const settings = Object.values(value)[0];
              state.providerDataConsent = settings?.providerDataConsent ?? null;
            },
          },
        },
      };
    });

    await page.setViewportSize({ height: 700, width: 320 });
    await page.goto(`http://127.0.0.1:${getServerPort(server)}/popup.html`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByRole('button', { name: 'I agree and continue' }).waitFor();

    const apiKeyInputCountBeforeConsent = await page.getByLabel('API key').count();
    await page.getByRole('button', { name: 'I agree and continue' }).click();
    await page.getByLabel('API key').waitFor();

    sut = {
      apiKeyInputCountAfterConsent: await page.getByLabel('API key').count(),
      apiKeyInputCountBeforeConsent,
      browser,
      page,
      providerDataConsent: await page.evaluate(
        () =>
          (
            globalThis as unknown as {
              __inlineGrammarTestState: { providerDataConsent: boolean | null };
            }
          ).__inlineGrammarTestState.providerDataConsent,
      ),
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

  test('hides provider inputs before consent', () => {
    expect(getSut(sut).apiKeyInputCountBeforeConsent).toBe(0);
  });

  test('stores affirmative consent locally', () => {
    expect(getSut(sut).providerDataConsent).toBe(true);
  });

  test('reveals provider inputs after consent', () => {
    expect(getSut(sut).apiKeyInputCountAfterConsent).toBe(1);
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

    response.writeHead(200, { 'Content-Type': getContentType(filePath) });
    createReadStream(filePath).pipe(response);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  return server;
}

function getSut(sut: Sut | null): Sut {
  if (!sut) throw new Error('Popup consent test setup did not complete.');

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
