---
description: Rumor generation — players seed true rumors about themselves as collaboration breadcrumbs
---

# Rumor Generation

Rumors are **true statements a player releases into the community field** as breadcrumbs to draw collaborators toward them. A rumor is not gossip — it is a signal about what the player is working on, what they've metabolized, what they're looking for.

## Why rumors, not profiles

A static profile is a declaration. A rumor is a living artifact that spreads through the social fabric. The difference:

- Profile: "I work on equity initiatives." (static, self-described)
- Rumor: "I heard Ayanna metabolized a year-old grudge about a committee vote." (specific, verifiable, compelling)

Rumors create **entry points for collaboration** without requiring the player to make a direct ask. Other players who are working on similar patterns recognize themselves in the rumor and reach out.

## Anatomy of a Rumor BAR

A Rumor BAR is a `CustomBar` with `type: 'rumor'`. Fields:

- `title` — the rumor headline (e.g. "I've been sitting with the grief of a project I walked away from")
- `description` — optional depth (the full texture of what's true)
- `sourceBarId` — optionally anchored to a specific BAR or quest (the evidence base)
- `visibility` — `'community'` (visible to campaign members) or `'public'` (visible to anyone with the game link)
- `elementChannel` — which emotional alchemy channel the rumor touches (routes it to players at resonant states)
- `rumorStatus` — `'seeded'` | `'spreading'` | `'resolved'`

## How rumors spread

In a campaign, rumors seeded by one player become visible to others in the same campaign. The mechanism:

1. Player seeds a rumor from their hand (a "Release" action)
2. Rumor appears in the campaign feed as a card with a "Reach out" CTA
3. If another player claims the rumor (offers a connection, witnesses it, or forks a shared quest from it), the rumor shifts from `spreading` to `resolved`
4. The original player gets a notification: "Your rumor found resonance with [player]."

## Rumor and trust

Seeding a true rumor is a **Benevolence signal** — the player is revealing something real about themselves at potential social cost. It earns trust capital with the community by demonstrating willingness to be known.

A player who consistently seeds accurate rumors (their claims are confirmed by subsequent actions) builds Integrity trust across the network.

## Rumor ecology

When enough rumors are in circulation, the campaign starts to feel like a **living field** rather than a task list. Players can scan the rumor feed for:

- Players working on similar emotional patterns (resonance-based collaboration)
- Players with complementary skills or experiences (competence-based connection)
- Players who are about to get stuck (Carried Weight rumors — "I've been sitting with this unfinished thing for 3 weeks")

## Snap decision analog

The "snap decision" mechanic from the King of Bars analysis doesn't directly map to this system (which is async). But the **Rumor** is its closest analog: instead of snap decisions forcing immediate choices, rumors create **low-pressure windows** for connection. Players browse the rumor field and choose whether to engage. No deadline, no pressure — just a breadcrumb left in the field.

## Implementation notes

- Phase 1: Add `type: 'rumor'` to `CustomBar` type enum; add `elementChannel` and `rumorStatus` fields
- Phase 2: Rumor feed in campaign board (separate section from BARs and quests)
- Phase 3: Rumor routing by `elementChannel` — players in `fear:dissatisfied` see Metal-channel rumors first
- No AI required: players write their own rumors; authenticity is the feature
