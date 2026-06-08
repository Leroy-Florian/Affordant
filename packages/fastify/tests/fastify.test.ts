import { describe, expect, it, vi } from 'vitest'
import { resource } from '@affordant/server'
import { sendResource, urlFor, type RequestLike, type ReplyLike } from '../src/index.js'

function fakeReq(
  opts: { hostname?: string; host?: string; protocol?: string } = {},
): RequestLike {
  const { hostname, host, protocol = 'https' } = opts
  return { protocol, hostname, headers: { host } }
}

function fakeReply(): ReplyLike & {
  headers: Record<string, string>
  payload: unknown
} {
  const headers: Record<string, string> = {}
  return {
    headers,
    payload: undefined,
    header(name, value) {
      headers[name] = value
      return this
    },
    send(payload) {
      this.payload = payload
      return this
    },
  }
}

describe('urlFor', () => {
  it('builds an absolute URL from req.hostname', () => {
    expect(urlFor(fakeReq({ hostname: 'api.example.com' }), '/orders/8f3a2c')).toBe(
      'https://api.example.com/orders/8f3a2c',
    )
  })

  it('falls back to the Host header when hostname is absent', () => {
    expect(urlFor(fakeReq({ host: 'host-header.example.com' }), '/orders/8f3a2c')).toBe(
      'https://host-header.example.com/orders/8f3a2c',
    )
  })

  it('falls back to localhost when neither hostname nor Host header is present', () => {
    expect(urlFor(fakeReq({ protocol: 'http' }), '/orders')).toBe('http://localhost/orders')
  })
})

describe('sendResource', () => {
  it('sends the built envelope', () => {
    const reply = fakeReply()
    const spy = vi.spyOn(reply, 'send')

    const builder = resource({ id: '8f3a2c' }).action('track', '/t')
    sendResource(reply, builder)

    expect(spy).toHaveBeenCalledOnce()
    expect(reply.payload).toEqual(builder.build())
  })

  it('emits a Link header with self first then each action rel in order', () => {
    const reply = fakeReply()

    sendResource(
      reply,
      resource({ id: '8f3a2c' })
        .self('/orders/8f3a2c')
        .action('track', '/orders/8f3a2c/tracking')
        .action('cancel', '/orders/8f3a2c/cancel', { method: 'POST' }),
    )

    expect(reply.headers.Link).toBe(
      '</orders/8f3a2c>; rel="self", </orders/8f3a2c/tracking>; rel="track", </orders/8f3a2c/cancel>; rel="cancel"',
    )
  })

  it('omits the Link header when there are no links', () => {
    const reply = fakeReply()

    sendResource(reply, resource({ id: '8f3a2c' }))

    expect(reply.headers.Link).toBeUndefined()
  })

  it('returns the reply for chaining', () => {
    const reply = fakeReply()
    expect(sendResource(reply, resource({ id: 'x' }))).toBe(reply)
  })
})
