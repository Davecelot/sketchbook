# Sketchbook content guidelines

Sketchbook gives teams a first draft of a design system they can make their own. Write like a practical collaborator. Help readers make a choice, see what it changes, and check the result.

## Voice and tone

- **Direct.** Speak to the reader as “you.” Start with their goal or action. Introduce a command, file, or internal term when it helps them do something.
- **Warm through attention.** Use familiar words and realistic examples. Anticipate the point where someone might hesitate, then show what to expect or how to recover.
- **Specific about consequences.** Say what a command writes, what a check catches, or what an example demonstrates. Put limits beside the claim or step they affect. Date historical results and link to the evidence.
- **Calm when something fails.** Name what happened and give the reader a next action. Use warnings where a choice could remove work or produce a surprising result.

## Choose the form that serves the reader

| Reader need | Use |
| --- | --- |
| Make a choice | Compare the options on the criteria that matter. Put the common starting point first. |
| Complete a task | Use ordered steps. Put prerequisites before the step they affect and show how to verify the result. |
| Understand a relationship | Explain it in prose. Use a diagram if it helps readers follow the relationship, and give it a caption that names what to notice. |
| Look up an exact value | Use a table or an example from the canonical source. Keep names, syntax, and defaults exact. |
| See how something behaves | Give a concrete thing to try or notice. Keep the live example and its code close together. |
| Assess a claim | Give the result, the conditions it was measured under, and a link to the record. Keep setup and test procedure in the record unless they affect a reader’s decision. |

A guide can lead with a command, a concept with a diagram, and a demo with an interaction. They feel like Sketchbook when each helps the reader predict or check what happens.

## Words to use

- **Sketchbook** is the product. **Sketchbook CLI** is the command-line tool. **Harness** refers to the tools that read your sources, generate outputs, and run checks. Explain it on first use for a general audience.
- **Source** is a file your team owns and edits. **Generated output** is what Sketchbook rebuilds from it. Name the relevant file when readers need to act.
- **Foundation tokens** hold values. **Semantic tokens** name how values are used. **Component tokens** bind those roles to a component.
- **Agent profile** is what you select with `--agent`. Use **project guidance** for instructions and **hook** for a client integration that runs at a tool or workflow event. Use **check** for a deterministic Sketchbook verification.
- Use sentence case for headings, links, and controls. Format literal commands, flags, paths, and API identifiers as code. Use the same name for the same thing across Docs, UI, and examples.

## Examples

- **Setup.** “Preview the files Sketchbook will add with `--dry-run`. Run the command again without that flag to set up the project.”
- **Agent guidance.** “Add an agent profile when you want project guidance for the coding tools your team uses. Run `npx sketchbook doctor` to see what Sketchbook finds on disk, then check that your client loaded it.”
- **Interactive example.** “Open Activity with the arrow keys. The active panel follows the selected tab.”
- **Evidence.** “In the November 2026 benchmark, 9 of 10 runs produced a valid contract with project files alone. The test used one component and 10 runs per condition.”

## Terminal copy

- Put the result first. Give readers the path, value, or check ID they need to act on, followed by a next step when there is one.
- Put the effect of pressing Enter next to the prompt. Before confirmation, show the exact command and what its preview found.
- Give short help a usage line and a runnable example. Use detailed help for the full option list. Write the command description once, where the CLI and generated reference can both use it.
- Preserve the machine-readable payload when editing human-facing copy. Check the result in a terminal, with color turned off, and in a pipe.

## Before publishing

- Can the reader tell what the page helps them do or understand?
- Can they find the next action, expected result, and important limits where they need them?
- Does each table, visual, example, and link have a job?
- Are names and behavior accurate? Do current claims come from current sources, and historical claims carry dates and evidence?
- Did you edit the source that owns the wording and regenerate any published copies?
