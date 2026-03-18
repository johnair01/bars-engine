# Game Master Template Content Generation — Analysis

## Purpose

Spec when and where Game Master faces should generate content, what blocks templates from orienting players to campaigns, and what's needed to create content with templates.

---

## 1. Where in the Game Does Content Need to Be Created?

### Content Types and Touchpoints

| Content Type | Where Used | Model | Creation Path Today |
|--------------|------------|-------|---------------------|
| **Campaign (pre-auth)** | `/campaign?ref=X` | Adventure + Passages | File-based (wake_up, bruised-banana .twee) or DB (Adventure with campaignRef) |
| **Orientation quests** | Dashboard, post-signup | CustomBar + TwineStory | Seed scripts (seed-onboarding-thread, seed-cyoa-certification-quests) |
| **Certification quests** | Market, Adventures | CustomBar + TwineStory | Seed scripts |
| **Gameboard quests** | Campaign board | CustomBar + TwineStory | Admin wizard, grammatical generation |
| **Encounter scenes** | Future: emotional alchemy encounters | Adventure (9-passage) | Not yet — Orb spec defines structure |

### Critical Paths for Orientation

1. **Pre-signup campaign** (`/campaign`)  
   - Serves Adventure where `campaignRef` matches URL `ref` (or Instance.campaignRef).  
   - Bruised Banana: redirects to `/campaign/initiation` or `/campaign/twine`; twine page loads from **file** (`content/twine/onboarding/bruised-banana-onboarding-draft.twee`), not DB.  
   - Wake-up: can use DB Adventure with `slug: 'wake-up'` or fallback to file.

2. **Post-signup orientation**  
   - `assignOrientationThreads` assigns QuestThreads; each thread has quests (CustomBar) with `twineStoryId`.  
   - Quests point to **TwineStory**, not Adventure.  
   - Dashboard shows orientation threads; player plays quest → TwineStory.

3. **Campaign-specific orientation**  
   - Bruised Banana signup: `assignOrientationThreads` with lens → assigns `bruised-banana-orientation-*` thread with domain-biased starter quests.  
   - Those quests use TwineStory. No template-generated Adventure is wired here.

### Summary: Where GM Content Is Needed

| Touchpoint | Content Needed | GM Face Fit |
|------------|----------------|-------------|
| Campaign intro (pre-auth) | Adventure with campaignRef; Passages for CYOA | Shaman (grounding), Diplomat (bridging) |
| Orientation encounter | 9-passage encounter per player context | Shaman, Challenger, Diplomat, Regent, Architect |
| Campaign-specific onboarding | Adventure or TwineStory for "welcome to this campaign" | Diplomat (community), Regent (structure) |
| Gameboard quest generation | Quest draft + optional encounter wrapper | Architect (structure), Challenger (tension) |
| Emotional alchemy scene | 9-passage encounter (context→anomaly→choice→response→artifact) | All six faces modulate slots |

---

## 2. Blockers for Using Templates to Orient People to Campaigns

### Blocker A: No Bridge from Template → Campaign

**Problem**: `generateFromTemplate` creates an Adventure (DRAFT) with placeholder passages. To orient players:

1. Admin must manually edit every passage.
2. Admin must set `campaignRef` on the Adventure.
3. Admin must promote to ACTIVE.
4. Instance must have `campaignRef` pointing to that campaign (or URL must pass `ref`).

There is **no automated flow** from "generate from template for campaign X" to "campaign X is now live and orients players." No "Create orientation content for bruised-banana" button.

### Blocker B: Placeholders Only — No AI Generation

**Problem**: Template library produces structure with `[Edit: context_1]`-style placeholders. Filling them requires:

- Manual admin editing, or
- AI generation per slot (not implemented).

The Orb spec and backend agents (Architect, Shaman, etc.) exist but are **not wired** to `generateFromTemplate`. The scaling checklist says: "Optional future: generateFromTemplate can accept AI-generated content per slot."

### Blocker C: Campaign vs Quest Model Split

**Problem**: Two parallel systems:

- **Campaign page** uses **Adventure** (Passages, campaignRef).
- **Quest play** (orientation, certification, gameboard) uses **CustomBar.twineStoryId** → **TwineStory** (parsedJson, sourceText).

Templates generate **Adventure + Passages**. That fits campaigns. It does **not** directly create TwineStory for quest play. To use template output for orientation quests, we'd need:

- Conversion: Adventure → TwineStory, or
- Quest play to support Adventure (schema/API change), or
- Template to output both (complex).

### Blocker D: Bruised Banana Is File-Based

**Problem**: The main campaign flow (`/campaign/twine?ref=bruised-banana`) loads from a `.twee` file. It does not use the DB. So even if we generate a perfect Adventure from a template and set campaignRef, the current Bruised Banana flow would **ignore it** unless we change the campaign routing to prefer DB over file.

### Blocker E: No "Orientation Template" Concept

**Problem**: Templates are generic (e.g. encounter-9-passage). There is no template type or metadata for "orientation for campaign X" or "welcome to instance Y." No way to say "generate orientation content for bruised-banana using Diplomat + Shaman."

---

## 3. What Do We Need to Create Content with Templates?

### 3.1 Immediate (No AI)

| Need | Description |
|------|-------------|
| **GM placeholders** | Implement [template-library-gm-placeholders](.specify/specs/template-library-gm-placeholders/spec.md) — face-specific guidance per slot so admins know what to write. |
| **CampaignRef on generate** | `generateFromTemplate(templateId, { campaignRef?: string })` — set Adventure.campaignRef on create so admin doesn't have to remember. |
| **"Create for campaign" flow** | Admin: pick template + campaign ref → generate → redirect to edit. One less step. |
| **DB-first campaign routing** | Campaign page: when ref matches, prefer DB Adventure over file. Unblocks use of generated content. |

