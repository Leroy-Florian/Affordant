# `@affordant/react`

The React adapter. Gate UI on what the server offers, and invoke affordances with **either** invoker — the vanilla Promise one or the Effect one. The framework axis and the effect-system axis stay [orthogonal](/guide/invokers).

```sh
npm install @affordant/react react
```

`react` is a peer dependency. `effect`, `effect-react-bridge`, and `@affordant/effect` are **optional** peers, needed only for the [`/effect` subpath](#effect-subpath). The package re-exports the contract types and `FollowInit`.

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

A memoised, **invoker-agnostic** read: it wraps `can` and `actionFor` for the `(resource, rel)` you hold. Null-safe, so it is fine to call while data is still loading.

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

The **Promise** invoker as a hook. It tracks `running` / `error` around the client's [`follow`](/reference/api#follow); `run` resolves with the raw `Response` and re-throws on failure (with `error` set).

```tsx
const cancel = useAffordance(order, 'cancel')
const { run, running } = useFollow()

<button disabled={!cancel.can || running} onClick={() => run(cancel.action!, { token })}>
  Cancel
</button>
```

## The `/effect` subpath {#effect-subpath}

```ts
import { makeAffordanceHooks } from '@affordant/react/effect'
```

Runs the [Effect invoker](/reference/effect) through an [`effect-react-bridge`](/reference/effect-react-bridge) runtime. This is the thin Affordant-specific glue; the bridge itself stays domain-agnostic.

```ts
function makeAffordanceHooks<R>(hooks: EffectHooks<R>): AffordanceEffectHooks

interface AffordanceEffectHooks {
  useFollow(): EffectFollowResult
}

interface EffectFollowResult {
  readonly running: boolean
  readonly error: FollowError | null
  readonly run: (action: HateoasAction, init?: FollowInit) => Promise<Response>
}
```

```ts
import { makeEffectHooks } from 'effect-react-bridge'
import { makeAffordanceHooks } from '@affordant/react/effect'

const bridge = makeEffectHooks({ runtime })           // your ManagedRuntime
const { useFollow } = makeAffordanceHooks(bridge)
// useFollow().run(action, init) runs the Effect invoker, interruptible, with a typed error
```

Importing this subpath is what pulls in the optional Effect peers; the vanilla path above never touches them.
