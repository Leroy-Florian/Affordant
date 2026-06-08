# `@affordant/server`

The server-side builder for the `_self` / `_actions` envelope — the mirror of the client's `can` / `actionFor`. Framework-agnostic: URL generation is injected, so it stays decoupled from any router.

```sh
npm install @affordant/server
```

```ts
import { resource } from '@affordant/server'

resource(order)
  .self(route('orders.show', order.id))
  .action('track', route('orders.tracking', order.id))
  .action('cancel', route('orders.cancel', order.id), {
    method: 'POST',
    when: caller.id === order.ownerId && order.status !== 'shipped',
  })
  .build()
```

It re-exports the [`@affordant/contract`](/reference/contract) types for convenience.

## `resource`

```ts
function resource<T extends object>(data: T): ResourceBuilder<T>
```

Starts a fluent builder over a plain object. `data` is carried through untouched onto the final wire resource.

## `ResourceBuilder<T>`

```ts
interface ResourceBuilder<T> {
  self(href: string, opts?: SelfOptions): ResourceBuilder<T>
  action(rel: string, href: string, opts?: ActionOptions): ResourceBuilder<T>
  build(): HateoasResource<T>
  buildAsync(): Promise<HateoasResource<T>>
}
```

### `.self(href, opts?)`

Sets the `_self` link clients use to refresh the resource.

```ts
interface SelfOptions {
  method?: HateoasMethod // defaults to 'GET'
}
```

### `.action(rel, href, opts?)`

Offers `rel` at `href`.

```ts
interface ActionOptions {
  method?: HateoasMethod // defaults to 'GET'
  accepts?: string       // request media type; omit for application/json
  when?: boolean | (() => boolean | Promise<boolean>) // defaults to true
}
```

`when` is where authorization lives. A falsy result means the action is **not emitted**, so the client's `can(resource, rel)` returns `false`. Presence of the link *is* the permission. Calling `.action` twice with the same `rel` overrides the earlier one.

`when` accepts three shapes:

- a `boolean` — a precomputed decision;
- a sync function `() => boolean` — evaluated lazily at build time;
- an async function `() => Promise<boolean>` — e.g. a DB lookup, so callers don't have to precompute everything up front.

Booleans and sync functions work with `.build()`. Async functions require [`.buildAsync()`](#buildasync); `.build()` throws a clear error if it encounters a predicate that returns a `Promise`.

```ts
resource(order)
  .action('refund', '/orders/8f3a2c/refund', {
    method: 'POST',
    when: async () => await payments.isRefundable(order.id),
  })
```

### `.build()`

```ts
build(): HateoasResource<T>
```

Returns the enriched wire resource **synchronously**. `_actions` is always present (possibly empty); `_self` appears only if `.self()` was called. Evaluates each `when` that is a `boolean` or a sync function; throws if a `when` function returns a `Promise` — use `.buildAsync()` instead.

```ts
resource({ id: '8f3a2c', status: 'pending' })
  .self('/orders/8f3a2c')
  .action('cancel', '/orders/8f3a2c/cancel', { method: 'POST', when: false })
  .build()
// → { id: '8f3a2c', status: 'pending', _self: { href: '/orders/8f3a2c', method: 'GET' }, _actions: {} }
```

### `.buildAsync()`

```ts
buildAsync(): Promise<HateoasResource<T>>
```

Same as `.build()`, but awaits any async `when` predicates before resolving the envelope. Boolean and sync-function predicates work here too, so reach for `.buildAsync()` whenever any action's `when` may resolve asynchronously.

```ts
const body = await resource(order)
  .action('refund', '/orders/8f3a2c/refund', {
    method: 'POST',
    when: async () => await payments.isRefundable(order.id),
  })
  .buildAsync()
```

See [server side](/guide/server-side) for the rules that make it worth it.
