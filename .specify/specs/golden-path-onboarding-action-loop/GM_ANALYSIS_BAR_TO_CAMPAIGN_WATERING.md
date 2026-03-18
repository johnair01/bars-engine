# Game Master Analysis: BAR → Campaign Watering

**Purpose**: Six-face analysis of the watering implementation. Something feels off. The GM faces surface what might be hitting weird.

---

## Shaman (Mythic threshold, belonging)

**The ritual**: Seed → Water → Bloom. The metaphor is strong. But *who crosses the threshold?*

- Admin creates the seed. Admin promotes. The *player* waters—but we never clearly said who waters. The implementation assumes: the creator (admin) waters their own seed, or a player with a campaign seed waters it.
- **The weird**: The threshold is blurred. Is the campaign *entering the world* when the seed is created? When it's watered? When it blooms? The mythic moment—the crossing—is diffuse. We have three gates (create, water, promote) but no single "you have crossed" beat.
- **Belonging**: A campaign that blooms is... empty. No adventures, no gameboard, no portal. The Instance is a shell. Where does the player *belong* after watering? They've done the work, but the world they've helped create doesn't yet have a place for them.

---

## Regent (Order, structure)

**The structure**: 6 faces, 6 quests, wateringProgress booleans. Clean.

- **The weird**: We advance a boolean. We don't store *what they wrote*. The quest has an input: "Share your response." That response—the actual structure (the threshold story, the rules, the first action, the blueprint, the coalition, the integration)—is submitted and then... discarded. We only keep "shaman: true." The *content* of the watering is lost. The structure we're building is proof of completion, not the structure itself.
- **Implication**: The campaign that blooms has narrativeKernel = bar.description (the original seed). The 6 faces of content—what the waterer actually contributed—never make it into the Instance. The watering is performative, not constitutive.

---

## Challenger (Proving ground, action)

**The proving**: Complete 6 quests. Each is a form: "Share your response."

- **The weird**: "Define the first action" is a *meta* quest. You're describing what the first action would be—you're not *doing* it. The Challenger face is about edge, action, proving. But the watering quests are *about* the campaign, not *in* the campaign. There's no proving *in* the world. It's all preparation. The first real action—playing the campaign—happens after promotion, and we didn't wire that.
- **Gap**: Watering is metabolic (building the thing). Playing is the game (doing the thing). We built the metabolic layer but didn't connect it to the play layer. The Challenger wants: "Do the thing." We gave: "Describe the thing."

---

## Architect (Blueprint, strategy)

**The blueprint**: 6 faces map to campaign structure. Shaman=story, Regent=rules, Architect=quest map, etc.

- **The weird**: When we promote, we create an Instance with: slug, name, targetDescription, narrativeKernel, allyshipDomain, kotterStage 1. We do *not* create adventures, gameboard slots, or portal content. The Architect face says "Map the blueprint"—but the blueprint they map (in their response) is never used. We don't parse it, store it, or migrate it into the Instance. The bloom is a skeleton. The real architecture—adventures, quests, domains—is done elsewhere (admin campaign author, etc.). So the watering is a *gate* (you must complete 6 steps) but not a *source* (the steps don't produce the architecture).

---

## Diplomat (Weave, relational)

**The coalition**: "Invite the coalition" — who's in, who do you want, community scope.

- **The weird**: We ask. They answer. We throw the answer away. There's no mechanism to actually invite anyone. No invite creation, no coalition formation. The most relational face—who's with us—is the least implemented. The campaign blooms with no people in it. The Diplomat's work is purely ceremonial.
- **Deeper**: A campaign is a *we*. Watering is framed as individual (one player, one BAR). But a campaign is collective. The metaphor of "watering a seed" is solo. The bloom should be "we." The implementation never makes that turn.

---

## Sage (Integration, whole)

**The integration**: All 6 complete → promote. The Sage moment = the whole is ready.

- **The weird**: Promotion is an *admin action*. The player who watered doesn't get "Your campaign is live." The admin clicks "Promote" in the admin panel. The Sage moment—the emergence of the whole—is invisible to the waterer. The loop doesn't close for them. They completed 6 quests... and then what? They're not told. They don't see the bloom. The integration is an admin secret.
- **Flow**: Player waters → all 6 done → ... silence. Admin promotes later. The player's journey has no denouement.

---

## Synthesis: What's Hitting Weird

### 1. **The water is lost**

We record that watering happened (booleans). We don't keep what the water was (the responses). The metaphor says: water nourishes the seed. But we're not storing the nourishment—only the fact that someone showed up with a watering can. The seed grows the same regardless of what they poured.

### 2. **Watering is about, not in**

The quests are *about* the campaign (describe the threshold, describe the rules, describe the first action). They're not *in* the campaign (cross the threshold, follow the rules, do the first action). The metabolic layer is fully meta. The game layer is disconnected.

### 3. **The bloom is empty**

Promotion creates a minimal Instance. No adventures, no quests, no gameboard. The "whole campaign" is a shell. The watering was supposed to add structure. It added checkmarks. The structure—the actual content—isn't coming from the watering.

### 4. **Ownership and agency are blurred**

Admin creates. Admin promotes. Player waters. Who owns the campaign? The creatorId is the admin. The waterer is... a contributor whose contribution we don't persist. The plan said "Player agency: players can create and water." But create is admin-only. Water is the only player move—and we don't keep what they did.

### 5. **The loop doesn't close for the player**

Complete 6 → ... → Admin promotes (maybe). The player has no "your campaign is live" moment. No invitation to play. No visible impact. The main loop (complete → impact → next) breaks at the watering layer.

---

## What Would Make It Feel Right?

- **Store the water**: Persist each face's response to the BAR (e.g. `wateringContent: { shaman: "...", regent: "..." }`). Use it at promotion to populate Instance fields.
- **Close the loop**: When all 6 complete, auto-promote or notify. Give the waterer the "your campaign is live" moment. Invite them in.
- **Make watering constitutive**: The responses should *become* the campaign—narrativeKernel from Shaman, structure from Regent, first quest from Challenger, etc. Migration, not just gating.
- **Relational turn**: Diplomat's "Invite the coalition" should create invites or mark who's in. The bloom should have people.
- **Prove in the world**: Challenger could be "Do the first action" — a real quest in the campaign, not a description of one.

---

## One-Line Diagnosis

**We built a gate (6 checkmarks) but not a metabolism (the content of the watering never becomes the campaign).** The metaphor promises growth; the implementation only records attendance.
