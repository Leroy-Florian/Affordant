# Server side

Affordant is symmetric. The client reads the `_self` / `_actions` envelope; the server emits it. Any backend — any language, any framework — that emits the envelope works, but in Node you don't have to hand-roll it: [`@affordant/server`](https://www.npmjs.com/package/@affordant/server) is the server-side mirror of the client.

Two rules make it worth the effort.

## 1. Link visibility is authorization

Only emit an action the caller may execute, decided **server-side, per response**. The endpoint that builds the resource already knows the caller's identity, the resource's state, and the active feature flags — so it is the right place to decide which actions to expose.

With `@affordant/server`, you declare each affordance once and gate it with `when`:

```ts
import { resource } from '@affordant/server'

function serializeOrder(order, caller, route) {
  return resource(order)
    .self(route('orders.show', order.id))
    .action('track', route('orders.tracking', order.id))
    .action('cancel', route('orders.cancel', order.id), {
      method: 'POST',
      when: caller.id === order.ownerId && order.status !== 'shipped',
    })
    .build()
}
```

When `when` is `false`, the rel is **not emitted** — so the client's `can(order, 'cancel')` returns `false`. The frontend never re-implements that `if`. Presence of the link *is* the permission.

## 2. URLs come from your router

Generate every `href` from a **named route**, never a hardcoded string. Renaming or remounting a route then updates every link automatically, and clients follow along without a deploy.

That `route(...)` function is the one framework-coupled piece, so it stays injected — keeping `@affordant/server` framework-agnostic. Thin adapters wire it up:

- [`@affordant/express`](https://www.npmjs.com/package/@affordant/express) sends the envelope from a controller and builds absolute URLs from the request.
- More adapters (Fastify, Nest, Hono, …) follow the same shape.

## Doing it by hand

You never *have* to use `@affordant/server`. Any code that returns the shape below is a valid producer:

```ts
return {
  ...order,
  _self: { href: route('orders.show', order.id), method: 'GET' },
  _actions: caller.id === order.ownerId
    ? { cancel: { href: route('orders.cancel', order.id), method: 'POST' } }
    : {},
}
```

## Any language, any stack

The envelope is the only contract — `@affordant/server` is a convenience, not a requirement. A backend in **pure Node JS** can emit it with a plain object literal and no Affordant dependency at all. So can a backend in **any other language**: Python, Go, Ruby, or **.NET**. The client only cares about the `_self` / `_actions` JSON it receives.

That makes a companion library on another stack a natural fit. A .NET package that builds the same envelope from your controllers — gating each link on `User`, resource state, and feature flags, with `href` from named routes — would interoperate with the `affordant` client byte-for-byte, exactly like `@affordant/server` does. The wire contract is the integration point; the helper on each side is just ergonomics.

## Checklist for emitting the envelope

- Every resource carries `_self` (so clients can refresh it) and `_actions` (possibly empty).
- Each action is `{ href, method, accepts? }`. Set `accepts` when the body is not `application/json`.
- Decide each action's presence from **authoritative server state** — identity, resource state, feature flags.
- Build `href` from named routes; never concatenate strings on the client side of the wire.

That's the whole contract. The client side is documented in [the wire contract](/guide/wire-contract).
