import type { HateoasAction } from '@affordant/contract'

/**
 * A bearer token: a plain string, or a lazy getter invoked at request time
 * (lets auth layers hand out short-lived tokens without coupling to any
 * framework or secret-wrapping library).
 */
export type BearerToken = string | (() => string | null | undefined)

export interface FollowInit {
  body?: unknown
  token?: BearerToken | null
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Custom fetch implementation (SSR, polyfills, testing). Defaults to `globalThis.fetch`. */
  fetch?: typeof globalThis.fetch
}

/**
 * Invokes a hypermedia action with vanilla `fetch`: builds the request from
 * the action descriptor (method + href + accepts), injects the bearer token
 * if provided, JSON-encodes the body when the action accepts JSON.
 */
export async function follow(action: HateoasAction, init?: FollowInit): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers ?? {}),
  }

  const token = typeof init?.token === 'function' ? init.token() : init?.token
  if (token) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (init?.body !== undefined) {
    const contentType = action.accepts ?? 'application/json'
    headers['Content-Type'] = contentType
    body = contentType.includes('json')
      ? JSON.stringify(init.body)
      : (init.body as BodyInit)
  }

  const fetchImpl = init?.fetch ?? globalThis.fetch
  return fetchImpl(action.href, {
    method: action.method,
    headers,
    body,
    signal: init?.signal,
  })
}

/**
 * Thrown by {@link followJson} when the response is not 2xx. Carries the
 * `status`, the raw `response` (untouched, in case you need headers or to read
 * the body again), and the parsed/raw error `body` when one could be read.
 */
export class FollowError extends Error {
  readonly status: number
  readonly response: Response
  readonly body: unknown

  constructor(status: number, response: Response, body: unknown) {
    super(`Request failed with status ${status}`)
    this.name = 'FollowError'
    this.status = status
    this.response = response
    this.body = body
  }
}

/**
 * Typed convenience over {@link follow}: invokes the action, then reads the
 * response as JSON. On a non-2xx status it throws a {@link FollowError} (with
 * the parsed JSON error body, falling back to text, then `undefined`). On
 * success it resolves with the parsed JSON typed as `T`; an empty body (e.g.
 * `204 No Content`) resolves to `undefined as T`.
 *
 * ```ts
 * const order = await followJson<Order>(actionFor(res, 'self')!, { token })
 * ```
 */
export async function followJson<T = unknown>(
  action: HateoasAction,
  init?: FollowInit,
): Promise<T> {
  const res = await follow(action, init)

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.clone().json()
    } catch {
      try {
        const text = await res.clone().text()
        body = text === '' ? undefined : text
      } catch {
        body = undefined
      }
    }
    throw new FollowError(res.status, res, body)
  }

  const text = await res.text()
  if (text === '') return undefined as T
  return JSON.parse(text) as T
}
