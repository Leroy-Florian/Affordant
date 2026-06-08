# `@affordant/contract`

Les types du **contrat de fil** partagés. Zéro exécution, zéro dépendance — il ne livre que des `.d.ts`. Tous les autres paquets en dépendent, de sorte que le producteur (`@affordant/server`) et les consommateurs (`affordant`, `@affordant/react`) ne peuvent jamais diverger.

```sh
npm install @affordant/contract
```

Vous l'importez rarement directement : les paquets client et serveur réexportent ces mêmes types. Recourez-y quand vous écrivez du code qui se situe entre les deux côtés (un paquet de modèle partagé, un utilitaire de test).

```ts
import type { HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'
```

## `HateoasMethod`

```ts
type HateoasMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
```

Les verbes HTTP qu'une action peut porter.

## `HateoasAction`

```ts
interface HateoasAction {
  href: string
  method: HateoasMethod
  accepts?: string
}
```

Un descripteur d'action hypermédia : où (`href`), comment (`method`) et, optionnellement, quel corps de requête il accepte (`accepts`, un type de média — vaut `application/json` par défaut quand omis).

## `HateoasResource<T>`

```ts
type HateoasResource<T> = T & {
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
}
```

Votre ressource `T`, enrichie de contrôles hypermédia. `_actions` associe une relation de lien (rel) à l'action que le serveur propose actuellement. Un rel absent signifie que l'action n'est pas disponible pour l'appelant à cet instant.

## `PageInfo`

```ts
interface PageInfo {
  total?: number
  size?: number
  number?: number
}
```

Métadonnées de pagination optionnelles pour une collection : le nombre `total` d'éléments sur toutes les pages, la taille de page `size` et le `number` (indexé à zéro) de la page courante. N'émettez que ce que le serveur connaît réellement.

## `HateoasCollection<T>`

```ts
interface HateoasCollection<T> {
  items: HateoasResource<T>[]
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
  page?: PageInfo
}
```

Une liste de ressources, enrichie de contrôles hypermédia. `items` contient les membres déjà enrichis. `_actions` porte les affordances au niveau de la collection ; les liens de pagination s'y trouvent sous les rels standards `next`, `prev`, `first` et `last`. Un rel absent signifie que cette page n'est pas disponible (par ex. pas de `next` sur la dernière page). `page` expose des métadonnées de pagination optionnelles.

Voir [le contrat du fil](/fr/guide/wire-contract) pour la conception derrière ces types.
