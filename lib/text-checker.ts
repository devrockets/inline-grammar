import { checkTextWithGeminiProvider } from './gemini-provider';
import { type CheckTextRequest, checkTextWithMockProvider } from './mock-provider';
import type { ProviderConfig } from './settings';
import { createSuccessfulTextCheck, type TextCheckResult } from './text-check-result';

export function createTextChecker(provider: ProviderConfig | null) {
  return async function checkText(request: CheckTextRequest): Promise<TextCheckResult> {
    if (!provider) {
      return createSuccessfulTextCheck(await checkTextWithMockProvider(request));
    }

    return checkTextWithGeminiProvider({
      ...request,
      provider,
    });
  };
}
