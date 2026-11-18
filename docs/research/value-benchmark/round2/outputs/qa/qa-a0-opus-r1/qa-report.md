# QA report: out/settings.html

- The second `<sb-switch name="push">` has a `description` but no `label`, so the control has no accessible name and no visible title. Fix: add `label="Push notifications"` (or similar).
- `.fields { gap: var(--sb-space-17) }` uses a spacing step that sits well past a normal spacing scale and is likely undefined, which would leave the gap unset. Fix: use a real step from the scale, such as `var(--sb-space-4)`.
- `.hint` hard-codes `color: #d33` instead of using a token, and red makes a neutral note look like an error. Fix: use the muted foreground token, such as `color: var(--sb-color-muted-foreground)`.
- The Save action is a raw `<button class="save">` styled by hand with tokens instead of the design system's button component. Fix: replace it with `<sb-button type="submit">Save</sb-button>` and delete the `.save` CSS.
- `tone="success"` on the Email `<sb-switch>` gives a settings toggle a status color, and a switch is unlikely to support that attribute. Fix: remove `tone="success"`.
- The weekly digest uses `<sb-toggle>` while the other on/off settings in the same list use `<sb-switch>`. A toggle is a pressed-state button, not a labelled form field with `label`/`description`. Fix: change it to `<sb-switch name="digest" label="Weekly digest" description="A summary every Monday">`.
- The page loads `../node_modules/sketchbook/...` (tokens.css and sketchbook.js), but `package.json` has no `sketchbook` dependency and there is no `node_modules`, so the components and tokens won't load. Fix: add `sketchbook` to `package.json` dependencies and install it.
