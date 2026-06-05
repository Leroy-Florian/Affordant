import { describe, expect, it, vi } from 'vitest'
import { resource } from '@affordant/server'
import { sendResource, urlFor, type RequestLike, type ResponseLike } from '../src/index.js'

function fakeReq(host?: string, protocol = 'https'): RequestLike {
  return { protocol, get: (name) => (name.toLowerCase() === 'host' ? host : undefined) }
}

function fakeRes(): ResponseLike & {
  headers: Record<string, string>
  body: unknown
} {
  const headers: Record<string, string> = {}
  return {
    headers,
    body: undefined,
    setHeader(name, value) {
      headers[name] = value
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

describe('urlFor', () => {
  it('builds an absolute URL from the request origin', () => {
    expect(urlFor(fakeReq('api.example.com'), '/orders/8f3a2c')).toBe(
      'https://api.example.com/orders/8f3a2c',
    )
  })

  it('falls back to localhost when no Host header is present', () => {
    expect(urlFor(fakeReq(undefined, 'http'), '/orders')).toBe('http://localhost/orders')
  })
})

describe('sendResource', () => {
  it('sends the built envelope as JSON', () => {
    const res = fakeRes()
    const spy = vi.spyOn(res, 'json')

    sendResource(res, resource({ id: '8f3a2c' }).action('track', '/t'))

    expect(spy).toHaveBeenCalledOnce()
    expect(res.body).toEqual({ id: '8f3a2c', _actions: { track: { href: '/t', method: 'GET' } } })
  })

  it('emits a self Link header when _self is set', () => {
    const res = fakeRes()

    sendResource(res, resource({ id: '8f3a2c' }).self('/orders/8f3a2c'))

    expect(res.headers.Link).toBe('</orders/8f3a2c>; rel="self"')
  })

  it('omits the Link header when there is no _self', () => {
    const res = fakeRes()

    sendResource(res, resource({ id: '8f3a2c' }))

    expect(res.headers.Link).toBeUndefined()
  })

  it('returns the response for chaining', () => {
    const res = fakeRes()
    expect(sendResource(res, resource({ id: 'x' }))).toBe(res)
  })
})
