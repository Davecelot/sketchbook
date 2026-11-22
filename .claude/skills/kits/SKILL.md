---
name: kits
description: >
  Add and adapt template kits: whole pages and blocks (sign-in, settings,
  data table, dashboard, profile, article, empty states, form states
  gallery) built only from Sketchbook components and semantic tokens.
  Trigger: "add a sign-in page", "I need a settings screen", "what
  templates are there", "adapt the dashboard kit", "remove a kit", or after
  onboarding with the library+kits starter.
metadata:
  author: sketchbook
  version: "1.0.0"
  changelog: Rendered from the shared workflow
  auto-invoke: See description
  allowed-tools: Governed by the client and user
---

# Kits

A kit is a page or block in `src/patterns/<kit>/`, composed only of `sb-*` components and semantic tokens. Each has stories, behavior and axe specs, a light contract `pattern.json` (which components and slots it uses, accessibility notes) and Figma boards. The catalog is `harness/kits/index.json`. Once added, a kit's files belong to the team: adapt them freely, the way you would copied-in code.

## When to use

Use this skill when:

- The person wants a page or block: sign-in, settings, data table, dashboard, profile, article, empty states, form states gallery.
- The person asks what templates exist, wants to adapt a kit, or wants to remove one.
- Onboarding finished with the `library+kits` starter.

Do not use this skill for:

- A single component (use `sketchbook add <name>`, or `/add <Name>` for a new one).
- A value no token expresses (use `foundations`).
- Syncing the design file by itself (use `design-figma`).

---

## Critical patterns

### 1. Kits use only installed components and semantic tokens

Use only installed `sb-*` components and semantic tokens (`var(--sb-…)` from the semantic layer); no literal colors, sizes or z-index. A value no token expresses is a foundations question: `/foundations`. If the kit needs a component that is not installed: `sketchbook add <name>`. If no component does the job, that is a new component: `/add <Name>` (planning gate), not a one-off inside the kit.

### 2. Kits are code, so the repo rules apply

`test-first`, `spec-is-source`, and the `hammock` ladder. Change the kit's behavior spec first and see it fail, then change the composition.

### 3. Accessibility floor for every kit

Landmarks and one `h1` per page template, a logical heading order, labels on every field, error messages tied to their fields, focus order that follows reading order, and it reflows at 320px.

---

## Decision tree

```text
Which kit, or what is it for?     -> Add a kit
Change an added kit?              -> Adapt a kit
Drop a kit?                       -> Remove a kit
Just added or adapted one?        -> Design file (offer /sync components)
```

### Add a kit

1. `sketchbook kits list` (or read `harness/kits/index.json`): show each kit with what it is for and the components it needs. Recommend one for what the person is building, and why.
2. `sketchbook kits add <kit> --dry-run`: show the files and any components it will install, then without `--dry-run`. Missing components are installed from the catalog (`sketchbook add <name>`), because a kit only uses what is installed.
3. `sketchbook check` (patterns use only installed components and semantic tokens), then `npm run storybook` and open the kit's story in light and dark.

Run `sketchbook help kits` to confirm options; if the kits commands are not built yet, `sketchbook init --start library+kits` installs all of them.

### Adapt a kit

1. Read the kit's `pattern.json` and its story; say what will change (copy, layout, which components, which states).
2. Behavior first: change the kit's behavior spec (`playwright/tests/patterns/<kit>/` or the path in `pattern.json`) for the new behavior and see it fail.
3. Change the composition in `src/patterns/<kit>/` (see Critical patterns 1).
4. If the kit now needs a component that is not installed, or no component does the job: see Critical patterns 1.
5. Update `pattern.json` (components, slots, accessibility notes), then `sketchbook check` and the kit's specs (`npm run test:component -- patterns/<kit>`).
6. Accessibility: see Critical patterns 3.

### Remove a kit

`sketchbook kits remove <kit> --dry-run`, then for real. Components it installed stay (other things may use them); remove them separately with `sketchbook remove <name>` if wanted.

### Design file

Kits have Figma boards; after adding or adapting, offer `/sync components` for the components it uses (the `design-figma` skill says how).

### Initial kits (from the research in `docs/research/starting-points.md`)

Sign in / sign up, settings, data table list, dashboard overview, profile, content article, empty states and onboarding, form states gallery. Each lists its components in `harness/kits/index.json`.

---

## Commands

```bash
sketchbook kits list                          # kits and the components they need
sketchbook kits add <kit> --dry-run           # preview files and component installs
sketchbook kits add <kit>                     # add the kit
sketchbook kits remove <kit> --dry-run        # preview removal (then for real)
sketchbook add <name>                         # install a missing component
sketchbook remove <name>                      # drop a component
sketchbook help kits                          # confirm options
sketchbook init --start library+kits          # installs all kits
sketchbook check                              # patterns use only installed components and semantic tokens
npm run storybook                             # open the kit's story, light and dark
npm run test:component -- patterns/<kit>      # the kit's specs
```

---

## Resources

- `harness/kits/index.json`: the kit catalog and each kit's components.
- `src/patterns/<kit>/pattern.json`: a kit's light contract.
- `docs/research/starting-points.md`: research behind the initial kits.
- `design-figma` skill: syncing a kit's Figma boards.
- `foundations` skill: values no token expresses.
