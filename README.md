# Affordant

**Affordance-first hypermedia (HATEOAS) client.** Stop re-implementing your authorization rules in the frontend — let the actions the server offers drive your UI.

Your frontend never builds a URL, never picks an HTTP verb, never duplicates an authorization rule. It asks three questions:

1. *What is the server offering me?* → `can(resource, rel)`
2. *Where / how?* → `actionFor(resource, rel)`
3. *Do it.* → `follow(action, init)`

If the backend stops offering an action (not authorized, wrong state, feature off), the button disappears — no frontend deploy.

> Zero-dependency core. Runs anywhere `fetch` exists: browsers, Node ≥ 18, Deno, Bun, edge workers. No hooks, no stores, no framework adapter.

## The wire contract

The server enriches its responses with `_self` and `_actions`, where each action is `{ href, method, accepts? }` and the **presence of a rel encodes permission**:

```jsonc
// GET /orders/8f3a2c — anonymous caller
{
  "id": "8f3a2c",
  "total": 4200,
  "status": "shipped",
  "_self":    { "href": "/orders/8f3a2c", "method": "GET" },
  "_actions": {
    "track": { "href": "/orders/8f3a2c/tracking", "method": "GET" }
  }
}

// same request, the order's owner → one more affordance
  "_actions": {
    "track":  { "href": "...", "method": "GET" },
    "cancel": { "href": "/orders/8f3a2c/cancel", "method": "POST" }
  }
```

The owner gets a `cancel` link; everyone else simply doesn't. The frontend renders the cancel button off the *presence* of that link — it never re-derives "can this user cancel?".

## Install

```sh
npm install affordant
```

## Usage

### Vanilla

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

### React

```tsx
{can(order, 'cancel') && (
  <button onClick={() => follow(actionFor(order, 'cancel')!, { token })}>
    Cancel order
  </button>
)}
```

### Vue

```vue
<button v-if="can(order, 'cancel')" @click="cancel">Cancel order</button>
```

### Svelte

```svelte
{#if can(order, 'cancel')}
  <button onclick={cancel}>Cancel order</button>
{/if}
```

The core is plain functions over plain data — no hooks, no stores, no framework adapter needed.

## API

| Export | Description |
|---|---|
| `HateoasResource<T>` | `T & { _self?: HateoasAction; _actions: Record<string, HateoasAction> }` |
| `HateoasAction` | `{ href: string; method: HateoasMethod; accepts?: string }` |
| `can(resource, rel)` | `true` iff the server currently offers `rel`. Null-safe. |
| `actionFor(resource, rel)` | The action descriptor, or `null`. Null-safe. |
| `follow(action, init?)` | Vanilla `fetch` invocation. `init`: `body`, `token` (string or lazy getter), `headers`, `signal`, `fetch` (injectable). Returns the raw `Response`. |

## Server side

Any backend that emits the `_self` / `_actions` envelope works. The rules that make it worth it:

- **Link visibility is authorization**: only emit an action the caller may execute, decided server-side per response.
- **URLs come from your router** (named routes), never hardcoded — renaming a route updates every link.

## Roadmap

This package is the **vanilla core** — zero dependencies, no framework, no runtime coupling. Framework- and runtime-specific *declinations* ship as their own packages so the core stays installable anywhere with nothing dragged along:

- React hooks (`useAction`, `useFollowQuery`)
- An [Effect](https://effect.website)-flavoured invoker (schema-decoded responses, `Redacted` tokens)

## License

MIT
