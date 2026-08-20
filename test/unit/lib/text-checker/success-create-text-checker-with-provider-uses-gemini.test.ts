import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { ProviderConfig } from '@/lib/settings';

const checkTextWithMockProviderMock = vi.hoisted(() => vi.fn());
const checkTextWithGeminiProviderMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/mock-provider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/mock-provider')>()),
  checkTextWithMockProvider: checkTextWithMockProviderMock,
}));

vi.mock('@/lib/gemini-provider', () => ({
  checkTextWithGeminiProvider: checkTextWithGeminiProviderMock,
}));

type Sut = {
  geminiCallCount: number;
  mockCallCount: number;
};

describe('Given a configured provider, when createTextChecker runs, then it checks text with Gemini', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.resetModules();
    checkTextWithGeminiProviderMock.mockResolvedValue([]);

    const { createTextChecker } = await import('@/lib/text-checker');
    const checkText = createTextChecker(createProvider());

    await checkText({
      presetId: 'clear',
      text: 'lets write better',
    });

    sut = {
      geminiCallCount: checkTextWithGeminiProviderMock.mock.calls.length,
      mockCallCount: checkTextWithMockProviderMock.mock.calls.length,
    };
  });

  it('successfully calls the Gemini provider once', () => {
    expect(sut.geminiCallCount).toBe(1);
  });

  it('successfully skips the mock provider', () => {
    expect(sut.mockCallCount).toBe(0);
  });
});

function createProvider(): ProviderConfig {
  return {
    apiKey: 'test-key',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-3.6-flash',
    type: 'openai_compatible',
  };
}
