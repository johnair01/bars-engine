import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ db: { player: {} } }))

import { findPlayerByIdentifier, playerNotFoundResponse } from '../player-lookup'

function client(byId: unknown, byEmail: unknown) {
  return {
    player: {
      findUnique: vi.fn().mockResolvedValue(byId),
      findFirst: vi.fn().mockResolvedValue(byEmail),
    },
  } as never
}

describe('wa player lookup', () => {
  afterEach(() => vi.restoreAllMocks())

  it('finds a player by id first', async () => {
    const c = client({ id: 'p1' }, null)
    expect(await findPlayerByIdentifier('p1', { id: true }, 'save-name', c)).toEqual({ id: 'p1' })
    expect((c as any).player.findFirst).not.toHaveBeenCalled()
  })

  it('falls back to the account email', async () => {
    const c = client(null, { id: 'p2' })
    expect(await findPlayerByIdentifier('a@b.local', { id: true }, 'save-textures', c)).toEqual({ id: 'p2' })
    expect((c as any).player.findFirst.mock.calls[0][0].where.contactType).toBe('email')
  })

  it('logs the identifier on a miss and returns a readable 404', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = client(null, null)
    expect(await findPlayerByIdentifier('ghost@x.y', { id: true }, 'save-textures', c)).toBeNull()
    expect(warn.mock.calls[0][0]).toContain('save-textures')
    expect(warn.mock.calls[0][0]).toContain('ghost@x.y')
    const res = playerNotFoundResponse('ghost@x.y')
    expect(res.status).toBe(404)
    expect((await res.json()).detail).toMatch(/Player\.id nor an account email/)
  })
})
