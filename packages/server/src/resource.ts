import type { HateoasAction, HateoasMethod, HateoasResource } from '@affordant/contract'
import type { Policy } from './policy.js'

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
  /**
   * Offer a {@link Policy}'s action: gates visibility with `policy.granted(ctx)`
   * and uses `policy.rel` as the relation. The handler enforces the *same*
   * policy on the same `ctx`, so the affordance and the guard cannot drift.
   * `opts` is the usual {@link ActionOptions} minus `when` (the policy owns it).
   */
  offer<Ctx>(
    policy: Policy<Ctx>,
    href: string,
    ctx: Ctx,
    opts?: Omit<ActionOptions, 'when'>,
  ): ResourceBuilder<T>
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
    offer(policy, href, ctx, opts) {
      return builder.action(policy.rel, href, { ...opts, when: policy.granted(ctx) })
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
