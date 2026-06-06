// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAffordance, useFollow } from '@affordant/react'
import type { HateoasResource } from 'affordant'
import { startServer, type RunningServer } from '../src/server.js'

type Order = { id: string; total: number; status: string }

let server: RunningServer
const get = (init?: RequestInit) =>
  fetch(`${server.url}/orders/8f3a2c`, init).then((r) => r.json() as Promise<HateoasResource<Order>>)

beforeEach(async () => {
  server = await startServer()
})
afterEach(() => server.close())

describe('React adapter over real HTTP', () => {
  it('useAffordance gates on what the server offered', async () => {
    const anon = await get()
    const owner = await get({ headers: { authorization: 'Bearer u1' } })

    expect(renderHook(() => useAffordance(anon, 'cancel')).result.current.can).toBe(false)

    const ownerHook = renderHook(() => useAffordance(owner, 'cancel')).result
    expect(ownerHook.current.can).toBe(true)
    expect(ownerHook.current.action?.method).toBe('POST')
  })

  it('useFollow runs the cancel affordance against the real server', async () => {
    const owner = await get({ headers: { authorization: 'Bearer u1' } })
    const affordance = renderHook(() => useAffordance(owner, 'cancel')).result.current

    const { result } = renderHook(() => useFollow())
    expect(result.current.running).toBe(false)

    let res: Response | undefined
    await act(async () => {
      res = await result.current.run(affordance.action!, { token: 'u1' })
    })

    expect(res?.ok).toBe(true)
    expect(result.current.error).toBeNull()

    const after = await get({ headers: { authorization: 'Bearer u1' } })
    expect(renderHook(() => useAffordance(after, 'cancel')).result.current.can).toBe(false)
  })
})
