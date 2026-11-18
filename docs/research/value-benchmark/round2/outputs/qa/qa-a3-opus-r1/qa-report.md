# QA report: out/settings.html

- Line 28: `<sb-switch name="push">` has no `label`, which the switch contract requires (`label` is `required: true` and is the switch's only accessible name), so screen readers announce an unnamed switch and the dev warning fires. Fix: add `label="Push notifications"`.
- Line 27: `tone="success"` is not a switch prop (the contract defines only label, hideLabel, description, error, name, value, checked, required, disabled, size). Fix: remove `tone="success"`.
- Line 29: `<sb-toggle>` is used as a form field, but the toggle contract says it submits nothing (`formAssociation.value: false`), so "digest" never reaches FormData. Fix: replace it with `<sb-switch name="digest" label="Weekly digest" description="A summary every Monday"></sb-switch>`.
- Line 29: `name`, `label` and `description` are not toggle props. Toggle takes its name from default-slot text, so this toggle has no accessible name and the label and description never render. Fix: use `sb-switch` (see the previous fix). If a toggle is really needed, put the text in the slot: `<sb-toggle>Weekly digest</sb-toggle>`.
- Line 12: `var(--sb-space-17)` does not exist in `generated/css/tokens.css` (the scale stops at `--sb-space-16`), so the declaration is invalid and the fields get no gap. Fix: use an existing token, such as `gap: var(--sb-space-stack-md)` or `var(--sb-space-4)`.
- Line 13: `var(--sb-font-size-small)` does not exist (the defined tokens are `--sb-font-size-sm` and `--sb-font-size-caption`). Fix: `font-size: var(--sb-font-size-sm)`.
- Line 13: the hint uses the hard-coded colour `#d33` instead of a token. It also colours neutral help text red as if it were an error, and it does not switch in dark mode. Fix: `color: var(--sb-color-muted-foreground)`.
- Line 34 and line 15: the Save action is a raw `<button class="save">` styled by hand instead of the design system's Button component. Fix: `<sb-button type="submit">Save</sb-button>` and delete the `.save` rule.
