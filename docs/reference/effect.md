# `@affordant/effect`

The [Effect](https://effect.website)-flavoured invoker. The same affordance call as the vanilla [`follow`](/reference/api#follow), but it returns an `Effect` with a typed error channel instead of a rejecting promise. It is one of Affordant's two interchangeable [invokers](/guide/invokers).

```sh
npm install @affordant/effect effect
```

`effect` is a peer dependency. The pure reads (`can`, `actionFor`) stay vanilla — only the effectful invocation moves to Effect, so this package re-exports `can`, `actionFor`, `FollowInit`, and the contract types for convenience.

```ts
import { Effect } from 'effect'
import { can, actionFor } from 'affordant'
import { follow, FollowError } from '@affordant/effect'

const program = can(order, 'cancel')
  ? follow(actionFor(order, 'cancel')!, { token, body: { reason: 'changed my mind' } })
  : Effect.void
```

## `follow`

```ts
function follow(
  action: HateoasAction,
  init?: FollowInit,
): Effect.Effect<Response, FollowError>
```

Builds the request from the action descriptor exactly like the vanilla `follow` (same [`FollowInit`](/reference/api#followinit)), and wraps it in an `Effect`. The Effect's `AbortSignal` is wired into the request, so **interrupting the fiber cancels the HTTP call**.

`follow` resolves to the raw `Response` whatever its status — a non-2xx response is a *successful* fetch, not a failure. Decode and branch on `response.ok` in your own pipeline if you want HTTP errors in the error channel:

```ts
const ok = follow(action, init).pipe(
  Effect.filterOrFail(
    (res) => res.ok,
    (res) => new HttpError({ status: res.status }),
  ),
)
```

Only a rejected `fetch` (network error, abort) lands in the error channel, as a `FollowError`.

## `FollowError`

```ts
class FollowError extends Data.TaggedError('FollowError')<{ readonly cause: unknown }> {}
```

A tagged error (`_tag: 'FollowError'`) carrying the original `cause`. Match on it with `Effect.catchTag`:

```ts
follow(action, init).pipe(
  Effect.catchTag('FollowError', (e) => Effect.logError(e.cause)),
)
```

## Using it in React

Compose this invoker with the [`effect-react-bridge`](/reference/effect-react-bridge) runtime through [`@affordant/react/effect`](/reference/react#effect-subpath). See [Invokers: Promise & Effect](/guide/invokers).
