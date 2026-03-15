# Plan: Template Library & Draft→Adventure Flow

## Summary

Add `AdventureTemplate` model, seed first template (9-passage), `generateFromTemplate` service, and admin UI for Template Library and promote-to-active.

---

## Implementation Order

### Phase 1: Schema + Seed

1. **`prisma/schema.prisma`**
   - Add model:
     ```prisma
     model AdventureTemplate {
       id            String   @id @default(cuid())
       key           String   @unique  // encounter-9-passage
       name          String
       description   String?
       passageSlots  String   // JSON: [{ nodeId, label?, order }]
       startNodeId   String
       ownership     String   @default("system")  // system | player
       createdAt     DateTime @default(now())
       updatedAt     DateTime @updatedAt

       @@map("adventure_templates")
     }
     ```
   - Run `npm run db:sync`

2. **`scripts/seed-adventure-templates.ts`**
   - Upsert template `encounter-9-passage` with 9 slots
   - Add `npm run seed:adventure-templates`

### Phase 2: Service

3. **`src/lib/template-library/index.ts`**
   - `listTemplates(): Promise<AdventureTemplate[]>`
   - `generateFromTemplate(templateId: string, options?: { title?: string; slug?: string }): Promise<Adventure>`
     - Fetch template, parse passageSlots
     - Create Adventure (DRAFT, title/slug from options or defaults)
     - Create Passage for each slot with placeholder text
     - Set adventure.startNodeId = template.startNodeId
   - `promoteDraftToActive(adventureId: string): Promise<Adventure>`

### Phase 3: Admin UI

4. **`/admin/templates`**
   - Page: list templates (name, description, "Generate" button)
   - Server Action: generateFromTemplate → redirect to /admin/adventures/[id]

5. **Adventure detail page**
   - When status DRAFT: add "Promote to Active" button
   - Server Action: promoteDraftToActive

6. **Navigation**
   - Add "Templates" link to Admin nav or Adventures page sub-nav

### Phase 4: Verification Quest

7. **`cert-template-library-v1`**
   - Twine story: steps to open Template Library, generate, edit passage, promote
   - CustomBar with isSystem, visibility public
   - Seed script entry

---

## File Impacts

| Action | File |
|--------|------|
| Edit | `prisma/schema.prisma` — add AdventureTemplate |
| Create | `scripts/seed-adventure-templates.ts` |
| Edit | `package.json` — add seed script |
| Create | `src/lib/template-library/index.ts` |
| Create | `src/app/admin/templates/page.tsx` |
| Create | `src/app/admin/templates/actions.ts` |
| Edit | `src/app/admin/adventures/[id]/page.tsx` — add Promote button |
| Create | `src/app/admin/adventures/[id]/actions.ts` (or extend existing) — promoteDraftToActive |
| Edit | `src/components/AdminNav.tsx` or adventures page — link to templates |
| Create | Verification quest (Twine + seed) |

---

## First Template: encounter-9-passage

| key | name | startNodeId |
|-----|------|-------------|
| encounter-9-passage | Encounter (9-passage) | context_1 |

Passage slots: context_1, context_2, context_3, anomaly_1, anomaly_2, anomaly_3, choice, response, artifact.

Placeholder text per passage: `[Edit: {nodeId}]` or similar.

---

## Verification

- [ ] `npm run db:sync` succeeds
- [ ] `npm run seed:adventure-templates` creates 1 template
- [ ] Generate from template creates Adventure with 9 passages
- [ ] Promote to Active updates status
- [ ] Verification quest exists and is seedable
