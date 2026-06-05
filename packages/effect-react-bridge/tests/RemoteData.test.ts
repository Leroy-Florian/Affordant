import { describe, expect, it } from 'vitest'
import { RemoteData } from '../src/index.js'

describe('RemoteData.fromQuery', () => {
  it('maps a loading query to Loading', () => {
    expect(RemoteData.fromQuery({ data: null, error: null, loading: true })).toEqual({
      _tag: 'Loading',
    })
  })

  it('maps an errored query to Failed', () => {
    const error = new Error('boom')
    expect(RemoteData.fromQuery({ data: null, error, loading: false })).toEqual({
      _tag: 'Failed',
      error,
    })
  })

  it('maps a resolved query to Loaded', () => {
    expect(RemoteData.fromQuery({ data: 42, error: null, loading: false })).toEqual({
      _tag: 'Loaded',
      value: 42,
    })
  })

  it('maps an empty resolved query to Idle', () => {
    expect(RemoteData.fromQuery({ data: null, error: null, loading: false })).toEqual({
      _tag: 'Idle',
    })
  })
})

describe('RemoteData.match', () => {
  const handlers = {
    onIdle: () => 'idle',
    onLoading: () => 'loading',
    onLoaded: (v: number) => `loaded:${v}`,
    onFailed: (e: string) => `failed:${e}`,
  }

  it('dispatches each variant to its handler', () => {
    expect(RemoteData.match(RemoteData.idle<string, number>(), handlers)).toBe('idle')
    expect(RemoteData.match(RemoteData.loading<string, number>(), handlers)).toBe('loading')
    expect(RemoteData.match(RemoteData.loaded<string, number>(7), handlers)).toBe('loaded:7')
    expect(RemoteData.match(RemoteData.failed<string, number>('nope'), handlers)).toBe('failed:nope')
  })
})
