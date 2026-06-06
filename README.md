# Affordant

**Affordance-first hypermedia (HATEOAS), both sides of the wire.** Stop re-implementing your authorization rules in the frontend — let the actions the server offers drive your UI, and let the server declare those actions once.

The server enriches each response with `_self` and `_actions`; the **presence of a rel encodes permission**. The client renders a button off the *presence* of the link — it never re-derives "can this user do X?".

```jsonc
// GET /orders/8f3a2c — the order's owner
{
  "id": "8f3a2c",
  "status": "pending",
  "_self":    { "href": "/orders/8f3a2c", "method": "GET" },
  "_actions": {
    "track":  { "href": "/orders/8f3a2c/tracking", "method": "GET" },
    "cancel": { "href": "/orders/8f3a2c/cancel",   "method": "POST" }
  }
}
```

Anyone who isn't the owner simply doesn't get the `cancel` link — and the frontend's cancel button vanishes, with no deploy.

## The packages

This repo is an npm-workspaces monorepo. One shared contract, symmetric on each side of the wire:

| Package | Side | What it does |
|---|---|---|
| [`@affordant/contract`](packages/contract) | shared | The wire-contract types. Zero runtime, zero deps. Everything else depends on it. |
| [`affordant`](packages/client) | client | `can` / `actionFor` / `follow` — gate UI on what the server offers. Zero deps. The vanilla (Promise) invoker. |
| [`@affordant/effect`](packages/effect) | client | The [Effect](https://effect.website)-flavoured invoker: `follow` as an `Effect` with a typed error channel. |
| [`@affordant/react`](packages/react) | client | React adapter: gate UI on affordances and invoke them with **either** invoker (Promise or Effect). |
| [`@affordant/server`](packages/server) | server | A builder that emits the `_self` / `_actions` envelope. Framework-agnostic. |
| [`@affordant/express`](packages/express) | server | Express adapter: send the envelope and build URLs from the request. |

Plus one **domain-agnostic** package that lives here for convenience but is coupled to React + Effect, not to the wire contract:

| Package | Side | What it does |
|---|---|---|
| [`effect-react-bridge`](packages/effect-react-bridge) | client | Run Effect programs inside React (query / imperative hooks + `RemoteData`). No hypermedia, no Affordant coupling. |

```
                 ┌─ @affordant/contract (shared wire types) ─┐
                 │                                           │
   @affordant/server  ──builds──►  _self / _actions  ──reads──►  affordant
        │                                                          │
   @affordant/express                                        (React / Vue / … )
```

The `build()` on the server produces exactly what `can()` consumes on the client — one contract, never two implementations to keep in sync.

## Client, in one glance

```ts
import { can, actionFor, follow } from 'affordant'

if (can(order, 'cancel')) {
  await follow(actionFor(order, 'cancel')!, { token, body: { reason: 'changed my mind' } })
}
```

## Server, in one glance

```ts
import { resource } from '@affordant/server'

resource(order)
  .self(route('orders.show', order.id))
  .action('track', route('orders.tracking', order.id))
  .action('cancel', route('orders.cancel', order.id), {
    method: 'POST',
    when: caller.id === order.ownerId && order.status !== 'shipped', // absent ⇒ no permission
  })
  .build()
```

The `when` predicate *is* the authorization: when it's false, the rel is never emitted, so `can(order, 'cancel')` returns false on the client.

## Two orthogonal axes on the client

Consuming an affordance has two independent choices: the **UI framework** (React, …) and the **effect system** (vanilla `Promise` or `Effect`). They compose instead of multiplying — everything pure (`can`, `actionFor`, the server builder) is effect-agnostic by construction, so the only seam is the invoker:

```ts
// the invoker is the single point of variation
type Invoker<F> = (action: HateoasAction, init?: FollowInit) => F
// affordant       → Invoker<Promise<Response>>
// @affordant/effect → Invoker<Effect<Response, FollowError>>
```

`@affordant/react` is built against that seam: `useFollow` from `@affordant/react` uses the Promise invoker; `makeAffordanceHooks` from `@affordant/react/effect` runs the Effect invoker through the [`effect-react-bridge`](packages/effect-react-bridge) runtime. The bridge stays generic — it knows nothing about hypermedia.

## A package belongs here iff it is coupled to the wire contract

That single rule decides membership. `@affordant/effect` and `@affordant/react` depend on the contract → they live in the family. `effect-react-bridge` depends on React + Effect but **not** the contract → it is an independent publication that merely shares this workspace.

## Develop

```sh
npm install        # installs all workspaces
npm run build      # builds every package (contract first)
npm test           # runs every package's tests
npm run typecheck  # type-checks every package
npm test           # unit tests + end-to-end demo suites
npm run demo       # boot the live demo server (see demo/)
npm run smoke      # verify the published npm artifacts (see smoke/)
```

The [`demo/`](demo) package is a real Express server consumed over HTTP by the vanilla client, the Effect invoker, and the React adapter — the E2E suites assert the whole contract across all seven packages. [`smoke/`](smoke) does the same against the **published** packages, not the workspace sources. CI runs build + typecheck + tests on every PR ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Releasing

Publishing to npm is automated with [Changesets](https://github.com/changesets/changesets) on push to `main` (see [`.github/workflows/release.yml`](.github/workflows/release.yml)):

1. In your PR, run `npm run changeset`, pick the affected packages and a bump level, and commit the generated `.changeset/*.md`.
2. Merging to `main` opens a **Version Packages** PR that bumps versions and writes changelogs, propagating bumps across internal dependencies.
3. Merging that PR builds every package and runs `changeset publish` — releasing the new versions to npm in dependency order, with provenance.

The first run on `main` with no pending changesets publishes the current `0.1.0` of every public package. Requires an `NPM_TOKEN` repository secret and ownership of the `@affordant` npm scope.

## Roadmap

Each side grows by **declinations**, every one its own package so the cores stay dependency-free:

- client: Vue composables, Svelte stores, more invokers, …
- server: more framework adapters (Fastify, Nest, Hono, …).

## License

MIT
