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

**After donating**: Self-report your donation on the donate page (signed in). Vibeulons are minted to your wallet based on the amount.

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
- Donate to the fundraiser (self-report mints vibeulons to your wallet)
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
        slug: 'bars-guide',
        title: 'What Are BARs and How to Create Them',
        tags: ['bar', 'bars', 'create', 'inspiration', 'quest', 'gameplay'],
        bodyRst: `What Are BARs and How to Create Them
====================================

BARs are kernels of potential—seeds that fuel quests and add context to your journey.

**What is a BAR?** A compressed unit of potential: an insight, story, or intention. BARs can become quests, rules, lore, or community norms. They have provenance—who created them, when, and why.

**How to create**: Go to /bars/create or the BARs page. Give it a title and description. Share what you're noticing, what you want to contribute, or what you need. BARs can be private (drafts) or public (shared).

**How BARs connect to gameplay**: BARs fuel quests—admins turn high-quality BARs into quests for the campaign. BARs add context to quests—you can attach a BAR to a quest for inspiration. BARs move the needle.
`,
    },
    {
        slug: 'quests-guide',
        title: 'How to Make Quests and Add Subquests',
        tags: ['quest', 'quests', 'create', 'subquest', 'gameboard', 'campaign'],
        bodyRst: `How to Make Quests and Add Subquests
====================================

Quests are the work of the game.

**How to make a quest**: Create from the Create BAR flow—BARs often become quests. Or browse the Market to accept quests. Campaign quests live on the Gameboard—complete them there and draw new ones.

**Subquests**: Campaign quests can have subquests—smaller steps. When you pick up a campaign quest, you can add subquests to break it down. Personal and public quests can be appended to campaign quests for context.

**Where quests live**: Gameboard (campaign), Dashboard (active), Quest Wallet (/hand), Market (browse).
`,
    },
    {
        slug: 'emotional-first-aid-guide',
        title: 'How to Use Emotional First Aid',
        tags: ['efa', 'emotional first aid', 'clean up', 'medbay', 'unblock', 'stuck'],
        bodyRst: `How to Use Emotional First Aid
============================

EFA is the Clean Up move. It helps you unblock emotional energy when something is blocking you.

**When to use**: When you feel stuck—when you want to complete a quest but something blocks you. When you're low on energy. When you need to clear inner obstacles before you can Show Up.

**How to use**: Go to /emotional-first-aid (or Game Map → Emotional First Aid). The kit offers prompts and moves. Choose one that resonates. Follow the protocol. You earn vibeulons. Return to your quests with clearer energy.
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
