# SPEC: Myths Read — bars-engine quiz (Codex-ready)

## Metadata

| Field | Value |
|-------|-------|
| **Change type** | New feature — lead-gen quiz + book router |
| **Trigger** | Ch0 Myths section restructure: chapter carries a pointer, quiz carries the diagnosis |
| **Status** | DRAFT — needs WB sign-off on open calls (§9) |
| **Created** | 2026-07-01 |
| **Companion spec** | `SPEC_MYTHS_QUIZ_CLAUDE_DESIGN_2026-07-01.md` (visual/UI) |

---

## 1. Purpose & funnel role

The **Myths Read** is a short diagnostic on bars-engine that a reader hits from Chapter 0 (and from cold/social entry points). It does four jobs at once:

1. **Un-muddies the chapter.** The book no longer enumerates ten myths and asks the reader to self-sort. The game sorts them.
2. **Personalizes the diagnosis.** Reader gets back their top 2–3 myths, each with the exact place in the book that takes it apart.
3. **Drives the funnel.** Result routes to the Allyship Deck (entry product, first yes) and the book (deeper yes).
4. **Captures the lead.** Email save-point converts an anonymous reader into a known one.

Design ethic — **the quiz is the counter-con.** No Buzzfeed optics, no flattering "which ally are you." Items ask about real behavior and felt experience, not aspirational identity. Self-report is direct measurement, not a proxy. A quiz that games the reader would betray the book's whole thesis.

---

## 2. Taxonomy

### The 10 Myths (surface — shown to reader)

A myth is a **false claim about what allyship is**, not an identity. The reader spots the claim; they don't become a character.

| ID | Myth (the claim) | One-line diagnosis |
|----|------------------|--------------------|
| M1 | "Allyship means being good." | A private trial where the other person becomes evidence. |
| M2 | "Allyship means saying the right words." | Fluency that signals safety without proving it. |
| M3 | "Allyship means helping the less powerful." | Turns a person into a project. That's charity. |
| M4 | "Allyship means following the right people." | Discernment surrendered to someone's authority. |
| M5 | "Allyship means sacrificing yourself." | Self-abandonment that sends an invoice. |
| M6 | "Allyship means never causing harm." | Innocence protected by never moving. |
| M7 | "Allyship means fixing the problem." | Wanting it more than they do; help curdles to pressure. |
| M8 | "Allyship means having the right framework." | The map becomes the destination. |
| M9 | "Allyship means being seen doing it." | Optics on someone else's ledger. |
| M10 | "Allyship means paying down what you owe." | An inherited, unpayable debt. |

### The 6 Root Beliefs (deep — NOT shown in quiz result)

Per `SPEC_6_SABOTAGING_BELIEFS.md`, each myth is a bargain to disprove one canonical belief. **Kept internal.** The quiz result stays light (myth + destination); the belief is the reader's own discovery inside the book chapters. Stored on the record for engine use and later personalization, never surfaced on the result screen.

| Belief | Myths that bargain against it |
|--------|-------------------------------|
| Not good enough | M1, M8 |
| Not ready | M2 |
| Insignificant | M3 |
| Not capable | M4, M7 |
| Not worthy | M5, M10 |
| Don't belong | M6, M9 |

---

## 3. Quiz items

**Scale:** Never (0) · Rarely (1) · Sometimes (2) · Often (3) · Almost always (4).
**Copy voice:** first-person, present-tense, behavioral/felt, honest. No aspirational framing.

