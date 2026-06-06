# `affordant`

Le client : lire les actions que le serveur propose, conditionner votre UI sur elles, les suivre. Zéro dépendance d'exécution. Pour les autres paquets, voir [`@affordant/react`](/fr/reference/react), [`@affordant/server`](/fr/reference/server) et le [`@affordant/contract`](/fr/reference/contract) partagé.

Tout est exporté depuis la racine du paquet :

```ts
import {
  can,
  actionFor,
  follow,
  type HateoasResource,
  type HateoasAction,
  type HateoasMethod,
  type FollowInit,
  type BearerToken,
} from 'affordant'
```

## Types

### `HateoasMethod`

```ts
type HateoasMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
```

Les verbes HTTP qu'une action peut porter.

### `HateoasAction`

```ts
interface HateoasAction {
  href: string
  method: HateoasMethod
  accepts?: string
}
```

Un descripteur d'action hypermédia : où (`href`), comment (`method`) et, optionnellement, quel corps de requête il accepte (`accepts`, un type de média — vaut `application/json` par défaut quand omis).

### `HateoasResource<T>`

```ts
type HateoasResource<T> = T & {
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
}
```

Votre ressource `T`, enrichie de contrôles hypermédia. `_actions` associe une relation de lien (rel) à l'action que le serveur propose actuellement. Un rel absent signifie que l'action n'est pas disponible pour l'appelant à cet instant.

## Fonctions

### `can`

```ts
function can<T>(resource: HateoasResource<T> | null | undefined, rel: string): boolean
```

Prédicat de disponibilité : le serveur propose-t-il actuellement `rel` sur cette ressource ? Pilote l'UI conditionnelle sans dupliquer les règles d'autorisation côté client.

- Renvoie `false` pour les ressources `null` / `undefined` et pour les ressources sans `_actions`.
- Seules les propriétés propres de `_actions` comptent — les propriétés héritées sont ignorées.

```ts
can(order, 'cancel') // → true | false
```

### `actionFor`

```ts
function actionFor<T>(
  resource: HateoasResource<T> | null | undefined,
  rel: string,
): HateoasAction | null
```

Renvoie le descripteur d'action pour `rel`, ou `null` quand le serveur ne l'a pas proposé. Même sûreté vis-à-vis de `null` que `can`.

```ts
const action = actionFor(order, 'cancel')
// → { href: '/orders/8f3a2c/cancel', method: 'POST' } | null
```

### `follow`

```ts
function follow(action: HateoasAction, init?: FollowInit): Promise<Response>
```

Invoque une action hypermédia avec `fetch` vanilla. Il construit la requête à partir du descripteur d'action (`method` + `href` + `accepts`), injecte le bearer token s'il est fourni, et encode le corps en JSON quand l'action accepte du JSON. Renvoie la `Response` brute — c'est vous qui décidez comment la lire.

Comme c'est une simple fonction qui renvoie une `Promise`, elle est **compatible avec Effect** d'emblée : emballez-la avec `Effect.tryPromise(() => follow(action, init))` si vous travaillez avec [Effect](https://effect.website). Affordant ne porte aucune dépendance Effect — l'interopérabilité, c'est à vous de l'ajouter quand vous le voulez.

```ts
const res = await follow(actionFor(order, 'cancel')!, {
  token: () => localStorage.getItem('token'),
  body: { reason: 'changed my mind' },
})
if (res.ok) { /* … */ }
```

#### `FollowInit`

```ts
interface FollowInit {
  body?: unknown
  token?: BearerToken | null
  headers?: Record<string, string>
  signal?: AbortSignal
  fetch?: typeof globalThis.fetch
}
```

| Champ | Comportement |
|---|---|
| `body` | Quand il est défini, envoyé comme corps de la requête. Encodé en JSON si le `accepts` de l'action est un type de média JSON (par défaut), sinon transmis tel quel. Quand omis, aucun corps ni `Content-Type` n'est envoyé. |
| `token` | Bearer token, ajouté en `Authorization: Bearer <token>`. Omis quand falsy (voir `BearerToken`). |
| `headers` | En-têtes de requête supplémentaires. Ils écrasent les valeurs par défaut d'Affordant (par ex. `Accept`). |
| `signal` | Un `AbortSignal`, transmis à `fetch`. |
| `fetch` | Une implémentation `fetch` personnalisée (SSR, polyfills, tests). Vaut `globalThis.fetch` par défaut. |

#### `BearerToken`

```ts
type BearerToken = string | (() => string | null | undefined)
```

Une simple chaîne, ou un **getter paresseux** invoqué au moment de la requête. Le getter permet aux couches d'authentification de distribuer des tokens éphémères sans se coupler à un framework ou à une bibliothèque d'enveloppement de secrets. Quand la valeur (ou le résultat du getter) est `null` / `undefined`, aucun en-tête `Authorization` n'est envoyé.
