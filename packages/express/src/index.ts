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
 * envelope: emits the `_self` link as a `Link: <href>; rel="self"` header and
 * sends the body as JSON. Returns the response for chaining.
 */
export function sendResource<R extends ResponseLike, T>(res: R, builder: ResourceBuilder<T>): R {
  const body = builder.build()
  if (body._self) res.setHeader('Link', `<${body._self.href}>; rel="self"`)
  res.json(body)
  return res
}
