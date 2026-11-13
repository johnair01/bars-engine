import { beforeEach, describe, expect, it } from 'vitest'
import { setBackend } from '../content-store'
import { memoryBackend } from './memory-backend'
import {
  assetBrief, canonBlock, evaluateMechanic, faceLens, LINE_CAP, ontologyProfile, pipelineNext, pipelineStatus, readLoop,
  statusLines, verifyRound,
} from '../pipeline'

const LOOP = {
  strand: 'hand-grip',
  callsheet: 'council/callsheets/hand-grip.md',
  deft: {
    made: '2026-11-10T18:53:55Z',
    node_types: ['figure', 'held prop'],
    place: null,
    floor: null,
    floor_note: 'no place has no floor in council/look/floors.json, so no floor runs',
    references: [
      { id: 'hand-grip-look-2', still: 'https://bars-engine.vercel.app/board/stills/sha/aa.png', answer: 'Use this hold' },
    ],
    checks: [
      {
        id: 'thumb_side', note: 'The thumb is on the wrong side of the brush', look: 'hand-grip-look-5',
        types: ['held prop'], reads: { 'numbers.json': ['hold', 'thumbPose.padHeightMm.thumb'] },
        bound: 'thumb pad height over the shaft is 0 mm or below', holds: 'yes',
      },
      {
        id: 'finger_pad_gap', note: "hand isn't convincingly picking up the sword", look: 'cc-gate-look-13',
        types: ['held prop'], reads: { 'numbers.json': ['hold', 'padGapMm'] },
        bound: 'every gripping pad within 2.0 mm of the prop', holds: 'no', holds_by_hold: { write: 'yes', wrap: 'no' },
      },
    ],
    emits: { 'numbers.json': ['hold', 'padGapMm'], images: ['the close-up named the same in this round and the last'] },
    run: 'python3 council/judge/run_loop.py hand-grip <round folder> [--last <last round folder>]',
  },
}

const CALLSHEET = `# Callsheet: hand grip and object holding

## Part 7 (2026-11-10): the brush stands upright

Numbers pass.

## NEXT (part 8), one Sonnet thread

1. Read the last section of this callsheet.
2. Shoot the close-ups and post hand-grip-look-2.

## Signed

- intake: shaman, diplomat (2026-11-09)
- spec: architect, regent (2026-11-13)
`

const PIPELINE = `contract:
  check: python3 council/tools/contract_check.py <spec folder> [--through <stage>]
  field_owners:
    design_intent: diplomat
    intrinsic_pleasure: shaman
    ontology_objects: sage
    mechanical_claims: architect
    aqal_attention: shaman
    agency_and_consent: diplomat
    evidence_and_unknowns: sage
    provenance_effects: regent
    risks_and_tests: challenger
    implementation_translation: architect
    decision_or_open_authority: regent

stages:
  - id: intake
    owners: [shaman, diplomat]
    gate: >
      The ask is quoted, and who it is for is named.
  - id: spec
    owners: [architect, regent]
    gate: >
      Each design decision says whose it is.
  - id: assets
    owners: [regent, architect]
    gate: >
      python3 council/tools/asset_callsheet.py check passes.
  - id: build
    owners: [architect]
    gate: >
      The repo's own checks pass.
`

const FACES = `order: [shaman, architect]

reach_test: >
  Before a question leaves the council, the Sage sends it back.

faces:
  shaman:
    altitude: magenta
    lens: What is moving underneath? What is the felt sense?
    standing_test: >
      Does it say something is wrong with them, or something about what I have learned?
    lessons:
      - date: 2026-11-09
        source: council/callsheets/hand-grip.md, the grip note
        wendell: The thumb is on the wrong side of the brush
        lesson: A grip check comes from his own note on the round.
  architect:
    altitude: orange
    lens: What must be true in the machine?
    standing_test: >
      Does it buy a mechanic?
    lessons:
      - date: 2026-10-02
        source: council/passes/6FACE_PASS5_2026-10-02.md, position pipe-steps-page
        wendell: I think a tab on this board is quite useful
        lesson: One place to look beats separating surfaces.
`

const ONTOLOGY = `package:
  id: wendell-design-ontology
  home: ontology/v0.1
load_profiles:
  default:
    - ontology/v0.1/QUICKSTART.md
  game_design:
    - ontology/v0.1/QUICKSTART.md
    - ontology/v0.1/source/design-ontology-v0.1.yaml
`

