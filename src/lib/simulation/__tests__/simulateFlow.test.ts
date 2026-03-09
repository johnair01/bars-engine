/**
 * Flow Simulator — Tests
 *
 * Run with: npm run test:simulation
 */

import * as fs from 'fs'
import * as path from 'path'
import { simulateFlow } from '../simulateFlow'
import { getSimulatedActorRole } from '../actors'
import { simulateFlowWithActors } from '../simulateFlowWithActors'
import { proposeActorAction } from '../proposeActorAction'
import { getActorGuidance } from '../guidance'
import { loadFlowBySlug } from '../flowLoader'
import type { FlowJSON } from '../types'

const FIXTURES = path.join(process.cwd(), 'fixtures')
const FLOWS = path.join(FIXTURES, 'flows')
const BB = path.join(FIXTURES, 'onboarding', 'bruised-banana')

function loadFlow(p: string): FlowJSON {
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as FlowJSON
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testLinearMinimalPasses() {
  const flow = loadFlow(path.join(FLOWS, 'orientation_linear_minimal.json'))
  const r = simulateFlow({ flow })
  assert(r.status === 'pass', `Expected pass, got ${r.status}`)
  assert(r.completion_reached, 'Expected completion_reached')
  assert(r.visited_nodes.includes('completion_1'), 'Should visit completion_1')
  assert(r.events_emitted.includes('quest_completed'), 'Should emit quest_completed')
  console.log('✓ testLinearMinimalPasses')
}

function testBarCreatePasses() {
  const flow = loadFlow(path.join(FLOWS, 'orientation_bar_create.json'))
  const r = simulateFlow({ flow })
  assert(r.status === 'pass', `Expected pass, got ${r.status}`)
  assert(r.events_emitted.includes('bar_created'), 'Should emit bar_created')
  assert(r.events_emitted.includes('bar_validated'), 'Should emit bar_validated')
  console.log('✓ testBarCreatePasses')
}

function testMissingStartNode() {
  const flow = loadFlow(path.join(FLOWS, 'orientation_linear_minimal.json'))
  const broken = { ...flow, start_node_id: 'nonexistent_node' }
  const r = simulateFlow({ flow: broken })
  assert(r.status === 'fail', `Expected fail, got ${r.status}`)
  assert(r.errors.some((e) => e.includes('missing_start_node')), 'Should report missing_start_node')
  console.log('✓ testMissingStartNode')
}

function testBruisedBananaFixturesPass() {
  for (const name of ['campaign_intro.json', 'identity_selection.json', 'intended_impact_bar.json']) {
    const flow = loadFlow(path.join(BB, name))
    const r = simulateFlow({ flow })
    assert(r.status === 'pass', `${name}: Expected pass, got ${r.status}`)
  }
  console.log('✓ testBruisedBananaFixturesPass')
}

function testGetSimulatedActorRole() {
  const librarian = getSimulatedActorRole('librarian')
  assert(librarian !== undefined, 'Librarian role should exist')
  assert(librarian!.role_id === 'librarian', 'Librarian role_id')
  assert(librarian!.flow_capabilities.includes('observe'), 'Librarian has observe')

  const witness = getSimulatedActorRole('witness')
  assert(witness !== undefined, 'Witness role should exist')
  assert(!witness!.flow_capabilities.includes('create'), 'Witness must not have create')

  const unknown = getSimulatedActorRole('unknown')
  assert(unknown === undefined, 'Unknown role should return undefined')
  console.log('✓ testGetSimulatedActorRole')
}

function testSimulateFlowWithActors() {
  const flow = loadFlow(path.join(FLOWS, 'orientation_linear_minimal.json'))
  const r = simulateFlowWithActors({
    flow,
    actor_roster: [{ role_id: 'librarian' }],
  })
  assert(r.status === 'pass', `Librarian actor: Expected pass, got ${r.status}`)
  console.log('✓ testSimulateFlowWithActors')
}

function testProposeActorAction() {
  const flow = loadFlow(path.join(FLOWS, 'orientation_linear_minimal.json'))

  const librarian = proposeActorAction({
    actor_role_id: 'librarian',
    flow,
    quest_state: { current_node_id: 'intro_1' },
  })
  assert(librarian.allowed, 'Librarian proposal should be allowed')
  assert(librarian.action_type === 'propose', 'Librarian proposes')
  assert(Boolean(librarian.suggested_actions && librarian.suggested_actions.length >= 1), 'Librarian suggests next action')
  assert(librarian.message.includes('Continue') || librarian.message.includes('prompt_1'), 'Message references next step')

  const unknown = proposeActorAction({
    actor_role_id: 'unknown',
    flow,
    quest_state: { current_node_id: 'intro_1' },
  })
  assert(!unknown.allowed, 'Unknown role should not be allowed')

  const witnessAtCompletion = proposeActorAction({
    actor_role_id: 'witness',
    flow,
    quest_state: {
      current_node_id: 'completion_1',
      visited_nodes: ['intro_1', 'prompt_1', 'action_1', 'completion_1'],
      events_emitted: ['orientation_viewed', 'prompt_viewed', 'choice_selected', 'quest_completed'],
    },
  })
  assert(witnessAtCompletion.allowed, 'Witness at completion allowed')
  assert(witnessAtCompletion.action_type === 'acknowledge', 'Witness acknowledges')
  assert(witnessAtCompletion.message.includes('end') || witnessAtCompletion.message.includes('step'), 'Witness reflects progress')

  const collaboratorAtBarCapture = proposeActorAction({
    actor_role_id: 'collaborator',
    flow: loadFlow(path.join(FLOWS, 'orientation_bar_create.json')),
    quest_state: { current_node_id: 'bar_capture_1', events_emitted: [] },
  })
  assert(collaboratorAtBarCapture.allowed, 'Collaborator at BAR capture allowed')
  assert(collaboratorAtBarCapture.action_type === 'suggest', 'Collaborator suggests')
  assert(collaboratorAtBarCapture.message.toLowerCase().includes('bar'), 'Collaborator mentions BAR')

  console.log('✓ testProposeActorAction')
}

function testGetActorGuidance() {
  const flow = loadFlow(path.join(FLOWS, 'orientation_linear_minimal.json'))
  const r = getActorGuidance({
    flow,
    current_node_id: 'intro_1',
    role_id: 'librarian',
  })
  assert(r.role_id === 'librarian', 'Returns librarian role')
  assert(r.role_name === 'Librarian', 'Returns role name')
  assert(r.allowed, 'Guidance allowed')
  assert(r.message.length > 0, 'Has message')
  assert(Boolean(r.suggested_actions && r.suggested_actions.length >= 1), 'Has suggested_actions with target_id')
  assert(r.suggested_actions != null && r.suggested_actions[0]?.target_id === 'prompt_1', 'First suggestion points to prompt_1')
  console.log('✓ testGetActorGuidance')
}

function testLoadFlowBySlug() {
  const flow = loadFlowBySlug('campaign-intro')
  assert(flow !== null, 'campaign-intro loads')
  assert(flow!.flow_id === 'bb_campaign_intro_v1', 'Correct flow_id')
  assert(flow!.start_node_id === 'Arrival', 'Correct start')

  const unknown = loadFlowBySlug('nonexistent')
  assert(unknown === null, 'Unknown slug returns null')
  console.log('✓ testLoadFlowBySlug')
}

function testWitnessCannotCreateBar() {
  const flow = loadFlow(path.join(BB, 'intended_impact_bar.json'))
  const witness = getSimulatedActorRole('witness')
  const r = simulateFlow({
    flow,
    actor_capabilities: witness!.flow_capabilities,
  })
  assert(r.status === 'fail', 'Witness without create should fail on BAR flow')
  assert(
    r.errors.some((e) => e.includes('required_capability_missing') || e.includes('permission_mismatch')),
    'Should report capability/permission issue'
  )
  console.log('✓ testWitnessCannotCreateBar')
}

function main() {
  testLinearMinimalPasses()
  testBarCreatePasses()
  testMissingStartNode()
  testBruisedBananaFixturesPass()
  testGetSimulatedActorRole()
  testSimulateFlowWithActors()
  testProposeActorAction()
  testGetActorGuidance()
  testLoadFlowBySlug()
  testWitnessCannotCreateBar()
  console.log('\nAll simulation tests passed.')
}

main()
