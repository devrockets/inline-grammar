# Chrome Web Store Notes

This document records the current permission rationale and proposed user-facing disclosure for the
Chrome/Chromium MVP. Revisit it whenever the manifest, provider integration, or data flow changes.

## Current access

| Manifest entry | Why Inline Grammar needs it |
| --- | --- |
| `content_scripts.matches: ["<all_urls>"]` | Discover supported writing fields, read text after the user types, display inline cues, and apply replacements on websites where the user writes. |
| `permissions: ["storage"]` | Store the enabled state, selected preset, Gemini model, and API key in non-synced `chrome.storage.local`. |
| `host_permissions: ["https://generativelanguage.googleapis.com/*"]` | Test the configured Gemini model and send analysis requests directly from the extension to the Gemini API. |

The all-sites content-script match is the broadest access in the manifest. It is retained because the
current product requirement is to work automatically on supported fields across all websites.
Chrome may describe this capability with a warning comparable to “Read and change all your data on
the websites you visit.” Inline Grammar must explain why this access is necessary before users
install or enable the product.

The extension does not request access to tabs, cookies, browsing history, downloads, geolocation,
the clipboard, or web-request interception.

## Proposed store permission explanation

> Inline Grammar needs access to pages you visit so it can detect writing fields, check text after
> you type, show grammar suggestions beside the field, and apply only the changes you select. It
> ignores password and other sensitive field types. Your text is sent directly to your configured
> AI provider for analysis; Inline Grammar does not operate an application server.

## Proposed prominent in-product disclosure

Display this disclosure before revealing provider configuration for the first time and require an
affirmative user action:

> When Inline Grammar is enabled, text you type in supported writing fields may be sent directly to
> the AI provider you configure after a short delay so grammar and tone suggestions can be generated.
> Your provider credentials are stored locally in this browser profile and are not synced by Inline
> Grammar. Do not use the extension for secrets or sensitive information.

The popup presents the provider-neutral disclosure as the first provider-setup step. Provider inputs
and actions remain hidden until the user selects **I agree and continue**. Consent is stored locally
and independently from provider credentials, so the disclosure is shown only once. A legacy provider
without recorded consent remains configured but cannot send text externally until the user reviews
and accepts the disclosure. The next step identifies Gemini because it is the only provider currently
implemented.

## Review decision

- Keep `<all_urls>` for the current all-sites MVP.
- Keep `storage`; it is necessary and limited to local extension settings.
- Keep the narrowly scoped Gemini API host permission while Gemini is the only real provider.
- Do not add broader host permissions for hypothetical future providers.
- Revisit optional per-site access after the MVP. Runtime permission requests would provide clearer
  context and user control, but they would change the agreed automatic all-sites workflow.
- Re-test Chrome's displayed warnings from the packed extension before store submission.

## Policy references

- [Declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
- [Permission warning guidelines](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings)
- [Chrome Web Store user data policy](https://developer.chrome.com/docs/webstore/user_data)
- [Disclosure requirements](https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements)
