# `affordant`

The client: read the actions the server offers, gate your UI on them, follow them. Zero runtime dependencies. For the other packages, see [`@affordant/react`](/reference/react), [`@affordant/server`](/reference/server), and the shared [`@affordant/contract`](/reference/contract).

Everything is exported from the package root:

```ts
import {
  can,
  actionFor,
  follow,
  followJson,
  FollowError,
  type HateoasResource,
  type HateoasAction,
  type HateoasMethod,
  type FollowInit,
  type BearerToken,
} from 'affordant'
```

## Types

### `HateoasMethod`

```ts
type HateoasMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
```

The HTTP verbs an action can carry.

### `HateoasAction`

```ts
interface HateoasAction {
  href: string
  method: HateoasMethod
  accepts?: string
}
```

A hypermedia action descriptor: where (`href`), how (`method`), and optionally what request body it accepts (`accepts`, a media type — defaults to `application/json` when omitted).

### `HateoasResource<T>`

```ts
type HateoasResource<T> = T & {
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
}
```

Your resource `T`, enriched with hypermedia controls. `_actions` maps a link relation (rel) to the action the server is currently offering. An absent rel means the action is not available to the caller right now.

## Functions

### `can`

```ts
function can<T>(resource: HateoasResource<T> | null | undefined, rel: string): boolean
```

Affordance predicate: is the server currently offering `rel` on this resource? Drives conditional UI without duplicating authorization rules client-side.

- Returns `false` for `null` / `undefined` resources and for resources without `_actions`.
- Only own properties of `_actions` count — inherited properties are ignored.

```ts
can(order, 'cancel') // → true | false
```

### `actionFor`

```ts
function actionFor<T>(
  resource: HateoasResource<T> | null | undefined,
  rel: string,
): HateoasAction | null
```

Returns the action descriptor for `rel`, or `null` when the server did not offer it. Same null-safety as `can`.

```ts
const action = actionFor(order, 'cancel')
// → { href: '/orders/8f3a2c/cancel', method: 'POST' } | null
```

### `follow`

```ts
function follow(action: HateoasAction, init?: FollowInit): Promise<Response>
```

Invokes a hypermedia action with vanilla `fetch`. It builds the request from the action descriptor (`method` + `href` + `accepts`), injects the bearer token if provided, and JSON-encodes the body when the action accepts JSON. Returns the raw `Response` — you decide how to read it.

Because it is a plain `Promise`-returning function, it is **Effect-compatible** out of the box: wrap it with `Effect.tryPromise(() => follow(action, init))` if you work with [Effect](https://effect.website). Affordant carries no Effect dependency — the interop is yours to add when you want it.

```ts
const res = await follow(actionFor(order, 'cancel')!, {
  token: () => localStorage.getItem('token'),
  body: { reason: 'changed my mind' },
})
if (res.ok) { /* … */ }
```

#### `FollowInit`

```ts
interface FollowInit {
  body?: unknown
  token?: BearerToken | null
  headers?: Record<string, string>
  signal?: AbortSignal
  fetch?: typeof globalThis.fetch
}
```

| Field | Behaviour |
|---|---|
| `body` | When set, sent as the request body. JSON-encoded if the action's `accepts` is a JSON media type (the default), otherwise passed through untouched. When omitted, no body and no `Content-Type` are sent. |
| `token` | Bearer token, added as `Authorization: Bearer <token>`. Omitted when falsy (see `BearerToken`). |
| `headers` | Extra request headers. They override Affordant's defaults (e.g. `Accept`). |
| `signal` | An `AbortSignal`, forwarded to `fetch`. |
| `fetch` | A custom `fetch` implementation (SSR, polyfills, testing). Defaults to `globalThis.fetch`. |

#### `BearerToken`

```ts
type BearerToken = string | (() => string | null | undefined)
```

A plain string, or a **lazy getter** invoked at request time. The getter lets auth layers hand out short-lived tokens without coupling to any framework or secret-wrapping library. When the value (or the getter's result) is `null` / `undefined`, no `Authorization` header is sent.

### `followJson`

```ts
function followJson<T = unknown>(action: HateoasAction, init?: FollowInit): Promise<T>
```

A typed convenience over [`follow`](#follow): it invokes the action, then reads the response as JSON. On a non-2xx status it throws a [`FollowError`](#followerror); on success it resolves with the parsed JSON typed as `T`. An empty body (e.g. `204 No Content`) resolves to `undefined`.

Same `FollowInit` and Effect-compatibility as `follow` — only the result shape and the throw-on-error behaviour differ.

```ts
try {
  const order = await followJson<Order>(actionFor(res, 'self')!, { token })
  // order is typed as Order
} catch (err) {
  if (err instanceof FollowError) {
    console.error(err.status, err.body)
  }
}
```

### `FollowError`

```ts
class FollowError extends Error {
  readonly status: number
  readonly response: Response
  readonly body: unknown
}
```

Thrown by `followJson` when the response is not 2xx. Its `message` is `Request failed with status <status>`.

| Property | Meaning |
|---|---|
| `status` | The HTTP status code of the failed response. |
| `response` | The raw `Response` (untouched, so you can read headers or re-read the body). |
| `body` | The parsed JSON error body, falling back to text, then `undefined` when no body could be read. |
