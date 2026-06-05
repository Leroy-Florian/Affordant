import { describe, expect, it } from 'vitest'
import { actionFor, can, type HateoasResource } from '../src/index.js'

type Player = { name: string }

const player: HateoasResource<Player> = {
  name: 'Kaelith',
  _self: { href: '/players/kaelith', method: 'GET' },
  _actions: {
    claim: { href: '/players/kaelith/claim', method: 'POST' },
  },
}

describe('can', () => {
  it('returns true when the server offers the rel', () => {
    expect(can(player, 'claim')).toBe(true)
  })

  it('returns false when the rel is absent', () => {
    expect(can(player, 'delete')).toBe(false)
  })

  it('returns false for null or undefined resources', () => {
    expect(can(null, 'claim')).toBe(false)
    expect(can(undefined, 'claim')).toBe(false)
  })

  it('returns false when _actions is missing', () => {
    expect(can({ name: 'x' } as never, 'claim')).toBe(false)
  })

  it('ignores inherited properties on _actions', () => {
    const resource = {
      name: 'x',
      _actions: Object.create({
        claim: { href: '/x', method: 'POST' },
      }) as Record<string, never>,
    }
    expect(can(resource, 'claim')).toBe(false)
  })
})

describe('actionFor', () => {
  it('returns the descriptor when offered', () => {
    expect(actionFor(player, 'claim')).toEqual({
      href: '/players/kaelith/claim',
      method: 'POST',
    })
  })

  it('returns null when not offered', () => {
    expect(actionFor(player, 'delete')).toBeNull()
  })

  it('returns null for null or undefined resources', () => {
    expect(actionFor(null, 'claim')).toBeNull()
    expect(actionFor(undefined, 'claim')).toBeNull()
  })
})
