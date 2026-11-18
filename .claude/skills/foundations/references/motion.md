# Motion

Where it lives: `brand.config.json` → `motion` (a preset or custom durations and easings). Generated: `spec/tokens/foundation/motion.tokens.json` (`duration.*`, `easing.*`). Semantic: `motion.duration.fast|normal|slow|loop`, `motion.easing.standard|enter|exit|linear` in `spec/tokens/semantic/base.tokens.json`. Storybook: `Foundations/Motion` (it honors reduced motion).

## Decisions to make (guided order)
1. **Character.** Recommended: productive (quick, subtle; it helps people finish tasks). Expressive motion is for rare, significant moments.
2. **Durations.** Recommended: three for UI (about 150, 200, 300 ms) plus one for loops (spinners). Anything over 400 ms in a task flow feels slow.
3. **Easings.** Recommended: four — standard (moving within the screen), enter (decelerate: things arriving), exit (accelerate: things leaving), linear (progress and loops only).
4. **Reduced motion.** Recommended: under `prefers-reduced-motion: reduce`, replace movement (slide, scale, parallax) with a fade or no animation; keep state and focus feedback. This is not optional.

## Options (`sketchbook tokens presets motion` is authoritative)
Every preset assumes components drop movement under `prefers-reduced-motion` and keep state feedback.

| Preset id | What it is | Pick it when | Source |
| --- | --- | --- | --- |
| `motion: tailwind-like` (default) | 100–1000 ms, short quiet transitions, standard/in/out/linear curves | General product UI | [tailwindcss.com/docs/transition-timing-function](https://tailwindcss.com/docs/transition-timing-function) |
| `motion: material-like` | A fine 50 ms ladder up to 1000 ms; entering slows down sharply, leaving speeds up | You want role-named easings | [Material motion (Android docs)](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Motion.md) |
| `motion: carbon-productive` | 70–1000 ms, fast and efficient curves for tasks; loop and linear are our additions | Data and productivity tools | [carbondesignsystem.com motion](https://carbondesignsystem.com/elements/motion/overview/) |
| `motion: carbon-expressive` | Same durations, livelier curves; loop and linear are our additions | Onboarding, celebratory moments | [carbondesignsystem.com motion](https://carbondesignsystem.com/elements/motion/overview/) |
| `motion: minimal` | 100 and 150 ms, one curve plus linear: feedback without choreography | Calm, utilitarian brands; most users on reduced motion | [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) |

Every preset applies with `sketchbook tokens preset motion <id>`. Presets name their steps differently (`duration.110`, `easing.entrance`), so each one declares **roles** (`duration.fast|normal|slow|loop`, `easing.standard|enter|exit|linear`) mapped to its own steps, and `spec/tokens/brand-links.json` re-points the semantic `motion.*` tokens to them on every generate (SB-0058). Components keep using `motion.duration.normal`; only what it points at changes:
```sh
sketchbook tokens preset motion carbon-productive --dry-run
# ~ --sb-motion-duration-fast: var(--sb-duration-150) -> var(--sb-duration-110)
```
To move one role without leaving the preset, override it: `sketchbook tokens set motion.roles '{"duration.normal":"300"}' --dry-run` (the step must exist in the preset's durations, or the change is refused). In `brand.config.json` that reads:
```json
"motion": { "preset": "material-like", "roles": { "duration.normal": "250" } }
```

## Not in the catalog yet
- **No motion at all** (every duration 0). Not a preset: respect `prefers-reduced-motion` in components instead, and use `motion: minimal` as the calm base.

## Accessibility limits
- Respect `prefers-reduced-motion` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)); F1 warns when the motion foundation has no reduced-motion rule.
- No flashing more than three times a second ([WCAG 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)).
- Anything that moves for more than five seconds needs a way to pause it ([WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)).
- Motion triggered by interaction can be turned off ([WCAG 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), AAA, but cheap with the reduce rule).

## Commands
```sh
sketchbook tokens presets motion
sketchbook tokens preset motion tailwind-like --dry-run
sketchbook tokens preset motion material-like
sketchbook tokens set motion.durations.150 120 --dry-run
sketchbook tokens impact motion.duration.normal
```
Run `sketchbook help tokens` to confirm options and key names.

## Guarded by
F1 (reduced-motion rule present; long durations in task flows warned), T1 (durations and cubic-beziers are valid DTCG), T2, T7 (every motion link finds its role step), G1. A preset (or custom motion) missing a role a link uses is refused before anything is written.

## Realizations that update
`generated/css/tokens.css`, transitions in every component through `motion.*`, Storybook `Foundations/Motion`. Figma has no duration or easing variables, so motion stays in the repo (not synced).

## Roast questions
- Do all durations collapse under reduced motion, and does feedback still exist?
- Is anything longer than 400 ms in a task flow?
- Is linear easing used for anything but progress and loops?
- Do enter and exit use different curves, or does everything ease the same way?
- Do the roles of the chosen preset say what the team means by fast, normal and slow?