### 3.2 AI Generation (GM Faces)

| Need | Description |
|------|-------------|
| **generateFromTemplate(contentPerSlot?)** | Extend API: `generateFromTemplate(templateId, { contentPerSlot?: Record<string, string> })`. When provided, use instead of placeholders. |
| **Backend: encounter passage generator** | New endpoint or agent: given (templateId, nation, archetype, emotionalVector, gmFace?), return `{ [nodeId]: string }` for each slot. Orb spec defines the grammar. |
| **Slot → face mapping** | Use [template-library-gm-placeholders](.specify/specs/template-library-gm-placeholders/spec.md) mapping: context_*→Shaman, anomaly_*→Challenger, choice→Diplomat, response→Regent, artifact→Architect. Each face generates its slots. |
| **Context passing** | Campaign ref, instance theme, player nation/archetype (when known), emotional vector. Backend agents need this. |
| **Admin review gate** | Generated content is always DRAFT. Admin must review before promote. No auto-publish. |

### 3.3 Wiring to Orientation

| Need | Description |
|------|-------------|
| **Adventure → orientation** | Option A: QuestThread links to Adventure (schema: QuestThread.adventureId?). Option B: Convert Adventure to TwineStory on promote; attach to CustomBar. Option C: Extend quest play to support Adventure as source (bigger change). |
| **Campaign-specific orientation** | When creating "orientation for campaign X," auto-create or link to orientation thread for that campaign. assignOrientationThreads already has campaign logic (lens, bruised-banana); need content to exist first. |
| **Instance-scoped content** | Instance has wakeUpContent, showUpContent, storyBridgeCopy. Template could generate instance-specific "welcome" Adventure with campaignRef = instance.campaignRef. |

### 3.4 When/Where GM Faces Should Generate

| Face | When to Generate | Where |
|------|------------------|-------|
| **Shaman** | Context slots (grounding, threshold); emotional alchemy openings | Campaign intro, encounter context_1–3 |
| **Challenger** | Anomaly slots (tension, testing); sharpening moments | Encounter anomaly_1–3, gameboard quest stakes |
| **Diplomat** | Choice slots (options, bridging); community onboarding | Campaign sign-up CTA, orientation "choose your path" |
| **Regent** | Response slots (resolution, governance); authority moments | Encounter response, quest completion framing |
| **Architect** | Artifact slots (structure, deliverable); quest/campaign structure | Encounter artifact, campaign deck design |
| **Sage** | Meta, orchestration; when to invoke which face | Not slot-specific; coordinates multi-face generation |

**Rule**: One face per slot type. For a full 9-passage encounter, invoke Shaman (3), Challenger (3), Diplomat (1), Regent (1), Architect (1) — or a single "orchestrator" prompt that delegates by slot.

---

## 4. Recommended Phasing

### Phase 1: Unblock Manual Flow (No AI)

1. Implement template-library-gm-placeholders (face-specific placeholders).
2. Add `campaignRef` to `generateFromTemplate` options; set on Adventure.
3. Add "Generate for campaign" in admin templates UI (template + campaignRef selector).
4. Campaign page: prefer DB Adventure when ref matches and Adventure exists; fallback to file.

**Outcome**: Admin can generate from template for a campaign, get face-guided placeholders, edit, promote, and have the campaign page serve it. Manual but complete.

### Phase 2: AI Per Slot (GM Faces)

1. Backend: `generate_encounter_passages(template_id, nation, archetype, emotional_vector, campaign_ref?)` → `{ [nodeId]: string }`.
2. Slot→face mapping: each face generates its slots (or one orchestrator with face-specific sub-prompts).
3. Frontend: "Generate with AI" button on template → call backend → pass contentPerSlot to generateFromTemplate.
4. Output remains DRAFT; admin reviews before promote.

**Outcome**: One-click generation of filled encounter from template; admin edits and promotes.

### Phase 3: Orientation Wiring

1. Define "orientation template" type or tag (e.g. `template.key = 'orientation-welcome'`).
2. On promote: optionally create CustomBar + TwineStory from Adventure (conversion) and add to orientation thread. Or: extend QuestThread to reference Adventure.
3. Instance-scoped: "Generate orientation for instance X" uses instance.campaignRef, theme, wakeUpContent as context.

**Outcome**: Generated content can flow into orientation threads and orient players to specific campaigns.

---

## 5. Dependencies

- [template-library-draft-adventure](.specify/specs/template-library-draft-adventure/spec.md) — base template flow
- [template-library-gm-placeholders](.specify/specs/template-library-gm-placeholders/spec.md) — slot→face mapping
- [orb_triadic_twee_generator_spec](.specify/fixtures/conclave-docs/orb_triadic_twee_generator_spec.md) — 9-passage grammar
- Backend agents: [backend/app/agents/](backend/app/agents/) — Architect, Shaman, Challenger, etc.
- [onboarding-quest-generation-unblock](.specify/specs/onboarding-quest-generation-unblock/spec.md) — related blockers for quest generation

---

## 6. Open Questions

1. **Adventure vs TwineStory for quest play**: Should we unify on Adventure for both campaign and quest play, or keep both and add conversion?
2. **Bruised Banana migration**: When do we switch from file-based to DB-based for the main BB flow?
3. **Multi-face orchestration**: One API call that invokes 5 faces (one per slot type), or one orchestrator that internally delegates?
4. **Token budget**: Generating 9 passages per encounter — cost and latency for real-time vs batch?
