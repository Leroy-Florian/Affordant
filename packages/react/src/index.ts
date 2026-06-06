import { useCallback, useMemo, useState } from 'react'
import { actionFor, can, follow as vanillaFollow, type FollowInit } from 'affordant'
import type { HateoasAction, HateoasResource } from '@affordant/contract'

export type { HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'
export type { FollowInit } from 'affordant'

/** What the server currently offers for a `rel` on a resource. */
export interface Affordance {
  /** Whether the server offers this affordance right now. */
  readonly can: boolean
  /** The action descriptor, or `null` when not offered. */
  readonly action: HateoasAction | null
}

/**
 * Gate UI on an affordance. Pure and invoker-agnostic: it only reads what
 * the server offered, mirroring `can` / `actionFor` as a memoised hook.
 *
 * ```tsx
 * const cancel = useAffordance(order, 'cancel')
 * return cancel.can ? <button onClick={...}>Cancel</button> : null
 * ```
 */
export function useAffordance<T>(
  resource: HateoasResource<T> | null | undefined,
  rel: string,
): Affordance {
  return useMemo(
    () => ({ can: can(resource, rel), action: actionFor(resource, rel) }),
    [resource, rel],
  )
}

export interface FollowState {
  readonly running: boolean
  readonly error: unknown
}

export interface UseFollowResult extends FollowState {
  readonly run: (action: HateoasAction, init?: FollowInit) => Promise<Response>
}

/**
 * Follow an affordance from a hook: tracks `running` / `error` around the
 * client's `follow`. `run` resolves with the raw `Response` and re-throws on
 * failure (with `error` set).
 */
export function useFollow(): UseFollowResult {
  const [state, setState] = useState<FollowState>({ running: false, error: null })

  const run = useCallback(async (action: HateoasAction, init?: FollowInit) => {
    setState({ running: true, error: null })
    try {
      const response = await vanillaFollow(action, init)
      setState({ running: false, error: null })
      return response
    } catch (error) {
      setState({ running: false, error })
      throw error
    }
  }, [])

  return { ...state, run }
}
