import type { HateoasAction } from '@affordant/contract'

/** Anything carrying an `_actions` map: a resource or a collection envelope. */
type Affordable = { _actions?: Record<string, HateoasAction> }

/**
 * Affordance predicate: is the server currently offering `rel` on this
 * resource? Drives conditional UI without duplicating authorization rules
 * client-side.
 *
 * Accepts anything carrying an `_actions` map, so it also reads a
 * collection's pagination rels (`next`, `prev`, `first`, `last`).
 */
export function can(resource: Affordable | null | undefined, rel: string): boolean {
  const actions = resource?._actions
  if (!actions) return false
  return Object.hasOwn(actions, rel)
}

/**
 * Returns the action descriptor for `rel`, or `null` when the server did
 * not offer it.
 *
 * Accepts anything carrying an `_actions` map, so it also reads a
 * collection's pagination rels (`next`, `prev`, `first`, `last`).
 */
export function actionFor(
  resource: Affordable | null | undefined,
  rel: string,
): HateoasAction | null {
  const actions = resource?._actions
  if (!actions || !Object.hasOwn(actions, rel)) return null
  return actions[rel] ?? null
}
