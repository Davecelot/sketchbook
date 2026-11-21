---
name: component-builder
description: >
  Build a component from its approved contract using the shared Sketchbook
  workflow. Trigger: implementation after the planning gate; use the
  project's test-first, token, accessibility, and parity requirements.
metadata:
  author: sketchbook
  version: '1.3.0'
  changelog: Use the shared Agent Skill as the workflow; keep the same build requirements across clients; retain the Claude review brief here.
  auto-invoke: Building, implementing, or coding a component with an approved contract.
  allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, WebFetch, Agent]
---

# Component Builder

## When to use

Open the [shared component-builder skill](../../../.agents/skills/component-builder/SKILL.md) and follow it. It defines entry criteria, build order, validation and lifecycle requirements.

## Critical patterns

Use the local Claude rules and skills for task details when available, especially form-associated controls, browser testing, and Web Component conventions. For authorized independent parity review, launch the [parity-auditor](agents/parity-auditor.md) with the model and tools declared by the brief. Pass the component name and review the evidence in its report. Use the `a11y-checker` workflow for the separate audit before stable.

## Decision tree

- Missing contract, unresolved blocker or missing required approval: stop per the shared workflow.
- Testing or implementation: follow the shared workflow and use the client's Playwright or Web Component guidance as needed.
- Independent review unavailable: report what is pending; don't call a self-check an independent audit.

## Commands

Use the build and verification commands in the shared workflow. Use `npm run test:component -- tests/<name>` to focus the behavior run on one component.

## Resources

- [Shared component-builder skill](../../../.agents/skills/component-builder/SKILL.md)
- [Claude parity-auditor brief](agents/parity-auditor.md)
