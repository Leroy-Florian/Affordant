# `@affordant/contract`

The shared **wire-contract** types. Zero runtime, zero dependencies — it ships only `.d.ts`. Every other package depends on it, so the producer (`@affordant/server`) and the consumers (`affordant`, `@affordant/react`) can never drift apart.

```sh
npm install @affordant/contract
```

You rarely import it directly: the client and server packages re-export these same types. Reach for it when you write code that sits between both sides (a shared model package, a test helper).

```ts
import type { ActionField, HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'
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
  title?: string
  fields?: ActionField[]
}
```

A hypermedia action descriptor: where (`href`), how (`method`), and optionally what request body it accepts (`accepts`, a media type — defaults to `application/json` when omitted). It can also carry a human `title` (the button/link text) and the input `fields` the client should render, so the UI needs no per-rel mapping.

## `ActionField`

```ts
interface ActionField {
  name: string
  type?: string
  required?: boolean
  label?: string
  value?: unknown
}
```

A single input an action expects, so the client can render a form field directly from the wire. `name` is the key in the submitted body; `type` is the input kind (`'text'`, `'number'`, `'boolean'`, … — conceptually defaults to `'text'`); `required` marks a mandatory value; `label` is the human label; `value` is a default or prefilled value.

## `HateoasResource<T>`

```ts
type HateoasResource<T> = T & {
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
}
```

Your resource `T`, enriched with hypermedia controls. `_actions` maps a link relation (rel) to the action the server is currently offering. An absent rel means the action is not available to the caller right now.

See [the wire contract](/guide/wire-contract) for the design behind these types.
