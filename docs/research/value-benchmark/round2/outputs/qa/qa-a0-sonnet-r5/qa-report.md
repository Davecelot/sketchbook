# QA report: out/settings.html

Note: the `sketchbook` package is not installed (no `node_modules`), so component, attribute and token names could not be checked against the real spec. These findings come only from what the page shows.

- `<sb-switch name="push" description="Alerts on your phone">` has no `label`, while its siblings do, so the control has no visible or accessible name. Fix: add `label="Push notifications"`.
- The third control is `<sb-toggle>`, but the other two settings in the same list are `<sb-switch>`, so one on/off list mixes two components. Fix: use `<sb-switch name="digest" ...>` unless a toggle is intended.
- `tone="success"` is set only on the Email switch, so the three controls in the list look inconsistent. Fix: drop `tone` or apply the same tone to all three.
- `.hint` hardcodes `color: #d33` instead of a design token, so it won't follow theming or dark mode. It is also error-red for neutral help text. Fix: use a token such as `var(--sb-color-muted-foreground)`.
- The hint "Changes apply after you save." is not tied to the controls (no `aria-describedby`, not in the card's description slot). Fix: give it an `id` and reference it from the form or controls, or use the design system's description/helper component.
- The Save button is a raw `<button class="save">` with hand-rolled padding, radius and colors. It has no hover, focus-visible or disabled styling, and it bypasses the design system's button component. Fix: replace it with `<sb-button type="submit">Save</sb-button>` (or the equivalent) and delete `.save`.
- `.fields` uses `gap: var(--sb-space-17)`, which looks like an out-of-scale spacing token, since the other spacing tokens used are 2, 4 and 6. It is likely undefined, in which case the gap collapses to 0. Fix: confirm the token exists in `tokens.css` and use a scale value such as `--sb-space-4`.
- The three related switches are not grouped for assistive tech (no `fieldset`/`legend`, `role="group"` or `aria-labelledby`). Fix: wrap them in `<div role="group" aria-labelledby="...">` pointing at the card title.
