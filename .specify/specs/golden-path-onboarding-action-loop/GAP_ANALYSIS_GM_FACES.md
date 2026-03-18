# Golden Path Onboarding + Action Loop v0 — Gap Analysis with Game Master Faces

**Source**: [Golden Path Spec](/Users/test/Downloads/golden_path_onboarding_action_loop_spec (1).md)  
**Purpose**: Compare current BARS Engine state against the golden path; each GM face analyzes gaps from their perspective.

---

## 1. Canonical Golden Path (Summary)

1. **Invite** → human invites player with campaign + starter quest
2. **Enter Campaign** → one landing card: campaign, domain, why it matters, who invited, first quest CTA
3. **Accept First Quest** → one concrete quest with action + success condition
4. **Recognize Friction** → "I'm stuck" is expected, normalized, not failure
5. **Clean Up** → 3-2-1 or EFA → relief + BAR draft + next action
6. **Generate BAR** → BAR answers "What is the next smallest honest action?"
7. **Translate BAR Into Action** → one micro-action attached to quest
8. **Complete Quest** → marked complete, visible record, vibeulon, campaign progress
9. **See Visible Impact** → what changed, who benefited, what opened next
10. **Continue** → one next quest suggested

---

## 2. Current State vs Golden Path (Step-by-Step)

| Step | Golden Path | Current State |
|------|-------------|---------------|
| **1. Invite** | Invitation = inviter + campaign + starterQuestId + invitationBarId | **Invite**: Generic token, not campaign-specific. `Invite.forgerId` = inviter. No `starterQuestId`, `campaignId`, `invitationBarId`. `CampaignInvitation` exists but targets `actorId`; no `starterQuestId` in schema. |
| **2. Enter Campaign** | One landing card: campaign, domain, why, inviter, first quest CTA | **Campaign landing**: `/campaign`, `/campaign/twine`, `/campaign/lobby` — none is a single "campaign landing" card. Lobby shows 8 portals (hexagram complexity). No campaign-specific landing with inviter + first quest. |
| **3. Accept First Quest** | One concrete quest, action + success condition | **Accept**: Quests come via threads (orientation, bruised-banana). No explicit "accept" flow; assignment happens on thread assign. Quest grammar: action, success condition exist in `CustomBar` but not always populated. |
| **4. Recognize Friction** | "I'm stuck" visible, normalized | **QuestDetailModal**: "Feeling stuck?" expandable. Unblock options: EFA + Add subquest. Good. No friction_type (confusion/fear/overwhelm) stored. |
| **5. Clean Up** | 3-2-1 or EFA → relief + BAR draft + next action | **321**: Produces quest, BAR, or fuel. Does not produce "next smallest honest action" per quest. **EFA**: Produces vibeulons, stuckBefore/stuckAfter. No BAR draft from EFA. No `next_action` bridge. |
| **6. Generate BAR** | BAR = crystallization from cleanup | **BAR creation**: 321 can create BAR via `createFaceMoveBar` (shadow belief). EFA does not create BAR. Create BAR form is separate. No `BarDraft` with `sourceType: "cleanup"`. |
| **7. Translate BAR Into Action** | BAR → next micro-action on quest | **Missing**: No `NextActionBridge` or equivalent. BAR is not linked to quest as "next action." No UI that asks "What is the next smallest honest action?" |
| **8. Complete Quest** | Complete, visible record, vibeulon, campaign progress | **Complete**: `completeQuest` marks done, grants vibeulons. Campaign progress not updated. No visible "campaign impact" record. |
| **9. See Visible Impact** | What changed, who benefited, what opened | **Missing**: Completion shows vibeulon reward. No "2 setup helpers confirmed" or "Your action unlocked X." No campaign impact display. |
| **10. Continue** | One next quest suggested | **Threads**: Next quest advances automatically. No "one next quest" suggestion; player sees full thread or gameboard. |

---

## 3. Game Master Face Analysis

### **Architect** (Structure, Blueprint)

*"The golden path is a linear sequence. The current system is a graph. We need to carve a path through the graph."*

