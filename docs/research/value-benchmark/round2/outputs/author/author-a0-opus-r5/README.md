# Component specifications

This directory holds the behavioural specifications for UI components. Each component has its own folder:

```
specs/<component>/
  spec.md         Normative requirements (what the component MUST/SHOULD do)
  acceptance.md   Testable acceptance scenarios, each linked to requirement IDs
  decisions.md    Open questions, the option chosen, and why
```

## Conventions

- The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** are used as described in RFC 2119.
- Every requirement has a stable ID in the form `<PREFIX>-<AREA>-<NN>` (e.g. `SW-FORM-03`). IDs are never reused or renumbered. Retired requirements stay in the file and are marked *Withdrawn*.
- Every acceptance scenario has an ID (`AC-<NN>`) and lists the requirement IDs it covers. Every requirement MUST be covered by at least one scenario.
- Decisions are numbered `D-<NN>`. Requirements that depend on a decision refer to it.
- A spec is framework-neutral unless a decision says otherwise. It describes observable behaviour (DOM, accessibility tree, form data, events), not implementation.

The project has no automated spec validation yet. Check the coverage rule above by hand when you edit a spec.

## Index

| Component | Status | Folder |
|-----------|--------|--------|
| Switch    | Draft v1 (ready for implementation) | [switch/](switch/) |
