# QA report: out/settings.html

- `<sb-switch name="push">` (line 28) has no `label`, which the Switch contract marks required and which is the accessible name (the shadow DOM keeps the form from naming it); fix: add `label="Push notifications"`.
- `<sb-switch tone="success">` (line 27) uses `tone`, which is not a Switch prop (only `size` is a variant); fix: remove `tone`.
- `<sb-toggle name="digest" label=... description=...>` (line 29) uses props Toggle does not have (it has `variant`, `size`, `pressed`, `disabled`). A toggle is an action button that submits nothing, so `name` does nothing and the label and description are never shown; fix: use `<sb-switch name="digest" label="Weekly digest" description="A summary every Monday">`, which suits a setting saved with a form.
- `.hint` (line 13) hardcodes `color: #d33`, which skips the token layers and ignores dark mode; fix: use a semantic token such as `var(--sb-color-destructive)`, or better the muted foreground token, since this is neutral help text and not an error.
- `.hint` (line 13) uses `--sb-font-size-small`, which does not exist in `generated/css/tokens.css`, so the size silently falls back to inherited; fix: use `--sb-font-size-sm` or `--sb-font-size-caption`.
- `.fields` (line 12) uses `--sb-space-17`, which does not exist (the scale stops at `--sb-space-16`), so `gap` is invalid and the rows collapse together; fix: use `var(--sb-space-4)`.
- The Save control (lines 15 and 34) is a raw `<button class="save">` styled by hand with `padding`, `radius` and `primary` tokens, and it has no hover, focus-visible or disabled styles; fix: use `<sb-button type="submit">Save</sb-button>` and delete the `.save` rule.
