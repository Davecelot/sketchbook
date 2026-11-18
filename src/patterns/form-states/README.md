# Form states

Every form control in its default, disabled, invalid and read-only states on one page, also in right to left.

## When to use
To review a brand or token change: focus rings, border widths, contrast and spacing for all controls at once. It is a review page, not a product screen.

## What to replace
Nothing, as a rule. Add a section when the system gains a control.

## How to adapt
- Label each sample with its state so assistive-technology passes are readable.
- Tab through the page to see every focus ring; disabled controls are skipped, read-only ones are not.
- The native input samples are styled in `form-states.css` with semantic tokens only, to show how plain HTML sits next to the components.
