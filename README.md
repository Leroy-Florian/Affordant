# Affordant

**English** · [Français](README.fr.md)

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
| [`affordant`](packages/client) | client | `can` / `actionFor` / `follow` — gate UI on what the server offers. Zero runtime deps. |
| [`@affordant/react`](packages/react) | client | React adapter: gate UI on affordances and follow them with hooks. |
| [`@affordant/server`](packages/server) | server | A builder that emits the `_self` / `_actions` envelope. Framework-agnostic. |
| [`@affordant/express`](packages/express) | server | Express adapter: send the envelope and build URLs from the request. |

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

## Using Effect

`follow` is a plain promise-returning function, so it drops into [Effect](https://effect.website) — or any effect system — with a one-line wrap: `Effect.tryPromise(() => follow(action, init))`. Affordant stays **Effect-compatible without shipping an Effect dependency**; the interop is yours to add when you want it.

## Develop

```sh
npm install        # installs all workspaces
npm run build      # builds every package (contract first)
npm run typecheck  # type-checks every package
npm test           # unit tests + the demo E2E matrix
npm run demo       # one command: both backends + the web fronts + a status dashboard
npm run e2e        # browser E2E (Playwright)
npm run smoke      # verify the published npm artifacts (see smoke/)
```

The [`demo/`](demo) package proves the contract across **two backends** (Express and pure-Node) × **two fronts** (vanilla JS and React): the E2E matrix and the Playwright specs assert it over real HTTP and a real browser. [`smoke/`](smoke) does the same against the **published** packages, not the workspace sources. CI runs build + typecheck + tests on every PR ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)); the browser E2E runs in [`e2e.yml`](.github/workflows/e2e.yml).

## License

MIT
