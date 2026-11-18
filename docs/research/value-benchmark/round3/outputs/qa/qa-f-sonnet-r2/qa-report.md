# QA report: out/settings.html

- Line 28: `<sb-switch name="push">` has no `label`, which the Switch contract requires (it is the accessible name), so the switch is unnamed for screen readers. Fix: add `label="Push"`.
- Line 29: `<sb-toggle>` is used for a saved form setting with `name`, `label` and `description`, but Toggle has only `variant`, `size`, `pressed` and `disabled`. Those attributes are ignored, so there is no visible label, and it is an `aria-pressed` button, not a form field. Fix: use `<sb-switch name="digest" label="Weekly digest" description="A summary every Monday">` (or `sb-checkbox`).
- Line 27: `tone="success"` is not a Switch attribute (allowed: label, hide-label, description, error, name, value, checked, required, disabled, size). Fix: remove `tone`.
- Line 12: `var(--sb-space-17)` is not a token (the scale stops at 16), so the `gap` is invalid and the fields get no spacing. Fix: use an existing step such as `var(--sb-space-4)`.
- Line 13: `var(--sb-font-size-small)` is not a token (the scale has `sm`, `xs`, `base` and so on), so the hint font size falls back to the inherited size. Fix: use `var(--sb-font-size-sm)`.
- Line 13: The hint colour is a hard-coded `#d33` instead of a token. It is also red, which reads as an error, though the text is neutral help. Fix: use `color: var(--sb-color-muted-foreground)`, or `sb-card-description` for supporting text.
- Lines 15 and 34: The Save control is a hand-styled `<button class="save">` that has no hover, focus-ring or disabled states, although the system provides `sb-button`. Fix: replace it with `<sb-button type="submit">Save</sb-button>` and drop the `.save` CSS.
- Line 31: The hint paragraph is custom markup inside `sb-card-content`. Fix: use `sb-card-description`, or put it in the header, for supporting text.
- Line 23: `sb-card-title` is only a visual heading and does not appear in the document outline, and the page has no `<h1>`. Fix: put `<h1>` inside `sb-card-title`.
- Lines 7-8: The tokens stylesheet and `sketchbook.js` load from `../node_modules/...` paths with a classic `<script>` and no `defer`, `type=module` or `fonts.css`, which makes the page fragile outside the repo layout. Fix: load the `generated/css/fonts.css` stylesheet too and use `<script type="module">`.
