# affordant

**Affordance-first hypermedia (HATEOAS) client.** Stop re-implementing your authorization rules in the frontend — let the actions the server offers drive your UI.

Your frontend never builds a URL, never picks an HTTP verb, never duplicates an authorization rule. It asks three questions:

1. *What is the server offering me?* → `can(resource, rel)`
2. *Where / how?* → `actionFor(resource, rel)`
3. *Do it.* → `follow(action, init)`

If the backend stops offering an action (not authorized, wrong state, feature off), the button disappears — no frontend deploy.

> Zero-dependency core. Runs anywhere `fetch` exists: browsers, Node ≥ 18, Deno, Bun, edge workers. No hooks, no stores, no framework adapter.

## Install

```sh
npm install affordant
```

## Usage

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

The core is plain functions over plain data — works the same in React, Vue, Svelte, or vanilla.

## API

| Export | Description |
|---|---|
| `HateoasResource<T>` | `T & { _self?: HateoasAction; _actions: Record<string, HateoasAction> }` |
| `HateoasAction` | `{ href: string; method: HateoasMethod; accepts?: string }` |
| `can(resource, rel)` | `true` iff the server currently offers `rel`. Null-safe. |
| `actionFor(resource, rel)` | The action descriptor, or `null`. Null-safe. |
| `follow(action, init?)` | Vanilla `fetch` invocation. `init`: `body`, `token` (string or lazy getter), `headers`, `signal`, `fetch` (injectable). Returns the raw `Response`. |

The wire-contract types are re-exported from [`@affordant/contract`](https://www.npmjs.com/package/@affordant/contract).

## Server side

Any backend that emits the `_self` / `_actions` envelope works. To build it ergonomically in Node, see [`@affordant/server`](https://www.npmjs.com/package/@affordant/server) — the server-side mirror of this client.

## License

MIT
