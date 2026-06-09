# `@affordant/contract`

The shared **wire-contract** types. Zero runtime, zero dependencies — it ships only `.d.ts`. Every other package depends on it, so the producer (`@affordant/server`) and the consumers (`affordant`, `@affordant/react`) can never drift apart.

```sh
npm install @affordant/contract
```

You rarely import it directly: the client and server packages re-export these same types. Reach for it when you write code that sits between both sides (a shared model package, a test helper).

```ts
import type { HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'
```

## `HateoasMethod`

```ts
type HateoasMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
```

The HTTP verbs an action can carry.

## `HateoasAction`

```ts
interface HateoasAction {
  href: string
  method: HateoasMethod
  accepts?: string
}
```

A hypermedia action descriptor: where (`href`), how (`method`), and optionally what request body it accepts (`accepts`, a media type — defaults to `application/json` when omitted).

## `HateoasResource<T>`

```ts
type HateoasResource<T> = T & {
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
}
```

Your resource `T`, enriched with hypermedia controls. `_actions` maps a link relation (rel) to the action the server is currently offering. An absent rel means the action is not available to the caller right now.

## `PageInfo`

```ts
interface PageInfo {
  total?: number
  size?: number
  number?: number
}
```

Optional pagination metadata for a collection: the `total` number of items across all pages, the page `size`, and the zero-based `number` of the current page. Emit only what the server actually knows.

## `HateoasCollection<T>`

```ts
interface HateoasCollection<T> {
  items: HateoasResource<T>[]
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
  page?: PageInfo
}
```

A list of resources, enriched with hypermedia controls. `items` holds the already-enriched members. `_actions` carries collection-level affordances; pagination links live here under the standard rels `next`, `prev`, `first`, and `last`. An absent rel means that page is not available (e.g. no `next` on the last page). `page` surfaces optional pagination metadata.

See [the wire contract](/guide/wire-contract) for the design behind these types.
