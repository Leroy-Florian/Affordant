# @affordant/react

React adapter for [Affordant](https://leroy-florian.github.io/Affordant/). Gate your UI on what the server offers, and invoke affordances with **either invoker** — the vanilla Promise one or the Effect one. The framework axis (React) and the effect-system axis (Promise / Effect) stay orthogonal and composable.

## Gating (pure, invoker-agnostic)

```tsx
import { useAffordance } from '@affordant/react'

function CancelButton({ order }) {
  const cancel = useAffordance(order, 'cancel')
  if (!cancel.can) return null
  return <button onClick={...}>Cancel</button>
}
```

## Vanilla (Promise) invoker

```tsx
import { useAffordance, useFollow } from '@affordant/react'

const cancel = useAffordance(order, 'cancel')
const { run, running } = useFollow()

<button disabled={!cancel.can || running} onClick={() => run(cancel.action!, { token })}>
  Cancel
</button>
```

## Effect invoker

The Effect path composes [`@affordant/effect`](https://www.npmjs.com/package/@affordant/effect) with the [`effect-react-bridge`](https://www.npmjs.com/package/effect-react-bridge) runtime — no Effect coupling leaks into the vanilla path.

```ts
import { makeEffectHooks } from 'effect-react-bridge'
import { makeAffordanceHooks } from '@affordant/react/effect'

const bridge = makeEffectHooks({ runtime })
const { useFollow } = makeAffordanceHooks(bridge)
// useFollow().run(action, init) is now an interruptible Effect with a typed error
```

`react` is a peer dependency; `effect`, `effect-react-bridge` and `@affordant/effect` are optional peers, needed only for `@affordant/react/effect`.

## License

MIT
