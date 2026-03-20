# Regent Books — Integration Analysis
**Books**: Holacracy Constitution, Reinventing Organizations, Valve Employee Handbook
**Date**: 2026-03-19

---

## Holacracy Constitution

### Core concepts

The Holacracy Constitution (v4.1) defines a governance operating system with these load-bearing structures:

1. **Role anatomy**: Every Role has a Purpose (what it pursues), Domains (what it exclusively controls), and Accountabilities (ongoing activities it enacts). Roles are filled by Partners; unfilled roles default to the Lead Link.

2. **Tensions**: The core fuel of the system. A Tension is the gap between a Role's actual expression and its ideal potential. Every governance proposal must be grounded in a real Tension sensed by the Proposer. Tensions that go unresolved become blockers.

3. **Circle structure**: Circles are Roles that define sub-roles. Every Circle has a Lead Link (priority/strategy-setter), a Rep Link (speaks from Circle up to Super-Circle), a Facilitator (runs governance), and a Secretary (captures governance records). These four are Elected Roles.

4. **Governance Process**: The formal process for amending a Circle's Roles and Policies. Proposals are made by Core Circle Members, tested for validity, and adopted only if no valid Objections survive. Objections must pass strict criteria — they must demonstrate that adopting the Proposal would degrade the Circle's capacity (not just that a better option exists).

5. **Integrative Decision-Making Process (IDM)**: The meeting process for governance: present proposal → clarifying questions → reaction round → amend/clarify → objection round → integration. Objections require amendment and integration, not override.

6. **Integrative Election Process**: Nomination ballots, nomination round, nomination change round, then IDM from the objection round forward.

7. **Tactical Meetings**: The operational rhythm — check-in, checklist review, metrics review, progress updates, triage issues (converted to Next-Actions or Projects), closing round.

8. **Individual Action**: Partners may act outside role authority when acting in good faith for organizational purpose, when the cost of delay exceeds the cost of the unconstitutional action, and when the action does not dispose of significant resources. Afterwards, they must explain and restore.

9. **Process Breakdown**: When a Circle fails to process governance, the Super-Circle Facilitator may intervene. Escalation pathways exist up the circle hierarchy.

10. **Domain/Policy system**: Roles may define Policies over their Domains — granting or restricting others' authority to impact that Domain.

---

### Existing system mappings

| Holacracy concept | BARs Engine implementation | File |
|---|---|---|
| Role (Purpose, Domains, Accountabilities) | `Role` model with `purpose`, `accountabilities` (JSON), `scope` | `prisma/schema.prisma` lines 145–167 |
| Unfilled roles default to Lead Link | `fillUnfilledRoles()` fills unfilled roles with NPC | `src/actions/governance.ts` lines 242–296 |
| Role assignment with Focus | `PlayerRole.focus` field; `grantRoleToPlayer` passes `focus` | `src/actions/governance.ts` lines 312–416; `prisma/schema.prisma` line 190 |
| Role Scope (instance/nation/global) | `Role.scope` field; `PlayerRole.instanceId` / `PlayerRole.nationId` | `prisma/schema.prisma` lines 154, 188–189 |
| Prerequisite gates | `Role.prerequisites` JSON; `checkPrerequisites()` validates minBars, requiredRoleKeys, alignmentThresholds | `src/actions/governance.ts` lines 59–143 |
| Orientation quest on role grant | `Role.orientationTemplateId` → `PlayerQuest` created on grant | `src/actions/governance.ts` lines 396–404 |
| NPC fills unfilled roles (Lead Link surrogate) | `NpcProfile`, `isFilledByNpc` flag, `findOrSpawnNpcForRole()` | `src/actions/governance.ts` lines 156–230 |
| Governance audit trail (BAR = record) | `createFaceMoveBarAs(..., 'regent', 'grant_role', ...)` | `src/actions/governance.ts` lines 368–378 |
| Role manifest / current holder visibility | `getRoleManifest()` returns all roles with holder info | `src/actions/governance.ts` lines 424–456 |
| NPC budget / dormancy | `consumeNpcTokens()`, `dormantUntil`, `weeklyBudget` | `src/actions/governance.ts` lines 458–493 |
| Elected Roles (Facilitator, Secretary, Rep Link) | Not yet implemented | — |
| Governance Proposals | Not yet implemented | — |
| Objection cycle | Not yet implemented | — |
| Tactical Meetings | Not yet implemented | — |
| Circle / Sub-Circle nesting | Instance hierarchy exists (`parentInstanceId`, `sourceInstanceId`) but is not wired to governance circles | `src/actions/instance.ts` lines 139, 140 |
| Domain Policies | Not implemented | — |
| Tension tracking queue | Not implemented | — |

