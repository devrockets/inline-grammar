# Inline Grammar

Inline Grammar is an open-source Chrome/Chromium extension that brings English grammar, spelling,
and tone suggestions directly into the text fields where people already write.

The project is aimed first at people who do not speak English natively and want help writing clear,
natural text without paying for another writing subscription or repeatedly copying text into a
separate AI chat. Users connect their own Gemini API key, choose a writing preset, and receive
suggestions inline while typing.

> [!IMPORTANT]
> Inline Grammar is an early production-MVP project. It currently supports English and Gemini only.
> Review the [privacy and security notes](#privacy-and-security) before using it with sensitive text.

## Current MVP

- Runs on Chrome and Chromium-based browsers using Manifest V3.
- Works on regular text inputs, textareas, and supported contenteditable editors.
- Detects fields added dynamically by single-page applications.
- Checks text containing at least three words after a 1.5-second typing debounce.
- Sends superseding requests when the text or selected preset changes.
- Shows progress, clean-text, suggestion-count, and provider-error indicator states.
- Displays each suggestion with its explanation, current text, and proposed replacement.
- Highlights the relevant contenteditable range when a suggestion is hovered or focused.
- Temporarily selects the relevant text in inputs and textareas on pointer hover.
- Supports applying one suggestion, applying all suggestions, and one-step undo.
- Stores settings and provider credentials in non-synced browser-local storage restricted to
  trusted extension contexts.
- Has no application backend, user accounts, analytics, or remote project database.

Inline Grammar intentionally ignores password fields and other fields classified as sensitive or
unsuitable for writing assistance. It also ignores disabled, readonly, and hidden fields.

## Writing presets

The selected preset is included in every Gemini analysis request:

| Preset | Intended result |
| --- | --- |
| Clear | Correct grammar and spelling while preserving the original tone. |
| Formal | Produce polished language suitable for professional communication. |
| Friendly | Produce warm, natural, and approachable language. |
| Concise | Shorten and clarify the text without losing its meaning. |

English is the only supported language in the MVP.

## How it works

1. The content script discovers supported writing fields on the current page.
2. After the user types at least three words, a 1.5-second debounce starts.
3. The content script sends the field text and selected preset to Inline Grammar's background
   service worker; it never receives the stored API key.
4. The service worker loads the provider configuration and sends the request directly to Gemini.
5. Gemini returns structured replacements with source-text ranges and explanations.
6. The extension validates and normalizes those ranges before displaying suggestions.
7. The user can inspect, apply, or ignore each suggestion without leaving the page.

Identical text and preset combinations are cached for the current extension session to avoid
unnecessary repeat requests. An in-flight request is cancelled when newer text or configuration
makes its result obsolete.

## Prerequisites

- Chrome or another Chromium-based browser
- [Node.js](https://nodejs.org/) 24.x
- [pnpm](https://pnpm.io/) 11.19.0
- A Gemini API key with access to the configured model

This repository pins the expected Node version in `.tool-versions` and the pnpm version in
`package.json`. If Node is managed with asdf, run `asdf install` from the repository root.

## Local development

Install dependencies:

```bash
pnpm install
```

Start WXT in development mode:

```bash
pnpm dev
```

For a production build:

```bash
pnpm build
```

WXT writes the unpacked Chrome extension to `.output/chrome-mv3`.

To build and package the production extension as a ZIP archive:

```bash
pnpm zip
```

For version `0.1.0`, the archive is written to
`.output/inline-grammar-0.1.0-chrome.zip`. The versioned filename follows the `version` field in
`package.json`. Both the unpacked build and ZIP archive are generated artifacts and are ignored by
Git.

### Load the extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this repository's `.output/chrome-mv3` directory.
5. Reload the extension after rebuilding it.

For active development, keep `pnpm dev` running and reload the extension or target page when Chrome
does not pick up a change automatically.

## Configure Gemini

1. Open Inline Grammar from the browser toolbar.
2. Review the data-use disclosure and choose **I agree and continue**.
3. Paste a Gemini API key into the provider form that appears.
4. Keep the default model (`gemini-3.6-flash`) or enter another Gemini model identifier available to
   the key.
5. Use **Test connection** to confirm that Gemini recognizes the key and model.
6. Save the provider configuration.
7. Select a writing preset and leave the extension enabled.

The connection test checks whether the key and model are recognized. It does not make a text
generation request, so a successful test can still be followed by a quota, permission, or model
availability error during analysis.

Google may return `429 RESOURCE_EXHAUSTED` when the key reaches its request quota. Wait for the quota
window to reset or use a project with sufficient quota. A `401` or `403` during text generation
usually means the credential is not valid for the Gemini `generateContent` endpoint or lacks access
to the selected model.

## Privacy and security

- The API key is stored with `chrome.storage.local`, not `chrome.storage.sync`, so Inline Grammar
  does not intentionally sync it through the browser account.
- Local storage is restricted to trusted extension contexts. Content scripts receive only the
  enabled state, selected preset, consent state, and provider connection status through typed
  background messages.
- Provider connection tests and text-analysis requests run in the background service worker; the
  API key is not placed in page-facing content-script memory.
- Browser-local extension storage is not encrypted by this project. Anyone or any software with
  sufficient access to the browser profile may be able to read it.
- Text from eligible fields is sent by the background service worker directly to Google's Gemini
  API for analysis when a provider is configured and the user has accepted the in-product data-use
  disclosure.
- Provider configurations created before the consent gate was introduced remain blocked until the
  user reviews and accepts the disclosure. The accepted disclosure is remembered independently of
  the provider, so clearing or replacing a key does not show it again.
- Inline Grammar does not send the text through a project-owned server and does not store it in a
  project database.
- The project has no analytics or telemetry. Development builds log request metadata such as model,
  preset, status, duration, and suggestion counts, but do not log the API key or submitted text.
- The extension is designed to ignore sensitive field types, but field classification cannot replace
  user judgment. Do not use the MVP for secrets, regulated data, or other sensitive content.

Before publishing the extension, the project still needs a formal privacy policy and a dedicated
security/privacy review.

## Testing and quality checks

Run the complete unit test suite:

```bash
pnpm test
```

Install Playwright's Chromium binary once if it is not already available, then run the browser tests:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Other useful checks:

```bash
pnpm run compile
pnpm exec biome check .
pnpm build
```

The end-to-end suite loads the built extension against local playground pages, including a
LinkedIn-like contenteditable editor and a modal/backdrop regression fixture. Test organization and
naming rules are documented in [`specs/testing-guidelines.md`](specs/testing-guidelines.md).

## Project structure

```text
entrypoints/
  background.ts       Credential boundary, provider requests, and safe settings messages
  content.ts          Content script and page-field lifecycle
  popup/              React settings and provider configuration UI
lib/
  checking-controller.ts
                      Debouncing, cancellation, session caching, and check state
  background-*.ts     Typed service-worker request and response boundary
  gemini-provider.ts  Gemini request, response validation, and error handling
  field-*.ts          Field discovery, eligibility, indicator, and selection behavior
  issue-cues.ts       Source-range highlighting and native selection cues
  suggestion-popover.ts
                      Suggestion comparison and actions
  apply-suggestions.ts
                      Apply, apply-all, and undo behavior
test/
  unit/               Vitest module and regression tests
  e2e/                Playwright extension tests
  global-fixtures/    Local pages used by browser tests
docs/                 Release, policy, and user-facing project documentation
specs/                Engineering conventions and supporting specifications
```

The project uses [WXT](https://wxt.dev/) and React for extension entrypoints, Tailwind CSS for the
popup styling, Biome for formatting and linting, Vitest for unit tests, and Playwright for browser
tests.

## Known limitations

- Chrome/Chromium only; Firefox and Safari have not been validated.
- English only.
- Gemini is the only real provider integration.
- API-key configuration only; OAuth authorization is not part of the MVP.
- Credentials are browser-local but are not encrypted by Inline Grammar.
- Checks run on all websites for supported fields; per-site policies are not implemented.
- Complex rich-text editors may represent text in ways the current DOM-range mapper does not yet
  support.
- The project does not yet have visual-regression assertions, a privacy policy, or an automated
  store-release workflow.

See [`ROADMAP.md`](ROADMAP.md) for completed milestones and planned release work.
Chrome Web Store access and disclosure decisions are recorded in
[`docs/chrome-web-store.md`](docs/chrome-web-store.md).
The current threat model, controls, and accepted MVP risks are recorded in
[`docs/security-privacy-review.md`](docs/security-privacy-review.md).

## Contributing

This is an early-stage project, so keep changes small, evidence-backed, and focused on the current
MVP. Add regression coverage for bug fixes and follow the repository's testing conventions. Please
run compilation, Biome, unit tests, relevant end-to-end tests, and a production build before opening
a pull request.

## License

Inline Grammar is available under the [MIT License](LICENSE).
