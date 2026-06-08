import type { ResourceBuilder } from '@affordant/server'

/**
 * The slice of a Fastify `Request` this adapter needs. Real
 * `FastifyRequest` objects satisfy it structurally — no `fastify`
 * dependency required.
 */
export interface RequestLike {
  protocol: string
  hostname?: string
  headers: Record<string, string | string[] | undefined>
}

/**
 * The slice of a Fastify `Reply` this adapter needs. Real
 * `FastifyReply` objects satisfy it structurally.
 */
export interface ReplyLike {
  header(name: string, value: string): unknown
  send(payload: unknown): unknown
}

/**
 * Build an absolute URL for `path` from the incoming request's origin
 * (protocol + host). Handy when an action's `href` must be absolute.
 */
export function urlFor(req: RequestLike, path: string): string {
  const headerHost = req.headers.host
  const host =
    req.hostname ?? (Array.isArray(headerHost) ? headerHost[0] : headerHost) ?? 'localhost'
  return new URL(path, `${req.protocol}://${host}`).toString()
}

/**
 * Serialize a resource builder onto a Fastify reply as the Affordant
 * envelope: emits a combined RFC 8288 `Link` header (the `_self` rel first,
 * then every `_actions` rel) and sends the body. Returns the reply for
 * chaining.
 */
export function sendResource<R extends ReplyLike, T>(reply: R, builder: ResourceBuilder<T>): R {
  const body = builder.build()
  const links: string[] = []
  if (body._self) links.push(`<${body._self.href}>; rel="self"`)
  for (const [rel, action] of Object.entries(body._actions))
    links.push(`<${action.href}>; rel="${rel}"`)
  if (links.length > 0) reply.header('Link', links.join(', '))
  reply.send(body)
  return reply
}