**Key observation**: The system has implemented Role anatomy (Article I) and basic unfilled-role defaulting with impressive fidelity. Articles II–IV (Circle structure, Governance Process, Tactical Meetings) are essentially absent.

---

### Missing mechanics

**1. Tension processing queue**
Holacracy §1.2.4 requires Partners to capture and track Tensions "at least until you process them into desired Projects or Next-Actions." BARs has no `Tension` model. Tensions are the raw material that governance proposals are made from. Without a queue, players sense friction but have no formal channel to surface it to the Regent for governance action.

**Proposed model addition**:
```
model Tension {
  id          String   @id @default(cuid())
  playerId    String
  roleId      String?
  instanceId  String?
  description String
  status      String   @default("open") // open | proposed | resolved
  proposalId  String?  // → GovernanceProposal when escalated
  createdAt   DateTime @default(now())
}
```

**2. Governance Proposal / Objection cycle**
§3.2 defines the full lifecycle: Proposal → validity test → objection round → integration. None of this exists in code. Currently `grantRoleToPlayer` is a fiat action by admins/stewards. There is no way for a non-admin Core Circle Member to propose a role change, policy change, or role amendment.

**Proposed model**:
```
model GovernanceProposal {
  id          String   @id @default(cuid())
  proposerId  String
  circleId    String   // instanceId or nationId scoping
  tensionId   String?
  description String
  status      String   @default("open") // open | objection_round | integrated | adopted | abandoned
  objections  GovernanceObjection[]
  createdAt   DateTime @default(now())
}

model GovernanceObjection {
  id          String   @id @default(cuid())
  proposalId  String
  objectorId  String
  description String
  valid       Boolean?
  resolvedAt  DateTime?
}
```

**3. Elected Roles (Facilitator, Secretary, Rep Link)**
§2.5 requires each Circle to hold elections for Facilitator, Secretary, and Rep Link. These roles have constitutional protections — they cannot be removed, only amended. The current system allows any role to be granted; there is no election process and no protection for these structural roles. The Regent agent in `backend/app/agents/regent.py` makes no mention of circle elections.

**4. Tactical Meeting rhythm**
§4.2 defines the operational meeting as: check-in → checklist review → metrics review → progress updates → triage issues → closing round. The Kotter stage progression in `updateInstanceKotterStage` (`src/actions/instance.ts` line 346) acts as a loose period-declaration, but it is admin-only, not a recurring collaborative meeting. There is no facilitated triage of tensions into Next-Actions.

**5. Rep Link / Cross Link**
No mechanism exists for a sub-circle to elect a representative to its super-circle, or for cross-linking external entities into a target circle's governance. The `parentInstanceId` / `linkedInstanceId` fields on Instance exist but are structural metadata, not governance-active links.

**6. Process Breakdown escalation**
§3.5 defines what happens when a circle fails to process governance: Super-Circle Facilitator gains authority to intervene. No corresponding escalation path exists.

**7. Individual Action reporting**
§4.3 requires that any partner who takes Individual Action must immediately report it to affected role-holders and offer to restore. The system has no Individual Action log, though face-move BARs (`grant_role`, `declare_period`) are the closest analog.

---

### NPC constitution language

The Regent NPC (`backend/app/agents/regent.py`) identifies as "a meticulous rule-keeper who tracks Kotter stages." From Holacracy, the Regent's constitutional voice should be expanded with:

- **Tension detection language**: "I sense the gap between what is and what could be. Name it precisely."
- **Proposal validity test voice**: "Does this proposal reduce a real tension you have sensed? Give me one concrete example from your actual situation."
- **Objection integration voice**: "This objection tells me where the proposal creates harm. Let us find the amendment that resolves both the tension and the objection."
- **Lead Link default voice**: "Until a human steps forward to claim this accountability, I hold it — lightly, not as power, but as placeholder. I am here to be displaced."
- **Process accountability voice**: "Records matter. What is not captured does not exist for governance purposes."

---

