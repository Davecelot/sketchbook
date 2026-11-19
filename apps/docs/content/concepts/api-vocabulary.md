---
title: "API vocabulary"
description: "Find the names to use for component properties, content, states, and events."
order: 55
---

Use `spec/api.json` when you name part of a component’s API. It records what each name means and how it appears in the design file. For example, `variant` expresses emphasis across components. Check A1 compares each contract with that vocabulary.

## The rules

- Prop keys are camelCase; prose spells them dash-case.
- `variant` is emphasis. It is never called `role`, which names an accessibility role. A status tone is `feedback`; a step of size is `size`.
- What a component holds (its text, icons, children) is **content**, not a prop: `label`, `leadingIcon`, `trailingIcon`.
- A boolean that changes how the component looks (`disabled`, `readOnly`, `selected`) is a boolean prop. In the design file it is its own `False | True` axis, never a value of `State`.
- `State` in the design file is the interaction axis only: Rest, Hover, Focus, Press and Loading.
- Events are `change`, `input` and `click`; any other event is custom and carries the element prefix (`sb-toggle`).

## Read it

```terminal
sketchbook api list
sketchbook api list button
sketchbook api explain readOnly
sketchbook api check
```

`list` shows each name as canonical, alias or extension and ends with the totals. `check` fails on any name that is not registered.

## When code spells a name differently

A contract keeps the name the code uses (check C3 compares them). Register the difference under `aliases`: the canonical name, and a value map when values differ (`default -> primary`). An alias is visible debt: A1 warns about it on every run until the component's API is migrated. Sketchbook's components have none left except `field-set.legend`, Field Set's `legend` drawn as Label text (SB-0122).

## When a name belongs to one component

Register it under `extensions` with its reason (`button.type`: native form behavior). An extension that several components share belongs in `props`.

## Add a name

1. Look for an existing word with `sketchbook api list`.
2. Add it to `spec/api.json` (`props`, `content`, `states.keys` or `events`) with its meaning and, if it is drawn, its design-file name.
3. Run `sketchbook api check`, then `sketchbook check`.

## Next steps

- [Contracts](/concepts/contracts/): where a component's props and events are declared.
- [Check list](/reference/checks/): A1 and the checks around it.
- [Troubleshooting](/guides/troubleshooting/#a1-warns-about-names): what the A1 warning means.

Source of truth: `spec/api.json`, `docs/api-standard.md`, `harness/checks/a1-api.mts`, `spec/decisions/DECISIONS.md` (SB-0078)
