---
name: Bug report
about: Report something that doesn't behave as documented
title: "[Bug] "
labels: bug
assignees: ''
---

## What happened

A clear, concise description of the bug.

## Which package

- [ ] `@affordant/contract`
- [ ] `affordant` (client)
- [ ] `@affordant/react`
- [ ] `@affordant/server`
- [ ] `@affordant/express`
- [ ] demo / smoke / tooling

Version(s): <!-- e.g. affordant@0.1.0 -->

## Does it involve the wire contract?

- [ ] The `_self` / `_actions` envelope looks wrong, or a rel is present/absent when it shouldn't be
- [ ] Not sure
- [ ] No, purely client- or server-side behavior

## Reproduction

Steps, or ideally a minimal snippet. The envelope and the relevant `can` / `build` call are the most useful things to include.

```ts
// minimal repro
```

If a wire issue, paste the JSON envelope the server emitted.

```jsonc
// response body
```

## Expected vs actual

**Expected:**

**Actual:**

## Environment

- Node version:
- OS:
- Framework / adapter (if any):
