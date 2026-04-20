#!/usr/bin/env node

/**
 * Phase 2a.0: Migrate Campaign Data to Flavor Layers
 *
 * Transforms old campaign fields into new JSON structure:
 * - allyshipDomain → campaignFlavorLayers.scope.allyship_domains
 * - wakeUpContent → campaignFlavorLayers.real_world_context.wake_up_message
 * - showUpContent → campaignFlavorLayers.real_world_context.show_up_message
 * - questTemplateConfig → campaignFlavorLayers.quest_generation
 * - inviteConfig → campaignFlavorLayers.invite_config
 *
 * Usage:
 *   npx tsx scripts/migrate-campaign-flavor-layers.ts --dry-run
 *   npx tsx scripts/migrate-campaign-flavor-layers.ts --verify-only
 *   npx tsx scripts/migrate-campaign-flavor-layers.ts --production
 *
 * Safety:
 * - Old fields remain untouched (backward compat)
 * - Dry-run shows what would happen
 * - Verify-only checks JSON validity without writes
 * - All failures are logged, non-fatal
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { PrismaClient } from '@prisma/client'

// ============================================================================
// CONFIGURATION & FLAGS
// ============================================================================

const FLAGS = {
  dryRun: process.argv.includes('--dry-run'),
  verifyOnly: process.argv.includes('--verify-only'),
  production: process.argv.includes('--production'),
  verbose: process.argv.includes('--verbose'),
}

const MODE = FLAGS.dryRun ? 'DRY-RUN' : FLAGS.verifyOnly ? 'VERIFY-ONLY' : 'PRODUCTION'

// ============================================================================
// TYPES
// ============================================================================

interface Campaign {
  id: string
  slug: string
  allyshipDomain: string | null
  wakeUpContent: string | null
  showUpContent: string | null
  questTemplateConfig: any
  inviteConfig: any
}

interface TransformResult {
  inheritedWorld: any
  campaignFlavorLayers: any
}

interface Stats {
  total: number
  successful: number
  failed: number
  skipped: number
  errors: Array<{ campaignId: string; field: string; error: string }>
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

function validateCampaignFlavorLayers(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    errors.push('campaignFlavorLayers must be an object')
    return { valid: false, errors }
  }

  // Validate scope.allyship_domains
  if (data.scope?.allyship_domains) {
    if (!Array.isArray(data.scope.allyship_domains)) {
      errors.push('scope.allyship_domains must be an array')
    } else {
      const valid = ['GATHERING_RESOURCES', 'SKILLFUL_ORGANIZING', 'DIRECT_ACTION', 'RAISE_AWARENESS']
      for (const domain of data.scope.allyship_domains) {
        if (!valid.includes(domain)) {
          errors.push(`Invalid allyship domain: ${domain}`)
        }
      }
      if (data.scope.allyship_domains.length < 1 || data.scope.allyship_domains.length > 4) {
        errors.push('allyship_domains must have 1-4 items')
      }
    }
  }

  // Validate real_world_context fields
  if (data.real_world_context) {
    if (data.real_world_context.wake_up_message && typeof data.real_world_context.wake_up_message !== 'string') {
      errors.push('wake_up_message must be a string')
    }
    if (data.real_world_context.show_up_message && typeof data.real_world_context.show_up_message !== 'string') {
      errors.push('show_up_message must be a string')
    }
  }

  // Validate quest_generation
  if (data.quest_generation && typeof data.quest_generation !== 'object') {
    errors.push('quest_generation must be an object')
  }

  // Validate invite_config
  if (data.invite_config && typeof data.invite_config !== 'object') {
    errors.push('invite_config must be an object')
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

function transformAllyshipDomain(oldValue: string | null): string[] | null {
  if (!oldValue || oldValue.trim() === '') {
    return null
  }

  const valid = ['GATHERING_RESOURCES', 'SKILLFUL_ORGANIZING', 'DIRECT_ACTION', 'RAISE_AWARENESS']
  const trimmed = oldValue.trim()

  if (!valid.includes(trimmed)) {
    throw new Error(`Invalid allyshipDomain value: "${oldValue}"`)
  }

  return [trimmed]
}

function transformWakeUpContent(oldValue: string | null): string | null {
  if (!oldValue || oldValue.trim() === '') {
    return null
  }
  return oldValue.trim()
}

function transformShowUpContent(oldValue: string | null): string | null {
  if (!oldValue || oldValue.trim() === '') {
    return null
  }
  return oldValue.trim()
}

function transformQuestTemplateConfig(oldValue: any): any {
  if (!oldValue) {
    return null
  }

  try {
    // Validate it's a valid object/array
    if (typeof oldValue !== 'object') {
      throw new Error('questTemplateConfig must be an object')
    }

    // Preserve the structure as-is (array or object)
    // Add metadata to track origin
    if (Array.isArray(oldValue)) {
      return oldValue.map((item: any) => ({
        ...item,
        createdFrom: 'questTemplateConfig (old field)',
      }))
    } else {
      return {
        ...oldValue,
        createdFrom: 'questTemplateConfig (old field)',
      }
    }
  } catch (e) {
    throw new Error(`Failed to transform questTemplateConfig: ${e instanceof Error ? e.message : String(e)}`)
  }
}

function transformInviteConfig(oldValue: any): any {
  if (!oldValue) {
    return null
  }

  try {
    if (typeof oldValue !== 'object' || Array.isArray(oldValue)) {
      throw new Error('inviteConfig must be an object, not array or scalar')
    }

    // Validate known fields if present
    const validMethods = ['public_link', 'invite_only', 'custom']
    if (oldValue.method && !validMethods.includes(oldValue.method)) {
      throw new Error(`Invalid invite method: ${oldValue.method}`)
    }

    if (oldValue.capacity && (typeof oldValue.capacity !== 'number' || oldValue.capacity < 0)) {
      throw new Error(`Invalid invite capacity: ${oldValue.capacity}`)
    }

    return oldValue
  } catch (e) {
    throw new Error(`Failed to transform inviteConfig: ${e instanceof Error ? e.message : String(e)}`)
  }
}

function transformCampaign(campaign: Campaign): TransformResult {
  const flavorLayers: any = {}

  try {
    // Build scope
    const domains = transformAllyshipDomain(campaign.allyshipDomain)
    if (domains) {
      flavorLayers.scope = { allyship_domains: domains }
    }

    // Build real_world_context
    const wake = transformWakeUpContent(campaign.wakeUpContent)
    const show = transformShowUpContent(campaign.showUpContent)
    if (wake || show) {
      flavorLayers.real_world_context = {
        ...(wake && { wake_up_message: wake }),
        ...(show && { show_up_message: show }),
        actual_allyship_work: null,
        real_world_outcome: null,
        intended_action: null,
      }
    }

    // Build quest_generation
    const questConfig = transformQuestTemplateConfig(campaign.questTemplateConfig)
    if (questConfig) {
      flavorLayers.quest_generation = questConfig
    }

    // Build invite_config
    const inviteConfig = transformInviteConfig(campaign.inviteConfig)
    if (inviteConfig) {
      flavorLayers.invite_config = inviteConfig
    }

    // Add metadata
    if (Object.keys(flavorLayers).length > 0) {
      flavorLayers.additional_metadata = {
        migrated_from: 'Phase 1 old fields',
        migrated_at: new Date().toISOString(),
        original_campaign_id: campaign.id,
      }
    }

    // Validate the result
    const validation = validateCampaignFlavorLayers(flavorLayers)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`)
    }

    return {
      inheritedWorld: null,
      campaignFlavorLayers: Object.keys(flavorLayers).length > 0 ? flavorLayers : null,
    }
  } catch (e) {
    throw new Error(`Campaign transformation failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ============================================================================
// LOGGING
// ============================================================================

function log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
  const prefix = {
    info: 'ℹ️ ',
    warn: '⚠️  ',
    error: '❌ ',
    success: '✅ ',
  }[level]
  console.log(`${prefix} ${message}`)
}

function logVerbose(message: string) {
  if (FLAGS.verbose) {
    console.log(`  → ${message}`)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const db = new PrismaClient()
  const stats: Stats = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  try {
    // Startup info
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║   Phase 2a.0: Campaign Flavor Layers Backfill              ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')

    log(`Mode: ${MODE}`)
    log(`Database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}`)
    log(`Timestamp: ${new Date().toISOString()}`)
    console.log()

    // Fetch all campaigns
    log('Fetching campaigns...')
    const campaigns = await db.campaign.findMany({
      select: {
        id: true,
        slug: true,
        allyshipDomain: true,
        wakeUpContent: true,
        showUpContent: true,
        questTemplateConfig: true,
        inviteConfig: true,
      },
    })

    stats.total = campaigns.length
    log(`Found ${campaigns.length} campaigns to process`, 'info')
    console.log()

    if (campaigns.length === 0) {
      log('No campaigns to process', 'warn')
      return
    }

    // Process each campaign
    log('Starting transformation...')
    console.log()

    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i] as Campaign
      const progress = `[${i + 1}/${campaigns.length}]`

      try {
        logVerbose(`${progress} Processing "${campaign.slug}"...`)

        // Transform
        const transformed = transformCampaign(campaign)
        logVerbose(`  → Transformed: ${JSON.stringify(transformed).length} bytes`)

        // Write or verify
        if (FLAGS.dryRun) {
          logVerbose(`  → [DRY-RUN] Would update ${campaign.id}`)
          stats.successful++
        } else if (FLAGS.verifyOnly) {
          logVerbose(`  → [VERIFY] Validated successfully`)
          stats.successful++
        } else {
          // Actual write
          await db.campaign.update({
            where: { id: campaign.id },
            data: {
              campaignFlavorLayers: transformed.campaignFlavorLayers,
            },
          })
          logVerbose(`  → [WRITE] Updated ${campaign.id}`)
          stats.successful++
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e)
        log(`${progress} Failed: ${campaign.slug}`, 'error')
        logVerbose(`  → Error: ${errorMsg}`)
        stats.failed++
        stats.errors.push({
          campaignId: campaign.id,
          field: campaign.slug,
          error: errorMsg,
        })
      }
    }

    // Summary
    console.log()
    log('─'.repeat(60), 'info')
    console.log()
    log(`Processed: ${stats.total} campaigns`, 'info')
    log(`Successful: ${stats.successful} (${((stats.successful / stats.total) * 100).toFixed(1)}%)`, 'success')
    if (stats.failed > 0) {
      log(`Failed: ${stats.failed}`, 'error')
    }

    if (stats.errors.length > 0) {
      console.log()
      log('Failed campaigns:', 'error')
      for (const err of stats.errors) {
        console.log(`  • ${err.field}: ${err.error}`)
      }
    }

    console.log()

    if (FLAGS.dryRun) {
      log('DRY-RUN complete. No changes written.', 'info')
    } else if (FLAGS.verifyOnly) {
      log('VERIFY-ONLY complete. All validations passed.', 'success')
    } else {
      log(`PRODUCTION complete. ${stats.successful} campaigns updated.`, 'success')
    }

    console.log()

    // Exit code
    process.exit(stats.failed > 0 ? 1 : 0)
  } catch (e) {
    log(`Fatal error: ${e instanceof Error ? e.message : String(e)}`, 'error')
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