const MECHANIC = `# The seal. Proposed by thread "Envision API-first work as a game" (2026-10-31), from his ask:
# "We don't want GitHub merges to be the way we find and execute on work."
name: lading-seal
player_verb: load the hold, press the seal
world_response: a ship docks at its berth only with a full, sealed hold
emotion_bent: fear
standard: every card he opens shows everything it names
tried_in: none yet
status: proposed
feel_status: proposed by the council 2026-10-31; every number is a proposal until Wendell looks
feel:
  response: 0.3 s ease-out-cubic press; the wax lights over 0.15 s
tune:
  - {key: press, label: "the seal presses", value: 0.3, min: 0.05, max: 1.2, step: 0.05, unit: "s", feel: "response", says: "{v} s ease-out-cubic press"}
  - {key: wax, label: "the wax lights", value: 0.15, min: 0.05, max: 0.8, step: 0.05, unit: "s", feel: "response", says: "lights over {v} s"}
`

const receipt = (held: boolean, checks: { id: string; status: string; holds: string }[]) => JSON.stringify({
  strand: 'hand-grip', round: 'r', at: '2026-11-13T00:00:00Z', registry: 'abcd1234', last: null, held,
  line: `judge: ${held ? 'held' : 'not held'}; checks fail only, the round still needs his look`, checks,
})

const seed = (extra: Record<string, string> = {}) => ({
  'council/loops/hand-grip.json': JSON.stringify(LOOP),
  'council/callsheets/hand-grip.md': CALLSHEET,
  'council/pipeline.yaml': PIPELINE,
  'council/faces.yaml': FACES,
  'ontology/manifest.yaml': ONTOLOGY,
  'canon/mechanics/lading-seal.yaml': MECHANIC,
  'council/callsheets/stills/r-held/judge.json': receipt(true, [
    { id: 'thumb_side', status: 'fail', holds: 'yes' },
    { id: 'finger_pad_gap', status: 'pass', holds: 'no' },
  ]),
  'council/callsheets/stills/r-clear/judge.json': receipt(false, [
    { id: 'thumb_side', status: 'pass', holds: 'yes' },
    { id: 'finger_pad_gap', status: 'pass', holds: 'no' },
  ]),
  'council/callsheets/stills/r-stale/judge.json': receipt(false, [
    { id: 'finger_pad_gap', status: 'pass', holds: 'no' },
  ]),
  ...extra,
})

beforeEach(() => { setBackend(memoryBackend(seed())) })

describe('the loop', () => {
  it('reads a strand\'s deft checks with his note quoted', async () => {
    const { loop, path, error } = await readLoop('hand-grip')
    expect(error).toBeNull()
    expect(path).toBe('council/loops/hand-grip.json')
    const checks = loop?.deft?.checks ?? []
    expect(checks.map((c) => c.id)).toEqual(['thumb_side', 'finger_pad_gap'])
    expect(checks[0].note).toBe('The thumb is on the wrong side of the brush')
  })

  it('refuses a strand the store holds no loop for', async () => {
    const { loop, error } = await readLoop('no-such-strand')
    expect(loop).toBeNull()
    expect(error).toContain('make_loop.py no-such-strand')
  })
})

describe('the standing', () => {
  it('names the stage his Signed lines reached, the open gaps and the next gate', async () => {
    const s = await pipelineStatus('hand-grip')
    expect(s.stage?.id).toBe('spec')
    expect(s.stage?.source).toBe('council/callsheets/hand-grip.md:15')
    expect(s.gaps.map((g) => g.check)).toEqual(['finger_pad_gap'])
    expect(s.next?.stage).toBe('assets')
    expect(s.next?.command).toBe('python3 council/tools/asset_callsheet.py')
    expect(s.next?.source).toBe('council/pipeline.yaml:25')
  })

  it('answers inside the line cap, each fact naming its file', async () => {
    const out = statusLines(await pipelineStatus('hand-grip'))
    expect(out.length).toBeLessThanOrEqual(LINE_CAP)
    expect(out.join('\n')).toContain('council/loops/hand-grip.json')
    expect(out.join('\n')).toContain('stage: spec')
    expect(out.join('\n')).toContain('gap finger_pad_gap: "hand isn\'t convincingly picking up the sword"')
  })

  it('answers one next stage', async () => {
    const n = await pipelineNext('hand-grip')
    expect(n.stage?.id).toBe('spec')
    expect(n.next?.stage).toBe('assets')
  })
})

