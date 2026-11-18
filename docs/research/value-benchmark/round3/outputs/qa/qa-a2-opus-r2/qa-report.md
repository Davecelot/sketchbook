# QA report: out/settings.html

- `<sb-switch name="push">` has no `label`, which the Switch contract requires (it is the accessible name; shadow DOM blocks external labels), so the control has no name. Fix: add `label="Push notifications"`.
- `tone="success"` on the Email `<sb-switch>` is not a Switch prop (only label, hide-label, description, error, name, value, checked, required, disabled, size). Fix: remove `tone="success"`.
- `<sb-toggle name="digest" label="Weekly digest" description="…">` misuses Toggle: it is a pressable button for immediate effects, not a form field, has no `name`/`label`/`description` props, and the contract says to use Switch or Checkbox for a value saved with a form. Fix: replace it with `<sb-switch name="digest" label="Weekly digest" description="A summary every Monday"></sb-switch>`.
- The native `<button type="submit" class="save">` plus the hand-written `.save` styles rebuild Button outside the design system. Fix: use `<sb-button type="submit">Save</sb-button>` and delete the `.save` rule.
- `.hint { color: #d33 }` hard-codes a raw hex color instead of a token, and paints neutral help text in error red. Fix: use `color: var(--sb-color-muted-foreground)`.
- `.hint` uses `var(--sb-font-size-small)`, which is not a defined token (the sizes are `sm`, `caption`, and so on), so the declaration does nothing. Fix: use `var(--sb-font-size-sm)`.
- `.fields { gap: var(--sb-space-17) }` points to a spacing token that does not exist (the scale stops at 16; there is no 17), so the fields get no gap. Fix: use a defined token such as `var(--sb-space-stack-md)` or `var(--sb-space-4)`.
- `<sb-card-title>Notification settings</sb-card-title>` contains no real heading, so the page has no heading in its document outline (the Card contract says to put one inside the title). Fix: write `<sb-card-title><h1>Notification settings</h1></sb-card-title>`.
