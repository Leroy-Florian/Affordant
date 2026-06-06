# `@affordant/react`

L'adaptateur React. Conditionnez votre UI à ce que le serveur propose, et suivez les actions proposées avec des hooks. Aucune dépendance d'exécution au-delà de React.

```sh
npm install @affordant/react react
```

`react` est une dépendance peer. Le paquet réexporte les types du contrat et `FollowInit`.

## `useAffordance`

```ts
function useAffordance<T>(
  resource: HateoasResource<T> | null | undefined,
  rel: string,
): Affordance

interface Affordance {
  readonly can: boolean
  readonly action: HateoasAction | null
}
```

Une lecture mémoïsée : elle emballe `can` et `actionFor` pour le couple `(resource, rel)` que vous détenez. Sûre vis-à-vis de `null`, on peut donc l'appeler pendant que les données chargent encore.

```tsx
const cancel = useAffordance(order, 'cancel')
return cancel.can ? <button onClick={...}>Annuler</button> : null
```

## `useFollow`

```ts
function useFollow(): UseFollowResult

interface UseFollowResult {
  readonly running: boolean
  readonly error: unknown
  readonly run: (action: HateoasAction, init?: FollowInit) => Promise<Response>
}
```

Suivre une action proposée depuis un hook. Il suit `running` / `error` autour du [`follow`](/fr/reference/api#follow) du client ; `run` se résout avec la `Response` brute et relève l'erreur en cas d'échec (avec `error` renseigné).

```tsx
const cancel = useAffordance(order, 'cancel')
const { run, running } = useFollow()

<button disabled={!cancel.can || running} onClick={() => run(cancel.action!, { token })}>
  Annuler
</button>
```

## Utiliser Effect

Il n'y a pas de point d'entrée spécifique à Effect, et il n'en faut pas : `run` (et le `follow` sous-jacent) renvoient un `Promise<Response>`, qui s'intègre à Effect avec un emballage d'une ligne — `Effect.tryPromise(() => follow(action, init))`. Affordant reste compatible avec Effect sans embarquer de dépendance Effect.
