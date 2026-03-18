# Plan: Campaign Subcampaigns

## Summary

Add subcampaign structure: campaigns have children keyed by allyship domain. Each subcampaign gets its own orientation. Direct Action subcampaigns inherit quest context from parent domain.

---

## Schema Options

### Option A: New Campaign Model

```prisma
model Campaign {
  id              String    @id @default(cuid())
  slug            String    @unique  // campaignRef (e.g. bruised-banana)
  parentId        String?   // null = top-level
  primaryDomain   String    // GATHERING_RESOURCES | DIRECT_ACTION | RAISE_AWARENESS | SKILLFUL_ORGANIZING
  name            String?
  description     String?
  instanceId      String?   // optional link to Instance
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  parent          Campaign?  @relation("CampaignHierarchy", fields: [parentId], references: [id])
  children       Campaign[] @relation("CampaignHierarchy")
  adventures      Adventure[]

  @@map("campaigns")
}

// Adventure gains campaignId (optional) or keeps campaignRef + subcampaignDomain
model Adventure {
  ...
  campaignId        String?   // FK to Campaign (subcampaign row)
  campaignRef       String?   // denormalized for lookup: bruised-banana or bruised-banana:DIRECT_ACTION
  subcampaignDomain String?   // when set, this Adventure is for that subcampaign
  ...
}
```

**Pros**: Full hierarchy, nesting, clear FK. **Cons**: New model, migration.

### Option B: Convention + Extension (Lighter)

**No new model.** Use convention:

- **Top-level campaign**: `Adventure.campaignRef = bruised-banana`, `subcampaignDomain = null`. Instance stores `primaryCampaignDomain` for the default campaign (or add to AppConfig).
- **Subcampaign**: `Adventure.campaignRef = bruised-banana`, `Adventure.subcampaignDomain = DIRECT_ACTION`. Compound ref for lookup: `bruised-banana:DIRECT_ACTION`.

Add to `Adventure`:
```prisma
subcampaignDomain String?   // RAISE_AWARENESS | DIRECT_ACTION | SKILLFUL_ORGANIZING; null = top-level
```

Add to `Instance` (or AppConfig):
```prisma
primaryCampaignDomain String?  // For instance's campaignRef: the top-level campaign's domain
```

**Pros**: Minimal schema change. **Cons**: Nesting harder (would need parentCampaignRef for nested subcampaigns).

### Option C: Hybrid — Campaign Table for Hierarchy Only

`Campaign` model stores hierarchy (id, slug, parentId, domain). `Adventure` and quest threads reference by `campaignRef` (compound: `slug` or `slug:domain`). Resolve via Campaign table.

---

## Recommendation

**Phase 1**: Option B — add `Adventure.subcampaignDomain`, `Instance.primaryCampaignDomain`. Support one level of subcampaigns. Compound ref: `campaignRef:subcampaignDomain` or `campaignRef` + `subcampaignDomain` in queries.

**Phase 2** (if nesting needed): Introduce Campaign model, migrate existing data.

---

## Implementation Order

### Phase 1: Schema + Domain Rules

1. Add `Adventure.subcampaignDomain` (String?, nullable).
2. Add `Instance.primaryCampaignDomain` (String?) — when instance has campaignRef, this is the top-level campaign's domain.
3. Create `src/lib/campaign-subcampaigns.ts`:
   - `getSubcampaignDomains(parentDomain: string): string[]`
   - `getCampaignRef(campaignRef: string, subcampaignDomain?: string | null): string` — returns `campaignRef` or `campaignRef:subcampaignDomain`
   - `parseCampaignRef(ref: string): { campaignRef: string; subcampaignDomain?: string }`
4. Campaign page: accept `ref=bruised-banana:DIRECT_ACTION` or `ref=bruised-banana&domain=DIRECT_ACTION`. Resolve Adventure by campaignRef + subcampaignDomain.

### Phase 2: Orientation Wiring

5. `assignOrientationThreads`: when player has `campaignRef` + chosen domain in storyProgress, assign thread for that subcampaign. QuestThread or CustomBar needs to reference subcampaign (e.g. `campaignRef` + `subcampaignDomain` on thread or quest).
6. Seed or create orientation threads per subcampaign for bruised-banana.
7. CYOA: when player selects domain, persist to campaignState; post-signup, use it to assign the right orientation thread.

### Phase 3: Direct Action Inheritance

8. Campaign deck / gameboard: when subcampaign is Direct Action, filter or tag quests by parent domain. `getCampaignDeckQuestIds(instanceId, campaignRef, subcampaignDomain?, period?)` — when subcampaignDomain=DIRECT_ACTION, include parent domain context in query.
9. CustomBar or quest metadata: add `parentDomainContext` when quest is for a Direct Action subcampaign? Or derive from campaign + slot.

### Phase 4: Template Generation

10. `generateFromTemplate(templateId, { campaignRef, subcampaignDomain? })` — set Adventure.campaignRef and subcampaignDomain.
11. Admin UI: subcampaign domain selector when generating for campaign.

---

## File Impacts

| Action | File |
|--------|------|
| Edit | `prisma/schema.prisma` — Adventure.subcampaignDomain, Instance.primaryCampaignDomain |
| Create | `src/lib/campaign-subcampaigns.ts` |
| Edit | `src/app/campaign/page.tsx` — parse ref, resolve Adventure by campaignRef+subcampaignDomain |
| Edit | `src/actions/quest-thread.ts` — assignOrientationThreads with subcampaign |
| Edit | `src/actions/campaign-passage.ts` or campaign resolution — support compound ref |
| Edit | `src/lib/template-library/index.ts` — generateFromTemplate options |
| Edit | Seed scripts — Instance.primaryCampaignDomain for bruised-banana |

---

## Nesting Depth (Future)

If we add Campaign model: `depth` field or computed from parent chain. Validation: `depth <= 3`. Child's domain must not equal parent's domain.
