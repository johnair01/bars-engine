import assert from 'node:assert'
import { rankToPromptMove, promptMoveFamilyLabel } from '../rank-move-map'

assert.strictEqual(rankToPromptMove(0), null)
assert.strictEqual(rankToPromptMove(14), null)

const w1 = rankToPromptMove(1)
assert.ok(w1 && w1.family === 'wakeUp' && w1.level === 1)

const w3 = rankToPromptMove(3)
assert.ok(w3 && w3.family === 'wakeUp' && w3.level === 3)

const c1 = rankToPromptMove(4)
assert.ok(c1 && c1.family === 'cleanUp' && c1.level === 1)

const g2 = rankToPromptMove(8)
assert.ok(g2 && g2.family === 'growUp' && g2.level === 2)

const s3 = rankToPromptMove(12)
assert.ok(s3 && s3.family === 'showUp' && s3.level === 3)

const wild = rankToPromptMove(13)
assert.ok(wild && wild.family === 'wild' && wild.level === null)

for (let r = 1; r <= 13; r++) {
  assert.ok(rankToPromptMove(r), `rank ${r}`)
}

assert.ok(promptMoveFamilyLabel('wakeUp').includes('Wake'))

console.log('prompt-deck rank-move-map: OK')
