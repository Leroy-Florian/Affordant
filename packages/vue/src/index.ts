import { computed, ref, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
import { actionFor, can, follow as vanillaFollow, type FollowInit } from 'affordant'
import type { HateoasAction, HateoasResource } from '@affordant/contract'

export type { HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'
export type { FollowInit } from 'affordant'

/** What the server currently offers for a `rel` on a resource. */
export interface Affordance {
  /** Whether the server offers this affordance right now. */
  readonly can: ComputedRef<boolean>
  /** The action descriptor, or `null` when not offered. */
  readonly action: ComputedRef<HateoasAction | null>
}

/**
 * Gate UI on an affordance. Pure and invoker-agnostic: it only reads what
 * the server offered, mirroring `can` / `actionFor` as reactive `computed`s.
 *
 * Both `resource` and `rel` accept refs, getters, or plain values, so the
 * returned `can` / `action` stay in sync as your data loads or changes.
 *
 * ```vue
 * <script setup lang="ts">
 * const { can, action } = useAffordance(order, 'cancel')
 * </script>
 *
 * <template>
 *   <button v-if="can">Cancel</button>
 * </template>
 * ```
 */
export function useAffordance<T>(
  resource: MaybeRefOrGetter<HateoasResource<T> | null | undefined>,
  rel: MaybeRefOrGetter<string>,
): Affordance {
  return {
    can: computed(() => can(toValue(resource), toValue(rel))),
    action: computed(() => actionFor(toValue(resource), toValue(rel))),
  }
}

export interface UseFollowResult {
  /** Whether a `run` is currently in flight. */
  readonly running: Ref<boolean>
  /** The error thrown by the last `run`, or `null`. */
  readonly error: Ref<unknown>
  /** Follow an action; resolves with the raw `Response`, re-throws on failure. */
  readonly run: (action: HateoasAction, init?: FollowInit) => Promise<Response>
}

/**
 * Follow an affordance from a composable: tracks `running` / `error` around the
 * client's `follow`. `run` resolves with the raw `Response` and re-throws on
 * failure (with `error` set).
 *
 * ```vue
 * <script setup lang="ts">
 * const cancel = useAffordance(order, 'cancel')
 * const { run, running } = useFollow()
 * </script>
 *
 * <template>
 *   <button :disabled="!cancel.can.value || running" @click="run(cancel.action.value!, { token })">
 *     Cancel
 *   </button>
 * </template>
 * ```
 */
export function useFollow(): UseFollowResult {
  const running = ref(false)
  const error = ref<unknown>(null)

  const run = async (action: HateoasAction, init?: FollowInit): Promise<Response> => {
    running.value = true
    error.value = null
    try {
      const response = await vanillaFollow(action, init)
      running.value = false
      return response
    } catch (err) {
      running.value = false
      error.value = err
      throw err
    }
  }

  return { running, error, run }
}
