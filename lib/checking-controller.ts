import { checkTextWithMockProvider, type TextSuggestion } from './mock-provider';
import type { PresetId } from './presets';
import { countWords, getFieldText } from './text';
import { createSuccessfulTextCheck, type TextCheckResult } from './text-check-result';

export type CheckingState =
  | 'idle'
  | 'too-short'
  | 'checking'
  | 'has-suggestions'
  | 'no-suggestions'
  | 'provider-error';

export type CheckingControllerOptions = {
  cacheNamespace?: string;
  checkText?: (request: {
    signal?: AbortSignal;
    text: string;
    presetId: PresetId;
  }) => Promise<TextCheckResult>;
  debounceMs: number;
  minimumWords: number;
  presetId: PresetId;
  setState: (state: CheckingState, suggestions: TextSuggestion[], message?: string) => void;
};

type AttachedController = {
  activeAbortController: AbortController | null;
  checkSequence: number;
  inputListener: () => void;
  options: CheckingControllerOptions;
  scheduleCheck: (delayMs?: number) => void;
  timeoutId: number | undefined;
};

const attachedControllers = new WeakMap<HTMLElement, AttachedController>();
const checkedTextCache = new Map<string, TextSuggestion[]>();

export function attachCheckingController(
  element: HTMLElement,
  options: CheckingControllerOptions,
): void {
  const existingController = attachedControllers.get(element);

  if (existingController) {
    const configurationChanged =
      existingController.options.cacheNamespace !== options.cacheNamespace ||
      existingController.options.presetId !== options.presetId ||
      existingController.options.checkText !== options.checkText;

    existingController.options = options;

    if (configurationChanged) {
      existingController.scheduleCheck(0);
    }

    return;
  }

  const controller: AttachedController = {
    activeAbortController: null,
    checkSequence: 0,
    inputListener: () => scheduleCheck(),
    options,
    scheduleCheck,
    timeoutId: undefined,
  };
  attachedControllers.set(element, controller);

  async function runCheck(): Promise<void> {
    const {
      cacheNamespace = 'default',
      checkText = async (request) =>
        createSuccessfulTextCheck(await checkTextWithMockProvider(request)),
      minimumWords,
      presetId,
      setState,
    } = controller.options;
    const text = getFieldText(element);

    if (countWords(text) < minimumWords) {
      setState('too-short', []);
      return;
    }

    const cacheKey = `${cacheNamespace}:${presetId}:${text}`;
    const cachedSuggestions = checkedTextCache.get(cacheKey);

    if (cachedSuggestions) {
      setState(
        cachedSuggestions.length > 0 ? 'has-suggestions' : 'no-suggestions',
        cachedSuggestions,
      );
      return;
    }

    const currentSequence = controller.checkSequence;
    const requestAbortController = new AbortController();
    controller.activeAbortController = requestAbortController;
    setState('checking', []);

    const result = await checkText({
      presetId,
      signal: requestAbortController.signal,
      text,
    });

    if (controller.activeAbortController === requestAbortController) {
      controller.activeAbortController = null;
    }

    if (currentSequence !== controller.checkSequence) return;

    if (result.status === 'failed') {
      setState('provider-error', [], result.message);
      return;
    }

    const suggestions = result.suggestions;

    checkedTextCache.set(cacheKey, suggestions);
    setState(suggestions.length > 0 ? 'has-suggestions' : 'no-suggestions', suggestions);
  }

  function scheduleCheck(delayMs = controller.options.debounceMs): void {
    if (controller.timeoutId !== undefined) {
      window.clearTimeout(controller.timeoutId);
    }

    controller.activeAbortController?.abort();
    controller.activeAbortController = null;
    controller.checkSequence += 1;
    controller.options.setState('idle', []);
    controller.timeoutId = window.setTimeout(() => {
      controller.timeoutId = undefined;
      void runCheck();
    }, delayMs);
  }

  element.addEventListener('input', controller.inputListener);
}

export function detachCheckingController(element: HTMLElement): void {
  const controller = attachedControllers.get(element);

  if (!controller) return;

  if (controller.timeoutId !== undefined) {
    window.clearTimeout(controller.timeoutId);
  }

  controller.activeAbortController?.abort();
  controller.checkSequence += 1;
  element.removeEventListener('input', controller.inputListener);
  attachedControllers.delete(element);
}