describe('the brief', () => {
  it('carries the node type, existing:, proof: and the emits list', async () => {
    const r = await assetBrief('hand-grip', 'held prop')
    expect(r.error).toBeNull()
    const text = r.brief?.brief ?? ''
    expect(text).toContain('held prop')
    expect(text).toContain('existing:')
    expect(text).toContain('hand-grip-look-2')
    expect(text).toContain('proof: python3 council/judge/run_loop.py hand-grip')
    expect(text).toContain('numbers.json: hold, padGapMm')
    expect(text).toContain('images: the close-up named the same in this round and the last')
    expect(r.brief?.order).toEqual(['Read the last section of this callsheet.', 'Shoot the close-ups and post hand-grip-look-2.'])
    expect(r.brief?.checks).toEqual(['thumb_side', 'finger_pad_gap'])
  })
})

describe('the verdict', () => {
  it('refuses a round with no receipt and names the run that writes one', async () => {
    const v = await verifyRound('hand-grip', 'r-missing')
    expect(v.ok).toBe(false)
    expect(v.reason).toContain('no receipt at council/callsheets/stills/r-missing/judge.json')
    expect(v.reason).toContain('run_loop.py hand-grip')
  })

  it('refuses a held round with the failing check and his sentence', async () => {
    const v = await verifyRound('hand-grip', 'r-held')
    expect(v.ok).toBe(false)
    expect(v.refused.map((r) => r.id)).toEqual(['thumb_side'])
    expect(v.refused[0].sentence).toBe('"The thumb is on the wrong side of the brush"')
  })

  it('refuses a receipt that predates a check the loop runs now', async () => {
    const v = await verifyRound('hand-grip', 'r-stale')
    expect(v.ok).toBe(false)
    expect(v.stale).toEqual(['thumb_side'])
    expect(v.reason).toContain('predates thumb_side')
  })

  it('answers the judge line for a clear round', async () => {
    const v = await verifyRound('hand-grip', 'council/callsheets/stills/r-clear')
    expect(v.ok).toBe(true)
    expect(v.judge).toContain('judge: not held')
  })
})

describe('canon, ontology and a mechanic', () => {
  it('answers a mechanic block with his said line and the ask that remains', async () => {
    const { block, error } = await canonBlock('lading-seal')
    expect(error).toBeNull()
    expect(block?.kind).toBe('mechanic')
    expect(block?.rule).toContain('a ship docks at its berth only with a full, sealed hold')
    expect(block?.said).toContain("We don't want GitHub merges")
    expect(block?.ask).toContain('proposal until Wendell looks')
    expect(block?.source.startsWith('canon/mechanics/lading-seal.yaml:')).toBe(true)
  })

  it('refuses a canon block that does not exist', async () => {
    const { block, error } = await canonBlock('no-such-rule')
    expect(block).toBeNull()
    expect(error).toContain('no canon block named no-such-rule')
  })

  it('answers a load profile and the eleven fields a stage owes', async () => {
    const p = await ontologyProfile('game_design')
    expect(p.loads).toEqual(['ontology/v0.1/QUICKSTART.md', 'ontology/v0.1/source/design-ontology-v0.1.yaml'])
    expect(p.fields).toHaveLength(11)
    expect(p.fields[0]).toEqual({ field: 'design_intent', owner: 'diplomat' })
    expect((await ontologyProfile('no-such-kind')).error).toContain('game_design')
  })

  it('shows a mechanic\'s arithmetic and holds a fader to its feel line', async () => {
    const held = await evaluateMechanic('lading-seal', { press: 0.5 })
    expect(held.result?.faders.find((f) => f.key === 'press')?.said).toBe('0.5 s ease-out-cubic press')
    expect(held.result?.ok).toBe(false)
    expect(held.result?.failures.join(' ')).toContain('feel.response does not say')

    const clear = await evaluateMechanic('lading-seal', {})
    expect(clear.result?.ok).toBe(true)
    expect(clear.result?.faders.find((f) => f.key === 'press')?.inRange).toBe(true)
  })
})

describe('the faces', () => {
  it('keeps the lenses in the file\'s order and the lessons that bear on the strand', async () => {
    const l = await faceLens('hand-grip')
    expect(l.faces.map((f) => f.face)).toEqual(['shaman', 'architect'])
    expect(l.faces[0].lens).toContain('What is moving underneath?')
    expect(l.faces[0].standing_test).toContain('Does it say something is wrong with them')
    expect(l.faces[0].lessons).toHaveLength(1)
    expect(l.faces[1].lessons).toHaveLength(0)
  })
})
