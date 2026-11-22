# Contrast

Where it lives: `brand.config.json` → `contrast` (`preset` or `standard`: wcag-aa or wcag-aaa; `apca`: true to report; `targets`: per-kind overrides). Pairs to check: `spec/tokens/contrast.json` (system pairs) and each contract's `accessibility.contrast` (component pairs). Storybook: `Foundations/Color` shows every pair with its ratio per mode.

## Decisions to make (guided order)
1. **Standard.** Recommended: WCAG 2.2 AA, enforced. It is the current legal and procurement baseline in most places. AAA is a choice for products whose users need it (older users, low vision, public service).
2. **APCA reporting.** Recommended: on, as information only. It is a candidate method for a future WCAG, not part of WCAG 2.2; use it to judge small or thin text that passes WCAG but reads weakly.
3. **Which pairs.** Recommended: every foreground/background combination that actually ships, in every mode — not only the brand color on white. New semantic colors arrive with their pair (`sketchbook tokens add … --pair fg/bg`).
4. **Disabled and placeholder.** WCAG exempts inactive controls; decide whether you hold them to a lower target (APCA Lc 30) or leave them unchecked, and record it.

## Options (`sketchbook tokens presets contrast` is authoritative)
| Preset id | Targets | Pick it when | Source |
| --- | --- | --- | --- |
| `contrast: wcag-aa` (default) | Text 4.5:1, large text 3:1, UI parts and graphics 3:1 | Almost always | [WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) |
| `contrast: wcag-aaa` | Text 7:1, large text 4.5:1, UI 3:1 | Audiences with low vision; public service | [WCAG 1.4.6](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html) |
| `contrast: apca` (not implemented as a standard) | Lc 90 preferred body, 75 minimum body, 60 other text, 45 large/heavy text, 30 placeholder/disabled, 15 minimum non-text | Judging small text quality | [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html) |

APCA is catalogued for information only: it cannot be chosen as the enforced standard. To see Lc values next to each WCAG ratio, turn on reporting instead: `sketchbook tokens set contrast.apca true`. The old ids `WCAG21-AA` and `WCAG21-AAA` are aliases of the first two.

## Accessibility limits (the rules themselves)
- Ratios are not rounded: 4.499:1 fails 4.5:1.
- Large text is at least 24px regular or about 18.5px bold.
- Focus indicators reach 3:1 against what is around them, on every surface they can appear on.
- Borders that identify a control (input borders, checkbox outlines) reach 3:1; decorative dividers need not.
- Color is never the only signal ([WCAG 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)).
- Disabling with opacity can drop text below any target; that is allowed for inactive controls but should be a choice.

## Commands
```sh
sketchbook tokens presets contrast
sketchbook tokens preset contrast wcag-aaa --dry-run
sketchbook tokens set contrast.apca true --dry-run
sketchbook check
sketchbook explain color.muted-foreground
```
Run `sketchbook help tokens` to confirm options. For fixing a failure, see [color.md](color.md) "Fixing a contrast failure".

## Guarded by
T6 (every declared pair in every mode meets the target; the failure names the nearest passing step), F1 (the declared standard and the pair targets agree), C2 (contract pairs point at real tokens), T3 (pairs exist in every mode).

## Realizations that update
The check results; Storybook `Foundations/Color` ratios. Changing the standard also moves the linked colors (SB-0058): `color.muted-foreground` takes the neutral step nearest its preferred one that meets the text target on background, card, popover and muted, and the role solids (primary, destructive, success, warning, info) pick the nearest step that keeps their foreground readable. `contrast: wcag-aaa` therefore applies with T6 clean on the shipped semantic layer; unlinked pairs you add, and stricter fine `targets`, can still fail until you re-point them.

## Roast questions
- Which ratio do disabled and placeholder text follow, and was that a choice?
- Does the focus ring reach 3:1 on every surface, including the brand color?
- Are status colors checked on both light and dark surfaces?
- Is any pair that ships missing from `contrast.json` or a contract?
- Does small text pass WCAG but fall under Lc 60?
