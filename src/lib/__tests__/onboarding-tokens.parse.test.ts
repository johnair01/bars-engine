/**
 * Onboarding token parsing — Tests
 *
 * Run with: npx tsx src/lib/__tests__/onboarding-tokens.parse.test.ts
 */

import {
    parseTokenSetLine,
    extractTokenSets,
    findInputSpecs,
    interpolate,
} from '../onboarding-tokens'

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`)
    }
}

function testParseTokenSet() {
    const r = parseTokenSetLine('[TOKEN] SET lens=community')
    assert(r !== null, 'Should parse token set')
    assert(r!.key === 'lens', 'Key should be lens')
    assert(r!.value === 'community', 'Value should be community')

    const r2 = parseTokenSetLine('[TOKEN] SET donationSource=EmotionalFuel')
    assert(r2 !== null, 'Should parse donationSource')
    assert(r2!.key === 'donationSource', 'Key should be donationSource')
    assert(r2!.value === 'EmotionalFuel', 'Value should be EmotionalFuel')

    const r3 = parseTokenSetLine('normal text')
    assert(r3 === null, 'Non-token line should return null')

    const r4 = parseTokenSetLine('[TOKEN] SET key="quoted value"')
    assert(r4 !== null && r4!.value === 'quoted value', 'Should strip quotes')
}

function testExtractTokenSets() {
    const text = `[TOKEN] SET lens=creative

Creative work rarely dies loudly.`
    const { displayText, tokenSets } = extractTokenSets(text)
    assert(tokenSets.length === 1, 'Should extract one token')
    assert(tokenSets[0].key === 'lens' && tokenSets[0].value === 'creative', 'Token should be lens=creative')
    assert(!displayText.includes('[TOKEN]'), 'Display text should not contain token line')
    assert(displayText.includes('Creative work'), 'Display text should contain passage content')
}

function testFindInputSpecs() {
    const text = "{{INPUT:rawSignal|placeholder=Type what's actually here…}}"
    const specs = findInputSpecs(text)
    assert(specs.length === 1, 'Should find one input')
    assert(specs[0].key === 'rawSignal', 'Key should be rawSignal')
    assert(!!specs[0].placeholder?.includes("Type what's actually here"), 'Placeholder should be parsed')

    const text2 = '{{INPUT:refinedSignal|placeholder=Sharpen it to one sentence.}}'
    const specs2 = findInputSpecs(text2)
    assert(specs2[0].key === 'refinedSignal', 'Key should be refinedSignal')
}

function testInterpolate() {
    const state = { donationSource: 'EmotionalFuel', donationTier: 'spark', lens: 'creative', gm: 'shaman' }
    const text = '?source={{donationSource}}&tier={{donationTier}}&lens={{lens}}&gm={{gm}}'
    const result = interpolate(text, state, true)
    assert(result.includes('source=EmotionalFuel'), 'Should substitute donationSource')
    assert(result.includes('tier=spark'), 'Should substitute donationTier')
    assert(result.includes('lens=creative'), 'Should substitute lens')
    assert(result.includes('gm=shaman'), 'Should substitute gm')

    const missing = interpolate('hello {{missing}}', {}, false)
    assert(missing === 'hello ', 'Missing key should substitute empty string')
}

function main() {
    testParseTokenSet()
    testExtractTokenSets()
    testFindInputSpecs()
    testInterpolate()
    console.log('✅ All onboarding-token tests passed')
}

main()
