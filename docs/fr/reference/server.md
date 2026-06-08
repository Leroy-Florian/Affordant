# `@affordant/server`

Le constructeur côté serveur de l'enveloppe `_self` / `_actions` — le miroir des `can` / `actionFor` du client. Indépendant du framework : la génération d'URL est injectée, il reste donc découplé de tout routeur.

```sh
npm install @affordant/server
```

```ts
import { resource } from '@affordant/server'

resource(order)
  .self(route('orders.show', order.id))
  .action('track', route('orders.tracking', order.id))
  .action('cancel', route('orders.cancel', order.id), {
    method: 'POST',
    when: caller.id === order.ownerId && order.status !== 'shipped',
  })
  .build()
```

Il réexporte les types de [`@affordant/contract`](/fr/reference/contract) par commodité.

## `resource`

```ts
function resource<T extends object>(data: T): ResourceBuilder<T>
```

Démarre un constructeur fluide sur un objet simple. `data` est transporté tel quel jusqu'à la ressource de fil finale.

## `ResourceBuilder<T>`

```ts
interface ResourceBuilder<T> {
  self(href: string, opts?: SelfOptions): ResourceBuilder<T>
  action(rel: string, href: string, opts?: ActionOptions): ResourceBuilder<T>
  build(): HateoasResource<T>
  buildAsync(): Promise<HateoasResource<T>>
}
```

### `.self(href, opts?)`

Définit le lien `_self` que les clients utilisent pour rafraîchir la ressource.

```ts
interface SelfOptions {
  method?: HateoasMethod // vaut 'GET' par défaut
}
```

### `.action(rel, href, opts?)`

Propose `rel` à `href`.

```ts
interface ActionOptions {
  method?: HateoasMethod // vaut 'GET' par défaut
  accepts?: string       // type de média de la requête ; omettre pour application/json
  when?: boolean | (() => boolean | Promise<boolean>) // vaut true par défaut
}
```

`when` est là où vit l'autorisation. Un résultat falsy signifie que l'action **n'est pas émise**, donc le `can(resource, rel)` du client renvoie `false`. La présence du lien *est* la permission. Appeler `.action` deux fois avec le même `rel` écrase le précédent.

`when` accepte trois formes :

- un `boolean` — une décision précalculée ;
- une fonction synchrone `() => boolean` — évaluée paresseusement au moment du `build` ;
- une fonction asynchrone `() => Promise<boolean>` — par exemple une requête en base, afin de ne pas avoir à tout précalculer à l'avance.

Les booléens et les fonctions synchrones fonctionnent avec `.build()`. Les fonctions asynchrones nécessitent [`.buildAsync()`](#buildasync) ; `.build()` lève une erreur claire s'il rencontre un prédicat qui renvoie une `Promise`.

```ts
resource(order)
  .action('refund', '/orders/8f3a2c/refund', {
    method: 'POST',
    when: async () => await payments.isRefundable(order.id),
  })
```

### `.build()`

```ts
build(): HateoasResource<T>
```

Renvoie la ressource de fil enrichie **de manière synchrone**. `_actions` est toujours présent (éventuellement vide) ; `_self` n'apparaît que si `.self()` a été appelé. Évalue chaque `when` qui est un `boolean` ou une fonction synchrone ; lève une erreur si une fonction `when` renvoie une `Promise` — utilisez `.buildAsync()` à la place.

```ts
resource({ id: '8f3a2c', status: 'pending' })
  .self('/orders/8f3a2c')
  .action('cancel', '/orders/8f3a2c/cancel', { method: 'POST', when: false })
  .build()
// → { id: '8f3a2c', status: 'pending', _self: { href: '/orders/8f3a2c', method: 'GET' }, _actions: {} }
```

### `.buildAsync()`

```ts
buildAsync(): Promise<HateoasResource<T>>
```

Comme `.build()`, mais attend la résolution des prédicats `when` asynchrones avant de produire l'enveloppe. Les prédicats booléens et synchrones fonctionnent ici aussi ; privilégiez donc `.buildAsync()` dès qu'un `when` d'action peut se résoudre de façon asynchrone.

```ts
const body = await resource(order)
  .action('refund', '/orders/8f3a2c/refund', {
    method: 'POST',
    when: async () => await payments.isRefundable(order.id),
  })
  .buildAsync()
```

Voir [côté serveur](/fr/guide/server-side) pour les règles qui en font une démarche qui en vaut la peine.
