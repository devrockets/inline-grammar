# Roadmap

This roadmap tracks the Chrome/Chromium MVP. Keep tasks small enough to complete and verify during
normal development sessions.

## 0. Project Foundation

- [x] Preserve old implementation on an archive branch.
- [x] Restart `main` from a clean WXT React scaffold.
- [x] Pin Node, pnpm, WXT, React, TypeScript, Tailwind, and Biome versions.
- [x] Configure Tailwind through WXT/Vite.
- [x] Configure Biome formatting and linting.
- [x] Add a static browser playground fixture at `test/global-fixtures/playground.html`.
- [x] Set extension metadata and Chrome MV3 manifest basics.
- [x] Replace placeholder extension icons.

## 1. Popup And Local Settings

- [x] Define preset metadata for Clear, Formal, Friendly, and Concise.
- [x] Define typed extension settings with defaults.
- [x] Store settings in `browser.storage.local`.
- [x] Make the popup load settings on open.
- [x] Make the enable toggle persist changes.
- [x] Make preset selection persist changes.
- [x] Show provider status without provider setup.
- [x] Add loading and save-error states.
- [x] Verify popup accessibility semantics and keyboard flow.

## 2. Field Detection

- [x] Detect eligible `input[type="text"]`, `textarea`, and contenteditable fields.
- [x] Ignore password, payment, OTP, readonly, disabled, hidden, and non-writing inputs.
- [x] Attach only one controller per eligible field.
- [x] React to fields added after page load.
- [x] Respect global enabled/disabled setting.
- [x] Verify behavior manually against the playground fixture.

## 3. Mock Checking Loop

- [x] Add debounce for typing events.
- [x] Check only text with at least three words.
- [x] Cache identical text during the browser session.
- [x] Add a deterministic mock grammar provider.
- [x] Return structured suggestions with ranges, labels, and replacements.
- [x] Avoid network calls in the mock provider.

## 4. Inline UI

- [x] Render subtle issue cues.
- [x] Render a small field indicator.
- [x] Open a suggestion popover from the cue.
- [x] Apply a selected replacement to input and textarea fields.
- [x] Apply a selected replacement to simple contenteditable fields.
- [x] Add one-step undo for applied suggestions.
- [x] Keep UI usable on LinkedIn-like text fields.

## 5. Whole Sentence Rephrase

- [x] Detect sentence boundaries for the active field text.
- [x] Offer a whole-sentence rephrase action.
- [x] Apply the active preset tone to mock rephrase output.
- [x] Preserve user selection and focus where practical.

## 6. Tests

- [x] Add Vitest for pure modules.
- [x] Add tests for settings defaults and storage behavior.
- [x] Add tests for field eligibility.
- [x] Add tests for debounce and cache behavior.
- [x] Add Playwright extension e2e setup.
- [x] Add e2e coverage using `test/global-fixtures/playground.html`.
- [ ] Add visual assertions for inline cue and popover.

## 7. Provider Setup

- [x] Decide the first real provider integration.
- [x] Define provider configuration shape without storing secrets in code.
- [x] Store provider credentials only in non-synced local browser storage.
- [ ] Add `.env.example` entries only if local development requires environment variables.
- [x] Add provider connection status checks.
- [x] Add explicit error states for missing or invalid local credentials.
- [x] Add explicit error states for unauthorized provider credentials.
- [x] Route configured checking requests through Gemini.

## 8. Release Readiness

- [ ] Replace placeholder icons and screenshots.
- [ ] Add privacy policy draft.
- [ ] Add manual install instructions for unpacked Chrome extension usage.
- [ ] Add production build ZIP instructions.
- [ ] Review Chrome Web Store permission wording.
- [ ] Review accessibility basics.
- [ ] Review security and privacy risks before enabling a real provider.
