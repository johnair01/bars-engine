# Plan: BB residency marketing & content metabolism

## Implementation order

1. **Spec kit** — `spec.md`, `plan.md`, `tasks.md`, `message-framework.md`.
2. **Backlog wire** — `BACKLOG.md` BBM row links to `spec.md`.
3. **Playbook wire** — `docs/CONTENT_AGENT_PLAYBOOK.md` adds a **BBM / residency alignment** subsection pointing here.
4. **Seed backlog DB** — `npm run backlog:seed` (optional in CI; run locally after BACKLOG edit).

## File impacts

| Area | Files |
|------|--------|
| Spec | `.specify/specs/bb-residency-marketing-metabolism/*` |
| Backlog | `.specify/backlog/BACKLOG.md` |
| Docs | `docs/CONTENT_AGENT_PLAYBOOK.md` |

## Risks

- **Doc rot** — Message framework must be **updated when** residency dates or external Partiful/event copy changes; tie to runbooks under `docs/events/` and `docs/runbooks/`.
- **Scope creep** — Resist building admin UI or generators in v1; prove the **process** first.

## Phase 2 (defer)

- Optional cert quest for copy consistency across Twine + `/event` + invite BAR.
- Optional admin “brief” surface bound to this spec’s tasks.

## Open questions

- Whether **COC** ([campaign-onboarding-cyoa](../campaign-onboarding-cyoa/spec.md)) subsumes part of invite authoring; BBM stays **voice + metabolism**, COC stays **CYOA ontology + builder**.
