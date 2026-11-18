# Z-index (layers)

Where it lives: `brand.config.json` → `z` (a preset, or `values` and `roles`). Generated: `spec/tokens/foundation/z.tokens.json` (`z.*`). Semantic: `layer.base|dropdown|sticky|overlay|modal|toast` in `spec/tokens/semantic/base.tokens.json`. Storybook: `Foundations/Z-index`.

## Decisions to make (guided order)
1. **Named layers.** Recommended: name layers by role (base, sticky, dropdown, overlay, modal, toast, tooltip) and never write a raw number in a component.
2. **Gaps.** Recommended: leave room between layers (10 or 100) so a new layer fits without renumbering.
3. **Who wins the top?** Recommended: toasts above modals (a status message must be seen), tooltips above everything they describe. Decide once and record it.
4. **Native top layer.** Elements opened with the `popover` attribute or `<dialog>.showModal()` sit in the browser's top layer, above any z-index. Prefer them for modals and menus; keep tokens for everything else.

## Options (`sketchbook tokens presets z-index` is authoritative; the family is called zIndex)
| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `zIndex: standard` (default) | Six layers ten apart: base 0, dropdown 10, sticky 20, overlay 30, modal 40, toast 50 | Small systems | [tailwindcss.com/docs/z-index](https://tailwindcss.com/docs/z-index) (examples) |
| `zIndex: named-layers` | Six layers a hundred apart: base 0, sticky 100, dropdown 200, overlay 300, modal 400, toast 500 (value 600 is free for a tooltip layer) | Room to add layers | our own convention, not taken from any system |

Both presets apply with `sketchbook tokens preset z-index <id>`. Each declares **roles** (`base`, `dropdown`, `sticky`, `overlay`, `modal`, `toast`) mapped to its own values, and `spec/tokens/brand-links.json` re-points the semantic `layer.*` tokens to them on every generate (SB-0058), so `named-layers` moves `layer.modal` from `z.40` to `z.400` and puts sticky below dropdown. To change one layer, override its role (the value must exist, or the change is refused): `sketchbook tokens set z '{"preset":"named-layers","roles":{"toast":"600"}}' --dry-run` gives toasts their own layer above modals.

## Accessibility limits
- Something that opens on top must take focus when it is modal and return it when it closes; layering alone is not enough.
- Sticky headers and footers must not hide the focused element ([WCAG 2.4.11 Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)): check `layer.sticky` against scroll padding.

## Commands
```sh
sketchbook tokens presets z-index
sketchbook tokens preset z-index standard --dry-run
sketchbook tokens preset z-index named-layers --dry-run
sketchbook tokens add layer.tooltip --value 600 --type number --dry-run
sketchbook tokens impact layer.modal
```
A new layer (say `layer.tooltip`) is a new semantic token: `sketchbook tokens add` with one mode-less `--value`, as above. Layers are mode-independent.

## Guarded by
T5 (no literal z-index in component CSS), T2, T7 (every layer link finds its role value), G1. A preset (or custom `z`) missing a role a link uses is refused before anything is written.

## Realizations that update
`generated/css/tokens.css`, overlays and sticky elements, Storybook `Foundations/Z-index`. Repo only: Figma has no z-index variable.

## Roast questions
- Are layers named by role, not number?
- Who owns the top layer, toasts or modals?
- Is anything using `z-index: 9999` to win a fight?
- Could the native top layer replace a custom layer?
