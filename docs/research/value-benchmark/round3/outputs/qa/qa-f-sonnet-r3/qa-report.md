# QA report: out/settings.html

- `<sb-switch name="push">` has no `label`, which the Switch contract marks required (it is the accessible name, and an external `<label>` can't reach the shadow DOM). Fix: add `label="Push notifications"`.
- `<sb-toggle name="digest" label=… description=…>` misuses Toggle: it is a pressed-state button for immediate-effect options and has no `label`, `description` or `name` props. The Toggle contract says to use Switch for a setting saved with a form. Fix: use `<sb-switch name="digest" label="Weekly digest" description="A summary every Monday">`.
- `tone="success"` on the Email `<sb-switch>` is not a Switch prop (the props are label, hide-label, description, error, name, value, checked, required, disabled, size). Fix: remove the attribute.
- `.fields` uses `var(--sb-space-17)`, which doesn't exist (the spacing tokens stop at `--sb-space-16`), so the gap is invalid and drops out. Fix: use a defined step such as `var(--sb-space-4)`.
- `.hint` uses `var(--sb-font-size-small)`, which is not defined in tokens.css, so the size falls back to the inherited one. Fix: use `var(--sb-font-size-sm)` or `var(--sb-font-size-caption)`.
- `.hint` hard-codes `color: #d33` instead of a token, and the red reads as an error for neutral help text. Fix: use `var(--sb-color-muted-foreground)`.
- The Save control is a hand-styled native `<button class="save">` rather than the design system's `sb-button`, so it lacks the standard focus-visible ring, hover and disabled states and the control sizing. Fix: use `<sb-button type="submit">Save</sb-button>` and delete `.save`.
- The hint "Changes apply after you save." is a loose `<p class="hint">` in `sb-card-content`, though Card provides `sb-card-description`. Fix: replace it with `<sb-card-description>` in the card header.