### Governance structure gaps

1. **No Circle model**: Instances function as Campaign containers, not as Holacracy Circles with Lead/Rep/Facilitator/Secretary roles and formal governance authority. The `Role.scope` field uses `'instance' | 'nation' | 'global'` but no Circle type is defined.

2. **Single-level governance**: Holacracy nests circles recursively (Sub-Circle → Super-Circle). BARs has `parentInstanceId` but no governance authority flows between parent and child instances.

3. **No Policy model**: Holacracy Roles can define Policies over their Domains. Nothing equivalent exists. Domain restrictions are implicit (enforced by the `requireRole` helper in governance.ts) rather than declarative.

4. **Seeded roles are instance-wide, not circle-scoped**: The three seeded roles (`witness`, `steward`, `curator`) in `scripts/apply-migration-governance.ts` lines 79–93 have `scope = 'instance'` but no mechanism assigns them to a specific Circle within that instance.

5. **grantRoleToPlayer uses fiat authority**: Currently only `admin` or `steward` role holders can grant roles (governance.ts line 325–331). Holacracy's Core Circle Member model means any circle member can make governance proposals — authority is distributed, not restricted to stewards.

---

## Reinventing Organizations

### Core concepts

Laloux (2014) maps organizational evolution through developmental color stages: Infrared → Magenta → Red → Amber → Orange → Green → Teal. The book is directly grounded in Ken Wilber's AQAL framework, the same Integral Theory that underpins BARs Engine.

The three Teal breakthroughs are:

1. **Self-management**: No hierarchy of bosses. Decisions are made by whoever is closest to the relevant information, after consulting affected parties (the "advice process"). No need for consensus or approval; the requirement is only to seek advice.

2. **Wholeness**: Organizations invite the whole person — emotional, intuitive, spiritual — not just the professional mask. Safe spaces, conflict resolution practices, and reflective meeting formats allow authentic presence.

3. **Evolutionary purpose**: The organization is treated as a living entity with its own purpose. Strategy is not planned top-down; it emerges as people listen and respond to what the organization "wants to become." The question is not "how do we beat competition?" but "what is ours to do?"

Key Teal practices relevant to BARs:
- **Advice process**: Anyone can make any decision but must consult those with expertise and those who will be affected. No approval needed, but advice must be sought.
- **Conflict resolution**: Three-stage cascade — direct conversation → mediator → peer panel.
- **Peer feedback**: Continuous, not annual; structured but not performance-managed.
- **No job titles / fluid roles**: People fill roles that match the work in front of them. Roles emerge organically, are tracked (like Holacracy), and change frequently.
- **Meetings**: Minimal, purposeful, with opening and closing rituals. Sociocracy-style meeting formats used in some Teal orgs.
- **Distributed authority**: "The hierarchy has been relocated" — decisions that were previously made at the CEO level are now made in self-organizing teams.

---

### Existing system mappings

| Teal concept | BARs Engine implementation | File |
|---|---|---|
| Self-management / distributed authority | NPC fills roles until human is ready; NPC is displaced when human steps in — mirrors the advice process rhythm | `src/actions/governance.ts` |
| Evolutionary purpose | Instance `targetDescription`, `wakeUpContent`, `showUpContent` — these encode what the campaign "wants to become" | `src/actions/instance.ts` |
| Wholeness / emotional alchemy | `AlchemyCheckIn`, `DailyCheckInQuest`, `EmotionalFirstAidKit` | `src/actions/emotional-first-aid.ts`, `src/components/dashboard/DailyCheckInQuest.tsx` |
| Fluid roles | `Role.focus` field allows role to be scoped to a context; `PlayerRole` can be scoped to instance | `prisma/schema.prisma` |
| Advice process | Not implemented | — |
| Conflict resolution cascade | Not implemented | — |
| Peer feedback / stack ranking equivalent | Not implemented | — |
| Developmental color stages | Allyship domains + Kotter stages map loosely to Teal's stage progression | `backend/app/agents/regent.py` |

---

### Missing mechanics

**1. Advice process**
Teal's most operationally distinctive feature: before making a significant decision, the decision-maker must seek advice from (a) those with expertise and (b) those who will be affected. No approval is required — only consultation. Currently, role granting is fiat authority (admin/steward only). Introducing an advice process would mean any player can propose a governance action if they first document who they consulted and what advice they received.

