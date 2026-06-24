# Design Handoff: The Crossing CYOA Campaign Landing Page

## Audience

This document is intended for Claude Design or another visual/product designer.

## Design Goal

Transform the current MVP support page into a **choose-your-own-adventure campaign experience**.

The current page has the right information in rough MVP form, but the vibe is wrong:

```text
Current vibe: Fill out a support form.
Desired vibe: Choose your role in the campaign and enter that path.
```

The page should feel like a public-facing mini BARS Engine experience:

```text
Story -> How To Play -> Choose A Path -> Role Page -> Move -> Contribution Saved As BAR
```

## Experience Principles

- The user should feel invited into play, not assigned homework.
- The page should not lead with ontology.
- The page should not feel like a form menu.
- The first click should feel like choosing a character role or campaign path.
- Each option should use the same visual/card logic as BARs and the Allyship Deck.
- The landing page should bring people closer to BARS Engine without making them learn BARS Engine first.

## Campaign Context

The Crossing is the community/homies route into the current ask.

Parent campaign:

```text
mtgoa-barn-raising
```

Important internal note:

```text
The Crossing is the community route into this ask: people already in Wendell's field helping raise the barn together.
```

This is **not user-facing copy**. It is internal positioning only.

User-facing framing should be simpler:

```text
Help Wendell get back on the road.
Choose the way you can help.
Every kind of support moves the campaign.
```

## Page Structure

### 1. Hero

Purpose:

Help people understand the immediate ask quickly.

Needed content:

- Campaign name: The Crossing
- Short plain-language statement: Wendell needs a reliable car.
- Parent link: Part of Mastering the Game of Allyship Launch + Barn Raising.
- Primary CTA: Choose Your Move.
- Secondary CTA: Read the full story.

Design note:

This should not look like a generic fundraising page. It should feel like the opening scene of a campaign.

### 2. Story Preview

The current story is too thin.

Landing page should include:

- Short story preview.
- Link to a separate full story page.

Proposed link:

```text
/campaign/the-crossing/story
```

CTA copy options:

- Read the whole story
- Why this matters
- What happened

The full story page should include:

- What happened with the car.
- Why the car matters practically.
- Why this moment connects to the larger launch + barn raising.
- What kind of help is most useful now.
- How people can participate without donating.

### 3. How To Play

Rename the current "How to Contribute" section to:

```text
How To Play
```

This section should explain the participation loop without saying too much BARS jargon.

Suggested copy direction:

```text
Pick the path that fits your real capacity.
Each path gives you a small move.
Your move creates evidence the campaign can follow up on.
```

Include inline links to each option/path.

Important:

The "How To Play" section should not be a dense paragraph. It should be a compact game instruction strip.

### 4. Choose A Path

The central interaction should be path selection.

The current role cards should become clickable cards that open a full path, not forms.

Desired interaction:

```text
User sees role/path cards
-> clicks a card
-> card opens with a short preview OR routes to role detail page
-> user enters full role page
```

MVP design can use accordion expansion on the landing page, but the desired product direction is dedicated role pages.

Proposed route pattern:

```text
/campaign/the-crossing/role/car-scout
/campaign/the-crossing/role/car-expert
/campaign/the-crossing/role/connector
/campaign/the-crossing/role/signal-booster
/campaign/the-crossing/role/encourager
/campaign/the-crossing/role/donor
```

## Path / Role Model

### Role Naming

Rename:

```text
Car Person
```

to one of:

- Car Expert
- Car Consultant
- Car Advisor

Current recommendation:

```text
Car Expert
```

Reason:

It is clearer and more immediately legible than "Car Person." It signals practical expertise without sounding too formal.

### Roles

The current six role paths remain:

- Car Scout
- Car Expert
- Connector
- Signal Booster
- Encourager
- Donor

Open design question:

The user said "all 4 options need to be listed." This likely refers to the four allyship domains:

- Gather Resources
- Raise Awareness
- Direct Action
- Skillful Organizing

Design recommendation:

Use four domain gates as the first organizing layer, then show the campaign-specific role paths within them.

Example:

```text
Gather Resources
-> Car Scout
-> Connector
-> Donor

Skillful Organizing
-> Car Expert

Raise Awareness
-> Signal Booster

Direct Action
-> Encourager
```

This lets the experience honor the four-domain BARS structure while still giving people plain-language campaign roles.

