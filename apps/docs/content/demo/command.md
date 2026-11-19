---
title: "Command"
description: "A search field that filters a list of grouped actions or destinations; Arrow Up and Down move the active item and Enter selects it. Used inline or inside a dialog as a command palette. Eight custom elements share state through context."
---

<!-- Generated from spec/components/command/contract.json by npm run docs:components. Do not edit by hand. -->

Use `<sb-command>` in HTML. [Lifecycle status](/reference/contract-format/#lifecycle-statuses) `stable` · Version `0.1.0`

## Example

Type “account” to find Profile by keyword. Clear the search, then move through the results with the arrow keys and notice that Calculator is disabled.

<div class="live-demo">
<sb-command label="Search commands" style="display:block;width:450px;border:1px solid var(--sb-color-border);border-radius:var(--sb-radius-control)">
  <sb-command-input placeholder="Search commands…"></sb-command-input>
  <sb-command-list>
    <sb-command-empty>No matching commands.</sb-command-empty>
    <sb-command-group label="Suggestions">
      <sb-command-item>Calendar</sb-command-item>
      <sb-command-item keywords="emoji picker">Search emoji</sb-command-item>
      <sb-command-item disabled>Calculator</sb-command-item>
    </sb-command-group>
    <sb-command-separator></sb-command-separator>
    <sb-command-group label="Settings">
      <sb-command-item keywords="account user">Profile<sb-command-shortcut>⌘P</sb-command-shortcut></sb-command-item>
      <sb-command-item>Billing<sb-command-shortcut>⌘B</sb-command-shortcut></sb-command-item>
      <sb-command-item>Settings<sb-command-shortcut>⌘S</sb-command-shortcut></sb-command-item>
    </sb-command-group>
  </sb-command-list>
</sb-command>
</div>

```html
<sb-command label="Search commands" style="display:block;width:450px;border:1px solid var(--sb-color-border);border-radius:var(--sb-radius-control)">
  <sb-command-input placeholder="Search commands…"></sb-command-input>
  <sb-command-list>
    <sb-command-empty>No matching commands.</sb-command-empty>
    <sb-command-group label="Suggestions">
      <sb-command-item>Calendar</sb-command-item>
      <sb-command-item keywords="emoji picker">Search emoji</sb-command-item>
      <sb-command-item disabled>Calculator</sb-command-item>
    </sb-command-group>
    <sb-command-separator></sb-command-separator>
    <sb-command-group label="Settings">
      <sb-command-item keywords="account user">Profile<sb-command-shortcut>⌘P</sb-command-shortcut></sb-command-item>
      <sb-command-item>Billing<sb-command-shortcut>⌘B</sb-command-shortcut></sb-command-item>
      <sb-command-item>Settings<sb-command-shortcut>⌘S</sb-command-shortcut></sb-command-item>
    </sb-command-group>
  </sb-command-list>
</sb-command>
```

## Properties

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | `` | Accessible name of the search field and of the list ("Search documentation"). The placeholder is not a name. |
| `filter` | `auto`, `manual` | `auto` | auto hides the items that do not match the search text (rule in Usage, Behavior). manual never hides items: the consumer listens to input and renders the matching items itself (remote or custom search). |
| `loop` | boolean | `false` | Arrow Down on the last item moves to the first, and Arrow Up on the first moves to the last. |
| `resultsLabel` | text | `{count} results` | Template for the polite announcement of how many items match after the search text changes; {count} is replaced by the number. Set it to translate the announcement. |

## Parts

### `<sb-command-input>`

The search field: a decorative search icon and a native text input with the combobox role.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `placeholder` | text | `` | Hint shown while the field is empty ("Search documentation..."). Not an accessible name. |
| `value` | text | `` | The search text. Setting it from code filters the list as typing does. |

| Event | Notes |
| --- | --- |
| `input` | From the native field on every edit; read the search text from the sb-command-input value. With filter=manual this is where the consumer filters. |

### `<sb-command-group>`

A titled group of items (a docs section).

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | `` | Visible heading and accessible name of the group (the section name). |

### `<sb-command-item>`

One option: text, optionally an icon before it and a shortcut hint after it.

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | text | `` | What the search text is matched against and what sb-select reports. Empty means the item's trimmed text. Unique within the command. |
| `keywords` | text | `` | Extra space-separated words that also match (synonyms, the section name), never shown. |
| `disabled` | boolean | `false` | Cannot become active or be selected; skipped by the arrows. |

| Event | Notes |
| --- | --- |
| `sb-select` | Fires on the item when a person chooses it (Enter while active, or a click). Listen on sb-command and read event.detail.value (or event.target). Not fired for disabled items or changes made from code. |

## Keyboard

| Key | Action |
| --- | --- |
| `ArrowDown` | next enabled visible item becomes active; stops at the last unless loop |
| `ArrowUp` | previous enabled visible item becomes active; stops at the first unless loop |
| `Enter` | selects the active item (fires sb-select); never submits a surrounding form |
| `Home` | moves the caret to the start of the search text (APG editable combobox), not to the first item |
| `End` | moves the caret to the end of the search text |
| `Escape` | not handled, so it reaches the container (a dialog closes) |
| `Tab` | leaves the command; the search field is its only tab stop |
| `Printable characters` | edit the search text; the first matching enabled item becomes active |

## Accessibility

- Role: `combobox (the search field) controlling a listbox of options, with group for each titled group`
- Native element: `input type=text`
- Accessible name: label on sb-command names the search field and the listbox. A group is named by its label. An option is named by its text; the shortcut hint is not part of the name.
- Form: The search field filters the list; its text is not a value to submit, so Command is not a form control (rule form-associated-controls covers controls that stand in for a native form field).
