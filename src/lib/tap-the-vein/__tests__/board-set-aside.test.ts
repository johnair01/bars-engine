import { describe, expect, it, vi } from 'vitest'
import { setAsideFromBoard, setAsideOutcome } from '@/lib/tap-the-vein/board-set-aside'

const tx = (task: { playerId: string; status: string } | null) => ({
  tapTheVeinTask: { findUnique: vi.fn().mockResolvedValue(task), update: vi.fn().mockResolvedValue({}) },
  tapTheVeinTaskNote: { create: vi.fn().mockResolvedValue({}) },
})

describe('Set aside from the Council Board', () => {
  it('rests only a live task', () => {
    expect(setAsideOutcome('committed')).toBe('rest')
    expect(setAsideOutcome('in_progress')).toBe('rest')
    expect(setAsideOutcome('resting')).toEqual({ ok: true, already: true })
    expect(setAsideOutcome('carried_over')).toMatchObject({ ok: false, status: 409, error: 'It is carried over, so it cannot rest' })
    expect(setAsideOutcome('completed')).toMatchObject({ ok: false, status: 409 })
    expect(setAsideOutcome(null)).toMatchObject({ ok: false, status: 404 })
  })

  it('sets the task resting with one dated library note', async () => {
    const t = tx({ playerId: 'p1', status: 'committed' })
    const r = await setAsideFromBoard(t as never, 'p1', 't1', new Date('2026-10-16T19:00:00Z'))
    expect(r).toEqual({ ok: true, already: false })
    expect(t.tapTheVeinTask.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { status: 'resting' } })
    expect(t.tapTheVeinTaskNote.create).toHaveBeenCalledWith({ data: { taskId: 't1', playerId: 'p1', kind: 'library',
      body: 'Set aside to the seed library on 2026-10-16.' } })
  })

  it('is safe to save twice and leaves other players\' tasks alone', async () => {
    const resting = tx({ playerId: 'p1', status: 'resting' })
    expect(await setAsideFromBoard(resting as never, 'p1', 't1')).toEqual({ ok: true, already: true })
    expect(resting.tapTheVeinTaskNote.create).not.toHaveBeenCalled()
    const theirs = tx({ playerId: 'p2', status: 'committed' })
    expect(await setAsideFromBoard(theirs as never, 'p1', 't1')).toMatchObject({ ok: false, status: 404 })
    expect(theirs.tapTheVeinTask.update).not.toHaveBeenCalled()
  })
})
