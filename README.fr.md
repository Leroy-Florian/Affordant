# Affordant

[English](README.md) · **Français**

**Atteignez enfin le niveau 3 de REST — l'hypermédia (HATEOAS), des deux côtés du fil.** Le niveau 3 est le niveau de maturité REST que la plupart des équipes délaissent. Arrêtez de réimplémenter vos règles d'autorisation dans le frontend — laissez les actions proposées par le serveur piloter votre UI, et laissez le serveur déclarer ces actions une seule fois.

Le serveur enrichit chaque réponse avec `_self` et `_actions` ; la **présence d'un rel encode la permission**. Le client affiche un bouton à partir de la *présence* du lien — il ne redérive jamais « cet utilisateur peut-il faire X ? ».

```jsonc
// GET /orders/8f3a2c — le propriétaire de la commande
{
  "id": "8f3a2c",
  "status": "pending",
  "_self":    { "href": "/orders/8f3a2c", "method": "GET" },
  "_actions": {
    "track":  { "href": "/orders/8f3a2c/tracking", "method": "GET" },
    "cancel": { "href": "/orders/8f3a2c/cancel",   "method": "POST" }
  }
}
```

Quiconque n'est pas le propriétaire n'obtient tout simplement pas le lien `cancel` — et le bouton d'annulation du frontend disparaît, sans déploiement.

## Les paquets

Ce dépôt est un monorepo npm-workspaces. Un seul contrat partagé, symétrique de chaque côté du fil :

| Paquet | Côté | Ce qu'il fait |
|---|---|---|
| [`@affordant/contract`](packages/contract) | partagé | Les types du contrat de fil. Zéro exécution, zéro dépendance. Tout le reste en dépend. |
| [`affordant`](packages/client) | client | `can` / `actionFor` / `follow` — conditionne l'UI à ce que le serveur propose. Zéro dépendance d'exécution. |
| [`@affordant/react`](packages/react) | client | Adaptateur React : conditionne l'UI aux affordances et les suit avec des hooks. |
| [`@affordant/server`](packages/server) | serveur | Un constructeur qui émet l'enveloppe `_self` / `_actions`. Indépendant du framework. |
| [`@affordant/express`](packages/express) | serveur | Adaptateur Express : envoie l'enveloppe et construit les URL à partir de la requête. |

```
                 ┌─ @affordant/contract (types de fil partagés) ─┐
                 │                                               │
   @affordant/server  ──construit──►  _self / _actions  ──lit──►  affordant
        │                                                          │
   @affordant/express                                        (React / Vue / … )
```

Le `build()` côté serveur produit exactement ce que `can()` consomme côté client — un seul contrat, jamais deux implémentations à garder synchronisées.

## Le client, en un coup d'œil

```ts
import { can, actionFor, follow } from 'affordant'

if (can(order, 'cancel')) {
  await follow(actionFor(order, 'cancel')!, { token, body: { reason: 'changed my mind' } })
}
```

## Le serveur, en un coup d'œil

```ts
import { resource } from '@affordant/server'

resource(order)
  .self(route('orders.show', order.id))
  .action('track', route('orders.tracking', order.id))
  .action('cancel', route('orders.cancel', order.id), {
    method: 'POST',
    when: caller.id === order.ownerId && order.status !== 'shipped', // absent ⇒ pas de permission
  })
  .build()
```

Le prédicat `when` *est* l'autorisation : quand il vaut false, le rel n'est jamais émis, donc `can(order, 'cancel')` renvoie false côté client.

## Utiliser Effect

`follow` est une simple fonction qui renvoie une promesse, donc elle s'intègre à [Effect](https://effect.website) — ou tout autre système d'effets — avec un emballage d'une ligne : `Effect.tryPromise(() => follow(action, init))`. Affordant reste **compatible avec Effect sans embarquer de dépendance Effect** ; l'interopérabilité, c'est à vous de l'ajouter quand vous le voulez.

## Développer

```sh
npm install        # installe tous les workspaces
npm run build      # construit chaque paquet (contract en premier)
npm run typecheck  # vérifie les types de chaque paquet
npm test           # tests unitaires + matrice E2E de la démo
npm run demo       # démarre un backend en direct (voir demo/)
npm run demo:web   # sert les fronts navigateur (Vite)
npm run e2e        # E2E navigateur (Playwright)
npm run smoke      # vérifie les artefacts npm publiés (voir smoke/)
```

Le paquet [`demo/`](demo) prouve le contrat sur **deux backends** (Express et pur Node) × **deux fronts** (JS vanilla et React) : la matrice E2E et les specs Playwright le vérifient sur du vrai HTTP et un vrai navigateur. [`smoke/`](smoke) fait de même contre les paquets **publiés**, et non les sources du workspace. La CI exécute build + typecheck + tests sur chaque PR ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) ; l'E2E navigateur tourne dans [`e2e.yml`](.github/workflows/e2e.yml).

## Feuille de route

La direction du projet : [ROADMAP.fr.md](ROADMAP.fr.md). Indicative, non engageante.

## Contribuer

Les contributions sont les bienvenues — voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

MIT
