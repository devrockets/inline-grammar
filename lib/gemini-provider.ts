import type { TextSuggestion } from './mock-provider';
import { getPreset, type PresetId } from './presets';
import type { ProviderConfig } from './settings';
import {
  createFailedTextCheck,
  createSuccessfulTextCheck,
  type TextCheckResult,
} from './text-check-result';

const geminiTextCheckTimeoutMs = 45_000;
let geminiRequestCount = 0;

export type GeminiCheckTextRequest = {
  fetchClient?: typeof fetch;
  presetId: PresetId;
  provider: ProviderConfig;
  signal?: AbortSignal;
  text: string;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: unknown;
      }>;
    };
  }>;
};

type GeminiSuggestionPayload = {
  suggestions?: Array<{
    end?: unknown;
    message?: unknown;
    original?: unknown;
    replacement?: unknown;
    start?: unknown;
  }>;
};

export async function checkTextWithGeminiProvider({
  fetchClient = fetch,
  presetId,
  provider,
  signal: requestSignal,
  text,
}: GeminiCheckTextRequest): Promise<TextCheckResult> {
  const abortController = new AbortController();
  const abortSupersededRequest = () => abortController.abort();
  const timeoutId = globalThis.setTimeout(() => abortController.abort(), geminiTextCheckTimeoutMs);
  const requestNumber = geminiRequestCount + 1;
  const startedAt = performance.now();
  geminiRequestCount = requestNumber;
  requestSignal?.addEventListener('abort', abortSupersededRequest, { once: true });

  if (requestSignal?.aborted) {
    abortController.abort();
  }

  try {
    logGeminiRequest('start', {
      model: provider.model,
      presetId,
      requestNumber,
      textLength: text.length,
    });

    const response = await fetchClient(getGenerateContentUrl(provider), {
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: createSystemPrompt(presetId),
            },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Text to check:\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          thinkingConfig: {
            includeThoughts: false,
            thinkingLevel: 'low',
          },
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': provider.apiKey,
      },
      method: 'POST',
      signal: abortController.signal,
    });

    logGeminiRequest('response', {
      durationMs: Math.round(performance.now() - startedAt),
      model: provider.model,
      requestNumber,
      status: response.status,
    });

    if (!response.ok) {
      return createFailedTextCheck(await getGeminiFailureMessage(response));
    }

    const body = (await response.json()) as GeminiGenerateContentResponse;
    const content = body.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof content !== 'string') {
      return createFailedTextCheck('Gemini returned an unreadable response.');
    }

    const payload = JSON.parse(stripJsonMarkdownFence(content)) as GeminiSuggestionPayload;
    const suggestions = normalizeGeminiSuggestions(payload, text);

    logGeminiRequest('normalized', {
      acceptedSuggestionCount: suggestions.length,
      receivedSuggestionCount: Array.isArray(payload.suggestions) ? payload.suggestions.length : 0,
      requestNumber,
    });

    return createSuccessfulTextCheck(suggestions);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logGeminiRequest('failure', {
        durationMs: Math.round(performance.now() - startedAt),
        reason: requestSignal?.aborted ? 'superseded' : 'timeout',
        requestNumber,
      });
      return createFailedTextCheck(
        requestSignal?.aborted ? 'Gemini check was superseded.' : 'Gemini check timed out.',
      );
    }

    logGeminiRequest('failure', {
      durationMs: Math.round(performance.now() - startedAt),
      reason: 'network-or-parse-error',
      requestNumber,
    });
    return createFailedTextCheck('Gemini check could not be completed.');
  } finally {
    globalThis.clearTimeout(timeoutId);
    requestSignal?.removeEventListener('abort', abortSupersededRequest);
  }
}

function logGeminiRequest(
  event: 'failure' | 'normalized' | 'response' | 'start',
  details: Record<string, number | string>,
): void {
  if (import.meta.env.MODE !== 'development') return;

  console.info(`[Inline Grammar] Gemini request ${event}`, details);
}

