# `@affordant/vue`

L'adaptateur Vue. Conditionnez votre UI sur ce que le serveur propose, et suivez les affordances avec des composables. Aucune dépendance d'exécution au-delà de Vue.

```sh
npm install @affordant/vue vue
```

`vue` est une dépendance peer. Le paquet réexporte les types du contrat et `FollowInit`.

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

Une lecture réactive : elle emballe `can` et `actionFor` pour le couple `(resource, rel)` que vous détenez. Les deux arguments acceptent des refs, des getters ou des valeurs simples, et le résultat reste synchronisé pendant que les données chargent ou changent. Sûre vis-à-vis de `null`, on peut donc l'appeler pendant que les données chargent encore.

```vue
<script setup lang="ts">
const { can } = useAffordance(order, 'cancel')
</script>

<template>
  <button v-if="can">Annuler</button>
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

Suivre une affordance depuis un composable. Il suit `running` / `error` autour du [`follow`](/fr/reference/api#follow) du client ; `run` se résout avec la `Response` brute et relève l'erreur en cas d'échec (avec `error` renseigné).

```vue
<script setup lang="ts">
const cancel = useAffordance(order, 'cancel')
const { run, running } = useFollow()
</script>

<template>
  <button :disabled="!cancel.can.value || running" @click="run(cancel.action.value!, { token })">
    Annuler
  </button>
</template>
```

## Utiliser Effect

Il n'y a pas de point d'entrée spécifique à Effect, et il n'en faut pas : `run` (et le `follow` sous-jacent) renvoient un `Promise<Response>`, qui s'intègre à Effect avec un emballage d'une ligne — `Effect.tryPromise(() => follow(action, init))`. Affordant reste compatible avec Effect sans embarquer de dépendance Effect.
