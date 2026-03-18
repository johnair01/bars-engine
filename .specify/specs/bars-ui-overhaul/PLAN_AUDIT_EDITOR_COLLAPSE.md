# Plan: Audit, Face/Back Editor, Quest→BAR Collapse

**Scope**: Three workstreams from [BAR_ONTOLOGY_ANALYSIS.md](BAR_ONTOLOGY_ANALYSIS.md):
1. Run existing BARs audit
2. Design and implement Face/Back card editor
3. Define and implement Quest→BAR collapse (Share-as-BAR)

---

## Workstream 1: Existing BARs Audit

**Goal**: Verify no existing BARs are broken by title/content changes. Document findings.

### Phase 1.1: Run Audit Queries

| Task | Action | Output |
|------|--------|--------|
| 1.1.1 | Create `scripts/audit-bars.ts` (or SQL file) with audit queries | Script |
| 1.1.2 | Run against dev DB: BARs where title ≠ first line of description | Count + sample |
| 1.1.3 | Run: total type='bar' count | Number |
| 1.1.4 | Run: invitation BARs (Invite.invitationBarId) | List + check display |
| 1.1.5 | Run: kernel BARs (Instance.kernelBarId if exists) | List |
| 1.1.6 | Check QuestProposal flow: does it use bar.title? | Code audit |

### Phase 1.2: Document and Remediate

| Task | Action |
|------|--------|
| 1.2.1 | Write `AUDIT_RESULTS.md` with findings |
| 1.2.2 | If invitation/kernel BARs need special handling: add display logic or migration |
| 1.2.3 | If QuestProposal uses bar.title: ensure derivation is correct or add fallback |

### Dependencies

- Dev DB with real or seeded data
- No code changes needed for audit itself

### Estimated Effort

- 1–2 hours (script + run + report)

---

## Workstream 2: Face/Back Card Editor

**Goal**: BARs feel like ART. Two-sided card; editor supports Face and Back.

### Phase 2.1: Schema and Data Model

| Task | Action |
|------|--------|
| 2.1.1 | Decide: explicit `faceContent` field or derive from first line? |
| 2.1.2 | Option A: Add `faceContent String?` to CustomBar (optional override; else first line) |
| 2.1.3 | Option B: No schema change. Face = first line of description OR primary image. |
| 2.1.4 | Migration if schema change |

**Recommendation**: Option B for v0. Face = first line (or image). No new field. Editor can add "face" as a UX hint (e.g. first line highlighted) without schema change.

### Phase 2.2: Card UI (Display)

| Task | Action |
|------|--------|
| 2.2.1 | List cards: Face only. Image + first line teaser. Already partially done. |
| 2.2.2 | Detail: Add flip interaction. Face on top, "Flip" → Back. Or tab: Face | Back. |
| 2.2.3 | TalismanReveal: already shows Face (content preview). No change needed. |

### Phase 2.3: Editor (Create + Edit)

| Task | Action |
|------|--------|
| 2.3.1 | Create flow: Add "Face" preview. Show how card will look in list. |
| 2.3.2 | Create flow: Optional "Face line" — if user wants explicit hook, one short field. Else derive from first line. |
| 2.3.3 | Edit flow: BAR detail needs edit mode. Add "Edit" for owner. |
| 2.3.4 | Edit: Face (first line or override) + Back (full content). Two fields or one with preview. |
| 2.3.5 | Card preview component: reusable for create, edit, and list. |

### Phase 2.4: ART Feel

| Task | Action |
|------|--------|
| 2.4.1 | Typography: Consider handwriting-style font for content (optional). |
| 2.4.2 | Card styling: Border, shadow, aspect ratio. Physical card feel. |
| 2.4.3 | Image: Primary when present. Larger on Face. |

### Dependencies

- Phase 2.1 can be skipped if Option B
- Phase 2.2–2.4 need 2.1 decision

### Estimated Effort

- 2.1: 0–1 hour (if Option B)
- 2.2: 2–3 hours (flip/tab UI)
- 2.3: 3–4 hours (create preview, edit mode)
- 2.4: 1–2 hours (polish)

---

## Workstream 3: Quest→BAR Collapse (Share-as-BAR)

**Goal**: "Share this quest" → create BAR → send. Recipient gets talisman; can "Grow as Quest."

