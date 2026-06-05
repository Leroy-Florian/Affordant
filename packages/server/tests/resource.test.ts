import { describe, expect, it } from 'vitest'
import { resource } from '../src/index.js'

type Order = { id: string; total: number; status: string }

const order: Order = { id: '8f3a2c', total: 4200, status: 'pending' }

describe('resource builder', () => {
  it('always emits an _actions map, empty by default', () => {
    const body = resource(order).build()
    expect(body._actions).toEqual({})
    expect(body._self).toBeUndefined()
  })

  it('carries the original data through untouched', () => {
    const body = resource(order).build()
    expect(body.id).toBe('8f3a2c')
    expect(body.total).toBe(4200)
    expect(body.status).toBe('pending')
  })

  it('sets _self with GET by default', () => {
    const body = resource(order).self('/orders/8f3a2c').build()
    expect(body._self).toEqual({ href: '/orders/8f3a2c', method: 'GET' })
  })

  it('honours an explicit _self method', () => {
    const body = resource(order).self('/orders/8f3a2c', { method: 'PUT' }).build()
    expect(body._self?.method).toBe('PUT')
  })

  it('offers an action with GET by default', () => {
    const body = resource(order).action('track', '/orders/8f3a2c/tracking').build()
    expect(body._actions.track).toEqual({ href: '/orders/8f3a2c/tracking', method: 'GET' })
  })

  it('carries method and accepts when provided', () => {
    const body = resource(order)
      .action('upload', '/orders/8f3a2c/doc', { method: 'PUT', accepts: 'application/pdf' })
      .build()
    expect(body._actions.upload).toEqual({
      href: '/orders/8f3a2c/doc',
      method: 'PUT',
      accepts: 'application/pdf',
    })
  })

  it('omits accepts when not provided', () => {
    const body = resource(order).action('track', '/t').build()
    expect('accepts' in body._actions.track!).toBe(false)
  })

  it('emits the action when `when` is true', () => {
    const body = resource(order)
      .action('cancel', '/orders/8f3a2c/cancel', { method: 'POST', when: true })
      .build()
    expect(body._actions.cancel).toBeDefined()
  })

  it('omits the action entirely when `when` is false (authorization as visibility)', () => {
    const body = resource(order)
      .action('cancel', '/orders/8f3a2c/cancel', { method: 'POST', when: false })
      .build()
    expect('cancel' in body._actions).toBe(false)
  })

  it('chains self and multiple actions, gating each independently', () => {
    const isOwner = true
    const isShipped = false
    const body = resource(order)
      .self('/orders/8f3a2c')
      .action('track', '/orders/8f3a2c/tracking')
      .action('cancel', '/orders/8f3a2c/cancel', {
        method: 'POST',
        when: isOwner && !isShipped,
      })
      .action('refund', '/orders/8f3a2c/refund', { method: 'POST', when: isShipped })
      .build()

    expect(Object.keys(body._actions)).toEqual(['track', 'cancel'])
    expect(body._self).toBeDefined()
  })
})
