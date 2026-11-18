# QA report: out/settings.html

- `<sb-switch name="push">` has no `label`, which the Switch contract requires (it is the accessible name, and an external `<label>` cannot reach the inner input), so the switch has no name. Fix: add `label="Push notifications"` (or similar).
- `<sb-switch ... tone="success">` uses `tone`, which is not a Switch prop (props: label, hide-label, description, error, name, value, checked, required, disabled, size). Fix: remove `tone="success"`.
- `<sb-toggle name="digest" label=... description=...>`: Toggle has no `name`, `label` or `description` props, is not a form field, and its contract says not to use it for a value that waits for Save. Fix: replace it with `<sb-switch name="digest" label="Weekly digest" description="A summary every Monday">`.
- The Save control is a raw `<button class="save">` styled by hand with a `.save` rule instead of the design system Button. Fix: use `<sb-button type="submit">Save</sb-button>` and delete the `.save` rule.
- `.fields { gap: var(--sb-space-17) }` uses a token that does not exist (the space scale is 0–6, 8, 10, 12, 16), so the gap is dropped. Fix: use an existing step, e.g. `var(--sb-space-4)`.
- `.hint { font-size: var(--sb-font-size-small) }` uses a token that does not exist, so the font size falls back to inherited. Fix: use `var(--sb-font-size-sm)` (or `--sb-font-size-caption`).
- `.hint { color: #d33 }` hard-codes a raw hex color instead of a token and shows neutral help text in an error-red color. Fix: use `color: var(--sb-color-muted-foreground)`.
- `<sb-card-title>Notification settings</sb-card-title>` has no real heading inside, so the page has no heading in the document outline (the Card contract says to put one there). Fix: write `<sb-card-title><h1>Notification settings</h1></sb-card-title>`.
