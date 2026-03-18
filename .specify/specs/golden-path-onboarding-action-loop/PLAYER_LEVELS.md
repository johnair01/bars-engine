# Player Levels — Six-Tier Design

**Purpose**: Define what a player can do at each level. Level 1 is designed for a powerful, curated experience. Level 6 is an admin who has forked the project for their own aims.

---

## Design Principle

**Level 1 must feel complete.** A Level 1 player should be able to land, accept a quest, complete it, see impact, and get a next quest—without needing anything from Levels 2–6. The experience is constrained by design: fewer options, clearer path, stronger payoff.

---

## Level 1 — New Player (Curated Loop)

**Who**: Just arrived via invite or direct signup. Has not completed first quest.

**What they can do**:
- **Land** on campaign landing (invite path) or minimal dashboard (direct path)
- **Accept** one starter quest via explicit CTA ("Accept your first quest")
- **Complete** that quest (attest, submit, or play Twine)
- **See impact** — vibeulon + "Your action contributed to [Campaign]"
- **Get next quest** — single "Your next quest: [Name]" card
- **Unblock when stuck** — "I'm stuck" → friction type → EFA or 321 → suggested next action → apply to quest

**What they cannot see** (hidden or deferred):
- Explore modal (Game Map, Quest Library)
- Character modal (nation/archetype details, roles)
- Campaign modal (full lobby, 8 portals)
- Journeys (threads, packs)
- Graveyard
- Create BAR / Commission flow
- Admin panel

**UI**: One primary CTA. One quest at a time. Completion → impact → next. No competing links.

**Success metric**: Completes first quest, sees impact, returns for second.

---

## Level 2 — Engaged Player (Loop Established)

**Who**: Has completed at least one quest. Has seen impact and next-quest flow.

**What they can do** (everything in L1, plus):
- **Browse** Quest Library (Explore → Quest Library)
- **Navigate** Game Map
- **Choose** from threads and packs (Journeys)
- **View** Character modal (nation, archetype, vibeulons)
- **Enter** Campaign Lobby (8 portals) — with light guidance
- **Use** EFA and 321 without hand-holding
- **See** Graveyard (abandoned quests)

**What they cannot do**:
- Create quests / BARs
- Invite others
- Steward gameboard slots
- Access admin

**UI**: Dashboard expands. Primary CTA shifts to "Your active quest" or "Continue your journey." Explore, Character, Campaign become secondary but visible.

**Success metric**: Completes 3+ quests, uses library or game map at least once.

---

## Level 3 — Regular Participant (Creator)

**Who**: Has completed several quests. Familiar with threads, packs, campaign.

**What they can do** (everything in L2, plus):
- **Create** a BAR (quest) via Commission / Create BAR flow
- **Invite** others (forge invite, share link)
- **Participate** in gameboard (bid on slots, offer aid)
- **Request** library content (Library Request)
- **Use** daemons, alchemy, NPCs (if enabled for instance)

**What they cannot do**:
- Create or edit campaigns (Instances)
- Manage quest pools
- Steward gameboard slots (unless granted)
- Access admin

**UI**: Full dashboard. "Create BAR" and "Invite" become visible. Gameboard participation unlocked.

**Success metric**: Creates first BAR, invites at least one person, or stewards a slot.

---

## Level 4 — Campaign Contributor (Steward)

**Who**: Trusted by campaign admins. Granted steward or contributor role.

**What they can do** (everything in L3, plus):
- **Steward** gameboard slots (assign quests, manage bids)
- **Contribute** to campaign content (quests, threads) — if instance allows
- **View** campaign analytics (participation, completion rates) — if exposed
- **Run** rituals or events — if instance allows

**What they cannot do**:
- Create or delete Instances
- Manage players globally
- Access platform admin
- Modify system config

**UI**: Campaign-specific admin surfaces. Gameboard steward controls. No global admin.

**Success metric**: Stewards at least one slot, contributes quest to campaign.

---

## Level 5 — Platform Admin

**Who**: Has `admin` role. Runs the deployed BARS Engine instance.

**What they can do** (everything in L4, plus):
- **Access** `/admin` — players, quests, instances, onboarding, certification
- **Create / edit** Instances (campaigns)
- **Manage** quest pools, threads, packs
- **Toggle** admin role for other players
- **Seed** data, run migrations
- **Configure** app config (active instance, default lobby, etc.)
- **Import** onboarding Twine, NPC constitutions
- **Certify** content, manage backlog

**What they cannot do** (without forking):
- Change core game loop logic
- Add new features not in codebase
- Deploy to a different domain/stack
- Rebrand or repurpose the product

**UI**: Full admin panel. NavBar shows Admin link. All system surfaces exposed.

**Success metric**: Runs campaign, manages content, supports players.

---

## Level 6 — Fork Owner

**Who**: Has cloned/forked the repo. Deploys their own instance. Own aims.

**What they can do** (everything in L5, plus):
- **Modify** codebase — new features, different loop, rebrand
- **Change** schema (Prisma), add models
- **Integrate** external systems (CRM, payment, analytics)
- **Deploy** to own infra (Vercel, Railway, self-hosted)
- **Define** own player levels, roles, campaigns
- **Remove** or replace Integral Theory / BARs framing
- **Build** entirely different product on same substrate

**What they have**: Full ownership. No dependency on upstream. Their game, their rules.

**Success metric**: Ships a product that serves their community.

---

## Summary Table

| Level | Name              | Key unlock                    | Constraint                         |
|-------|-------------------|-------------------------------|------------------------------------|
| 1     | New Player        | Accept → Complete → Impact → Next | One quest, one CTA, no sprawl      |
| 2     | Engaged Player    | Library, Map, Journeys, Campaign | No create, no invite               |
| 3     | Regular Participant | Create BAR, Invite, Gameboard | No campaign management             |
| 4     | Campaign Contributor | Steward slots, contribute content | No platform admin                  |
| 5     | Platform Admin    | Full admin panel, instances   | No code/schema changes              |
| 6     | Fork Owner        | Full codebase ownership       | None (their fork)                  |

---

## Implementation Notes

- **Level 1** is enforced by UI hiding (progressive disclosure), not by backend permissions. Backend treats L1–L3 as "player."
- **Level 4** may require `InstanceMembership` with a role (e.g. `steward`, `contributor`) or similar. Schema may need extension.
- **Level 5** is enforced by `admin` role (`PlayerRole` + `Role.key === 'admin'`).
- **Level 6** is out of scope for this codebase; it's a deployment/ownership model.

**Design priority**: Make Level 1 powerful. Everything else supports or extends it.
