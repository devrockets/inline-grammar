export type TextRange = {
  start: number;
  end: number;
};

export type SentenceRange = TextRange & {
  text: string;
};

const sentenceEndPattern = /[.!?]/;

export function findSentenceAtOffset(text: string, offset: number): SentenceRange | null {
  const trimmedText = text.trim();

  if (trimmedText.length === 0) return null;

  const safeOffset = Math.max(0, Math.min(offset, text.length));
  const sentenceStart = findSentenceStart(text, safeOffset);
  const sentenceEnd = findSentenceEnd(text, safeOffset);
  const start = skipLeadingWhitespace(text, sentenceStart);
  const end = skipTrailingWhitespace(text, sentenceEnd);

  if (start >= end) return null;

  return {
    end,
    start,
    text: text.slice(start, end),
  };
}

function findSentenceStart(text: string, offset: number): number {
  for (let index = offset - 1; index >= 0; index -= 1) {
    if (sentenceEndPattern.test(text[index] ?? '')) {
      return index + 1;
    }
  }

  return 0;
}

function findSentenceEnd(text: string, offset: number): number {
  for (let index = offset; index < text.length; index += 1) {
    if (sentenceEndPattern.test(text[index] ?? '')) {
      return index + 1;
    }
  }

  return text.length;
}

function skipLeadingWhitespace(text: string, start: number): number {
  let nextStart = start;

  while (/\s/.test(text[nextStart] ?? '') && nextStart < text.length) {
    nextStart += 1;
  }

  return nextStart;
}

function skipTrailingWhitespace(text: string, end: number): number {
  let nextEnd = end;

  while (/\s/.test(text[nextEnd - 1] ?? '') && nextEnd > 0) {
    nextEnd -= 1;
  }

  return nextEnd;
}
