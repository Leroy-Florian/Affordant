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
  when?: boolean         // vaut true par défaut ; false omet entièrement le rel
}
```

`when` est là où vit l'autorisation. Quand il vaut `false`, l'action **n'est pas émise**, donc le `can(resource, rel)` du client renvoie `false`. La présence du lien *est* la permission. Appeler `.action` deux fois avec le même `rel` écrase le précédent.

### `.build()`

```ts
build(): HateoasResource<T>
```

Renvoie la ressource de fil enrichie. `_actions` est toujours présent (éventuellement vide) ; `_self` n'apparaît que si `.self()` a été appelé.

```ts
resource({ id: '8f3a2c', status: 'pending' })
  .self('/orders/8f3a2c')
  .action('cancel', '/orders/8f3a2c/cancel', { method: 'POST', when: false })
  .build()
// → { id: '8f3a2c', status: 'pending', _self: { href: '/orders/8f3a2c', method: 'GET' }, _actions: {} }
```

## `collection`

```ts
function collection<T extends object>(items: HateoasResource<T>[]): CollectionBuilder<T>
```

Le pendant en forme de liste de `resource`. Vous construisez d'abord chaque membre avec `resource()`, puis vous enveloppez le tableau. Les liens de pagination sont de simples actions : émettez-les avec `.action('next', href)`, `.action('prev', href)`, `.action('first', href)` et `.action('last', href)`.

```ts
import { collection, resource } from '@affordant/server'

collection(orders.map((o) => resource(o).self(route('orders.show', o.id)).build()))
  .self(route('orders.index'))
  .action('next', route('orders.index', { page: page + 1 }))
  .action('prev', route('orders.index', { page: page - 1 }), { when: page > 0 })
  .page({ total: 42, size: 20, number: page })
  .build()
```

## `CollectionBuilder<T>`

```ts
interface CollectionBuilder<T> {
  self(href: string, opts?: SelfOptions): CollectionBuilder<T>
  action(rel: string, href: string, opts?: ActionOptions): CollectionBuilder<T>
  page(info: PageInfo): CollectionBuilder<T>
  build(): HateoasCollection<T>
}
```

`.self` et `.action` reflètent exactement `ResourceBuilder` — mêmes `SelfOptions` / `ActionOptions`, y compris `when` pour l'autorisation-comme-visibilité. `.page(info)` attache des métadonnées de pagination optionnelles.

### `.build()`

```ts
build(): HateoasCollection<T>
```

Renvoie la collection de fil enrichie. `items` est transporté tel quel, `_actions` est toujours présent (éventuellement vide), et `_self` / `page` n'apparaissent que lorsqu'ils sont définis.

Voir [côté serveur](/fr/guide/server-side) pour les règles qui en font une démarche qui en vaut la peine.