This maps directly to BAR generation: a governance proposal could manifest as a BAR that records the advice trail before the decision is adopted.

**2. Conflict resolution cascade**
Teal organizations use a three-stage conflict resolution process:
- Stage 1: Direct conversation between the parties
- Stage 2: Peer mediator chosen by mutual consent
- Stage 3: Panel of peers (or the whole group in small orgs)

No conflict resolution mechanism exists in BARs. The Regent is positioned as a rule-keeper but has no conflict-resolution tools. A `ConflictResolution` model with status tracking and mediator assignment would fill this gap.

**3. Role market / distributed authority**
Teal orgs have no job descriptions in the traditional sense. People fill roles that need filling. The current BARs system requires an admin/steward to grant roles. A Teal-style "role market" would allow players to self-select into unfilled roles subject to the advice process, without requiring admin approval.

**4. Peer feedback loop**
Teal orgs use continuous peer feedback, not annual reviews. BARs has BAR generation as the feedback mechanism but no structured peer feedback model. A lightweight `PeerFeedback` model (giver, receiver, context, content) would close this gap.

---

### NPC constitution language

The Regent NPC should speak from Teal altitude. Key language patches:

- **On purpose**: "What does this campaign want to become? I am here to hold that question, not to answer it for you."
- **On advice process**: "Before you act, who has expertise here? Who will be affected? Have you sought their advice? I will not stop you from deciding — but you owe them a conversation."
- **On wholeness**: "Your emotional state is data, not noise. I will not ask you to leave it at the door."
- **On evolutionary emergence**: "I do not plan the strategy. I listen for what wants to happen and clear the path."
- **On self-management**: "There is no boss here. There is only the role, the accountability, and the tension between them."

---

### Teal org implications for BARs Engine

1. **BARs as Teal organizations**: BARs Engine instances are not companies, but the community around a campaign is structurally a Teal org — distributed authority, fluid roles, purpose-driven, emotionally whole. The game should make this explicit.

2. **The advice process as the core governance move**: Instead of admin-gated role grants, the primary governance move should be "seek advice → document consultation → act." This is lower friction than Holacracy's IDM and more appropriate for a community game context.

3. **Wholeness practices as quests**: Morning check-ins, conflict resolution, peer appreciation — these are all quest-compatible activities. The `AlchemyCheckIn` model is the seed of this.

4. **Evolutionary purpose as the campaign arc**: The `wakeUpContent` / `showUpContent` / `targetDescription` fields are close to Teal's "listening to evolutionary purpose." The Regent agent's `readiness_for_next_stage` score could be recalibrated to ask "is the campaign purpose still resonating?" rather than "have we checked the Kotter boxes?"

5. **Stage mismatch risk**: Laloux emphasizes that Teal practices fail when the leader is not operating from Teal altitude (§3.1 "Necessary Conditions"). In BARs, this translates to: if the GM (admin/steward) is not operating from Teal altitude, the governance system will be captured by Amber or Orange behaviors — rules used for control, not evolution.

---

## Valve Employee Handbook

### Core concepts

Valve's handbook (2012) describes a "flat" organization — no managers, no hierarchy, no fixed job descriptions. Key mechanics:

1. **Flatland**: No one reports to anyone. The founder is "the most not-your-boss person." Decisions are made by whoever is closest to the information. Authority is situational, not positional.

2. **Desk wheels**: Physical metaphor for mobility — people self-organize to be close to where they can add the most value. No organizational barriers between person and customer.

3. **Cabals**: Self-organizing, multidisciplinary project teams. They form organically. People join based on belief that the work is important enough.

4. **Team leads**: Not managers. Primarily a "clearinghouse of information" — holding the whole project in their head so others can check decisions against them. Leads serve the team; they do not direct it.

5. **Hiring as the most important activity**: "Hiring well is the most important thing in the universe. Nothing else comes close." Adding a wrong person causes more damage than not hiring at all. They look for "T-shaped" people — broad generalists with deep expertise in one area. They also value collaborative intelligence over narrow domain skill.

6. **Stack ranking**: Annual peer-driven ranking on four metrics: Skill Level/Technical Ability, Productivity/Output, Group Contribution, Product Contribution. Compensation is calibrated to peer-assessed value.

7. **Peer reviews**: Separate from stack ranking. Used for growth feedback, not compensation. Anonymized, collected by interview, delivered to reviewee.

