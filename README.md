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
| [`affordant`](packages/client) | client | `can` / `actionFor` / `follow` — gate UI on what the server offers. Zero deps. |
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

## Develop

```sh
npm install        # installs all workspaces
npm run build      # builds every package (contract first)
npm test           # runs every package's tests
npm run typecheck  # type-checks every package
```

## Roadmap

Each side grows by **declinations**, every one its own package so the cores stay dependency-free:

- client: React hooks, Vue composables, …
- server: more framework adapters (Fastify, Nest, Hono, …).

## License

MIT
