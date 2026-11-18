# Component specifications

Each component has a folder `specs/<component>/` with three Markdown files:

| File | Contents |
| --- | --- |
| `spec.md` | Purpose, anatomy, API, behaviour, and the normative **requirements** |
| `acceptance.md` | **Acceptance criteria** (Given / When / Then) that trace back to requirements |
| `decisions.md` | Open questions, the options considered, and the **decision** taken |

## Conventions

- **Requirements** are defined in `spec.md` as list items that start with a bold ID:
  `- **SW-FORM-01** The switch MUST …`. IDs are `<COMPONENT>-<AREA>-<NN>`.
  The keywords MUST, MUST NOT, SHOULD, and MAY are used as in RFC 2119.
- **Acceptance criteria** are `### AC-NN — title` headings in `acceptance.md`. Each one
  has a `Covers:` line listing the requirement IDs it verifies, followed by Given / When / Then.
- **Decisions** are `### D-NN — title` headings in `decisions.md`. Each one has a
  `**Decision:**` line. Other files cite them as `(D-NN)`.

## Validation

```sh
npm run validate:specs
```

`scripts/validate-specs.mjs` checks every component folder:

1. all three files exist;
2. requirement, acceptance-criterion, and decision IDs are unique;
3. every requirement is covered by at least one acceptance criterion;
4. every requirement ID cited in `Covers:` exists;
5. every acceptance criterion has a `Covers:` line and Given / When / Then steps;
6. every decision has a `**Decision:**` line;
7. every `D-NN` cited anywhere exists in `decisions.md`.
