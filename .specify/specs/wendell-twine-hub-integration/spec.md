# Spec: Wendell Twine hub → bars-engine integration (reference port)

## Purpose

Capture the **Wendell Support Quest** Twine prototype (Harlowe) as a **reference design** for **hub-and-spoke** fundraising / timebank / allyship paths, and define how those patterns **map to existing bars-engine routes** — **without** re-hosting the full Twine runtime in production.

**Problem:** Rich narrative + variable state (`$timebankCredits`, prompts, role quests) exists in a **standalone HTML**; product needs **one system of record** (BARs, Instance, DSW, events).

**Practice:** Deftness Development — **content port** (Twee / Adventure) + **behavior port** (wizard, ledger, quests); API-first for anything new.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Canonical runtime | **bars-engine** (Next.js, Prisma, Adventures) — Twine HTML is **authoring reference**, not the shipping shell. |
| State | **Server + DB** replace Harlowe `$variables` — e.g. timebank credits → **ledger / Instance config / player metadata** per existing economy patterns. |
| Hub | Align **`Start`** hub with **`/campaign`**, **`/event`**, **`/event/donate/wizard`** — see mapping table below. |
| External links | **Forms, Partiful, GoFundMe** remain **links** stored on **Instance** / **EventArtifact** / admin config — already trending in codebase. |
| Titles / epithets | “Herald of Change” etc. → **optional** badge JSON or **quest completion** copy — defer dedicated **titles** table until a second campaign needs it. |

## Conceptual Model

**WHO:** Player / supporter  
**WHAT:** Choose contribution path (money, time, books, coaching, dojo, dance)  
**WHERE:** Campaign + event surfaces  
**Energy:** Timebank hours, donations, attention  
**Throughput:** Move-flavored **Allyship Quests** (Storyteller, Builder, Sage, Messenger, Scribe) → map to **superpower** / **quest templates** or **role-tagged BARs**

## Feature mapping (Twine → bars-engine)

| Twine area | bars-engine target |
|------------|-------------------|
| `Start` hub | `CampaignHubView`, `/campaign/hub`, `/event` landing |
| GoFundMe passage | `Instance` fundraising URLs + `/campaign/[ref]/fundraising`, DSW money branch |
| Timebank / skilled vs unskilled | [donation-self-service-wizard](../donation-self-service-wizard/spec.md), [offer-bar-timebank-wizard-modal](../offer-bar-timebank-wizard-modal/spec.md) |
| `TimebankQuest` (prompt → activate pending) | DSW **time** path + **quest completion** to unlock (mirrors “complete quest to activate unskilled hours”) |
| Allyship Quests (5 roles) | **Quest templates** or **CampaignDeck** cards; link to **Google Forms** or in-app **BAR creation** |
| Allyship Dojo 321 | Existing **321 / shadow** adventures — **content** import as Twee under `content/twine/` |
| Books / Gumroad / early readers | **Book library** + **timebank** contribution flows; external links as **admin config** |
| Keeping Warm / Partiful | **EventArtifact** + `partifulUrl` patterns ([event-invite-party-initiation](../event-invite-party-initiation/spec.md)) |
| Podcast / Promotion | **Event** or **campaign** content blocks — **not** core engine v1 |

## API Contracts

No new **public** API required for the spec itself — **implementation** uses:

- Existing **`getInstanceForDonation`**, **`/event/donate/wizard`**, **`campaign-bar`**, **`QuestThread`**.

Optional **future** action:

```ts
// If we unify “hub choice” analytics
recordHubSpokeSelection(input: { playerId: string; campaignRef: string; spokeId: string }): Promise<{ ok: true }>
```

Document when analytics is needed.

## User Stories

### P1: Parity of paths

**As a supporter**, I can still reach **money**, **time**, and **skill offers** from **one campaign entry**, so I don’t hunt for dead Twine links.

**Acceptance:** Single campaign hub lists **all** active paths with **working** URLs from Instance/Event config.

### P2: No duplicate state

**As ops**, we don’t maintain **two** timebank ledgers (Twine vars vs DB).

**Acceptance:** All hour balances **read from** Prisma-backed sources.

### P3: Content import

**As a steward**, I can **edit** hub copy in **admin or Twee** without redeploying a static HTML file.

**Acceptance:** Primary copy lives in **Adventure / Passage** or **campaign markdown** — not only `cpq9dpsx.html`.

## Functional Requirements

- **FR1**: Documented **route map** (this spec + plan) — **keep updated** when `/campaign` IA changes.
- **FR2**: **Variable behaviors** from Twine (credits, pending hours) have **explicit** bars-engine equivalents (see mapping table).
- **FR3**: **321 Dojo** passage content: import path under **`content/twine/`** or **adventure slug** tied to campaign ref.
- **FR4**: **Allyship Quests**: either **seed BARs** or **external form links** — **one** chosen per role for v1.

## Non-Functional Requirements

- **SEO / sharing:** Hub pages are **SSR** Next routes — better than single-file Twine for OG tags (optional).
- **Accessibility:** Target WCAG for **wizard** flows; Twine HTML is not the long-term a11y baseline.

## Persisted data & Prisma

**No new schema required** for the spec **as a mapping doc** — individual child features (DSW, OBT) own migrations.

## Verification Quest

- **ID**: `cert-wendell-hub-parity-v1`
- **Steps**: From campaign hub → each spoke (money, time, book, event) → confirm URL + no Twine-only state.

## Dependencies

- [donation-self-service-wizard](../donation-self-service-wizard/spec.md)
- [offer-bar-timebank-wizard-modal](../offer-bar-timebank-wizard-modal/spec.md)
- [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md)

## References

- Source artifact: **`cpq9dpsx.html`** (Harlowe 3 — *Wendell Support Quest*; ingested for structure)
- [spec-template.md](../../spec-template.md)
