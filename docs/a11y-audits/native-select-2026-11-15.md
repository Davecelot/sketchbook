# Accessibility audit: NativeSelect (2026-11-15)

Scope: `spec/components/native-select/contract.json`, `src/components/native-select/*`, `playwright/tests/native-select/*`. Standard: WCAG 2.2 AA and the native `<select>` (combobox, single selection) in the shadow root. Options and optgroups are light-DOM children mirrored into the inner select; there are no separate option components.

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.3 text contrast | Pass | `npm run check` T6 passes (fg/bg, option, label, description, error pairs) |
| P | 1.4.11 border contrast | Pass | Computed: light border rgb(115,115,115) on bg white = 4.74:1; dark border rgb(115,115,115) on rgb(23,23,23) = 3.78:1; invalid border 4.77 (light) and 6.37 (dark) |
| P | 1.4.11 chevron | Pass | Icon stroke on bg 4.74 (light), 6.94 (dark); decorative anyway |
| P | 1.4.11 / 2.4.11 focus ring, light | Pass | `:focus-visible` on Tab: 3px ring rgb(115,115,115) vs page white 4.74:1, border also ring color (`NativeSelect.scss:58`) |
| P | 1.4.11 focus ring, dark (`&globals=theme:dark`) | Pass | 3px ring and border rgb(161,161,161) vs page rgb(10,10,10) = 7.66:1 |
| P | 1.4.1 color alone | Pass | Invalid state also has error text and `aria-invalid`; required has an asterisk |
| P | forced-colors | Pass | `forced-colors: active` probe: focus outline `solid 3px rgb(0,0,0)` (CanvasText), text/bg system colors, border forced (1px) in default and invalid stories. Chevron stroke is not remapped (stays rgb(115,115,115)); it is decorative and still above 3:1 on Canvas white |
| P | prefers-reduced-motion | Pass | Probe: select `transition-duration` computes to `0s` |
| P | 1.3.1 label and description relation | Pass | Native `<label for>` plus `aria-describedby` inside the same shadow root |
| O | 2.1.1 keyboard, native behavior | Pass | Tab reaches the select (host is the focus target) and the next Tab leaves it, no trap; typing `e` selects "East" and updates host value; ArrowUp/Down, Alt+Down, Space and Enter are the platform popup. In headless Chromium on macOS the OS-drawn popup swallows arrow/Enter keys from Playwright, so those were not observable (value unchanged, no events); the behavior spec covers typing and selection through `selectOption` |
| O | 2.4.7 focus visible | Pass | See ring rows |
| O | 2.5.8 target size | Pass | Default 36px high, `size=sm` probe: 320x32 CSS px, well above 24x24; chevron ignores pointer (`pointer-events: none`) |
| O | Implicit label click | Pass | Spec: `label` click and external `label for=` focus the select |
| U | 3.3.1 / 3.3.3 errors | Pass | `error` story: `aria-invalid=true`, `describedby=error`, description "Choose a region to continue."; persistent polite live region |
| U | 3.3.2 labels or instructions | Pass | Visible label required by contract, description exposed (`with-description`: description "Sets the default for new entries.") |
| U | Required and invalid | Pass | Native `required`, aria-hidden asterisk; empty choice invalid via native validity. Chromium reports `invalid=true` on an untouched required select (native behavior, same as `<select required>`) |
| R | 4.1.2 role, name, state | Pass | CDP full AX tree: `combobox` named "Region" (hide-label: "Sort by"), `hasPopup=menu`, `expanded=false`, `disabled` on the disabled story (options disabled), selected option exposed, `West` option disabled, optgroups exposed as `group` "Europe"/"Asia" |
| R | Chevron hidden from AT | Pass | `svg[part=icon]` has `aria-hidden="true"`; absent from the AX tree |
| R | ID references across shadow roots | Pass | `for`, `aria-describedby` and ids all live in the component's own shadow root |
| R | Form association | Pass | Probe: FormData `r=b` (selected default) then `a` after change; `form.reset()` restores `b`; empty value gives `valueMissing=true` and `checkValidity()` false; `<fieldset disabled>` disables the inner select without setting the host `disabled` attribute and drops it from FormData; re-enable restores |
| R | axe | Pass | Behavior spec: axe clean on all stories |
| R | Behavior spec and `npm run check` | Pass | 18/18 passed; all checks pass (A1 warn on spec/api.json is unrelated) |

## Failures

None open.

## Re-audit (2026-11-15, working tree after root fixes)

- Invalid focus ring (`NativeSelect.scss:67-69`): solid `border-invalid`. Probe, light: ring `rgb(231,0,11)` 3px, 4.77:1 on page white; dark (`&globals=theme:dark`): ring `rgb(255,106,91)` 3px, 7.04:1 on page `rgb(10,10,10)`. At rest the invalid control has the border color only; focused it adds the 3px ring, so focus is distinguishable from invalid at rest. Spec 'keyboard focus on an invalid control shows a solid ring in the invalid color' passes.
- Synchronous reset: with a required select, `value=''` gives `checkValidity()` false; right after `form.reset()` (no await) FormData is `r=b`, `checkValidity()` true and host value `b`. Later change to `a` submits `a`; `<fieldset disabled>` disables the inner select, leaves the host `disabled` attribute unset, drops it from FormData; re-enable restores.
- Playwright (`--workers=2`): 19/19 passed, including axe.
- `check`: only D1 and D4 fail (Figma round pending, expected); all other checks pass.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-16)

Semantics, names, descriptions, errors, form association, contrast (border 3.78:1 minimum, ring 4.74:1 light and 7.66:1 dark), forced colors, reduced motion, target size, the behavior spec (18/18) and `npm run check` all pass. The one limit is that arrow-key and Alt+Down popup navigation could not be driven in headless Chromium; it is the unmodified platform behavior of a native select.
