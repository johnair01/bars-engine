import { beforeEach, describe, expect, it } from 'vitest'
import { setBackend } from '../content-store'
import { memoryBackend } from './memory-backend'
import { heldFor, match, problems, readTools } from '../scout'

/** A small toolbox; every expectation below is what council/tools/scout.py prints on this same file. */
const TOOLBOX = `tools:
  - id: ual-clips
    does: Universal Animation Library, 46 motion clips for the cultivation skeleton (walk, jog, jump, roll, sit)
    tags: [animation, clips, motion, rigging, cultivation]
    where: public/between/cult/clips
    licence: CC0; free use
    status: proven
    kind: library
    when: any run, jump, walk or sit on the cultivation figure
    proof: clip lab 1
  - id: blender-gate
    does: Headless Blender checks that judge a mesh before it ships
    tags: [blender, mesh, qa]
    where: council/tools/blender_gate.py
    licence: MIT
    status: in_use
    kind: check
    when: any mesh made or edited in Blender
    proof: pull 1400
  - id: motionbricks
    does: Offline motion generation that bakes clips from a text prompt
    tags: [animation, motion, generation]
    where: notebook
    licence: per asset
    status: available
    kind: tool
    when: a motion no clip covers
    proof: untried
  - id: sketchfab
    does: Model marketplace
    tags: [models]
    where: web
    licence: per asset
    status: rejected
    kind: service
    when: never
    proof: rejected
`

const clips = 'run and jump for the cultivation figure'
const brief = (job: string, scout: string) => `job: ${job}\nscout: ${scout}\n`

describe('scout door', () => {
  beforeEach(() => setBackend(memoryBackend({ 'council/toolbox.yaml': TOOLBOX }).backend))

  it('ranks the held tool for a job and drops a rejected one', async () => {
    const { tools } = await readTools()
    expect(match(tools, clips).map((t) => t.id)).toEqual(['ual-clips'])
    expect(heldFor(tools, clips).map((t) => t.id)).toEqual(['ual-clips'])
    expect(match(tools, 'a motion generation').map((t) => t.id)).toEqual(['motionbricks', 'ual-clips'])
    expect(match(tools, 'marketplace models')).toEqual([])
  })

  it('fails a brief that skips a held tool, and passes one that uses it or says why not', async () => {
    const { tools } = await readTools()
    expect(problems(tools, brief(clips, '5, none fits'))).toEqual([
      'we hold `ual-clips` for this job (any run, jump, walk or sit on the cultivation figure); the `scout:` line '
      + 'must use it or pass it over with a reason, as `passed over: ual-clips (why)`'])
    expect(problems(tools, brief(clips,
      '3, ual-clips (plays the run and jump clips on the cultivation bones); passed over: motionbricks (no clip needed)')))
      .toEqual([])
    expect(problems(tools, '- **job:** mesh for a hat\n- **scout:** 3, blender-gate (checks it)\n')).toEqual([])
    expect(problems(tools, 'job: x\nscout: no build (clerical pass only)\n')).toEqual([])
    expect(problems(tools, 'nothing here\n')[0]).toContain('no `scout:` line')
  })

  it('says so when the inventory has not been pushed', async () => {
    setBackend(memoryBackend({}).backend)
    expect((await readTools()).error).toContain('not in the store')
  })
})
