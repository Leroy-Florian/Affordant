// A richer in-browser backend for the Playground page: a full order lifecycle
// with ~a dozen affordances gated on both the order's state *and* the caller's
// role. Same idea as `order.ts`, scaled up to show how the offered action set
// shifts as the aggregate moves through its state machine and as roles change.
// Runs entirely in the browser on the real `@affordant/server` builder.
import { resource } from '@affordant/server'
import type { HateoasResource } from '@affordant/contract'

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type Role = 'customer' | 'support' | 'guest'

export interface Order {
  id: string
  status: OrderStatus
  total: number
  /** A short human note about the last action followed, shown in the card. */
  lastEvent: string | null
}

const ORIGIN = 'https://orders.demo'

function seed(): Order {
  return { id: '8f3a2c', status: 'pending', total: 4200, lastEvent: null }
}

const TERMINAL: ReadonlySet<OrderStatus> = new Set(['cancelled', 'refunded'])

/**
 * Build the envelope for an order as seen by `role`. Every affordance is gated
 * on authoritative state via `when` — the presence of the link is the
 * permission. Switch the role or move the order's state and the offered set
 * changes by construction.
 */
export function serializeOrder(order: Order, role: Role): HateoasResource<Order> {
  const isCustomer = role === 'customer'
  const isSupport = role === 'support'
  const s = order.status
  const terminal = TERMINAL.has(s)
  const href = (path: string) => `${ORIGIN}/orders/${order.id}${path}`

  return resource(order)
    .self(href(''))
    // — customer transitions —
    .action('pay', href('/pay'), { method: 'POST', when: isCustomer && s === 'pending' })
    .action('applyCoupon', href('/coupon'), { method: 'POST', when: isCustomer && s === 'pending' })
    .action('cancel', href('/cancel'), {
      method: 'POST',
      when: isCustomer && (s === 'pending' || s === 'paid'),
    })
    .action('confirmReceipt', href('/confirm'), { method: 'POST', when: isCustomer && s === 'shipped' })
    .action('requestReturn', href('/return'), { method: 'POST', when: isCustomer && s === 'delivered' })
    .action('reorder', href('/reorder'), {
      method: 'POST',
      when: isCustomer && (terminal || s === 'delivered'),
    })
    // — support transitions —
    .action('ship', href('/ship'), { method: 'POST', when: isSupport && s === 'paid' })
    .action('markDelivered', href('/deliver'), { method: 'POST', when: isSupport && s === 'shipped' })
    .action('refund', href('/refund'), {
      method: 'POST',
      when: isSupport && (s === 'paid' || s === 'shipped' || s === 'delivered'),
    })
    .action('addNote', href('/note'), { method: 'POST', when: isSupport && !terminal })
    // — shared / informational —
    .action('track', href('/tracking'), { when: s === 'shipped' || s === 'delivered' })
    .action('invoice', href('/invoice'), {
      when: (isCustomer || isSupport) && (s === 'paid' || s === 'shipped' || s === 'delivered'),
    })
    .action('contactSupport', href('/support'))
    .build()
}

/** Apply the effect of following `rel`. Returns the next order state. */
function transition(order: Order, rel: string): Order {
  switch (rel) {
    case 'pay':
      return { ...order, status: 'paid', lastEvent: 'Payment captured' }
    case 'cancel':
      return { ...order, status: 'cancelled', lastEvent: 'Order cancelled' }
    case 'ship':
      return { ...order, status: 'shipped', lastEvent: 'Shipped — warehouse-7' }
    case 'markDelivered':
    case 'confirmReceipt':
      return { ...order, status: 'delivered', lastEvent: 'Marked delivered' }
    case 'refund':
      return { ...order, status: 'refunded', lastEvent: 'Refund issued' }
    case 'reorder':
      return { ...seed(), lastEvent: 'Re-ordered — new cycle' }
    case 'applyCoupon':
      return { ...order, total: Math.round(order.total * 0.9), lastEvent: 'Coupon applied (-10%)' }
    case 'requestReturn':
      return { ...order, lastEvent: 'Return requested' }
    case 'addNote':
      return { ...order, lastEvent: 'Note added by support' }
    case 'track':
      return { ...order, lastEvent: 'Tracking opened' }
    case 'invoice':
      return { ...order, lastEvent: 'Invoice generated' }
    case 'contactSupport':
      return { ...order, lastEvent: 'Support ticket opened' }
    default:
      return order
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// Maps the action href suffix back to its rel, so the backend can re-check the
// transition is still offered before applying it (authorization, server-side).
const PATH_TO_REL: Record<string, string> = {
  '/pay': 'pay',
  '/coupon': 'applyCoupon',
  '/cancel': 'cancel',
  '/confirm': 'confirmReceipt',
  '/return': 'requestReturn',
  '/reorder': 'reorder',
  '/ship': 'ship',
  '/deliver': 'markDelivered',
  '/refund': 'refund',
  '/note': 'addNote',
  '/tracking': 'track',
  '/invoice': 'invoice',
  '/support': 'contactSupport',
}

export interface PlaygroundBackend {
  readonly fetch: typeof globalThis.fetch
  reset(): void
}

/** Reads the caller's role from the bearer token (`role:customer`, ...). */
function roleFromHeaders(headers: Headers): Role {
  const header = headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (token === 'customer' || token === 'support') return token
  return 'guest'
}

export function createPlaygroundBackend(): PlaygroundBackend {
  let order = seed()

  const fetchImpl: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.toString())
    const method = (init?.method ?? 'GET').toUpperCase()
    const headers = new Headers(init?.headers)
    const role = roleFromHeaders(headers)
    const prefix = `/orders/${order.id}`

    if (!url.pathname.startsWith(prefix)) return json({ error: 'not found' }, 404)
    const suffix = url.pathname.slice(prefix.length)

    if (suffix === '' && method === 'GET') {
      return json(serializeOrder(order, role))
    }

    const rel = PATH_TO_REL[suffix]
    if (rel && method === 'POST') {
      // Re-check server-side that this transition is actually offered to the
      // caller right now — never trust that the client only follows live links.
      const offered = rel in serializeOrder(order, role)._actions
      if (!offered) return json({ error: 'not offered' }, 409)
      order = transition(order, rel)
      return json(serializeOrder(order, role))
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
