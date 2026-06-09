# Tap the Vein — Feature Specification
**Status:** Draft → Active
**Location:** Zo Site (bars-engine adjacent, independent deploy)
**Owner:** Architect
**Created:** 2026-04-27
**Last Updated:** 2026-04-27

---
See also: [[KEYTERM-TAP-THE-VEIN.md]]


- [[KEYTERM-TAP-THE-VEIN]]

## 0. Feature Name

**Tap the Vein** — Daily 750-Word Shadow Practice

---

## 1. Developer-Facing Summary

A Zo Site application that provides a daily morning writing ritual (750 words minimum), stores entries in a persistent database, runs post-session analytics to detect emotional alchemy signals, BAR-like phrases, and charge strength, then surfaces opinionated recaps at daily/weekly/monthly/quarterly/yearly cadences with actionable next steps tied to the 321 shadow process and inquiry practice.

This is a dual-track tool: sacred daily practice (private) and text-mining engine for BAR content (shared). The mining is silent — it does not interrupt the writing. Every session feeds the 321 as the refinishing step; the system does not decide whether someone "needs" a 321 — it always offers it.

---

## 2. Why This Exists

The 750words.com ritual is a known good. But it has no emotional alchemy integration, no BAR extraction, no opinionated advisory system, and no path to the 321 process. This builds the layer that makes the daily write a *content pipeline* without making it feel like one.

The daily write is the mine. Analytics are the refinement. The 321 is where the refined material gets carried somewhere.

Tap the Vein is Wake Up work — seeing more clearly what was tapped. Clean Up (vibeulon minting) is a separate practice; Tap the Vein does not generate vibeulons directly.

---

## 3. Ontological Role

- **Daily Vein Tap** = the ritual input (750-word minimum descent into charged material)
- **Tap Entry** = a session record (text + metadata + timestamp + analytics)
- **Vein Analytics** = post-session extraction (EA channel, BAR phrases, charge strength, pattern signals)
- **Vein Recap** = a time-bounded view of what was mined (daily/weekly/monthly/quarterly/yearly)
- **Charge Signal** = the opinionated output naming what was hit and offering the 321 as the next step
- **Quest Pitch** = weekly emergent recommendation for quests/campaigns derived from charge pattern clusters

---

## 4. Non-Negotiable Rules

1. **The write is sacred.** No analytics surface during the session. The writer dumps first; analysis happens after submit.
2. **Analytics are silent until asked.** Recaps are available on demand. Daily auto-summary is short (3-5 sentences max).
3. **Opinionated, not prescriptive.** The system names what it sees and recommends the 321 as a responsive action. The player decides.
4. **321 is the refinishing step for ALL Tap the Vein sessions.** Every entry surfaces a "Tap the Vein → Begin 321" CTA. The system does not decide whether someone needs it — it makes the path always available. When multiple charges are detected, the user selects which one to carry into the 321.
5. **Auth is schema-level from day one.** User IDs exist in the schema. Auth UI is Phase 2.
6. **All text stays in the user's control.** Raw entries are private. Extracted BAR phrases and analytics are shareable at user option.
7. **Analytics improve with context.** EA channel detection and BAR phrase extraction are seeded from the Shaman chapter's WAVE-Spiral and canonical EA framework — not inferred from generic sentiment.
8. **Mobile-first.** The write surface must work on a phone in portrait, in bed, before getting up. Desktop is secondary.

---

## 5. The Write Surface

### Visual Aesthetic
- Dark, warm, intentional — bars-engine aesthetic
- Muted earth tones with fire-channel accent color for active states
- No branding on the write surface — pure focus
- Mobile-optimized: keyboard does not obscure text area, thumb-friendly submit