| # | Item | Primary myth (w=1.0) | Cross-load (w=0.5) |
|---|------|---------------------|--------------------|
| Q1 | "When I do something for a cause, some part of me is quietly checking whether it makes me a good person." | M1 | — |
| Q2 | "I relax in a room once I've heard people use the right language — I know I'm safe there." | M2 | — |
| Q3 | "I feel most useful when I'm helping someone who clearly can't help themselves." | M3 | — |
| Q4 | "When someone with more standing or lived experience takes a position, I go along with it even when something in me disagrees." | M4 | — |
| Q5 | "I gauge whether I did enough by how drained I feel afterward." | M5 | — |
| Q6 | "I'd rather stay quiet than risk saying the wrong thing and being seen as harmful." | M6 | — |
| Q7 | "When someone I care about is struggling, I keep offering my solution even after they've stopped asking for it." | M7 | — |
| Q8 | "Before I act, I reach for a framework or an analysis so I feel like I'm standing on solid ground." | M8 | — |
| Q9 | "I understand my own patterns far better than I actually change them." | M8 | — |
| Q10 | "It matters to me that the right people notice I showed up." | M9 | M1 |
| Q11 | "I carry a sense that I owe something for advantages I didn't earn, and that I have to keep paying it down." | M10 | — |
| Q12 | "It's hard for me to let someone struggle when I'm sure I know what would help." | M7 | — |

M8 (Framework) and M7 (Fixer) carry two items each — they're the ideal reader's most probable and most consequential myths, and deserve the extra resolution.

---

## 4. Scoring

```
For each myth m:
  raw[m]  = Σ (item_value × weight) for all items loading m
  max[m]  = 4 × (Σ weights loading m)
  pct[m]  = raw[m] / max[m]          # 0.0–1.0, comparable across myths

rank myths by pct desc → surface TOP 3
```

**Tie-breaks (in order):**
1. Higher single-item peak among the tied myths' items.
2. Canonical priority order (adjustable — see §9): M8, M7, M1, M5, M6, M4, M2, M3, M9, M10.

**Floor rule:** if the #3 myth is below `pct = 0.40`, show only the myths at/above the floor (min 1). Don't hand someone a "myth" they barely register — it reads as noise and undercuts the counter-con ethic.

---

## 5. Result screen (content contract)

Per surfaced myth, render:

- **The claim** (from §2 table).
- **The diagnosis** (one line, from §2).
- **Where we solve it** — book destination (§6).
- **One move now** — a micro-action / reframe (§6), optionally a pre-seeded BAR draft (§7).

Below the myths:
- **Primary CTA → Allyship Deck** ("start playing today"). First yes.
- **Secondary CTA → the book** ("the manual"). Deeper yes. For backers: "it's yours — ships Aug 1."
- **Save your read** — email capture (§8).

Copy stays in-voice, low-pressure, no urgency-manufacturing beyond the real launch dates.

---

## 6. Result routing table

| Myth | Where we solve it (mechanism → chapter) | One move now |
|------|------------------------------------------|--------------|
| M1 Being good | The redefinition + the counter-con (Token/Ticket) — **Ch0** | Name the verdict you're trying to win. |
| M2 Right words | The Shaman: the felt record under the language — **Ch2** | Name one thing you feel that you have no vocabulary for. |
| M3 Less powerful | The redefinition (charity vs. allyship) — **Ch0** | Name where the mutuality is. |
| M4 Right people | The Challenger: keep your discernment or you're staff — **Ch3** | Name one thing you disagreed with and swallowed. |
| M5 Sacrifice | The Token System + self-allyship — **Ch0** | Name what actually refills you. |
| M6 Never harm | Repair + the game frame — **Ch6, Diplomat: the Repairer channel** | Name a rupture you've been avoiding repairing. |
| M7 Fixing | The Gates + Emotional Alchemy (the wound-bridge) — **Ch0 Myths + face Gate walks** | Name the charge under your urge to fix. |
| M8 Framework | The Sage: seeing that replaces acting + Two Readings — **Ch7 + Ch0** | Name a pattern you see clearly and still haven't moved on. |
| M9 Being seen | The Ticket System: optics aren't tickets — **Ch0** | Name a move you'd make if no one saw. |
| M10 Debt | The infinite-game frame — **Ch0** | Name what accurate accounting would actually say. |

