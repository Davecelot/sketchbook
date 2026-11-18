# API vocabulary

Every component speaks one vocabulary for props, content, states and events. The names, their meaning and how each is drawn in a design file are in [`spec/api.json`](../spec/api.json); this page explains the rules. `sketchbook api list` shows every contract against it, `sketchbook api explain <name>` explains one name, and check A1 fails on a name that is not registered (decision SB-0078).

## Rules
- Prop keys are camelCase. Prose spells them dash-case.
- `variant` is emphasis. It is never called `role`, which names an accessibility role. A status tone is `feedback`; a step of size is `size`.
- What a component holds (its text, its icons, its children) is **content**, not a prop: `label`, `leadingIcon`, `trailingIcon`. A contract prop of type `slot` or `instanceSwap` with a content name resolves to that content entry.
- A state key is canonical when it is its title in kebab-case, or a key `states.canonicalKeys` lists for that title (one key or several: Focus takes `focus-visible` and `focus-within`).
- A boolean that changes how the component looks (`disabled`, `readOnly`, `selected`, `indeterminate`, ...) is a boolean prop. In a design file it is its own `False | True` axis, never a value of `State`.
- `State` in a design file is the interaction axis only: Rest, Hover, Focus, Press, and Loading. Disabled exists only at Rest.
- Events are `change`, `input` and `click`; anything else is a custom event named with the element prefix (`sb-toggle`).
- Design-file property names are Title case with the content's own word (`Label text`, `Left icon`, `Right icon swap`, `Read only`); they come from the registry, never from text written in a contract.

## When code spells a name differently
Contracts keep their code names (check C3 compares them with the component). Register the difference in `aliases`: the canonical name, and a value map when values differ (`default -> primary`). An alias is visible debt, counted by `sketchbook api check`; migrating a component's API removes it. Sketchbook's components have none left except `field-set.legend`, Field Set's `legend` drawn as Label text (SB-0122).

## When a name is deliberately specific to one component
Register it under `extensions` with its reason (`button.type`: native form behavior). An extension that several components share belongs in `props` instead.

## Adding a name
1. Look for an existing word (`sketchbook api list`).
2. Add it to `spec/api.json` (`props`, `content`, `states.keys` or `events`), with its meaning and, if it is drawn, its design-file name.
3. `sketchbook api check`, then `npm run check`.
