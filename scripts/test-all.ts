#!/usr/bin/env npx tsx
/**
 * Full Test Suite Runner
 * 
 * Runs all tests in sequence:
 * 1. Game loop behavior tests (DB + actions)
 * 2. UI HTML verification (public pages)
 * 
 * Usage: npx tsx scripts/test-all.ts
 */

import { execSync } from 'child_process'

const TESTS = [
    { name: 'Game Loop Behaviors', script: 'scripts/test-game-loop.ts' },
    { name: 'UI HTML Verification', script: 'scripts/test-ui-html.ts' },
]

async function main() {
    console.log('🚀 Full Test Suite\n')
    console.log('═'.repeat(50))

    let allPassed = true

    for (const test of TESTS) {
        console.log(`\n▶ ${test.name}`)
        console.log('─'.repeat(50))

        try {
            execSync(`npx tsx ${test.script}`, {
                stdio: 'inherit',
                cwd: process.cwd()
            })
        } catch (e) {
            allPassed = false
            console.log(`\n❌ ${test.name} failed`)
        }
    }

    console.log('\n' + '═'.repeat(50))

    if (allPassed) {
        console.log('\n✅ ALL TESTS PASSED\n')
        console.log('Verified:')
        console.log('  • Schema fields (kotterStage, archetypeMove, generation)')
        console.log('  • Stage progression logic')
        console.log('  • Affinity matching')
        console.log('  • Public pages render correctly')
        console.log('')
        console.log('⚠️  For auth-protected pages (/bars/available, /wallet, /iching):')
        console.log('   Use manual verification or deploy to preview URL')
    } else {
        console.log('\n❌ SOME TESTS FAILED\n')
        process.exit(1)
    }
}

main().catch(console.error)
