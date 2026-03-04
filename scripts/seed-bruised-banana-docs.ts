/**
 * Seed DocNodes for Bruised Banana common questions.
 * Enables Library Request resolution for "How do I donate?", "What are vibeulons?", etc.
 *
 * Run: tsx scripts/seed-bruised-banana-docs.ts
 * Idempotent — upserts by slug.
 */

import './require-db-env'
import { db } from '../src/lib/db'

const DOCS = [
    {
        slug: 'how-to-donate',
        title: 'How to Donate to the Residency',
        tags: ['donate', 'donation', 'fundraiser', 'money', 'contribute', 'support'],
        bodyRst: `How to Donate
================

You can donate to the Bruised Banana Residency (or any active fundraiser) in two ways:

1. **Event page** — Go to the Event page and click the Donate button.
2. **Donate page** — Visit /event/donate directly.

**Payment methods**: Venmo, Cash App, PayPal, or Stripe (card) — whichever the instance has configured.

**After donating**: Self-report your donation on the donate page. You receive BARs (redemption packs) that you can redeem for vibeulons in your wallet.

**Links**: Event page → Donate → Choose payment method → Self-report.
`,
    },
    {
        slug: 'vibeulons',
        title: 'What Are Vibeulons',
        tags: ['vibeulon', 'vibeulons', 'earn', 'currency', 'token', 'reward'],
        bodyRst: `What Are Vibeulons
===================

Vibeulons are the currency/token of the game. They represent emotional energy and contribution to the collective.

**How to earn vibeulons:**
- Complete quests
- Emotional First Aid (Clean Up move)
- Donate to the fundraiser (receive packs, redeem for vibeulons)
- Other contribution actions

Vibeulons flow when you Show Up — complete quests, contribute resources, take direct action.
`,
    },
    {
        slug: 'four-moves',
        title: 'The 4 Moves (Wake Up, Clean Up, Grow Up, Show Up)',
        tags: ['moves', '4 moves', 'wake up', 'clean up', 'grow up', 'show up', 'personal throughput'],
        bodyRst: `The 4 Moves (Personal Throughput)
====================================

How players get things done. Distinct from allyship domains (WHERE the work happens).

**Wake Up** — See more of what's available (who, what, where, how). Raise awareness. See who can help, what resources exist, where the work happens, how to contribute.

**Clean Up** — Get more emotional energy; unblock vibeulon-generating actions. When you're stuck, the Emotional First Aid kit helps. Clearing inner obstacles lets you take vibeulon-generating actions.

**Grow Up** — Increase skill capacity through developmental lines. Level up skills. Developmental lines (e.g. emotional, cognitive) expand your capacity.

**Show Up** — Do the work of completing quests. Complete quests, contribute resources, take direct action.
`,
    },
    {
        slug: 'bruised-banana-campaign',
        title: 'Bruised Banana Residency & Fundraiser',
        tags: ['bruised banana', 'residency', 'fundraiser', 'campaign', 'event'],
        bodyRst: `Bruised Banana Residency & Fundraiser
=====================================

The Bruised Banana Residency is a creative space and community supporting artists, healers, and changemakers. Your awareness and participation help the collective thrive.

**The Residency** — The house is run by Wendell Britt, Eddy, and JJ, who coordinate the residency and fundraiser.

**The Fundraiser** — Supports the house through donations. The campaign runs on quests, BARs, vibeulons, and story clock. Contributing money or playing the game helps the collective thrive.

**How to participate** — Donate (Event page → Donate) or play the game (Campaign → sign up → complete quests).
`,
    },
    {
        slug: 'allyship-domains',
        title: 'Allyship Domains (WHERE)',
        tags: ['domains', 'allyship', 'GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'],
        bodyRst: `Allyship Domains (WHERE)
=======================

WHERE the work happens. Each domain maps to an emergent problem.

**GATHERING_RESOURCES** — Need external (or inner) resources. Preference for external; can be inner (capacity) or outer (money, materials). The Bruised Banana fundraiser is GATHERING_RESOURCES.

**DIRECT_ACTION** — Action needs doing but people aren't doing it. Remove obstacles toward taking direct action, OR increase capacity via skill development or gathering resources as capacity.

**RAISE_AWARENESS** — People aren't aware of resources, organization, or actions available. "People need to know"; visibility, messaging, discovery.

**SKILLFUL_ORGANIZING** — No systems exist to solve the problem; the problem is lack of organization. "We need capacity"; creating structures, processes, interfaces.
`,
    },
]

async function main() {
    console.log('--- Seeding Bruised Banana DocNodes ---\n')

    for (const doc of DOCS) {
        await db.docNode.upsert({
            where: { slug: doc.slug },
            update: {
                title: doc.title,
                bodyRst: doc.bodyRst,
                tags: JSON.stringify(doc.tags),
                nodeType: 'handbook',
                scope: 'global',
                canonicalStatus: 'canonical',
                bodySource: 'curated',
            },
            create: {
                slug: doc.slug,
                title: doc.title,
                bodyRst: doc.bodyRst,
                tags: JSON.stringify(doc.tags),
                nodeType: 'handbook',
                scope: 'global',
                canonicalStatus: 'canonical',
                bodySource: 'curated',
            },
        })
        console.log(`  ✓ ${doc.slug}`)
    }

    console.log(`\n--- Seeded ${DOCS.length} DocNodes ---`)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
