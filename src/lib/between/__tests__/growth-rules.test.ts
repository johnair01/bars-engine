import { describe, expect, it } from 'vitest'
import { mayWrite, homeWrite, pouchWrite, roomSummary, MOVES, type Doc, type Who } from '@/lib/between/rules'
import { leavesWaiting, noticeCopy, readStopToken, stopToken } from '@/lib/between/notice'
import * as G from '../../../../public/between/growth.js'
const TEAS: string[] = (G as any).TEAS

// friendship-between-growth: the cup, the hearth spirit, the ember that wakes, the notices switch, the lit door, the notice email.
const A = 'a', B = 'b'
const who = (id: string): Who => ({ playerId: id, member: true, invited: false })
const room: Doc = { v: 1, kind: 'room', startedBy: A, phase: 'between', members: { [A]: {}, [B]: {} }, startedAt: 1, betweenSince: 1 }
const w = (id: string, table: 'items' | 'spirits', op: 'set' | 'update' | 'delete', data: Doc | null, cur: Doc | null = null, here = false) =>
  mayWrite(who(id), room, { table, id: 'x' }, op, data, cur, undefined, 10, here)

describe('the cup (FR-007)', () => {
  const cup: Doc = { kind: 'cup', by: A, at: 5, tea: 'hearth', status: 'poured' }
  it('is poured covered by one friend, with no words', () => {
    expect(w(A, 'items', 'set', cup).ok).toBe(true)
    expect(w(A, 'items', 'set', { ...cup, text: 'hi' }).ok).toBe(false)
    expect(w(A, 'items', 'set', { ...cup, tea: 'poison' }).ok).toBe(false)
    expect(w(A, 'items', 'set', { ...cup, status: 'drunk', drunkBy: B, drunkAt: 6 }).ok).toBe(false) // the other is not here
  })
  it('is written drunk at once only while the other friend is here, and only in their name', () => {
    expect(w(A, 'items', 'set', { ...cup, status: 'drunk', drunkBy: B, drunkAt: 6 }, null, true).ok).toBe(true)
    expect(w(A, 'items', 'set', { ...cup, status: 'drunk', drunkBy: A, drunkAt: 6 }, null, true).ok).toBe(false)
  })
  it('is drunk once, by the other friend, as themselves', () => {
    expect(w(B, 'items', 'update', { status: 'drunk', drunkBy: B, drunkAt: 7 }, cup).ok).toBe(true)
    expect(w(B, 'items', 'update', { status: 'drunk', drunkBy: A, drunkAt: 7 }, cup).ok).toBe(false)
    expect(w(A, 'items', 'update', { status: 'drunk', drunkBy: B, drunkAt: 7 }, cup).ok).toBe(false) // the pourer cannot drink for them
    expect(w(B, 'items', 'update', { status: 'drunk', drunkBy: B, drunkAt: 8 }, { ...cup, status: 'drunk', drunkBy: B, drunkAt: 7 }).ok).toBe(false)
  })
  it('stays until drunk; spends are written only by the friendship game', () => {
    expect(w(A, 'items', 'delete', null, cup).ok).toBe(true)
    expect(w(A, 'items', 'delete', null, { ...cup, status: 'drunk', drunkBy: B, drunkAt: 7 }).ok).toBe(false)
    expect(w(A, 'items', 'set', { kind: 'spend', by: A, at: 5 }).ok).toBe(false)
  })
  it('all the teas are accepted', () => { for (const t of TEAS) expect(w(A, 'items', 'set', { kind: 'cup', by: A, at: 5, tea: t, status: 'poured' }).ok).toBe(true) })
})

