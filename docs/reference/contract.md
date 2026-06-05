# `@affordant/contract`

The shared **wire-contract** types. Zero runtime, zero dependencies — it ships only `.d.ts`. Every other package depends on it, so the producer (`@affordant/server`) and the consumers (`affordant`, `@affordant/effect`, `@affordant/react`) can never drift apart.

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

See [the wire contract](/guide/wire-contract) for the design behind these types.
