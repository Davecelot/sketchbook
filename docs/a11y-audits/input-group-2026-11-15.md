# Accessibility audit: Input Group (2026-11-15)

Scope: `spec/components/input-group/contract.json`, `src/components/input-group/*` (group, addon, text, button), `playwright/tests/input-group/*`. Standard: WCAG 2.2 AA; no APG composite pattern (a `group` shell around a native or `sb-input`/`sb-textarea` control, addon buttons in the Tab order).

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.11 shell border (rest), light | Pass | Border vs shell fill and vs page 4.74:1 |
| P | 1.4.11 shell border (rest), dark | Pass | 3.78:1 vs shell fill, 4.18:1 vs page |
| P | 1.4.11 / 2.4.7 shell focus ring (control focused), light and dark | Pass | `data-focused` set on `focusin`; ring and border `rgb(115,115,115)` 4.74:1 (light), `rgb(161,161,161)` 7.66:1 (dark), 3px; both on native input, `sb-input` and `sb-textarea` |
| P | 1.4.11 addon button focus ring | Pass | Inner `button` box-shadow 3px `rgb(115,115,115)` light, `rgb(161,161,161)` dark (same ring tokens); shell ring is off while a button has focus (`data-focused` false), as the contract says |
| P | 1.4.3 text contrast (addon fg, control fg) | Pass | Addon `muted-foreground` vs shell fill 4.74:1 light, 6.94:1 dark; `npm run check` T6 passes |
| P | 1.4.1 invalid by color alone | Pass (fixed) | Invalid is also exposed as `aria-invalid` on sb-input and sb-textarea (see Fixed) |
| P | 1.4.11 invalid + focused indicator | Pass (fixed) | Solid destructive 3px ring: 4.77:1 light, 7.04:1 dark; CanvasText outline in forced colors |
| P | forced-colors | Pass | Probe with `forced-colors: active`: shell border `CanvasText` 1px solid at rest; focused shell `outline: 3px solid CanvasText` (box-shadow none); addon button focus outline 3px solid CanvasText; disabled button uses GrayText-style color |
| P | prefers-reduced-motion | Pass | `transition-property: none` under `reduce` |
| O | 2.1.1 keyboard / Tab order | Pass | Tab visits control then each addon button in DOM order (`with-button`, `textarea-footer`, `sb-textarea-footer`, `in-form`); text-only addons are skipped; disabled addon button is skipped (`button-disabled`); no trap, focus leaves to body after the last stop |
| O | 2.4.7 focus visible | Pass | See ring rows |
| O | 2.5.8 target size | Pass | Icon-only addon button 24x24 (`with-button`); text buttons 24px high or more; control is 36px |
| O | Clicking addon text or icon focuses the control | Pass | `sb-input-group-text` click focuses `sb-textarea>textarea`, `textarea`, `sb-input>input`; icon addon click focuses `sb-input>input`; clicks on addon buttons do not steal focus |
| O | Implicit submission / group button submit | Pass | `in-form` story: submit button submits with the control value (behavior spec) |
| U | 3.3.2 labels, wrapped control keeps its own name | Pass | AX: `textbox "Search"`, `"Amount"`, `"Message"` (sb-input/sb-textarea via `hide-label`), `"Share link"`, `"Website"`, `"Code"`, `"Comment"` (native `aria-label`); addon text (`$`, `USD`, `https://`, `0 / 280`) is exposed as plain text beside the control and is never the only name |
| U | Description on the wrapped control | Pass | Native input in light DOM keeps `aria-describedby` to an external element (probe: group + textbox + paragraph resolve in the same tree) |
| U | 3.3.1 invalid state exposed | Pass (fixed) | Native and slotted `sb-input`/`sb-textarea`: CDP `invalid=true` when the group is invalid |
| U | Disabled state | Pass (fixed) | Disabled addon button: `button "Apply" [disabled]`, skipped by Tab; a disabled native control is dimmed (opacity 0.5, not-allowed cursor) in light and dark |
| R | 4.1.2 role, name, state | Pass | `group "Website"` / `group "Comment"` only with host `aria-label`; unnamed shell exposes no group; addon button `button "Copy link"` (aria-label forwarded), `button "Send"`, `button "Go"` (text forwarded); name follows in-place text edits (behavior spec) |
| R | ID references across shadow roots | Pass | Only `aria-label` is forwarded (SB-0009); no ID reference crosses a shadow boundary |
| R | axe | Pass | Behavior spec: axe clean on 9 stories |
| R | Behavior spec | Pass | 23/23 serial and parallel (3 parallel runs, 1 serial full run); see flake note |
| R | `sketchbook check` | Pass | All checks pass except G1 on `harness/catalog/button/manifest.json`, caused by the concurrent `src/components/button` edit, not by input-group |
| R | Screen-reader evidence | Pass | AX trees above plus the `__screen-reader__` snapshots (check S1) |

