import { createServer } from 'node:http'
import express, { type Request, type Response } from 'express'
import { resource } from '@affordant/server'
import { sendResource, urlFor } from '@affordant/express'

export type OrderStatus = 'pending' | 'cancelled' | 'shipped'
export interface Order {
  id: string
  ownerId: string
  total: number
  status: OrderStatus
}

function callerId(req: Request): string | null {
  const header = req.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length) || null
}

function serializeOrder(req: Request, order: Order) {
  const me = callerId(req)
  return resource(order)
    .self(urlFor(req, `/orders/${order.id}`))
    .action('track', urlFor(req, `/orders/${order.id}/tracking`))
    .action('cancel', urlFor(req, `/orders/${order.id}/cancel`), {
      method: 'POST',
      when: me === order.ownerId && order.status === 'pending',
    })
}

/** The Express backend — uses `@affordant/server` + `@affordant/express`. */
export function createApp() {
  const orders = new Map<string, Order>([
    ['8f3a2c', { id: '8f3a2c', ownerId: 'u1', total: 4200, status: 'pending' }],
  ])

  const app = express()
  app.use(express.json())

  // Permissive CORS so the browser demos can call it cross-origin.
  app.use((req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Expose-Headers', 'Link')
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }
    next()
  })

  // Liveness for the dashboard.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, backend: 'express' })
  })

  // Test-only: re-seed the store so each browser E2E starts from a clean state.
  app.post('/reset', (_req: Request, res: Response) => {
    orders.clear()
    orders.set('8f3a2c', { id: '8f3a2c', ownerId: 'u1', total: 4200, status: 'pending' })
    res.status(204).end()
  })

  app.get('/orders/:id', (req: Request, res: Response) => {
    const order = orders.get(String(req.params.id))
    if (!order) {
      res.status(404).json({ error: 'not found' })
      return
    }
    sendResource(res, serializeOrder(req, order))
  })

  app.get('/orders/:id/tracking', (req: Request, res: Response) => {
    const order = orders.get(String(req.params.id))
    if (!order) {
      res.status(404).json({ error: 'not found' })
      return
    }
    res.json({ id: order.id, status: order.status, location: 'warehouse-7' })
  })

  app.post('/orders/:id/cancel', (req: Request, res: Response) => {
    const order = orders.get(String(req.params.id))
    if (!order) {
      res.status(404).json({ error: 'not found' })
      return
    }
    if (callerId(req) !== order.ownerId) {
      res.status(403).json({ error: 'forbidden' })
      return
    }
    if (order.status !== 'pending') {
      res.status(409).json({ error: 'not cancellable' })
      return
    }
    order.status = 'cancelled'
    sendResource(res, serializeOrder(req, order))
  })

  return app
}

export interface RunningServer {
  url: string
  close: () => Promise<void>
}

export function startServer(port = 0): Promise<RunningServer> {
  // Use node:http directly (like the Node backend) instead of app.listen — more
  // predictable across platforms. Fall back to the requested port for the URL.
  const server = createServer(createApp())
  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(port, () => {
      const address = server.address()
      const actual = typeof address === 'object' && address ? address.port : port
      resolve({
        url: `http://127.0.0.1:${actual}`,
        close: () => new Promise<void>((done) => server.close(() => done())),
      })
    })
  })
}
