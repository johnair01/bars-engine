#!/usr/bin/env npx tsx
import {
    STORY_CUBE_RULES,
    STORY_CUBE_STATES,
    getStoryCubeRule,
    tryGetStoryCubeRule,
} from '@/lib/cube-quest-rules'

function assert(condition: unknown, message: string) {
    if (!condition) {
        throw new Error(message)
    }
}

function testAllStatesMapped() {
    assert(STORY_CUBE_STATES.length === 8, 'Expected exactly 8 cube states')
    assert(Object.keys(STORY_CUBE_RULES).length === 8, 'Expected exactly 8 cube rules')

    STORY_CUBE_STATES.forEach((state) => {
        const rule = getStoryCubeRule(state)
        assert(rule.version === 1, `Expected rule version 1 for ${state}`)
        assert(rule.inputs.length >= 2, `Expected at least two inputs for ${state}`)
    })
}

function testRequiredKeysMatchSchema() {
    STORY_CUBE_STATES.forEach((state) => {
        const rule = getStoryCubeRule(state)
        const requiredFromInputs = rule.inputs
            .filter((input) => input.required)
            .map((input) => input.key)
            .sort()
        const requiredFromRule = [...rule.requiredInputKeys].sort()

        assert(
            JSON.stringify(requiredFromInputs) === JSON.stringify(requiredFromRule),
            `Required input keys mismatch for ${state}`
        )
        assert(requiredFromRule.length > 0, `Expected at least one required key for ${state}`)
    })
}

function testAssistShape() {
    const requiresAssist = STORY_CUBE_STATES.filter((state) => getStoryCubeRule(state).requiresAssist)
    const allowsSolo = STORY_CUBE_STATES.filter((state) => !getStoryCubeRule(state).requiresAssist)

    assert(requiresAssist.length === 4, `Expected 4 assist-required states, got ${requiresAssist.length}`)
    assert(allowsSolo.length === 4, `Expected 4 solo-allowed states, got ${allowsSolo.length}`)
    assert(
        requiresAssist.every((state) => state.endsWith('_EXTERIOR')),
        'Assist-required states should be EXTERIOR in this ruleset'
    )
}

function testLookupSafety() {
    assert(tryGetStoryCubeRule('SEEK_DARE_EXTERIOR') !== null, 'Expected valid state lookup to succeed')
    assert(tryGetStoryCubeRule('INVALID_STATE') === null, 'Expected invalid state lookup to return null')
    assert(tryGetStoryCubeRule(null) === null, 'Expected null state lookup to return null')
}

function main() {
    testAllStatesMapped()
    testRequiredKeysMatchSchema()
    testAssistShape()
    testLookupSafety()
    console.log('Cube quest rules tests passed')
}

main()
