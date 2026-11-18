# QA report: out/settings.html

Note: the `sketchbook` package is not installed in this workspace (no `node_modules`), so component, attribute and token names could not be checked against the design system source. The findings below come from the page itself.

- `<sb-switch name="push" ...>` has no `label` attribute, while the "Email" switch has one, so the control has no accessible name. Fix: add `label="Push"` (or similar).
- `.hint { color: #d33 }` hardcodes a hex colour instead of a design token, so it will not follow theming or dark mode. Fix: use a `--sb-color-*` token (muted/foreground for a neutral hint, or the danger token if it is meant as an error).
- The `.hint` text "Changes apply after you save." is red, which reads as an error for what is neutral info. Fix: use a muted/neutral text token.
- `.fields { gap: var(--sb-space-17) }` uses a spacing step far outside the scale used elsewhere on the page (`space-2`, `space-4`, `space-6`) and likely does not exist, in which case the gap silently falls back to 0. Fix: use an existing step such as `var(--sb-space-4)`.
- The Save action is a native `<button class="save">` styled by hand with raw padding and radius, and it has no focus-visible or hover styles. Fix: use the design system's button component (e.g. `<sb-button type="submit">`) and delete the `.save` CSS.
- `<sb-toggle name="digest">` is mixed in with `<sb-switch>` controls that all do the same on/off job, so the group is inconsistent. A toggle is usually a pressed-state button rather than a form switch. Fix: use `<sb-switch>` for "Weekly digest".
- `tone="success"` is set only on the "Email" switch, so the three controls look inconsistent and the colour carries no clear meaning. Fix: remove it, or apply the same tone to all of them.
- The tokens stylesheet and component script are loaded through relative `../node_modules/...` paths, which break when the file is served or moved and do not resolve in this workspace. Fix: reference the built assets through a stable path or bundle them with the page.
