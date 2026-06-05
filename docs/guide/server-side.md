# Server side

Affordant is a *consumer*. Any backend — any language, any framework — that emits the `_self` / `_actions` envelope works. Two rules make it worth the effort.

## 1. Link visibility is authorization

Only emit an action the caller may execute, decided **server-side, per response**. The endpoint that builds the resource already knows the caller's identity, the resource's state, and the active feature flags — so it is the right place to decide which actions to expose.

```ts
// pseudo-controller
function serializeOrder(order, caller) {
  const actions: Record<string, HateoasAction> = {
    track: { href: route('orders.tracking', order.id), method: 'GET' },
  }

  if (caller.id === order.ownerId && order.status !== 'shipped') {
    actions.cancel = { href: route('orders.cancel', order.id), method: 'POST' }
  }

  return { ...order, _self: { href: route('orders.show', order.id), method: 'GET' }, _actions: actions }
}
```

The frontend never re-implements that `if`. It asks `can(order, 'cancel')`.

## 2. URLs come from your router

Generate every `href` from a **named route**, never a hardcoded string. Renaming or remounting a route then updates every link automatically, and clients follow along without a deploy.

## Checklist for emitting the envelope

- Every resource carries `_self` (so clients can refresh it) and `_actions` (possibly empty).
- Each action is `{ href, method, accepts? }`. Set `accepts` when the body is not `application/json`.
- Decide each action's presence from **authoritative server state** — identity, resource state, feature flags.
- Build `href` from named routes; never concatenate strings on the client side of the wire.

That's the whole contract. The client side is documented in [the wire contract](/guide/wire-contract).
