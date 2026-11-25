# Shared component task board

Copy the board section below to a fresh shared scratch location outside tracked project files. Share its path with participants. Use it only when requested. Keep `plan.md` for the planned scope and existing `stage`, `next`, and `blocker` fields; do not copy board rows into it.

## How to run the pilot

1. **Keep one editor for the board and one owner for component writes.** The coordinator records claims, progress and blockers. Participants report back without editing the board. Only the implementation owner changes the component, its stories and tests in an implementation pass. A proposal for more work is not authorization: ask the person before expanding the approved scope.
2. **Follow the existing gates.** Link to the contract, plan and CLI evidence instead of copying their status. When the gates are enabled, wait for human approval before writing tests or code, record the intended red failure before implementation, then record green with the same test setup. The board cannot move any of these gates.
3. **Parallelize only independent verification.** After green (or the applicable verification when test-first is off), pin a snapshot: a commit with no changes to reviewed inputs, a read-only copy, or a fingerprint of the reviewed inputs including any uncommitted files. Assign distinct read-only scopes, such as keyboard behavior and contract/API parity. Share task status, not draft conclusions; collect findings separately and link them after independent submissions. Delegate only if supported and authorized. Otherwise record actual self-checks and keep any required independent review `blocked`. Use `review-rangers` when formal review is warranted; link its verdict without substituting board status for it.
4. **Check before closing.** Verify the snapshot before accepting results. Split work that can be checked independently into separate rows: for example, a finished keyboard review does not close a pending assistive-technology review. If reviewed inputs change, reopen affected tasks, retain the prior links as stale, and obtain current evidence before closing them again. Keep useful failed attempts with a short explanation and evidence link so the next participant does not have to repeat them. Report unresolved work and use the existing readiness and promotion workflow.

## Board

- Component and approved scope:
- Coordinator and implementation owner:
- Contract, plan and CLI evidence paths:
- Review snapshot and how to verify it:

| Task | Owner | Status | Dependency or blocker | Evidence link |
| --- | --- | --- | --- | --- |
| Confirm contract and plan | — | open | Human approval when required | — |
| Capture expected red, implement, then capture green | — | open | Approved scope when required | — |
| Verify browser keyboard and focus behavior | — | open | Stable review snapshot | — |
| Verify contract and API parity | — | open | Same review snapshot | — |

Status values: `open` (unclaimed), `claimed` (assigned), `blocked` (cannot proceed; say why), `done` (result recorded, not necessarily a pass). Remove example rows that do not apply.

### Proposed follow-ups and failed attempts

- Note the task or attempt, why it matters, and what evidence a person can inspect.