### Core Write UI (Mobile-First)
- Full-screen textarea in portrait orientation on session start
- Minimal chrome — no toolbar, no formatting, no distraction
- Word counter visible (750 minimum, real-time, positioned above keyboard on mobile)
- Optional seed question prompt (user can ignore or answer)
- Session timer (optional — writer chooses)
- Submit button thumb-accessible at bottom of viewport
- Session survives app backgrounding (state persisted to sessionStorage, synced to DB on submit)

### Post-Submit Flow
1. Submit button activates when word count ≥ 750
2. Entry saved to DB with timestamp, word count, session duration
3. Analytics engine runs (async, < 5 seconds)
4. Recap card slides in: auto-summary + EA channel + BAR phrase count + charge signal
5. "Explore more" expands full analytics view
6. "Tap the Vein → Begin 321" CTA always present — pre-seeded with dominant charge; if multiple charges detected, show selection picker

---

## 6. Analytics Engine

### Layer A — Surface Signal Map (Rule-Based, Phase 1-2)

Rule-based keyword matching against canonical EA channels. Fast, deterministic, auditable.

**Metal/Fear (Dissatisfied):**
loss, sharp, cut, grief, alone, precious, break, irreversible, brittle, shatter, falling, abandoned, exposed, vulnerable, trapped, caught, slipped, gone, lost, severed

**Water/Sadness (Dissatisfied):**
heavy, stuck, slow, empty, drain, long, tired, give up, numb, hollow, weight, burden, sinking, dragging, deepening, low, heavy-hearted, grief, hollowed

**Wood/Joy (Dissatisfied — blocked/constricted joy):**
expand, see, new, fresh, want, desire, pull toward, interest, reach, attract, yearn, craving, hungry, ambition, restlessness, jealous, envious, competing, not-enough

**Fire/Anger (Dissatisfied):**
hot, push, burn, fight, unfair, right, mine, control, flame, blaze, heat, heat,烈, rage, fury, irritat, frustrat, clipped, tight jaw, clenched

**Earth/Neutrality (Dissatisfied):**
steady, neutral, wait, still, hold, ground, practical, settle, flat, gray, dead, blank, numbed, disconnected, checked out, going through motions

**Satisfied signals (counter-balance for confidence scoring):**
metal: peaceful, clear, safe, held
water: at ease, allowing, flowing, open
wood: purposeful, generative, growing, alive
fire: warm, connected, passionate, alive
earth: grounded, centered, rested, whole

### Layer B — Deep Signal Map (EA Translator, Phase 2+)

| Component | Source | Status |
|---|---|---|
| `ea-vocabulary.md` | Feeling word → channel/altitude mapping | Spec'd, not yet written |
| `ea-move-matrix.md` | Valid channel pair moves with rationale | Spec'd, not yet written |
| `ea-idiom-guide.md` | Metaphor/somatic → channel mapping | Spec'd, not yet written |
| `ea-test-corpus.md` | 50 test cases for validation | Spec'd, not yet written |

Layer B replaces Layer A when available. `TapAnalytics.analysisVersion` tracks which layer scored each entry.

### BAR Phrase Extraction Rules

**Rule 1 — Sentence boundary detection**
- Extract spans of 1–3 sentences
- Maximum 150 words per phrase
- Reject spans containing quote marks (not original voice)

**Rule 2 — Game-world-ready content filter**
A phrase passes if it contains at least one signal from two or more of:

| Signal Type | Examples |
|---|---|
| **Sensory anchor** | texture, sound, smell, color, temperature, weight, taste, sound |
| **World detail** | place names, objects, architecture, geography, material, texture |
| **Character behavior** | actions a person takes (not emotions they feel), gesture, movement |
| **State change** | before/after, shift, transformation, arrival, departure, emergence |

**Rule 3 — Meta-commentary exclusion**
Reject any span containing:
- "I think", "I feel", "I believe", "In my opinion", "I realized", "I noticed"
- First-person internal states ("I was scared", "I felt like", "I was worried")
- Parenthetical self-commentary ("which was weird", "(strange)", "— funny thing")

