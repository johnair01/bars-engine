import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// The Friends' Fire song engine (spec ctw-friends-fire FR-002 to FR-005, FR-008), ported from the council's reel round 2
// (Wendell's A on ctw-fire-reel-look-2, "It lands, build from it"). The script is the reel's own, so the build plays
// the sittings he scored. These are the reel's check.js rules R1 to R15.
import * as E from '../../../../public/between/land/fire-song.js'

type Step = { move?: string; degree?: number; t?: number; channel?: string; refused?: boolean }
const S = JSON.parse(readFileSync(join(__dirname, 'fixtures/fire-song-script.json'), 'utf8')) as {
  stump: number[]
  sittings: Record<string, { steps: Step[] }>
}
const run = (k: string) => {
  let song = E.newSong({ stump: S.stump })
  for (const st of S.sittings[k].steps) if (st.move) song = E.move(song, st)
  return song
}
const [A, B, C, D, G, H, J] = ['A', 'B', 'C', 'D', 'G', 'H', 'J'].map(run)

describe('fire-song', () => {
  it('R1 the three scripted endings differ', () => {
    expect(E.ending(A)).not.toEqual(E.ending(B))
    expect(E.ending(A)).not.toEqual(E.ending(C))
    expect(E.ending(B)).not.toEqual(E.ending(C))
  })
  it('R2 no Oriel note without a hand-over or pass, however long you wait', () => {
    expect(E.timeline(H)).toBeNull()
    expect(E.phaseAt(H, 1e6).phase).toBe('playing')
  })
  it('R3 R4 every ending is 4 to 6 notes, ends on home and starts on your last note', () => {
    const walk = (seq: number[]) => {
      let song = E.newSong({ stump: S.stump })
      seq.forEach((d, i) => { song = E.play(song, d, i * 1.1) })
      const e = E.ending(song)
      expect(e[e.length - 1]).toBe(0)
      expect(e.length).toBeGreaterThanOrEqual(4)
      expect(e.length).toBeLessThanOrEqual(6)
      if (seq.length) expect(e[0]).toBe(seq[seq.length - 1])
      if (seq.length < 4) for (let d = 0; d < 5; d++) walk(seq.concat([d]))
    }
    walk([])
  })
  it('R5 tempo is held to 60..110 bpm, 84 for one note or none', () => {
    for (const gap of [0.1, 0.3, 0.55, 1, 3, 9]) {
      let s = E.newSong()
      ;[0, 1, 2].forEach((d, i) => { s = E.play(s, d, i * gap) })
      expect(E.tempo(s)).toBeGreaterThanOrEqual(60)
      expect(E.tempo(s)).toBeLessThanOrEqual(110)
    }
    expect(E.tempo(E.newSong())).toBe(84)
    expect(E.tempo(B)).toBe(84)
  })
  it('R6 R7 Oriel enters one beat after the hand-over; a quicker player gets a quicker Oriel', () => {
    const tlA = E.timeline(A)!, tlD = E.timeline(D)!
    expect(tlA.notes[0].t).toBeCloseTo(A.handedAt! + tlA.beat, 9)
    expect(tlD.notes[0].t).toBeCloseTo(D.handedAt! + tlD.beat, 9)
    expect(E.ending(A)).toEqual(E.ending(D))
    expect(tlD.beat).toBeLessThan(tlA.beat)
  })
  it('R8 refused moves say why and change nothing', () => {
    let refused = 0
    for (const k of ['E', 'F', 'J']) {
      let song = E.newSong({ stump: S.stump })
      for (const st of S.sittings[k].steps) {
        if (!st.move) continue
        const next = E.move(song, st)
        if (st.refused) {
          refused++
          expect(next.refused).toBeTruthy()
          expect({ ...next, refused: null }).toEqual({ ...song, refused: null })
        } else expect(next.refused).toBeNull()
        song = next
      }
    }
    expect(refused).toBe(9)
  })
  it('R9 R10 a pass plays the bar and its cadence; an empty hand-over starts on the stump note', () => {
    const tlC = E.timeline(C)!
    expect(E.ending(C)).toEqual([3, 2, 1, 0])
    expect(tlC.notes).toHaveLength(11)
    expect(E.ending(G)[0]).toBe(S.stump[S.stump.length - 1])
  })
  it('R11 R12 a 1.5 s silence before the laugh for every sitting, and nothing is scored', () => {
    for (const s of [A, B, C, D, G]) {
      const tl = E.timeline(s)!
      expect(tl.laughAt - tl.end).toBeCloseTo(1.5, 9)
      expect(E.phaseAt(s, tl.end + 1).phase).toBe('silence')
      expect(E.phaseAt(s, tl.laughAt + 0.01).phase).toBe('laugh')
      expect(Object.keys(tl).sort()).toEqual(['beat', 'bpm', 'end', 'laughAt', 'notes'])
      expect(Object.keys(s).some(k => /score|grade|rating/i.test(k))).toBe(false)
    }
  })
  it('R13 R14 a hand-over needs a tag, the last tag stands, and the tag changes no note or time', () => {
    expect(E.handOver(E.play(E.newSong(), 1, 0), 1).refused).toBeTruthy()
    expect([J.block, A.block, B.block]).toEqual(['earth', 'water', 'metal'])
    const other = { ...A, block: 'fire' }
    expect(E.timeline(other)).toEqual(E.timeline(A))
  })
  it('R15 each Oriel note is yours, passing or home', () => {
    expect(E.timeline(A)!.notes.map(n => n.kind)).toEqual(['yours', 'yours', 'yours', 'yours', 'home'])
    expect(E.timeline(B)!.notes.map(n => n.kind)).toEqual(['yours', 'passing', 'passing', 'home'])
  })
  it('reads the stump notes from sessionStorage or a ?song= seed', () => {
    expect(E.stumpNotes('[1,3,0,4]')).toEqual([1, 3, 0, 4])
    expect(E.stumpNotes('1,3,9,x,4')).toEqual([1, 3, 4])
    expect(E.stumpNotes(null)).toEqual([])
  })
})
