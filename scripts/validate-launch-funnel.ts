#!/usr/bin/env npx tsx
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { config } from 'dotenv'
import {
  MASTERING_ALLYSHIP_FUNNEL,
  type LaunchFunnelAsset,
} from '../src/lib/launch/funnel'

config({ path: '.env' })
config({ path: '.env.local', override: true })

const ROOT = process.cwd()
const yes = '✓'
const no = '✗'
const warn = '!'

function hashFile(relPath: string): string | null {
  const absPath = path.join(ROOT, relPath)
  if (!existsSync(absPath)) return null
  const content = readFileSync(absPath)
  return createHash('sha256').update(content).digest('hex')
}

function routeExists(href: string): boolean {
  if (/^https?:\/\//.test(href)) return true
  const clean = href.split(/[?#]/)[0]?.replace(/^\/+|\/+$/g, '') ?? ''
  const routePath = clean.length > 0 ? clean : ''
  const candidates = [
    path.join(ROOT, 'src', 'app', routePath, 'page.tsx'),
    path.join(ROOT, 'src', 'app', routePath, 'route.ts'),
  ]
  return candidates.some((candidate) => existsSync(candidate))
}

function checkAsset(asset: LaunchFunnelAsset, offerKeys: Set<string>) {
  if (asset.kind === 'manual') {
    return { ok: true, status: `${warn} manual`, detail: asset.label }
  }
  if (asset.kind === 'route') {
    const ok = Boolean(asset.href && routeExists(asset.href))
    return { ok, status: ok ? `${yes} route` : `${no} missing route`, detail: asset.href ?? asset.label }
  }
  if (asset.kind === 'offer') {
    const ok = Boolean(asset.offerKey && offerKeys.has(asset.offerKey))
    return {
      ok,
      status: ok ? `${yes} offer` : `${no} missing offer`,
      detail: asset.offerKey ?? asset.label,
    }
  }
  if (asset.kind === 'emailTemplate') {
    const ok = Boolean(asset.path && existsSync(path.join(ROOT, asset.path)))
    return {
      ok,
      status: ok ? `${yes} email` : `${no} missing email`,
      detail: asset.path ?? asset.label,
    }
  }
  return { ok: false, status: `${no} unknown`, detail: asset.label }
}

async function main() {
  const { LAUNCH_OFFERS } = await import('../src/lib/launch/offers')
  const offerKeys = new Set(LAUNCH_OFFERS.map((offer) => offer.key))
  const strict = process.argv.includes('--strict')
  let failures = 0

  console.log(`\n${MASTERING_ALLYSHIP_FUNNEL.title}`)
  console.log('Library source freshness\n')

  for (const source of MASTERING_ALLYSHIP_FUNNEL.sourceNotes) {
    const actual = hashFile(source.path)
    if (!actual) {
      failures++
      console.log(`  ${no} missing source  ${source.path}`)
      continue
    }
    if (actual !== source.hash) {
      failures++
      console.log(`  ${no} changed source  ${source.path}`)
      console.log(`      manifest: ${source.hash}`)
      console.log(`      current:  ${actual}`)
      continue
    }
    console.log(`  ${yes} fresh source   ${source.path}`)
  }

  console.log('\nStage readiness\n')
  for (const stage of MASTERING_ALLYSHIP_FUNNEL.stages) {
    console.log(`  ${stage.title}`)
    console.log(`    CTA: ${stage.primaryCta.label} -> ${stage.primaryCta.href}`)
    for (const asset of stage.requiredAssets) {
      const result = checkAsset(asset, offerKeys)
      if (!result.ok) failures++
      console.log(`    ${result.status.padEnd(18)} ${result.detail}`)
    }
  }

  const deckOffer = LAUNCH_OFFERS.find((offer) => offer.key === 'deck-digital')
  if (deckOffer && deckOffer.priceCents !== 2200) {
    failures++
    console.log(
      `\n  ${no} deck-digital price is ${deckOffer.priceCents} cents; funnel expects 2200 cents.`,
    )
  }

  console.log('')
  if (failures > 0) {
    console.log(`${no} Launch funnel readiness has ${failures} issue(s).`)
    process.exit(strict ? 1 : 0)
  }
  console.log(`${yes} Launch funnel readiness is coherent.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
