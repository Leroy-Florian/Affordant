/** HTTP methods a hypermedia action can carry. */
export type HateoasMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * A hypermedia action descriptor emitted by the server: where (`href`),
 * how (`method`), and optionally what request body it accepts (`accepts`,
 * a media type — defaults to `application/json` when omitted).
 */
export interface HateoasAction {
  href: string
  method: HateoasMethod
  accepts?: string
}

/**
 * A resource enriched with hypermedia controls.
 *
 * `_actions` maps a link relation (rel) to the action the server is
 * currently offering. An absent rel means the action is not available to
 * the caller right now (not authorized, wrong state, feature off, ...).
 */
export type HateoasResource<T> = T & {
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
}
