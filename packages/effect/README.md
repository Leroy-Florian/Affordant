# @affordant/effect

The **Effect-flavoured invoker** for [Affordant](https://leroy-florian.github.io/Affordant/). Same affordance call as the vanilla [`affordant`](https://www.npmjs.com/package/affordant) `follow`, but it returns an [`Effect`](https://effect.website) with a typed error channel instead of a rejecting promise.

`can` / `actionFor` are pure and stay vanilla — only the effectful invocation (`follow`) is the seam where Effect matters. This package is one of the two interchangeable invokers; the other is the Promise-based `follow` from `affordant`.

```ts
import { Effect } from 'effect'
import { can, actionFor } from 'affordant'
import { follow, FollowError } from '@affordant/effect'

const program = can(order, 'cancel')
  ? follow(actionFor(order, 'cancel')!, { token, body: { reason: 'changed my mind' } })
  : Effect.void

// typed errors, interruptible: cancelling the fiber aborts the request
const program2 = program.pipe(
  Effect.catchTag('FollowError', (e) => Effect.logError(e.cause)),
)
```

`follow` resolves to the raw `Response` whatever its status (a non-2xx response is still a completed fetch). Branch on `response.ok` in your own pipeline to lift HTTP errors into the error channel.

`effect` is a peer dependency.

## License

MIT
