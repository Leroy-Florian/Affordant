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

/**
 * Pagination metadata for a {@link HateoasCollection}. Every field is
 * optional — emit only what the server actually knows.
 */
export interface PageInfo {
  /** Total number of items across all pages, when known. */
  total?: number
  /** Number of items per page. */
  size?: number
  /** Zero-based index of the current page. */
  number?: number
}

/**
 * A list of resources enriched with hypermedia controls.
 *
 * `items` holds the already-enriched member resources. `_actions` carries
 * collection-level affordances; pagination links live here under the
 * standard rels `next`, `prev`, `first`, and `last`. An absent rel means
 * that page is not available (e.g. no `next` on the last page). `page`
 * surfaces optional pagination metadata.
 */
export interface HateoasCollection<T> {
  items: HateoasResource<T>[]
  _self?: HateoasAction
  _actions: Record<string, HateoasAction>
  page?: PageInfo
}
