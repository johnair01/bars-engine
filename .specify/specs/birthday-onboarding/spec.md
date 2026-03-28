# Spec: Birthday Onboarding

## Purpose

Build the Birthday Onboarding system — a host-controlled Game Lobby where Wendell (server owner) can spin up new game instances for guests like JJ; an Instance Creation Wizard driven by a vibe interview and campaign goal interview that seeds BARs and configures the instance; a guest onboarding flow with full custom nation + archetype creation (AI-assisted, instance-scoped); and a "Fork This Game" BAR that teaches players how to deploy their own copy of the engine.

**Problem**: There is no way for Wendell (server host) to manage multiple game instances from a single deployment, no wizard for JJ to configure her own birthday campaign (generating BARs from her goals), no guest onboarding that produces custom nations/archetypes scoped to an instance, and no pathway for players to fork the engine to their own server.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Lobby gate | `admin` role in DB AND `ENABLE_LOBBY=true` env var — not a new DB role |
| Instance scope | Nation + Archetype have optional `instanceId` FK (null = global, non-null = instance-scoped) |
| Copy+Reset | Copies config fields only — no players, no BARs, clean slate |
| Guest export | Instance-scoped nations/archetypes exportable to global pool (`instanceId → null`) |
| AI BAR generation | `gpt-4o-mini`; GM reviews generated BARs as drafts before publishing |
| Fork This Game | "Fork This Game" BAR is itself a BAR — meta-game in the game |
| JJ experience | Does not need to know she is on Wendell's server; VIP onboarding without visible infrastructure |
| Pacing | Daily check-in (existing AES system) gates content pacing — no new pacing system |

## Conceptual Model

| Dimension | Value |
|-----------|-------|
| **WHO** | Host (Wendell/admin): creates instances; Birthday person (JJ): GM of her instance; Guests: players |
| **WHAT** | Game instance + seeded BARs + custom nation + custom archetype + Fork BAR |
| **WHERE** | `/lobby` (host), `/join/[instanceSlug]` (guests), `/fork-wizard` (forkers) |
| **Energy** | Birthday energy → instance config → BARs → player onboarding → gameplay |
| **Personal throughput** | Wake Up (vibe check) → Show Up (join instance + complete character) |

## API Contracts (API-First)

### `createInstance` (Route Handler — `/api/lobby/create-instance`)

**Input**: `{ vibeData: VibeInterview; goalData: CampaignGoals }`
**Output**: `{ instance: Instance; draftBars: { id: string; title: string }[]; inviteLink: string }`

```ts
type VibeInterview = {
  birthdayPersonName: string
  vibeWords: string[]
  desiredFeeling: string
  energyLevel: 'chill' | 'medium' | 'high-energy'
}

type CampaignGoals = {
  primaryGoal: string
  secondaryGoals: string[]
  domainType: AllyshipDomain
  campaignDuration: string
}
```

### `onboardGuest` (Server Action)

**Input**: `{ instanceSlug: string; vibeCheck: GuestVibeCheck; nationData: CustomNationInput; archetypeData: CustomArchetypeInput }`
**Output**: `{ player: Player; nation: Nation; archetype: Archetype; personalBars: { id: string; title: string }[] }`

### `claimForkBar` (Server Action)

**Input**: `{ instanceId: string }`
**Output**: `{ exportRequest: InstanceExportRequest }`

### `approveExportRequest` (Server Action, admin)

**Input**: `{ exportRequestId: string }`
**Output**: `{ configBundle: string; downloadUrl: string }` — JSON config bundle

### `exportNationToGlobal` (Server Action)

**Input**: `{ nationId: string }` (must own or admin)
**Output**: `{ nation: Nation }` — `instanceId` set to null

## User Stories

### P1: Host creates a new game instance via wizard

**As Wendell (server host)**, I want to create a birthday instance for JJ in under 5 minutes, so she gets a personalized campaign without needing to see the infrastructure.

**Acceptance**: `/lobby/new` 3-step wizard (vibe interview → campaign goals → review + create). Creates `Instance` + 3-5 AI-drafted `CustomBar` records (status: `draft`, visibility: `private`). Returns invite link for JJ.

### P1: Guest completes 4-step onboarding

**As a party guest**, I want to join JJ's birthday instance, create a custom nation and archetype, and receive personal BARs, so I'm immediately equipped to play.

**Acceptance**: `/join/[instanceSlug]` 4-step wizard: vibe check → custom nation → custom archetype → confirmation. AI completes nation description + archetype moves. Personal BARs assigned. All scoped to `instanceId`.

### P2: Player claims "Fork This Game" BAR

**As a player inspired by the game**, I want to claim a BAR that walks me through deploying my own copy of the engine, so I can run my own birthday game.

**Acceptance**: "Fork This Game" BAR claimable from quest library. Completion creates `InstanceExportRequest` visible in `/lobby`. Host approves → config JSON bundle generated + download link.

### P3: Host copies an existing instance (config only)

**As Wendell**, I want to copy an existing instance as a template for a new party, so I don't start from scratch.

**Acceptance**: "Copy + Reset" in `/lobby` creates new `Instance` with `sourceInstanceId` set; copies config fields only; no players, no BARs.

## Functional Requirements

