// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { HateoasResource } from '@affordant/contract'
import { useAffordance, useFollow } from '../src/index.js'

type Order = { id: string }

const order: HateoasResource<Order> = {
  id: '8f3a2c',
  _actions: { cancel: { href: '/orders/8f3a2c/cancel', method: 'POST' } },
}

describe('useAffordance', () => {
  it('exposes can=true and the action when offered', () => {
    const { result } = renderHook(() => useAffordance(order, 'cancel'))
    expect(result.current.can).toBe(true)
    expect(result.current.action).toEqual({ href: '/orders/8f3a2c/cancel', method: 'POST' })
  })

  it('exposes can=false and a null action when not offered', () => {
    const { result } = renderHook(() => useAffordance(order, 'refund'))
    expect(result.current.can).toBe(false)
    expect(result.current.action).toBeNull()
  })
})

describe('useFollow', () => {
  it('toggles running and resolves with the Response', async () => {
    const response = new Response('{}', { status: 200 })
    const fetch: typeof globalThis.fetch = () => Promise.resolve(response)

    const { result } = renderHook(() => useFollow())
    expect(result.current.running).toBe(false)

    let returned: Response | undefined
    await act(async () => {
      returned = await result.current.run(order._actions.cancel!, { fetch })
    })

    expect(returned).toBe(response)
    expect(result.current.running).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('captures the error and rethrows when the request fails', async () => {
    const boom = new Error('network down')
    const fetch: typeof globalThis.fetch = () => Promise.reject(boom)

    const { result } = renderHook(() => useFollow())

    await act(async () => {
      await expect(result.current.run(order._actions.cancel!, { fetch })).rejects.toBe(boom)
    })

    expect(result.current.error).toBe(boom)
    expect(result.current.running).toBe(false)
  })
})
