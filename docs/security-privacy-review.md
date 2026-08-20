# Security and Privacy Review

This review describes the Chrome/Chromium MVP as currently implemented. It is a point-in-time
engineering assessment, not a guarantee that every website or browser environment is safe.

## Data flow

1. The content script discovers a supported writing field on a page.
2. After at least three words and a 1.5-second debounce, it reads that field's current text.
3. The content script sends the text and selected preset to the extension background service
   worker. It receives only non-secret settings and check results.
4. If the user has accepted the disclosure and configured Gemini, the service worker loads the
   provider credential and sends the text, selected preset, and structured instructions directly
   to Google's HTTPS Gemini endpoint.
5. Gemini returns proposed ranges and replacements. The extension validates them before display.
6. The user decides whether to apply a suggestion.

Inline Grammar has no application server, account system, analytics pipeline, or remote database.

## Stored data

| Data | Location | Retention |
| --- | --- | --- |
| Enabled state, language, and preset | `chrome.storage.local` | Until extension data is cleared or the extension is removed |
| Provider consent | `chrome.storage.local` | Until extension data is cleared or the extension is removed |
| Gemini model and API key | `chrome.storage.local` | Until the provider is cleared, extension data is cleared, or the extension is removed |
| Checked text and suggestions | In-memory extension processes | Current extension/page process only; not intentionally written to disk by Inline Grammar |

`chrome.storage.local` is non-synced but is not encrypted by Inline Grammar. A person or program with
sufficient access to the browser profile may be able to read the API key.

## Existing controls

- Provider configuration is hidden until the user accepts a prominent, provider-neutral data-use
  disclosure.
- A configured provider without recorded consent is blocked below the UI before any provider call.
- `chrome.storage.local` is restricted to trusted extension contexts. Content scripts cannot read
  provider credentials and receive only a sanitized settings projection through runtime messages.
- Provider connection tests and text-analysis network calls run in the background service worker.
- Provider URLs must use HTTPS; the current popup creates only the fixed Gemini endpoint.
- The manifest requests only storage, all-sites content-script access, and the Gemini API host.
- Password fields are always ignored.
- Payment, one-time-code, credential, token, and secret fields are excluded using autocomplete
  metadata and normalized names, IDs, labels, ARIA labels, and placeholders.
- Hidden fields are ignored; disabled and readonly fields are not checked.
- Newer input cancels obsolete requests, and provider calls have a timeout.
- Provider responses are treated as untrusted structured data. Ranges are validated against the
  source text before a suggestion can be applied.
- UI strings use `textContent` or React escaping; provider output is not inserted as HTML.
- Development logs contain request metadata but not submitted text or API keys.
- There is no use of `eval`, remote executable code, cookies, browsing history, clipboard access, or
  network interception.

## Accepted MVP risks

### Local credential storage

The API key is stored unencrypted in non-synced extension-local storage. This was accepted for the
MVP and is disclosed to the user. Local encryption without a user-supplied secret would provide
limited protection because the extension must also possess the decryption material.

### All-sites access

The content script runs on all normal websites to satisfy the agreed automatic all-sites workflow.
This produces broad installation access. Per-site allow/deny controls and optional runtime host
permissions remain future hardening opportunities.

### Heuristic sensitive-field detection

Websites do not consistently label sensitive fields. The classifier uses defensive heuristics, but
it cannot guarantee that every custom editor containing sensitive material will be recognized. The
disclosure therefore tells users not to enter secrets or sensitive information while the extension
is enabled.

### Third-party processing

Submitted text is subject to the configured provider's policies, retention, account settings, and
quota. Inline Grammar cannot control provider-side processing and must link to the relevant provider
terms in release documentation.

## Release blockers and follow-up

- Publish a privacy policy that accurately describes local storage and provider transmission.
- Add a public privacy contact and deletion/support instructions.
- Preserve the trusted-context storage restriction and background-worker request boundary when
  adding providers; do not expose credentials or arbitrary provider URLs to content scripts.
- Manually test sensitive-field exclusions on representative login, payment, and account-recovery
  pages.
- Re-run this review whenever a provider, permission, data field, analytics feature, or remote service
  is added.
