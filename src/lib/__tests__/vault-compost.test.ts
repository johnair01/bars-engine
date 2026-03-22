/**
 * Vault Compost helpers — no DB.
 */
import assert from 'node:assert/strict'
import {
    parseSalvagePayload,
    serializeSalvagePayload,
    normalizeCompostSourceIds,
    COMPOST_MAX_SOURCES,
} from '@/lib/vault-compost'

function testParseSalvage() {
    const bad = parseSalvagePayload({ salvageLinesRaw: '   \n  ' })
    assert.equal(bad.ok, false)

    const good = parseSalvagePayload({
        salvageLinesRaw: ' keep this \n\n and this ',
        tagsRaw: ' a , b ',
        releaseNoteRaw: ' letting go ',
    })
    assert.equal(good.ok, true)
    if (good.ok) {
        assert.deepEqual(good.payload.salvageLines, ['keep this', 'and this'])
        assert.deepEqual(good.payload.tags, ['a', 'b'])
        assert.equal(good.payload.releaseNote, 'letting go')
        const json = serializeSalvagePayload(good.payload)
        assert.ok(json.includes('keep this'))
    }
}

function testNormalizeIds() {
    assert.deepEqual(normalizeCompostSourceIds(['a', 'a', ' b ']), ['a', 'b'])
    assert.throws(() => normalizeCompostSourceIds([]))
    assert.throws(() => normalizeCompostSourceIds(Array.from({ length: COMPOST_MAX_SOURCES + 1 }, (_, i) => `x${i}`)))
}

testParseSalvage()
testNormalizeIds()
console.log('vault-compost: parseSalvagePayload + normalizeCompostSourceIds OK')
