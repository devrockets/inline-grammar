import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

vi.mock('@/lib/gemini-provider', () => ({
  checkTextWithGeminiProvider: vi.fn(),
}));

type Sut = {
  geminiCallCount: number;
  message: string | null;
  status: string;
};

describe('Given a configured provider without data-use consent, when text checking runs, then it blocks the Gemini request', () => {
  let sut: Sut;

  beforeAll(async () => {
    const provider: ProviderConfig = {
      apiKey: 'test-key',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-3.6-flash',
      type: 'openai_compatible',
    };
    const { checkTextWithGeminiProvider } = await import('@/lib/gemini-provider');
    const { createTextChecker } = await import('@/lib/text-checker');
    const result = await createTextChecker(
      provider,
      false,
    )({
      presetId: 'clear',
      text: 'This text needs checking.',
    });

    sut = {
      geminiCallCount: vi.mocked(checkTextWithGeminiProvider).mock.calls.length,
      message: result.status === 'failed' ? result.message : null,
      status: result.status,
    };
  });

  it('returns a failed result', () => {
    expect(sut.status).toBe('failed');
  });

  it('explains how to enable provider data use', () => {
    expect(sut.message).toContain('accept the data-use disclosure');
  });

  it('does not call Gemini', () => {
    expect(sut.geminiCallCount).toBe(0);
  });
});
