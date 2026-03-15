# Tasks: Template Library & Draft→Adventure Flow

## Phase 1: Schema + Seed

- [ ] **1.1** Add `AdventureTemplate` model to `prisma/schema.prisma`:
  - key (String, unique)
  - name (String)
  - description (String?)
  - passageSlots (String) — JSON
  - startNodeId (String)
  - ownership (String, default "system")
  - createdAt, updatedAt
  - @@map("adventure_templates")

- [ ] **1.2** Run `npm run db:sync`

- [ ] **1.3** Create `scripts/seed-adventure-templates.ts`:
  - Import `./require-db-env`, `db` from `../src/lib/db`
  - Upsert template: key `encounter-9-passage`, name `Encounter (9-passage)`, description, passageSlots (9 slots), startNodeId `context_1`, ownership `system`
  - Log success

- [ ] **1.4** Add `"seed:adventure-templates": "tsx scripts/seed-adventure-templates.ts"` to package.json

- [ ] **1.5** Run `npm run seed:adventure-templates` — verify 1 row

## Phase 2: Service

- [ ] **2.1** Create `src/lib/template-library/index.ts`:
  - `listTemplates()` — db.adventureTemplate.findMany()
  - `generateFromTemplate(templateId, options?)` — create Adventure + Passages from template
  - `promoteDraftToActive(adventureId)` — update status to ACTIVE
  - Placeholder text: `[Edit: {nodeId}]` for each passage
  - Choices: empty array `[]` for each passage (choice passage may need link to response; handle in v0 as single choice or leave for manual edit)

- [ ] **2.2** For generateFromTemplate: ensure startNodeId is set on Adventure; create passages in slot order; use unique slug (e.g. `encounter-{timestamp}` or `encounter-{cuid}`)

## Phase 3: Admin UI

- [ ] **3.1** Create `src/app/admin/templates/page.tsx`:
  - Fetch templates via listTemplates (or inline db call)
  - Display: name, description, "Generate" button per template
  - "Generate" calls Server Action → redirect to /admin/adventures/[newId]

- [ ] **3.2** Create `src/app/admin/templates/actions.ts`:
  - `generateFromTemplateAction(templateId, formData?)` — call service, redirect

- [ ] **3.3** Edit `src/app/admin/adventures/[id]/page.tsx`:
  - When adventure.status === 'DRAFT': add "Promote to Active" button
  - Wire to promoteDraftToActive Server Action

- [ ] **3.4** Add promoteDraftToActive to adventures actions (create or extend `src/app/admin/adventures/[id]/actions.ts`)

- [ ] **3.5** Add "Templates" link: Admin nav or /admin/adventures page (e.g. "Create from template" or link to /admin/templates)

## Phase 4: Verification Quest

- [ ] **4.1** Create verification quest `cert-template-library-v1`:
  - Twine: steps to Admin → Templates → Generate → Edit passage → Promote to Active
  - CustomBar: isSystem, visibility public, deterministic id
  - Add to seed-cyoa-certification-quests or create seed script

## Verification

- [ ] `npm run build` and `npm run check` pass
- [ ] Generate from template → Adventure with 9 passages
- [ ] Promote to Active works
- [ ] Verification quest is seedable and completable
