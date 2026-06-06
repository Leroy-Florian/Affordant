/**
 * Authorization as a single source of truth.
 *
 * Affordant gates an action's *visibility* with `action(..., { when })`. But an
 * affordance is never a security boundary: the client controls the DOM and the
 * network, so it can forge the request whether or not the button was rendered.
 * The action only truly happens if the **route handler** re-checks the same
 * rule and refuses otherwise.
 *
 * The danger is drift: the `when` predicate in the serializer and the guard in
 * the handler are written twice, and one can be changed — or forgotten —
 * without the other. A {@link Policy} removes that risk by defining the rule
 * once and exposing it to *both* sides:
 *
 *   - serializer: `policy.granted(ctx)` feeds `when` (or use {@link ResourceBuilder.offer})
 *   - handler:    `policy.check(ctx)` / `policy.authorize(ctx)` enforces execution
 *
 * Same `ctx`, same rules, no way for the two to disagree.
 */

/** One condition within a policy: a predicate plus how to report its denial. */
export interface PolicyRule<Ctx> {
  /** Returns `true` when this condition is satisfied for `ctx`. */
  ok: (ctx: Ctx) => boolean
  /** HTTP status to return when this condition fails. Defaults to `403`. */
  status?: number
  /** Machine-readable error to return when this condition fails. */
  error: string
}

/** Why a policy denied a caller. Returned by {@link Policy.check}. */
export interface PolicyDenial {
  /** The link relation that was denied (e.g. `'cancel'`). */
  rel: string
  /** HTTP status the framework should respond with. */
  status: number
  /** Machine-readable error string. */
  error: string
}

/** Thrown by {@link Policy.authorize} when a policy denies the caller. */
export class PolicyError extends Error {
  readonly rel: string
  readonly status: number
  /** The machine-readable error (distinct from {@link Error.message}). */
  readonly error: string

  constructor(denial: PolicyDenial) {
    super(`${denial.error}: ${denial.rel}`)
    this.name = 'PolicyError'
    this.rel = denial.rel
    this.status = denial.status
    this.error = denial.error
  }
}

/**
 * A named authorization rule, shared by the affordance and the handler so the
 * two can never drift. Build one with {@link policy}.
 */
export interface Policy<Ctx> {
  /** The link relation this policy gates. */
  readonly rel: string
  /**
   * `true` iff **every** rule passes. Feed this to the serializer's `when`
   * (or prefer {@link ResourceBuilder.offer}, which does it for you).
   */
  granted(ctx: Ctx): boolean
  /**
   * The first failing rule as a {@link PolicyDenial}, or `null` when allowed.
   * Use at the top of the route handler:
   *
   * ```ts
   * const denied = cancel.check(ctx)
   * if (denied) return res.status(denied.status).json({ error: denied.error })
   * ```
   */
  check(ctx: Ctx): PolicyDenial | null
  /**
   * Throw {@link PolicyError} for the first failing rule; no-op when allowed.
   * Convenient with an error-handling middleware that maps `PolicyError` to a
   * response.
   */
  authorize(ctx: Ctx): void
}

/**
 * Define an authorization rule once, then enforce it on both sides of the wire.
 *
 * ```ts
 * interface CancelCtx { me: string | null; order: Order }
 *
 * const cancel = policy<CancelCtx>('cancel', [
 *   { ok: (c) => c.me === c.order.ownerId,    status: 403, error: 'forbidden' },
 *   { ok: (c) => c.order.status === 'pending', status: 409, error: 'not cancellable' },
 * ])
 *
 * // serializer — gate the affordance:
 * resource(order).offer(cancel, route('orders.cancel', order.id), ctx, { method: 'POST' })
 *
 * // handler — enforce execution (cannot be bypassed by forging the request):
 * const denied = cancel.check(ctx)
 * if (denied) return res.status(denied.status).json({ error: denied.error })
 * ```
 *
 * Rules are evaluated in order; `check`/`authorize` report the first failure,
 * which lets you distinguish, say, `403 forbidden` from `409 not cancellable`.
 */
export function policy<Ctx>(rel: string, rules: PolicyRule<Ctx>[]): Policy<Ctx> {
  return {
    rel,
    granted(ctx) {
      return rules.every((rule) => rule.ok(ctx))
    },
    check(ctx) {
      for (const rule of rules) {
        if (!rule.ok(ctx)) {
          return { rel, status: rule.status ?? 403, error: rule.error }
        }
      }
      return null
    },
    authorize(ctx) {
      const denial = this.check(ctx)
      if (denial) throw new PolicyError(denial)
    },
  }
}
