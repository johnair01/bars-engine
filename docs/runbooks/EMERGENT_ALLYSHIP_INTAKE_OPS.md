# Ops: Emergent allyship intake (Thunder pattern)

**Spec kit:** [.specify/specs/emergent-campaign-bar-interview/spec.md](../../.specify/specs/emergent-campaign-bar-interview/spec.md) (**ECI**, backlog **1.71**)  
**Voice / taboos:** [message-framework.md](../../.specify/specs/bb-residency-marketing-metabolism/message-framework.md) (BBM)  
**Ontology:** [CAMPAIGN_ONBOARDING_CYOA.md](./CAMPAIGN_ONBOARDING_CYOA.md) — invites are CYOA; funding stays visible (COC Phase F/G).

This runbook is **content + operations** you can run **today**. It **feeds** engineering backlog items instead of waiting on schema.

---

## What “done” looks like tonight (no new code paths)

1. **`event_invite` BAR** exists (create via `/bars/create` or admin) with **`campaignRef`** matching Bruised Banana stewardship so you can edit in **Vault → Hand**.
2. **Story** = allyship intake template (**Thunder v1**).
3. You **copy the invite link** from Vault (`Copy invite link`) and send it to Thunder.
4. You **capture signal** outside the app until **ECI-A** ships (see § Honest data gap).
5. When ready to **go public**, you follow **manual water** (§ Manual water until ECI-B) and link tasks for whoever implements **hub + spokes**.

---

## Apply the Thunder v1 interview JSON

| Artifact | Path |
|----------|------|
| Template (source) | [`src/lib/event-invite-story/templates/allyship-intake-thunder.template.json`](../../src/lib/event-invite-story/templates/allyship-intake-thunder.template.json) |
| TS export + parser | [`src/lib/event-invite-story/templates/allyship-intake-thunder.ts`](../../src/lib/event-invite-story/templates/allyship-intake-thunder.ts) |

**CLI** (requires `DATABASE_URL`, same as app — use `npx tsx scripts/with-env.ts "…"` if needed):

```bash
npx tsx scripts/apply-invite-template.ts --bar-id=<CustomBar.cuid> --template=allyship-thunder
```

Dry run:

```bash
npx tsx scripts/apply-invite-template.ts --bar-id=<cuid> --template=allyship-thunder --dry-run
```

**Or** paste JSON into **Vault → Edit content → Advanced JSON** (`EventInviteBarContentEditor`). Validate with **Visual builder** toggle after save.

**Tests:** `npm run test:event-invite-story` (includes allyship template parse).

---

## Persisted answers (ECI Phase A — shipped)

When the invite story JSON has top-level **`id`** starting with **`allyship-intake`** (e.g. Thunder v1 `allyship-intake-thunder-v1`), reaching an **ending** passage **POSTs** a row to **`latent_allyship_intakes`** via `submitAllyshipIntake` (path: choice labels + passage ids, optional `playerId`, `clientSessionId`, `?note=`).

**Stewards / admins:** `/admin/allyship-intakes?ref=bruised-banana` (or your parent `campaignRef`). Same permission model as editing invite BARs (admin or instance owner/steward for that ref).

**Replay:** “Play through again” clears **sessionStorage** dedupe for that bar+story so a second run can submit again.

**Other** `event_invite` stories (no `allyship-intake` prefix) are unchanged — no server persistence.

---

## Manual “water” until ECI-B (spawn child campaign)

When you are ready to name the arc (e.g. **Support Thunder**):

| Step | Owner | Backlog driver |
|------|--------|----------------|
| Agree **child `campaignRef` slug** and parent linkage | Admin + Thunder | **CSC** [.specify/specs/campaign-subcampaigns/spec.md](../../.specify/specs/campaign-subcampaigns/spec.md) |
| Create / seed **Instance** + hub routes | Eng | **CHS** (0.49.2), **ECI-B.1–B.2** |
| Point **8 spokes** + **period 1** copy at **Create Urgency** (Kotter) | Content + Eng | **CHS** § conceptual stack; **BBM** for tone |
| Ensure **Donate / wizard** resolves with `?ref=` | Eng | **CSD** (done), **DSW** (1.03), **COC** Phase G |
| Subcampaign **stalls / slots** for “new idea” interviews | Later | **CMS** (1.02.2), **ECI-D** |

