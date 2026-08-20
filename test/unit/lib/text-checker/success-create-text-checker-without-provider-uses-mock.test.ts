import { beforeAll, describe, expect, it, vi } from 'vitest';

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

describe('Given no configured provider, when createTextChecker runs, then it checks text with the mock provider', () => {
  let sut: Sut;

  beforeAll(async () => {
    vi.resetModules();
    checkTextWithMockProviderMock.mockResolvedValue([]);

    const { createTextChecker } = await import('@/lib/text-checker');
    const checkText = createTextChecker(null);

    await checkText({
      presetId: 'clear',
      text: 'lets write better',
    });

    sut = {
      geminiCallCount: checkTextWithGeminiProviderMock.mock.calls.length,
      mockCallCount: checkTextWithMockProviderMock.mock.calls.length,
    };
  });

  it('successfully calls the mock provider once', () => {
    expect(sut.mockCallCount).toBe(1);
  });

  it('successfully skips the Gemini provider', () => {
    expect(sut.geminiCallCount).toBe(0);
  });
});
