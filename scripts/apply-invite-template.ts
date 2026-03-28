/**
 * Apply bundled event_invite story templates to CustomBar.storyContent.
 *
 *   npx tsx scripts/apply-invite-template.ts --bar-id=<cuid> [--template=guest-journey|allyship-thunder] [--dry-run]
 */
import './require-db-env'
import { db } from '../src/lib/db'
import { EVENT_INVITE_BAR_TYPE } from '../src/lib/event-invite-story/schema'
import { ALLYSHIP_INTAKE_THUNDER_TEMPLATE_JSON } from '../src/lib/event-invite-story/templates/allyship-intake-thunder'
import { EVENT_INVITE_GUEST_JOURNEY_TEMPLATE_JSON } from '../src/lib/event-invite-story/templates/guest-journey'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  if (i === -1) return undefined
  return process.argv[i + 1]
}

const TEMPLATES: Record<string, string> = {
  'guest-journey': EVENT_INVITE_GUEST_JOURNEY_TEMPLATE_JSON,
  'allyship-thunder': ALLYSHIP_INTAKE_THUNDER_TEMPLATE_JSON,
}

function resolveTemplateKey(raw: string | undefined): keyof typeof TEMPLATES {
  const k = (raw ?? 'guest-journey').trim().toLowerCase()
  if (k in TEMPLATES) return k as keyof typeof TEMPLATES
  console.error(`Unknown --template=${raw}. Use: ${Object.keys(TEMPLATES).join(', ')}`)
  process.exit(1)
}

async function main() {
  const barId = arg('--bar-id') ?? process.env.BAR_ID
  const templateKey = resolveTemplateKey(arg('--template'))
  const json = TEMPLATES[templateKey]
  const dryRun = process.argv.includes('--dry-run')

  if (!barId?.trim()) {
    console.error(
      'Usage: npx tsx scripts/apply-invite-template.ts --bar-id=<CustomBar.id> [--template=guest-journey|allyship-thunder] [--dry-run]'
    )
    process.exit(1)
  }

  const bar = await db.customBar.findUnique({
    where: { id: barId.trim() },
    select: { id: true, title: true, type: true },
  })

  if (!bar) {
    console.error(`No CustomBar with id=${barId}`)
    process.exit(1)
  }

  if (bar.type !== EVENT_INVITE_BAR_TYPE) {
    console.warn(`Warning: BAR type is "${bar.type}", expected "${EVENT_INVITE_BAR_TYPE}". Continuing.`)
  }

  if (dryRun) {
    console.log(
      `[dry-run] Would set storyContent template=${templateKey} (${json.length} chars) on "${bar.title}" (${bar.id})`
    )
    return
  }

  await db.customBar.update({
    where: { id: bar.id },
    data: { storyContent: json },
  })

  console.log(`Updated storyContent (${templateKey}) on "${bar.title}" (${bar.id})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
