# Côté serveur

Affordant est symétrique. Le client lit l'enveloppe `_self` / `_actions` ; le serveur l'émet. N'importe quel backend — n'importe quel langage, n'importe quel framework — qui émet l'enveloppe fonctionne, mais en Node vous n'avez pas à la fabriquer à la main : [`@affordant/server`](https://www.npmjs.com/package/@affordant/server) est le miroir côté serveur du client.

Trois règles en font une démarche qui en vaut la peine.

## 1. La visibilité d'un lien est l'autorisation (pour l'UI)

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

Quand `when` vaut `false`, le rel **n'est pas émis** — donc le `can(order, 'cancel')` du client renvoie `false`. Le frontend ne réimplémente jamais ce `if`. La présence du lien pilote ce que l'UI *propose*.

## 2. Le handler revérifie — l'affordance n'est **pas** un garde-fou

Une affordance décide ce que l'UI *affiche* ; elle ne décide jamais ce que le serveur *fait*. Le client maîtrise le DOM et le réseau : n'importe qui peut recréer le bouton masqué, rejouer la requête depuis la console, ou appeler l'endpoint directement avec `fetch()`. Donc **chaque route qui modifie l'état doit revérifier la même règle** avant d'agir — sinon masquer le lien n'est que de la poudre aux yeux.

Le piège, c'est la duplication : écrire la règle dans le `when` du serializer *et* à nouveau dans le handler invite les deux à diverger, ou à en oublier une. [`policy`](/fr/reference/server#policy) déclare la règle **une seule fois** et l'utilise des deux côtés :

```ts
import { policy, resource } from '@affordant/server'

// Déclarée une fois — la source unique de vérité.
const cancel = policy<{ me: string | null; order: Order }>('cancel', [
  { ok: (c) => c.me === c.order.ownerId,     status: 403, error: 'forbidden' },
  { ok: (c) => c.order.status === 'pending', status: 409, error: 'not cancellable' },
])

// Serializer — conditionne l'affordance (visibilité) :
function serializeOrder(order, ctx, route) {
  return resource(order)
    .self(route('orders.show', order.id))
    .offer(cancel, route('orders.cancel', order.id), ctx, { method: 'POST' })
}

// Handler — impose l'exécution (impossible à contourner en forgeant la requête) :
function cancelOrder(req, res) {
  const order = load(req.params.id)
  const denied = cancel.check({ me: callerId(req), order })
  if (denied) return res.status(denied.status).json({ error: denied.error })
  order.status = 'cancelled'
  // ...
}
```

Même `ctx`, mêmes règles — le bouton et le garde-fou ne peuvent plus se contredire. Les règles sont évaluées dans l'ordre, donc `check`/`authorize` signalent la première qui échoue, ce qui permet de distinguer `403 forbidden` de `409 not cancellable`.

## 3. Les URL proviennent de votre routeur

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
- **Revérifiez la même règle dans le handler** — l'affordance conditionne l'UI, le handler impose l'action. Une [`policy`](/fr/reference/server#policy) empêche les deux de diverger.
- Construisez `href` à partir de routes nommées ; ne concaténez jamais de chaînes du côté client du fil.

Voilà tout le contrat. Le côté client est documenté dans [le contrat du fil](/fr/guide/wire-contract).