## Card Logic

All path cards should use the same design logic as:

- BAR cards
- Allyship Deck cards

Each card should include:

- Role name
- Allyship domain
- Tiny move
- Artifact created
- One sentence of impact
- Starter Allyship Deck card or cards

Each card should feel playable.

Avoid:

- form-first layouts
- generic web cards
- long descriptions
- "submit" as the first action

## Role Detail Pages

Each role page should answer:

```text
What is this role?
Why does it matter?
What moves can I make?
What should I do now?
How do I save this contribution?
```

Each role page should include:

- Role overview
- Related Allyship Deck moves/cards
- Concrete examples
- One primary next action
- Optional "save this as a BAR" / sign up for BARS Engine CTA
- Link to Superpower Quiz if the person does not know their role yet

### Allyship Deck Integration

Each role page should display relevant moves from the Allyship Deck.

Examples from the current role model:

Car Scout:

- `OPEN-GR-ARCHITECT`
- `WAKE-SO-ARCHITECT`

Car Expert:

- `SHOW-SO-ARCHITECT`
- `WAKE-DA-CHALLENGER`

Connector:

- `WAKE-GR-DIPLOMAT`
- `SHOW-GR-DIPLOMAT`

Signal Booster:

- `SHOW-RA-DIPLOMAT`
- `SHOW-RA-SAGE`

Encourager:

- `SHOW-DA-REGENT`
- `OPEN-GR-DIPLOMAT`

Donor:

- `WAKE-GR-DIPLOMAT`
- `SHOW-GR-ARCHITECT`

### Superpower Quiz Link

Each role page should include a soft fallback:

```text
Not sure this is your role?
Take the Superpower Quiz.
```

Purpose:

Help uncertain visitors self-identify without making the page feel like a personality quiz.

Design note:

This should be secondary to choosing a role, not the primary CTA.

### BARS Engine Signup

Role pages should invite people to sign up for BARS Engine so their contributions can be saved.

Suggested CTA language:

```text
Save this contribution
```

or:

```text
Create your BARS Engine account to track your support
```

Avoid:

```text
Fill out this form
```

### Donor Path

The Donor role needs a quick donation route.

Required:

- Fast Venmo CTA.
- Optional note that donations of time, expertise, temporary transportation, tools, or space also count.

Suggested CTA:

```text
Send Venmo
```

Secondary CTA:

```text
Offer another resource
```

The donor page should not make people navigate through an account flow before giving money.

## Navigation Model

Recommended page flow:

```text
/campaign/the-crossing
-> /campaign/the-crossing/story
-> /campaign/the-crossing/role/[role]
-> Superpower Quiz
-> BARS Engine signup
```

The landing page should remain easy to share on Facebook/Instagram.

## Copy Changes From Current MVP

Remove from user-facing page:

```text
The Crossing is the community route into this ask: people already in Wendell’s field helping raise the barn together.
```

Replace with:

```text
Every kind of help moves this forward.
Choose the path that fits what you can actually offer.
```

Rename:

```text
How to Contribute
```

to:

```text
How To Play
```

Replace form-first CTAs with path CTAs:

- Explore Car Scout
- Explore Car Expert
- Explore Connector
- Explore Signal Booster
- Explore Encourager
- Give or Offer Resources

## Visual Direction

The design should feel like:

- campaign map
- role selection screen
- deck draw
- small adventure portal

Not like:

- intake form
- generic donation page
- CRM lead capture
- marketing landing page

Possible visual metaphors:

- six cards on a campaign board
- four domain gates with role cards beneath
- choose-your-path adventure spread
- "draw your move" interaction

## Mobile Requirements

Mobile is likely the primary share surface from Facebook/Instagram.

Requirements:

- Hero CTA visible without needing to understand the whole page.
- Role/path cards readable as tappable choices.
- No text overflow.
- No horizontal scrolling.
- Role pages should be short and scannable.
- Venmo path should be one tap from Donor page.

## Open Questions For Wendell

1. When you said "all 4 options," do you mean the four allyship domains, four main help paths, or something else?
2. Should Car Person become Car Expert, Car Consultant, or Car Advisor?
3. What is the exact Venmo link/handle to use for the Donor path?
4. Where should the Superpower Quiz live today?
5. Should role detail pages collect contact info immediately, or first invite people to take a move and then save it?
6. What should be included in the full story page before this goes public?

