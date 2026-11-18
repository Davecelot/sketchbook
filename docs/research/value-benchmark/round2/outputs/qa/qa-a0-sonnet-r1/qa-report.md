# QA report: out/settings.html

Note: `node_modules/sketchbook` is not installed in this workspace, so I could not check component, attribute or token names against the design system's own definitions. Each finding below is based on what the page itself shows.

- `<sb-switch name="push" description="Alerts on your phone">` has no `label` attribute, unlike the other two controls, so it has no visible label or accessible name. Fix: add `label="Push"`.
- `.hint { color: #d33 }` uses a hard-coded hex color instead of a `--sb-color-*` token. It also reads as an error red for neutral help text. Fix: use a design-system token such as a muted-foreground or text-secondary token.
- `.fields { gap: var(--sb-space-17) }` uses a spacing step far outside the other steps on the page (2, 4, 6). It is likely not a real token, in which case the gap silently collapses to 0. Fix: use a valid scale token such as `var(--sb-space-4)`.
- The Save action is a raw `<button class="save">` restyled with local CSS. It bypasses the design system's button component, and it has no hover, focus-visible or disabled styling. Fix: replace it with the design system's button component, e.g. `<sb-button type="submit">Save</sb-button>`, and delete the `.save` rule.
- The "Weekly digest" control is an `<sb-toggle>` while the other two on/off settings are `<sb-switch>`. The same kind of setting is rendered with two different components. Fix: use `<sb-switch>` for all three, unless the toggle is intentional.
- `tone="success"` is set only on the Email switch, so one of three sibling controls is styled differently with no semantic reason. Fix: remove `tone` or apply it consistently.
- The hint "Changes apply after you save." is a bare `<p>` that is not linked to the form or controls. Fix: give it an `id` and reference it with `aria-describedby` on the form, or use the design system's helper-text component.
- The card heading is `<sb-card-title>` with no explicit heading level, and the page has no `<h1>`. Fix: confirm the title renders as a heading, or add an `<h1>`.
