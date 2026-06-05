import { describe, expect, it } from 'vitest'
import { Effect, Layer, Redacted, Schema } from 'effect'
import { HttpClient, HttpClientResponse, type HttpClientRequest } from '@effect/platform'
import { followEffect } from '../src/effect/index.js'
import type { HateoasAction } from '../src/index.js'

const get: HateoasAction = { href: 'https://api.test/players/kaelith', method: 'GET' }
const post: HateoasAction = { href: 'https://api.test/players/kaelith/claim', method: 'POST' }

interface Stub {
  layer: Layer.Layer<HttpClient.HttpClient>
  requests: HttpClientRequest.HttpClientRequest[]
}

function stubClient(makeResponse: () => Response): Stub {
  const requests: HttpClientRequest.HttpClientRequest[] = []
  const client = HttpClient.make((request) => {
    requests.push(request)
    return Effect.succeed(HttpClientResponse.fromWeb(request, makeResponse()))
  })
  return { layer: Layer.succeed(HttpClient.HttpClient, client), requests }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

describe('followEffect', () => {
  it('decodes the response body against the schema', async () => {
    const { layer } = stubClient(() => json({ level: 18 }))
    const schema = Schema.Struct({ level: Schema.Number })

    const result = await Effect.runPromise(
      followEffect(get, schema).pipe(Effect.provide(layer)),
    )

    expect(result).toEqual({ level: 18 })
  })

  it('uses the method and href from the action descriptor', async () => {
    const { layer, requests } = stubClient(() => json({}, 200))

    await Effect.runPromise(
      followEffect(post, Schema.Unknown).pipe(Effect.provide(layer)),
    )

    expect(requests[0]?.method).toBe('POST')
    expect(requests[0]?.url).toBe('https://api.test/players/kaelith/claim')
  })

  it('injects a plain bearer token', async () => {
    const { layer, requests } = stubClient(() => json({}))

    await Effect.runPromise(
      followEffect(get, Schema.Unknown, { token: 'secret' }).pipe(Effect.provide(layer)),
    )

    expect(requests[0]?.headers.authorization).toBe('Bearer secret')
  })

  it('injects a Redacted bearer token', async () => {
    const { layer, requests } = stubClient(() => json({}))

    await Effect.runPromise(
      followEffect(get, Schema.Unknown, { token: Redacted.make('hidden') }).pipe(
        Effect.provide(layer),
      ),
    )

    expect(requests[0]?.headers.authorization).toBe('Bearer hidden')
  })

  it('succeeds on 204 No Content when the schema is Unknown', async () => {
    const { layer } = stubClient(() => new Response(null, { status: 204 }))

    const result = await Effect.runPromise(
      followEffect(post, Schema.Unknown).pipe(Effect.provide(layer)),
    )

    expect(result).toBeUndefined()
  })

  it('fails on 204 No Content when the schema expects a structure', async () => {
    const { layer } = stubClient(() => new Response(null, { status: 204 }))
    const schema = Schema.Struct({ level: Schema.Number })

    const exit = await Effect.runPromiseExit(
      followEffect(post, schema).pipe(Effect.provide(layer)),
    )

    expect(exit._tag).toBe('Failure')
  })

  it('fails on non-2xx responses (filterStatusOk)', async () => {
    const { layer } = stubClient(() => json({ error: 'nope' }, 403))

    const exit = await Effect.runPromiseExit(
      followEffect(get, Schema.Unknown).pipe(Effect.provide(layer)),
    )

    expect(exit._tag).toBe('Failure')
  })

  it('JSON-encodes the body for actions accepting JSON', async () => {
    const { layer, requests } = stubClient(() => json({}))

    await Effect.runPromise(
      followEffect(post, Schema.Unknown, { body: { note: 'gg' } }).pipe(Effect.provide(layer)),
    )

    expect(requests[0]?.headers['content-type']).toContain('application/json')
  })
})