**Rule 4 — Game-world-ready affirmative**
Pass only spans that describe an external observation or a concrete behavioral pattern:
- ✅ "The corridor smelled like copper and cold stone."
- ✅ "She kept adjusting the strap on her pack, never looking up."
- ✅ "The village had been abandoned so long the doors had warped shut."
- ❌ "I think the corridor is trying to tell me something." (meta)
- ❌ "I felt like I was being watched." (internal state)

**Rule 5 — Rank by density**
```
score = (sensory_signals × 1.5) + (world_details × 1.5) + (character_behaviors × 1.0) + (state_changes × 1.0)
```
Return top 5 phrases. If fewer than 3 pass all rules: "Fewer BAR phrases detected this session — the writing was internally oriented today."

**Rule 6 — User approval gate**
Each surfaced phrase: [This is a BAR] / [Save to drafts] / [Dismiss]
BAR-marked phrases queue in `TapBarExport` for Phase 2 bars-engine pipeline.

### What Gets Analyzed

| Signal | Method | Output |
|---|---|---|
| EA Channel | Layer A (rule-based) or Layer B (EA Translator) | Dominant channel: Metal/Fear, Water/Sadness, Wood/Joy, Fire/Anger, Earth/Neutrality |
| Charge Strength | word_count × emotional_keyword_density × pattern_signal | mild / moderate / strong / intense |
| Dissatisfaction Pattern | Pattern keyword detection | martyrdom-pattern, threat-pattern, collapse-pattern, control-pattern |
| BAR-like Phrases | Rules 1-6 above | 0–5 phrases, user-approved |
| Theme Tags | Keyword clustering (simple) | user-defined + auto-suggested |
| Quest Pitch Signal | Pattern cluster at weekly level | Quest/campaign recommendations |

---

## 7. Recap System

### Daily Recap
**Auto-summary** (3-5 sentences, generated after each session):
- Word count + session time
- Dominant EA channel
- Charge strength
- BAR phrase count
- Charge signal (one-line)

**"Explore more" deep dive:**
- Full EA channel breakdown
- All BAR phrases with "mark as BAR" option
- Dissatisfaction patterns detected
- Theme tags
- "Tap the Vein → Begin 321" CTA — always present, pre-seeded with dominant charge; if multiple charges detected, show picker: "Which charge do you want to carry into the 321?"

### Weekly Recap
- 7-day writing streak
- EA channel distribution across the week
- Dominant patterns
- BAR phrases collected this week
- Emerging themes
- Comparison to prior week
- **Quest/Campaign pitches** — charge pattern clusters surface actionable quest hooks:
  - "Threat-pattern has been dominant 3 of the last 5 sessions. Consider a quest where the player navigates a false enemy."
  - "Fire/Anger + Wood/Restless co-occurred twice this week. Consider a campaign about a resource war."
  - "The collapse-pattern is appearing in relationship contexts. Quest hook: a community that has lost its center."
- "This week's charge signal" + recommended 321 focus

### Monthly Recap
- Writing consistency score (days written / days in month)
- EA arc across the month
- Pattern cluster analysis
- BAR phrases: total extracted, total marked-as-BAR
- Quarter-to-date summary if applicable
- Calrunia material flagged
- "This month's charge thesis" + growth observations

### Quarterly Recap
- Season-level EA arc visualization
- Dominant dissatisfied patterns over the quarter
- BARs generated from Tap the Vein content
- Quest/campaign themes that emerged from charge patterns
- "Quarter thesis" — what the shadow work was actually about
- Recommended inquiry focus for next quarter

### Yearly Recap
- Full arc, lifetime stats
- EA channel evolution over the year
- Pattern maturity (which transformed, which persist)
- Total BARs generated
- Year-level "what you mined" narrative
- Recommended annual review ritual

---

## 8. 321 Integration

