# Invokers: Promise & Effect

Almost everything in Affordant is **pure**. `can`, `actionFor`, and the server's `resource(...).build()` only transform data — they do nothing effectful. The single place an effect happens is the HTTP call. That place is the **invoker**.

```
can() / actionFor()   → pure        → effect-agnostic by construction
resource().build()    → pure        → effect-agnostic by construction
follow()              → effectful   → the one seam where the effect system matters
```

## The seam

An invoker takes an action descriptor and returns it wrapped in some effect container `F`:

```ts
type Invoker<F> = (action: HateoasAction, init?: FollowInit) => F
```

Affordant ships two, interchangeable at this single point:

| Invoker | Package | Returns |
|---|---|---|
| Promise | [`affordant`](/reference/api) (`follow`) | `Promise<Response>` |
| Effect | [`@affordant/effect`](/reference/effect) (`follow`) | `Effect<Response, FollowError>` |

```ts
// vanilla
import { follow } from 'affordant'
const res = await follow(action, { token, body })

// effect — same arguments, typed errors, fiber-interruptible
import { follow } from '@affordant/effect'
const program = follow(action, { token, body }) // Effect<Response, FollowError>
```

Both accept the **same** [`FollowInit`](/reference/api#followinit). The Effect one wires the fiber's `AbortSignal` into the request, so interrupting the fiber cancels the fetch.

## Why two axes, not a matrix

Consuming an affordance has two independent choices:

1. **UI framework** — React, Vue, Svelte, vanilla.
2. **Effect system** — vanilla `Promise` or `Effect`.

Because the only effectful seam is the invoker, these axes **compose** instead of multiplying. You don't need a `react-promise` package and a `react-effect` package and a `vue-effect` package. You need a React adapter built against `Invoker<F>`, and you hand it whichever invoker you want.

```
@affordant/react  ──built against──►  Invoker<F>  ◄──implemented by──  affordant        (F = Promise)
                                          ▲                            @affordant/effect (F = Effect)
                                          │
                              run via   effect-react-bridge  (only for the Effect path)
```

- `useFollow` from [`@affordant/react`](/reference/react) uses the **Promise** invoker. No Effect anywhere.
- `makeAffordanceHooks` from `@affordant/react/effect` runs the **Effect** invoker through an [`effect-react-bridge`](/reference/effect-react-bridge) runtime.

The Effect dependencies are optional peers, so the vanilla React path stays light — you only pay for Effect if you import the `/effect` subpath.

## Picking one

- Reach for the **Promise** invoker by default — it is zero-dependency and composes with whatever data layer you already use (TanStack Query, SWR, a plain `await`).
- Reach for the **Effect** invoker when you already run Effect: you get a typed error channel, structured concurrency, and interruption for free.
