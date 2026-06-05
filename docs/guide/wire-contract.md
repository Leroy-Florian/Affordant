# The wire contract

Affordant works against one simple convention: the server enriches each resource with `_self` and `_actions`. Each action is `{ href, method, accepts? }`, and the **presence of a rel encodes permission**.

## The envelope

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

## The shape, typed

```ts
type HateoasMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface HateoasAction {
  href: string
  method: HateoasMethod
  accepts?: string // request media type; defaults to application/json
}

type HateoasResource<T> = T & {
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
}
```

- **`href`** — where the action lives. It comes from the server's router, never hardcoded in the client.
- **`method`** — the HTTP verb to use. The client doesn't guess it.
- **`accepts`** — the media type the action expects in the request body. When omitted, Affordant sends `application/json`.

## Why presence-as-permission matters

A rel is **absent** whenever the action is not available to *this* caller right now:

- not authorized (wrong role, not the owner),
- wrong state (the order already shipped, the draft is already published),
- feature off (flag disabled, plan doesn't include it).

The client doesn't need to know *which* of those reasons applies. It asks `can(order, 'cancel')` and trusts the answer. All of that branching logic stays on the server, where the authoritative state lives — and changing it never requires a frontend deploy.

This is Richardson Maturity Model **Level 3**, seen from the consumer's side: the client is driven by the controls the server hands it.