8. **Self-direction**: 100% of time is self-directed. People vote with their desk wheels — strong projects staff up, weak ones lose people.

9. **Risks**: Failure is expected and learned from. Repeating the same mistake is bad; making new mistakes is the cost of innovation.

10. **What Valve is bad at**: Mentoring, information dissemination, long-term prediction, and finding people who prefer traditional structure.

---

### Existing system mappings

| Valve concept | BARs Engine implementation | File |
|---|---|---|
| Flat structure / no fixed roles | `Role.focus` allows contextual role-filling; `isFilledByNpc` means NPCs are placeholders not directors | `prisma/schema.prisma` |
| Team lead as information clearinghouse | Regent NPC holds campaign state and acts as a reference point, not a director | `backend/app/agents/regent.py` |
| Project self-staffing | Quest assignment system — players can claim or be assigned quests | `src/actions/quest-engine.ts` |
| Desk wheels / self-organization | Players choose which quests to claim; `claimedById` field on `CustomBar` | `prisma/schema.prisma` |
| Hiring bar / gatekeeping | Prerequisite system (`checkPrerequisites`) gates role access | `src/actions/governance.ts` lines 59–143 |
| Peer reviews | Not implemented | — |
| Stack ranking equivalent | Not implemented | — |
| Cabal formation | Not implemented explicitly; instance grouping is the closest analog | — |
| T-shaped player | Not implemented; archetype + nation alignment is the closest approximation | `src/lib/allyship-domains.ts` |
| Failure tolerance / learning | No explicit failure-recovery system; dormant quests can be reactivated via `metal_reforge_the_relic` | `src/actions/nation-moves.ts` |

---

### Missing mechanics

**1. Player value assessment (stack ranking equivalent)**
Valve's stack ranking produces a peer-assessed signal of who is contributing most value. BARs has BAR completion counts and `PlayerAlignment` data, but no formal peer-assessment mechanism. A lightweight equivalent would:
- Allow players to rate collaborators after shared quests (1–3 dimensions: skill, group contribution, product contribution)
- Aggregate into a `PlayerReputation` score
- Feed into prerequisite checks (alignment thresholds already exist; peer reputation could be one)

**2. Cabal formation**
Valve's cabals are self-organizing multidisciplinary teams that form around a shared project goal. BARs has instances and quest threads, but no mechanism for players to self-organize into named working groups with explicit membership. A `Cabal` model (name, purpose, memberships, associated quests) would formalize this.

**3. Self-directed project selection**
Valve's 100% self-directed time means people always have the question "what is the most valuable thing I can work on?" BARs has assigned quests but no "quest market" where players browse open quests and self-select. The `getNationMovePanelData` function provides move options for an existing quest; there is no top-level "what should I work on?" surface.

