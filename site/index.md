---
title: "Sketchbook"
description: "Build a design system from files you own. A CLI regenerates every output and checks keep them in step."
order: 0
layout: home
---

<div class="hero-actions">
<sb-button variant="tertiary" href="/start/quickstart/">Quickstart</sb-button>
<sb-button variant="tertiary" href="/concepts/how-it-works/">How it works</sb-button>
</div>

```terminal
npx sketchbook init --start library --dry-run
```

The package is not published yet; the [quickstart](/start/quickstart/) shows the `--engine` flag to use until it is.

## What you get

- **A spec you own.** Foundations in `brand.config.json`, semantic tokens and component contracts in `spec/`. Every output is rebuilt from them.
- **Checks that can fail.** <!-- stat:checks --> deterministic checks, including one maintainer-only check, with tests that show them failing on broken fixtures. The commit hook runs the standard checks.
- **A component library as one output.** <!-- stat:components --> components in [the demo](/demo/), a starting point you can edit or replace.
- **A CLI for all of it.** [Commands and options](/cli/overview/), generated from the code.
- **Agent guidance.** [Compatibility](/concepts/agent-compatibility/) explains the available instructions and client-specific hooks.
- **Honest numbers.** [Status](/reference/status/) is computed from the repository; [Evidence](/reference/evidence/) lists every study, including what did not work.

## Where to go next

- [Start a design system](/start/quickstart/): create a project, set your brand, run your first check.
- [Bring your tokens](/guides/import-tokens/): import DTCG, Tokens Studio or CSS variables as a reviewed proposal.
- [Evidence](/reference/evidence/): the studies, benchmarks and tests behind the system, including what did not work.
- [Add it to an app](/guides/adopt-in-app/): add the harness in its own folder, with one script in your package.json.
- [Troubleshooting](/guides/troubleshooting/): what a failing check or a silent Claude layer means.
- [Reference](/reference/): config files, contract format, checks, rules, glossary.
