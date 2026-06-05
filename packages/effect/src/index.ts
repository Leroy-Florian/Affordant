import { Data, Effect } from 'effect'
import { follow as vanillaFollow, type FollowInit } from 'affordant'
import type { HateoasAction } from '@affordant/contract'

export type { HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'
export { can, actionFor, type FollowInit } from 'affordant'

/** Typed failure raised when the underlying `fetch` rejects (network error, abort, ...). */
export class FollowError extends Data.TaggedError('FollowError')<{
  readonly cause: unknown
}> {}

/**
 * Effect-flavoured invoker: the same affordance call as the vanilla
 * `follow`, but returning an `Effect` with a typed error instead of a
 * rejecting promise. The Effect's `AbortSignal` is wired into the request,
 * so interrupting the fiber cancels the HTTP call.
 *
 * Note this resolves to the raw `Response` whatever its status — a non-2xx
 * response is a successful fetch. Decode and branch on `response.ok` in your
 * own pipeline if you want HTTP errors in the error channel.
 */
export function follow(
  action: HateoasAction,
  init?: FollowInit,
): Effect.Effect<Response, FollowError> {
  return Effect.tryPromise({
    try: (signal) => vanillaFollow(action, { ...init, signal }),
    catch: (cause) => new FollowError({ cause }),
  })
}