### Invariant
321 is the refinishing step for ALL Tap the Vein sessions. This is not conditional. The system always offers the 321; the player always chooses.

### Charge Pre-Seeding
When multiple charges are detected (e.g., Metal/Fear strong + Fire/Anger moderate), present a selection:

**"Multiple charges detected. Which do you want to carry into the 321?"**
- [Metal/Fear — strong] (threat-pattern active)
- [Fire/Anger — moderate] (control-pattern active)
- [Dismiss — do 321 without pre-seed]

Single charge: pre-seed automatically with option to change.

Clicking "Begin 321" opens the 321 page (`/shadow/321`) with:
- The selected EA channel pre-selected
- The dissatisfaction pattern pre-named
- The strongest BAR phrase pre-loaded as the opening charge
- `tapEntryId` passed for provenance

### URL Contract (Cross-Service Handoff)
```
/shadow/321?tapEntryId={uuid}&eaChannel={channel}&chargeStrength={strength}&pattern={pattern}&barPhraseSeed={encodedPhrase}
```

Handoff signed with HMAC-SHA256 using a user-specific `tap_secret_hash` stored in bars-engine profile. The 321 page verifies the signature before accepting pre-seed data.

### Privacy
Raw Tap the Vein text is NOT transmitted to the 321 process. The 321 receives only: charge descriptor (channel + pattern + strength) + BAR phrase seed (if user approved).

---

## 9. Data Model

### Enum Alignment
EA channels and charge strengths use the same enum values as bars-engine's `Metadata321` model. Shared enum library is the source of truth — imported by both Tap the Vein and bars-engine.

### Core Entities

**User**
```
id: uuid
tap_secret_hash: string (HMAC key for 321 handoff signing)
created_at: timestamp
```

**TapEntry**
```
id: uuid
user_id: uuid | null (Phase 1: null = single user; Phase 2: required)
text: text (raw 750-word write)
word_count: int
session_duration_seconds: int
created_at: timestamp (date of the tap — used for streak calculation)
```

**TapAnalytics**
```
id: uuid
entry_id: uuid (FK to TapEntry)
ea_channel: enum (metal, water, wood, fire, earth, none)
charge_strength: enum (none, mild, moderate, strong, intense)
dissatisfaction_pattern: enum | null (martyrdom, threat, collapse, control, null)
bar_phrases: jsonb (array of {text, is_bar: bool})
theme_tags: jsonb (array of string)
analysis_version: string (semver for signal map: "1.0.0" = Layer A, "2.0.0" = Layer B)
```

**TapBarExport** (Phase 2 pipeline queue)
```
id: uuid
entry_id: uuid (FK to TapEntry)
phrase_text: text
ea_channel: enum
charge_strength: enum
export_status: enum (queued, exported, dismissed)
exported_to_bars_engine_at: timestamp | null
created_at: timestamp
```

**TapRecap**
```
id: uuid
entry_id: uuid (FK to TapEntry)
recap_type: enum (daily, weekly, monthly, quarterly, yearly)
auto_summary: text
full_analysis: jsonb
generated_at: timestamp
```

### Recap Join
- Daily recap: 1:1 with TapEntry
- Weekly/Monthly/Quarterly/Yearly: aggregate queries over TapEntry + TapAnalytics

---

## 10. Technical Architecture — Zo Site

### Stack
- **Runtime:** Zo Site (workspace project, not zo.space route)
- **Frontend:** React + TypeScript (bars-engine aesthetic, mobile-first)
- **Backend:** Hono API routes (built into Zo Site)
- **Database:** Prisma + SQLite (Phase 1), same schema discipline as bars-engine
- **Analytics:** Layer A rule-based (Phase 1), Layer B LLM-powered (Phase 2)

