# Bruised Banana House Integration: Analysis and Plan

## Executive Summary

The Bruised Banana residency has two parallel campaigns: (1) **Fundraiser** (GATHERING_RESOURCES) — $3000 for the house; (2) **House Health** (SKILLFUL_ORGANIZING + DIRECT_ACTION) — coordination between Wendell, Eddy, JJ and the community. The house state is an emotional/coordination blocker. This document analyzes the domain model, maps intentions to domains, catalogs blockers, and proposes an integration plan that increases CYOA invitation throughput while building toward house-coordination features.

---

## Part 1: Domain Definitions (Emergent Problem → Domain)

Intentions and campaigns should map to **allyship domains**. The domain is determined by the **emergent problem**:

| Domain | Emergent Problem | When It Applies |
|--------|------------------|-----------------|
| **SKILLFUL_ORGANIZING** | No systems exist to solve the problem; the problem *is* lack of organization | "We need capacity"; creating structures, processes, interfaces |
| **RAISE_AWARENESS** | People aren't aware of resources, organization, or actions available | "People need to know"; visibility, messaging, discovery |
| **DIRECT_ACTION** | Action needs doing but people aren't doing it | Remove obstacles OR increase capacity (skill dev, resource gathering as capacity) |
| **GATHERING_RESOURCES** | Need external (or inner) resources | Preference for external; can be inner (capacity) or outer (money, materials) |

**Refinements from your input:**
- **Skillful Organizing**: If the emergent problem is "there is no skillful organization going on," the project moves to this domain.
- **Raise Awareness**: If people aren't aware there are resources, organization, and actions to take — campaign is raise awareness.
- **Direct Action**: Either (a) removing obstacles toward taking direct action, or (b) increasing capacity via skill development or gathering resources as capacity.
- **Gathering Resources**: Inner or outer; preference for external. Capacity = inner resource.

---

## Part 2: Intention Options → Domain Mapping

Intention choices should fit the **domains available to the system**. Each intention maps to a domain (or is domain-agnostic):

| Intention Option | Domain | Example Phrase |
|------------------|--------|----------------|
| **Following my curiosity** | (agnostic) | "I intend to follow my curiosity" |
| **Skillful Organizing** | SKILLFUL_ORGANIZING | "I intend to help build systems that solve what's emergent" |
| **Gathering Resources** | GATHERING_RESOURCES | "I intend to contribute resources (inner or outer) to the cause" |
| **Raise Awareness** | RAISE_AWARENESS | "I intend to help people see what's available" |
| **Direct Action** | DIRECT_ACTION | "I intend to take action and remove obstacles" |

**Implementation**: Intention options in orientation/campaign sign-up are a **choice list keyed by domain** (plus "curiosity" as opt-out). Stored as `intentionKey` + `intention` (free text or template). Market/quest assignment can filter by `player.intentionDomain` when set.

---

## Part 3: Bruised Banana House — Blocker Catalog

### The Situation
- **Players**: Wendell, Eddy, JJ (house admins/players)
- **Instance**: Yet-to-be-created Integral Emergence instance for Bruised Banana house
- **Campaign**: House health (ongoing); tension = house cleanliness
- **Stakes**: House state is emotional/coordination blocker for residency; residency brings resources so house players + community can resolve issues
- **Lore**: JJ and Wendell's birthday instances are Bruised Banana–hosted; developing this system IS part of the lore

### Blocker List (Prioritized)

| # | Blocker | Domain | Current Gap |
|---|---------|--------|-------------|
| 1 | **No easy onboarding** for JJ, Eddy, Wendell into a coordination game | SKILLFUL_ORGANIZING | Bars-engine maturity; no house-specific instance flow |
| 2 | **No transparency** on work done + emotional energy cost | RAISE_AWARENESS | Vibeulon movement invisible |
| 3 | **No daily/weekly/monthly/quarterly quests** for house tasks; no house state tracking | SKILLFUL_ORGANIZING | No recurring quest cadence; no house-state model |
| 4 | **Guests can't contribute** vibeulons/resources to the house | GATHERING_RESOURCES | No instance/house-level contribution flow |
| 5 | **No translation** of 4 moves (wake up, clean up, grow up, show up) to known-but-untracked quests | DIRECT_ACTION | No objective interface for "what we know needs doing" |
| 6 | **No appreciation before crisis** — no way to signal that work is seen | RAISE_AWARENESS / DIRECT_ACTION | No "give appreciation" mechanic |
| 7 | **No player-created vibeulons** for Emotional First Aid cleanup | DIRECT_ACTION (Clean Up) | EFA mints generic vibeulons; no signature |
| 8 | **No appreciation for house work** — can't give vibeulons for work done on house | DIRECT_ACTION | No "tip" or "appreciate" flow |
| 9 | **No service-for-vibeulon exchange** — e.g. body work → vibeulons → appreciation for high-priority quest | GATHERING_RESOURCES | No donation-of-service flow |

### What Exists Today
- **Emotional First Aid**: Mints vibeulons on completion (`emotional_first_aid` origin); no signature
- **Quest completion**: Mints vibeulons; no creator signature
- **Campaign CYOA**: Wake-Up → sign-up → onboarding; Event page has "Support the Residency"
- **Allyship domains**: CustomBar.allyshipDomain, Player.campaignDomainPreference (Q spec done)
- **Instance model**: Exists but no house-specific instance for Bruised Banana

---

## Part 4: Throughput Priorities

**Goal**: Increase throughput on sending invitations to the Bruised Banana Campaign.

**Emergent blocker**: Wendell wants a perfected CYOA flow before sending people the CYOA link. A landing page with all the basic moves (asking people to sign up for what their interest is) is safe to go live without the CYOA version. The CYOA can be dripped to players after they are already in the system.

