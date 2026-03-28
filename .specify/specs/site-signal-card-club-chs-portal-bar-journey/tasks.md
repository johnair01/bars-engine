# Tasks: Site signal — Card Club + CHS portal BAR journey

Spec: [.specify/specs/site-signal-card-club-chs-portal-bar-journey/spec.md](./spec.md) · Plan: [plan.md](./plan.md)

## Phase A — Card Club + nation rooms

- [x] **SCL-A1** — `AnchorModal`: handle `librarian_npc` with Regent/library copy + primary navigation to `/library` (optional secondary `/wiki` link).
- [x] **SCL-A2** — Define nation match rule: `Player.nation` key ↔ `MapRoom.nationKey` (document mapping in plan if `Nation.slug` vs `nationKey` differs).
- [x] **SCL-A3** — Block non-members from **nation_room** entry (server and/or client); show message + link back to Card Club (`/world/lobby/card-club`).
- [x] **SCL-A4** — Admin bypass (or `skipNationGate` for test accounts) — spec § FR-A3; document in code comment.
- [ ] **SCL-A5** — Run Verification Quest steps 1–2; update BACKLOG certification row when Phase A ships.

## Phase B — Portal adventure + BAR semantics

- [x] **SCL-B1** — Author portal adventure: four **move** branches visible early from `Portal_*` entry (content task; validate with UGA if graph-wide).
- [x] **SCL-B2** — Wake Up path: passage copy + `bar_emit` metadata **Wake Up**-aligned; CTA to `/library` after submit (preserve `ref`/`returnTo` query on link).
- [x] **SCL-B3** — `AdventurePlayer`: when `hexagram` / `face` query present, show one-line context (non-blocking strip).
- [x] **SCL-B4** — Six faces: implement **B4a** minimum (face picker → stub passage) **or** defer **B4b** full micro-flows with checked tasks in spec changelog.
- [x] **SCL-B5** — Honest “help the campaign” next steps (board / event / donate) when milestone DB link absent — link to BBMT traceability.
- [x] **SCL-B6** — Verification Quest step 3 + site-signal smoke (step 4); automation: `npm run test:scl-portal`, `npm run test:site-signal-schema`; manual steps in spec § Verification Quest.
- [x] **SCL-B7** — **Landing-first routing (FR-B6):** hub / spoke entry → **`/campaign/landing`** → CTA into portal adventure; align links in `CampaignHubView` / CHS pages + document in [CHS_RUNTIME_DECISIONS](../campaign-hub-spoke-landing-architecture/CHS_RUNTIME_DECISIONS.md) if needed.
- [x] **SCL-B8** — **State handoff:** ensure **spoke**, **move**, **face** (and hex when present) survive **landing → adventure** (query contract or persisted metadata); list fields in plan.md. *(v1: hex/face from hub state via spoke redirect; “move” = CYOA branch choices inside portal graph.)*
- [x] **SCL-B9** — **Gather-resources leg (FR-B7):** author or stub portal passages + optional `QuestThread` so “gather resources” **gates** BAR emit for Wake+face path; honest copy if quest is stubbed.
- [x] **SCL-B10** — **Admin LEGO checklist (FR-B9):** doc in spec `plan.md` — UGA validate, admin preview play, template/seed path for portal adventure, optional DT; verify stewards can ship spoke graph **without** co-play Share Your Signal as mandatory QA.

## Prisma (only if needed)

- [ ] **SCL-P1** — If schema change: `npx prisma migrate dev --name describe_change`, commit `prisma/migrations/`, `npm run db:sync`, `npm run check`.

## Verification (release)

- [x] `npm run build` && `npm run check`
- [x] Spec § Verification Quest — automated checks + manual playbook in spec; SMB/CBS vault-vs-seed branch remains future follow-up
