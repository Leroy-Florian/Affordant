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
  when?: boolean         // defaults to true; false omits the rel entirely
}
```

`when` is where authorization lives. When `false`, the action is **not emitted**, so the client's `can(resource, rel)` returns `false`. Presence of the link *is* the permission. Calling `.action` twice with the same `rel` overrides the earlier one.

### `.build()`

```ts
build(): HateoasResource<T>
```

Returns the enriched wire resource. `_actions` is always present (possibly empty); `_self` appears only if `.self()` was called.

```ts
resource({ id: '8f3a2c', status: 'pending' })
  .self('/orders/8f3a2c')
  .action('cancel', '/orders/8f3a2c/cancel', { method: 'POST', when: false })
  .build()
// → { id: '8f3a2c', status: 'pending', _self: { href: '/orders/8f3a2c', method: 'GET' }, _actions: {} }
```

## `collection`

```ts
function collection<T extends object>(items: HateoasResource<T>[]): CollectionBuilder<T>
```

The list-shaped sibling of `resource`. You build each member with `resource()` first, then wrap the array. Pagination links are plain actions: emit them with `.action('next', href)`, `.action('prev', href)`, `.action('first', href)`, and `.action('last', href)`.

```ts
import { collection, resource } from '@affordant/server'

collection(orders.map((o) => resource(o).self(route('orders.show', o.id)).build()))
  .self(route('orders.index'))
  .action('next', route('orders.index', { page: page + 1 }))
  .action('prev', route('orders.index', { page: page - 1 }), { when: page > 0 })
  .page({ total: 42, size: 20, number: page })
  .build()
```

## `CollectionBuilder<T>`

```ts
interface CollectionBuilder<T> {
  self(href: string, opts?: SelfOptions): CollectionBuilder<T>
  action(rel: string, href: string, opts?: ActionOptions): CollectionBuilder<T>
  page(info: PageInfo): CollectionBuilder<T>
  build(): HateoasCollection<T>
}
```

`.self` and `.action` mirror `ResourceBuilder` exactly — same `SelfOptions` / `ActionOptions`, including `when` for authorization-as-visibility. `.page(info)` attaches optional pagination metadata.

### `.build()`

```ts
build(): HateoasCollection<T>
```

Returns the enriched wire collection. `items` is carried through untouched, `_actions` is always present (possibly empty), and `_self` / `page` appear only when set.

See [server side](/guide/server-side) for the rules that make it worth it.
