import { describe, expect, it } from 'vitest'
import { actionFor, can, type HateoasResource } from '../src/index.js'

type Order = { id: string; total: number }

const order: HateoasResource<Order> = {
  id: '8f3a2c',
  total: 4200,
  _self: { href: '/orders/8f3a2c', method: 'GET' },
  _actions: {
    cancel: { href: '/orders/8f3a2c/cancel', method: 'POST' },
  },
}

describe('can', () => {
  it('returns true when the server offers the rel', () => {
    expect(can(order, 'cancel')).toBe(true)
  })

  it('returns false when the rel is absent', () => {
    expect(can(order, 'refund')).toBe(false)
  })

  it('returns false for null or undefined resources', () => {
    expect(can(null, 'cancel')).toBe(false)
    expect(can(undefined, 'cancel')).toBe(false)
  })

  it('returns false when _actions is missing', () => {
    expect(can({ id: 'x' } as never, 'cancel')).toBe(false)
  })

  it('ignores inherited properties on _actions', () => {
    const resource = {
      id: 'x',
      _actions: Object.create({
        cancel: { href: '/x', method: 'POST' },
      }) as Record<string, never>,
    }
    expect(can(resource, 'cancel')).toBe(false)
  })
})

describe('actionFor', () => {
  it('returns the descriptor when offered', () => {
    expect(actionFor(order, 'cancel')).toEqual({
      href: '/orders/8f3a2c/cancel',
      method: 'POST',
    })
  })

  it('returns null when not offered', () => {
    expect(actionFor(order, 'refund')).toBeNull()
  })

  it('returns null for null or undefined resources', () => {
    expect(actionFor(null, 'cancel')).toBeNull()
    expect(actionFor(undefined, 'cancel')).toBeNull()
  })

  it('returns null when _actions is missing', () => {
    expect(actionFor({ id: 'x' } as never, 'cancel')).toBeNull()
  })

  it('ignores inherited properties on _actions', () => {
    const resource = {
      id: 'x',
      _actions: Object.create({
        cancel: { href: '/x', method: 'POST' },
      }) as Record<string, never>,
    }
    expect(actionFor(resource, 'cancel')).toBeNull()
  })
})

describe('collection envelope', () => {
  const orders = {
    items: [],
    _self: { href: '/orders', method: 'GET' as const },
    _actions: {
      next: { href: '/orders?page=2', method: 'GET' as const },
    },
    page: { total: 42, size: 20, number: 1 },
  }

  it('can() reads a collection pagination rel', () => {
    expect(can(orders, 'next')).toBe(true)
    expect(can(orders, 'prev')).toBe(false)
  })

  it('actionFor() returns the collection pagination action', () => {
    expect(actionFor(orders, 'next')).toEqual({ href: '/orders?page=2', method: 'GET' })
    expect(actionFor(orders, 'prev')).toBeNull()
  })
})
