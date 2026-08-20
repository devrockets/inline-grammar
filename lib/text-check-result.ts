import type { TextSuggestion } from './mock-provider';

export type TextCheckResult =
  | {
      status: 'ok';
      suggestions: TextSuggestion[];
    }
  | {
      message: string;
      status: 'failed';
    };

export function createSuccessfulTextCheck(suggestions: TextSuggestion[]): TextCheckResult {
  return {
    status: 'ok',
    suggestions,
  };
}

export function createFailedTextCheck(message: string): TextCheckResult {
  return {
    message,
    status: 'failed',
  };
}
