# New User Perspective — App Explanation, Turnoffs, and Loop Weaknesses

**Purpose**: View the app through the eyes of a potential new player. Identify what they experience, what turns them off, and where the main game loop is weakest.

---

## 1. What the App Is (New User Explanation)

**In one sentence**: BARS Engine is a narrative quest system where you complete small actions (quests), earn vibeulons (in-game currency), and grow through emotional and collective work—often tied to a campaign like "Bruised Banana Residency."

**The core loop**:
1. **Discover** — You land on a dashboard with quests, threads, and a campaign. Someone may have invited you.
2. **Choose** — You pick a quest (or one is suggested). Quests have titles, descriptions, and sometimes Twine stories.
3. **Do** — You complete the quest (attest, submit, or play through a story). You earn vibeulons.
4. **Stuck?** — If you're blocked, you can use Emotional First Aid (EFA) or the 321 Shadow Process to unblock.
5. **Continue** — You move to the next quest. Threads advance automatically; the gameboard offers campaign slots.

**What makes it different**: It blends personal development (archetypes, nations, emotional alchemy) with collective campaign work. You're not just grinding—you're "showing up" for a residency or cause.

---

## 2. Entry Points (What a New User Actually Sees)

| Entry | What they see | First impression |
|-------|---------------|------------------|
| **Direct** | `/` or `/login` → Guided auth → Nation/Archetype pick → Dashboard | "A lot of setup before I can do anything." |
| **Invite link** | `/conclave/guided?token=X` or accept → redirect to `/campaigns/[slug]/landing` | "Who invited me? What's this campaign? One CTA—clear." |
| **Campaign link** | `/campaign` or `/campaign/lobby?ref=bruised-banana` | "8 hexagram portals. What do I pick? Why?" |

**Best first impression**: Invite → Campaign Landing → "Accept your first quest." One card, one CTA, one quest.

**Worst first impression**: Dashboard with Explore / Character / Campaign modals, Get Started block, Journeys, Active Quests, Graveyard, Charge Capture, Daily Check-in—all at once.

---

## 3. Things Most Likely to Turn New Users Off

### 3.1 Cognitive Overload

- **Dashboard sprawl**: Nation, Archetype, Vibeulons, Play the Game (Explore/Character/Campaign), Get Started (5 links), Onboarding Checklist, Incomplete Setup banner, Journeys (threads + packs), Active Quests, Graveyard, Action Buttons.
- **Jargon**: BARs, Vibeulons, Conclave, Kotter stage, Epiphany Bridge, Emotional First Aid, 321 Shadow Process, Gameboard, Game Map.
- **No single "do this next"**: Many options, no clear priority. "Complete your first quest" vs "Create BAR" vs "Campaign Lobby" vs "Game Map" — all compete.

### 3.2 Fragmented Campaign Experience

- **Campaign landing exists** (`/campaigns/[slug]/landing`) but most users don't land there. Default flow goes to dashboard.
- **Campaign Lobby** shows 8 hexagram portals. New users don't know what a hexagram is or why they'd pick one.
- **Campaign modal** (Explore → Campaign) is buried. Starter quests are listed but the path to *do* them is unclear.
- **"Enter the Flow"** after ritual completion goes to dashboard—same sprawl.

### 3.3 Weak Completion Payoff

- **Complete a quest** → You get vibeulons. No "Your action helped X" or "2 setup helpers confirmed."
- **Visible impact** exists in code but feels abstract. No campaign-level story of what changed.
- **Next quest** is buried in thread UI or gameboard. No "Here's your next quest" moment.

### 3.4 Stuck Without Clear Path

- **"I'm stuck"** is in QuestDetailModal, expanded by default—good. But the link to EFA or 321 is one of many links.
- **Friction types** (confusion, fear, overwhelm) are recorded—good. But the *transition* from stuck → cleanup → next action is not a single, obvious flow.
- **BAR → Quest bridge** exists (NextActionBridge) but the "What is the next smallest honest action?" moment is easy to miss.

### 3.5 Inviter Invisibility

