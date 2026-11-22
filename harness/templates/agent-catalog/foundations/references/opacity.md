# Opacity

Where it lives: `brand.config.json` → `opacity` (a preset, or fine overrides of single steps, `{ "50": 0.6 }`). Generated: `spec/tokens/foundation/opacity.tokens.json` (`opacity.10` … `opacity.90`, values 0–1). Semantic: `opacity.disabled` and `opacity.pulse` in `spec/tokens/semantic/base.tokens.json`; components reach them through tokens such as `button.disabled-opacity`. Storybook: `Foundations/Opacity`.

## Decisions to make (guided order)
1. **Disabled.** Recommended: 50% on the whole control, plus `cursor: not-allowed` and the native `disabled` state. Lower than 40% makes the label unreadable; higher than 60% makes it look enabled.
2. **Overlays and scrims.** Recommended: a dark scrim at 50–80% behind modals, from a color token with alpha or `opacity.*` on the scrim element; never fade the content people must read.
3. **Loading pulse.** Recommended: animate between full and `opacity.pulse` (50%), and stop under reduced motion (see [motion.md](motion.md)).
4. **How many steps.** Recommended: the seven default steps. Add one only when a role needs it, and give that role a semantic token instead of using the raw step in a component.

## Options (`sketchbook tokens presets opacity` is authoritative)
| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `opacity: standard` (default) | Seven steps: 10, 15, 20, 30, 50, 80, 90 % | Always; it is the only preset | [tailwindcss.com/docs/opacity](https://tailwindcss.com/docs/opacity) |

Changing one step is a fine override on top of the preset: `sketchbook tokens set opacity.50 0.6` changes every semantic token that aliases `opacity.50`; `sketchbook tokens set opacity.40 0.4` adds a step.

## Not in the catalog yet
- **A finer ladder** (every 5 %, as Tailwind's full utility set has). Add the steps you need with `sketchbook tokens set opacity.<n> <value>`; a scale that drops `opacity.50` is refused while `opacity.disabled` and `opacity.pulse` alias it.
- **Separate disabled values per control kind** (text vs filled). Add a semantic token (`sketchbook tokens add opacity.disabled-text --value {opacity.30} --type number`) and point the component tokens at it.

## Accessibility limits
- WCAG exempts inactive controls from contrast ([WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)), so a disabled control at 50 % may fail 4.5:1; that is allowed but should be a choice (see [contrast.md](contrast.md)). Content that is merely de-emphasized is not exempt: use `color.muted-foreground`, which follows the contrast target, not opacity.
- Opacity alone is never the signal that something is disabled ([WCAG 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)): keep the native `disabled` or `aria-disabled` state.
- In forced-colors mode opacity is ignored for system colors: disabled controls must use `GrayText` there.
- A scrim must leave the focused dialog fully opaque and readable.

## Commands
```sh
sketchbook tokens presets opacity
sketchbook tokens preset opacity standard --dry-run
sketchbook tokens set opacity.50 0.6 --dry-run
sketchbook tokens impact opacity.disabled
```
Run `sketchbook help tokens` to confirm options and key names.

## Guarded by
T1 (values are valid numbers), T2 (component → semantic → foundation, one step), T7 (the interface keeps `opacity.disabled`), G1 (the foundation matches brand.config), T6 for the colors under the faded control (not the faded result).

## Realizations that update
`generated/css/tokens.css` (`--sb-opacity-*`), the disabled state of every form control and button, skeleton and pulse animations, Storybook `Foundations/Opacity`, Figma opacity variables (`/sync tokens`).

## Roast questions
- Is disabled shown by opacity alone, or also by the native state and cursor?
- Can a person still read a disabled label, and was the lower contrast a recorded choice?
- Does any component use a raw `opacity: 0.5` instead of a token (T5 does not catch numbers)?
- Is muted text faded with opacity instead of a muted color that meets contrast?
- Does the pulse stop under reduced motion?
