# Affordant

**Affordance-first hypermedia (HATEOAS) client.** Zero-dependency core: read the actions the server offers, gate your UI on them, follow them.

Your frontend never builds a URL, never picks an HTTP verb, never duplicates an authorization rule. It asks three questions:

1. *What is the server offering me?* → `can(resource, rel)`
2. *Where / how?* → `actionFor(resource, rel)`
3. *Do it.* → `follow(action, init)`

If the backend stops offering an action (not authorized, wrong state, feature off), the button disappears — no frontend deploy.

## The wire contract

The server enriches its responses with `_self` and `_actions`, where each action is `{ href, method, accepts? }` and the **presence of a rel encodes permission**:

```jsonc
// GET /players/archimonde/kaelith — anonymous caller
{
  "name": "Kaelith",
  "level": 18,
  "_self":    { "href": "/players/archimonde/kaelith", "method": "GET" },
  "_actions": {
    "run-stats": { "href": "/players/archimonde/kaelith/run-stats", "method": "GET" }
  }
}

// same request, authenticated caller → one more affordance
  "_actions": {
    "run-stats": { "href": "...", "method": "GET" },
    "claim":     { "href": "/players/archimonde/kaelith/claim", "method": "POST" }
  }
```

## Install

```sh
npm install affordant
```

The core has **zero dependencies** and runs anywhere `fetch` exists: browsers, Node ≥ 18, Deno, Bun, edge workers.

## Usage

### Vanilla

```ts
import { can, actionFor, follow, type HateoasResource } from 'affordant'

type Player = { name: string; level: number }
const player: HateoasResource<Player> = await fetch('/players/kaelith').then(r => r.json())

if (can(player, 'claim')) {
  await follow(actionFor(player, 'claim')!, {
    token: () => localStorage.getItem('token'), // lazy getter, read at request time
    body: { note: 'mine' },                     // JSON-encoded per the action's `accepts`
  })
}
```

### React

```tsx
{can(player, 'claim') && (
  <button onClick={() => follow(actionFor(player, 'claim')!, { token })}>
    Claim
  </button>
)}
```

### Vue

```vue
<button v-if="can(player, 'claim')" @click="claim">Claim</button>
```

### Svelte

```svelte
{#if can(player, 'claim')}
  <button onclick={claim}>Claim</button>
{/if}
```

The core is plain functions over plain data — no hooks, no stores, no framework adapter needed.

### Effect

An [Effect](https://effect.website)-flavoured invoker ships under the `affordant/effect` subpath (requires the optional peers `effect` and `@effect/platform`). It executes via `HttpClient` with `filterStatusOk` and decodes the response body against a `Schema`:

```ts
import { followEffect } from 'affordant/effect'
import { Schema } from 'effect'

const ClaimResult = Schema.Struct({ claimedAt: Schema.String })

const program = followEffect(actionFor(player, 'claim')!, ClaimResult, {
  token: redactedToken, // plain string or Redacted<string>
})
```

Use `Schema.Unknown` when you only care about success/failure — it also makes `204 No Content` succeed cleanly.

## API

| Export | Description |
|---|---|
| `HateoasResource<T>` | `T & { _self?: HateoasAction; _actions: Record<string, HateoasAction> }` |
| `HateoasAction` | `{ href: string; method: HateoasMethod; accepts?: string }` |
| `can(resource, rel)` | `true` iff the server currently offers `rel`. Null-safe. |
| `actionFor(resource, rel)` | The action descriptor, or `null`. Null-safe. |
| `follow(action, init?)` | Vanilla `fetch` invocation. `init`: `body`, `token` (string or lazy getter), `headers`, `signal`, `fetch` (injectable). Returns the raw `Response`. |
| `followEffect(action, schema, init?)` | *(subpath `affordant/effect`)* Effect invocation with schema-decoded response. |

## Server side

Any backend that emits the `_self` / `_actions` envelope works. The rules that make it worth it:

- **Link visibility is authorization**: only emit an action the caller may execute, decided server-side per response.
- **URLs come from your router** (named routes), never hardcoded — renaming a route updates every link.

## License

MIT
