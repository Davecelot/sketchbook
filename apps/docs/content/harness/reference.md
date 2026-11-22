---
title: "Harness reference"
description: "Look up IDs for rules, named workflows, and integration examples."
order: 30
---

To inspect any item before installing it, run `npx sketchbook harness show <item>` with an ID below. To see the full list in a terminal, run `npx sketchbook harness list --details`. If you’re looking for a skill, [browse by task](/harness/skills/).

## Rules

Rules describe project requirements. Installing one copies it to `.agents/sketchbook/`; ask your coding tool to read it before relying on it.

<!-- harness:rules -->

## Named workflows

These are instructions, not Sketchbook CLI subcommands. Read them from `.agents/sketchbook/` or use the equivalent native command if your tool has one configured. Run `npx sketchbook help` to find CLI commands.

<!-- harness:workflows -->

## Integration references

Installing these examples copies them to `docs/sketchbook-harness/`. It does not register a hook or change permissions. If you want native automation, see [agent compatibility](/concepts/agent-compatibility/) for supported profiles.

### Hooks

<!-- harness:hooks -->

### Client settings and instructions

<!-- harness:client-files -->

## Items included in a skill

Older IDs for a skill’s settings or review briefs still work with `npx sketchbook harness show <item>`, which tells you which skill includes them. Install that skill instead: `harness add` won’t accept those IDs on their own.