**Two paths:**
| Path | Safe to go live? | When |
|------|------------------|------|
| Landing + 4 moves + sign-up for interest | Yes | Now |
| CYOA (Wake-Up campaign) | No (until perfected) | Drip to existing players in-app |

**High-leverage, low-friction actions:**
1. **Landing invitation flow** — Shareable link to landing with 4 moves + sign-up for interest (e.g. `/?ref=bruised-banana`); CYOA dripped to logged-in players
2. **Intention → domain** — When players choose intention, map to domain; show domain-aligned quests
3. **Event page clarity** — Donation link + "Choose your intention" CTA for campaign
4. **Lore as onboarding** — "The process of developing this system is part of the lore" — frame CYOA as "join the story of building the house"

**Medium-term (unblocks house coordination):**
5. **Instance for Bruised Banana house** — Dedicated instance with Wendell, Eddy, JJ as players
6. **Vibeulon visibility** — Show vibeulon movement (who earned, who gave, for what)
7. **Appreciation mechanic** — "Give vibeulons to [player/quest]" for work done
8. **Signature vibeulons** — EFA completion mints player's signature vibeulon; BAR completion mints creator's signature
9. **Recurring quest cadence** — Daily/weekly/monthly/quarterly quest types
10. **Service donation** — Donate service (e.g. body work) → receive vibeulons → give to house/quest

---

## Part 5: Integration Plan (Phased)

### Phase 1: Landing + Invitation Throughput (1–2 weeks)
- **1.1** Landing with 4 moves + sign-up for interest — home (or `/join`) shows Wake Up, Clean Up, Grow Up, Show Up; sign-up captures interest; primary CTA is sign-up, not CYOA
- **1.2** Add `?ref=` support to landing — e.g. `/?ref=bruised-banana`; ref passed to sign-up, stored in storyProgress
- **1.3** Shareable invite link: `https://<app>/?ref=bruised-banana` — points to landing, not CYOA
- **1.4** Event page: prominent "Invite friends" CTA with pre-filled landing link
- **1.5** CYOA as drip: "Begin the Journey" discoverable for logged-in players; not primary invitation target until perfected

### Phase 2: Domain-Aligned Intentions (1 week)
- **2.1** Replace/extend intention options with domain-keyed list: Following my curiosity, SKILLFUL_ORGANIZING, GATHERING_RESOURCES, RAISE_AWARENESS, DIRECT_ACTION
- **2.2** Store `intentionKey` (domain or "curiosity") + `intention` (text) in orientation quest inputs
- **2.3** Add `intentionDomain` to Player (optional) — derived from intentionKey for filtering
- **2.4** Market: when `intentionDomain` set, optionally prioritize quests with matching `allyshipDomain`

### Phase 3: Vibeulon Visibility + Appreciation (2–3 weeks)
- **3.1** Vibeulon movement feed: "Who earned what, for what" — new component or Wallet expansion
- **3.2** Appreciation mechanic: "Give X vibeulons to [Player/Quest]" — new action + UI
- **3.3** Instance-level contributions: Guests can contribute vibeulons to instance (e.g. Bruised Banana house)

### Phase 4: Signature Vibeulons + EFA (1–2 weeks)
- **4.1** Add `creatorId` to Vibulon schema (nullable)
- **4.2** EFA completion: mint vibeulon with `creatorId = playerId` (self-signature for Clean Up)
- **4.3** BAR completion: when quest.creatorId exists and not system, mint with `creatorId = quest.creatorId`

### Phase 5: House Instance + Recurring Quests (3+ weeks)
- **5.1** Create Bruised Banana house instance; onboard Wendell, Eddy, JJ
- **5.2** Recurring quest types: daily, weekly, monthly, quarterly
- **5.3** House state tracking (simplified): quest completion → house "health" or task status
- **5.4** Service donation: "Donate service" → receive vibeulons → allocate to instance/quest

---

## Part 6: Spec Kit Artifacts to Create

| Artifact | Purpose |
|----------|---------|
| `intention-domain-mapping/spec.md` | Intention options keyed by domain; schema for intentionKey, intentionDomain |
| `cyoa-invitation-throughput/spec.md` | ref param, shareable link, post-sign-up attribution |
| `vibeulon-visibility/spec.md` | Movement feed, who-earned-what |
| `appreciation-mechanic/spec.md` | Give vibeulons to player/quest |
| `signature-vibeulons/spec.md` | creatorId on Vibulon; EFA + BAR completion |
| `bruised-banana-house-instance/spec.md` | House instance, recurring quests, house state |

---

## Part 7: Domain × Intention Quick Reference

| Domain | Intention Phrase | Emergent Problem |
|--------|------------------|------------------|
| (agnostic) | Following my curiosity | — |
| SKILLFUL_ORGANIZING | I intend to help build systems that solve what's emergent | No organization exists |
| GATHERING_RESOURCES | I intend to contribute resources to the cause | Need external/inner resources |
| RAISE_AWARENESS | I intend to help people see what's available | People don't know |
| DIRECT_ACTION | I intend to take action and remove obstacles | Action isn't happening |

---

## Reference

- Plan: [d_scope_and_campaign_throughput_ea6f6891.plan.md](/Users/test/.cursor/plans/d_scope_and_campaign_throughput_ea6f6891.plan.md)
- Allyship domains: [.specify/specs/bruised-banana-allyship-domains/spec.md](../bruised-banana-allyship-domains/spec.md)
- Kotter by domain: [.agent/context/kotter-by-domain.md](../../../.agent/context/kotter-by-domain.md)
- Emotional First Aid: [src/actions/emotional-first-aid.ts](../../../src/actions/emotional-first-aid.ts)
