# `@affordant/react`

The React adapter. Gate your UI on what the server offers, and follow affordances with hooks. No runtime dependency beyond React.

```sh
npm install @affordant/react react
```

`react` is a peer dependency. The package re-exports the contract types and `FollowInit`.

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

A memoised read: it wraps `can` and `actionFor` for the `(resource, rel)` you hold. Null-safe, so it is fine to call while data is still loading.

```tsx
const cancel = useAffordance(order, 'cancel')
return cancel.can ? <button onClick={...}>Cancel</button> : null
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

Follow an affordance from a hook. It tracks `running` / `error` around the client's [`follow`](/reference/api#follow); `run` resolves with the raw `Response` and re-throws on failure (with `error` set).

```tsx
const cancel = useAffordance(order, 'cancel')
const { run, running } = useFollow()

<button disabled={!cancel.can || running} onClick={() => run(cancel.action!, { token })}>
  Cancel
</button>
```

## Using Effect

There is no Effect-specific entry point, and none is needed: `run` (and the underlying `follow`) return a `Promise<Response>`, which drops into Effect with a one-line wrap — `Effect.tryPromise(() => follow(action, init))`. Affordant stays Effect-compatible without shipping an Effect dependency.
