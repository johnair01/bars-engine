import assert from 'node:assert/strict'
import {
  cleanWorkshopKeptIndexes,
  cleanWorkshopOptions,
  normalizeLensWorkshopOptions,
  optionText,
} from '@/lib/lenses/workshop-options'

function testLegacyStringNormalization() {
  const options = normalizeLensWorkshopOptions([' Practice Qigong ', '', 'Sell 100 books'])

  assert.deepEqual(options, [{ text: 'Practice Qigong' }, { text: 'Sell 100 books' }])
}

function testKeyedOptionPreservation() {
  const options = normalizeLensWorkshopOptions([
    { stableKey: 'stable_1', tempKey: 'tmp_1', text: ' Living with Ari ' },
    { stableKey: '', text: '  ' },
  ])

  assert.deepEqual(options, [{ stableKey: 'stable_1', tempKey: 'tmp_1', text: 'Living with Ari' }])
}

function testSameTitleOptionsKeepSeparateIdentity() {
  const options = normalizeLensWorkshopOptions([
    { stableKey: 'stable_1', text: 'Sell 100 books' },
    { stableKey: 'stable_2', text: 'Sell 100 books' },
  ])

  assert.equal(options.length, 2)
  assert.notEqual(options[0].stableKey, options[1].stableKey)
  assert.equal(options[0].text, options[1].text)
}

function testCapsAndKeptIndexes() {
  const options = cleanWorkshopOptions([
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
  ])
  const kept = cleanWorkshopKeptIndexes([0, 0, 9, 10, 4, 3, 2], options)

  assert.equal(options.length, 10)
  assert.deepEqual(kept, [0, 9, 4, 3, 2])
}

function testOptionText() {
  assert.equal(optionText('raw'), 'raw')
  assert.equal(optionText({ stableKey: 'stable_1', text: 'keyed' }), 'keyed')
}

testLegacyStringNormalization()
testKeyedOptionPreservation()
testSameTitleOptionsKeepSeparateIdentity()
testCapsAndKeptIndexes()
testOptionText()

console.log('lenses workshop options: legacy strings and stable option identity OK')
