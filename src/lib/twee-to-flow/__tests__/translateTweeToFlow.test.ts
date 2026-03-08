/**
 * Twee → Flow translation — Tests
 *
 * Run with: npx tsx src/lib/twee-to-flow/__tests__/translateTweeToFlow.test.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { translateTweeToFlow } from '../translateTweeToFlow'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

function testTranslateBruisedBanana() {
  const tweePath = path.join(
    process.cwd(),
    'content/twine/onboarding/bruised-banana-onboarding-draft.twee'
  )
  const tweeSource = fs.readFileSync(tweePath, 'utf-8')
  const flow = translateTweeToFlow(tweeSource)

  assert(flow.start_node_id === 'Arrival', 'start_node_id should be Arrival')
  assert(flow.nodes.length > 0, 'Should have nodes')
  assert(flow.completion_conditions.length > 0, 'Should have completion conditions')
  assert(flow.expected_events.length > 0, 'Should have expected_events')

  const nodeIds = new Set(flow.nodes.map((n) => n.id))
  assert(nodeIds.has('Arrival'), 'Should have Arrival node')
  assert(nodeIds.has('Create a BAR'), 'Should have Create a BAR node')
  assert(nodeIds.has('Onboarding Complete'), 'Should have Onboarding Complete node')
  assert(nodeIds.has('BeginPlay'), 'Should have BeginPlay node')

  const introNode = flow.nodes.find((n) => n.id === 'Arrival')
  assert(introNode?.type === 'introduction', 'Arrival should be introduction')
  assert(
    !!introNode?.actions.some((a) => a.emits?.includes('orientation_viewed')),
    'Introduction should emit orientation_viewed'
  )

  const barNode = flow.nodes.find((n) => n.id === 'Create a BAR')
  assert(barNode?.type === 'BAR_capture', 'Create a BAR should be BAR_capture')
  assert(
    !!barNode?.actions.some((a) => a.type === 'create_BAR' && a.emits?.includes('bar_created')),
    'BAR_capture should have create_BAR action emitting bar_created'
  )

  const completionNode = flow.nodes.find((n) => n.id === 'Onboarding Complete')
  assert(completionNode?.type === 'completion', 'Onboarding Complete should be completion')

  const handoffNode = flow.nodes.find((n) => n.id === 'BeginPlay')
  assert(handoffNode?.type === 'handoff', 'BeginPlay should be handoff')
  assert(handoffNode?.target_ref === 'dashboard', 'Handoff should have target_ref dashboard')

  assert(
    flow.expected_events.includes('orientation_viewed'),
    'expected_events should include orientation_viewed'
  )
  assert(
    flow.expected_events.includes('choice_selected'),
    'expected_events should include choice_selected'
  )
  assert(
    flow.expected_events.includes('bar_created'),
    'expected_events should include bar_created'
  )
  assert(
    flow.expected_events.some(
      (e) =>
        e.includes('onboarding') ||
        e === 'quest_completed' ||
        e === 'bar_created' ||
        e === 'intended_impact_bar_attached'
    ),
    'expected_events should include bar/onboarding/completion events'
  )

  for (const node of flow.nodes) {
    for (const action of node.actions) {
      if (action.next_node_id !== null) {
        assert(
          nodeIds.has(action.next_node_id),
          `next_node_id ${action.next_node_id} should reference existing node`
        )
      }
    }
  }

  console.log('✅ translate bruised-banana draft')
}

function testTranslateMinimalTwee() {
  const minimal = `:: StoryTitle
Minimal

:: StoryData
{ "start": "Start" }

:: Start [passage]
Hello.
[[Next|End]]

:: End [result emits:done]
Done.`
  const flow = translateTweeToFlow(minimal)

  assert(flow.start_node_id === 'Start', 'start should be Start')
  assert(flow.nodes.length === 2, 'Should have 2 nodes')
  const startNode = flow.nodes.find((n) => n.id === 'Start')
  assert(startNode?.type === 'introduction' || startNode?.type === 'prompt', 'Start should be intro or prompt')
  const endNode = flow.nodes.find((n) => n.id === 'End')
  assert(endNode !== undefined, 'Should have End node')

  console.log('✅ translate minimal twee')
}

function run() {
  testTranslateBruisedBanana()
  testTranslateMinimalTwee()
  console.log('\n✅ All translateTweeToFlow tests passed')
}

run()
