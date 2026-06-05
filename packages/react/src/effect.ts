import type { EffectHooks } from 'effect-react-bridge'
import { follow as effectFollow, type FollowError } from '@affordant/effect'
import type { FollowInit } from 'affordant'
import type { HateoasAction } from '@affordant/contract'

export interface EffectFollowResult {
  readonly running: boolean
  readonly error: FollowError | null
  readonly run: (action: HateoasAction, init?: FollowInit) => Promise<Response>
}

export interface AffordanceEffectHooks {
  /**
   * The Effect invoker as a hook, run through the supplied
   * `effect-react-bridge` runtime: tracks `running` / `error` and interrupts
   * the request when the component unmounts.
   */
  useFollow(): EffectFollowResult
}

/**
 * Compose the Effect invoker (`@affordant/effect`) with an
 * `effect-react-bridge` runtime to get React hooks. The bridge stays
 * domain-agnostic; this is the thin Affordant-specific glue.
 *
 * ```ts
 * const { useEffectFn } = makeEffectHooks({ runtime })
 * const affordances = makeAffordanceHooks({ useEffectFn } as EffectHooks<never>)
 * ```
 */
export function makeAffordanceHooks<R>(hooks: EffectHooks<R>): AffordanceEffectHooks {
  return {
    useFollow() {
      const { running, error, run } = hooks.useEffectFn(
        (action: HateoasAction, init?: FollowInit) => effectFollow(action, init),
      )
      return { running, error, run }
    },
  }
}
