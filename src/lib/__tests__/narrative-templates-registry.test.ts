import assert from 'node:assert'
import {
  resolveNarrativeTemplate,
  DEFAULT_MODULAR_COASTER_TEMPLATE_ID,
} from '@/lib/narrative-templates/registry'

const e = resolveNarrativeTemplate('epiphany_bridge')
assert.strictEqual(e.kind, 'quest_grammar')
if (e.kind === 'quest_grammar') assert.strictEqual(e.questGrammar, 'epiphany_bridge')

const k = resolveNarrativeTemplate('kotter')
assert.strictEqual(k.kind, 'quest_grammar')
if (k.kind === 'quest_grammar') assert.strictEqual(k.questGrammar, 'kotter')

const c = resolveNarrativeTemplate('modular_coaster')
assert.strictEqual(c.kind, 'modular_cyoa')
if (c.kind === 'modular_cyoa') assert.strictEqual(c.modularTemplateId, DEFAULT_MODULAR_COASTER_TEMPLATE_ID)

console.log('narrative-templates registry tests passed')