Chapter numbers reflect the **current manuscript** (verified 2026-07-01): Ch1 The Forest, Ch2 The Shaman, Ch3 Challenger, Ch4 Regent, Ch5 Architect, Ch6 Diplomat, Ch7 Sage, Ch8 Player. The `SPEC_6_SABOTAGING_BELIEFS.md` table showing two Shaman chapters (Ch1/Ch2) is **stale** — do not route from it.

---

## 7. Loop back into the book/app

The result is not a terminus — it's the reader's **first BAR seed**.

- Each "one move now" can pre-fill a BAR draft (Breakthrough/Action/Reflection) keyed to the top myth.
- Capturing it creates the reader's first card and opens the personal deck.
- The myth profile seeds starting quests: a top myth maps to a `campaignFlavorLayer` so the reader's early quests are flavored by their live material, not a generic onboarding. **Codex: wire to existing campaignFlavorLayers architecture — mapping table TBD with WB.**

Funnel closes: Myths Read (lead) → first BAR (engagement) → Deck (entry purchase) → book (core).

---

## 8. Lead capture

**Gate placement (recommended):** results shown **free**; email is an optional **save-and-unlock** — "save your read + get your reading path" — not a wall in front of the result. Rationale: a hard gate on someone who just answered twelve honest questions reads as the con the book is against. Soft save-point converts without betraying the ethic. *(Alternative hard-gate model available if WB wants higher capture — see §9.)*

**Captured:** email, timestamp, full `myth_scores`, `top_myths`, derived `root_beliefs` (internal), source/UTM (chapter vs. cold vs. social), consent flag.

---

## 9. Data model (product-level; Codex maps to schema)

```json
{
  "myth_read_id": "uuid",
  "user_id": "uuid | null (anon until email)",
  "email": "string | null",
  "created_at": "iso8601",
  "source": "ch0 | cold | social | deck | other",
  "responses": [{ "item": "Q1", "value": 0-4 }],
  "myth_scores": [{ "myth": "M1", "pct": 0.0-1.0, "raw": 0 }],
  "top_myths": ["M8", "M7", "M1"],
  "root_beliefs": ["not_good_enough", "not_capable"],   // internal only
  "recommended_destinations": ["Ch7", "Ch0"],
  "cta_primary": "deck",
  "seed_bar_drafts": [{ "myth": "M8", "prompt": "..." }],
  "consent": true
}
```

---

## 10. Open calls (need WB)

1. ~~**M6 destination**~~ — **RESOLVED (2026-07-01):** repair lives in **Ch6 (Diplomat), the Repairer channel** (Channel 4). Routing updated.
2. ~~**Ch1 vs Ch2 Shaman**~~ — **RESOLVED (2026-07-01):** the Shaman is **Ch2** (Ch1 is The Forest). Routing updated. Two stale references surfaced for cleanup: the `SPEC_6_SABOTAGING_BELIEFS` chapter table, and a Ch0 cross-ref ("Chapter 1, when you meet the Shaman").
3. **Tie-break priority order** (§4) — I weighted toward the reader's likely-dominant myths (Framework, Fixer first). Confirm or reorder.
4. **Email gate** — soft save-point (recommended) vs. hard gate for higher capture.
5. **campaignFlavorLayer mapping** (§7) — myth → flavor layer table is yours to define.
6. **Belief on result?** — locked to *internal only* per your "one too many identities" call. Confirm it stays out of the result screen.

---

## 11. Build checklist

- [ ] Sign-off on §10 open calls
- [ ] Items + scale as §3
- [ ] Scoring + tie-breaks + floor rule as §4
- [ ] Result screen per content contract §5 (visual per companion spec)
- [ ] Routing table §6 (fill M6, confirm Ch refs)
- [ ] BAR seed + campaignFlavorLayer wiring §7
- [ ] Email save-point §8
- [ ] Data model §9 mapped to schema
- [ ] Chapter pointer live in Ch0 (done in `CHAPTER0_LEADGEN_EDITION.md`)
