---
title: "Use the components"
description: "Put a component on a page, load its tokens, and use it with your app’s theme."
order: 50
---

Use the library’s Web Components in plain HTML or alongside your framework. Start by loading the elements and their styles. To make them fit your brand, [change the foundations](/guides/foundations/).

## Add them to a page

To try the reference components, install the npm package in your app.

```terminal
npm install @usesketchbook/cli
```

If your team has [created its own design system](/start/quickstart/), install and import your team's package to use its components and tokens.

Without a bundler, load the self-contained bundle (Lit included):

```html
<link rel="stylesheet" href="node_modules/@usesketchbook/cli/generated/css/tokens.css" />
<script src="node_modules/@usesketchbook/cli/dist/sketchbook.js"></script>

<sb-input label="Email" type="email" name="email" required></sb-input>
<sb-button type="submit">Save</sb-button>
```

With a bundler, `import '@usesketchbook/cli'` and `import '@usesketchbook/cli/tokens.css'`. `lit` and `@lit/context` are peer dependencies, so the app and the elements share one copy.

The package exports four entries for apps (the `./harness/*` export is for the CLI and adapters):

| Import | What it is |
| --- | --- |
| `@usesketchbook/cli` | The elements, as ES modules |
| `@usesketchbook/cli/tokens.css` | Every token as a CSS custom property |
| `@usesketchbook/cli/fonts.css` | The font faces the foundations use |
| `@usesketchbook/cli/bundle` | One file with every element, for pages without a bundler |

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
