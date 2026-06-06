// A backend in 100% JavaScript, no framework — raw node:http emitting the
// Affordant envelope with `@affordant/server`. Proves the server builder is
// framework-agnostic and works from plain JS, with no `@affordant/express`.
import { createServer } from 'node:http'
import { policy, resource } from '@affordant/server'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-expose-headers': 'Link',
}

function callerId(req) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length) || null
}

function urlFor(req, path) {
  return `http://${req.headers.host ?? 'localhost'}${path}`
}

// The cancel rule, declared once: gates the affordance AND guards the handler.
const cancelPolicy = policy('cancel', [
  { ok: (c) => c.me === c.order.ownerId, status: 403, error: 'forbidden' },
  { ok: (c) => c.order.status === 'pending', status: 409, error: 'not cancellable' },
])

function serialize(req, order) {
  const ctx = { me: callerId(req), order }
  return resource(order)
    .self(urlFor(req, `/orders/${order.id}`))
    .action('track', urlFor(req, `/orders/${order.id}/tracking`))
    .offer(cancelPolicy, urlFor(req, `/orders/${order.id}/cancel`), ctx, { method: 'POST' })
    .build()
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', ...CORS })
  res.end(JSON.stringify(body))
}

export function createApp() {
  const orders = new Map([
    ['8f3a2c', { id: '8f3a2c', ownerId: 'u1', total: 4200, status: 'pending' }],
  ])

  return (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS)
      res.end()
      return
    }

    const path = (req.url ?? '').split('?')[0]

    // Liveness for the dashboard.
    if (req.method === 'GET' && path === '/health') {
      return send(res, 200, { ok: true, backend: 'node' })
    }

    // Test-only: re-seed the store so each browser E2E starts from a clean state.
    if (req.method === 'POST' && path === '/reset') {
      orders.set('8f3a2c', { id: '8f3a2c', ownerId: 'u1', total: 4200, status: 'pending' })
      res.writeHead(204, CORS)
      res.end()
      return
    }

    const show = path.match(/^\/orders\/([^/]+)$/)
    const tracking = path.match(/^\/orders\/([^/]+)\/tracking$/)
    const cancel = path.match(/^\/orders\/([^/]+)\/cancel$/)

    if (req.method === 'GET' && show) {
      const order = orders.get(show[1])
      return order ? send(res, 200, serialize(req, order)) : send(res, 404, { error: 'not found' })
    }
    if (req.method === 'GET' && tracking) {
      const order = orders.get(tracking[1])
      return order
        ? send(res, 200, { id: order.id, status: order.status, location: 'warehouse-7' })
        : send(res, 404, { error: 'not found' })
    }
    if (req.method === 'POST' && cancel) {
      const order = orders.get(cancel[1])
      if (!order) return send(res, 404, { error: 'not found' })
      // Same policy, same context as the affordance — the single source of truth.
      const denied = cancelPolicy.check({ me: callerId(req), order })
      if (denied) return send(res, denied.status, { error: denied.error })
      order.status = 'cancelled'
      return send(res, 200, serialize(req, order))
    }
    return send(res, 404, { error: 'not found' })
  }
}

export function startServer(port = 0) {
  const server = createServer(createApp())
  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((done) => server.close(() => done())),
      })
    })
  })
}
