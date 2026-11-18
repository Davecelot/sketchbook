# Foundations: how established systems define them

**Answer.** Most systems agree on a small set of shapes: a 4px-based spacing step (Tailwind's `--spacing: 0.25rem`, Carbon's 2/4/8/12/16/24/32...), a type scale of 7 to 13 named steps that pairs each size with a line height, an 11-to-12-step color ramp per hue, a 3:1 / 4.5:1 / 7:1 contrast vocabulary from WCAG, and motion split into a few durations plus a few easing curves. Where they differ is naming (role-based vs scale-based) and density. Sketchbook should ship presets that copy these shapes, label each with its source, and make every value editable in the spec. Items I could not open are marked UNVERIFIED and carry `"verified": false` in the JSON.

As of: 2026-11-08. Values come only from pages listed in Sources. Material 3's own site is script-rendered and returned titles only, so Material numbers come from its Android documentation on GitHub (verified there) and anything else is flagged.

## 1. Spacing
- Tailwind v4: one variable, `--spacing: 0.25rem` (4px); utilities multiply it (`px-4` = 16px).
- Carbon: `spacing-01..13` = 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160 px. Its 2x grid uses an 8px "mini unit".
- Bootstrap 5.3: `$spacer: 1rem`; levels 0..5 = 0, .25, .5, 1, 1.5, 3 rem (4, 8, 16, 24, 48 px).
- GOV.UK: units 0..9 on a 5px base: static 0, 5, 10, 15, 20, 25, 30, 40, 50, 60; the responsive scale shrinks units 4 to 9 below the 640px tablet breakpoint (e.g. 9 is 40 vs 60).
- Open Props: `--size-1` .25rem, `--size-3` 1rem, `--size-8` 3rem, plus fluid `--size-fluid-3: clamp(1.5rem, 3vw, 2rem)`.
- Why bases differ (my reading, not stated by the sources): 4px divides cleanly into common type sizes and control heights; 8px is coarser and quicker to apply; GOV.UK's 5px suits its 15/19/25 line heights; Carbon adds a 2px step for hairline adjustments.
- Presets Sketchbook should ship: `4px-linear` (4, 8, 12, 16, 24, 32, 48, 64), `carbon-like` (13 steps), `8pt` (8, 16, 24, 32, 40, 48...), `5px-gov` (static scale), `bootstrap-like`. Offer a fluid variant via Utopia inputs.
- Roast questions: Why this base? (Ask what the smallest control height and line height are; the base must divide them.) Do you have a half-step below 4px, and is it used? (Unused steps are noise.) Is the scale linear or growing? (Linear scales run out at the large end; check whether layout needs 96px+.) Are component paddings referencing semantic space tokens or raw numbers?

## 2. Type scale
Named modular ratios (Modular Scale): minor second 1.067, major second 1.125, minor third 1.2, major third 1.25, perfect fourth 1.333, augmented fourth 1.414, perfect fifth 1.5, minor sixth 1.6, golden 1.618, major sixth 1.667, minor seventh 1.778, major seventh 1.875, octave 2. It also notes multi-strand scales exist but too many strands dilute the scale.

Tailwind v4.3 sizes (rem/px, default line height): xs .75/12 (1rem), sm .875/14 (1.25rem), base 1/16 (1.5rem), lg 1.125/18 (1.75), xl 1.25/20 (1.75), 2xl 1.5/24 (2), 3xl 1.875/30 (2.25), 4xl 2.25/36 (2.5), 5xl 3/48 (1), 6xl 3.75/60, 7xl 4.5/72, 8xl 6/96, 9xl 8/128 (all 1). This is hand-picked, not a pure ratio.

Material 3 roles and sizes (Android docs): display L/M/S 57/45/36; headline L/M/S 32/28/24; title L/M/S 22/16/14; body L/M/S 16/14/12; label L/M/S 14/12/11. Baseline weights Regular, except title M/S and label roles Medium; the emphasized set raises each one step (Regular to Medium, Medium to Bold). Line heights and tracking: UNVERIFIED.

