// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { HateoasResource } from '@affordant/contract'
import { FollowError } from 'affordant'
import { useAffordance, useFollow, useFollowJson } from '../src/index.js'

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

describe('useFollowJson', () => {
  it('resolves with the parsed body and clears running/error', async () => {
    const response = new Response('{"id":"8f3a2c"}', { status: 200 })
    const fetch: typeof globalThis.fetch = () => Promise.resolve(response)

    const { result } = renderHook(() => useFollowJson<Order>())
    expect(result.current.running).toBe(false)

    let returned: Order | undefined
    await act(async () => {
      returned = await result.current.run(order._actions.cancel!, { fetch })
    })

    expect(returned).toEqual({ id: '8f3a2c' })
    expect(result.current.running).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('captures a FollowError and rethrows when the response is non-2xx', async () => {
    const response = new Response('{"error":"nope"}', { status: 403 })
    const fetch: typeof globalThis.fetch = () => Promise.resolve(response)

    const { result } = renderHook(() => useFollowJson())

    let caught: unknown
    await act(async () => {
      caught = await result.current.run(order._actions.cancel!, { fetch }).catch((e) => e)
    })

    expect(caught).toBeInstanceOf(FollowError)
    expect(result.current.error).toBe(caught)
    expect(result.current.running).toBe(false)
  })
})
