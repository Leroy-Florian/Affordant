# Côté serveur

Affordant est symétrique. Le client lit l'enveloppe `_self` / `_actions` ; le serveur l'émet. N'importe quel backend — n'importe quel langage, n'importe quel framework — qui émet l'enveloppe fonctionne, mais en Node vous n'avez pas à la fabriquer à la main : [`@affordant/server`](https://www.npmjs.com/package/@affordant/server) est le miroir côté serveur du client.

Deux règles en font une démarche qui en vaut la peine.

## 1. La visibilité d'un lien est l'autorisation

N'émettez qu'une action que l'appelant a le droit d'exécuter, décidé **côté serveur, à chaque réponse**. L'endpoint qui construit la ressource connaît déjà l'identité de l'appelant, l'état de la ressource et les flags de fonctionnalités actifs — c'est donc le bon endroit pour décider quelles actions exposer.

Avec `@affordant/server`, vous déclarez chaque affordance une fois et la conditionnez avec `when` :

```ts
import { resource } from '@affordant/server'

function serializeOrder(order, caller, route) {
  return resource(order)
    .self(route('orders.show', order.id))
    .action('track', route('orders.tracking', order.id))
    .action('cancel', route('orders.cancel', order.id), {
      method: 'POST',
      when: caller.id === order.ownerId && order.status !== 'shipped',
    })
    .build()
}
```

Quand `when` vaut `false`, le rel **n'est pas émis** — donc le `can(order, 'cancel')` du client renvoie `false`. Le frontend ne réimplémente jamais ce `if`. La présence du lien *est* la permission.

## 2. Les URL proviennent de votre routeur

Générez chaque `href` à partir d'une **route nommée**, jamais d'une chaîne codée en dur. Renommer ou remonter une route met alors à jour chaque lien automatiquement, et les clients suivent sans déploiement.

Cette fonction `route(...)` est la seule pièce couplée au framework, elle reste donc injectée — gardant `@affordant/server` indépendant du framework. De fins adaptateurs la branchent :

- [`@affordant/express`](https://www.npmjs.com/package/@affordant/express) envoie l'enveloppe depuis un contrôleur et construit des URL absolues à partir de la requête.
- D'autres adaptateurs (Fastify, Nest, Hono, …) suivent la même forme.

## Le faire à la main

Vous n'êtes *jamais obligé* d'utiliser `@affordant/server`. Tout code qui renvoie la forme ci-dessous est un producteur valide :

```ts
return {
  ...order,
  _self: { href: route('orders.show', order.id), method: 'GET' },
  _actions: caller.id === order.ownerId
    ? { cancel: { href: route('orders.cancel', order.id), method: 'POST' } }
    : {},
}
```

## N'importe quel langage, n'importe quelle stack

L'enveloppe est le seul contrat — `@affordant/server` est une commodité, pas une obligation. Un backend en **pur Node JS** peut l'émettre avec un simple littéral objet et aucune dépendance Affordant. Un backend dans **n'importe quel autre langage** aussi : Python, Go, Ruby, .NET. Le client ne se soucie que du JSON `_self` / `_actions` qu'il reçoit, donc un utilitaire compagnon sur n'importe quelle stack n'est que de l'ergonomie sur le même contrat de fil.

## Liste de contrôle pour émettre l'enveloppe

- Chaque ressource porte `_self` (pour que les clients puissent la rafraîchir) et `_actions` (éventuellement vide).
- Chaque action est `{ href, method, accepts? }`. Définissez `accepts` quand le corps n'est pas `application/json`.
- Décidez de la présence de chaque action à partir de l'**état faisant autorité côté serveur** — identité, état de la ressource, flags de fonctionnalités.
- Construisez `href` à partir de routes nommées ; ne concaténez jamais de chaînes du côté client du fil.

Voilà tout le contrat. Le côté client est documenté dans [le contrat du fil](/fr/guide/wire-contract).
