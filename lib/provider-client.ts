import type { ProviderConfig } from './settings';

const providerConnectionTimeoutMs = 15_000;

export type ProviderConnectionResult =
  | {
      status: 'connected';
    }
  | {
      message: string;
      status: 'invalid_request' | 'network_error' | 'timeout' | 'unauthorized';
    };

export async function testProviderConnection(
  provider: ProviderConfig,
  fetchClient: typeof fetch = fetch,
): Promise<ProviderConnectionResult> {
  const abortController = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => abortController.abort(),
    providerConnectionTimeoutMs,
  );

  try {
    const response = await fetchClient(getModelUrl(provider), {
      headers: {
        'x-goog-api-key': provider.apiKey,
      },
      method: 'GET',
      signal: abortController.signal,
    });

    if (response.status === 401 || response.status === 403) {
      return {
        message: 'Gemini rejected the API key.',
        status: 'unauthorized',
      };
    }

    if (!response.ok) {
      const providerErrorMessage = await readProviderErrorMessage(response);

      if (isInvalidApiKeyMessage(providerErrorMessage)) {
        return {
          message: 'Gemini rejected the API key. Use an API key from Google AI Studio.',
          status: 'unauthorized',
        };
      }

      return {
        message: providerErrorMessage
          ? `Gemini connection failed: ${providerErrorMessage}`
          : `Gemini connection failed with HTTP ${response.status}.`,
        status: 'invalid_request',
      };
    }

    return {
      status: 'connected',
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        message: 'Gemini connection timed out after 15 seconds.',
        status: 'timeout',
      };
    }

    return {
      message: 'Gemini could not be reached. Check your network and browser permissions.',
      status: 'network_error',
    };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function getModelUrl(provider: ProviderConfig): string {
  return `${getGeminiNativeBaseUrl(provider)}/models/${encodeURIComponent(provider.model)}`;
}

function getGeminiNativeBaseUrl(provider: ProviderConfig): string {
  return provider.baseUrl.replace(/\/openai\/?$/, '').replace(/\/$/, '');
}

async function readProviderErrorMessage(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as unknown;

    if (!isRecord(body) || !isRecord(body.error)) return null;

    const message = body.error.message;

    return typeof message === 'string' && message.trim().length > 0 ? message.trim() : null;
  } catch {
    return null;
  }
}

function isInvalidApiKeyMessage(message: string | null): boolean {
  return message?.toLowerCase().includes('valid api key') ?? false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
