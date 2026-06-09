import type { ResourceBuilder } from '@affordant/server'

/**
 * The slice of an Express `Request` this adapter needs. Real
 * `express.Request` objects satisfy it structurally — no `express`
 * dependency required.
 */
export interface RequestLike {
  protocol: string
  get(name: string): string | undefined
}

/**
 * The slice of an Express `Response` this adapter needs. Real
 * `express.Response` objects satisfy it structurally.
 */
export interface ResponseLike {
  setHeader(name: string, value: string): unknown
  json(body: unknown): unknown
}

/**
 * Build an absolute URL for `path` from the incoming request's origin
 * (protocol + Host header). Handy when an action's `href` must be absolute.
 */
export function urlFor(req: RequestLike, path: string): string {
  const host = req.get('host') ?? 'localhost'
  return new URL(path, `${req.protocol}://${host}`).toString()
}

/**
 * Serialize a resource builder onto an Express response as the Affordant
 * envelope. Emits every link in the envelope as a combined RFC 8288 `Link`
 * header — `_self` as `rel="self"` first (when present), then each `_actions`
 * entry as its own `rel`, in insertion order — and sends the body as JSON
 * unchanged. The header is only set when at least one link exists. Returns the
 * response for chaining.
 *
 * @example
 * // Link: </orders/8f3a2c>; rel="self", </orders/8f3a2c/cancel>; rel="cancel"
 * sendResource(res, resource(order).self('/orders/8f3a2c').action('cancel', '/orders/8f3a2c/cancel'))
 */
export function sendResource<R extends ResponseLike, T>(res: R, builder: ResourceBuilder<T>): R {
  const body = builder.build()

  const links: string[] = []
  if (body._self) links.push(`<${body._self.href}>; rel="self"`)
  for (const [rel, action] of Object.entries(body._actions)) {
    links.push(`<${action.href}>; rel="${rel}"`)
  }
  if (links.length > 0) res.setHeader('Link', links.join(', '))

  res.json(body)
  return res
}
