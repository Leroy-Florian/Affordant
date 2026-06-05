# effect-react-bridge

Run [Effect](https://effect.website) programs inside [React](https://react.dev). A small, **domain-agnostic** bridge — no hypermedia, no Affordant coupling. It lives in this workspace for convenience but depends only on React and Effect.

- `makeEffectHooks({ runtime })` → `{ useEffectQuery, useEffectFn }`, bound to a `ManagedRuntime`.
- `useEffectQuery(factory, deps)` — run an Effect as a query: `{ data, error, loading, refresh }`. The fiber is interrupted on unmount or when deps change.
- `useEffectFn(factory)` — an imperative runner: `{ running, error, run }`.
- `RemoteData` — an ADT (`Idle | Loading | Loaded | Failed`) with `fromQuery` and `match`.

```ts
import { makeEffectHooks, RemoteData } from 'effect-react-bridge'

const { useEffectQuery } = makeEffectHooks({ runtime })

function OrderView({ id }: { id: string }) {
  const query = useEffectQuery(() => loadOrder(id), [id])
  return RemoteData.match(RemoteData.fromQuery(query), {
    onIdle: () => null,
    onLoading: () => <Spinner />,
    onLoaded: (order) => <Order order={order} />,
    onFailed: (e) => <ErrorBanner error={e} />,
  })
}
```

`effect` and `react` are peer dependencies.

## License

MIT
