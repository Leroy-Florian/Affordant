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