**4. Information dissemination (Valve's self-identified weakness)**
Valve admits it is bad at disseminating information internally. BARs has the same problem: campaign state, governance decisions, role changes, and quest completions are siloed. A "Campaign Digest" BAR type — automatically generated by the Regent on governance events — would help.

**5. T-shaped player recognition**
Valve values breadth + depth. BARs has nation alignment (depth) and archetype (character type) but no breadth signal. A player who has completed quests across multiple allyship domains has breadth that is not currently recognized or surfaced.

---

### NPC constitution language

The Regent NPC's voice should carry Valve's ethos as a counterweight to its Holacracy formalism. Key patches:

- **On hiring (onboarding new players)**: "The bar for who joins this campaign is real. Not everyone belongs here. Bringing in the wrong person causes more harm than leaving the role unfilled."
- **On self-direction**: "I cannot tell you what to work on. That is yours. What I can tell you is what is most unblocked, most valuable, most urgent — and then step back."
- **On team leads**: "I hold the whole in my head so you don't have to. Come check your decisions against mine — not because I'm the boss, but because I've been watching."
- **On failure**: "Expensive mistakes are fine. The only bad mistakes are repeated ones and ignored signals."
- **On information flow**: "If it is not visible, it does not exist. Say what you're working on. What you're stuck on. What you learned. The campaign needs that data."

---

## Cross-book synthesis

### The single highest-leverage integration

**The Tension → Proposal → Advice → BAR pipeline.**

All three books converge on the same missing mechanic from different angles:

- **Holacracy** says: Tensions must be captured, processed, and either resolved as Next-Actions/Projects or escalated as governance Proposals with an objection cycle.
- **Reinventing Organizations** says: The advice process is the core decision-making primitive. Before acting on a tension, seek advice from those with expertise and those who will be affected. Document it.
- **Valve** says: All decisions should be measurable, tested against evidence, and visible to the team. The "right thing to do" is decided by whoever is closest to the information, after consulting others.

BARs Engine has the BAR as its universal artifact — every significant action produces a BAR. The missing mechanic is:

1. **A player senses a Tension** (gap between current reality and role potential)
2. **The Tension is captured** in a lightweight `Tension` record attached to a role or instance
3. **The player initiates the advice process** — records who they consulted and what advice they received (stored as a BAR or BAR annotation)
4. **If the advice produces a governance change** (new role, policy, role amendment), a `GovernanceProposal` is created
5. **The Regent agent runs the objection round** — asynchronously, through a quest or BAR thread — integrating objections
6. **The adopted governance change** is recorded as a BAR with `barType: 'governance'` and linked to the relevant `PlayerRole`, `Role`, or policy record

This pipeline:
- Requires zero new UI beyond what already exists (BARs, quests, threads)
- Gives the Regent agent a concrete job: run the objection round
- Gives players a governance voice without requiring admin mediation
- Produces an auditable record (the governance BAR trail)
- Degrades gracefully: without AI, the Regent NPC holds roles and the human admin approves proposals manually (same as today)

---

### Recommended immediate action

**Implement a minimal Tension queue and wire it to the Regent agent.**

This is the single action that unlocks the most downstream value. Specifically:

**Step 1 — Schema** (1 migration, no UI required):
Add `Tension` model to `prisma/schema.prisma`:
```prisma
model Tension {
  id           String    @id @default(cuid())
  playerId     String
  instanceId   String?
  roleId       String?
  description  String
  status       String    @default("open") // open | proposed | resolved | dropped
  proposalId   String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  player   Player    @relation(fields: [playerId], references: [id])
  instance Instance? @relation(fields: [instanceId], references: [id])
  role     Role?     @relation(fields: [roleId], references: [id])

  @@map("tensions")
}
```

**Step 2 — Action** (new function in `src/actions/governance.ts`):
`captureTension(input: { description: string; roleId?: string; instanceId?: string })` — authenticated, creates the record, optionally spawns a governance quest.

**Step 3 — Regent agent tool** (add to `backend/app/agents/regent.py`):
`get_open_tensions(ctx)` — queries the `tensions` table for open tensions in the current instance. This gives the Regent agent the raw material to identify where governance proposals are needed.

**Step 4 — Regent system prompt patch**:
Add to `SYSTEM_PROMPT` in `regent.py`:
```
## Tension Processing
When players sense gaps between what is and what could be in their roles,
those become Tensions. Your job is to:
1. Acknowledge the tension as real and important
2. Ask: does this tension require a governance change (role/policy) or an operational next-action?
3. If governance: help the player formulate a Proposal and identify who to consult
4. If operational: help the player identify the next concrete action
5. Record the outcome in the tension's status
```

This four-step implementation can be done without any front-end changes, does not break existing behavior, and gives the Regent NPC a concrete governance function that connects all three books' core mechanics.

---

### Supporting priorities (in order after the Tension queue)

1. **Elected Roles guard** — Add a `isElected` boolean to `Role` and prevent `grantRoleToPlayer` from overwriting elected roles without an election process. This prevents governance capture.

2. **Advice trail on governance BARs** — Add an `adviceTrail` JSON field to the `grant_role` BAR metadata, recording who was consulted and what they said. This satisfies both Holacracy's transparency requirement and Teal's advice process.

3. **Cabal model** — Add a lightweight `Cabal` model (name, purpose, members, questIds) to formalize self-organizing working groups. Wire it to the `QuestThread` system.

4. **Player reputation signal** — Add post-quest peer rating (1 dimension: "did this person help the campaign?") aggregated into `PlayerAlignment`. Use as an additional prerequisite threshold.

5. **Campaign Digest BAR type** — Regent auto-generates a weekly `barType: 'digest'` BAR summarizing: open tensions, governance decisions made, roles filled/displaced, Kotter stage readiness. Solves Valve's "information dissemination" weakness.
