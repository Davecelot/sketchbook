# QA report: out/settings.html

- Line 28: `<sb-switch name="push">` has no `label`, which the Switch contract requires (it is the accessible name and the visible text), so the switch has no name. Fix: add `label="Push"`.
- Line 27: `tone="success"` is not a Switch prop (props are label, hide-label, description, error, name, value, checked, required, disabled, size), so it is ignored. Fix: remove `tone`.
- Line 29: `<sb-toggle name="digest" label=… description=…>` uses props Toggle doesn't have (only variant, size, pressed, disabled). The toggle has no visible text or form value, and the "Weekly digest" label never shows. Fix: use `<sb-switch name="digest" label="Weekly digest" description="A summary every Monday">`, as with the other two rows.
- Line 12: `var(--sb-space-17)` is not a defined token, so the `gap` is invalid and the fields stack with no spacing. Fix: use an existing token such as `var(--sb-space-4)` or `var(--sb-space-stack-md)`.
- Line 13: `var(--sb-font-size-small)` is not a defined token (the scale has `sm`/`xs`/`caption`), so `.hint` falls back to the inherited size. Fix: use `var(--sb-font-size-sm)` or `var(--sb-font-size-caption)`.
- Line 13: `.hint` uses the literal colour `#d33`, which bypasses the tokens and breaks in dark mode. The text is also neutral help text, not an error. Fix: use `color: var(--sb-color-muted-foreground)`.
- Line 34: the Save action is a raw `<button class="save">` restyled by hand in lines 15 and 34, so it has no focus ring, hover, disabled or density behaviour. Fix: use `<sb-button type="submit">Save</sb-button>` and delete the `.save` rule.
