import { attachCheckingController, detachCheckingController } from '@/lib/checking-controller';
import { classifyField, shouldShowFieldIndicator } from '@/lib/field-eligibility';
import {
  attachFieldIndicator,
  detachFieldIndicator,
  setFieldIndicatorState,
} from '@/lib/field-indicator';
import { writingFieldSelector } from '@/lib/field-selectors';
import type { PresetId } from '@/lib/presets';
import { loadSettings } from '@/lib/settings';
import { createTextChecker } from '@/lib/text-checker';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    let settings = await loadSettings();
    let settingsRevision = 0;
    const checkText: Parameters<typeof attachCheckingController>[1]['checkText'] = (request) =>
      createTextChecker(settings.provider)({
        ...request,
        presetId: settings.presetId,
      });

    function synchronizePage(): void {
      if (settings.enabled) {
        attachIndicators(document, settings.presetId, checkText, String(settingsRevision));
      } else {
        detachIndicators(document);
      }
    }

    synchronizePage();

    browser.storage.onChanged.addListener((_changes, areaName) => {
      if (areaName !== 'local') return;

      void loadSettings().then((nextSettings) => {
        settings = nextSettings;
        settingsRevision += 1;
        synchronizePage();
      });
    });

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            if (settings.enabled) {
              attachIndicators(node, settings.presetId, checkText, String(settingsRevision));
            }
          }
        }

        for (const node of mutation.removedNodes) {
          if (node instanceof Element) {
            detachIndicators(node);
          }
        }

        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          if (settings.enabled) {
            attachIndicators(
              mutation.target,
              settings.presetId,
              checkText,
              String(settingsRevision),
            );
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      attributeFilter: [
        'aria-disabled',
        'aria-readonly',
        'contenteditable',
        'hidden',
        'role',
        'type',
      ],
      attributes: true,
      childList: true,
      subtree: true,
    });
  },
});

function attachIndicators(
  root: ParentNode,
  presetId: PresetId,
  checkText: Parameters<typeof attachCheckingController>[1]['checkText'],
  cacheNamespace: string,
): void {
  const elements = root instanceof Element && root.matches(writingFieldSelector) ? [root] : [];

  elements.push(...root.querySelectorAll(writingFieldSelector));

  for (const element of elements) {
    const eligibility = classifyField(element);

    if (element instanceof HTMLElement && shouldShowFieldIndicator(eligibility)) {
      attachFieldIndicator(element, eligibility);

      if (eligibility.status === 'eligible') {
        attachCheckingController(element, {
          cacheNamespace,
          checkText,
          debounceMs: 1_500,
          minimumWords: 3,
          presetId,
          setState: (state, suggestions, message) =>
            setFieldIndicatorState(element, state, suggestions, message),
        });
      }
    }
  }
}

function detachIndicators(root: ParentNode): void {
  const elements = root instanceof Element && root.matches(writingFieldSelector) ? [root] : [];

  elements.push(...root.querySelectorAll(writingFieldSelector));

  for (const element of elements) {
    if (element instanceof HTMLElement) {
      detachCheckingController(element);
      detachFieldIndicator(element);
    }
  }
}
