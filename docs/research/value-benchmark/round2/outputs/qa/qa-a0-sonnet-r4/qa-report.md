# QA report: out/settings.html

Scope note: the Sketchbook package (`node_modules/sketchbook`) is not present in this workspace, so component and token names could not be checked against the real spec. Findings below are limited to what is visible in the page itself.

- `<sb-switch name="push" description="Alerts on your phone">` has no `label` attribute, while its sibling switch and the toggle do, so it has no visible label or accessible name. Fix: add `label="Push"`.
- `.fields { gap: var(--sb-space-17) }` uses an unusually high step compared with the other space tokens (`-2`, `-4`, `-6`), and it is likely not a defined token. If it is undefined, the gap silently collapses to 0. Fix: use a defined spacing token such as `var(--sb-space-4)`, after confirming it exists in `tokens.css`.
- `.hint { color: #d33 }` hardcodes a hex colour instead of an `--sb-color-*` token, and the red reads as an error for what is neutral helper text. Fix: use a muted or foreground-secondary token, for example `var(--sb-color-muted-foreground)`.
- `<button type="submit" class="save">` is a hand-styled native button that re-implements the primary style with tokens. It has no hover, focus-visible, disabled or size variants. Fix: replace it with the design system's button component (`<sb-button type="submit">`) and drop the `.save` rule.
- The first group of settings mixes `<sb-switch>` (Email, Push) with `<sb-toggle>` (Weekly digest) for the same kind of on/off setting, which gives inconsistent controls. Fix: use `<sb-switch name="digest" …>` for the digest, unless a toggle button is intended.
- `tone="success"` is set only on the Email switch, so one of three equivalent settings is coloured differently for no stated reason. Fix: remove `tone` or apply it consistently.
- `<p class="hint">` sits outside the controls and is not linked to the form, so assistive tech gets no association. Fix: give it an `id` and reference it with `aria-describedby` on the `<form>`, or use the card's footer or description slot if one exists.
- The `<script src=…sketchbook.js>` is a classic blocking script in `<head>`, with no `defer` or `type="module"`. Fix: add `defer`, or load it as a module if the bundle supports it.
