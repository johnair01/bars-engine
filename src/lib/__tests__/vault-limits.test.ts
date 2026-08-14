/**
 * Pure helpers for vault caps — no DB.
 */
import assert from 'node:assert/strict'
import {
    readVaultCap,
    isVaultCapacityError,
    stripVaultCompostPath,
    VAULT_CAP_MESSAGES,
} from '@/lib/vault-limits'

function testReadVaultCap() {
    assert.equal(readVaultCap(undefined, 100), 100)
    assert.equal(readVaultCap('', 100), 100)
    assert.equal(readVaultCap('50', 100), 50)
    assert.equal(readVaultCap('0', 100), null)
    assert.equal(readVaultCap('-1', 100), null)
    assert.equal(readVaultCap('not-a-number', 100), 100)
}

/**
 * The capture form decides whether to offer inline composting by asking whether
 * an error is a capacity error, so these two must track VAULT_CAP_MESSAGES.
 */
function testCapacityErrorDetection() {
    const drafts = VAULT_CAP_MESSAGES.privateDraftsAtCapacity(100)
    const quests = VAULT_CAP_MESSAGES.unplacedQuestsAtCapacity(50)

    assert.equal(isVaultCapacityError(drafts), true)
    assert.equal(isVaultCapacityError(quests), true)

    // Anything else must stay a plain error — offering "compost to fix it" on an
    // unrelated failure would send the player somewhere that cannot help.
    assert.equal(isVaultCapacityError('Say what feels charged'), false)
    assert.equal(isVaultCapacityError('Not authorized to view this BAR'), false)
    assert.equal(isVaultCapacityError(null), false)
    assert.equal(isVaultCapacityError(undefined), false)
    assert.equal(isVaultCapacityError(''), false)
}

function testStripCompostPath() {
    const drafts = VAULT_CAP_MESSAGES.privateDraftsAtCapacity(100)
    const quests = VAULT_CAP_MESSAGES.unplacedQuestsAtCapacity(50)

    // The raw route is what the player saw as un-clickable text in the report.
    assert.ok(drafts.includes('(/vault/compost)'))
    assert.ok(!stripVaultCompostPath(drafts).includes('/vault/compost'))
    assert.ok(!stripVaultCompostPath(quests).includes('/vault/compost'))

    // The rest of the sentence survives, including the cap number.
    assert.ok(stripVaultCompostPath(drafts).includes('100 max'))
    assert.ok(stripVaultCompostPath(drafts).startsWith('Your Vault is full'))
    assert.ok(stripVaultCompostPath(quests).includes('Quests room'))

    // No double spaces left where the path was removed.
    assert.ok(!/ {2}/.test(stripVaultCompostPath(drafts)))

    // Safe on a message that never had the path.
    assert.equal(stripVaultCompostPath('plain'), 'plain')
}

testReadVaultCap()
testCapacityErrorDetection()
testStripCompostPath()
console.log('vault-limits: readVaultCap + capacity-error helpers OK')
