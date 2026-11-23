---
component: Tabs
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference and names), WAI-ARIA APG Tabs pattern
---

# Tabs

> Switches between panels of related content, one visible at a time. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Offer peer views of the same subject on one page. If choosing a tab changes the page or the URL, use links instead.

## 2. Anatomy
Four elements: `sb-tabs` (layout and selected value, part `root`), `sb-tabs-list` (tablist, part `list`, `variant`), `sb-tabs-trigger` (native button with `role="tab"`, part `trigger`), `sb-tabs-content` (tabpanel, part `panel`).

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-tabs` | `value` | text | "" | selected tab; empty selects the first enabled one |
| `sb-tabs` | `orientation` | horizontal, vertical | horizontal | list direction and arrow keys |
| `sb-tabs` | `activation` | automatic, manual | automatic | select on focus, or on Enter/Space |
| `sb-tabs` | event `change` | detail `{ value: string }` | | after a person picks another tab; a slotted control's own `change` also bubbles here: check `event.target === host` |
| `sb-tabs-list` | `variant` | primary, line | primary | filled track, or transparent with an indicator |
| `sb-tabs-trigger` | `value`, `disabled` | text, boolean | "", false | pairs with the panel of the same value |
| `sb-tabs-content` | `value` | text | "" | the tab this panel belongs to |

## 4. Variant matrix
`variant` (primary, line) × `orientation` (horizontal, vertical).

## 5. Roles and color
Track `muted`; inactive tab text `muted-foreground`; selected tab `background` with `foreground` text, a small shadow and a 1px `input` border (3:1 against the track, so the selection does not rest on the fill, WCAG 1.4.11); line variant uses a `foreground` indicator; ring `ring`.

## 6. States
selected, hover (text moves toward `foreground`), focus-visible (3px solid ring on a tab or on a panel), disabled (opacity 0.5).

## 7. Dimensions and layout
List height 36px with a 3px inset, track radius 10px, tab radius 8px, tab padding 8px by 4px, icon 16px. The root stacks list and panel with an 8px gap (a row when vertical).

## 8. Typography
14px, weight 500, from the control type tokens.

## 9. Accessibility
- The list has `role="tablist"` and `aria-orientation` as host attributes (an author `role` is kept); each tab is a native button with `role="tab"` and `aria-selected`.
- One tab stop: the selected tab. Arrow keys move focus (reversed in right-to-left), Home and End jump; with automatic activation the focused tab is selected. Disabled tabs are skipped.
- `aria-controls` uses `ariaControlsElements`; the panel is named by its tab through `ariaLabelledByElements`, or an `aria-label` copy where unsupported. ID references cannot cross shadow roots, element references from the inside outward can.
- References between tabs and panels are re-resolved when tabs or panels are added, removed or change `value`. A `value` that names no enabled tab selects the first enabled tab.
- Forced colors: the selected tab of the primary variant is `Highlight` on `HighlightText`; the line variant draws its indicator in `Highlight`.
- The panel is focusable (`tabindex="0"`); inactive panels are `display: none`.

## 10. Usage
### Behavior
Selecting a tab shows its panel and hides the rest. `change` fires for people's actions only, on the host; a `change` from a form control inside a panel bubbles too, with another target and no detail.
### Composition
`sb-tabs` > `sb-tabs-list` > `sb-tabs-trigger`, then one `sb-tabs-content` per tab.
### Choosing the props
Use `line` for lightweight sub-navigation, `vertical` for side lists, `manual` when showing a panel is costly.
### Do / Don't
- Do keep labels short and unique. Do not put controls inside a tab.

## Realizations
### Figma
Drawn in the library: axes Orientation, State, Selected and Disabled, with two tabs so a selected tab is seen beside an unselected one, and the panel (sample text) at the tabs gap. Element set TabsList: Variant Primary and Line; the line list's selected tab shows the indicator as an inside bottom edge. Not drawn: the tab icons (`realizations.design`).
### Web
Complete. src/components/tabs/Tabs.ts, src/components/tabs/TabsList.ts, src/components/tabs/TabsTrigger.ts, src/components/tabs/TabsContent.ts, src/components/tabs/context.ts. Parts: root, list, trigger, panel.
### Coverage
- tablist, tab and panel roles; only the selected panel displayed
- value selects; first enabled tab by default
- click selects
- change detail, bubbles, composed, not for code changes; a slotted control's change has no detail
- one tab stop; Tab reaches the panel
- arrows wrap and select, disabled skipped, Home/End
- disabled tab
- manual activation with Enter and Space
- vertical orientation keys and aria-orientation
- right-to-left reverses the arrows
- ariaControlsElements and panel name in the accessibility tree
- list variants from tokens (track, indicator)
- focus ring keyboard-only in token color
- axe clean (five stories)
### Known drift
- focus ring: the visual reference uses a translucent ring plus border; changed for WCAG 1.4.11
- inactive tab text: the visual reference uses foreground in light and muted-foreground in dark
- selected tab in dark mode: the reference uses an input-tinted fill and a border in dark
- tab height: the reference subtracts 1px for its transparent border
- tab focus: keeps the generic host free of tabindex so axe sees tab as an owned child of tablist
- roles: aria-label copy of the tab text where the property is unsupported

## Open questions
All answered; see contract.json.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-tabs-*` variables (check T4). Tests first (rule test-first).
