/**
 * Run: npx tsx src/lib/cyoa/__tests__/sanitize-passage-text.test.ts
 *
 * The corpus this guards: 10 of 686 live passages carry `[[…]]` duplicated from
 * their `choices` column, 3 carry `<<set …>>`, and several carry `{{…}}`
 * templates that MUST survive. Over-stripping breaks features; under-stripping
 * is the reported bug.
 */

import assert from 'node:assert/strict'
import {
  extractLinkTargets,
  hasAuthoringArtifacts,
  linksAreCoveredByChoices,
  sanitizePassageText,
} from '@/lib/cyoa/sanitize-passage-text'

// Verbatim shape of a live passage (node_1).
const NODE_1 =
  'The shadow tempts you to abandon the task. What will you do?\n\n' +
  '[[Implement the fix immediately.|node_4]]\n' +
  '[[Get a second opinion from a peer.|node_2]]'

function testStripsWikiLinks() {
  const out = sanitizePassageText(NODE_1)
  assert.ok(!out.includes('[['), 'no double brackets remain')
  assert.ok(!out.includes(']]'), 'no closing brackets remain')
  // The prose survives intact.
  assert.ok(out.includes('The shadow tempts you to abandon the task.'))
  // The choice labels must NOT survive in the body — they are buttons.
  assert.ok(!out.includes('Implement the fix immediately'), 'choice label gone from body')
  assert.ok(!out.includes('Get a second opinion'), 'second choice label gone from body')
  // No ragged trailing whitespace left where links were.
  assert.equal(out, out.trim())
  assert.ok(!/\n{3,}/.test(out), 'no triple newlines')
}

function testLinkForms() {
  assert.equal(sanitizePassageText('a [[Label->target]] b'), 'a  b'.trim())
  assert.equal(sanitizePassageText('a [[target]] b'), 'a  b'.trim())
  assert.equal(sanitizePassageText('a [[Label|target]] b'), 'a  b'.trim())
  // Triple-bracket scoped labels the parser also supports.
  assert.ok(!sanitizePassageText('x [[[Label] Target]] y').includes('['))
}

function testStripsSugarCubeMacros() {
  const raw = '(Entering Shaman Path)\n<<set $active_face = "shaman">>\n<<set $step1_done = false>>'
  const out = sanitizePassageText(raw)
  assert.equal(out, '(Entering Shaman Path)')
  assert.ok(!out.includes('<<'), 'macro removed')
  assert.ok(!out.includes('$active_face'), 'variable name never shown to a player')
}

function testKeepsTemplatesAndTokens() {
  // {{…}} is resolved by resolveTemplates() BEFORE display — stripping it would
  // blank the Bruised Banana intro entirely.
  assert.equal(sanitizePassageText('{{instance.introText}}'), '{{instance.introText}}')
  assert.equal(
    sanitizePassageText('{{instance.showUpContent}}{{instance.donateLink}}'),
    '{{instance.showUpContent}}{{instance.donateLink}}'
  )
  // {{INPUT:barContent}} drives BAR capture.
  assert.ok(sanitizePassageText('Write it: {{INPUT:barContent|placeholder}}').includes('{{INPUT:barContent'))
  // [TOKEN] SET is single-bracket and must survive.
  assert.ok(sanitizePassageText('[TOKEN] SET emotional_alchemy=aligned').includes('[TOKEN] SET'))
  // A lone single-bracket aside is prose, not markup.
  assert.equal(sanitizePassageText('a [note] b'), 'a [note] b')
}

function testMarkdownLinksSurvive() {
  // The Learn More passage is markdown, not Twee — its links must not be eaten.
  const md = 'Explore:\n\n- [The 4 moves](/wiki/moves)\n- [Glossary](/wiki/glossary)'
  assert.equal(sanitizePassageText(md), md)
}

function testEmptyAndNull() {
  assert.equal(sanitizePassageText(null), '')
  assert.equal(sanitizePassageText(undefined), '')
  assert.equal(sanitizePassageText(''), '')
  // A passage that is nothing but macros collapses to empty, not to whitespace.
  assert.equal(sanitizePassageText('<<set $a = 1>>\n<<set $b = 2>>'), '')
}

function testHasAuthoringArtifacts() {
  assert.equal(hasAuthoringArtifacts(NODE_1), true)
  assert.equal(hasAuthoringArtifacts('<<set $x = 1>>'), true)
  assert.equal(hasAuthoringArtifacts('{{instance.introText}}'), false)
  assert.equal(hasAuthoringArtifacts('clean prose'), false)
  assert.equal(hasAuthoringArtifacts(null), false)
  // Regression: /g + .test() is stateful. Same input must give the same answer.
  assert.equal(hasAuthoringArtifacts(NODE_1), true)
  assert.equal(hasAuthoringArtifacts(NODE_1), true)
  assert.equal(hasAuthoringArtifacts('clean prose'), false)
  assert.equal(hasAuthoringArtifacts('clean prose'), false)
}

function testExtractLinkTargets() {
  assert.deepEqual(extractLinkTargets(NODE_1), ['node_4', 'node_2'])
  assert.deepEqual(extractLinkTargets('[[Label->a]] [[b]]'), ['a', 'b'])
  assert.deepEqual(extractLinkTargets('no links'), [])
}

function testCoverageGuard() {
  const choices = [{ targetId: 'node_4' }, { targetId: 'node_2' }]
  assert.equal(linksAreCoveredByChoices(NODE_1, choices), true)
  // A link with no matching choice must NOT be considered safe to strip —
  // that would strand the player with no way forward.
  assert.equal(linksAreCoveredByChoices(NODE_1, [{ targetId: 'node_4' }]), false)
  assert.equal(linksAreCoveredByChoices(NODE_1, []), false)
  assert.equal(linksAreCoveredByChoices(NODE_1, null), false)
  // No links at all is trivially covered.
  assert.equal(linksAreCoveredByChoices('plain prose', []), true)
  assert.equal(linksAreCoveredByChoices(null, []), true)
}

function testKeepLinksEscapeHatch() {
  const out = sanitizePassageText(NODE_1, { keepLinks: true })
  assert.ok(out.includes('[[Implement the fix immediately.|node_4]]'), 'links preserved')
  // Macros are still stripped even when links are kept.
  assert.ok(!sanitizePassageText('<<set $a=1>> [[x]]', { keepLinks: true }).includes('<<'))
}

testStripsWikiLinks()
testLinkForms()
testStripsSugarCubeMacros()
testKeepsTemplatesAndTokens()
testMarkdownLinksSurvive()
testEmptyAndNull()
testHasAuthoringArtifacts()
testExtractLinkTargets()
testCoverageGuard()
testKeepLinksEscapeHatch()
console.log('cyoa sanitize-passage-text tests passed')
