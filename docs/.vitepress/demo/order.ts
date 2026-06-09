// An in-browser stand-in for the demo backend. It runs the *same* affordance
// logic as `demo/src/server/express.ts` — `@affordant/server`'s `resource()`
// builder gating `cancel` on `when` — but with no HTTP server to deploy. The
// docs stay a static GitHub Pages site while the affordances react live.
import { resource } from '@affordant/server'
import type { HateoasResource } from '@affordant/contract'

export type OrderStatus = 'pending' | 'cancelled' | 'shipped'
export interface Order {
  id: string
  ownerId: string
  total: number
  status: OrderStatus
}

// A fake origin: requests never leave the browser — the demo `fetch` below
// handles them in memory — so the host is purely cosmetic in the JSON.
const ORIGIN = 'https://orders.demo'

/** The canonical seed every reset restores. */
function seed(): Order {
  return { id: '8f3a2c', ownerId: 'u1', total: 4200, status: 'pending' }
}

/**
 * Build the `_self` / `_actions` envelope for an order. This mirrors
 * `serializeOrder` in the Express demo: `cancel` is offered only when the
 * caller owns the order *and* it is still `pending`. The presence of the
 * link is the permission — exactly the rule the page is explaining.
 */
export function serializeOrder(order: Order, callerId: string | null): HateoasResource<Order> {
  return resource(order)
    .self(`${ORIGIN}/orders/${order.id}`)
    .action('track', `${ORIGIN}/orders/${order.id}/tracking`)
    .action('cancel', `${ORIGIN}/orders/${order.id}/cancel`, {
      method: 'POST',
      when: callerId === order.ownerId && order.status === 'pending',
    })
    .build()
}

function callerId(headers: Headers): string | null {
  const header = headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length) || null
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export interface DemoBackend {
  /** A `fetch`-shaped function to hand to the client (load + `follow`). */
  readonly fetch: typeof globalThis.fetch
  /** Restore the order to its seeded `pending` state. */
  reset(): void
}

/**
 * A self-contained backend instance. Each demo on the page gets its own, so
 * cancelling in one block never mutates another.
 */
export function createDemoBackend(): DemoBackend {
  let order = seed()

  const fetchImpl: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.toString())
    const method = (init?.method ?? 'GET').toUpperCase()
    const headers = new Headers(init?.headers)
    const me = callerId(headers)

    if (url.pathname === `/orders/${order.id}` && method === 'GET') {
      return json(serializeOrder(order, me))
    }

    if (url.pathname === `/orders/${order.id}/tracking` && method === 'GET') {
      return json({ id: order.id, status: order.status, location: 'warehouse-7' })
    }

    if (url.pathname === `/orders/${order.id}/cancel` && method === 'POST') {
      if (me !== order.ownerId) return json({ error: 'forbidden' }, 403)
      if (order.status !== 'pending') return json({ error: 'not cancellable' }, 409)
      order = { ...order, status: 'cancelled' }
      return json(serializeOrder(order, me))
    }

    return json({ error: 'not found' }, 404)
  }

  return {
    fetch: fetchImpl,
    reset() {
      order = seed()
    },
  }
}
