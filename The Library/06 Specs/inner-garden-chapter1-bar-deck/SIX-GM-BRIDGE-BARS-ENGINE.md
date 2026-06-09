---
type: analysis
spec_kit_id: inner-garden-chapter1-bar-deck
title: "6-Face GM — Humane bridge (inner-garden BAR/deck ↔ bars-engine charge capture)"
created: 2026-05-07
framework: Architect / Regent / Challenger / Diplomat / Shaman / Sage
related:
  - ./SPEC.md
  - ../../04 Quests/Campaigns/inner-garden/BARS_ENGINE_INNER_GARDEN_GAP.md
---

# 6-Face GM Analysis: Humane bridge across inner-garden and bars-engine

**Question:** How do we bridge **inner-garden** (offline BAR → Witness card → seed → one channel spend) and **bars-engine** (account `charge_capture` CustomBar → 321 / Explore / Hand / daily policy / compost) **without harming players, builders, or the story each product tells**?

**Humane** means: no forced parity theater, no surprise data loss, no shaming offline players for not matching server rules, no drowning volunteers in schema work — while still **honoring** that both surfaces are the same **spiritual technology** (name the charge → metabolize → act).

---

## Architect — Structure the bridge in layers, not a big bang

**Principle:** One **contract** at a time; each layer optional at runtime.

| Layer | What it is | Humane rule |
|-------|----------------|-------------|
| **L0 — Semantic** | Shared vocabulary card: “BAR”, “charge”, “Witness”, “Hand” mean *what* in each app (1 page). | No code required; stops teams from talking past each other. |
| **L1 — Export/import** | JSON that **either** system can **losslessly round-trip** for *chosen* fields (B/A/R ↔ summary/context; emotion map; intensity map). | **Opt-in** only; default remains local-only IG. |
| **L2 — Read-only sync** | IG “pull latest charge” when logged in (or paste token). | **Never** overwrite a BAR the player is still editing; **merge** or **append** with clear labels. |
| **L3 — Shared identity** | Account-linked save (later). | Only after L1 feels good in playtests; **never** block IG solo mode. |

**Architect risk:** “One true schema” too early → paralysis. **Mitigation:** Ship **L0 + L1** as markdown + one example JSON **before** any OAuth.

---

## Regent — Keep the crown jewels of each product

**Regent says:** Do not merge by **deleting** what makes each place good.

| Keep in **inner-garden** | Keep in **bars-engine** |
|--------------------------|---------------------------|
| **Pallet Town** pace: chapter sandbox, no login, garden truth | **Daily charge** discipline, **Hand**, **321 provenance**, **quest spawn**, **compost** |
| **Explicit B/A/R** as teaching grammar | **Summary-first** capture + **Explore → quest → `/hand`** metabolism |
| **Spent-card tombstone** as gentle “you metabolized this” | **Vault limits**, **archive**, **multiplayer** stewardship language |

**Humane bridge:** Position IG as **“field practice”** and bars-engine as **“temple + ledger.”** Same person, different rooms — not “IG is the broken baby bars-engine.”

---

## Challenger — Name the harms before they happen; design them out

| Failure mode | Humane guard |
|--------------|----------------|
| **Emotion taxonomy clash** (5 channels vs 6 virtues) | **Display both**: “In Calrunia this reads as…” mapping table; **never** auto-relabel the player’s word as “wrong.” |
| **Intensity scales** (1–5 vs 20–100) | **Store raw** + optional **normalized** integer for engine; round-trip docs say which is canonical where. |
| **One-charge-per-day vs 24 BAR cap** | **Do not** import engine rule into IG chapter 1. If sync: **tag** engine captures as `source: engine_daily` and IG as `source: garden_chapter` — different **containers**, same **family**. |
| **Sync overwrites local** | **Last-write-wins is inhumane** for reflective text. Prefer **append-only log** or “duplicate as sibling BAR” with timestamp. |
| **Login shame** (“sign in to play”) | IG **must** remain fully playable with zero network; bridge is **bonus**, not gate. |
| **S/D/N missing in IG** | If exporting to engine, **optional** step: “How satisfied were you?” **skippable** with “I’m not sure yet.” |

