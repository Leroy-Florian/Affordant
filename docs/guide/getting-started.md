# Getting started

Affordant is an **affordance-first hypermedia (HATEOAS) client**. The server tells your frontend which actions are available; your UI renders off that, instead of re-deriving authorization rules client-side.

## Install

```sh
npm install affordant
```

The core has **zero dependencies** and runs anywhere `fetch` exists: browsers, Node ≥ 18, Deno, Bun, edge workers.

## The three questions

Every interaction comes down to three calls:

1. **What is the server offering me?** → [`can(resource, rel)`](/reference/api#can)
2. **Where / how?** → [`actionFor(resource, rel)`](/reference/api#actionfor)
3. **Do it.** → [`follow(action, init)`](/reference/api#follow)

```ts
import { can, actionFor, follow, type HateoasResource } from 'affordant'

type Order = { id: string; total: number; status: string }
const order: HateoasResource<Order> = await fetch('/orders/8f3a2c').then(r => r.json())

if (can(order, 'cancel')) {
  await follow(actionFor(order, 'cancel')!, {
    token: () => localStorage.getItem('token'), // lazy getter, read at request time
    body: { reason: 'changed my mind' },        // JSON-encoded per the action's `accepts`
  })
}
```

`can` and `actionFor` are null-safe: pass a resource that is `null`, `undefined`, or missing `_actions` and you get `false` / `null` rather than a thrown error. That makes them safe to call while data is still loading.

## What you get out of it

- **Authorization lives in one place — the server.** The presence of the `cancel` link _is_ the permission. The frontend never re-implements "can this user cancel this order?".
- **No hardcoded URLs or verbs.** The `href` and `method` come from the response. Rename a route on the server and every client follows along.
- **The button tracks reality.** When the server stops offering an action, `can()` returns `false` and the control disappears — with no frontend deploy.

## More than the client

`affordant` is the vanilla client, but it is one of a small family sharing a single wire contract:

- [`@affordant/server`](/reference/server) builds the envelope on the backend — the mirror of `can()`.
- [`@affordant/effect`](/reference/effect) is a second, interchangeable invoker returning an `Effect`.
- [`@affordant/react`](/reference/react) wraps the calls as hooks (with either invoker).

See [the packages](/guide/packages) for the whole map, or just keep using the vanilla calls above — they work everywhere.

## Next steps

- Tour [the packages](/guide/packages) and how they fit together.
- Understand [the wire contract](/guide/wire-contract) the server emits.
- Learn the two [invokers — Promise & Effect](/guide/invokers).
- See [framework usage](/guide/frameworks) for React, Vue, Svelte, and vanilla.
- Read the full [API reference](/reference/api).
