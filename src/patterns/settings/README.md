# Settings

Group preferences by topic so people can find, change, and save them.

## When to use
Account or workspace preferences with a few groups of options that are saved together per group. For a single long form, drop the tabs and stack the cards.

## What to replace
- Tab names, card titles and every option with your own settings.
- The submit handler of each form (the story only prevents navigation).
- The saved alert text. Show it after a successful save and remove it on the next change.

## How to adapt
- One form per tab keeps Save and Cancel scoped to what is visible.
- Give every radio group a field-set legend and the same `aria-label`.
- Use a destructive alert for a failed save, the default (status) alert for success.
- Layout lives in `settings.css`; keep it to semantic tokens.
