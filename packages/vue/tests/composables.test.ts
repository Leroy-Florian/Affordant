import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import type { HateoasResource } from '@affordant/contract'
import { useAffordance, useFollow } from '../src/index.js'

type Order = { id: string }

const order: HateoasResource<Order> = {
  id: '8f3a2c',
  _actions: { cancel: { href: '/orders/8f3a2c/cancel', method: 'POST' } },
}

describe('useAffordance', () => {
  it('exposes can=true and the action when offered', () => {
    const { can, action } = useAffordance(order, 'cancel')
    expect(can.value).toBe(true)
    expect(action.value).toEqual({ href: '/orders/8f3a2c/cancel', method: 'POST' })
  })

  it('exposes can=false and a null action when not offered', () => {
    const { can, action } = useAffordance(order, 'refund')
    expect(can.value).toBe(false)
    expect(action.value).toBeNull()
  })

  it('stays reactive when the resource ref changes', () => {
    const resource = ref<HateoasResource<Order> | null>(null)
    const { can, action } = useAffordance(resource, 'cancel')

    expect(can.value).toBe(false)
    expect(action.value).toBeNull()

    resource.value = order

    expect(can.value).toBe(true)
    expect(action.value).toEqual({ href: '/orders/8f3a2c/cancel', method: 'POST' })
  })

  it('stays reactive when the rel ref changes', () => {
    const rel = ref('refund')
    const { can } = useAffordance(order, rel)

    expect(can.value).toBe(false)

    rel.value = 'cancel'

    expect(can.value).toBe(true)
  })
})

describe('useFollow', () => {
  it('toggles running and resolves with the Response', async () => {
    const response = new Response('{}', { status: 200 })
    const fetch: typeof globalThis.fetch = () => Promise.resolve(response)

    const { running, error, run } = useFollow()
    expect(running.value).toBe(false)

    const returned = await run(order._actions.cancel!, { fetch })

    expect(returned).toBe(response)
    expect(running.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('captures the error and rethrows when the request fails', async () => {
    const boom = new Error('network down')
    const fetch: typeof globalThis.fetch = () => Promise.reject(boom)

    const { running, error, run } = useFollow()

    await expect(run(order._actions.cancel!, { fetch })).rejects.toBe(boom)

    expect(error.value).toBe(boom)
    expect(running.value).toBe(false)
  })
})
