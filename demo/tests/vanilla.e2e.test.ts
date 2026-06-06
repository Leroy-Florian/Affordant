import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { can } from 'affordant'
import { cancelOrder, loadOrder } from '../src/front/flow.js'
import { backends } from './backends.js'
import type { RunningServer } from '../src/server/express.js'

describe.each(backends)('vanilla JS front × $name backend', ({ start }) => {
  let server: RunningServer
  beforeEach(async () => {
    server = await start()
  })
  afterEach(() => server.close())

  it('hides cancel from anonymous, offers it to the owner, then drops it after follow', async () => {
    expect(can(await loadOrder(server.url), 'cancel')).toBe(false)

    const owner = await loadOrder(server.url, 'u1')
    expect(can(owner, 'cancel')).toBe(true)

    const res = await cancelOrder(owner, 'u1')
    expect(res.ok).toBe(true)

    const after = await loadOrder(server.url, 'u1')
    expect(after.status).toBe('cancelled')
    expect(can(after, 'cancel')).toBe(false)
  })

  it('keeps cancel hidden from an authenticated non-owner', async () => {
    expect(can(await loadOrder(server.url, 'someone-else'), 'cancel')).toBe(false)
  })
})
