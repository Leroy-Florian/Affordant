import type { HateoasAction, HateoasResource } from './types.js'

/**
 * Affordance predicate: is the server currently offering `rel` on this
 * resource? Drives conditional UI without duplicating authorization rules
 * client-side.
 */
export function can<T>(resource: HateoasResource<T> | null | undefined, rel: string): boolean {
  const actions = resource?._actions
  if (!actions) return false
  return Object.hasOwn(actions, rel)
}

/**
 * Returns the action descriptor for `rel`, or `null` when the server did
 * not offer it.
 */
export function actionFor<T>(
  resource: HateoasResource<T> | null | undefined,
  rel: string,
): HateoasAction | null {
  const actions = resource?._actions
  if (!actions || !Object.hasOwn(actions, rel)) return null
  return actions[rel] ?? null
}
