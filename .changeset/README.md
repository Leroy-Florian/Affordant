# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets). It holds the pending version intents for the packages in this monorepo.

## Releasing in three steps

1. **Add a changeset in your PR.** Run `npm run changeset`, pick the affected packages and a bump level (patch / minor / major), and write a one-line summary. Commit the generated `.changeset/*.md` file alongside your code.
2. **Merge your PR to `main`.** The release workflow opens (or updates) a **Version Packages** PR that bumps versions and writes changelogs — propagating bumps across internal dependencies (bump `@affordant/contract` and its dependents follow).
3. **Merge the Version Packages PR.** The workflow builds every package and runs `changeset publish` to push the new versions to npm, in dependency order.

The very first time this lands on `main` with `NPM_TOKEN` configured and no pending changesets, it publishes the current `0.1.0` of every public package.

See [`.github/workflows/release.yml`](../.github/workflows/release.yml).
