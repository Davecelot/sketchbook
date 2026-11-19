# Contributing to Sketchbook

Use Node.js 26.13.1 LTS and npm 12.2.3 for development and builds. If you use an older LTS line, use Node.js 24.22.3 or 22.23.5, or a newer security patch on that line. [Node.js security releases](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases)

After selecting Node.js with your version manager, run `npm install --global npm@12.2.3`. Check `node -v` and `npm -v`, then run `npm ci` from the repository root.

## Repository map

| Area | Where to work |
| --- | --- |
| Engine and CLI | [`harness/`](./harness/) holds the CLI, checks, generators, adapters, catalog, starter templates, and harness tests. [`scripts/`](./scripts/) holds shared build and verification entry points. |
| Reference design system | [`src/`](./src/) holds components and patterns. [`spec/`](./spec/) holds contracts, semantic tokens, and decisions. [`brand.config.json`](./brand.config.json) selects foundations and [`brand/`](./brand/) holds brand assets. |
| Reference previews and tests | [`.storybook/`](./.storybook/) configures preview stories. [`playwright/`](./playwright/) holds browser tests and accessibility snapshots. |
| Public docs | [`apps/docs/content/`](./apps/docs/content/) holds pages, examples, and assets. [`apps/docs/scripts/`](./apps/docs/scripts/) builds the demo pages and static site. |
| Repository docs | [`docs/`](./docs/README.md) indexes guides, references, audits, and research. |
| Agent guidance | [`AGENTS.md`](./AGENTS.md) points to the shared workflows. [`.claude/`](./.claude/) holds the Claude Code integration. Project templates in `harness/templates/project/` supply the instructions and hooks installed by init. |

The npm tarball ships the engine and the reference library together. The [public docs site](https://sketchbook-docs.vercel.app/) deploys from `site-dist/`.

## Sources and generated files

- Edit `brand.config.json`, semantic token sources, and component contracts to change the reference system. For component work, follow the [shared agent workflows](./harness/templates/project/AGENT-WORKFLOWS.md).
- Edit `.mts` sources and run `npm run build:harness` to compile their adjacent `.mjs` outputs. Use `npm run generate` to rebuild generated CSS, styles, types, and the CLI reference.
- Edit curated live examples in `apps/docs/content/_examples/`. Run `npm run docs:components` to regenerate the component pages from the examples and contracts. Use `npm run docs:build` and `npm run docs:serve` to preview the whole site.

## Verify a change

| Command | What it runs |
| --- | --- |
| `npm run sketchbook -- help` | The CLI from this checkout |
| `npm run check`, `npm run test:harness` | Deterministic checks and harness tests |
| `npm run typecheck`, `npm run typecheck:harness`, `npm run lint` | Types and lint |
| `npm run storybook` | The reference library preview |
| `npm run test:install`, `npm run test:component` | Install Chromium once, then run behavior tests |
| `npm run sketchbook -- propagate --maintainer`, `npm run check:maintainer` | Rebuild and verify maintainer outputs, including the docs site |
| `npm run verify` | The full pre-merge gate on a clean candidate |

Review generated diffs alongside their sources. If a change affects a file pinned in the starter skeleton, use `npm run test:reference-sync` and review the template diff as well.