- **Inviter** is shown on campaign landing and sometimes "Invited by X" on dashboard. But if you arrive via generic signup, you never see an inviter—and the social pull is missing.
- **Campaign as person** ("why it matters") exists in Instance.targetDescription but is not consistently surfaced in one place.

---

## 4. Weakest Part of the Loop (and Its Impact)

### The Weakest Link: **Landing → First Quest → Completion → Impact**

| Step | Ideal | Current | Impact on New Users |
|------|-------|---------|---------------------|
| **Land** | One card: campaign, inviter, first quest CTA | Dashboard sprawl or 8 portals | **Confusion**: "What am I supposed to do?" |
| **Accept** | One click: "Accept your first quest" | Quests appear in threads; no explicit accept | **Ambiguity**: "Do I have a quest? Where is it?" |
| **Complete** | Clear success: vibeulon + "Your action helped X" | Vibeulon only; no campaign impact story | **Flat payoff**: "I did it… so what?" |
| **Continue** | "Your next quest: [Name]" | Thread advances; gameboard has slots; no single next | **Drift**: "What do I do now?" |

**The core weakness**: **The loop does not close with a clear "you did something that mattered" beat.** Completion feels like a checkbox, not a contribution. And the "next" step is scattered across threads, gameboard, and dashboard.

**Impact on potential players**:
- **Drop-off at landing**: Too many options → bounce.
- **Drop-off after first quest**: No visible impact → "This doesn't feel meaningful."
- **Drop-off when stuck**: "I'm stuck" exists but the path to unblock (EFA → BAR → next action) is not a single, obvious flow.
- **Never return**: No "one next quest" suggestion → no reason to come back.

---

## 5. Recommendations for a Tighter UX Loop

### 5.1 Make the Golden Path the Default Spine

- **Invite-first**: When someone arrives via invite, send them to `/campaigns/[slug]/landing` and keep them there until they click "Accept your first quest."
- **Dashboard-first**: When someone arrives via direct signup, show **one** primary CTA: "Your first quest" or "Enter the campaign." Defer Explore, Character, Campaign modals until after first completion.
- **Single next action**: After completion, show a card: "Your next quest: [Name]" with one button. No competing links.

### 5.2 Strengthen the Completion Beat

- **Visible impact**: "Your action contributed to [Campaign]. 2 setup helpers confirmed." (Already in spec; ensure it's prominent.)
- **Campaign progress**: Show a simple "Campaign progress" (e.g. "3 of 12 quests completed this week") so completion feels collective.
- **Next quest CTA**: Completion card should include "Continue → [Next Quest Name]" as the primary button.

### 5.3 Reduce Dashboard Sprawl

- **Progressive disclosure**: Show only what's needed for the current step. "Get Started" and "Explore" can appear after first quest completion.
- **One primary CTA**: "Your active quest" or "Accept your first quest" should be the hero. Everything else is secondary.
- **Journeys** as a secondary section: Don't lead with threads—lead with "Do this one thing."

### 5.4 Simplify Campaign Entry

- **Campaign Lobby**: For new users, consider a single "Enter the campaign" instead of 8 hexagram portals. Portals can be revealed after first completion.
- **Campaign modal**: When campaign entry is shown, the primary CTA should be "Start your first quest" → lands on quest, not lobby.

### 5.5 Stuck → Unblock as One Flow

- **"I'm stuck"** → "What kind of stuck?" (friction type) → "Try Emotional First Aid" or "321 Shadow Process" → "Suggested next action: X" → "Apply to quest."
- Make this a **single, linear flow** in the UI, not scattered links.

---

## 6. Summary: One-Loop Principle

**The main game loop** should feel like:

> **Land → One quest → Complete → See impact → Next quest.**

Today it feels like:

> **Land → Many options → Pick something → Complete → Vibeulon → Now what?**

**The fix**: Treat the golden path as the spine. Everything else (portals, game map, library, daemons) supports it—or is deferred until the loop is established. A new user who completes one quest with visible impact and sees "Your next quest: X" is far more likely to return than one who sees a dashboard with 12 links and no clear next step.
