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
  offer<Ctx>(policy: Policy<Ctx>, href: string, ctx: Ctx, opts?: Omit<ActionOptions, 'when'>): ResourceBuilder<T>
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

`when` conditionne la *visibilité* de l'affordance. Quand il vaut `false`, l'action **n'est pas émise**, donc le `can(resource, rel)` du client renvoie `false`. Cela pilote l'UI — ce n'est **pas** une barrière de sécurité. Le handler doit revérifier la même règle (voir [`policy`](#policy)), car un client peut forger la requête quel que soit le rendu. Appeler `.action` deux fois avec le même `rel` écrase le précédent.

### `.offer(policy, href, ctx, opts?)`

Propose l'action d'une [`policy`](#policy) : conditionne la visibilité avec `policy.granted(ctx)` et utilise `policy.rel` comme relation, pour que l'affordance et le garde-fou du handler partagent une seule règle.

```ts
resource(order)
  .offer(cancelPolicy, route('orders.cancel', order.id), { me, order }, { method: 'POST' })
```

`opts` correspond à [`ActionOptions`](#actionoptions) sans `when` — la policy possède la visibilité.

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

## `policy`

```ts
function policy<Ctx>(rel: string, rules: PolicyRule<Ctx>[]): Policy<Ctx>
```

Déclare une règle d'autorisation **une seule fois** et l'impose des deux côtés du fil, pour que l'affordance (ce que l'UI affiche) et le garde-fou de la route (ce que le serveur fait) ne puissent pas diverger. Une affordance n'est jamais une barrière de sécurité — le client peut forger n'importe quelle requête — donc le handler doit revérifier la même règle.

```ts
import { policy, resource } from '@affordant/server'

interface CancelCtx { me: string | null; order: Order }

const cancel = policy<CancelCtx>('cancel', [
  { ok: (c) => c.me === c.order.ownerId,     status: 403, error: 'forbidden' },
  { ok: (c) => c.order.status === 'pending', status: 409, error: 'not cancellable' },
])

// Serializer — conditionne l'affordance :
resource(order).offer(cancel, route('orders.cancel', order.id), ctx, { method: 'POST' })

// Handler — impose l'exécution :
const denied = cancel.check({ me: callerId(req), order })
if (denied) return res.status(denied.status).json({ error: denied.error })
```

### `PolicyRule<Ctx>`

```ts
interface PolicyRule<Ctx> {
  ok: (ctx: Ctx) => boolean // la condition est satisfaite
  status?: number           // statut HTTP en cas d'échec ; vaut 403 par défaut
  error: string             // erreur lisible par machine en cas d'échec
}
```

### `Policy<Ctx>`

```ts
interface Policy<Ctx> {
  readonly rel: string
  granted(ctx: Ctx): boolean        // toutes les règles passent — à passer à `when` / `.offer`
  check(ctx: Ctx): PolicyDenial | null // première règle qui échoue, ou null
  authorize(ctx: Ctx): void         // lève PolicyError sur la première règle qui échoue
}
```

Les règles sont évaluées dans l'ordre ; `check` et `authorize` signalent la **première** qui échoue, vous permettant de garder `403 forbidden` distinct de `409 not cancellable`.

- `granted` — prédicat de visibilité pour le serializer (ou utilisez [`.offer`](#offer-policy-href-ctx-opts)).
- `check` — renvoie `{ rel, status, error }` (un `PolicyDenial`) ou `null` ; idéal pour un `if` explicite dans le handler.
- `authorize` — lève [`PolicyError`](#policyerror) (portant `rel`, `status`, `error`) pour un style middleware d'erreur.

### `PolicyError`

```ts
class PolicyError extends Error {
  readonly rel: string
  readonly status: number
  readonly error: string
}
```

Levée par `policy.authorize(ctx)`. Mappez-la vers une réponse dans le gestionnaire d'erreurs de votre framework.

Voir [côté serveur](/fr/guide/server-side) pour les règles qui en font une démarche qui en vaut la peine.
