# `@affordant/contract`

Les types du **contrat d'échange** partagés. Zéro exécution, zéro dépendance — il ne livre que des `.d.ts`. Tous les autres paquets en dépendent, de sorte que le producteur (`@affordant/server`) et les consommateurs (`affordant`, `@affordant/react`) ne peuvent jamais diverger.

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

Voir [le contrat d'échange](/fr/guide/wire-contract) pour la conception derrière ces types.