### Route Structure
```
/                     → write surface (main entry, mobile-first)
/api/entry            → POST: submit new entry, kick off analytics
/api/entry/:id        → GET: retrieve a single entry
/api/analytics/:entryId → GET: retrieve analytics for an entry
/api/recap/:type/:dateRange → GET: daily | weekly | monthly | quarterly | yearly recap
/api/bar-phrases/:entryId → POST: mark phrase as BAR → queues in TapBarExport
```

### Bars-Engine Integration Architecture (Now, Not Later)

**Surface A — BAR Export Pipeline**
`TapBarExport` table exists in Phase 1. `export_status` field tracks queued/exported/dismissed. Phase 2 flips the feature flag and makes the actual API call to bars-engine. No schema changes required at that point.

**Surface B — HMAC-Signed 321 Handoff**
User has a `tap_secret_hash` in their profile. Tap the Vein signs the 321 deep-link URL with HMAC-SHA256. The 321 page verifies the signature. This prevents arbitrary URL injection. When both services share the same Zo account auth, the session token may suffice — but the HMAC fallback is the safe design.

**Surface C — Schema Lineage**
Tap the Vein uses the same `ea_channel` and `charge_strength` enum values as bars-engine's `Metadata321`. Shared enum library prevents a translation layer at Phase 2. Coordinate with bars-engine before finalizing Phase 1 schema.

---

## 11. Design System — Three-Channel Encoding

Per bars-engine UI Covenant:
- **Element (EA channel) = background color wash** on recap cards
  - Metal/Fear: slate-gray wash
  - Water/Sadness: deep blue wash
  - Wood/Joy: warm green wash
  - Fire/Anger: amber-red wash
  - Earth/Neutrality: warm brown wash
- **Altitude (charge strength) = border intensity**
  - None/mild: no border
  - Moderate: thin border
  - Strong: medium border + subtle glow
  - Intense: thick border + strong glow + "Tap the Vein → Begin 321" CTA prominent
- **Stage (session state) = surface density**
  - Writing: clean, minimal
  - Submitting: loading shimmer
  - Recap: card surfaces, denser information

---

## 12. GM Face Routing

| Face | Role in Tap the Vein |
|---|---|
| **Shaman** 🌍 | Felt-sense anchor. Names the charge. Authored the canonical EA signal map. Owns the "what does your body say" quality of the write surface. Validates any signal map changes against felt-reality. |
| **Architect** 🧠 | System design. Schema, routes, analytics architecture. Owns the spec and build. Ensures bars-engine integration surfaces are designed now, not retrofitted. |
| **Diplomat** 🌬️ | Bridge between private practice and shared content. Names what can leave the ritual space and what must stay. Designs the multi-charge picker UX. |
| **Regent** 🏛 | Long-game judgment. Naming what serves the yearly arc. Rejecting feature creep. Guards the "321 always offered" invariant from erosion. |
| **Sage** 🧙 | Precedent. "What does the practice of shadow work teach us about how this should feel?" Grounding the design in real descent practice. |
| **Challenger** ⚔️ | Names what's being avoided. Calls out when analytics are doing too much interpretation. Keeps the practice from becoming a performance. Flags if BAR extraction rules are being applied too loosely. |

---

## 13. Phase 1 Scope (This Build)

### In Scope
- [ ] Single-user write surface (750-word minimum, word counter, timer optional) — **mobile-first**
- [ ] Entry persistence (Prisma + SQLite)
- [ ] Post-session analytics — Layer A signal map, charge strength, dissatisfaction patterns, BAR phrase extraction (Rules 1-6)
- [ ] Daily recap with auto-summary + "Explore more" deep dive
- [ ] "Tap the Vein → Begin 321" CTA — always present, multi-charge picker when multiple charges detected
- [ ] Weekly recap with EA distribution + quest/campaign pitches from charge pattern clusters
- [ ] HMAC-signed deep-link to `/shadow/321` with charge pre-seeding
- [ ] bars-engine aesthetic (dark, warm, earth tones, fire-channel accent)
- [ ] Canonical 321 reference docs linked in-app
- [ ] `TapBarExport` table present (Phase 2 pipeline queue, not yet wired)
- [ ] `tap_secret_hash` on user profile (for HMAC handoff signing)
- [ ] Schema-level enum alignment with bars-engine `Metadata321`

