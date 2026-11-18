# Component specifications

This project had no existing spec format or spec validation when the first
spec (Switch) was written, so this file defines the convention. Later specs
should follow it.

## Layout

```
specs/
  README.md                 ← this file (format definition)
  <component>/
    spec.md                 ← normative specification
    acceptance.md           ← acceptance scenarios, traced to requirements
    decisions.md            ← open questions, options, the chosen answer, rationale
```

## Rules

1. **Requirement IDs.** Every normative statement in `spec.md` is a list item
   that starts with a bold ID: `**<PREFIX>-<AREA>-<NN>**`, e.g. `**SW-FORM-03**`.
   IDs are never reused or renumbered. Retired requirements are struck through and kept.
2. **Keywords.** MUST / MUST NOT / SHOULD / MAY follow RFC 2119 meaning.
   Text outside requirement items is informative.
3. **Traceability.** Every scenario in `acceptance.md` has an ID (`AC-<NN>`)
   and a `Covers:` line listing the requirement IDs it verifies. Every
   requirement in `spec.md` MUST be covered by at least one scenario, and every
   ID referenced in `Covers:` MUST exist in `spec.md`.
4. **Decisions.** Each decision in `decisions.md` has an ID (`D-<NN>`), the
   question, the options considered, the choice, and the rationale. Requirements
   that follow from a decision cite it, e.g. `(see D-04)`.
5. **No implementation.** Specs describe the public contract and observable
   behaviour. Implementation notes are allowed only in sections marked
   *Non-normative*.
