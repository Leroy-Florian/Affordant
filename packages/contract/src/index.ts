/** HTTP methods a hypermedia action can carry. */
export type HateoasMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * A single input an action expects, so the client can render a form field
 * without re-deriving it from the rel. Pure metadata: no runtime, no deps.
 */
export interface ActionField {
  /** Field name, used as the key in the submitted body. */
  name: string
  /** Input kind — e.g. `'text'`, `'number'`, `'boolean'`. Conceptually defaults to `'text'`. */
  type?: string
  /** Whether the client must provide a value. */
  required?: boolean
  /** Human label to show next to the field. */
  label?: string
  /** A default or prefilled value for the field. */
  value?: unknown
}

/**
 * A hypermedia action descriptor emitted by the server: where (`href`),
 * how (`method`), and optionally what request body it accepts (`accepts`,
 * a media type — defaults to `application/json` when omitted). It may also
 * carry a human `title` (button/label text) and the input `fields` the
 * client should render, so the UI needs no per-rel mapping.
 */
export interface HateoasAction {
  href: string
  method: HateoasMethod
  accepts?: string
  /** Human-readable label for the action (button/link text). */
  title?: string
  /** Inputs the action expects, for the client to render as a form. */
  fields?: ActionField[]
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
