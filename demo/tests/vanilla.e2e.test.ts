import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { actionFor, can, follow, type HateoasResource } from 'affordant'
import { startServer, type RunningServer } from '../src/server.js'

type Order = { id: string; total: number; status: string }

let server: RunningServer
const get = (init?: RequestInit) =>
  fetch(`${server.url}/orders/8f3a2c`, init).then((r) => r.json() as Promise<HateoasResource<Order>>)

beforeEach(async () => {
  server = await startServer()
})
afterEach(() => server.close())

describe('vanilla client over real HTTP', () => {
  it('hides cancel from an anonymous caller, offers track', async () => {
    const order = await get()
    expect(can(order, 'track')).toBe(true)
    expect(can(order, 'cancel')).toBe(false)
    expect(actionFor(order, 'cancel')).toBeNull()
  })

  it('offers cancel to the owner of a pending order', async () => {
    const order = await get({ headers: { authorization: 'Bearer u1' } })
    expect(can(order, 'cancel')).toBe(true)
    const action = actionFor(order, 'cancel')!
    expect(action.method).toBe('POST')
    expect(action.href).toContain('/orders/8f3a2c/cancel')
  })

  it('hides cancel from an authenticated non-owner', async () => {
    const order = await get({ headers: { authorization: 'Bearer someone-else' } })
    expect(can(order, 'cancel')).toBe(false)
  })

  it('follows the cancel affordance, after which the server stops offering it', async () => {
    const before = await get({ headers: { authorization: 'Bearer u1' } })
    expect(can(before, 'cancel')).toBe(true)

    const res = await follow(actionFor(before, 'cancel')!, { token: 'u1' })
    expect(res.ok).toBe(true)
    const cancelled = (await res.json()) as HateoasResource<Order>
    expect(cancelled.status).toBe('cancelled')
    // link visibility is authorization: the action is gone now that state changed
    expect(can(cancelled, 'cancel')).toBe(false)

    const after = await get({ headers: { authorization: 'Bearer u1' } })
    expect(can(after, 'cancel')).toBe(false)
  })
})
