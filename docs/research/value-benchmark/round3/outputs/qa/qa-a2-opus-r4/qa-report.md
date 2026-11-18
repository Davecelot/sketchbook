# QA report: out/settings.html

- `<sb-switch name="push">` has no `label`, which the Switch contract requires (`label` is required and is the accessible name; the switch is unnamed for screen readers). Fix: add `label="Push notifications"`.
- `<sb-switch name="email" … tone="success">` uses `tone`, which is not a Switch prop and not in the API vocabulary (spec/api.json), so it does nothing. Fix: remove `tone="success"`.
- `<sb-toggle name="digest" label="Weekly digest" description="…">` misuses Toggle: the contract says it is not a form field and should not be used for a value saved with a form, and it has no `name`, `label` or `description` props (it renders an empty, unnamed button). Fix: replace it with `<sb-switch name="digest" label="Weekly digest" description="A summary every Monday"></sb-switch>`.
- `.fields { gap: var(--sb-space-17) }` references a token that does not exist (the spacing scale stops at `--sb-space-16`), so the gap collapses to 0. Fix: use a defined token, e.g. `var(--sb-space-stack-md)` or `var(--sb-space-4)`.
- `.hint { font-size: var(--sb-font-size-small) }` references a token that does not exist. Fix: use `var(--sb-font-size-sm)` (or `--sb-font-size-caption`).
- `.hint { color: #d33 }` hard-codes a raw hex color instead of a token, and renders neutral help text in an error red. Fix: use `color: var(--sb-color-muted-foreground)`.
- The Save button is a native `<button class="save">` styled by hand with tokens, not the design system's Button. Fix: replace it with `<sb-button type="submit">Save</sb-button>` and delete the `.save` rule.
- `<sb-card-title>Notification settings</sb-card-title>` contains no real heading, so the page has no heading at all (the Card contract says to put a real heading in the title when the card is in the document outline). Fix: `<sb-card-title><h1>Notification settings</h1></sb-card-title>`.
- The "Changes apply after you save." hint sits loose in `sb-card-content`. It reads as a description of the whole card. Fix: move it into `<sb-card-description>` inside `sb-card-header`, and remove the `.hint` rule.
