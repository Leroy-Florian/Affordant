# Démarrage

Affordant est un **client hypermédia (HATEOAS) piloté par les actions proposées**. Le serveur indique à votre frontend quelles actions sont disponibles ; votre UI s'affiche à partir de cela, au lieu de redériver les règles d'autorisation côté client.

## Installation

```sh
npm install affordant
```

Le cœur a **zéro dépendance** et fonctionne partout où `fetch` existe : navigateurs, Node ≥ 18, Deno, Bun, edge workers.

## Les trois questions

Chaque interaction se résume à trois appels :

1. **Que me propose le serveur ?** → [`can(resource, rel)`](/fr/reference/api#can)
2. **Où / comment ?** → [`actionFor(resource, rel)`](/fr/reference/api#actionfor)
3. **Fais-le.** → [`follow(action, init)`](/fr/reference/api#follow)

```ts
import { can, actionFor, follow, type HateoasResource } from 'affordant'

type Order = { id: string; total: number; status: string }
const order: HateoasResource<Order> = await fetch('/orders/8f3a2c').then(r => r.json())

if (can(order, 'cancel')) {
  await follow(actionFor(order, 'cancel')!, {
    token: () => localStorage.getItem('token'), // getter paresseux, lu au moment de la requête
    body: { reason: 'changed my mind' },        // encodé en JSON selon le `accepts` de l'action
  })
}
```

`can` et `actionFor` sont sûrs vis-à-vis de `null` : passez une ressource `null`, `undefined` ou sans `_actions` et vous obtenez `false` / `null` plutôt qu'une erreur levée. Cela les rend sûrs à appeler pendant que les données chargent encore.

## Ce que vous y gagnez

- **L'autorisation vit à un seul endroit — le serveur.** La présence du lien `cancel` _est_ la permission. Le frontend ne réimplémente jamais « cet utilisateur peut-il annuler cette commande ? ».
- **Aucune URL ni verbe codé en dur.** Le `href` et la `method` proviennent de la réponse. Renommez une route côté serveur et chaque client suit.
- **Le bouton suit la réalité.** Quand le serveur cesse de proposer une action, `can()` renvoie `false` et le contrôle disparaît — sans déploiement du frontend.

## Plus que le client

`affordant` est le client, mais il fait partie d'une petite famille partageant un unique contrat d'échange :

- [`@affordant/server`](/fr/reference/server) construit l'enveloppe côté backend — le miroir de `can()`.
- [`@affordant/express`](/fr/reference/server) est un adaptateur Express léger pour celui-ci.
- [`@affordant/react`](/fr/reference/react) emballe les appels en hooks.

Voir [les paquets](/fr/guide/packages) pour la carte complète, ou continuez simplement à utiliser les appels vanilla ci-dessus — ils fonctionnent partout.

## Étapes suivantes

- Parcourez [les paquets](/fr/guide/packages) et comment ils s'imbriquent.
- Comprenez [le contrat d'échange](/fr/guide/wire-contract) émis par le serveur.
- Voir [l'utilisation avec un framework](/fr/guide/frameworks) pour React, Vue, Svelte et vanilla.
- Lisez la [référence d'API](/fr/reference/api) complète.
