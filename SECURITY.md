# Security policy

## Report a vulnerability

Send security reports privately to the repository maintainer, [@Davecelot](https://github.com/Davecelot), through a private channel you already use with them. If you need contact details, open a [repository issue](https://github.com/Davecelot/sketchbook/issues) asking for a private reporting channel. Keep vulnerability details and attachments out of the issue.

Include the Sketchbook version and commit SHA, the affected command or component, your environment, and the impact you observed. Share the smallest useful example through the private channel and redact credentials, private design data, and customer information. Keep details private while the maintainer reviews the report and coordinates disclosure with you.

## Supported code

Security fixes target the current default branch, `main`. If you installed from a tarball, include the source commit if you have it. Tarballs built from different commits can share a version number.

This policy covers Sketchbook's CLI, generators, starter and upgrade flows, bundled agent hooks, reference components, and docs site. For a flaw in a dependency or external service, use that project's security policy. If Sketchbook's integration exposes or amplifies the issue, report that impact here as well.

## How Sketchbook runs

- **CLI and local files.** Sketchbook runs with the permissions of the process that starts it. Commands can read project inputs and write files. Init can install npm dependencies and Chromium. Use trusted engine packages and review an upgrade's dry run before approving writes.
- **Coding agents and hooks.** The agent client controls workspace trust, tool permissions, and which hooks run. Sketchbook hooks guard selected edit operations, and coverage varies by client. See the [agent compatibility map](./docs/agent-compatibility.md).
- **Figma sync.** The optional Figma integration generates scripts locally. Your Figma connection supplies the permissions used to run them against the configured file. Review the target and scripts before running them, and treat generated scripts and read-back files as project data. See [Figma sync](https://sketchbook-docs.vercel.app/concepts/design-file/).
