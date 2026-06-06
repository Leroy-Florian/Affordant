// Smoke test of the PUBLISHED npm artifacts.
//
// This file is copied into a throwaway temp project that installs the packages
// from the real npm registry (see run.mjs). It imports them by name — so it
// exercises the actual published dist + "exports" maps, not the workspace
// sources. It rebuilds the demo's server and replays the client flow.
import assert from 'node:assert/strict'
import express from 'express'
import { resource } from '@affordant/server'
import { sendResource, urlFor } from '@affordant/express'
import { can, actionFor, follow } from 'affordant'
import { Effect } from 'effect'
import { follow as effectFollow } from '@affordant/effect'

function serialize(req, order) {
  const me = req.get('authorization')?.replace('Bearer ', '') || null
  return resource(order)
    .self(urlFor(req, `/orders/${order.id}`))
    .action('track', urlFor(req, `/orders/${order.id}/tracking`))
    .action('cancel', urlFor(req, `/orders/${order.id}/cancel`), {
      method: 'POST',
      when: me === order.ownerId && order.status === 'pending',
    })
}

function createApp() {
  const orders = new Map([['8f3a2c', { id: '8f3a2c', ownerId: 'u1', total: 4200, status: 'pending' }]])
  const app = express()
  app.use(express.json())
  app.get('/orders/:id', (req, res) => {
    const order = orders.get(req.params.id)
    if (!order) return void res.status(404).json({ error: 'not found' })
    sendResource(res, serialize(req, order))
  })
  app.post('/orders/:id/cancel', (req, res) => {
    const order = orders.get(req.params.id)
    if (!order) return void res.status(404).json({ error: 'not found' })
    if ((req.get('authorization')?.replace('Bearer ', '') || null) !== order.ownerId)
      return void res.status(403).json({ error: 'forbidden' })
    order.status = 'cancelled'
    sendResource(res, serialize(req, order))
  })
  return app
}

const server = await new Promise((resolve) => {
  const s = createApp().listen(0, () => resolve(s))
})
const base = `http://127.0.0.1:${server.address().port}`
const get = (init) => fetch(`${base}/orders/8f3a2c`, init).then((r) => r.json())

try {
  // 1. vanilla client: anonymous sees no cancel, owner does
  assert.equal(can(await get(), 'cancel'), false, 'anon must not see cancel')
  const owner = await get({ headers: { authorization: 'Bearer u1' } })
  assert.equal(can(owner, 'cancel'), true, 'owner must see cancel')
  assert.equal(can(owner, 'track'), true, 'owner must see track')

  // 2. vanilla follow performs the cancel; the action then disappears
  const res = await follow(actionFor(owner, 'cancel'), { token: 'u1' })
  assert.equal(res.ok, true, 'cancel must succeed')
  assert.equal((await res.json()).status, 'cancelled', 'status must be cancelled')

  // 3. Effect invoker against the same (published) server
  const fresh = await new Promise((resolve) => {
    const s = createApp().listen(0, () => resolve(s))
  })
  const fbase = `http://127.0.0.1:${fresh.address().port}`
  const fowner = await fetch(`${fbase}/orders/8f3a2c`, {
    headers: { authorization: 'Bearer u1' },
  }).then((r) => r.json())
  const eres = await Effect.runPromise(effectFollow(actionFor(fowner, 'cancel'), { token: 'u1' }))
  assert.equal(eres.ok, true, 'effect cancel must succeed')
  fresh.close()

  console.log('SMOKE OK — published artifacts work: vanilla client, Effect invoker, server, express.')
} finally {
  server.close()
}
