Start with the job a token does. The examples below are vocabulary options, not an inventory to implement or a grammar to follow. Alternatives are useful search terms, not rules for replacing words.

## Color roles and surfaces

| Intent | Names you might see | What to check |
| --- | --- | --- |
| The base area behind content | `background`, `canvas`, `surface` | Some systems reserve `surface` for a card or panel; others use it for the base canvas too. |
| The interior color of an element | `fill`, `background` | A button fill and the page background are both backgrounds, but serve different jobs. |
| The content on a particular surface | `foreground`, `content`, `on-primary` | `on-primary` names the surface it pairs with; `text` and `icon` may be separate if they intentionally differ. |
| Content in a contrasting context | `inverse`, `inverted`, `reversed` | `inverse` describes a departure from the usual context. It is not another word for `on-primary`, and it does not necessarily mean dark mode. |
| A dividing line or edge | `border`, `stroke`, `divider`, `separator` | A divider between rows, a control border, and a focus ring can use the same value without having the same purpose. |

Surface terminology varies across systems; compare [Shopify Polaris](https://polaris.shopify.com/design/colors/using-color) and [Material color roles](https://m3.material.io/styles/color/roles).

## Interaction states

| Intent | Names you might see | What to check |
| --- | --- | --- |
| The resting appearance | `default`, `rest`, `resting` | `enabled` means the user can interact; an enabled control can still be hovered or focused. |
| A pointing device is over a target | `hover`, `mouseover` | Hover is not keyboard focus, and it may not exist on touch devices. |
| A control receives input | `focus`, `focus-visible` | Focus and when to show a focus indicator are related but distinct. Focus is not selection. |
| An interaction is happening now | `pressed`, `active` | `active` is ambiguous: it may mean a momentary press, a current destination, or a lasting selection. `aria-pressed` on a toggle button describes a lasting toggle state, not the momentary press. |
| A choice persists | `selected`, `checked`, `current` | Match the behavior: selected tab, checked checkbox, current page. Don't substitute these automatically. |
| An action or edit is unavailable | `disabled`, `readonly` | Read-only data may still be focusable, selectable, or copyable; it isn't necessarily a disabled control. |
| Work is underway | `loading`, `pending`, `busy` | Work being in progress doesn't by itself say whether the control remains operable. |

See [Nathan Curtis on states](https://medium.com/@nathanacurtis/the-sorry-state-of-states-89dd4668737e) and [Eric Bailey on user-facing states](https://ericwbailey.website/published/all-the-user-facing-states/).

## Status and prominence

| Intent | Names you might see | What to check |
| --- | --- | --- |
| A good outcome | `success`, `positive`, `valid` | Valid input and successful completion are not always the same event. |
| A potential problem | `warning`, `caution` | Warns about a risk; it isn't necessarily an error or a destructive action. |
| A problem or failed outcome | `error`, `negative`, `critical` | `destructive` describes an action such as Delete, not necessarily the error that follows a failed action. |
| A neutral or informational message | `info`, `neutral`, `notice` | An informational callout can need a distinct treatment even though it isn't positive or negative. |
| Relative priority | `primary`, `secondary`, `tertiary` | Identify what is ranked: actions, surfaces, or something else. `primary` alone does not always mean brand color. |
| How strongly something stands out | `subtle`, `muted`, `strong`, `prominent` | Emphasis is relative to peers. `subtle` is not the same as disabled, and it doesn't exempt text from contrast requirements. |

Compare [Carbon color tokens](https://carbondesignsystem.com/elements/color/tokens/) and [Atlassian design tokens](https://atlassian.design/foundations/design-tokens/).

## Typography and sizing

| Intent | Names you might see | What to check |
| --- | --- | --- |
| A text style's job | `display`, `title`, `body`, `label`, `caption` | A visual text role should not dictate HTML heading levels. Choose the heading level for document structure. |
| A step in a scale | `sm`, `md`, `lg`; numeric steps such as `2`, `4`, `8` | A step name orders values; it doesn’t say where to use them or guarantee a specific measurement. |
| Space between known parts | `control.gap`, `text-to-icon`, `container.padding` | Name the relationship if it helps people choose correctly. `gap`, `padding`, and `gutter` don't always describe the same relationship. |
| The UI's spacing density | `compact`, `comfortable`, `spacious` | Density changes the arrangement or spacing of the UI; it isn't necessarily the size of a single control. |

See [Nate Baldwin on semantic spacing](https://medium.com/@NateBaldwin/when-semantic-tokens-are-no-longer-semantic-d65ef16fadd7) and [Bootstrap's layout containers](https://getbootstrap.com/docs/5.3/layout/containers/).

## Extended reference: motion

| Intent | Names you might see | What to check |
| --- | --- | --- |
| Elapsed time | `instant`, `quick`, `moderate`, `slow` | A duration isn't an effect or a curve; `quick` doesn't say how an object moves. |
| How movement accelerates or decelerates | `ease-in`, `ease-out`, `standard` | An easing label doesn't imply a duration. |
| What visually changes | `fade`, `slide`, `scale` | One effect can use different durations and curves for entry and exit. `blink` could name an effect or an expressive duration in different systems. |

Compare [Carbon motion](https://carbondesignsystem.com/elements/motion/overview/) and [Open Props durations](https://open-props.style/#durations).

Adapted from the [Token naming glossary](https://continuous-daughter-04a.notion.site/Tokens-glossary-1173d7f00812809c89a7f32797ba4e0e). This is a curated reference, not a copy of the full research export.
