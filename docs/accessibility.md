# Accessibility Review

This review covers the Chrome/Chromium MVP popup, field indicator, and suggestion dialog. The target
is a practical WCAG 2.2 AA baseline; this is an engineering review, not a formal accessibility
conformance claim.

## Implemented baseline

- Popup fields use native labels, fieldsets, legends, radio inputs, and buttons.
- Save and provider-validation changes use live status regions.
- The field indicator is a native button with a descriptive state-dependent accessible name.
- The indicator exposes `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` while its
  suggestion dialog is open.
- Native button keyboard activation is used without duplicate custom Enter/Space handling.
- Escape closes the suggestion dialog and restores focus to its indicator.
- Suggestion actions remain reachable in document order without adding a redundant focus stop to
  each static suggestion card.
- Keyboard focus within a suggestion card activates the same source-text cue as pointer hover for
  contenteditable fields.
- Checking animation honors `prefers-reduced-motion`.
- The field indicator has a minimum 24 by 24 CSS-pixel target.
- Small text and action colors use higher-contrast foreground/background combinations.
- Suggestion meaning is communicated with “Current” and “Suggested” labels rather than color alone.

## Automated evidence

- Unit tests cover accessible indicator semantics, target size, busy state, reduced motion, dialog
  association, Escape behavior, and focus restoration.
- End-to-end tests use accessible roles and names for popup and suggestion actions.
- End-to-end coverage verifies keyboard opening, scroll behavior, inline cues, and modal top-layer
  behavior.

## Manual checks still required before release

- Navigate the popup and an inline suggestion flow using only Tab, Shift+Tab, Enter, Space, and
  Escape in Chrome.
- Verify announcements with VoiceOver on macOS and at least one Windows screen reader.
- Test browser zoom at 200% and text spacing overrides.
- Test Windows forced-colors/high-contrast mode.
- Recheck contrast if brand colors or problem-grading colors are introduced.
- Confirm that injected controls do not obscure important host-page content at common viewport sizes.

## References

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- [Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
- [Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible)
- [Contrast technique G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18)
