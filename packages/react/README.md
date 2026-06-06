# @affordant/react

React adapter for [Affordant](https://leroy-florian.github.io/Affordant/). Gate your UI on what the server offers, and follow affordances with hooks. No runtime dependency beyond React.

## Install

```sh
npm install @affordant/react react
```

## Gating

```tsx
import { useAffordance } from '@affordant/react'

function CancelButton({ order }) {
  const cancel = useAffordance(order, 'cancel')
  if (!cancel.can) return null
  return <button onClick={...}>Cancel</button>
}
```

## Following

```tsx
import { useAffordance, useFollow } from '@affordant/react'

const cancel = useAffordance(order, 'cancel')
const { run, running } = useFollow()

<button disabled={!cancel.can || running} onClick={() => run(cancel.action!, { token })}>
  Cancel
</button>
```

`run` resolves with the raw `Response` and re-throws on failure, with `error` set.

## Using Effect

There is no Effect entry point, and none is needed: `run` (and the underlying `follow`) return a `Promise<Response>`, which drops into Effect with a one-line wrap — `Effect.tryPromise(() => follow(action, init))`. Affordant stays Effect-compatible without shipping an Effect dependency.

## API

| Export | Description |
|---|---|
| `useAffordance(resource, rel)` | `{ can, action }` — memoised, null-safe gating over `can` / `actionFor`. |
| `useFollow()` | `{ running, error, run }` — follow an action, tracking request state. |

`react` is a peer dependency.

## License

MIT
