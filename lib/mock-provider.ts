import type { PresetId } from './presets';
import { findSentenceAtOffset } from './sentences';

export type TextSuggestion = {
  id: string;
  message: string;
  original: string;
  replacement: string;
  range: {
    start: number;
    end: number;
  };
};

export type CheckTextRequest = {
  signal?: AbortSignal;
  text: string;
  presetId: PresetId;
};

export type RephraseSentenceRequest = {
  cursorOffset: number;
  text: string;
  presetId: PresetId;
};

const rules = [
  {
    pattern: /\btheir is\b/i,
    replacement: 'there are',
    message: 'Use "there are" for this phrasing.',
  },
  {
    pattern: /\bThis are\b/,
    replacement: 'This is',
    message: 'Use singular verb agreement here.',
  },
  {
    pattern: /\blets\b/i,
    replacement: "let's",
    message: 'Use the contraction for "let us".',
  },
  {
    pattern: /\balready exists\b/i,
    replacement: 'already exist',
    message: 'Use plural agreement with the subject.',
  },
];

export async function checkTextWithMockProvider({
  text,
  presetId,
}: CheckTextRequest): Promise<TextSuggestion[]> {
  return rules.flatMap((rule, index) => {
    const match = text.match(rule.pattern);

    if (!match?.[0]) return [];

    return {
      id: `mock-${presetId}-${index}`,
      message: rule.message,
      original: match[0],
      replacement: rule.replacement,
      range: {
        start: match.index ?? 0,
        end: (match.index ?? 0) + match[0].length,
      },
    };
  });
}

export function createMockSentenceRephraseSuggestion({
  cursorOffset,
  text,
  presetId,
}: RephraseSentenceRequest): TextSuggestion | null {
  const sentence = findSentenceAtOffset(text, cursorOffset);

  if (!sentence) return null;

  return {
    id: `mock-rephrase-${presetId}-${sentence.start}-${sentence.end}`,
    message: `Rephrase this sentence using the ${presetId} preset.`,
    original: sentence.text,
    replacement: rephraseSentence(sentence.text, presetId),
    range: {
      end: sentence.end,
      start: sentence.start,
    },
  };
}

function rephraseSentence(sentence: string, presetId: PresetId): string {
  const correctedSentence = applyKnownCorrections(sentence);

  if (presetId === 'formal') {
    return `I would like to note that ${lowercaseFirstLetter(correctedSentence)}`;
  }

  if (presetId === 'friendly') {
    return `${correctedSentence} Thanks for taking a look.`;
  }

  if (presetId === 'concise') {
    return correctedSentence
      .replace(/\bseems to\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return correctedSentence;
}

function applyKnownCorrections(text: string): string {
  return rules.reduce((nextText, rule) => nextText.replace(rule.pattern, rule.replacement), text);
}

function lowercaseFirstLetter(text: string): string {
  return `${text.slice(0, 1).toLowerCase()}${text.slice(1)}`;
}