### Out of Scope (Phase 2+)
- [ ] Multi-user auth UI
- [ ] Monthly/Quarterly/Yearly recaps
- [ ] Layer B EA Translator integration (LLM-powered)
- [ ] Vibeulon/Fuel System routing (Tap the Vein is Wake Up work, not Clean Up)
- [ ] Bars-engine BAR export pipeline (TapBarExport wired)
- [ ] Theme tag customization
- [ ] Calrunia material flagging
- [ ] Quest/campaign pitch UI beyond weekly recap

---

## 14. Non-Goals

- **This is NOT a journaling app.** It is a shadow practice with a mining layer.
- **Analytics do not run during the write.** The practice stays sacred.
- **The system does not tell you what to feel.** It names what it sees and recommends the 321. You decide.
- **No social features in Phase 1.** Shared content is a Phase 2 concern.
- **Tap the Vein does not mint vibeulons.** Vibeulons are minted from Clean Up work. Tap the Vein is Wake Up work — seeing more clearly. The two practices are distinct.

---

## 15. Assumptions

1. User is the only writer in Phase 1 (Wendell)
2. Zo Site deployment is the right choice over zo.space route (confirmed with user)
3. Prisma + SQLite is appropriate for single-user Phase 1
4. Rule-based analytics (Layer A) are sufficient for Phase 1
5. The Shaman's canonical EA signal map is the authoritative source for channel detection
6. Deep-link to `/shadow/321` works across zo.space ↔ Zo Site (same Zo account, HMAC-signed)
7. Shared enum library can be coordinated with bars-engine before Phase 1 schema freeze
8. Mobile-first is the correct priority for the write surface

---

## 16. Next Steps

1. **Coordinate enum library with bars-engine** — confirm `ea_channel` and `charge_strength` enum values match before schema freeze
2. **Create Zo Site project** — `tap-the-vein`
3. **Set up Prisma schema** — User, TapEntry, TapAnalytics, TapRecap, TapBarExport with enum alignment
4. **Build write surface** — mobile-first, dark UI, word counter, session persistence, thumb-friendly submit
5. **Implement Layer A analytics engine** — signal map, phrase extraction (Rules 1-6), charge strength, dissatisfaction patterns
6. **Build daily recap** — auto-summary + deep dive + 321 CTA (always present) + multi-charge picker
7. **Build weekly recap** — EA distribution + quest/campaign pitch engine from charge pattern clusters
8. **Wire HMAC-signed 321 deep-link** — charge pre-seeding with signature verification
9. **Aesthetic pass** — bars-engine colors, three-channel encoding, mobile responsive
10. **Ship Phase 1** — Zo Site published, test with live morning write

---

## A. Canonical 321 Reference

Location: `docs/canonical-321.md`

The 321 is a 3-2-1 shadow descent practice — moving a belief or emotional charge through three perspectives: third person → second person → first person. The core invariant is the perspective sequence. If it collapses, the practice becomes journaling rather than psychotechnology.

---

## B. EA Translator Research Alignment

The EA Translator Research spec (`docs/plans/EA_TRANSLATOR_RESEARCH.md`) is Phase 0 work that defines Layer B. Its outputs (`ea-vocabulary.md`, `ea-move-matrix.md`, `ea-idiom-guide.md`, `ea-test-corpus.md`) are prerequisites for Layer B. Phase 1 uses Layer A (rule-based signal map) from this spec. Layer B is Phase 2.

---

## C. bars-engine Three-Channel Encoding Reference

Per bars-engine UI Covenant: element = color, altitude = border, stage = density.
Full reference: `bars-engine/UI_COVENANT.md`