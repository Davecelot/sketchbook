# Iconography

Where it lives: `brand.config.json` → `icons` (a preset, or sizes sm, default, lg, xl in px). Generated: icon size steps in `spec/tokens/foundation/size.tokens.json`. Semantic: `size.icon.sm|default|lg|xl` in `spec/tokens/semantic/base.tokens.json`. Storybook: `Foundations/Icons`.

## Decisions to make (guided order)
1. **Icon set.** Recommended: one open-licensed outline set used everywhere; never mix sets in one screen. Record its license in `THIRD_PARTY_NOTICES.md`.
2. **Sizes.** Recommended: 16px default next to 14–16px text, 12px inside small controls, 20px and 24px for emphasis. Each size pairs with a text size.
3. **Stroke.** Recommended: the same visual stroke at every size (many sets need 1.5px at 24px and 2px at 16px to look equal).
4. **Hit area.** Recommended: the clickable area is the control, never the glyph: an icon button is at least the control height.

## Options (`sketchbook tokens presets icons` is authoritative; the family is called iconSizes)
| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `iconSizes: standard` (default) | 12 / 16 / 20 / 24 px (sm / default / lg / xl), paired with small, base and large text | Most product UI | our default set |
| `iconSizes: carbon-like` | 16 / 20 / 24 / 32 px: starts at 16, adds a large display size; pair with 14 to 16px text | You also need a large display size | [carbondesignsystem.com icons](https://carbondesignsystem.com/elements/icons/usage/) |

## Not in the catalog yet
- **Your own sizes** (say 14 / 18 / 22 / 28): set each step, for example `sketchbook tokens set icons.sm 14`, or write `{ "sm": 14, "default": 18, "lg": 22, "xl": 28 }` under `icons` in `brand.config.json`. Stroke weight and the icon set's name are not foundations here; they belong to the icon library you pick.

## Accessibility limits
- Icons that carry meaning reach 3:1 against their background ([WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)); some systems hold icons to 4.5:1 like text.
- An icon-only control needs an accessible name (the component contract says where it comes from); decorative icons are hidden from assistive technology.
- Targets at least 24×24px ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)), 44px for touch-first products.
- Never rely on the icon alone to say success, warning or danger.

## Commands
```sh
sketchbook tokens presets icons
sketchbook tokens preset icons carbon-like --dry-run
sketchbook tokens impact size.icon.default
```
Run `sketchbook help tokens` to confirm options.

## Guarded by
T2, T7 (icon sizes are interface tokens), T5 (no literal icon sizes in component CSS), F1 (icon sizes on the spacing grid), G1.

## Realizations that update
`generated/css/tokens.css`, every component that shows an icon (button, alert, input group, spinner …), Storybook `Foundations/Icons`, Figma sizing variables (`/sync tokens`).

## Roast questions
- Is the stroke weight consistent across sizes?
- Is the hit area bigger than the glyph?
- Is there more than one icon set on screen?
- Do icon-only buttons all have names?
