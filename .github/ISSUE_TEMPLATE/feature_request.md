---
name: Feature request
about: Suggest an idea or improvement
title: "[Feature] "
labels: enhancement
assignees: ''
---

## The problem

What are you trying to do that Affordant makes hard or impossible today? Describe the use case, not just the solution.

## Which package would this touch

- [ ] `@affordant/contract`
- [ ] `affordant` (client)
- [ ] `@affordant/react`
- [ ] `@affordant/server`
- [ ] `@affordant/express`
- [ ] A new framework adapter
- [ ] DX / tooling

## Does it touch the wire contract?

- [ ] Yes — it changes or extends the `_self` / `_actions` envelope shape
- [ ] No — it's client- or server-side ergonomics only
- [ ] Not sure

> Contract changes affect both sides of the wire and are the most load-bearing part of the repo, so they get extra scrutiny. If yes, sketch the proposed envelope shape below.

## Proposed shape / API

```ts
// what you'd like to write
```

## Alternatives considered

Anything you tried or ruled out.

## Roadmap

Is this already on the [Roadmap](../../ROADMAP.md)? Link it if so.
