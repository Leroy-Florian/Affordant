// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { Layer, ManagedRuntime } from 'effect'
import { makeEffectHooks } from 'effect-react-bridge'
import { makeAffordanceHooks } from '@affordant/react/effect'
import { actionFor, can, type HateoasResource } from 'affordant'
import { startServer, type RunningServer } from '../src/server.js'

type Order = { id: string; total: number; status: string }

let server: RunningServer
const get = (init?: RequestInit) =>
  fetch(`${server.url}/orders/8f3a2c`, init).then((r) => r.json() as Promise<HateoasResource<Order>>)

beforeEach(async () => {
  server = await startServer()
})
afterEach(() => server.close())

describe('React + Effect bridge over real HTTP', () => {
  it('runs the Effect invoker through the bridge runtime to cancel', async () => {
    // compose: bridge runtime -> Effect invoker hooks (the @affordant/react/effect glue)
    const runtime = ManagedRuntime.make(Layer.empty)
    const { useFollow } = makeAffordanceHooks(makeEffectHooks({ runtime }))

    const owner = await get({ headers: { authorization: 'Bearer u1' } })
    expect(can(owner, 'cancel')).toBe(true)

    const { result } = renderHook(() => useFollow())
    let res: Response | undefined
    await act(async () => {
      res = await result.current.run(actionFor(owner, 'cancel')!, { token: 'u1' })
    })

    expect(res?.ok).toBe(true)
    expect(result.current.error).toBeNull()

    const after = await get({ headers: { authorization: 'Bearer u1' } })
    expect(can(after, 'cancel')).toBe(false)

    await runtime.dispose()
  })
})
