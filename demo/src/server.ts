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

/** Bearer token === caller id, in this toy auth. Returns null when anonymous. */
function callerId(req: Request): string | null {
  const header = req.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length) || null
}

/**
 * Builds the Affordant envelope for an order. The whole demo lives in the
 * `when` clauses: an action is offered only to the caller who may run it,
 * right now. The frontend never re-derives any of this.
 */
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

/** Creates an Express app with a fresh in-memory order store. */
export function createApp() {
  const orders = new Map<string, Order>([
    ['8f3a2c', { id: '8f3a2c', ownerId: 'u1', total: 4200, status: 'pending' }],
  ])

  const app = express()
  app.use(express.json())

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

/** Starts the app on an ephemeral port; returns its base URL and a closer. */
export function startServer(): Promise<RunningServer> {
  const app = createApp()
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((done) => server.close(() => done())),
      })
    })
  })
}
