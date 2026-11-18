# Accessibility audit: Typography (2026-11-15)

Scope: `spec/components/typography/contract.json`, `src/components/typography/*`, `playwright/tests/typography/*`. Standard: WCAG 2.2 AA; native h1-h4, p, blockquote, ul/li, code, small and div semantics (static, non-focusable).

## Criteria

| POUR | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P | 1.4.3 contrast, fg on background | Pass | Probe of computed colors on the `variants` story. Light: `#0a0a0a` on white 19.80:1. Dark: `#fafafa` on `#0a0a0a` 18.97:1. `npm run check` T6 passes |
| P | 1.4.3 contrast, muted and lead | Pass | `muted` and `lead` use `typography.muted.fg`. Light `#737373` on white 4.74:1; dark `#a1a1a1` on `#0a0a0a` 7.66:1 (both at or above 4.5:1, including the 14px muted text) |
| P | 1.4.3 contrast, inline-code | Pass | Foreground on `typography.code.bg`: light 18.97:1 (`#0a0a0a` on `#fafafa`); dark 14.50:1 (`#fafafa` on `#262626`) |
| P | 1.4.12 text spacing | Pass | Injected line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em into the document and every shadow root: no part has `overflow` other than visible, and none has `scrollHeight` above `clientHeight` or `scrollWidth` above `clientWidth`. Applied `line-height` computes to 54px on h1, so the override takes effect (no `!important` in `Typography.scss`) |
| P | 1.4.4 resize text | Pass | Sizes are px tokens and scale with browser zoom. At a 320px viewport the `article` story has no horizontal scroll (`scrollWidth` 320). Note: a root font-size change (text-only enlargement) does not scale them (h1 stays 36px); this is not required by 1.4.4 when zoom works |
| P | 1.4.10 reflow | Pass | 320px viewport, `article` story: no horizontal scroll |
| P | 1.4.1 color alone | Pass | Blockquote bar and h2 rule are decoration; meaning is carried by the native element |
| P | 1.4.11 non-text contrast | Not applicable | Blockquote bar and h2 rule are decorative; the quote is identified by `blockquote` role |
| P | forced-colors | Pass | `forced-colors: active`: text computes to `rgb(0, 0, 0)` on canvas white in all variants; the blockquote bar (2px) and h2 rule (1px) stay drawn in `rgb(0, 0, 0)`; inline-code gets canvas white background with black text |
| P | prefers-reduced-motion | Not applicable | No transitions or animation |
| O | 2.1.1 / 2.4.7 / 2.1.2 keyboard, focus, trap | Not applicable | Static; behavior spec 'is not focusable' passes |
| O | 2.5.8 target size | Not applicable | Not interactive |
| U | 2.4.6 headings and labels | Pass | Level follows the variant (one `h1` to `h4`); the component does not set a level of its own, so the consumer chooses the order |
| U | 3.2.x predictable, 3.3.x errors | Not applicable | No input |
| R | 1.3.1 / 4.1.2 headings | Pass | CDP `Accessibility.getFullAXTree` on `variants`: `heading` level 1, 2, 3, 4 with their text as name |
| R | 1.3.1 other semantics | Pass | `paragraph` for p, lead and muted; `blockquote`; `list` with two `listitem` (slotted `li` stay list items of the inner `ul` through the flattened tree); `code` for inline-code; `generic` for large and small (as the contract says). On `article` the order is h1, p, h2, p, blockquote, h3, p, list, h4, p inside the `article` landmark |
| R | ID references across shadow roots | Not applicable | None; the host adds no role or aria attribute |
| R | axe | Pass | Behavior spec: axe clean on `variants` and `article` |
| R | Behavior spec and `npm run check` | Pass | 24/24 passed; all checks pass (A1 warn on spec/api.json is unrelated) |
| R | Screen-reader evidence | Pass | AX tree above plus the `__screen-reader__` snapshots (check S1) |

## Failures

None.

## Verdict
Verdict: ready
Approved-by: Davecelot (2026-11-15)

Heading levels and the list, quote, code and paragraph semantics are exposed correctly in Chromium's accessibility tree; all text pairs pass 4.5:1 in light and dark, text spacing and reflow cause no clipping, forced colors keeps text and the decorative rules visible, and the behavior spec (24/24), axe and `npm run check` pass. No open findings.
