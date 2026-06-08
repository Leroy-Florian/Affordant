import type {
  HateoasAction,
  HateoasCollection,
  HateoasMethod,
  HateoasResource,
  PageInfo,
} from '@affordant/contract'

/** Options for a single affordance offered on a resource. */
export interface ActionOptions {
  /** HTTP verb the client must use. Defaults to `GET`. */
  method?: HateoasMethod
  /** Media type the action's body accepts. Omit for `application/json`. */
  accepts?: string
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

/**
 * Fluent builder for the collection envelope — the list-shaped sibling of
 * {@link ResourceBuilder}. Pagination links are plain actions: declare them
 * with `.action('next', href)`, `.action('prev', href)`, etc.
 */
export interface CollectionBuilder<T> {
  /** Set the canonical link clients use to refresh this collection. */
  self(href: string, opts?: SelfOptions): CollectionBuilder<T>
  /**
   * Offer `rel` at `href`. Use the standard pagination rels (`next`, `prev`,
   * `first`, `last`) for paging. When `opts.when` is `false` the action is
   * not emitted, so the client never sees it.
   */
  action(rel: string, href: string, opts?: ActionOptions): CollectionBuilder<T>
  /** Attach pagination metadata. */
  page(info: PageInfo): CollectionBuilder<T>
  /** Produce the enriched wire collection. `_actions` is always present (possibly empty). */
  build(): HateoasCollection<T>
}

/**
 * Start building the hypermedia envelope for a list of already-built items.
 * The caller builds each member with {@link resource}; pagination links are
 * emitted via `.action()` under the standard rels.
 *
 * ```ts
 * collection(orders.map((o) => resource(o).self(route('orders.show', o.id)).build()))
 *   .self(route('orders.index'))
 *   .action('next', route('orders.index', { page: 2 }))
 *   .action('prev', route('orders.index', { page: 0 }), { when: page > 0 })
 *   .page({ total: 42, size: 20, number: 1 })
 *   .build()
 * ```
 */
export function collection<T extends object>(
  items: HateoasResource<T>[],
): CollectionBuilder<T> {
  let self: HateoasAction | undefined
  let page: PageInfo | undefined
  const actions: Record<string, HateoasAction> = {}

  const builder: CollectionBuilder<T> = {
    self(href, opts) {
      self = { href, method: opts?.method ?? 'GET' }
      return builder
    },
    action(rel, href, opts) {
      if (opts?.when === false) return builder
      const action: HateoasAction = { href, method: opts?.method ?? 'GET' }
      if (opts?.accepts !== undefined) action.accepts = opts.accepts
      actions[rel] = action
      return builder
    },
    page(info) {
      page = info
      return builder
    },
    build() {
      return {
        items,
        _actions: actions,
        ...(self ? { _self: self } : {}),
        ...(page ? { page } : {}),
      }
    },
  }

  return builder
}
