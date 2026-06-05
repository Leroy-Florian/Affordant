import { describe, expect, it } from 'vitest'
import { Effect, Exit } from 'effect'
import { follow, FollowError, type HateoasAction } from '../src/index.js'

const action: HateoasAction = { href: '/orders/8f3a2c/cancel', method: 'POST' }

describe('effect follow', () => {
  it('succeeds with the raw Response', async () => {
    const response = new Response('{"ok":true}', { status: 200 })
    const fetch: typeof globalThis.fetch = () => Promise.resolve(response)

    const result = await Effect.runPromise(follow(action, { fetch }))

    expect(result).toBe(response)
  })

  it('treats a non-2xx response as a success (it is a completed fetch)', async () => {
    const response = new Response('nope', { status: 403 })
    const fetch: typeof globalThis.fetch = () => Promise.resolve(response)

    const result = await Effect.runPromise(follow(action, { fetch }))

    expect(result.status).toBe(403)
  })

  it('fails with a typed FollowError when fetch rejects', async () => {
    const boom = new Error('network down')
    const fetch: typeof globalThis.fetch = () => Promise.reject(boom)

    const exit = await Effect.runPromiseExit(follow(action, { fetch }))

    expect(Exit.isFailure(exit)).toBe(true)
    const error = await Effect.runPromise(follow(action, { fetch }).pipe(Effect.flip))
    expect(error).toBeInstanceOf(FollowError)
    expect(error.cause).toBe(boom)
  })

  it('passes the fiber abort signal into the request', async () => {
    let received: AbortSignal | undefined
    const fetch: typeof globalThis.fetch = (_input, reqInit) => {
      received = reqInit?.signal ?? undefined
      return Promise.resolve(new Response('{}'))
    }

    await Effect.runPromise(follow(action, { fetch }))

    expect(received).toBeInstanceOf(AbortSignal)
  })
})
