import { beforeAll, describe, expect, it, vi } from 'vitest';
import { presets } from '@/lib/presets';
import type { ProviderConfig } from '@/lib/settings';

type RequestBody = {
  contents: Array<{ parts: Array<{ text: string }> }>;
  systemInstruction: { parts: Array<{ text: string }> };
};

describe('Given each configured writing profile, when Gemini analysis is requested, then the selected tone is explicit in the system instruction', () => {
  const requestBodies = new Map<string, RequestBody>();

  beforeAll(async () => {
    const { checkTextWithGeminiProvider } = await import('@/lib/gemini-provider');

    for (const preset of presets) {
      const fetchClient = vi.fn(async (_url: string, init?: RequestInit) => {
        requestBodies.set(preset.id, JSON.parse(String(init?.body)) as RequestBody);

        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '{"suggestions":[]}' }] } }],
          }),
          { status: 200 },
        );
      });

      await checkTextWithGeminiProvider({
        fetchClient: fetchClient as unknown as typeof fetch,
        presetId: preset.id,
        provider: createProvider(),
        text: 'This is the text supplied by the user.',
      });
    }
  });

  it.each(presets)('sends the $label profile identity and tone objective', (preset) => {
    const systemInstruction = requestBodies.get(preset.id)?.systemInstruction.parts[0]?.text;

    expect(systemInstruction).toContain(`Selected writing profile ID: ${preset.id}.`);
    expect(systemInstruction).toContain(`Selected writing profile: ${preset.label}.`);
    expect(systemInstruction).toContain(`Tone objective: ${preset.description}`);
    expect(systemInstruction).toContain(`Profile instruction: ${preset.instruction}`);
  });

  it.each(presets)('keeps the user text separate from the $label system instruction', (preset) => {
    const body = requestBodies.get(preset.id);

    expect(body?.contents[0]?.parts[0]?.text).toBe(
      'Text to check:\nThis is the text supplied by the user.',
    );
  });
});

function createProvider(): ProviderConfig {
  return {
    apiKey: 'test-key',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-3.6-flash',
    type: 'openai_compatible',
  };
}
