# Framework usage

Affordant's core is plain functions over plain data — no hooks, no stores, no framework adapter. The same `can` / `actionFor` / `follow` calls work everywhere; only the templating syntax changes.

## Vanilla

```ts
import { can, actionFor, follow, type HateoasResource } from 'affordant'

type Order = { id: string; total: number; status: string }
const order: HateoasResource<Order> = await fetch('/orders/8f3a2c').then(r => r.json())

if (can(order, 'cancel')) {
  await follow(actionFor(order, 'cancel')!, {
    token: () => localStorage.getItem('token'),
    body: { reason: 'changed my mind' },
  })
}
```

## React

```tsx
{can(order, 'cancel') && (
  <button onClick={() => follow(actionFor(order, 'cancel')!, { token })}>
    Cancel order
  </button>
)}
```

## Vue

```vue
<button v-if="can(order, 'cancel')" @click="cancel">Cancel order</button>
```

## Svelte

```svelte
{#if can(order, 'cancel')}
  <button onclick={cancel}>Cancel order</button>
{/if}
```

## You never *need* an adapter

`can` and `actionFor` are pure, synchronous, null-safe reads over the resource you already hold. There is nothing to wire into a component lifecycle — you call them inline wherever you render. `follow` is a single `fetch` call returning a `Response`, so it composes with whatever data layer you already use (TanStack Query, SWR, a plain `await`, a Svelte store…). The vanilla examples above are a complete, supported way to use Affordant in any framework.

## React, with hooks (optional)

If you want ergonomics in React, [`@affordant/react`](/reference/react) wraps the same calls as hooks. It is opt-in; `affordant` never depends on it.

```sh
npm install @affordant/react
```

```tsx
import { useAffordance, useFollow } from '@affordant/react'

function CancelButton({ order }) {
  const cancel = useAffordance(order, 'cancel') // { can, action } — pure gating
  const { run, running } = useFollow()          // the Promise invoker, with state

  if (!cancel.can) return null
  return (
    <button disabled={running} onClick={() => run(cancel.action!, { token })}>
      Cancel order
    </button>
  )
}
```

## Fastify (server)

On the server, [`@affordant/fastify`](/reference/server) sends the envelope from a handler and builds absolute URLs from the request. `sendResource` also emits every rel as an RFC 8288 `Link` header.

```ts
import { resource } from '@affordant/server'
import { sendResource, urlFor } from '@affordant/fastify'

app.get('/orders/:id', (req, reply) =>
  sendResource(
    reply,
    resource(order)
      .self(urlFor(req, `/orders/${order.id}`))
      .action('cancel', urlFor(req, `/orders/${order.id}/cancel`), {
        method: 'POST',
        when: order.ownerId === req.user.id,
      }),
  ),
)
```

## Using Effect

`follow` is a plain promise-returning function, so it drops into Effect (or any effect system) with a one-line wrap — `Effect.tryPromise(() => follow(action, init))`. That interop is yours to add if you want it; Affordant never ships an Effect dependency.

## Vue / Svelte

No adapter packages exist for Vue or Svelte yet — and you don't need them. The vanilla snippets above are the whole story. If hooks-style ergonomics are wanted there too, they'd ship as their own opt-in packages, never as a dependency of the core.