async function getGeminiFailureMessage(response: Response): Promise<string> {
  const fallbackMessage = `Gemini check failed with HTTP ${response.status}.`;

  try {
    const body = (await response.json()) as unknown;

    if (!isRecord(body) || !isRecord(body.error)) return fallbackMessage;

    const reason = getGoogleErrorReason(body.error.details);

    if (response.status === 401 && reason === 'ACCESS_TOKEN_TYPE_UNSUPPORTED') {
      return 'Gemini recognized the key but rejected its authentication type for text generation.';
    }

    if (response.status === 401 || response.status === 403) {
      return 'Gemini rejected this key for text generation.';
    }

    if (response.status === 429) {
      return 'Gemini request quota was exceeded. Wait for the quota window to reset.';
    }

    const message = body.error.message;

    return typeof message === 'string' && message.trim().length > 0
      ? `Gemini check failed: ${message.trim()}`
      : fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function getGoogleErrorReason(details: unknown): string | null {
  if (!Array.isArray(details)) return null;

  for (const detail of details) {
    if (isRecord(detail) && typeof detail.reason === 'string') return detail.reason;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getGenerateContentUrl(provider: ProviderConfig): string {
  return `${getGeminiNativeBaseUrl(provider)}/models/${encodeURIComponent(provider.model)}:generateContent`;
}

function getGeminiNativeBaseUrl(provider: ProviderConfig): string {
  return provider.baseUrl.replace(/\/openai\/?$/, '').replace(/\/$/, '');
}

function createSystemPrompt(presetId: PresetId): string {
  const preset = getPreset(presetId);

  return [
    'You are Inline Grammar, a grammar, spelling, clarity, and tone checker for browser text fields.',
    `Selected writing profile ID: ${preset.id}.`,
    `Selected writing profile: ${preset.label}.`,
    `Tone objective: ${preset.description}`,
    `Profile instruction: ${preset.instruction}`,
    'Evaluate both language correctness and alignment with the selected writing profile.',
    'If grammatically correct text does not match the selected profile, suggest a replacement that does.',
    'Preserve the meaning and any facts in the source text.',
    'Return only valid JSON.',
    'The JSON shape must be: {"suggestions":[{"start":number,"end":number,"original":string,"replacement":string,"message":string}]}',
    'Use zero-based UTF-16 string offsets for start and end.',
    'Copy original exactly from the source, including its spelling and capitalization.',
    'The end offset must equal start plus the UTF-16 length of original.',
    'Only include suggestions that directly improve grammar, spelling, clarity, or the requested tone.',
    'Do not invent facts. Do not explain outside JSON.',
  ].join(' ');
}

function normalizeGeminiSuggestions(
  payload: GeminiSuggestionPayload,
  sourceText: string,
): TextSuggestion[] {
  if (!Array.isArray(payload.suggestions)) return [];

  return payload.suggestions.flatMap((suggestion, index) => {
    const start = toSafeInteger(suggestion.start);
    const end = toSafeInteger(suggestion.end);
    const original = toSafeString(suggestion.original);
    const replacement = toSafeString(suggestion.replacement);
    const message = toSafeString(suggestion.message);

    if (start === null || end === null || !original || !replacement || !message) return [];
    if (original === replacement) return [];

    const range = resolveSuggestionRange({ end, original, sourceText, start });

    if (!range) return [];

    return {
      id: `gemini-${index}-${range.start}-${range.end}`,
      message,
      original,
      range,
      replacement,
    };
  });
}

function resolveSuggestionRange({
  end,
  original,
  sourceText,
  start,
}: {
  end: number;
  original: string;
  sourceText: string;
  start: number;
}): { end: number; start: number } | null {
  if (
    start >= 0 &&
    end > start &&
    end <= sourceText.length &&
    sourceText.slice(start, end) === original
  ) {
    return { end, start };
  }

  const recoveredStart = sourceText.indexOf(original);

  if (recoveredStart < 0) return null;
  if (sourceText.indexOf(original, recoveredStart + 1) >= 0) return null;

  return {
    end: recoveredStart + original.length,
    start: recoveredStart,
  };
}

function toSafeInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) ? value : null;
}

function toSafeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function stripJsonMarkdownFence(value: string): string {
  const trimmedValue = value.trim();
  const fencedJson = trimmedValue.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return fencedJson?.[1]?.trim() ?? trimmedValue;
}