### Phase 3.1: Collapse Contract

| Task | Action |
|------|--------|
| 3.1.1 | Define Quest→BAR collapse: Face = quest title (or first line of prompt). Back = full prompt + domain. |
| 3.1.2 | Define Campaign→BAR collapse: Face = campaign name. Back = goal + domain. |
| 3.1.3 | Schema: Add `collapsedFromQuestId`, `collapsedFromInstanceId` to CustomBar? Or reuse `sourceBarId` in reverse? |
| 3.1.4 | Document: When BAR grows to Quest, we have sourceBarId. When Quest collapses to BAR, we need provenance. |

**Schema**: Add `collapsedFromQuestId String?`, `collapsedFromInstanceId String?` to CustomBar. Enables "Grown from this quest" and "From this campaign" on BAR detail.

### Phase 3.2: collapseQuestToBar Server Action

| Task | Action |
|------|--------|
| 3.2.1 | `collapseQuestToBar(questId: string): Promise<{ barId: string }>` |
| 3.2.2 | Load quest. Create CustomBar: type='bar', title=quest.title, description=quest.description (or prompt), collapsedFromQuestId=questId. |
| 3.2.3 | If quest has assets, copy or link primary image to BAR. |
| 3.2.4 | Return barId. Caller (e.g. share flow) uses it for BarShare. |

### Phase 3.3: Share Quest UI

| Task | Action |
|------|--------|
| 3.3.1 | Quest detail: Add "Share as BAR" button. |
| 3.3.2 | On click: collapseQuestToBar → redirect to send flow with barId pre-filled, or open SendBarForm with barId. |
| 3.3.3 | Alternative: "Share as BAR" → create BAR → navigate to /bars/[id] with "Send" expanded. |

### Phase 3.4: Campaign→BAR (Optional)

| Task | Action |
|------|--------|
| 3.4.1 | `collapseCampaignToBar(instanceId: string): Promise<{ barId: string }>` |
| 3.4.2 | Campaign landing: Add "Share this campaign" → collapse → send. |

### Phase 3.5: BAR Detail — Provenance

| Task | Action |
|------|--------|
| 3.5.1 | When BAR has collapsedFromQuestId: show "From quest: [link]" badge. |
| 3.5.2 | When BAR has collapsedFromInstanceId: show "From campaign: [link]" badge. |
| 3.5.3 | "Grow as Quest" for collapsed BAR: pre-fill from original quest if available. |

### Dependencies

- Phase 3.1: Schema decision
- Phase 3.2: Depends on 3.1
- Phase 3.3: Depends on 3.2
- Quest detail page location (need to find)

### Estimated Effort

- 3.1: 1 hour (spec + schema)
- 3.2: 2 hours
- 3.3: 2 hours
- 3.4: 1–2 hours (if in scope)
- 3.5: 1 hour

---

## Execution Order

**Recommended sequence**:

1. **Workstream 1** (Audit) — Do first. No dependencies. Informs 2 and 3.
2. **Workstream 3** (Collapse) — Core axiom. Unblocks "Share quest" from product. Can start in parallel with 2.
3. **Workstream 2** (Editor) — Improves UX. Can be phased; Face/Back display can come before full editor.

**Parallel tracks**:

- Track A: Audit (1) → Collapse (3)
- Track B: Editor (2) — can start after 2.1 decision

---

## Tasks Summary

| ID | Workstream | Task | Est. |
|----|------------|------|------|
| 1.1 | Audit | Create and run audit script | 1h |
| 1.2 | Audit | Document AUDIT_RESULTS.md, remediate if needed | 1h |
| 2.1 | Editor | Decide Face/Back schema (Option A vs B) | 0.5h |
| 2.2 | Editor | Detail: flip or tab UI for Face/Back | 2h |
| 2.3 | Editor | Create: card preview; Edit: edit mode for owner | 2h |
| 2.4 | Editor | ART feel: typography, card styling | 1h |
| 3.1 | Collapse | Schema + collapse contract | 1h |
| 3.2 | Collapse | collapseQuestToBar server action | 2h |
| 3.3 | Collapse | Quest detail: "Share as BAR" UI | 2h |
| 3.4 | Collapse | Campaign→BAR (optional) | 1h |
| 3.5 | Collapse | BAR detail: provenance badges | 1h |

**Total**: ~14 hours
