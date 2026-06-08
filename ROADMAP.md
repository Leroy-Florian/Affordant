# Roadmap

**English** · [Français](ROADMAP.fr.md)

Affordant is **affordance-first**: the server declares the actions a caller may take, and the presence of a rel in the `_actions` envelope *is* the permission. The client never re-derives authorization — it renders off what the server offered. This roadmap is organized around keeping that principle sharp while the contract, the clients, and the adapters grow.

This roadmap is **indicative, not committed**. It captures the direction we'd like to go and the order that makes sense; priorities will shift with real usage and feedback. Items are grouped by theme, not by deadline. Contributions toward any of these are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Contract evolution

The wire contract (`@affordant/contract`) is the single source of truth both sides depend on. Every change here ripples to client and server, so it moves deliberately.

- [ ] Action `title` and human-readable `labels` so a client can render a button without hard-coding copy.
- [ ] Input `fields` on actions (HAL-Forms–style) to describe the body an action expects.
- [ ] URI templates (RFC 6570) for parameterized hrefs, expanded client-side.
- [ ] Collection envelope: a typed shape for lists, plus a pagination envelope (next/prev/first/last as affordances).
- [ ] Problem-details error envelope (`application/problem+json`, RFC 9457) as the canonical error shape.

## Client

The vanilla `affordant` client and its job of gating UI on affordances and following them safely.

- [ ] Typed `followJson` with first-class error handling (distinguish transport, HTTP, and problem-details errors).
- [ ] A refresh helper to re-fetch a resource and its affordances after a mutation.
- [ ] TanStack Query and SWR recipes (cache keys from `_self`, invalidation from followed actions).
- [ ] Typed `rel` unions so `can(resource, rel)` is checked against the resource's declared rels.

## Server

The `@affordant/server` builder that emits the envelope.

- [ ] `when` as a function and as `async` (predicate may need a lookup before deciding).
- [ ] A collection builder that wraps items in the collection + pagination envelope.
- [ ] Propagate `title` and input `fields` from the builder through to the wire.

## Framework adapters

Symmetric adapters so the contract feels native on each stack.

- [ ] Vue adapter (client) — affordance-gated rendering and a follow composable.
- [ ] Fastify adapter (server).
- [ ] Hono adapter (server).
- [ ] NestJS adapter (server).
- [ ] Next.js route-handler adapter (server, App Router).

## DX & tooling

- [ ] OpenAPI generation from the contract (or contract generation from OpenAPI) so existing toolchains can consume affordances.
- [ ] A devtools / inspector to visualize the affordances on a response.
- [ ] Test utilities and mock factories for building envelopes in tests on both sides.

## Project & quality

- [ ] Publish to npm with a version badge in the READMEs.
- [ ] Bundle-size budget enforced in CI (the client and contract stay tiny by design).
- [ ] `CONTRIBUTING` plus issue and PR templates (this PR), kept current as the project grows.

## Suggested sequencing

Three loose waves — the order reflects what unblocks the most downstream work, not fixed dates.

1. **Contract foundation.** Action `title`/`labels`, input `fields`, the collection + pagination envelope, and the problem-details error shape. These are the wire changes everything else builds on.
2. **Make it ergonomic.** Typed `followJson` and error handling, typed `rel` unions, the server collection builder and field propagation, and the TanStack Query / SWR recipes.
3. **Reach.** Framework adapters (Vue, Fastify, Hono, NestJS, Next.js), OpenAPI interop, devtools, and the npm publish + bundle-size budget.
