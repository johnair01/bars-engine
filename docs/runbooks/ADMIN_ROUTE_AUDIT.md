# Admin route audit — four moves + six Game Master faces

**Canonical stewardship:** [ADMIN_STEWARDSHIP.md](./ADMIN_STEWARDSHIP.md)  
**Spec kit:** [.specify/specs/admin-stewardship-four-moves/spec.md](../../.specify/specs/admin-stewardship-four-moves/spec.md)

This document inventories **every** `page.tsx` under `src/app/admin/` (58 routes), tags **sidebar vs orphan**, and records a **move**, **face(s)**, **game loop** link, and **keep / merge / integrate / deprecate** recommendation.

**Face rubric** (from spec): **Shaman** = meaning/feedback; **Regent** = governance; **Challenger** = safety/scope; **Architect** = structure; **Diplomat** = language/onboarding; **Sage** = integration/docs.

**Deprecation** here means *prefer hide from nav + redirect later* unless the route is unused.

---

## Summary

| Metric | Count |
|--------|------:|
| Total admin `page.tsx` routes | 58 |
| Reachable from grouped sidebar (see `AdminNav`) | 31 top-level + children |
| Previously orphan-only (now linked under **Grow** or **Wake**) | 3 |
| Merge candidates (cluster) | Quest tooling (5 routes), Twine cluster (4), Book hub children |

**Phase E (2026-03):** Quest ops sub-nav (`QuestOpsNav`) on catalog / grammar / from-context / proposals; sidebar uses a single **Quest ops** entry; Twine story / IR / stitcher share `TwineStoryChrome`; Instances and promoted campaign seeds show **Campaign tools** deep links when `campaignRef` is set; `/admin/quest-ops` redirects to `/admin/quests`.

**Ongoing — composting & agent evolution:** Process for **purpose review**, **composting** redundant admin paths, and **bounded agent** roles is specified in [.specify/specs/admin-page-composting-agent-evolution/spec.md](../../.specify/specs/admin-page-composting-agent-evolution/spec.md) (does not replace this inventory; feeds backlog and IA decisions).

**Merge candidates (do not delete without Sage sign-off):**

- **Quest cluster:** `/admin/quests`, `/admin/quest-grammar`, `/admin/quest-from-context`, `/admin/quest-proposals` — unified IA under **Quest ops** (tabs on each surface); optional alias `/admin/quest-ops` → `/admin/quests`.
- **Twine cluster:** `/admin/twine`, `/admin/twine/[id]`, `/admin/twine/[id]/ir`, `/admin/twine/stitcher` — shared breadcrumb + quick links (`TwineStoryChrome`); list page has Admin / Twine trail.
- **Campaign by ref:** `/admin/campaign/[ref]/author`, `/admin/campaign/[ref]/deck`, `/admin/campaign/[ref]/community-character` — linked from Instances and campaign seeds when `campaignRef` is known (`CampaignRefLinks`).

---

## Full matrix

**Sidebar:** `yes` = listed in grouped nav or obvious child of listed parent (`/admin/adventures/[id]` → Adventures). `orphan` = no parent link in nav before this audit.