describe('the hearth spirit (FR-011, FR-012)', () => {
  const sp: Doc = { owner: A, name: 'Ash', element: 'fire', form: 'fox', fromEmber: true, hearth: true, at: 9 }
  it('wakes as the waker\'s own, with the form its element gives', () => {
    expect(w(A, 'spirits', 'set', sp).ok).toBe(true)
    expect(w(A, 'spirits', 'set', { ...sp, form: 'tortoise' }).ok).toBe(false)
    expect(w(A, 'spirits', 'set', { ...sp, element: 'earth', form: 'tortoise' }).ok).toBe(true)
    expect(w(B, 'spirits', 'set', sp).ok).toBe(false)
  })
  it('either friend may let it rest; only its keeper names it; nobody deletes it', () => {
    expect(w(B, 'spirits', 'update', { resting: true }, sp).ok).toBe(true)
    expect(w(B, 'spirits', 'update', { name: 'Mine' }, sp).ok).toBe(false)
    expect(w(A, 'spirits', 'update', { name: 'Cinder' }, sp).ok).toBe(true)
    expect(w(A, 'spirits', 'delete', null, sp).ok).toBe(false)
    expect(w(B, 'spirits', 'delete', null, sp).ok).toBe(false)
  })
  it('a visiting spirit is still its owner\'s alone', () => {
    expect(w(B, 'spirits', 'update', { name: 'x' }, { owner: A }).ok).toBe(false)
  })
  it('an ember wakes once, after it has risen, as one spirit', () => {
    const ember = { move: Object.keys(MOVES)[0], state: 'lit', risen: true }
    expect(pouchWrite({ embers: { e1: { ...ember, woke: { spirit: 's1', at: 5 } } } }).ok).toBe(true)
    expect(pouchWrite({ embers: { e1: { move: ember.move, state: 'lit', woke: { spirit: 's1', at: 5 } } } }).ok).toBe(false)
    expect(pouchWrite({ embers: { e1: { ...ember, woke: { spirit: 's1', at: 5, text: 'x' } } } }).ok).toBe(false)
  })
})

describe('notices and the lit door (FR-008, FR-010)', () => {
  it('the switch is on or off', () => {
    expect(homeWrite({ notices: 'off' }).ok).toBe(true)
    expect(homeWrite({ notices: 'sometimes' }).ok).toBe(false)
  })
  it('a covered cup or an unanswered turn lights the door, and a drunk cup does not', () => {
    const s = (items: Doc[]) => roomSummary(B, 'g', room, items.map((data, i) => ({ id: 'i' + i, data })), { now: 5 })
    expect(s([]).lit).toBe(false)
    expect(s([{ kind: 'cup', by: A, at: 1, tea: 'hearth', status: 'poured' }])).toMatchObject({ lit: true, waiting: [{ what: 'cup' }] })
    expect(s([{ kind: 'cup', by: A, at: 1, tea: 'hearth', status: 'drunk', drunkBy: B, drunkAt: 2 }]).lit).toBe(false)
    expect(s([{ kind: 'cup', by: B, at: 1, tea: 'hearth', status: 'poured' }]).lit).toBe(false)
    expect(s([{ kind: 'turn', by: A, answer: { [A]: { at: 1 } } }]).waiting).toEqual([{ id: 'i0', what: 'turn' }])
  })
})

describe('the notice email (FR-009)', () => {
  it('signs the stop link so only the player it names can be stopped', () => {
    const t = stopToken('player-1')
    expect(readStopToken(t)).toBe('player-1')
    expect(readStopToken(t.replace(/.$/, c => (c === 'a' ? 'b' : 'a')))).toBeNull()
    expect(readStopToken(stopToken('player-2').split('.')[0] + '.' + t.split('.')[1])).toBeNull()
  })
  it('only an answer, a poured cup or an answered turn leaves something waiting', () => {
    expect(leavesWaiting('items', 'update', { answer: { b: { at: 1 } } })).toBe(false) // no kind: not a cast
    expect(leavesWaiting('items', 'update', { kind: 'cast', answer: { b: { at: 1 } } })).toBe(true)
    expect(leavesWaiting('items', 'set', { kind: 'cup', status: 'poured' })).toBe(true)
    expect(leavesWaiting('items', 'update', { status: 'drunk' })).toBe(false)
    expect(leavesWaiting('spirits', 'set', { kind: 'cup', status: 'poured' })).toBe(false)
  })
  it('names the friend and the Between, no card words and no number (FR-013)', () => {
    const c = noticeCopy('Mara', 'https://x/go', 'https://x/stop')
    for (const s of [c.subject, c.text]) { expect(s).not.toMatch(/\d/.test(s.replace(/https:\/\/\S+/g, '')) ? /x/ : /^$/); expect(s).not.toMatch(/streak|day|flame|score/i) }
    expect(c.subject).toBe('Mara answered you in your Between')
    expect(c.text).toContain('Stop these emails')
  })
})
