# Contributing to Affordant

Thanks for your interest in Affordant. This guide covers how the repo is laid out, the commands you'll run, and the conventions a pull request should follow. For where the project is headed, see the [Roadmap](ROADMAP.md).

## The wire contract is the source of truth

`@affordant/contract` holds the wire-contract types — zero runtime, zero dependencies. **Both sides of the wire depend on it**: the server builds the `_self` / `_actions` envelope from it, and the client reads that envelope back. There is one contract, never two implementations to keep in sync.

A consequence for contributors: a change to the contract is a change to *everyone*. Treat `packages/contract` as the most load-bearing part of the repo. Land a contract change with the client and server changes that consume it, and keep the demo and smoke checks green.

## Repository layout

This is an npm-workspaces monorepo.

| Path | What it is |
|---|---|
| `packages/contract` (`@affordant/contract`) | Shared wire-contract types. Everything depends on it. |
| `packages/client` (`affordant`) | Vanilla client: `can` / `actionFor` / `follow`. |
| `packages/react` (`@affordant/react`) | React adapter. |
| `packages/server` (`@affordant/server`) | Framework-agnostic envelope builder. |
| `packages/express` (`@affordant/express`) | Express adapter. |
| `demo/` | Proves the contract across two backends × two fronts (E2E + Playwright). |
| `smoke/` | Verifies the **published** npm artifacts, not the workspace sources. |

## Development commands

```sh
npm install        # installs all workspaces
npm run build      # builds every package (contract first)
npm run typecheck  # type-checks every package
npm test           # unit tests + the demo E2E matrix
npm run demo       # both backends + the web fronts + a status dashboard
npm run e2e        # browser E2E (Playwright)
npm run smoke      # verify the published npm artifacts
```

Before opening a PR, make sure `npm run build`, `npm run typecheck`, and `npm test` all pass.

## Changesets

Releases are managed with [Changesets](https://github.com/changesets/changesets). If your change affects any published package, add a changeset describing it:

```sh
npm run changeset
```

Pick the affected packages and the bump type (patch / minor / major), write a short, user-facing summary, and commit the generated file under `.changeset/` with your change. Docs-only changes (like this guide) don't need a changeset.

## Branch & PR conventions

- Branch off `main`. Use a descriptive prefix, e.g. `feat/`, `fix/`, `docs/`, `chore/`.
- Keep a PR focused on one thing. A contract change plus its consumers is one thing; unrelated refactors are not.
- Write commit messages in the imperative mood (`add collection envelope`, not `added`).
- **Docs are bilingual.** If you touch user-facing docs, update both the English and French versions (`README.md` / `README.fr.md`, `ROADMAP.md` / `ROADMAP.fr.md`).
- Fill in the PR template checklist: tests, bilingual docs, changeset, and a green build + typecheck + test.

CI runs build + typecheck + tests on every PR (`.github/workflows/ci.yml`); the browser E2E runs in `e2e.yml`.

## Questions

Open an issue using one of the [templates](.github/ISSUE_TEMPLATE), or browse the [docs site](https://leroy-florian.github.io/Affordant/).
