import type { ActionField, HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'

/** Options for a single affordance offered on a resource. */
export interface ActionOptions {
  /** HTTP verb the client must use. Defaults to `GET`. */
  method?: HateoasMethod
  /** Media type the action's body accepts. Omit for `application/json`. */
  accepts?: string
  /** Human-readable label for the action (button/link text). */
  title?: string
  /** Inputs the action expects, for the client to render as a form. */
  fields?: ActionField[]
  /**
   * Whether to actually offer this action. `false` omits the rel entirely,
   * so the client's `can(resource, rel)` returns `false`. This is where
   * authorization lives: presence of the link *is* the permission.
   *
   * Defaults to `true`.
   */
  when?: boolean
}

/** Options for the `_self` link. */
export interface SelfOptions {
  /** HTTP verb to refresh the resource. Defaults to `GET`. */
  method?: HateoasMethod
}

/**
 * Fluent builder for the `_self` / `_actions` envelope. The server-side
 * mirror of the client's `can` / `actionFor`: declare each affordance once,
 * gate it on authoritative state via `when`, and `build()` the wire body.
 */
export interface ResourceBuilder<T> {
  /** Set the canonical link clients use to refresh this resource. */
  self(href: string, opts?: SelfOptions): ResourceBuilder<T>
  /**
   * Offer `rel` at `href`. When `opts.when` is `false` the action is not
   * emitted, so the client never sees it.
   */
  action(rel: string, href: string, opts?: ActionOptions): ResourceBuilder<T>
  /** Produce the enriched wire resource. `_actions` is always present (possibly empty). */
  build(): HateoasResource<T>
}

/**
 * Start building the hypermedia envelope for `data`.
 *
 * ```ts
 * resource(order)
 *   .self(route('orders.show', order.id))
 *   .action('track',  route('orders.tracking', order.id))
 *   .action('cancel', route('orders.cancel', order.id), {
 *     method: 'POST',
 *     when: caller.id === order.ownerId && order.status !== 'shipped',
 *   })
 *   .build()
 * ```
 */
export function resource<T extends object>(data: T): ResourceBuilder<T> {
  let self: HateoasAction | undefined
  const actions: Record<string, HateoasAction> = {}

  const builder: ResourceBuilder<T> = {
    self(href, opts) {
      self = { href, method: opts?.method ?? 'GET' }
      return builder
    },
    action(rel, href, opts) {
      if (opts?.when === false) return builder
      const action: HateoasAction = { href, method: opts?.method ?? 'GET' }
      if (opts?.accepts !== undefined) action.accepts = opts.accepts
      if (opts?.title !== undefined) action.title = opts.title
      if (opts?.fields !== undefined) action.fields = opts.fields
      actions[rel] = action
      return builder
    },
    build() {
      return {
        ...data,
        _actions: actions,
        ...(self ? { _self: self } : {}),
      } as HateoasResource<T>
    },
  }

  return builder
}
