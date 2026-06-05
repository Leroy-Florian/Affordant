import { describe, expect, it } from 'vitest'
import { follow, type HateoasAction } from '../src/index.js'

interface Captured {
  input: RequestInfo | URL
  init: RequestInit | undefined
}

function captureFetch(response = new Response('{}')): { calls: Captured[]; fetch: typeof fetch } {
  const calls: Captured[] = []
  const fetchImpl: typeof fetch = (input, init) => {
    calls.push({ input, init })
    return Promise.resolve(response)
  }
  return { calls, fetch: fetchImpl }
}

const headersOf = (c: Captured): Record<string, string> =>
  (c.init?.headers ?? {}) as Record<string, string>

const get: HateoasAction = { href: '/players/kaelith', method: 'GET' }
const post: HateoasAction = { href: '/players/kaelith/claim', method: 'POST' }

describe('follow', () => {
  it('uses the href and method from the action descriptor', async () => {
    const { calls, fetch } = captureFetch()

    await follow(post, { fetch })

    expect(calls[0]?.input).toBe('/players/kaelith/claim')
    expect(calls[0]?.init?.method).toBe('POST')
  })

  it('sends Accept: application/json by default', async () => {
    const { calls, fetch } = captureFetch()

    await follow(get, { fetch })

    expect(headersOf(calls[0]!).Accept).toBe('application/json')
  })

  it('injects a bearer token from a plain string', async () => {
    const { calls, fetch } = captureFetch()

    await follow(get, { fetch, token: 'secret' })

    expect(headersOf(calls[0]!).Authorization).toBe('Bearer secret')
  })

  it('injects a bearer token from a lazy getter', async () => {
    const { calls, fetch } = captureFetch()

    await follow(get, { fetch, token: () => 'lazy-secret' })

    expect(headersOf(calls[0]!).Authorization).toBe('Bearer lazy-secret')
  })

  it('omits Authorization when the token is null or the getter yields nothing', async () => {
    const { calls, fetch } = captureFetch()

    await follow(get, { fetch, token: null })
    await follow(get, { fetch, token: () => null })
    await follow(get, { fetch, token: () => undefined })

    expect(headersOf(calls[0]!).Authorization).toBeUndefined()
    expect(headersOf(calls[1]!).Authorization).toBeUndefined()
    expect(headersOf(calls[2]!).Authorization).toBeUndefined()
  })

  it('JSON-encodes the body when the action accepts JSON (default)', async () => {
    const { calls, fetch } = captureFetch()

    await follow(post, { fetch, body: { note: 'gg' } })

    expect(headersOf(calls[0]!)['Content-Type']).toBe('application/json')
    expect(calls[0]?.init?.body).toBe('{"note":"gg"}')
  })

  it('JSON-encodes the body for vendor JSON media types', async () => {
    const { calls, fetch } = captureFetch()
    const action: HateoasAction = { ...post, accepts: 'application/vnd.api+json' }

    await follow(action, { fetch, body: { note: 'gg' } })

    expect(headersOf(calls[0]!)['Content-Type']).toBe('application/vnd.api+json')
    expect(calls[0]?.init?.body).toBe('{"note":"gg"}')
  })

  it('passes the body through untouched for non-JSON accepts', async () => {
    const { calls, fetch } = captureFetch()
    const action: HateoasAction = { ...post, accepts: 'text/plain' }

    await follow(action, { fetch, body: 'raw text' })

    expect(headersOf(calls[0]!)['Content-Type']).toBe('text/plain')
    expect(calls[0]?.init?.body).toBe('raw text')
  })

  it('sends no body and no Content-Type when body is undefined', async () => {
    const { calls, fetch } = captureFetch()

    await follow(post, { fetch })

    expect(calls[0]?.init?.body).toBeUndefined()
    expect(headersOf(calls[0]!)['Content-Type']).toBeUndefined()
  })

  it('lets caller headers override the defaults', async () => {
    const { calls, fetch } = captureFetch()

    await follow(get, { fetch, headers: { Accept: 'application/xml' } })

    expect(headersOf(calls[0]!).Accept).toBe('application/xml')
  })

  it('forwards the abort signal', async () => {
    const { calls, fetch } = captureFetch()
    const controller = new AbortController()

    await follow(get, { fetch, signal: controller.signal })

    expect(calls[0]?.init?.signal).toBe(controller.signal)
  })

  it('returns the raw Response', async () => {
    const response = new Response('{"ok":true}', { status: 200 })
    const { fetch } = captureFetch(response)

    const result = await follow(get, { fetch })

    expect(result).toBe(response)
  })

  it('falls back to globalThis.fetch when none is injected', async () => {
    const { calls, fetch } = captureFetch()
    const original = globalThis.fetch
    globalThis.fetch = fetch
    try {
      await follow(get)
    } finally {
      globalThis.fetch = original
    }

    expect(calls[0]?.input).toBe('/players/kaelith')
    expect(calls[0]?.init?.method).toBe('GET')
  })
})
