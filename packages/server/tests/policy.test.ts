import { describe, expect, it } from 'vitest'
import { policy, PolicyError, resource } from '../src/index.js'

interface Order {
  id: string
  ownerId: string
  status: string
}

interface CancelCtx {
  me: string | null
  order: Order
}

const order: Order = { id: '8f3a2c', ownerId: 'u1', status: 'pending' }

const cancel = policy<CancelCtx>('cancel', [
  { ok: (c) => c.me === c.order.ownerId, status: 403, error: 'forbidden' },
  { ok: (c) => c.order.status === 'pending', status: 409, error: 'not cancellable' },
])

describe('policy', () => {
  it('exposes its rel', () => {
    expect(cancel.rel).toBe('cancel')
  })

  it('grants when every rule passes', () => {
    expect(cancel.granted({ me: 'u1', order })).toBe(true)
  })

  it('denies when any rule fails', () => {
    expect(cancel.granted({ me: 'someone-else', order })).toBe(false)
    expect(cancel.granted({ me: 'u1', order: { ...order, status: 'shipped' } })).toBe(false)
  })

  it('check() returns null when allowed', () => {
    expect(cancel.check({ me: 'u1', order })).toBeNull()
  })

  it('check() reports the first failing rule', () => {
    expect(cancel.check({ me: 'intruder', order })).toEqual({
      rel: 'cancel',
      status: 403,
      error: 'forbidden',
    })
    expect(cancel.check({ me: 'u1', order: { ...order, status: 'shipped' } })).toEqual({
      rel: 'cancel',
      status: 409,
      error: 'not cancellable',
    })
  })

  it('check() short-circuits at the first failure (order matters)', () => {
    // Not the owner AND not pending → only the first (403) is reported.
    expect(cancel.check({ me: 'intruder', order: { ...order, status: 'shipped' } })).toEqual({
      rel: 'cancel',
      status: 403,
      error: 'forbidden',
    })
  })

  it('authorize() is a no-op when allowed', () => {
    expect(() => cancel.authorize({ me: 'u1', order })).not.toThrow()
  })

  it('authorize() throws PolicyError carrying status/rel/error', () => {
    try {
      cancel.authorize({ me: 'intruder', order })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(PolicyError)
      const e = err as PolicyError
      expect(e.rel).toBe('cancel')
      expect(e.status).toBe(403)
      expect(e.error).toBe('forbidden')
    }
  })

  it('defaults the denial status to 403 when a rule omits it', () => {
    const p = policy<{ ok: boolean }>('x', [{ ok: (c) => c.ok, error: 'nope' }])
    expect(p.check({ ok: false })).toEqual({ rel: 'x', status: 403, error: 'nope' })
  })
})

describe('resource.offer (affordance gated by a policy)', () => {
  it('emits the action when the policy grants it', () => {
    const body = resource(order)
      .offer(cancel, '/orders/8f3a2c/cancel', { me: 'u1', order }, { method: 'POST' })
      .build()
    expect(body._actions.cancel).toEqual({ href: '/orders/8f3a2c/cancel', method: 'POST' })
  })

  it('omits the action when the policy denies it', () => {
    const body = resource(order)
      .offer(cancel, '/orders/8f3a2c/cancel', { me: 'intruder', order }, { method: 'POST' })
      .build()
    expect('cancel' in body._actions).toBe(false)
  })

  it('uses the policy rel as the action key', () => {
    const refund = policy<CancelCtx>('refund', [{ ok: () => true, error: 'x' }])
    const body = resource(order).offer(refund, '/r', { me: 'u1', order }).build()
    expect(Object.keys(body._actions)).toEqual(['refund'])
  })

  it('the affordance and the guard agree on the same ctx (no drift)', () => {
    // The whole point: whatever the serializer offers, the handler enforces.
    for (const ctx of [
      { me: 'u1', order },
      { me: 'intruder', order },
      { me: 'u1', order: { ...order, status: 'shipped' } },
    ] satisfies CancelCtx[]) {
      const offered = 'cancel' in resource(order).offer(cancel, '/c', ctx).build()._actions
      const allowed = cancel.check(ctx) === null
      expect(offered).toBe(allowed)
    }
  })
})
