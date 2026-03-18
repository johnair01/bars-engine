# BAR Ontology Analysis

**Purpose**: Audit existing BARs, formalize the two-sided-card model, and establish the share-as-BAR axiom before further implementation.

---

## 1. Existing BARs Audit

### Schema Reality

- **CustomBar** has `title` (required) and `description` (required). Both are stored.
- **Recent change**: Create flow no longer asks for title; we derive it from first line of content.
- **Display change**: Cards and detail now show `description` as primary; `title` is hidden from user-facing UI.

### What Could Break

| Scenario | Risk | Mitigation |
|----------|------|------------|
| **Old BARs with crafted titles** | Creator wrote a distinct title (e.g. "Morning Reflection") and different body. We now show only body. Title is "lost" in UI. | **Low** — Content is primary per design. Title remains in DB for search, merge preview, admin. |
| **Old BARs with minimal description** | Very short `description` (e.g. 3 chars). Cards look sparse. | **Low** — Same as before; line-clamp handles it. |
| **Invitation BARs** | `Invite.invitationBarId` links to CustomBar. These are often system-created with specific title/description. | **Check** — Forge flow, campaign seeds. Ensure collapse-to-BAR still produces usable content. |
| **QuestProposal.barId** | BAR used as quest seed. Quest creation reads BAR title/description. | **Check** — Quest flow may use `bar.title` for proposal title. If we derive, ensure derivation is consistent. |
| **Campaign kernelBar** | Instance has `kernelBarId` → CustomBar. Campaign landing may display it. | **Check** — Kernel BAR display. |
| **Starter quests** | `Invite.starterQuestId` → CustomBar (type may be quest, not bar). | **N/A** — Different type. |

### Audit Queries (run against dev DB)

```sql
-- BARs with title != first line of description (might have "lost" meaning)
SELECT id, title, LEFT(description, 50) as desc_preview
FROM custom_bars
WHERE type = 'bar' AND status = 'active'
  AND TRIM(SPLIT_PART(description, E'\n', 1)) IS DISTINCT FROM title;

-- Count of type='bar' BARs
SELECT COUNT(*) FROM custom_bars WHERE type = 'bar';

-- Invitation BARs
SELECT cb.id, cb.title, cb.description, i.id as invite_id
FROM custom_bars cb
JOIN invites i ON i.invitation_bar_id = cb.id;
```

### Recommendation

- **No migration needed** for existing data. Title stays in schema.
- **Display**: Continue showing `description` as primary. Use `title` only for: admin lists, merge preview, search, any place that needs a short label.
- **Create flow**: Keep deriving title from first line. Document in spec.

---

## 2. BARs Are CARDS with Two Sides

### Ontology

A BAR is a **physical card** in spirit: something you hold, flip, and share.

| Side | Purpose | Content |
|------|---------|---------|
| **Face (obverse)** | Hook. What you see when it arrives or in a list. Draws you in. | Image (if present), first line or essence, sender (when shared) |
| **Back (reverse)** | Full content. The flip. | Full text, intent tags, provenance, grow actions |

### Implications

- **List view** = Face. Thumbnail + teaser. Not the full scrap.
- **Detail view** = Back. Full content. Or: Face on top, flip to Back.
- **Share** = You send the card. Recipient sees Face first (TalismanReveal), then Back.
- **Editor** = Editing the card. Both sides matter. Face might be editable (e.g. "hook" or first line) vs body.

### UX Gaps

- **No flip interaction** — Detail is flat. Consider: card flip animation, Face/Back toggle.
- **Face vs Back in editor** — Currently one field. For "ART" feel: Face could be image + optional one-liner; Back = full content.
- **List cards** — Show Face. Image primary when present; else content preview.

---

## 3. Share-as-BAR Axiom

> **When you share a Quest or Campaign with someone outside the game, you can ONLY share it as a BAR.**

### Rule

Every game object that can be shared externally must be **collapsible into a BAR**. The BAR is the portable artifact that draws people into creating their own game content.

| Source Object | Collapse To BAR | Notes |
|---------------|-----------------|-------|
| **Quest** | BAR with quest essence (title, prompt, domain) | "Share this quest" → create BAR, send. Recipient gets talisman; can "Grow as Quest" to claim. |
| **Campaign** | BAR with campaign hook (name, goal, domain) | "Share this campaign" → BAR. Recipient lands on campaign landing or creates their own. |
| **Daemon** | BAR with daemon seed | Stub. |
| **Instance** | BAR (invitation BAR pattern) | Already: Invite.invitationBarId. |
| **Thread** | BAR with thread essence | "Share this thread" → BAR. |

### Implementation Status

| Flow | Exists? | As BAR? |
|------|---------|---------|
| Share BAR | ✅ | N/A (is BAR) |
| Share Quest | ❓ | Need "Share as BAR" from quest detail |
| Share Campaign | ❓ | Need "Share as BAR" from campaign |
| Invitation (Invite) | ✅ | invitationBarId, forge flow |

### Collapse Contract

When collapsing X → BAR:

- **Face**: Short hook (1 line, image, or both). Must fit on card face.
- **Back**: Full content. For Quest: prompt + domain. For Campaign: goal + domain.
- **Provenance**: `sourceBarId` or equivalent. When BAR grows to Quest, we link back. When Quest collapses to BAR, we store `collapsedFromQuestId` or similar.

### Schema Consideration

- **CustomBar** already has `sourceBarId` (quest from BAR).
- May need: `collapsedFromQuestId`, `collapsedFromInstanceId`, `collapsedFromThreadId` — or a generic `sourceObjectType` + `sourceObjectId` JSON for provenance.

---

## 4. Editor Sophistication — BARs as ART

### Current State

- Single textarea. Monospace. "What's on it."
- Photo add on detail (separate step).
- Minimal formatting.

### Target: "Hit Like ART"

- **Visual first** — Image can be the primary content. Text optional.
- **Two-sided editing** — Face (hook) vs Back (body). Or: one surface that renders as card.
- **Rich scrap** — Handwriting feel? Stickers? Borders? (Scope for later.)
- **Card preview** — While editing, see how it will look as a card.

### Phased Approach

| Phase | Scope |
|-------|-------|
| **Now** | Single content + optional photo. Card preview on create (optional). |
| **Next** | Face/Back split. Face = image OR first line. Back = full content. |
| **Later** | Styling, handwriting fonts, "ART" tools. |

---

## 5. Summary: Next Steps

1. **Run audit queries** on dev DB. Document counts and any invitation/kernel BARs.
2. **Spec update**: Add "Two-Sided Card" and "Share-as-BAR Axiom" to bars-ui-overhaul spec.
3. **Editor**: Plan Face/Back split. Consider card preview in create flow.
4. **Collapse flows**: Add "Share as BAR" to Quest detail and Campaign. Define collapse contract per object type.
