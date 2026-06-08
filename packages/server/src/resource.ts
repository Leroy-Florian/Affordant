import type { HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'

/** Options for a single affordance offered on a resource. */
export interface ActionOptions {
  /** HTTP verb the client must use. Defaults to `GET`. */
  method?: HateoasMethod
  /** Media type the action's body accepts. Omit for `application/json`. */
  accepts?: string
  /**
   * Whether to actually offer this action. A falsy result omits the rel
   * entirely, so the client's `can(resource, rel)` returns `false`. This is
   * where authorization lives: presence of the link *is* the permission.
   *
   * Accepts:
   * - a `boolean` — a precomputed decision;
   * - a sync function `() => boolean` — evaluated lazily at build time;
   * - an async function `() => Promise<boolean>` — e.g. a DB lookup, resolved
   *   lazily so callers don't have to precompute everything.
   *
   * Synchronous predicates (boolean or sync function) work with `build()`.
   * If a predicate returns a `Promise`, you must call `buildAsync()` instead;
   * `build()` throws a clear error in that case.
   *
   * Defaults to `true`.
   */
  when?: boolean | (() => boolean | Promise<boolean>)
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
  /**
   * Produce the enriched wire resource synchronously. `_actions` is always
   * present (possibly empty).
   *
   * Evaluates each action's `when` predicate when it is a `boolean` or a sync
   * function returning a `boolean`. If a `when` function returns a `Promise`,
   * `build()` throws — use {@link ResourceBuilder.buildAsync} instead.
   */
  build(): HateoasResource<T>
  /**
   * Produce the enriched wire resource, awaiting any async `when` predicates.
   * Use this whenever an action's `when` may resolve asynchronously (e.g. a
   * DB lookup). Boolean and sync-function predicates work here too.
   *
   * `_actions` is always present (possibly empty).
   */
  buildAsync(): Promise<HateoasResource<T>>
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

  interface DeclaredAction {
    rel: string
    action: HateoasAction
    when: ActionOptions['when']
  }
  const declared: DeclaredAction[] = []

  /** Build a wire action from a declaration. */
  const toAction = (rel: string, href: string, opts?: ActionOptions): HateoasAction => {
    const action: HateoasAction = { href, method: opts?.method ?? 'GET' }
    if (opts?.accepts !== undefined) action.accepts = opts.accepts
    return action
  }

  const envelope = (actions: Record<string, HateoasAction>): HateoasResource<T> =>
    ({
      ...data,
      _actions: actions,
      ...(self ? { _self: self } : {}),
    }) as HateoasResource<T>

  const builder: ResourceBuilder<T> = {
    self(href, opts) {
      self = { href, method: opts?.method ?? 'GET' }
      return builder
    },
    action(rel, href, opts) {
      declared.push({ rel, action: toAction(rel, href, opts), when: opts?.when })
      return builder
    },
    build() {
      const actions: Record<string, HateoasAction> = {}
      for (const { rel, action, when } of declared) {
        const decision = typeof when === 'function' ? when() : when
        if (decision instanceof Promise) {
          throw new Error(
            `Action "${rel}" has an async \`when\` predicate; call buildAsync() instead of build().`,
          )
        }
        if (decision === false) continue
        actions[rel] = action
      }
      return envelope(actions)
    },
    async buildAsync() {
      const actions: Record<string, HateoasAction> = {}
      for (const { rel, action, when } of declared) {
        const decision = await (typeof when === 'function' ? when() : when)
        if (decision === false) continue
        actions[rel] = action
      }
      return envelope(actions)
    },
  }

  return builder
}
