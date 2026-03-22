/**
 * Tag the three praxis pillar books in the DB.
 * Run: npx tsx scripts/tag-praxis-books.ts
 *
 * Reads each book's existing metadataJson and merges in the pillar fields
 * without touching any other keys (extracted text stats, analysis, TOC, etc.).
 */
import { PrismaClient } from '@prisma/client'
import type { BookPraxisMetadata } from '../src/lib/books/praxisMetadata'
import { mergePraxisMetadata } from '../src/lib/books/praxisMetadata'

const db = new PrismaClient()

const PILLAR_TAGS: Array<{
  /** Case-insensitive substring match against book title */
  titleMatch: string
  pillar: BookPraxisMetadata
}> = [
  {
    titleMatch: "antifragile",
    pillar: {
      praxisPillar: "antifragile",
      designIntentSummary:
        "Taleb's core thesis: systems that gain from disorder, volatility, and failure are antifragile — not merely resilient. " +
        "In BARS development this means the fail-fix workflow, roadblock quests as metabolized fuel, " +
        "and the cert-feedback loop. In gameplay it means player setbacks are design affordances, not bugs. " +
        "Key passages in the DB cover via negativa (removing harm), optionality (open positions), " +
        "and the barbell strategy (safe base + high-upside experiments).",
      relatedWikiSlugs: ["antifragile-dev-praxis", "roadblock-metabolism"],
    },
  },
  {
    titleMatch: "wealth of networks",
    pillar: {
      praxisPillar: "commons_networks",
      designIntentSummary:
        "Benkler's analysis of commons-based peer production: large-scale collaboration without markets or hierarchy, " +
        'where intrinsic motivation and permissive infrastructure unlock creative surplus. ' +
        'Brought in via Diplomat strand consult as a replacement for "Wikipedia the Missing Manual." ' +
        "Grounds BARS social features (threads, campaigns, shared quests) as a peer-production commons " +
        "and guards against enclosure of the knowledge base.",
      strandNote: "Diplomat strand consult — suggested as replacement for Wikipedia the Missing Manual.",
      relatedWikiSlugs: ["commons-networks-praxis"],
    },
  },
  {
    titleMatch: "focusing",
    pillar: {
      praxisPillar: "felt_sense",
      designIntentSummary:
        "Gendlin's Complete Focusing Instructions teaches the trainable skill of felt sense — " +
        "attending to bodily knowing before words arrive. The 321 Shadow Work process in BARS is its " +
        "direct application: three breaths, two observations, one felt-sense articulation. " +
        "Players with stronger felt-sense skill have measurably better quest engagement. " +
        'Key passages cover "checking" (the inner questioning gesture), "carrying forward," ' +
        "and creating space — all mapped to the Wake Up move.",
      relatedWikiSlugs: ["felt-sense-321-praxis", "shadow-work"],
    },
  },
]

async function run() {
  const books = await db.book.findMany({
    select: { id: true, title: true, metadataJson: true },
  })

  let updated = 0
  for (const tag of PILLAR_TAGS) {
    const match = books.find((b) =>
      b.title.toLowerCase().includes(tag.titleMatch.toLowerCase())
    )
    if (!match) {
      console.warn(`  ⚠  No book found matching "${tag.titleMatch}"`)
      continue
    }
    const merged = mergePraxisMetadata(match.metadataJson, tag.pillar)
    await db.book.update({ where: { id: match.id }, data: { metadataJson: merged } })
    console.log(`  ✓  Tagged "${match.title}" → ${tag.pillar.praxisPillar}`)
    updated++
  }

  console.log(`\nDone. ${updated}/${PILLAR_TAGS.length} books tagged.`)
  await db.$disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
