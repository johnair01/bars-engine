# Conclave construct — ingested specs

Source: local download bundle (“Construc conclave”). Copied here for version control and Spec Kit / backlog linking.

| File | Focus |
|------|--------|
| `bar_to_quest_router_spec.md` | BAR → quest **routing** (not story gen); WAVE; Chapter 1 loop |
| `bars_api_cursor_spec_full.md` | API layers: registry → routing → composition → runtime; BarQuestLink; campaign drafts |
| `bars_campaign_draft_full_spec.md` | Braided **playerArc + campaignContext**; CampaignArc; approval flows |
| `bars_game_loop_architecture_spec.md` | Unified loop: BAR → Quest → Core Drive → Loop → Campaign |
| `bars_octalysis_spec.md` | Core Drive enum; BarMotivationProfile; LoopTemplate endpoints |
| `bars_octalysis_analysis.md` | Why motivation layer; warning vs superficial gamification |

**Spec kit:** [.specify/specs/bar-quest-link-campaign-drafts/spec.md](../../../.specify/specs/bar-quest-link-campaign-drafts/spec.md) — product decisions (D1–D4), FRs, phased plan, tasks.

Existing code to extend: `src/lib/bar-forge/match-bar-to-quests.ts`, `POST /api/match-bar-to-quests`, `/api/bar-registry/*`.
