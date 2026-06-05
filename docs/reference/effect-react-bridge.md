# `effect-react-bridge`

Run [Effect](https://effect.website) programs inside [React](https://react.dev). A small, **domain-agnostic** bridge — no hypermedia, no Affordant coupling. It lives in this workspace for convenience and because `@affordant/react`'s Effect path composes with it, but it depends only on React and Effect, and you can use it on its own.

```sh
npm install effect-react-bridge effect react
```

`effect` and `react` are peer dependencies.

## `makeEffectHooks`

```ts
function makeEffectHooks<R>(options: EffectHooksOptions<R>): EffectHooks<R>

interface EffectHooksOptions<R> {
  readonly runtime: ManagedRuntime.ManagedRuntime<R, never>
  readonly onError?: (error: unknown) => void
}
```

Binds the hooks to a `ManagedRuntime`, so every Effect runs with your services (`R`) provided. `onError` is called with the typed failure whenever a query or function errors.

```ts
import { makeEffectHooks } from 'effect-react-bridge'

const { useEffectQuery, useEffectFn } = makeEffectHooks({ runtime })
```

## `useEffectQuery`

```ts
useEffectQuery<A, E>(
  factory: () => Effect.Effect<A, E, R>,
  deps: ReadonlyArray<unknown>,
): EffectQueryResult<A, E>

interface EffectQueryResult<A, E> {
  readonly data: A | null
  readonly error: E | null
  readonly loading: boolean
  readonly refresh: () => void
}
```

Runs `factory()` as a query whenever `deps` change. The fiber is **interrupted on unmount** or when deps change, so in-flight work is cancelled cleanly. Call `refresh()` to re-run on demand.

## `useEffectFn`

```ts
useEffectFn<A, E, Args extends ReadonlyArray<unknown>>(
  factory: (...args: Args) => Effect.Effect<A, E, R>,
): EffectFnResult<A, E, Args>

interface EffectFnResult<A, E, Args> {
  readonly running: boolean
  readonly error: E | null
  readonly run: (...args: Args) => Promise<A>
}
```

An imperative runner for actions (submit, delete, …). `run(...)` executes the Effect and resolves with its success value, tracking `running` / `error`.

## `RemoteData`

An ADT for rendering a query's four states without nested ternaries.

```ts
type RemoteData<E, A> =
  | { readonly _tag: 'Idle' }
  | { readonly _tag: 'Loading' }
  | { readonly _tag: 'Loaded'; readonly value: A }
  | { readonly _tag: 'Failed'; readonly error: E }
```

| Member | Signature |
|---|---|
| `RemoteData.idle()` / `loading()` | construct the empty states |
| `RemoteData.loaded(value)` / `failed(error)` | construct the populated states |
| `RemoteData.fromQuery(state)` | map an `EffectQueryState` (`{ data, error, loading }`) to a `RemoteData` |
| `RemoteData.match(rd, handlers)` | exhaustively fold over the four variants |

```tsx
const query = useEffectQuery(() => loadOrder(id), [id])

return RemoteData.match(RemoteData.fromQuery(query), {
  onIdle: () => null,
  onLoading: () => <Spinner />,
  onLoaded: (order) => <Order order={order} />,
  onFailed: (e) => <ErrorBanner error={e} />,
})
```