| Gap | Architect Analysis |
|-----|---------------------|
| **Invitation shape** | `Invite` and `CampaignInvitation` do not model `{ inviterId, campaignId, starterQuestId, invitationBarId }`. No unified `Invitation` type. Schema is fragmented. |
| **Campaign landing** | No single "campaign landing" route. `/campaign/lobby` is 8 portals. `/campaign/twine` is CYOA. We need `/campaigns/:id/landing` or equivalent that returns one card. |
| **BAR → Action bridge** | No `NextActionBridge` or equivalent. The BAR is created but not linked to a quest as "next action." Add `next_action` to BAR metadata or a join table. |
| **Visible impact** | No `campaign_impact` or `campaign_progress` display. Completion could write to a `CampaignProgressEvent` or similar; UI reads it. |

**Architect recommendation**: Add `Invitation`-like shape. Create `/campaigns/:id/landing` or extend campaign landing. Add `NextActionBridge` (questId, barId, nextAction). Add campaign impact display.

---

### **Regent** (Order, Rules, Campaign)

*"Kotter stage and domain govern. The golden path must respect those rules. But the path itself must be simple."*

| Gap | Regent Analysis |
|-----|------------------|
| **Admin seeding** | Spec says: 5 starter quests, one milestone, campaign description. Current: `seed-onboarding-thread`, `seed-bruised-banana-adventure`. No "seed campaign in 30 min" flow. Admin seeding is scattered. |
| **Quest grammar** | Spec: `action`, `successCondition` required. `CustomBar` has `description`, `moveType`. No explicit `action` or `successCondition` fields. Quest grammar exists but not enforced. |
| **Completion contract** | Spec: complete → campaign progress updated. Current: `completeQuest` updates `PlayerQuest`; no campaign-level progress. |

**Regent recommendation**: Enforce quest grammar (action, successCondition). Add campaign progress update on completion. Simplify admin seeding to one flow.

---

### **Shaman** (Threshold, Emergence, Wake Up)

*"Friction is the threshold. Cleanup is the ritual. The BAR must emerge from what was stuck."*

| Gap | Shaman Analysis |
|-----|-----------------|
| **Friction normalization** | Spec: confusion, fear, overwhelm, avoidance, etc. — treated as expected. Current: "Feeling stuck?" exists but no friction_type stored. No explicit normalization of "this is part of play." |
| **Cleanup → BAR** | Spec: cleanup produces BAR draft. Current: 321 produces `createFaceMoveBar` (shadow belief). EFA produces vibeulons, no BAR. EFA does not bridge to quest. |
| **Next smallest honest action** | Spec: BAR must answer this. Current: 321 can create quest; no "next action" extraction. No AI or human interpreter that produces `next_action` from cleanup text. |

**Shaman recommendation**: Store friction_type. Make EFA produce BAR draft when `applyToQuesting` is true. Add "next smallest honest action" extraction (AI or template) from 321/EFA output.

---

### **Challenger** (Friction, Edge, Clean Up)

*"The player must feel the edge. The system must not soften it away. But it must be survivable."*

| Gap | Challenger Analysis |
|-----|----------------------|
| **"I'm stuck" prominence** | Spec: visible "I'm stuck" action. Current: collapsed in QuestDetailModal. Could be more prominent. |
| **Cleanup as care** | Spec: Clean Up → EFA is care, not punishment. Current: EFA is framed as "Emotional First Aid" — good. But link is buried in expandable. |
| **BAR as crystallization** | Spec: BAR is usable, not just journal. Current: BARs can be generic. No guarantee BAR answers "next action." |

**Challenger recommendation**: Surface "I'm stuck" more prominently. Ensure cleanup flow feels like care. Ensure BAR output is actionable.

---

### **Diplomat** (Relational, Invitation)

*"The player must feel wanted. The inviter must be visible. The campaign must speak its needs."*

| Gap | Diplomat Analysis |
|-----|-------------------|
| **Inviter identity** | Spec: "McClair invited you because…" Current: `Invite.forgerId`, `Player.invitedByPlayerId` exist. Inviter is not always shown on campaign landing. |
| **Campaign as person** | Spec: campaign, domain, why it matters. Current: Instance has campaignRef, name, targetDescription. Not surfaced in one landing. |
| **One CTA** | Spec: one first quest CTA. Current: Dashboard shows threads, gameboard, many options. No single "your first quest" CTA. |

**Diplomat recommendation**: Add inviter to campaign landing. Create one campaign landing. Single CTA for first quest.

---

### **Sage** (Integration, Whole)

*"The whole system is a map of meaning. The golden path is the spine. Everything else must support it."*

