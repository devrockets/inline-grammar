import { createBackgroundMessageHandler } from '@/lib/background-handler';

export default defineBackground(() => {
  const handleBackgroundMessage = createBackgroundMessageHandler();
  const storageRestricted = browser.storage.local.setAccessLevel({
    accessLevel: 'TRUSTED_CONTEXTS',
  });

  browser.runtime.onMessage.addListener((message) =>
    storageRestricted.then(() => handleBackgroundMessage(message)),
  );
  browser.storage.onChanged.addListener((_changes, areaName) => {
    if (areaName === 'local') void notifyContentSettingsChanged();
  });
});

async function notifyContentSettingsChanged(): Promise<void> {
  const tabs = await browser.tabs.query({});

  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id === undefined) return;

      await browser.tabs
        .sendMessage(tab.id, { type: 'inline-grammar/content-settings-changed' })
        .catch(() => undefined);
    }),
  );
}
