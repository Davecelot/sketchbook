---
title: "Choosing token names"
description: "Choose words your team understands without adopting a new naming format."
order: 15
---

Keep Sketchbook's names if they make sense to your team. If you use different words, start with one component and compare names in context. You don't have to pick a system-wide format before you start.

## Try one button

Start with what the button needs: a fill for the primary action, readable content on that fill, and a clear focus indicator.

| Intent | Sketchbook ships | Other names you could choose |
| --- | --- | --- |
| Fill for the primary action | `color.primary` | `color.background.primary` |
| Content on that fill | `color.primary-foreground` | `color.on-primary`, `color.content.primary` |
| Focus indicator | `color.ring` | `color.focus-ring` |

The alternatives are examples, not built-in aliases. Check whether a teammate could pick the right token without knowing its current value. `on-primary` tells them where to use it; `inverted` doesn't name a particular surface. Likewise, if you add a state, prefer a word that distinguishes a momentary press from a lasting selection.

Use the [token naming glossary](/reference/token-naming-glossary/) when you need words for a role or want to check whether two names mean the same thing.

## What changes and what stays

- **Vocabulary is a choice.** Pick words your team recognizes and use them consistently. Prefer a job over an appearance for semantic tokens: a rebrand can change the value without changing its purpose.
- **The token layers still matter.** A foundation token names a scale step, a semantic token describes a role, and a component token points to a semantic role. Keep references valid in every mode and keep contrast pairs declared and checked.
- **Imports map values; they don't rename the interface.** [Review an import proposal](/guides/import-tokens/) to see where existing tokens fit. If you want Sketchbook to adopt your names, handle that as a separate rename.

## Preview an existing rename

From your project folder, check what uses the name, then preview the rewrite:

```terminal
npx sketchbook tokens impact color.primary-foreground
npx sketchbook tokens rename color.primary-foreground color.on-primary --dry-run
```

Review the affected files before running the rename without `--dry-run`. Update any apps or design files outside the project that still depend on the old name. Run `npx sketchbook check` after the change.

## Rename several tokens together

1. **Make a list.** To start from a preset, run `npx sketchbook tokens rename-plan` to see the options. **On-role colors** proposes names such as `color.on-primary` only when a matching foreground and background are declared as a pair in `spec/tokens/contrast.json`.

   ```terminal
   npx sketchbook tokens rename-plan --preset on-role-colors --out token-renames.json
   ```

   This writes a new file without changing tokens or overwriting an existing file. Open the list and keep only the names you want. You can also write the whole list yourself:

   ```json
   {
     "renames": [
       { "from": "color.primary-foreground", "to": "color.on-primary" },
       { "from": "color.secondary-foreground", "to": "color.on-secondary" }
     ]
   }
   ```

2. **Preview the list.** Check the names, affected files, CSS custom properties, and proposed decision record. Add `--details` to see the full preview. Each entry needs an existing semantic token and an unused destination. Use a single rename to move a group; a list cannot chain or swap names.

   ```terminal
   npx sketchbook tokens rename --map token-renames.json --dry-run
   ```

3. **Apply and verify.** Sketchbook checks the whole batch before writing any changes. If a name collides or a check fails, edit the list and preview again. After applying, update any external consumers that still use the old names.

   ```terminal
   npx sketchbook tokens rename --map token-renames.json
   npx sketchbook check
   ```

The preset makes a suggestion once. It does not add aliases or set a naming rule for future tokens.
