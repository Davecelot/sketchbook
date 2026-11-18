# Secure Contributing Checklist

Short on purpose. If it's long, nobody reads it before pushing.

## Before you commit

- [ ] No secrets in the diff: API keys, tokens, passwords, private keys,
      `.env` files with real values. Run
      `git diff --cached -U0 | grep -nEi '(api[_-]?key|secret|token|password|private[_-]?key)\s*[:=]'`
      if unsure.
- [ ] No personal access tokens or internal URLs hard-coded into source,
      scripts, stories, contracts or config: use environment variables or a
      placeholder instead. Registry and design-tool tokens live in your user
      config (`~/.npmrc`, the tool's own login), never in the repo.
- [ ] `.env*` files stay untracked (don't force-add one with `git add -f`).

## Before you add or upgrade a dependency

- [ ] Check the package is actively maintained (recent releases, not a
      single maintainer with no commits in 2+ years) before adding it.
- [ ] Run `npm audit` after adding: resolve or explicitly accept any
      critical/high advisory before merging (note the acceptance and why in
      the PR description).
- [ ] Check a package's install scripts before installing it:
      `preinstall`/`postinstall` scripts run arbitrary code.
- [ ] Commit the updated `package-lock.json` in the same PR as the manifest
      change; never let them drift.
- [ ] Never vendor a dependency's source into this repo to "avoid the
      audit": that hides it from every future scan.

## Rendering content

- [ ] No `innerHTML` / `unsafeHTML` with data you don't control: render text
      through lit-html's default escaping.
- [ ] External links opened in a new tab use `rel="noopener noreferrer"`.

## Reviewing a PR (maintainers)

- [ ] Run `security-guardian` (or
      `bash .claude/skills/security-guardian/scripts/security-scan.sh --branch`)
      against the branch before approving.
- [ ] Any change to `.claude/settings*.json`, `.claude/hooks/`,
      `.githooks/`, `.github/workflows/` or the project template's
      `.claude/settings.json` gets read in full: these control what tools,
      permissions and gates agents, git and CI have. A one-line diff here can
      silently widen access.
- [ ] Any new external URL fetched by a script or CI config is a URL you
      recognize, not one introduced by the PR's own author pointing
      somewhere unfamiliar.
- [ ] Don't force-push over another contributor's branch without asking.

## If a secret was already committed

Don't just delete it in a new commit: it's still in git history.

1. Rotate or revoke the credential immediately (assume it's compromised the
   moment it hit a commit, even if the repo is private).
2. Then decide with the owner whether history needs rewriting
   (`git filter-repo` / BFG). That is a destructive, hard-to-reverse
   operation on shared history and needs explicit confirmation before
   anyone runs it, especially on a branch others have already pulled.

## Why this exists

This library ships to the apps that consume it: a compromised dependency or
a leaked token here has a blast radius beyond this repo. The checklist is
deliberately cheap so it actually gets run.
