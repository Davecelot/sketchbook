# Component task board pilot

On November 25, 2026, we tested the opt-in board from a locally packed Sketchbook 0.7.0 candidate in disposable projects under `sketchbook-test`. The board made blocked handoffs easier to inspect and helped track which reviews had to be repeated when evidence changed. These trials did not show that it saved time or improved review consistently.

## Gate and browser tests

| Case | Observed result |
| --- | --- |
| New Action Toolbar draft | A live author stopped at `stage: plan` without writing stories, tests, or implementation. The first draft used an unregistered prop and needed generated outputs rebuilt. After narrowing the draft and regenerating, `sketchbook check` passed. The CLI still refused red before human approval and wrote nothing. |
| Dialog autofocus replay | With the existing approval and the contract and plan body unchanged, a seeded regression focused the wrong field: red failed 1 of 62 tests. Restoring the implementation passed all 62. After a further source edit, `evidence ready --dry-run` rejected the stale green record and wrote nothing. |
| Review without a delegate | The solo Dialog and Tabs reviews reported that independent review was pending. |
| Installed browser suite | All 84 Chromium behavior tests for Dialog and Tabs passed against the installed project's Storybook build. This was not a live assistive-technology audit. |

The first board combined browser and accessibility checks in one row. Reviewers could close it after only the browser review. The revised template separates independently verifiable work and says not to copy board rows into `plan.md`. In the resume exercise, the agent could not find the boards by filename alone. Given the shared paths and CLI results, it correctly distinguished pending human approval from stale green evidence.

## Live review comparison

Claude Code 2.1.332, `claude-sonnet-5-5`, low effort. One trial per condition and component in the matched rerun. Each parallel trial used the same two independent, read-only reviewer roles, component inputs and Chromium log. The reviewers read the log rather than rerunning Chromium. The exploratory solo trials used the same model and log, but ran before the template revision.

| Scope | Solo, exploratory | Two reviewers | Two reviewers with board |
| --- | ---: | ---: | ---: |
| Dialog focus | 28.5 s / $0.196 | 46.1 s / $0.269 | 42.5 s / $0.289 |
| Tabs keyboard and naming | 28.5 s / $0.123 | 39.4 s / $0.235 | 39.2 s / $0.252 |

Both parallel setups raised Dialog focus coverage gaps. The revised Tabs board run flagged a stale contract answer naming the `value-change` event even though the public API and tests use `change`; the matched no-board run did not mention it. A separate Chromium probe confirmed that an invalid Tabs value set after mount hides every panel instead of falling back. That issue was reported in the exploratory solo and board runs, so it is not a board-only finding. Neither issue was fixed in the pilot.

The board cost about 7% more in both matched pairs, and neither timing difference establishes a speed gain. We did not measure a person's coordination time or test repeated claims across sessions, multiple clients, or a formal Review Rangers verdict.

## From-scratch component follow-up

In a separate project, the Action Toolbar started from a blank scaffold without reusing the earlier draft. A person approved the new contract before any stories, tests, or code were written. The final red run failed 9 of 10 toolbar tests as expected; green passed all 10 with the same spec and test inputs. The full fixture passed 122 Chromium tests (including an alternate-brand Button test), lint, typechecking, and all 28 Sketchbook checks.

After the first keyboard/focus and contract/API reviews, adding stored accessibility-tree views around a keypress changed the test inputs. The CLI refused readiness without writes, and the snapshot check rejected the old inputs. The board kept the previous reports marked stale, assigned both reviews against the refreshed snapshot, and linked their new reports. Both found no blocker within their scope. The CLI then recorded `stage: ready`; the registry remained `draft`. This was not a cross-browser or live assistive-technology audit.

## Decision

Keep the Markdown board **opt-in** for complex component work with independent reviews or handoffs across sessions. To use it, ask your coding agent to use the shared task board for the component. Keep routine edits on the existing single-agent workflow. The CLI enforces the gates, Review Rangers owns formal review when warranted, and the board records ownership and evidence.

Do not add a CLI workflow or automated task queue from these results. Revisit a read-only status view if reconstructing the next step becomes recurring work. Consider automated claiming only if duplicate or abandoned assignments become a recurring problem.
