# Releasing Sketchbook

This runbook is for maintainers. Contributors don’t need to update the public changelog when they open a pull request.

## Update the public changelog

1. Write the notes in [GitHub Releases](https://github.com/Davecelot/sketchbook/releases). Follow the [content guidelines](./content-guidelines.md): lead with what changes for readers, link to any migration steps, and qualify claims with their limits or evidence. GitHub Releases is the source of truth for the notes.
2. Once the GitHub release and its matching [npm package version](https://www.npmjs.com/package/@usesketchbook/cli?activeTab=versions) are both public, run these commands from the repository root:

   ```sh
   npm run build:harness
   node apps/docs/scripts/sync-changelog.mjs
   ```

3. Review and commit the updated [changelog snapshot](../apps/docs/content/changelog/index.md). The next docs deployment picks up the change.

Run the same sync after editing published release notes. Regular docs builds read the checked-in snapshot without contacting GitHub or npm for release data.
