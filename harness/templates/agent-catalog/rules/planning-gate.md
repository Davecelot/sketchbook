# Rule: planning gate (features.planningGate = true)

Before writing component code for `add <component>`:
1. Draft or update `contract.json` and `contract.md` (harness contract format; UI and API from shadcn/ui); run `npm run check` until it passes.
2. Write `spec/components/<name>/plan.md`: scope, files, tokens, accessibility approach, test plan (test-first), risks, open questions with a recommendation first.
3. Stop and ask for approval. Write tests and code only after the person approves the plan or answers its questions; record the answers in the contract's `openQuestions` and in the plan.
4. Only a person approves: they run `sketchbook approve <name> --by <their name>`, or tell you to run it with their name. Never run it on your own judgment. It records digests of the contract and plan in the plan's frontmatter; check C4 fails when either changes in scope. Recorded token renames and prefix changes carry by themselves; for a wording-only change, run the contract-author skill's change-triage brief (`sketchbook approve <name> --diff` shows the class); a material change goes back to the person.
5. The frontmatter is the handoff: `stage` (plan, test, implement, review, ready), `next` and `blocker`. Keep them current; a new session resumes from them.
