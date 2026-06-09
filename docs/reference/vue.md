# `@affordant/vue`

The Vue adapter. Gate your UI on what the server offers, and follow affordances with composables. No runtime dependency beyond Vue.

```sh
npm install @affordant/vue vue
```

`vue` is a peer dependency. The package re-exports the contract types and `FollowInit`.

## `useAffordance`

```ts
function useAffordance<T>(
  resource: MaybeRefOrGetter<HateoasResource<T> | null | undefined>,
  rel: MaybeRefOrGetter<string>,
): Affordance

interface Affordance {
  readonly can: ComputedRef<boolean>
  readonly action: ComputedRef<HateoasAction | null>
}
```

A reactive read: it wraps `can` and `actionFor` for the `(resource, rel)` you hold. Both arguments accept refs, getters, or plain values, and the result stays in sync as your data loads or changes. Null-safe, so it is fine to call while data is still loading.

```vue
<script setup lang="ts">
const { can } = useAffordance(order, 'cancel')
</script>

<template>
  <button v-if="can">Cancel</button>
</template>
```

## `useFollow`

```ts
function useFollow(): UseFollowResult

interface UseFollowResult {
  readonly running: Ref<boolean>
  readonly error: Ref<unknown>
  readonly run: (action: HateoasAction, init?: FollowInit) => Promise<Response>
}
```

Follow an affordance from a composable. It tracks `running` / `error` around the client's [`follow`](/reference/api#follow); `run` resolves with the raw `Response` and re-throws on failure (with `error` set).

```vue
<script setup lang="ts">
const cancel = useAffordance(order, 'cancel')
const { run, running } = useFollow()
</script>

<template>
  <button :disabled="!cancel.can.value || running" @click="run(cancel.action.value!, { token })">
    Cancel
  </button>
</template>
```

## Using Effect

There is no Effect-specific entry point, and none is needed: `run` (and the underlying `follow`) return a `Promise<Response>`, which drops into Effect with a one-line wrap — `Effect.tryPromise(() => follow(action, init))`. Affordant stays Effect-compatible without shipping an Effect dependency.
