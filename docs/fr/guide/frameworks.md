# Utilisation avec un framework

Le cœur d'Affordant, ce sont de simples fonctions sur de simples données — pas de hooks, pas de stores, pas d'adaptateur de framework. Les mêmes appels `can` / `actionFor` / `follow` fonctionnent partout ; seule la syntaxe de templating change.

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
    Annuler la commande
  </button>
)}
```

## Vue

```vue
<button v-if="can(order, 'cancel')" @click="cancel">Annuler la commande</button>
```

## Svelte

```svelte
{#if can(order, 'cancel')}
  <button onclick={cancel}>Annuler la commande</button>
{/if}
```

## Express, côté serveur

Le `sendResource` de [`@affordant/express`](https://www.npmjs.com/package/@affordant/express) sérialise l'enveloppe en JSON sans la modifier, et reflète aussi chaque lien dans un en-tête `Link` combiné conforme à la [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288) — `_self` en `rel="self"` d'abord, puis chaque rel de `_actions` dans l'ordre. Les clients et proxys qui lisent les en-têtes `Link` voient les mêmes affordances que le corps.

```
Link: </orders/8f3a2c>; rel="self", </orders/8f3a2c/cancel>; rel="cancel"
```

## Vous n'avez *jamais besoin* d'un adaptateur

`can` et `actionFor` sont des lectures pures, synchrones et sûres vis-à-vis de `null` sur la ressource que vous détenez déjà. Il n'y a rien à brancher dans le cycle de vie d'un composant — vous les appelez en ligne là où vous affichez. `follow` est un unique appel `fetch` qui renvoie une `Response`, donc il se compose avec n'importe quelle couche de données que vous utilisez déjà (TanStack Query, SWR, un simple `await`, un store Svelte…). Les exemples vanilla ci-dessus sont une façon complète et prise en charge d'utiliser Affordant dans n'importe quel framework.

## React, avec des hooks (optionnel)

Si vous voulez de l'ergonomie dans React, [`@affordant/react`](/fr/reference/react) emballe les mêmes appels en hooks. C'est opt-in ; `affordant` n'en dépend jamais.

```sh
npm install @affordant/react
```

```tsx
import { useAffordance, useFollow } from '@affordant/react'

function CancelButton({ order }) {
  const cancel = useAffordance(order, 'cancel') // { can, action } — conditionnement pur
  const { run, running } = useFollow()          // l'invocateur de Promise, avec état

  if (!cancel.can) return null
  return (
    <button disabled={running} onClick={() => run(cancel.action!, { token })}>
      Annuler la commande
    </button>
  )
}
```

## Vue, avec des composables (optionnel)

Si vous voulez de l'ergonomie dans Vue, [`@affordant/vue`](/fr/reference/vue) emballe les mêmes appels en composables. C'est opt-in ; `affordant` n'en dépend jamais. `useAffordance` renvoie des `computed` réactifs, donc le conditionnement reste synchrone au fur et à mesure que vos données se chargent ou changent.

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
    Annuler la commande
  </button>
</template>
```

## Utiliser Effect

`follow` est une simple fonction qui renvoie une promesse, donc elle s'intègre à Effect (ou tout autre système d'effets) avec un emballage d'une ligne — `Effect.tryPromise(() => follow(action, init))`. Cette interopérabilité, c'est à vous de l'ajouter si vous le voulez ; Affordant n'embarque jamais de dépendance Effect.

## Svelte

Aucun paquet d'adaptateur n'existe encore pour Svelte — et vous n'en avez pas besoin. Les extraits vanilla ci-dessus disent tout. Si une ergonomie de type hooks y était souhaitée elle aussi, elle serait livrée comme son propre paquet opt-in, jamais comme une dépendance du cœur.
