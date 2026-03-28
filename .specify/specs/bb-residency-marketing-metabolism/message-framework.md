# Bruised Banana residency — message framework (BBM)

Canonical **voice and metabolism** anchors for residency-aligned copy. Implementation authority remains [spec.md](./spec.md). Update this file when campaign dates, external RSVP platforms, or steward priorities change.

## Message pillars (edit freely)

Use these as **lint questions** for Twine, invite BARs, `/event`, and quest seeds—not as paste-everywhere slogans.

| Pillar | Intent | Example prompt |
|--------|--------|----------------|
| **Invitation, not extraction** | Players choose depth; no guilt framing | “You’re invited to…” vs “You must…” |
| **Residency as practice** | Show Up / throughput language matches dashboard IA | Align with NOW / Hand / Vault metaphors |
| **Collective + personal** | Both lanes visible | Personal moves + strengthen-residency beats |
| **Honest economy** | Donate / time / space are optional, clear | Honor system, wizard paths per [DSW](../donation-self-service-wizard/spec.md) |

## Taboos (avoid)

- Promising **playable** steps that require auth on logged-out surfaces (see [play-public-teaser-loop](../play-public-teaser-loop/spec.md) when shipped).
- **Contradicting** onboarding Twine vs `/event` donate/support CTAs—use **`sage_consult`** for cross-surface checks ([CONTENT_AGENT_PLAYBOOK.md](../../../docs/CONTENT_AGENT_PLAYBOOK.md)).
- Dumping **long** marketing prose into **system** quest titles or cert steps; keep cert copy procedural.

## Calendar & campaign anchors

Point to **live** docs rather than duplicating schedules:

- Event / Partiful copy: [docs/events/bruised-banana-apr-2026-partiful-copy.md](../../../docs/events/bruised-banana-apr-2026-partiful-copy.md) (replace or add siblings per season).
- House instance / ops: [bruised-banana-house-instance](../bruised-banana-house-instance/spec.md), [`docs/BRUISED_BANANA_HOUSE_INSTANCE.md`](../../../docs/BRUISED_BANANA_HOUSE_INSTANCE.md) when relevant.
- Runbooks: `docs/runbooks/` (e.g. party, stewardship).

## Content surfaces (where metabolism lands)

| Surface | Typical path | Agent / skill hint |
|---------|----------------|-------------------|
| Onboarding Twine | `content/twine/onboarding/bruised-banana-onboarding-draft.twee` | narrative-quality; optional `diplomat_refine_copy` |
| Event hub / donate | `src/app/event/**` | shaman_read, diplomat_guide |
| Cert / QA quests | `scripts/seed-cyoa-certification-quests.ts` | One quest per edit; `architect_compile` discipline |
| Invite CYOA | `CustomBar.storyContent` (see [EIP](../event-invite-party-initiation/spec.md)) | narrative-quality + inline editing spec |
| Allyship intake (emergent Support campaigns) | [`allyship-intake-thunder.template.json`](../../../src/lib/event-invite-story/templates/allyship-intake-thunder.template.json); ops [EMERGENT_ALLYSHIP_INTAKE_OPS.md](../../../docs/runbooks/EMERGENT_ALLYSHIP_INTAKE_OPS.md) | BBM pillars + **ECI** [.specify/specs/emergent-campaign-bar-interview/spec.md](../emergent-campaign-bar-interview/spec.md) |

## Metabolism workflow (Cursor)

1. **Pre-flight:** `OPENAI_API_KEY`, `npm run verify:bars-agents-mcp`, backend health — [CONTENT_AGENT_PLAYBOOK.md](../../../docs/CONTENT_AGENT_PLAYBOOK.md).
2. **Brief:** Re-read this file + the spec slice you’re implementing (e.g. DSW, NEV).
3. **Draft:** One passage, one route, or one cert step per chunk; land in-repo.
4. **Verify:** `npm run check`; manual walk of `/event`, `/campaign/twine`, or invite URL as appropriate.
5. **Metabolize feedback:** `.feedback/*.jsonl` → **cert-feedback-triage** / **narrative-quality** → update **one** `.specify/specs/<name>/tasks.md`.

## Related specs

- [bb-residency-marketing-metabolism spec](./spec.md) — requirements & phases.
- [campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md) — unified invite/campaign onboarding ontology (when built).
