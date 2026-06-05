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

## Why no adapter?

`can` and `actionFor` are pure, synchronous, null-safe reads over the resource you already hold. There is nothing to wire into a component lifecycle — you call them inline wherever you render. `follow` is a single `fetch` call returning a `Response`, so it composes with whatever data layer you already use (TanStack Query, SWR, a plain `await`, a Svelte store…).

Framework-specific *declinations* — React hooks like `useAction` / `useFollowQuery`, and an [Effect](https://effect.website)-flavoured invoker — ship as their own packages, so the core stays installable anywhere with nothing dragged along.
