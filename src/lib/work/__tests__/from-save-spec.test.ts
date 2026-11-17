import { describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({ latestDoc: vi.fn(), pushTicket: vi.fn() }))
vi.mock('@/lib/board/store', () => ({ latestDoc: mocked.latestDoc }))
vi.mock('../queue', () => ({ pushTicket: mocked.pushTicket }))

import { ticketFromSave } from '../from-save'

describe('spec blocker answer', () => {
  it('does not create a second Board-answer ticket', async () => {
    mocked.latestDoc.mockResolvedValue({ kind: 'questions', specTask: 'spec:pilot/T001',
      q: 'How should the task continue?', options: [{ v: 'resume', label: 'Resume' }] })
    expect(await ticketFromSave({} as never, 'council', 'questions', 'spec-stop-abc', { choice: 'resume' })).toBeNull()
    expect(mocked.pushTicket).not.toHaveBeenCalled()
  })
})
