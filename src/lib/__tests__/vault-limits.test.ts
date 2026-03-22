/**
 * Pure helpers for vault caps — no DB.
 */
import assert from 'node:assert/strict'
import { readVaultCap } from '@/lib/vault-limits'

function testReadVaultCap() {
    assert.equal(readVaultCap(undefined, 100), 100)
    assert.equal(readVaultCap('', 100), 100)
    assert.equal(readVaultCap('50', 100), 50)
    assert.equal(readVaultCap('0', 100), null)
    assert.equal(readVaultCap('-1', 100), null)
    assert.equal(readVaultCap('not-a-number', 100), 100)
}

testReadVaultCap()
console.log('vault-limits: readVaultCap OK')
