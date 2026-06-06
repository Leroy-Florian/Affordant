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
  offer<Ctx>(policy: Policy<Ctx>, href: string, ctx: Ctx, opts?: Omit<ActionOptions, 'when'>): ResourceBuilder<T>
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

`when` gates the affordance's *visibility*. When `false`, the action is **not emitted**, so the client's `can(resource, rel)` returns `false`. This drives the UI — it is **not** a security boundary. The route handler must re-check the same rule (see [`policy`](#policy)), because a client can forge the request regardless of what was rendered. Calling `.action` twice with the same `rel` overrides the earlier one.

### `.offer(policy, href, ctx, opts?)`

Offers a [`policy`](#policy)'s action: gates visibility with `policy.granted(ctx)` and uses `policy.rel` as the relation, so the affordance and the handler's guard share one rule.

```ts
resource(order)
  .offer(cancelPolicy, route('orders.cancel', order.id), { me, order }, { method: 'POST' })
```

`opts` is [`ActionOptions`](#actionoptions) without `when` — the policy owns visibility.

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

## `policy`

```ts
function policy<Ctx>(rel: string, rules: PolicyRule<Ctx>[]): Policy<Ctx>
```

Declares an authorization rule **once** and enforces it on both sides of the wire, so the affordance (what the UI shows) and the route guard (what the server does) cannot drift. An affordance is never a security boundary — the client can forge any request — so the handler must re-check the same rule.

```ts
import { policy, resource } from '@affordant/server'

interface CancelCtx { me: string | null; order: Order }

const cancel = policy<CancelCtx>('cancel', [
  { ok: (c) => c.me === c.order.ownerId,     status: 403, error: 'forbidden' },
  { ok: (c) => c.order.status === 'pending', status: 409, error: 'not cancellable' },
])

// Serializer — gate the affordance:
resource(order).offer(cancel, route('orders.cancel', order.id), ctx, { method: 'POST' })

// Handler — enforce execution:
const denied = cancel.check({ me: callerId(req), order })
if (denied) return res.status(denied.status).json({ error: denied.error })
```

### `PolicyRule<Ctx>`

```ts
interface PolicyRule<Ctx> {
  ok: (ctx: Ctx) => boolean // condition is satisfied
  status?: number           // HTTP status on failure; defaults to 403
  error: string             // machine-readable error on failure
}
```

### `Policy<Ctx>`

```ts
interface Policy<Ctx> {
  readonly rel: string
  granted(ctx: Ctx): boolean        // every rule passes — feed to `when` / `.offer`
  check(ctx: Ctx): PolicyDenial | null // first failing rule, or null
  authorize(ctx: Ctx): void         // throws PolicyError on the first failing rule
}
```

Rules are evaluated in order; `check` and `authorize` report the **first** failure, so you can keep `403 forbidden` distinct from `409 not cancellable`.

- `granted` — visibility predicate for the serializer (or use [`.offer`](#offer-policy-href-ctx-opts)).
- `check` — returns `{ rel, status, error }` (a `PolicyDenial`) or `null`; ideal for an explicit `if` in the handler.
- `authorize` — throws [`PolicyError`](#policyerror) (carrying `rel`, `status`, `error`) for an error-middleware style.

### `PolicyError`

```ts
class PolicyError extends Error {
  readonly rel: string
  readonly status: number
  readonly error: string
}
```

Thrown by `policy.authorize(ctx)`. Map it to a response in your framework's error handler.

See [server side](/guide/server-side) for the rules that make it worth it.
