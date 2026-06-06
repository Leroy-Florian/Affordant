import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Effect, Exit } from 'effect'
import { can, actionFor, type HateoasResource } from 'affordant'
import { follow, FollowError } from '@affordant/effect'
import { startServer, type RunningServer } from '../src/server.js'

type Order = { id: string; total: number; status: string }

let server: RunningServer
const get = (init?: RequestInit) =>
  fetch(`${server.url}/orders/8f3a2c`, init).then((r) => r.json() as Promise<HateoasResource<Order>>)

beforeEach(async () => {
  server = await startServer()
})
afterEach(() => server.close())

describe('Effect invoker over real HTTP', () => {
  it('follows cancel as an Effect and resolves with the Response', async () => {
    const order = await get({ headers: { authorization: 'Bearer u1' } })
    expect(can(order, 'cancel')).toBe(true)

    const res = await Effect.runPromise(follow(actionFor(order, 'cancel')!, { token: 'u1' }))
    expect(res.ok).toBe(true)
    const cancelled = (await res.json()) as HateoasResource<Order>
    expect(cancelled.status).toBe('cancelled')
    expect(can(cancelled, 'cancel')).toBe(false)
  })

  it('surfaces a non-2xx response as a successful Effect (it is a completed fetch)', async () => {
    // anonymous cancel → 403, but that is still a Response, not a FollowError
    const order = await get()
    const res = await Effect.runPromise(
      follow({ href: `${server.url}/orders/8f3a2c/cancel`, method: 'POST' }),
    )
    expect(res.status).toBe(403)
    expect(order.status).toBe('pending')
  })

  it('maps a network failure into the typed FollowError channel', async () => {
    const exit = await Effect.runPromiseExit(
      follow({ href: 'http://127.0.0.1:1/nope', method: 'GET' }),
    )
    expect(Exit.isFailure(exit)).toBe(true)
    const error = await Effect.runPromise(
      follow({ href: 'http://127.0.0.1:1/nope', method: 'GET' }).pipe(Effect.flip),
    )
    expect(error).toBeInstanceOf(FollowError)
  })
})
