# Campaign Lobby — Readability Pass & GM Analysis

**Goal**: People should feel like they're talking with an old friend.  
**Key question for the player**: "What do I feel like engaging with more deeply?"

---

## Sample Content (Current Outputs)

### Page Header
- **Title**: {campaignName} (e.g. Bruised Banana Birthday Residency)
- **Subtitle**: "⚡ Stage 1: Urgency — Choose a portal. Each reading is contextualized for this moment in the campaign."
- **Section label**: "8 Portals"

### Sample Portal Cards (path hints)

1. **Creative Power** (Architect face)  
   Flavor: "Creative Power: Rising Energy"  
   Path hint: "A dragon awakens. What had been hidden is now ascending. In the spirit of We need resources, This reading is a blueprint. The line that shifts is the one that reframes. Enter with a plan; leave with a better one."

2. **Patience** (Diplomat face)  
   Flavor: "Patience: Cultivate Patience"  
   Path hint: "Crows circle the skies. You seek to advance just when dangers are at their peak. In the spirit of We need resources, This hexagram weaves. The line that shifts is the one that connects. Enter with care; leave with a fuller heart."

3. **The Trial** (Challenger face)  
   Flavor: "The Trial: Conflict Management"  
   Path hint: "Do not undertake hazardous enterprises. Conditions are ominous. In the spirit of We need resources, This reading demands action. The line that shifts is yours to move. Enter ready to prove; leave with a win."

4. **Fellowship** (Shaman face)  
   Flavor: "Fellowship: Community, Generosity"  
   Path hint: "It is a time for relationship building. Seek out a community of shared interest. In the spirit of We need resources, The threshold calls. This hexagram reveals a moment of emergence—something beneath the surface is ready to surface. Enter with curiosity; leave with belonging."

5. **Modesty** (Regent face)  
   Flavor: "Modesty: Humility, Temperance"  
   Path hint: "Modesty brings success. In the spirit of We need resources, This hexagram names a structure. The line that shifts is the one that orders. Enter with a question; leave with clarity."

### CTA
- "Enter →"

---

## GM Analysis Notes

### Summary: Does it answer "What do I feel like engaging with more deeply?"

**Current state**: The path hints and header are **formal and strategic** rather than warm and inviting. They describe *what* each portal offers (blueprint, action, structure) but don't directly invite the player to ask themselves *what calls to them*. The key question is implied but not surfaced.

---

### Sage Synthesis

- **Tone**: Refined and mystical; creates distance rather than warmth. Needs colloquial phrases for camaraderie.
- **Engagement**: Path hints touch strategic directions but mildly touch personal significance. Need questions or prompts for self-reflection.
- **Suggestions**:
  - Path hints: Use imagery that evokes familiar, relatable experiences. E.g. "Just like an old friend sharing their wisdom, listen closely as the path unveils the dragon within."
  - Header: "Welcome, Traveler! Each portal holds secrets waiting for you - just like a story shared between old friends. What calls to your spirit today?"

---

### Shaman (Emotional Tone)

- **Current**: Enigmatic allure, stirs curiosity but creates distance from heart's warmth. Beckons the mind more than the heart.
- **Missing**: Shared laughter, fireside-of-memory warmth, familiar comfort. "Speak not just of plans and blueprints, but of shared secrets, inviting laughter, and rekindled connections."
- **Suggestion**: "As you travel through these portals, may the winds of old stories guide you, may the flames of camaraderie keep you warm."

---

### Diplomat (Relational / Refine Copy)

**Refined path hint example** (Architect face):

> Hey there, it's so good to see you! Imagine this: a dragon stirring from its slumber, bringing hidden treasures to light. That's kind of where we're at. In the spirit of gathering the resources we need, think of this reading as your blueprint. It's not just about having a plan—it's about finding that shift, the little tweak in perspective that can change everything. So, come in with your thoughts and ideas, and let's work together to leave with something even better. **What do you feel like diving into a bit more deeply?**

*(Note: Diplomat explicitly surfaces the key question at the end.)*

---

### Architect (Warm Blueprint Voice)

**Current**: "This reading is a blueprint. The line that shifts is the one that reframes. Enter with a plan; leave with a better one."

**Warmer**: "Hey there, think of this like blueprinting a fun home project: you start with a sketch, but as soon as you uncover that one surprising insight, your design evolves into something even cooler. Come with a plan, and leave with an inspired twist."

---

### Challenger (Warm Action Voice)

**Current**: "This reading demands action. The line that shifts is yours to move. Enter ready to prove; leave with a win."

**Warmer**: "Hey friend, this is your moment to shine. Step in with confidence, and let's see how you can turn this opportunity into a win."

---

### Regent (Warm Structure Voice)

*(Awaiting agent response. Inference: soften "names a structure" / "orders" into something like "helps you see the lay of the land" or "brings things into focus.")*

---

### Header Rewrite (Sage)

**Current**: "⚡ Stage 1: Urgency — Choose a portal. Each reading is contextualized for this moment in the campaign."

**Warmer**: "Hey there, dear traveler! Welcome to Stage 1: Urgency. It's time to choose a portal that speaks to you, with each path offering wisdom for this unique moment in our shared journey."

---

## Actionable Notes

| Element | Issue | GM Suggestion |
|---------|-------|---------------|
| **Header** | Formal, instructional | Add greeting ("Hey there"), frame as "choose what speaks to you" |
| **Path hints** | Third-person, declarative | Second-person, conversational; surface "what calls to you" |
| **"In the spirit of X"** | Feels bureaucratic | Softer: "as we gather resources" or weave into sentence |
| **"Enter with… leave with…"** | Formulaic, repeated | Vary by face; some faces can drop it |
| **Key question** | Implicit | Explicit: "What do you feel like diving into more deeply?" (page or per card) |
| **Hexagram essence** | Can be long/dense | Keep punchy; first clause often enough |

---

## Implementation (Done)

1. **Header**: Updated to "Hey there! ⚡ Stage N: {name}. It's time to choose a portal that speaks to you—each path offers wisdom for this moment in our shared journey."
2. **Key question**: Added "What do you feel like engaging with more deeply?" (italic, below header).
3. **Path hint templates**: Rewritten in warmer voice per GM suggestions.
4. **"In the spirit of"**: Replaced with "In this moment, {stageAction}." (lowercased).
5. **Line-clamp**: pathHint now uses `line-clamp-4` for longer hints.
