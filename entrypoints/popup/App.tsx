import { useEffect, useId, useState } from 'react';
import { getPreset, presets } from '@/lib/presets';
import { testProviderConnection } from '@/lib/provider-client';
import {
  createGeminiProviderConfig,
  type ExtensionSettings,
  geminiProviderDefaults,
  loadSettings,
  type ProviderConfig,
  updateSettings,
} from '@/lib/settings';

type ProviderForm = {
  apiKey: string;
  model: string;
};

type ProviderValidationState = 'idle' | 'testing' | 'success' | 'error';

const defaultProviderForm = {
  apiKey: '',
  model: geminiProviderDefaults.model,
} satisfies ProviderForm;

function App() {
  const presetGroupId = useId();
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState<ProviderForm>(defaultProviderForm);
  const [providerValidationMessage, setProviderValidationMessage] = useState<string | null>(null);
  const [providerValidationState, setProviderValidationState] =
    useState<ProviderValidationState>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStoredSettings() {
      try {
        const storedSettings = await loadSettings();

        if (isMounted) {
          setSettings(storedSettings);
          setProviderForm(toProviderForm(storedSettings.provider));
          setErrorMessage(null);
          setProviderValidationMessage(null);
          setProviderValidationState('idle');
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Settings could not be loaded.');
        }
      }
    }

    void loadStoredSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveSettingsChange(
    changes: Partial<Pick<ExtensionSettings, 'enabled' | 'presetId' | 'provider'>>,
  ) {
    if (!settings) return;

    const previousSettings = settings;
    const nextSettings = { ...settings, ...changes };

    setSettings(nextSettings);
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const savedSettings = await updateSettings(changes);
      setSettings(savedSettings);
    } catch {
      setSettings(previousSettings);
      setProviderForm(toProviderForm(previousSettings.provider));
      setErrorMessage('Settings could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  async function saveProviderConfig() {
    const provider = createGeminiProviderConfig(providerForm);

    if (!provider) {
      setErrorMessage('Gemini requires a model and API key.');
      return;
    }

    await saveSettingsChange({ provider });
  }

  async function clearProviderConfig() {
    setProviderForm(defaultProviderForm);
    resetProviderValidation();
    await saveSettingsChange({ provider: null });
  }

  function resetProviderValidation() {
    setProviderValidationMessage(null);
    setProviderValidationState('idle');
  }

  async function testGeminiConnection() {
    const provider = createGeminiProviderConfig(providerForm);

    if (!provider) {
      setErrorMessage(null);
      setProviderValidationState('error');
      setProviderValidationMessage('Gemini requires a model and API key before testing.');
      return;
    }

    setIsTestingConnection(true);
    setErrorMessage(null);
    setProviderValidationState('testing');
    setProviderValidationMessage('Testing Gemini connection...');

    try {
      const result = await testProviderConnection(provider);

      if (result.status === 'connected') {
        setProviderValidationState('success');
        setProviderValidationMessage(
          'Gemini recognizes this key and model. Text generation is not tested.',
        );
        return;
      }

      setProviderValidationState('error');
      setProviderValidationMessage(result.message);
    } finally {
      setIsTestingConnection(false);
    }
  }

  const selectedPreset = settings ? getPreset(settings.presetId) : null;
  const isLoading = !settings;

  return (
    <main className="w-80 max-w-80 overflow-hidden bg-zinc-950 p-4 text-zinc-50">
      <div className="mb-4 flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-base font-semibold">Inline Grammar</h1>
          <p className="mt-1 min-w-0 text-xs text-zinc-400">
            {selectedPreset?.description ?? 'Loading writing preferences.'}
          </p>
        </div>

        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-zinc-300">
          <span>On</span>
          <input
            aria-label="Enable Inline Grammar"
            className="h-4 w-4 accent-sky-500"
            checked={settings?.enabled ?? false}
            disabled={isLoading || isSaving}
            onChange={(event) => {
              const enabled = event.currentTarget.checked;

              void saveSettingsChange({ enabled });
            }}
            type="checkbox"
          />
        </label>
      </div>

      <fieldset
        aria-describedby={`${presetGroupId}-description`}
        className="min-w-0"
        disabled={isLoading || isSaving}
      >
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Preset
        </legend>
        <div className="grid min-w-0 grid-cols-2 gap-2">
          {presets.map((preset) => (
            <label
              className={`min-w-0 cursor-pointer rounded-md border px-3 py-2 text-left text-sm focus-within:ring-2 focus-within:ring-sky-500 ${
                settings?.presetId === preset.id
                  ? 'border-sky-500 bg-sky-950 text-sky-50'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-100 hover:border-sky-500'
              }`}
              key={preset.id}
            >
              <input
                checked={settings?.presetId === preset.id}
                className="sr-only"
                name="preset"
                onChange={() => void saveSettingsChange({ presetId: preset.id })}
                type="radio"
                value={preset.id}
              />
              <span className="block min-w-0 truncate font-medium">{preset.label}</span>
            </label>
          ))}
        </div>
        <p className="sr-only" id={`${presetGroupId}-description`}>
          Choose the writing tone Inline Grammar should use.
        </p>
      </fieldset>

      <section className="mt-4 min-w-0 rounded-md border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h2 className="min-w-0 text-sm text-zinc-200">Gemini provider</h2>
          <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
            {settings?.providerStatus === 'configured' ? 'Configured' : 'Not configured'}
          </span>
        </div>
        <p className="mt-2 min-w-0 text-xs text-zinc-500">
          Use a Gemini API key from Google AI Studio. It usually starts with AIza or AQ. Credentials
          are stored only in local browser storage.
        </p>

        <div className="mt-3 grid min-w-0 gap-2">
          <p className="min-w-0 break-all rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-500">
            <span className="text-zinc-400">Endpoint:</span> {geminiProviderDefaults.baseUrl}
          </p>

          <label className="grid min-w-0 gap-1 text-xs text-zinc-300">
            Model
            <input
              className="min-w-0 max-w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-sky-500"
              disabled={isLoading || isSaving}
              onChange={(event) => {
                const model = event.currentTarget.value;

                resetProviderValidation();
                setProviderForm((currentForm) => ({
                  ...currentForm,
                  model,
                }));
              }}
              placeholder={geminiProviderDefaults.model}
              type="text"
              value={providerForm.model}
            />
          </label>

          <label className="grid min-w-0 gap-1 text-xs text-zinc-300">
            API key
            <input
              autoComplete="off"
              aria-describedby="gemini-api-key-validation"
              className={`min-w-0 max-w-full rounded-md border bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-sky-500 ${
                providerValidationState === 'success'
                  ? 'border-emerald-500 focus:border-emerald-400'
                  : providerValidationState === 'error'
                    ? 'border-pink-400 focus:border-pink-300'
                    : 'border-zinc-700'
              }`}
              disabled={isLoading || isSaving}
              onChange={(event) => {
                const apiKey = event.currentTarget.value;

                resetProviderValidation();
                setProviderForm((currentForm) => ({
                  ...currentForm,
                  apiKey,
                }));
              }}
              placeholder="Stored locally, never synced"
              type="password"
              value={providerForm.apiKey}
            />
            {providerValidationMessage ? (
              <span
                className={`break-words text-xs ${
                  providerValidationState === 'success'
                    ? 'text-emerald-300'
                    : providerValidationState === 'error'
                      ? 'text-pink-300'
                      : 'text-zinc-500'
                }`}
                id="gemini-api-key-validation"
              >
                {providerValidationMessage}
              </span>
            ) : null}
          </label>

          <a
            className="min-w-0 truncate text-xs font-medium text-sky-300 underline-offset-2 hover:text-sky-200 hover:underline"
            href="https://aistudio.google.com/app/apikey"
            rel="noreferrer"
            target="_blank"
          >
            Get a Gemini API key
          </a>

          <div className="mt-1 grid min-w-0 grid-cols-2 gap-2">
            <button
              className="min-w-0 rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || isSaving || isTestingConnection}
              onClick={() => void saveProviderConfig()}
              type="button"
            >
              Save Gemini
            </button>
            <button
              className="min-w-0 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || isSaving || isTestingConnection}
              onClick={() => void testGeminiConnection()}
              type="button"
            >
              {isTestingConnection ? 'Testing...' : 'Test'}
            </button>
            <button
              className="col-span-2 min-w-0 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                isLoading ||
                isSaving ||
                isTestingConnection ||
                settings?.providerStatus !== 'configured'
              }
              onClick={() => void clearProviderConfig()}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      <div className="mt-3 min-h-5 min-w-0 text-xs" role="status">
        {isSaving ? <p className="text-zinc-500">Saving...</p> : null}
        {errorMessage ? <p className="break-words text-pink-300">{errorMessage}</p> : null}
      </div>
    </main>
  );
}

export default App;

function toProviderForm(provider: ProviderConfig | null): ProviderForm {
  if (!provider) return defaultProviderForm;

  return {
    apiKey: provider.apiKey,
    model: provider.model || geminiProviderDefaults.model,
  };
}
