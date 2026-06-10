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

## Express, on the server

[`@affordant/express`](https://www.npmjs.com/package/@affordant/express)'s `sendResource` serialises the envelope to JSON unchanged, and also mirrors every link as a combined [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288) `Link` header — `_self` as `rel="self"` first, then each `_actions` rel in order. Clients and proxies that read `Link` headers see the same affordances as the body.

```
Link: </orders/8f3a2c>; rel="self", </orders/8f3a2c/cancel>; rel="cancel"
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

## Vue, with composables (optional)

If you want ergonomics in Vue, [`@affordant/vue`](/reference/vue) wraps the same calls as composables. It is opt-in; `affordant` never depends on it. `useAffordance` returns reactive `computed`s, so the gating stays in sync as your data loads or changes.

```sh
npm install @affordant/vue
```

```vue
<script setup lang="ts">
import { useAffordance, useFollow } from '@affordant/vue'

const props = defineProps<{ order: HateoasResource<Order> }>()
const cancel = useAffordance(() => props.order, 'cancel')
const { run, running } = useFollow()
</script>

<template>
  <button
    v-if="cancel.can.value"
    :disabled="running"
    @click="run(cancel.action.value!, { token })"
  >
    Cancel order
  </button>
</template>
```

The demo below is built with exactly those composables — `useAffordance` gates the button, `useFollow` invokes it. Toggle the caller and the button follows the server's `cancel` affordance, with no client-side permission check:

<AffordanceDemo />

## Using Effect

`follow` is a plain promise-returning function, so it drops into Effect (or any effect system) with a one-line wrap — `Effect.tryPromise(() => follow(action, init))`. That interop is yours to add if you want it; Affordant never ships an Effect dependency.

## Svelte

No adapter package exists for Svelte yet — and you don't need one. The vanilla snippets above are the whole story. If hooks-style ergonomics are wanted there too, they'd ship as their own opt-in package, never as a dependency of the core.
