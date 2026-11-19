---
title: "Use the components"
description: "Load the tokens and the elements in a page, switch theme, and rename the prefix."
order: 50
---

The default components are native Web Components, so they work in plain HTML and in any framework. This page is for the app that uses them; to change what they look like, change [the foundations](/guides/foundations/).

## Add them to a page

Without a bundler, load the self-contained bundle (Lit included):

```html
<link rel="stylesheet" href="node_modules/sketchbook/generated/css/tokens.css" />
<script src="node_modules/sketchbook/dist/sketchbook.js"></script>

<sb-input label="Email" type="email" name="email" required></sb-input>
<sb-button type="submit">Save</sb-button>
```

With a bundler, `import 'sketchbook'` and `import 'sketchbook/tokens.css'`. `lit` and `@lit/context` are peer dependencies, so the app and the elements share one copy.

The package exports four entries for apps (the `./harness/*` export is for the CLI and adapters):

| Import | What it is |
| --- | --- |
| `sketchbook` | The elements, as ES modules |
| `sketchbook/tokens.css` | Every token as a CSS custom property |
| `sketchbook/fonts.css` | The font faces the foundations use |
| `sketchbook/bundle` | One file with every element, for pages without a bundler |

## Theme

Dark mode follows `prefers-color-scheme`. Set `data-theme="dark"` or `data-theme="light"` on `<html>` to force one.

## Forms and events

Form controls take part in the surrounding `<form>`: `name`, `required`, `disabled` and the value are submitted and validated like native fields. Components emit `change`, `input` and `click` like native elements. Other events carry the prefix. A `change` from a form control inside a component (a checkbox in an Accordion panel) bubbles to the component too: read the component's own `change` with `event.target === host`; the slotted control's has another target and no `detail`.

## Rename the prefix

The `sb` prefix is a setting. `npx sketchbook prefix <name> --dry-run` shows the rename across tags, tokens and files before it changes anything.

## Next steps

- [Demo](/demo/): every component, live, with its props, events and tokens.
- [Foundations](/guides/foundations/): change the look from one file.

Source of truth: `package.json` exports, `generated/css/tokens.css`, `README.md`, `harness/standards/`, `docs/api-standard.md`
