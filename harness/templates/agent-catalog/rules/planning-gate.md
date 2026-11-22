# Rule: planning gate (features.planningGate = true)

Before writing component code for `add <component>`:
1. Draft or update `contract.json` and `contract.md` (harness contract format; UI and API from shadcn/ui); run `npm run check` until it passes.
2. Write `spec/components/<name>/plan.md`: scope, files, tokens, accessibility approach, test plan (test-first), risks, open questions with a recommendation first.
3. Stop and ask for approval. Write tests and code only after the person approves the plan or answers its questions; record the answers in the contract's `openQuestions` and in the plan.
