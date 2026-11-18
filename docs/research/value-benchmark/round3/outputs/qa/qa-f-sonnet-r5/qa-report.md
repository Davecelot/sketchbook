# QA report: out/settings.html

- Line 12: `.fields` uses `var(--sb-space-17)`, which is not a token (the space scale ends at `--sb-space-16`), so the gap is dropped. Fix: use an existing token such as `var(--sb-space-stack-md)` or `var(--sb-space-4)`.
- Line 28: `<sb-switch name="push">` has no `label`. The Switch contract makes `label` required because it is the accessible name, so this switch is unnamed for screen readers. Fix: add `label="Push"`.
- Line 27: `tone="success"` is not a Switch attribute. The contract's props are label, hide-label, description, error, name, value, checked, required, disabled and size. Fix: remove `tone`; a checked switch already uses the primary track.
- Line 29: `<sb-toggle>` is used for a setting saved with the form. The Toggle contract says to use Switch or Checkbox for that case. Fix: change it to `<sb-switch name="digest" label="Weekly digest" description="A summary every Monday">`.
- Line 29: `label`, `description` and `name` are not Toggle props (it takes `pressed`, `variant`, `size` and slotted content). The label and description will not render and the value will not be submitted. Fix: use `sb-switch` as above.
- Line 13: `.hint` hard-codes `color: #d33`, bypassing the colour tokens, and the error-like red misleads for neutral help text. Fix: use `color: var(--sb-color-muted-foreground)`.
- Lines 15 and 34: the Save control is a raw `<button class="save">` with custom CSS. It has no hover, focus-visible (3px ring) or disabled states and bypasses the Button component. Fix: use `<sb-button type="submit">Save</sb-button>` and delete the `.save` rule.
- Line 23: `sb-card-title` holds plain text, and the page has no heading. Per the Card contract, a real heading is needed for the document outline. Fix: use `<sb-card-title><h1>Notification settings</h1></sb-card-title>`.