## Flake: `input-group.behavior.spec.ts` "a slotted sb-textarea gets the shell ring" (line 137 assertion)

Verdict on the test: flake, not a component defect.

- Alone, `--workers=1`: 1 failure in 10 runs, then 1 in 30 runs; the full spec passes 23/23 serially and in parallel.
- Failure shape: `data-focused` is present at line 136, then `box-shadow` stays `rgba(0,0,0,0.05) 0 1px 2px 0` for the 5s poll at line 137, so the control lost focus between the two lines.
- Probe (60 story loads, focus the textarea, wait 1.5s, log `focusin`/`focusout`): 1 miss. The captured events were a lone `focusout:sb-textarea` with `activeElement` back on `body` and no navigation, and the console showed `[vite] hot updated: /.storybook/preview.js`. The shared Storybook dev server hot-reloads and re-renders the story (another session is editing `src/components/button`), which drops focus. With focus lost the shell correctly clears `data-focused`.
- A static build would not do this. The shell logic itself is sound: 59 of 60 probe runs and every other run applied the 3px ring within the poll.

## Failures

### Fixed: `invalid` on the shell was not exposed for a slotted `sb-input` / `sb-textarea` - was MEDIUM
Location: `src/components/input-group/InputGroup.ts:60-66`
Before: inner `input` had no `aria-invalid`; CDP `Accessibility.getFullAXTree` reported `invalid=false` for `textbox "Search"`; the only cue was the red border.
After: the group sets `aria-invalid="true"` on any slotted control and `sb-input`/`sb-textarea` mark their inner control invalid from a host `aria-invalid="true"`. Probe on the `invalid` story: host `aria-invalid=true`, inner `aria-invalid=true`, CDP `textbox "Search"` `invalid=true`. Probe on `sb-textarea-footer` with `invalid` set on the group: CDP `textbox "Message"` `invalid=true`. Inner border stays `rgba(0,0,0,0)` and inner box-shadow 0px (focused, both controls), so no doubled border; the shell shows the destructive border and ring. Specs: input-group, input and textarea suites pass 53/53 serially.

### Fixed: focused + invalid ring was a 20% tint - was LOW
Location: `src/components/input-group/InputGroup.scss:35-37`
Before: ring `color-mix(... 20%, transparent)`; border unchanged between rest and focus.
After: solid `border-invalid` ring, 3px. Probe (focus, settled): light ring `rgb(231,0,11)` 4.77:1 vs page, dark `rgb(255,106,91)` 7.04:1, on the `invalid` story and on a native input made invalid; forced colors: `outline: 3px solid CanvasText`, box-shadow none.

### Fixed: disabled native control looked enabled - was LOW
Location: `src/components/input-group/InputGroup.scss:105-109`
Before: disabled input had opacity 1 and the default cursor.
After: `input.disabled = true` computes opacity 0.5 and `cursor: not-allowed` in light and dark (token `input-group.disabled-opacity`). Inactive components are exempt from 1.4.3 and 1.4.11, so the dimming is a usability gain only.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-16)

All findings are fixed and re-probed in light, dark and forced colors; the input-group, input and textarea suites pass 57/57 with `--workers=2`. `sketchbook check` D1/D4 fail until the Figma round, as expected. No open items.
