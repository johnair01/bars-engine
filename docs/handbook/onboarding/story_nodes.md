# Guided Onboarding Story Script

**Context**: The player has just created their account (email/password). They are now entering the fiction of the "Robot Oscars Heist".
**Guide**: A "Conclave Steward" (Tone: Helpful, slightly conspiratorial, Ocean's 11 meets Hitchhiker's Guide).

---

## Part 1: The Invitation

### Node 1: Welcome to the Conclave
**Guide**: "Ah, you made it. Keeping a low profile, I hope? The security for the Robot Oscars is tighter than a clam with trust issues this year."
**Content**: "Welcome to the Conclave. We've been expecting you. The big event is just around the corner, and frankly, we're short a few brilliant minds."
**Choices**:
- "I'm ready. What's the job?" -> Go to Node 2
- "Robot Oscars? Explain." -> Go to Node 1B

### Node 1B: Context (Optional)
**Guide**: "Only the most prestigious gathering of construct technology in the galaxy. And the perfect place for a... reallocation of assets."
**Content**: "We're here to pull off the heist of the century. But first, we need to get you processed."
**Choices**:
- "Let's get started." -> Go to Node 2

---

## Part 2: Identity

### Node 2: Who Are You?
**Guide**: "I have your invitation here, but the ink is a bit smudged. Smells like... motor oil and expensive cologne."
**Content**: "What name should I put on your dossier? This is how the other heist members will know you."
**Input**: Name / Agent Designation
**Action**: Save Name
**Next**: Go to Node 3

---

## Part 3: Nation Selection (The World Setting)

### Node 3: The Five Nations
**Guide**: "Now, about your allegiance. The Conclave is a joint effort, but we all come from somewhere. Which flag feels like home?"
**Content**: "There are five nations in the alliance. Each has a different philosophy on how to approach the world—and this heist."
**Choices**:
- "Tell me about the nations." -> Go to Node 4

### Node 4: Nation Overview (Carousel/Menu)
**Guide**: "Take a look. Which story calls to you?"

**Option A (Argyra)**: "The Silver City. Architects of precision."
- *Preview*: "Logic, reflection, clarity."
- *Select*: Go to Node 5A

**Option B (Pyrakanth)**: "The Burning Garden. Gardeners of fire."
- *Preview*: "Passion, intensity, transformation."
- *Select*: Go to Node 5B

**Option C (Virelune)**: "The Green Moon. Joyful growers."
- *Preview*: "Joy, spontaneity, expansion."
- *Select*: Go to Node 5C

**Option D (Meridia)**: "The Golden Noon. Voice of balance."
- *Preview*: "Fairness, trade, clarity."
- *Select*: Go to Node 5D

**Option E (Lamenth)**: "The Weeping Stone. Keepers of memory."
- *Preview*: "Poignance, beauty, meaning."
- *Select*: Go to Node 5E

### Node 5A-E: Nation Deep Dive & Confirmation
*(Use the content from `docs/handbook/nations/*.md`)*

**Example (Virelune)**:
**Guide**: "Ah, Virelune. You prefer to grow around obstacles rather than smash them. Respect."
**Content**: "The Green Moon rises. You value joy as the fuel for expansion. In this heist, you'll be the one finding unexpected paths."
**Choices**:
- "This is me. I choose Virelune." -> Save Nation -> Go to Node 6
- "Let me see the others." -> Back to Node 4

---

## Part 4: Playbook Selection (The Archetype)

### Node 6: The I Ching Archetypes
**Guide**: "We know where you're from. Now... who are you? In the heat of the moment, how do you solve problems?"
**Content**: "The Conclave recognizes 8 archetypes based on the I Ching trigrams. This defines your role in the crew."
**Choices**:
- "Show me the archetypes." -> Go to Node 7

### Node 7: Archetype Selection
*(Presented in groups or a gallery)*

**Group 1: The Movers**
- **Heaven (The Bold Heart)**: "I start things. Now."
- **Thunder (The Decisive Storm)**: "I strike at the perfect moment."

**Group 2: The Connectors**
- **Earth (The Devoted Guardian)**: "I support and protect."
- **Lake (The Joyful Connector)**: "I bring us together."

**Group 3: The Shifters**
- **Wind (The Subtle Influence)**: "I change things gently."
- **Water (The Danger Walker)**: "I flow through chaos."

**Group 4: The Anchors**
- **Mountain (The Still Point)**: "I wait. I hold."
- **Fire (The Truth Seer)**: "I see what's real."

**Choices**: Select a Playbook -> Go to Node 8 (Confirmation)

### Node 8: Playbook Confirmation
*(Use content from `docs/handbook/playbooks/*.md`)*

**Example (Thunder)**:
**Guide**: "The Decisive Storm. Remind me to stay out of your way when you make a move."
**Content**: "You act when the moment is right. In this heist, you'll be the one breaking stalemates."
**Choices**:
- "Confirm Archetype." -> Save Playbook -> Go to Node 9
- "Let me reconsider." -> Back to Node 7

---

## Part 5: Conclusion

### Node 9: You're In
**Guide**: "Updates complete. Dossier looks good. [Name] of [Nation], the [Playbook Archetype]. Has a nice ring to it."
**Content**: "The crew is assembling. Your personal construct is fueled and ready. The Robot Oscars won't know what hit them."
**Choices**:
- "Enter the Conclave." -> Redirect to Dashboard
