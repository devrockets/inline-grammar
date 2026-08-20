import { checkTextWithGeminiProvider } from './gemini-provider';
import { type CheckTextRequest, checkTextWithMockProvider } from './mock-provider';
import type { ProviderConfig } from './settings';
import {
  createFailedTextCheck,
  createSuccessfulTextCheck,
  type TextCheckResult,
} from './text-check-result';

export function createTextChecker(provider: ProviderConfig | null, providerDataConsent = true) {
  return async function checkText(request: CheckTextRequest): Promise<TextCheckResult> {
    if (provider && !providerDataConsent) {
      return createFailedTextCheck(
        'Open Inline Grammar and accept the data-use disclosure before checking with your AI provider.',
      );
    }

    if (!provider) {
      return createSuccessfulTextCheck(await checkTextWithMockProvider(request));
    }

    return checkTextWithGeminiProvider({
      ...request,
      provider,
    });
  };
}
