/**
 * Loads FlowJSON by slug from known fixture/corpus paths.
 * Used by guidance API to resolve flowId without requiring full paths.
 */

import * as fs from 'fs'
import * as path from 'path'
import type { FlowJSON } from './types'

const FLOW_REGISTRY: Record<string, string> = {
  'bruised-banana': 'reports/quest-corpus/bruised-banana-onboarding-flow.json',
  'campaign-intro': 'fixtures/onboarding/bruised-banana/campaign_intro.json',
  'identity-selection': 'fixtures/onboarding/bruised-banana/identity_selection.json',
  'intended-impact-bar': 'fixtures/onboarding/bruised-banana/intended_impact_bar.json',
  'orientation-linear': 'fixtures/flows/orientation_linear_minimal.json',
  'orientation-bar': 'fixtures/flows/orientation_bar_create.json',
}

/**
 * Loads a flow by slug. Returns null if slug unknown or file not found.
 */
export function loadFlowBySlug(slug: string): FlowJSON | null {
  const relPath = FLOW_REGISTRY[slug]
  if (!relPath) return null

  const absPath = path.join(process.cwd(), relPath)
  if (!fs.existsSync(absPath)) return null

  try {
    const raw = fs.readFileSync(absPath, 'utf-8')
    return JSON.parse(raw) as FlowJSON
  } catch {
    return null
  }
}

/**
 * Returns list of known flow slugs.
 */
export function getAvailableFlowSlugs(): string[] {
  return Object.keys(FLOW_REGISTRY)
}
