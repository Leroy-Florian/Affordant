import type { ResourceBuilder } from '@affordant/server'

/**
 * The slice of a Hono `Context` this adapter needs. Real `hono` `Context`
 * objects satisfy it structurally — no `hono` dependency required.
 */
export interface ContextLike {
  req: {
    /** The full, absolute request URL (e.g. `https://api.example.com/orders/1`). */
    url: string
    /** Read an incoming request header by name. */
    header(name: string): string | undefined
  }
  /** Set a response header. */
  header(name: string, value: string): unknown
  /** Serialize `body` as a JSON `Response`. */
  json(body: unknown): Response
}

/**
 * Build an absolute URL for `path` from the incoming request's origin
 * (derived from `c.req.url`). Handy when an action's `href` must be absolute.
 */
export function urlFor(c: ContextLike, path: string): string {
  return new URL(path, new URL(c.req.url).origin).toString()
}

/**
 * Serialize a resource builder onto a Hono response as the Affordant
 * envelope: emits a combined RFC 8288 `Link` header (the `_self` link with
 * `rel="self"` first, then every `_actions` rel, comma-separated) and returns
 * the body as a JSON `Response`.
 */
export function sendResource<T>(c: ContextLike, builder: ResourceBuilder<T>): Response {
  const body = builder.build()
  const links: string[] = []
  if (body._self) links.push(`<${body._self.href}>; rel="self"`)
  if (body._actions) {
    for (const [rel, action] of Object.entries(body._actions)) {
      links.push(`<${action.href}>; rel="${rel}"`)
    }
  }
  if (links.length > 0) c.header('Link', links.join(', '))
  return c.json(body)
}