---

## Diplomat — Align humans and products without false unity

**Stakeholders:** Solo player in browser, vault lore authors, bars-engine engineers, future “both” player.

**Diplomatic lines that work:**

- “**Inner Garden records the same BAR your body already knows**; bars-engine is where that BAR can **join campaigns** and **meet other charges**.”
- “We are **not** claiming feature parity — we are claiming **provenance lineage** when you want it.”

**Diplomatic failure:** Marketing “**full sync**” before L2 exists. **Fix:** Say **“export / import”** until bidirectional trust is proven.

---

## Shaman — Preserve felt-sense, ritual, and consent

**Humane = consent + pacing.**

- **Consent:** Any upload or sync uses **explicit** “Send this BAR to…” with **preview** of what leaves the device.
- **Pacing:** After capture, bars-engine offers **Reflect / Explore / Act** — IG currently offers **card + seed**. Bridge should **not** flash-modal six engine choices on first harvest; **introduce one new door per chapter** (e.g. chapter 2: “Offer this BAR to the temple?” = export).
- **Ritual continuity:** When mapping to `charge_capture`, preserve **word order** in `description` (B/A/R blocks) so 321 and future-you read the same story.

**Shaman anti-pattern:** Turning BAR into a **form audit** (“you failed schema”). Validation messages should sound like **invitation**, not IRS.

---

## Sage — Tell the truth about scope; humility is humane

**Sage commitments:**

1. **Chapter 1 IG** does not replace **Hand**; it **rhymes** with it.
2. **Witness card spend** is not **vibeulons**, **compost**, or **quest completion** — yet. Say so in UI microcopy once, lightly.
3. **bars-engine** daily charge rule is **intentional product theology**; IG must **not** silently adopt it without copy + design sign-off.

**Sage line for players:** *“What you wrote here can stay in the garden forever, or travel with you when you choose.”*

---

## Synthesis — One humane bridge sequence (recommended)

| Phase | Bridge move | Owner | Player experience |
|-------|-------------|-------|---------------------|
| **0** | Publish **L0 vocabulary + emotion/intensity map** (vault or `world-contract` stub) | Design | Clarity, no new UI |
| **1** | **Export BAR** from IG as JSON (download button) matching a documented **subset** of `CreateChargeBarPayload` | IG dev | “Take this to the temple” — **optional** |
| **2** | **Import** engine `charge_capture` (or pasted export) into IG as **read-only Witness** or **seed flavor** — **no overwrite** | IG dev | Visiting cultivator brings a **memory** |
| **3** | bars-engine **“open in Inner Garden”** deep link with **prefill** (not auto-save) | bars-engine | Continuity without trap |
| **4** | Optional **account link** + soft sync | Both | Only when 1–3 are boring |

---

## Face-by-face priority signals (for backlog ordering)

| Face | Humane priority |
|------|-----------------|
| **Architect** | L0 doc + L1 JSON schema **before** UI that says “sync.” |
| **Regent** | Preserve solo IG + full engine Hand; bridge is **additive**. |
| **Challenger** | Anti-overwrite, anti-shame-login, taxonomy map + skip paths. |
| **Diplomat** | Honest external copy; “export/import” not “full sync” until true. |
| **Shaman** | Consent previews, one new door per chapter, preserve B/A/R wording. |
| **Sage** | Microcopy humility; no fake economy parity. |

---

## References (on disk)

- bars-engine: `/Users/wendellbritt/bars-engine/src/actions/charge-capture.ts`, `src/components/charge-capture/ChargeCaptureForm.tsx`, `prisma/schema.prisma` (`CustomBar`).
- inner-garden: `The Library/04 Quests/Campaigns/inner-garden/js/systems/DeckSystem.js`, `js/ui/DialogBox.js`, `js/systems/SaveManager.js`.
- Vault gap inventory: `The Library/04 Quests/Campaigns/inner-garden/BARS_ENGINE_INNER_GARDEN_GAP.md`.
- Chapter 1 spec: [SPEC.md](./SPEC.md).