| Gap | Sage Analysis |
|-----|---------------|
| **Sequence** | Spec says: golden path first, world complexity second. Current: we built portals, lobby, schools, game map. The golden path is not the spine. The system is broad before it is deep. |
| **One loop** | Spec: Invite → Accept → Stuck → Clean Up → BAR → Action → Complete → Impact → Next. Current: many loops (threads, gameboard, EFA, 321, dashboard). No single canonical loop. |
| **Visible impact** | Spec: "2 setup helpers confirmed." Current: completion is abstract. No campaign-level "what changed" story. |

**Sage recommendation**: Treat the golden path as the spine. Defer portal/hexagram complexity until this loop works. Add visible impact as the closing beat.

---

## 4. Unified GM Synthesis

| Priority | Recommendation | Owner |
|----------|----------------|-------|
| **1** | Add `Invitation`-like shape: inviterId, campaignId, starterQuestId, invitationBarId | Architect |
| **2** | Create campaign landing: one card, campaign + domain + inviter + first quest CTA | Architect + Diplomat |
| **3** | Add "BAR → next action" bridge: `NextActionBridge` or BAR metadata | Architect + Shaman |
| **4** | Make EFA produce BAR draft when `applyToQuesting` | Shaman |
| **5** | Add visible campaign impact on completion | Architect + Sage |
| **6** | Store friction_type; normalize "I'm stuck" | Shaman + Challenger |
| **7** | Simplify admin seeding: 5 starter quests, one milestone, campaign description | Regent |
| **8** | Enforce quest grammar: action, successCondition | Regent |
| **9** | Surface "I'm stuck" more prominently | Challenger |
| **10** | Sequence: golden path first, then portals/decks | Sage |

---

## 5. API Gaps (Spec Section 8)

| Spec Endpoint | Current State |
|---------------|---------------|
| `POST /invitations/:id/accept` | No equivalent. Invite used on signup; no campaign acceptance. |
| `GET /campaigns/:id/landing` | No equivalent. Campaign landing is fragmented. |
| `POST /quests/:id/accept` | No explicit accept. Assignment via thread. |
| `POST /quests/:id/friction` | No equivalent. "Feeling stuck" expands UI; no friction API. |
| `POST /cleanup/run` | EFA + 321 exist but no unified `cleanup/run` that returns `{ bar_draft, next_action }`. |
| `POST /bars/:id/approve` | No BAR approval flow. BARs are created or not. |
| `POST /quests/:id/complete` | `completeQuest` exists. Does not return `campaign_impact`, `next_quest_id`. |

---

## 6. What Exists (Strengths)

- **Invite**: `Invite`, `forgerId`, `invitedByPlayerId` — inviter is tracked
- **Quest**: `CustomBar`, threads, `PlayerQuest` — quest assignment and completion work
- **Stuck**: QuestDetailModal "Feeling stuck?" expandable with EFA link
- **EFA**: `EmotionalFirstAidKit`, stuckBefore/stuckAfter, vibeulon mint
- **321**: `Shadow321Runner` produces quest, BAR, or fuel; `createQuestFrom321Metadata`
- **Completion**: `completeQuest` marks done, grants vibeulons
- **Campaign**: Instance, campaignRef, portalAdventureId, schoolsAdventureId

---

## 7. Recommended Implementation Order

1. **Campaign landing** — one route, one card (Architect + Diplomat)
2. **Invitation shape** — extend Invite or CampaignInvitation (Architect)
3. **Friction API** — `POST /quests/:id/friction` or equivalent (Shaman)
4. **Cleanup → BAR + next action** — EFA output, 321 output (Shaman)
5. **Next action bridge** — UI + schema (Architect)
6. **Visible impact** — completion + campaign progress display (Sage)
7. **Admin seeding** — 5-starter-quest flow (Regent)

---

## 8. Tension with Recent Work

The golden path spec **excludes** for v0:
- hexagram portals
- campaign decks
- dynamic subcampaign generation
- full game map

**Recent work** (Phases 2A–2D, 5.2, 5.3) added:
- Hexagram portals, campaign lobby, 8 portals
- Game map, schools adventure
- Campaign lobby entry points

**Sage**: *"The golden path is the spine. Portals and maps are amplifiers. If the golden path does not work, those systems make confusion prettier."*

**Recommendation**: Treat portal/map work as **parallel** to the golden path. The golden path can be a **separate entry route** — e.g. `/invite/:token` → campaign landing → first quest. Players who enter via campaign CYOA or game map can still use the full system. The golden path is for **invited players** who need a tight, linear loop first.