Document the **slug** and **hub URL** in this file’s appendix (below) when live.

---

## Backlog map — deft connections

Use this table when opening tickets or agent sessions: **one row = one spec to cite**.

| ID | Spec / row | How this ops pack uses it |
|----|------------|---------------------------|
| **1.71 ECI** | [emergent-campaign-bar-interview](../../.specify/specs/emergent-campaign-bar-interview/spec.md) | **Authority** for latent intake → water → hub+spokes; **ECI-A.4a** = this template + runbook. |
| **1.51 COC** | [campaign-onboarding-cyoa](../../.specify/specs/campaign-onboarding-cyoa/spec.md) | Invite + campaign **same ontology**; ending CTAs align with **support** on journey. |
| **1.47 EIP** | [event-invite-party-initiation](../../.specify/specs/event-invite-party-initiation/spec.md) | Partiful / `eventSlug` / initiation links on the **same BAR** if you add party dates. |
| **1.50 UGA** | [unified-cyoa-graph-authoring](../../.specify/specs/unified-cyoa-graph-authoring/spec.md) | Template must stay **parseable** (`parseEventInviteStory`); no dangling `next`. |
| **0.49.2 CHS** | [campaign-hub-spoke-landing-architecture](../../.specify/specs/campaign-hub-spoke-landing-architecture/spec.md) | **Hub + 8 spokes** + **Create Urgency** period when child campaign exists. |
| **1.04 BBM** | [bb-residency-marketing-metabolism](../../.specify/specs/bb-residency-marketing-metabolism/spec.md) | **Message pillars** for edits to `allyship-intake-thunder.template.json`. |
| **1.02.2 CMS** | [campaign-marketplace-slots](../../.specify/specs/campaign-marketplace-slots/spec.md) | Future: **seed subcampaign ideas** to **mall / pool** when slots exist (**ECI-D**). |
| **1.59 CSC** | [campaign-subcampaigns](../../.specify/specs/campaign-subcampaigns/spec.md) | Parent **bruised-banana** ↔ child **support-…** ontology. |
| **1.63 CMI** | [creator-milestone-interview](../../.specify/specs/creator-milestone-interview/spec.md) | **Converge** interview wizard UX with **ECI** (creator vs allyship template kinds). |
| **1.54 CBS** | [campaign-branch-seeds](../../.specify/specs/campaign-branch-seeds/spec.md) | Optional metaphor: player **seeds** on campaign CYOA vs this **BAR** intake (different object). |

**Content agent rhythm:** [CONTENT_AGENT_PLAYBOOK.md](../CONTENT_AGENT_PLAYBOOK.md) — one passage / one template edit per chunk, then `npm run test:event-invite-story` + manual `/invite/event/[barId]`.

---

## Appendix — instance log (edit in repo when live)

| Field | Value |
|-------|--------|
| Invite BAR id | _paste cuid_ |
| Child `campaignRef` (when spawned) | e.g. `support-thunder-…` |
| Hub URL | `/campaign/hub?ref=…` |
| Steward notes URL | _Notion / doc_ |

---

## Related

- [EVENT_INVITE_GUEST_JOURNEY_TEMPLATE.md](../events/EVENT_INVITE_GUEST_JOURNEY_TEMPLATE.md) — default party guest template; **allyship-thunder** is a **sibling** for solidarity intake.
- Backlog prompt: [.specify/backlog/prompts/emergent-campaign-bar-interview.md](../../.specify/backlog/prompts/emergent-campaign-bar-interview.md)
