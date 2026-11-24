# Semantic naming

Where it lives: `spec/tokens/semantic/light|dark|base.tokens.json` (team-owned), `spec/tokens/interface.json` (computed: the semantic tokens components and brand links depend on), `spec/tokens/brand-links.json`. Every Storybook `Foundations/*` page shows the semantic tokens of its area.

## The three layers
1. **Foundation** (`color.neutral.500`, `space.4`, `radius.lg`): raw values, generated from brand.config. Named by scale.
2. **Semantic** (`color.primary`, `space.control.gap.default`, `radius.control`): meaning. Named by role. One value per mode.
3. **Component** (`--sb-button-default-bg`): a component's own knobs, declared in its contract, aliasing semantic tokens only.
Each layer aliases only the one below it (check T2). That is what lets a team swap every foundation without touching components.

## Decisions to make (guided order)
1. **Naming vocabulary.** Recommend keeping shipped names (`color.primary-foreground`, `size.control.sm`) when the team has no preference. If they have words that fit better, compare a few on one real component. The shipped pattern is a default, not a requirement. Use the [token naming glossary](token-naming-glossary.md) for alternatives and distinctions.
2. **Role set.** Recommended: the shipped roles plus status roles (success, warning, info, destructive) with foregrounds. Add a role when a real component needs a value that no role expresses, not "for completeness".
3. **Pairs.** For roles used together as foreground and background, make the relationship obvious in the name, and declare the contrast pair. `-foreground` is a convention; `on-primary` can express the same pairing.
4. **Component tokens.** Recommended: only where a component truly diverges from the semantic role; otherwise alias directly.

## Options (patterns seen in the research)
| Pattern | Shape | Source |
| --- | --- | --- |
| Shipped (default) | `color.primary`, `color.primary-foreground`, `color.muted`, `space.control.padding-x.sm` | — |
| Property-first | foundation, property, role, emphasis, state (`color.text.success`) | [atlassian.design tokens](https://atlassian.design/foundations/design-tokens/) |
| Block, property, variant | namespace, pattern, variant, property, scale (`button-primary-bgColor-hover`) | [primer.style token names](https://primer.style/product/primitives/token-names/) |
| Broad to specific | `accent-background-color-hover` | [spectrum.adobe.com design tokens](https://spectrum.adobe.com/page/design-tokens/) |
| Role and on-role | `primary`, `on-primary`, `surface-container-high` | [Material color (Android docs)](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Color.md) |

## Mapping imported names (used by `import` mode and the `token-mapper` brief in `agents/`)
- Map by **meaning**, not by value: `brand-500` used for buttons maps to `color.primary`; a grey used for body text maps to `color.foreground`.
- Use names as clues: `on-X` may fit `color.X-foreground` when the content is intended for that surface. `surface` could be a canvas, a card or a popover; `outline` could be a control border or a focus indicator.
- When usage is unclear, show candidates and ask a question that separates them: “Does `active` mean while the button is held down, after it's selected, or the current destination?” Leave unresolved entries unapplied.
- Raw scale tokens (`blue-500`, `spacing-4`) are foundation candidates: they inform brand.config (a preset or custom scale), not semantic tokens.
- Anything with no clear home is listed as unmapped with a suggestion; never invent a semantic token silently.
- Mapping chooses where an imported value goes. It doesn't change the semantic interface or make the imported name a new alias.

## Rename an existing semantic token

1. Run `sketchbook tokens impact <old>` and `sketchbook tokens rename <old> <new> --dry-run`.
2. Show the preview, including internal dependents and any known consumers outside the project that need a separate update. Get approval for the rename independently of any import.
3. Apply through `sketchbook tokens rename`, not by hand. Run `sketchbook check` and surface any follow-up needed in synced design files or external consumers.

For several names at once, use `sketchbook tokens rename --map <file> --dry-run`. The file contains a `renames` array of `{"from":"color.primary-foreground","to":"color.on-primary"}` entries. `sketchbook tokens rename-plan` lists optional presets that can write an editable list. A preset does not rename tokens or set a naming rule. Review the list and all affected files before applying the batch. Use the single-rename command for groups; a list does not support chains or swaps.

## Compatibility and accessibility
- Every foreground/background semantic pair is declared in `spec/tokens/contrast.json` or a contract, so T6 can check it.
- Prefer semantic names that describe a purpose rather than a value (`color.primary` over `color.blue-button`): a rebrand can change the value without changing the role.

## Commands
```sh
sketchbook tokens add color.highlight --light "{color.neutral.200}" --dark "{color.neutral.800}" --pair color.foreground/color.highlight --dry-run
sketchbook tokens rename color.muted color.subtle --dry-run
sketchbook tokens impact color.accent
sketchbook explain color.primary
```
Run `sketchbook help tokens` to confirm options. `sketchbook tokens remove <semantic.path>` is refused while anything depends on the token. `rename` updates semantic files, contracts, stories, specs and `.storybook`; a rename by hand breaks them silently.

## Guarded by
T2 (one-step layers), T3 (every semantic token in every mode), T4 (component CSS uses its own tokens; semantic variables used in stories, specs and `.storybook` exist), T7 (interface and link targets exist), C2 (contract token references resolve), T6 (pairs).

## Realizations that update
`generated/css/tokens.css` variable names, component styles (after `npm run generate`), stories and specs (through `tokens rename`), Storybook semantic tables, Figma semantic variables (`/sync tokens`).

## Roast questions
- Can a developer pick a token without knowing its value?
- Does any name describe a color instead of a role?
- Do component tokens exist only where a component truly diverges?
- Can you rename a foundation step without touching a component?
- Are there two semantic names for the same meaning?