Carbon: productive set (14px base, `-01`, fixed headings) vs expressive (16px base, `-02`, fluid headings). Examples: body-compact-01 14/18, body-02 16/24, heading-03 20/28, heading-07 54/64 light, code-01 12/16.

GOV.UK steps (small / large screens): 80: 53/55 and 80/80; 48: 32/35 and 48/50; 36: 27/30 and 36/40; 27: 21/25 and 27/30; 24: 21/25 and 24/30; 19: 19/25 both; 16: 16/20 both. Breakpoint 640px.

Utopia fluid: interpolate between a small-viewport and a large-viewport scale (example 360px, 18px base, 1.2 ratio to 1240px, 20px base, 1.25 ratio).

Presets: `modular-1.2`, `modular-1.25`, `modular-1.333`, `tailwind-like`, `material-roles`, `carbon-productive`, `fluid-utopia`.
Roast questions: What is your base size and why not 16px for reading? Do you need 13 steps, or will 6 do? (Every step must have a job.) Is the ratio too big for dense UI (above 1.25 gets tall fast)? Do display sizes and body sizes share one ratio, and should they?

## 3. Line height and letter spacing
- Tailwind pairs size and leading (see above); large sizes drop to 1. `leading-<n>` multiplies the spacing unit. Named `leading-tight/snug/normal/relaxed/loose` = 1.25, 1.375, 1.5, 1.625, 2: UNVERIFIED (page did not list them; value from the page author's general knowledge).
- Tracking (Tailwind): tighter -0.05em, tight -0.025em, normal 0, wide 0.025em, wider 0.05em, widest 0.1em.
- Carbon: small text gets positive tracking (14px body 0.16px, 12px code 0.32px); body 16px and headings 0.
- GOV.UK body: 19px on 25px (about 1.32); 16px on 20px (1.25).
- Presets: `lh-fixed-grid` (line heights snapped to the spacing base, e.g. 16/24), `lh-ratio` (1.5 body, 1.2 to 1.25 headings), tracking `tailwind` and `carbon-small-positive`.
- Roast questions: Do line heights land on the spacing grid? Is body at least 1.5 for long text (WCAG text-spacing guidance is not verified here)? Why negative tracking on headings, and does it survive your font?

## 4. Font weights
Tailwind: 100 thin, 200 extralight, 300 light, 400 normal, 500 medium, 600 semibold, 700 bold, 800 extrabold, 900 black. Carbon uses only 300, 400, 600. Material uses Regular/Medium/Bold roles.
Presets: `three-weights` (400/500/700), `carbon-like` (300/400/600), `full-nine`.
Roast: how many weights ship in the font file (each costs bytes)? Is 500 distinguishable from 400 in your font at 14px?

## 5. Color ramps
- Tailwind v4: 22 families (red through rose, plus slate, gray, zinc, neutral, stone, taupe, mauve, mist, olive), 11 shades 50..950, stored in OKLCH. Blue example: 50 `oklch(97% 0.014 254.604)`, 500 `oklch(62.3% 0.214 259.815)`, 950 `oklch(28.2% 0.091 267.935)`.
- Radix 12 steps: 1 app background; 2 subtle background; 3 component background; 4 hover; 5 pressed/selected; 6 subtle border (non-interactive); 7 subtle border (interactive); 8 strong border and focus ring; 9 solid background; 10 solid hover; 11 low-contrast text; 12 high-contrast text. Dark scales are separate (`blue-dark`).
- Material 3 tonal palettes: tone means lightness. Roles reference tones 10, 20, 30, 40, 80, 90 for primary/secondary/tertiary/error; neutral uses 4, 6, 10, 12, 17, 20, 24, 87, 90, 92, 94, 95, 96, 98; neutral variant 30, 50, 60, 80, 90. Light primary = tone 40, container 90, on-container 10; dark primary = 80, container 30, on-container 90.
- Open Props: gray through jungle steps 0 to 12, plus 16 OKLCH variables generated from any hue.
- Leonardo: swatches produced from target contrast ratios.
- Presets: `tailwind-11`, `radix-12`, `m3-tonal`, `contrast-targeted`, `oklch-perceptual` (fixed L steps, chroma curve, one hue).
- Roast: Who checked every step pair for contrast (not just the 500)? Is the ramp perceptually even, or does yellow look jumpy next to blue? Do dark mode steps invert or get their own tuning? Do you need 11 steps, or do 5 roles cover the product?

## 6. Neutrals
Tailwind offers gray, slate, zinc, neutral, stone, taupe, mauve, mist and olive neutrals (tinted from cool to warm). Radix pairs each accent with a matching gray (not verified on the pages opened, so omit from claims). Material uses a neutral and a neutral-variant palette.
Presets: `pure-neutral`, `cool-tinted`, `warm-tinted`, `brand-tinted (hue of the primary, low chroma)`.
Roast: Does the neutral tint clash with the brand? Is the page background step distinct from the card step in both modes?

## 7. Semantic color roles
- Material: primary/secondary/tertiary each with on-, container, on-container, inverse, fixed variants; error with on-, container, on-container; outline and outline-variant; surface family (dim, bright, container lowest...highest); inverse surface.
- Atlassian names color by property and role, e.g. `color.icon.success`, `color.text` (default).
- Polaris web components use `tone` with critical, success, info.
- Primer modifiers: default, muted, emphasis.
- Common minimum set for Sketchbook: neutral, brand/primary, success, warning, danger, info, plus surface, text, border, focus.
Roast: Is danger distinguishable without color (icon, text)? Do warning and success work on both light and dark? Are "info" and "brand" the same blue by accident?

## 8. Contrast
- WCAG 2.2 AA text: 4.5:1 normal, 3:1 large (18pt, about 24px, or 14pt bold, about 18.5px). AAA: 7:1 and 4.5:1. Ratios are not rounded (4.499 fails). Non-text (UI components and graphics): 3:1 against adjacent colors; focus indicators must still meet it.
- APCA (Bronze simple targets): Lc 90 preferred body, 75 minimum body columns, 60 other content text, 45 large/heavy text and small icons, 30 placeholder/disabled and large solid icons, 15 minimum non-text. Add 15 for AAA-like. Status: candidate for WCAG 3 and also developed as a separate readability criterion; it is not part of WCAG 2.2.
- Carbon: icons meet 4.5:1 like text.
- Presets: `wcag-aa`, `wcag-aaa`, `apca-bronze`. Ship WCAG as the enforced default because it is the current standard.
Roast: Which ratio do disabled and placeholder follow (exempt in WCAG for inactive controls, but is that your choice)? Does your focus ring reach 3:1 on every surface it can appear on?

## 9. Radius
Tailwind: xs 2, sm 4, md 6, lg 8, xl 12, 2xl 16, 3xl 24, 4xl 32 px, none 0, full. Material 3: none 0, extra-small 4, small 8, medium 12, large 16, large-increased 20, extra-large 28, extra-large-increased 32, extra-extra-large 48, full 50% (Android names; token names on the web map to corner-none... corner-full).
Presets: `sharp` (0/2/4), `soft` (4/8/12/16), `tailwind`, `m3`, `pill`.
Roast: Do nested radii subtract the padding (inner = outer minus gap)? Why do buttons and inputs differ?

## 10. Elevation and shadow
Tailwind: 2xs `0 1px rgb(0 0 0/.05)`; xs `0 1px 2px 0 .../.05`; sm `0 1px 3px 0 .../.1, 0 1px 2px -1px .../.1`; md `0 4px 6px -1px .../.1, 0 2px 4px -2px .../.1`; lg `0 10px 15px -3px .../.1, 0 4px 6px -4px .../.1`; xl `0 20px 25px -5px .../.1, 0 8px 10px -6px .../.1`; 2xl `0 25px 50px -12px .../.25` (comments on docs page). Open Props has outer shadows 1 to 6 plus inner and text shadows tuned for light and dark (values not listed on the page). Material 3 levels 0 to 5 dp values, Carbon and Fluent shadows: UNVERIFIED. Atlassian has elevation tokens (values not read).
Presets: `flat-borders` (no shadow, borders only), `tailwind-shadows`, `layered-5`.
Roast: Shadows in dark mode barely show; what replaces them (surface tint, border)? Is elevation tied to z-index, or are they independent?

## 11. Motion
- Carbon durations: fast-01 70, fast-02 110, moderate-01 150, moderate-02 240, slow-01 400, slow-02 700 ms. Easing, productive: standard `cubic-bezier(0.2, 0, 0.38, 0.9)`, entrance `(0, 0, 0.38, 0.9)`, exit `(0.2, 0, 1, 0.9)`. Expressive: standard `(0.4, 0.14, 0.3, 1)`, entrance `(0, 0, 0.3, 1)`, exit `(0.4, 0.14, 1, 1)`. Productive = subtle for tasks; expressive = significant moments.
- Material 3 (Android docs): standard `(0.2, 0, 0, 1)`, standard decelerate `(0, 0, 0, 1)`, standard accelerate `(0.3, 0, 1, 1)`, emphasized decelerate `(0.05, 0.7, 0.1, 1)`, emphasized accelerate `(0.3, 0, 0.8, 0.15)`, linear `(0, 0, 1, 1)`. Plain "emphasized" is a path, not a cubic-bezier. Durations: short1..4 = 50/100/150/200; medium1..4 = 250/300/350/400; long1..4 = 450/500/550/600; extra-long1..4 = 700/800/900/1000 ms.
- Fluent: UNVERIFIED (its tokens page lists categories only).
- Reduced motion (MDN): `prefers-reduced-motion: reduce` means replace large movement (scale, pan, parallax) with fades or remove it, keep state and focus feedback, and make rich motion opt-in. Baseline widely available since 2020.
Presets: `carbon-productive`, `carbon-expressive`, `m3-standard`, `minimal` (100/200 ms one ease), `none`.
Roast: Do all durations collapse under reduce, and does feedback still exist? Is anything longer than 400ms in a task flow?

## 12. Density
Primer size modifiers: condensed, normal, spacious. Carbon splits type sets by density (productive 14px vs expressive 16px). Material density scale and Fluent compact: UNVERIFIED.
Presets: `compact / default / comfortable` as a multiplier on control height and padding, keeping minimum touch target.
Roast: Is the compact mode still 24px or larger for pointer targets (WCAG 2.2 target size is not verified here)? Is density a global switch or per component?

## 13. Layout grid and breakpoints
- Tailwind: sm 640, md 768, lg 1024, xl 1280, 2xl 1536 px (min-width, rem-based: 40/48/64/80/96).
- Bootstrap 5.3: xs 0, sm 576, md 768, lg 992, xl 1200, xxl 1400. Container max widths 540/720/960/1140/1320: UNVERIFIED (page did not list them).
- Carbon 2x grid: small 320 (4 col), medium 672 (8), large 1056 (16), x-large 1312 (16), max 1584 (16); 16px padding; margin 0, 16, 16, 16, 24; gutter total 32px with gutters.
- GOV.UK tablet breakpoint 640. Material breakpoints: UNVERIFIED.
Presets: `tailwind-bp`, `bootstrap-bp`, `carbon-2x`, `content-first` (3 breakpoints).
Roast: Are breakpoints chosen from content or copied from devices? Is the grid 12 columns by habit?

## 14. Icon sizes
Carbon: 16px default, 20, 24, 32 also fine; interactive icons need a 44px or larger touch target (e.g. 22px icon in a 48px target). Pair 16/20px icons with 14/16px text.
Presets: `16-20-24`, `carbon-4`.
Roast: Is stroke weight consistent across sizes? Is the hit area bigger than the glyph?

## 15. z-index
Tailwind examples use z-0, 10, 20, 30, 40, 50 and `z-auto`; the full default table was not on the page. Open Props has a z-index group (values not listed). 
Presets: `layers-named` (base 0, sticky, dropdown, overlay, modal, toast, tooltip) with gaps of 100 (a convention, UNVERIFIED as any system's default).
Roast: Are layers named by role, not number? Who owns the top layer (toasts vs modals)?

## 16. Opacity and 17. Border width
Opacity: Atlassian defines `opacity.disabled` and `opacity.loading` (values not read). Tailwind applies alpha with slash modifiers (`bg-sky-500/50`). Border width (Atlassian): `border.width` 1px, `border.width.selected` 2px, `border.width.focused` 2px; selection and focus are meant to stack rather than replace.
Presets: opacity `states-3` (disabled, loading, overlay), border `1-2` (default 1, strong/focus 2).
Roast: Does disabled via opacity break contrast and leave controls unreadable? Is focus a visible 2px ring distinct from selection?

## 18. Semantic token naming
- Atlassian: foundation, property, optional modifier (role, emphasis or state): `color.icon.success`, `opacity.loading`.
- Primer: three tiers (base, functional, component) with blocks prefix, namespace, pattern, variant (one per token), property (camelCase, required), scale; modifiers default/muted/emphasis, size t-shirts, condensed/normal/spacious. Examples `bgColor-inset`, `button-primary-bgColor-hover`.
- Spectrum: primitive, alias, semantic, component-specific; reads broad to specific (`accent-background-color-hover`); prefer semantic.
- Fluent: global then alias tokens (names shown as images, not read).
- Carbon (spacing `spacing-01` style, motion `duration-fast-01`) is scale-numbered.
- Material: role names such as `primary`, `on-primary`, `surface-container-high`.
- Polaris, GOV.UK, Lightning naming: UNVERIFIED (pages redirected or did not cover).
Recommendation: three tiers (primitive, semantic, component); semantic names as `category.property.role[.emphasis][.state]`.
Roast: Can a developer pick a token without knowing its value? Do component tokens exist only where a component truly diverges? Can you rename a primitive without touching components?

## Sources (pages opened)
- https://tailwindcss.com/docs/theme, /font-size, /responsive-design, /colors, /letter-spacing, /font-weight, /line-height, /box-shadow, /border-radius, /z-index
- https://www.modularscale.com/
- https://carbondesignsystem.com/elements/spacing/overview/
- https://carbondesignsystem.com/elements/motion/overview/
- https://carbondesignsystem.com/elements/2x-grid/overview/
- https://carbondesignsystem.com/elements/typography/type-sets/
- https://carbondesignsystem.com/elements/icons/usage/
- https://getbootstrap.com/docs/5.3/layout/breakpoints/
- https://getbootstrap.com/docs/5.3/utilities/spacing/
- https://design-system.service.gov.uk/styles/spacing/
- https://design-system.service.gov.uk/styles/type-scale/
- https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Motion.md
- https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Typography.md
- https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Shape.md
- https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Color.md
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html, /contrast-enhanced.html, /non-text-contrast.html
- https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- https://open-props.style/
- https://utopia.fyi/
- https://primer.style/product/primitives/token-names/ and /product/primitives/
- https://atlassian.design/foundations/design-tokens/ and https://atlassian.design/components/tokens/all-tokens
- https://spectrum.adobe.com/page/design-tokens/
- https://fluent2.microsoft.design/design-tokens
- https://shopify.dev/docs/api/polaris/using-polaris-web-components
