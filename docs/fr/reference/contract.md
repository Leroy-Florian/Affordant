# `@affordant/contract`

Les types du **contrat de fil** partagés. Zéro exécution, zéro dépendance — il ne livre que des `.d.ts`. Tous les autres paquets en dépendent, de sorte que le producteur (`@affordant/server`) et les consommateurs (`affordant`, `@affordant/react`) ne peuvent jamais diverger.

```sh
npm install @affordant/contract
```

Vous l'importez rarement directement : les paquets client et serveur réexportent ces mêmes types. Recourez-y quand vous écrivez du code qui se situe entre les deux côtés (un paquet de modèle partagé, un utilitaire de test).

```ts
import type { ActionField, HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'
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
  title?: string
  fields?: ActionField[]
}
```

Un descripteur d'action hypermédia : où (`href`), comment (`method`) et, optionnellement, quel corps de requête il accepte (`accepts`, un type de média — vaut `application/json` par défaut quand omis). Il peut aussi porter un `title` lisible (le texte du bouton/lien) et les champs d'entrée `fields` que le client doit afficher, afin que l'interface n'ait besoin d'aucune correspondance par rel.

## `ActionField`

```ts
interface ActionField {
  name: string
  type?: string
  required?: boolean
  label?: string
  value?: unknown
}
```

Une entrée qu'une action attend, pour que le client puisse afficher un champ de formulaire directement depuis le fil. `name` est la clé dans le corps soumis ; `type` est le genre d'entrée (`'text'`, `'number'`, `'boolean'`, … — vaut conceptuellement `'text'` par défaut) ; `required` marque une valeur obligatoire ; `label` est l'étiquette lisible ; `value` est une valeur par défaut ou pré-remplie.

## `HateoasResource<T>`

```ts
type HateoasResource<T> = T & {
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
}
```

Votre ressource `T`, enrichie de contrôles hypermédia. `_actions` associe une relation de lien (rel) à l'action que le serveur propose actuellement. Un rel absent signifie que l'action n'est pas disponible pour l'appelant à cet instant.

Voir [le contrat du fil](/fr/guide/wire-contract) pour la conception derrière ces types.
