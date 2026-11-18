# QA report: out/settings.html

Scope note: the `sketchbook` package is not installed in this workspace (no `node_modules`), so I could not check component or token names against its source. These findings come from the page alone. The `--sb-space-17` item is the one most worth confirming.

- `<sb-switch name="push" ...>` has no `label` attribute, while its sibling switches do, so the control has no visible or accessible name. Fix: add `label="Push"` (or similar).
- `.hint` uses the hard-coded colour `#d33` instead of a design token, so it won't follow theming or dark mode. Fix: use a `--sb-color-*` token such as a muted or foreground-secondary one.
- `.hint` is a neutral note ("Changes apply after you save.") styled in an error-red colour, which reads as a validation error and may fail contrast on the card background. Fix: use a muted or neutral text token.
- `.fields { gap: var(--sb-space-17) }` is far off the scale used elsewhere on the page (`space-2`, `space-4`, `space-6`), and I could not confirm the token exists. If it doesn't, the gap silently falls back to 0. Fix: use an existing spacing token such as `var(--sb-space-4)`.
- The Save action is a hand-styled `<button class="save">` (custom padding, radius, colours, no focus-visible or hover/disabled states) rather than the system's button component. Fix: replace it with `<sb-button type="submit">Save</sb-button>` and delete the `.save` CSS.
- The list mixes `<sb-switch>` (Email, Push) with `<sb-toggle>` (Weekly digest) for the same on/off preference pattern, so the controls look and behave inconsistently. Fix: use `<sb-switch>` for all three.
- `tone="success"` is set only on the Email switch, so one row is tinted and the others are not, with no meaning attached. Fix: remove `tone`, or apply it consistently to every switch.
- The hint is not tied to the form controls and sits outside any live region or description. Fix: give it an `id` and reference it with `aria-describedby` on the form, or move it into the card footer next to Save.
