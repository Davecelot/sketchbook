# Accessibility audit: Radio Group (2026-11-15)

Scope: `spec/components/radio-group/contract.json`, `src/components/radio-group/*`, `playwright/tests/radio-group/*`. Standard: WCAG 2.2 AA and the WAI-ARIA APG radio group pattern (group-owned exclusivity, roving tab stop, selection follows focus), plus `.claude/rules/form-associated-controls.md`. Composite widget: keyboard verified live in Storybook with real key presses (skill Pattern 6).

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.11 control border contrast, light | Pass | Unchecked and checked border `rgb(115,115,115)` on `rgb(255,255,255)`: 4.74:1 |
| P | 1.4.11 control border contrast, dark (`&globals=theme:dark`) | Pass | Border `rgb(115,115,115)` on control bg `rgb(23,23,23)`: 3.78:1; on page `rgb(10,10,10)`: 4.18:1 |
| P | 1.4.11 checked dot contrast, light and dark | Pass | Light dot `rgb(135,79,27)` on white 6.64:1; dark dot `rgb(202,148,105)` on `rgb(23,23,23)` 6.79:1 |
| P | 1.4.3 label contrast | Pass | 19.80:1 light, 18.97:1 dark; T6 passes for all contract pairs |
| P | 1.4.1 state not by color alone | Pass | The dot is a shape inside the ring and AX exposes `checked` (but see forced colors) |
| P | 2.4.7 / 1.4.11 focus ring | Pass | `:focus-visible` matches on keyboard focus; 3px box-shadow ring: light `rgb(115,115,115)` 4.74:1, dark `rgb(161,161,161)` on `rgb(10,10,10)` about 7.7:1 |
| P | forced-colors, ring | Pass | `forced-colors: active`: `outline: solid 3px CanvasText` on the focused control |
| P | forced-colors, dot | Pass (fixed) | Re-probe on `preselected`: checked dot computes `rgb(0,0,0)` (CanvasText) on Canvas, unchecked dots stay transparent, border `rgb(0,0,0)`; `RadioGroup.scss:68-75` has the rule; new spec case covers it |
| P | prefers-reduced-motion | Pass | `@include a11y.respect-reduced-motion` on the control transition |
| O | 2.1.1 Tab order, one tab stop | Pass | Live: Tab lands on the first item when none is selected, on the selected item otherwise (`preselected`: `comfortable`); next Tab leaves the group; Shift+Tab returns to the same item; item hosts `tabindex` 0/-1/-1 |
| O | 2.1.1 arrows, wrap, Home, End, Space | Pass | Live: ArrowDown/Right next and select, ArrowUp/Left previous and select, wrap both ways (compact to default, default to compact), Home first, End last, Space keeps the focused item selected; selection follows focus |
| O | RTL arrows | Pass | `Rtl` story: ArrowLeft goes to the next item (default to comfortable), ArrowRight goes back and then to the previous (wraps to compact) |
| O | Disabled items skipped | Pass | `DisabledItem`: ArrowDown a to c to a, End goes to c, `b` never focused or selected; disabled group and `<fieldset disabled>`: no tab stop (Tab skips to body) |
| O | 2.1.2 no keyboard trap | Pass | Tab and Shift+Tab leave the group in every story |
| O | 2.5.8 target size | Pass | Control 16x16 in a row 20px high (contract text says at least 24px; the host box is 25px but the label row is 20px). Passes through the spacing exception: neighbouring targets are 24px or more apart (vertical host pitch 37px; horizontal gap 24px), so the 24px circle around each control touches no other target. See low note |
| O | Implicit submission | Pass | Enter submits the form per contract; spec covers it and the disabled case |
| U | 3.3.2 labels, 3.3.1 error | Pass | Each radio is named by its `label`; the group by forwarded `aria-label`; `required` gives the native message "Please select one of these options." |
| U | 3.2.x predictable | Pass | One composed `change` after a person selects; none for `value` set from code or reset (spec) |
| R | 4.1.2 role, name, state, set | Pass | CDP `Accessibility.getFullAXTree` (`preselected`): `radiogroup` "Spacing"; `radio` "Default" checked=false, "Comfortable" checked=true, "Compact" checked=false |
| R | Group required | Pass | `Required` story: AX `radiogroup` `required=true`; `aria-required="true"` on the group |
| R | Required validity | Pass, with note | Group `validity.valueMissing` true, `:invalid` matches, message from a native probe radio; `reportValidity()` focuses the first enabled radio (spec). The nested inputs themselves report `valueMissing` false: the group is the form field by contract (SB-0009), so the rule's "every member" holds at group level |
| R | Form: FormData, reset, fieldset | Pass | `InForm`: FormData `plan=pro`, after selecting team `plan=team`, right after `form.reset()` (synchronous) `plan=pro`; `Required`: after selecting then `form.reset()`, FormData empty and `valueMissing` true with the native message at once, item inputs unchecked after the next update; `Required` none selected: FormData empty; `InFieldset`: all controls disabled, group `:disabled`, nothing submitted, re-enable covered by spec |
| R | ID references across shadow roots | Not applicable | Only `aria-label` is forwarded; no ID references |
| R | axe | Pass | Behavior spec axe clean on 6 stories |
| R | Behavior spec and `npm run check` | Pass | 29/29 passed with `--workers=2` (port 6117); `npm run check`: T5, T6, S1, R1 pass; D1 and D4 fail (Figma round pending, expected, not a component finding) |
| R | Screen-reader evidence | Pass | AX tree above plus the `__screen-reader__` snapshots (check S1) |

## Failures

### Fixed: checked dot disappeared in forced-colors mode - was MEDIUM
Location: `src/components/radio-group/RadioGroup.scss:68`
Before: the checked `::before` computed `rgb(255,255,255)` (Canvas) on a Canvas control, so the selected radio looked like the unselected ones.
After: `@media (forced-colors: active) { background: CanvasText; }` inside `&:checked::before`; probe shows the checked dot `rgb(0,0,0)`, unchecked transparent, ring `solid 3px rgb(0,0,0)`; spec 'in forced colors the checked dot stays visible against the control' was seen failing first and passes; 29/29; checks pass.

### Fixed: contract overstated the target size - was LOW
Location: `spec/components/radio-group/contract.json` (`accessibility.targetSize`) and `contract.md:55`
Before: claimed a label row at least 24px high; it measures 20px.
After: wording says the 16px control and its 20px label row are one target and the 12px (vertical) or 24px (horizontal) gap satisfies the 2.5.8 spacing exception; matches the probe (rows 72x20, 106x20, 84x20; host pitch 37px vertical, 24px horizontal gap).

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-16)

The forced-colors finding is fixed and verified; semantics, live keyboard behavior (one tab stop, arrows with wrap, Home/End, Space, RTL, disabled skipping), form association, contrast in both themes, focus ring, axe, the behavior spec (29/29) and `npm run check` all pass. The LOW contract wording note is fixed. D1/D4 fail only for the pending Figma round.