### Phase BO-1: Schema + Migration

- **FR1**: `Nation` gains optional `instanceId` FK: `instanceId String?`, `instance Instance? @relation(...)`
- **FR2**: `Archetype` gains optional `instanceId` FK (same pattern)
- **FR3**: `Instance` gains: `vibeData String?` (JSON), `goalData String?` (JSON), `sourceInstanceId String?`
- **FR4**: New `InstanceExportRequest` model: `id`, `instanceId`, `requestedByPlayerId`, `status` (`pending|approved|rejected`), `configBundle` (JSON?), `requestedAt`, `resolvedAt?`

### Phase BO-2: Game Lobby (`/lobby`)

- **FR5**: `/lobby/layout.tsx` gates on `player.role === 'admin' && process.env.ENABLE_LOBBY === 'true'`; else redirects to `/`
- **FR6**: `/lobby` lists all `Instance` records with player count, status, quick links to admin panel
- **FR7**: "Create new instance" → `/lobby/new`; "Copy + reset" → copies config only
- **FR8**: Shows pending `InstanceExportRequest` records with approve action

### Phase BO-3: Instance Creation Wizard

- **FR9**: 3-step wizard at `/lobby/new/InstanceCreationWizard.tsx`: vibe interview → campaign goals → review + create
- **FR10**: `createInstance` route handler calls AI SDK (`gpt-4o-mini`) to generate 3-5 draft `CustomBar` records
- **FR11**: Returns invite link for birthday person (`/join/[slug]`)

### Phase BO-4: Guest Onboarding (`/join/[instanceSlug]`)

- **FR12**: 4-step wizard: vibe check → custom nation → custom archetype → confirmation
- **FR13**: AI completes: nation description + `wakeUp/cleanUp/growUp/showUp` WAVE content; archetype description + moves (3 from existing move engine)
- **FR14**: All created records have `instanceId = this instance`; exportable via `exportNationToGlobal`
- **FR15**: Confirmation screen shows: player's nation, archetype, personal BARs; links to dashboard filtered to instance

### Phase BO-5: Fork This Game BAR + Export

- **FR16**: `scripts/seed-fork-bar.ts` seeds "Fork This Game" BAR in global quest library
- **FR17**: Claiming the BAR creates `InstanceExportRequest` (status: `pending`)
- **FR18**: `approveExportRequest` generates config JSON bundle: instance config + seeded nations/archetypes + BAR templates (NO player data)

### Phase BO-6: Fork Guide

- **FR19**: `/wiki/fork-your-instance` — static page: Prerequisites, Fork repo, Configure env vars, Deploy to Vercel, Import config bundle
- **FR20**: `/fork-wizard` — 5-step in-game wizard with checkboxes + config import

## Non-Functional Requirements

- JJ (birthday person) never sees the word "Wendell's server" or any infrastructure terminology
- AI-generated fields (nation description, archetype moves, BARs) are editable after creation
- Instance-scoped nations/archetypes are preserved as long as the instance exists; exportable to global at any time
- `npm run build + npm run check` pass

## Persisted data & Prisma

| Check | Done |
|-------|------|
| All model additions named in API Contracts + FRs | |
| `tasks.md` includes `npx prisma migrate dev --name add_birthday_onboarding` | |
| `npm run db:sync` after schema edit | |
| Human reviews migration SQL — new FK fields are nullable | |

**New model** `InstanceExportRequest`:
```prisma
model InstanceExportRequest {
  id                 String    @id @default(cuid())
  instanceId         String
  requestedByPlayerId String
  status             String    @default("pending") // pending | approved | rejected
  configBundle       String?   // JSON export
  requestedAt        DateTime  @default(now())
  resolvedAt         DateTime?

  @@map("instance_export_requests")
}
```

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| AI calls | `gpt-4o-mini` only; draft BARs cached on Instance; no AI at guest onboarding time |
| Config bundle size | Pure JSON; no binary assets; typically < 100KB |

## Verification Quest

- **ID**: `cert-birthday-onboarding-v1`
- **Steps**:
  1. Set `ENABLE_LOBBY=true` env var; navigate to `/lobby` as admin — verify instance list loads
  2. Run Instance Creation Wizard — verify Instance created + 3-5 draft BARs generated
  3. Navigate to `/join/[slug]` — complete 4-step guest onboarding — verify custom nation + archetype created
  4. Claim "Fork This Game" BAR — verify `InstanceExportRequest` appears in `/lobby`
  5. Approve export request in `/lobby` — verify config JSON download link appears
  6. Navigate to `/wiki/fork-your-instance` — verify all 5 sections render
- **Narrative**: "Verify the birthday onboarding system so Wendell can spin up JJ's residency instance and guests can create custom characters."

## Dependencies

- `src/lib/db.ts` — Instance, Nation, Archetype models
- `src/actions/instances.ts` — existing instance CRUD
- Existing AI SDK patterns (`generateObject`, `getOpenAI`)
- `seed-threshold-encounter` — guest vibe check can trigger threshold encounter (Phase 2)

## References

- Seed: [seed-birthday-onboarding.yaml](../../../seed-birthday-onboarding.yaml)
- World logic: substrate reuse, encounters before actions, self-composting, fork-as-BAR
