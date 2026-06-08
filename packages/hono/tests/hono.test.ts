import { describe, expect, it, vi } from 'vitest'
import { resource } from '@affordant/server'
import { sendResource, urlFor, type ContextLike } from '../src/index.js'

function fakeCtx(url = 'https://api.example.com/orders/1'): ContextLike & {
  headers: Record<string, string>
  body: unknown
} {
  const headers: Record<string, string> = {}
  return {
    headers,
    body: undefined,
    req: {
      url,
      header: (name) => (name.toLowerCase() === 'host' ? 'api.example.com' : undefined),
    },
    header(name, value) {
      headers[name] = value
    },
    json(body) {
      this.body = body
      return new Response(JSON.stringify(body))
    },
  }
}

describe('urlFor', () => {
  it('builds an absolute URL from the request origin', () => {
    expect(urlFor(fakeCtx('https://api.example.com/orders/1'), '/orders/8f3a2c')).toBe(
      'https://api.example.com/orders/8f3a2c',
    )
  })
})

describe('sendResource', () => {
  it('sends the built envelope as JSON', () => {
    const c = fakeCtx()
    const spy = vi.spyOn(c, 'json')

    sendResource(c, resource({ id: '8f3a2c' }).action('track', '/t'))

    expect(spy).toHaveBeenCalledOnce()
    expect(c.body).toEqual({ id: '8f3a2c', _actions: { track: { href: '/t', method: 'GET' } } })
  })

  it('emits a combined Link header with self first then each action rel', () => {
    const c = fakeCtx()

    sendResource(
      c,
      resource({ id: '8f3a2c' })
        .self('/orders/8f3a2c')
        .action('track', '/orders/8f3a2c/tracking')
        .action('cancel', '/orders/8f3a2c/cancel', { method: 'POST' }),
    )

    expect(c.headers.Link).toBe(
      '</orders/8f3a2c>; rel="self", ' +
        '</orders/8f3a2c/tracking>; rel="track", ' +
        '</orders/8f3a2c/cancel>; rel="cancel"',
    )
  })

  it('emits action rels even when there is no _self', () => {
    const c = fakeCtx()

    sendResource(c, resource({ id: '8f3a2c' }).action('track', '/t'))

    expect(c.headers.Link).toBe('</t>; rel="track"')
  })

  it('omits the Link header when there are no links', () => {
    const c = fakeCtx()

    sendResource(c, resource({ id: '8f3a2c' }))

    expect(c.headers.Link).toBeUndefined()
  })

  it('returns the JSON Response', () => {
    const c = fakeCtx()
    expect(sendResource(c, resource({ id: 'x' }))).toBeInstanceOf(Response)
  })
})