| Route | Sidebar | Purpose (short) | Move | Primary face(s) | Game loop | Decision |
|-------|---------|-----------------|------|-----------------|-----------|----------|
| `/admin` | yes | Dashboard, tilt, stewardship zones, reset | cross | Sage, Architect | Global ops | **keep** |
| `/admin/onboarding` | yes | Edit onboarding flow templates / passages | Wake | Diplomat, Architect | Onboarding → campaign | **keep** |
| `/admin/instances` | yes | Active instance, campaign ref, event mode | Wake | Regent, Architect | Instance → `/event` | **keep** |
| `/admin/campaign-events` | yes | List events by instance | Clean | Regent, Challenger | EventArtifact → invites | **keep** |
| `/admin/campaign-events/[eventId]` | yes | Edit one event | Clean | Regent, Challenger | Event schedule, hosts | **keep** |
| `/admin/governance` | yes | Policy / governance tools | Wake | Regent, Sage | Campaign rules | **keep** |
| `/admin/campaign-seeds` | yes | Campaign seed CRUD | Grow | Architect | Portal onboarding | **keep** |
| `/admin/journeys` | yes | Quest threads / journeys overview | Grow | Architect | QuestThread | **keep** |
| `/admin/journeys/thread/[id]` | yes | Single thread detail | Grow | Architect | Thread → quests | **keep** |
| `/admin/journeys/pack/[id]` | yes | Pack detail | Grow | Architect | Quest packs | **keep** |
| `/admin/quests` | yes | Admin quest catalog | Grow | Architect | Quest BARs | **merge** → hub “Quest ops” |
| `/admin/quests/[id]` | yes | Quest detail | Grow | Architect | Quest completion | **merge** → hub |
| `/admin/players` | yes | Player list / admin | Wake | Regent, Challenger | Players → auth | **keep** |
| `/admin/avatars` | yes | Avatar admin | Grow | Architect | Nation/archetype visuals | **keep** |
| `/admin/avatars/assets` | yes | Sprite asset registry | Grow | Architect | ARDS / sprites | **keep** |
| `/admin/world` | yes | Nations / archetypes index | Wake | Architect | World data | **keep** |
| `/admin/world/nation/[id]` | yes | Nation editor | Wake | Architect | Nations → quests | **keep** |
| `/admin/world/archetype/[id]` | yes | Archetype editor | Wake | Architect | Playbooks | **keep** |
| `/admin/first-aid` | yes | Emergency / repair tools | Clean | Regent, Challenger | Recovery | **keep** |
| `/admin/forge` | yes | Agent forge / admin tooling | Grow | Sage, Architect | AI agents | **keep** |
| `/admin/twine` | yes | Twine story list | Grow | Architect | CYOA adventures | **keep** |
| `/admin/twine/[id]` | yes | Story detail, bindings | Grow | Architect | Twine → passages | **integrate** (breadcrumbs) |
| `/admin/twine/[id]/ir` | yes | IR authoring | Grow | Architect | CMA / IR | **integrate** with Twine detail |
| `/admin/twine/stitcher` | yes | Stitcher wizard | Grow | Architect | Passage merge | **integrate** with Twine |
| `/admin/books` | yes | Book library pipeline | Grow | Diplomat, Architect | Book → quest | **keep** |
| `/admin/books/[id]` | yes | Book hub | Grow | Architect | PDF ingestion | **keep** |
| `/admin/books/[id]/quests` | yes | Book → quest export | Grow | Architect | Quest generation | **keep** |
| `/admin/books/[id]/moves` | yes | Book moves | Grow | Architect | Move extraction | **keep** |
| `/admin/moves` | yes | Move taxonomy admin | Wake | Architect | Four moves / grammar | **keep** |
| `/admin/discovery` | yes | Discovery queue | Grow | Shaman, Architect | Library discover | **keep** |
| `/admin/maps` | yes | Spatial maps list | Grow | Architect | Game map / world | **keep** |
| `/admin/maps/[id]` | yes | Map detail | Grow | Architect | Spatial | **keep** |
| `/admin/maps/[id]/editor` | yes | Map editor | Grow | Architect | Anchors, venues | **keep** |
| `/admin/adventures` | yes | CYOA adventures list | Grow | Architect | Adventures → campaign | **keep** |
| `/admin/adventures/create` | yes | Create adventure | Grow | Architect | New CYOA | **keep** |
| `/admin/adventures/[id]` | yes | Adventure detail | Grow | Architect | Passages, campaign ref | **keep** |
| `/admin/adventures/merge` | yes | Merge adventures | Clean | Challenger, Architect | Data repair | **keep** (rare) |
| `/admin/adventures/[id]/passages/create` | yes | Create passage | Grow | Architect | Graph | **keep** |
| `/admin/adventures/[id]/passages/[passageId]/edit` | yes | Edit passage | Grow | Architect | CYOA content | **keep** |
| `/admin/templates` | yes | Twine / template library | Grow | Architect, Diplomat | Templates | **keep** |
| `/admin/quest-grammar` | yes | Quest grammar / CMA playground | Grow | Architect, Sage | Charge → quest | **merge** → Quest ops hub |
| `/admin/quest-from-context` | yes | Generate quest from context | Grow | Architect | BQGE | **merge** → Quest ops hub |
| `/admin/quest-proposals` | yes | BAR→quest proposals queue | Grow | Regent, Architect | Publication | **merge** → Quest ops hub |
| `/admin/quest-proposals/[id]` | yes | Proposal detail | Grow | Architect | Review | **merge** → hub |
| `/admin/agent-proposals` | yes | NPC / agent proposals | Grow | Sage, Architect | NPC ecology | **keep** |
| `/admin/backlog` | yes | Spec backlog viewer | cross | Sage | Dev process | **keep** |
| `/admin/library` | yes | Admin library | Wake | Diplomat | Books / praxis | **keep** |
| `/admin/docs` | yes | Admin docs index | Wake | Sage | Runbooks | **keep** |
| `/admin/config` | yes | Feature flags / app config | Clean | Regent, Challenger | `app_config` | **keep** |
| `/admin/npcs` | yes | NPC constitutions list | Grow | Architect, Sage | NPC sim | **keep** (added to nav) |
| `/admin/npcs/[id]` | yes | NPC detail | Grow | Architect | NPC profile | **keep** |
| `/admin/npcs/[id]/reflections` | yes | NPC reflections | Grow | Shaman, Architect | Memory | **keep** |
| `/admin/npcs/[id]/memories` | yes | NPC memories | Grow | Architect | Memory | **keep** |
| `/admin/bar-candidates` | yes | Promote BAR candidates from encounters | Grow | Regent, Challenger | Threshold → BAR | **keep** (added to nav) |
| `/admin/sprites/review` | yes | Sprite approval queue | Grow | Architect | Avatar pipeline | **keep** (added to nav) |
| `/admin/campaign/[ref]/author` | orphan | Campaign author / deck generation by ref | Grow | Architect | Campaign → adventures | **integrate** — link from instances/seeds |
| `/admin/campaign/[ref]/deck` | orphan | Campaign deck wizard | Grow | Architect | Kotter deck | **integrate** |
| `/admin/campaign/[ref]/community-character` | orphan | Community character template | Grow | Diplomat | Campaign character | **integrate** |

**External:** `/lobby` (Game Lobby) — **Show**; not under `/admin`.

---

## Machine-readable appendix

See [ADMIN_ROUTE_AUDIT.csv](./ADMIN_ROUTE_AUDIT.csv) for the same rows (sortable).

---

## Notes

1. **Orphan routes** under `/admin/campaign/[ref]/…` require a `campaignRef` — deep-link from **Instances** or **Campaign seeds** when we add “Open campaign tools” actions.
2. **Challenger** review: any bulk edit page (merge, first-aid, config) should keep instance/campaign scope visible (already emphasized in stewardship spec).
3. **Sage**: keep `docs/` and `backlog` discoverable; avoid duplicating spec content inside admin UI.
