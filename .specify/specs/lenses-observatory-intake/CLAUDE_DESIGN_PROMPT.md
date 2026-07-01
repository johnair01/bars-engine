# Paste this into Claude Design

Design a mobile-first prototype for **Lenses Goal-Setting Onboarding** in BARs Engine.

BARs Engine is a dark, contemplative game-like practice app. This prototype is not a marketing page and not the final implementation. It should help us feel the user flow before we build schema, actions, and real persistence.

The product goal: a new player moves from a vague sense of what they are moving toward into a year-level goal frame across five domains:

- Relationships
- Career
- Money
- Health
- Allyship

The flow should feel humane, imaginative, and grounded. It borrows lightly from Wishcraft-style dreaming, aligns with the Fasttrack/Lenses planning document, uses the player's Allyship Superpower to suggest possible goals, and connects lower-level actions back to higher-level goals.

Tap the Vein remains the daily execution surface. This Lenses prototype is the upstream goal-imagining and goal-setting surface.

## Design System

- Background: `#0a0908` warm near-black
- Surface: `#14151a` / `#1a1a18`
- Text: `#e8e6e0`
- Muted text: `#a09e98` / `#6b6965`
- Liminal accent: `#7c3aed`
- Secondary accents may be subtle and domain-specific, but avoid rainbow chaos.
- Fonts:
  - Jost for headings/buttons
  - Nunito for body copy
  - Space Mono for labels/metadata
- Card radius: 8-12px.
- Tone: clear, warm, imaginative, practical. No hype. No productivity-bro copy.

## Prototype Principles

- Build the usable app flow as the first screen, not a landing page.
- The player begins vague and leaves with an authored year frame.
- Suggestions are editable, rejectable, and obviously not assignments.
- Parked goals feel like wise focus, not failure.
- The flow should not feel like filling out a tax form.
- Do not create shame, urgency, streak pressure, or "you are behind" language.
- Do not auto-create BARs from every task in this prototype. Show the later BAR handoff conceptually.

## Core Flow

### Screen 1: Entry After Superpower

Context:

- Player has completed the superpower quiz.
- Example result: `Connector`, secondary `Storyteller`.
- Orientation may be internal/external if useful.

Design:

- Header: `Lenses`
- Title: `Let’s imagine the year you’re moving toward.`
- Copy: `Your superpower is a lens, not a sentence. We’ll use it to suggest goal shapes you can edit or reject.`
- Show a compact superpower chip/card:
  - `Connector`
  - `Second wind: Storyteller`
  - `Use this as a suggestion lens`
- Primary CTA: `Begin Lenses`
- Secondary CTA: `Choose without quiz`

### Screen 2: Vague Movement

Purpose:

Start with desire before goals.

Prompts:

- `What are you moving toward?`
- `What would feel different if this year worked?`
- `What satisfaction feeling are you actually after?`

UI:

- One large text area for vague movement.
- Feeling chips: `alive`, `settled`, `connected`, `free`, `proud`, `clear`, `generous`, `relieved`.
- Bottom CTA: `Dream across the five lenses`

### Screen 3: Ten-Minute Dreaming Across Domains

Purpose:

A humane dreaming surface before narrowing.

Layout:

- Mobile-first carousel or vertical stack of five domain cards.
- Each domain card has one prompt and a short dream note area.
- A subtle timer/progress label may say `10 minute dream pass`, but do not make it stressful.

Domain cards:

1. Relationships
   - Prompt: `Who are you with? What is the quality of contact?`
2. Career
   - Prompt: `What are you making, practicing, selling, serving, or becoming known for?`
3. Money
   - Prompt: `What flow of income, stability, generosity, or receiving would change your life?`
4. Health
   - Prompt: `What body, energy, rhythm, and practice would carry you?`
5. Allyship
   - Prompt: `Who is better off because you showed up?`

CTA after all five:

- `Show me possible year goals`

### Screen 4: Superpower-Based Goal Suggestions

Purpose:

Turn dream notes into editable year goal options.

Use example player:

- Superpower: Connector
- Secondary: Storyteller

Show five sections, one per domain. Each section has 2-3 goal suggestion cards.

Example suggestions:

Relationships:

- `Build a weekly repair/check-in ritual with Ari.`
- `Create a home rhythm that makes closeness easier to return to.`

Career:

- `Publish and tour Mastering the Game of Allyship as a relationship-building body of work.`
- `Build a podcast/interview rhythm that turns the book into real conversations.`

Money:

- `Create a simple monthly income mix that feels stable and honest.`
- `Build a book/deck/coaching sales rhythm that supports $10,000/month.`

Health:

- `Build a daily Tai Chi/Qi Gong practice that gives the work a body.`
- `Make movement and meditation ordinary enough to survive busy weeks.`

Allyship:

- `Enroll 100 people into an Allyship Dojo practice container.`
- `Create a recurring dojo where people practice their allyship superpowers together.`

Each suggestion card needs:

- `Use this`
- `Edit`
- `Park`

Important:

- The player can type their own goal.
- Avoid making the suggestions feel generated by a mysterious authority.
- Include a small line: `Suggested from your Connector lens and your dream notes.`

### Screen 5: Year Lens Review

Purpose:

Player sees their authored yearly goals across the five domains.

Use sample goals:

- Relationships: `Living with Ari`
- Health: `Practicing Tai Chi and Qi Gong daily`
- Allyship: `100 people enrolled in the Allyship Dojo`
- Career: `10,000 Mastering the Game of Allyship books sold`
- Money: `$10,000/month income`

UI:

- Five domain rows or compact cards.
- Each card shows:
  - domain,
  - goal title,
  - satisfaction payoff,
  - status: `active` or `parked`.
- Allow edit inline or via bottom sheet.

CTA:

- `Derive quarterly goals`

Secondary:

- `Save year frame`

### Screen 6: Quarterly Descent

Purpose:

Show how lower-level goals inherit from the yearly domain goal.

Use one expanded domain example, with others collapsed.

Expanded Relationships example:

Parent:

- Yearly / Relationships: `Living with Ari`

Quarterly candidates:

- `Beijing trip with Ari`
- `Spend a month together`
- `Emotional First Aid Workshop`
- `Life Book process`
- `Polarity Mapping`

UI:

- Parent goal pinned at top.
- Candidate quarterly goals as editable chips/cards.
- Button: `Add my own`
- Option: `Mark as maintenance`

CTA:

- `Build month from quarter`

### Screen 7: Monthly / Weekly Lineage

Purpose:

Show parent-child lineage clearly.

Example:

Yearly / Health:

- `Practicing Tai Chi and Qi Gong daily`

Quarterly / Health:

- `Weekly Qigong/Tai Chi practice`

Monthly / Health:

- `Sign up for Bruce Frantzis Qigong`

Weekly / Health:

- `Watch 5 Bruce Frantzis videos`
- `Practice Qigong`
- `Meditate`
- `Go on a walk`
- `Brush teeth 3x`

Design:

- A vertical lineage rail or breadcrumb:
  - Year -> Quarter -> Month -> Week
- Weekly actions shown as the first handoff to Tap the Vein.
- CTA: `Use this frame in Tap the Vein`

### Screen 8: Tap the Vein Handoff

Purpose:

Show how daily tasks become meaningful without flooding BARs.

Mock Tap the Vein daily selection:

- Header: `Tap the Vein · Today`
- Context chip: `Serving: Weekly Health -> Monthly Health`
- Keep up to five actions.
- Top 3 are visually marked as priority 1-3.

Show example daily kept actions:

- `Practice Qigong`
- `Reach out to 50 people about $50 donation`
- `Finish first chapter of MTGOA`
- `Have relationship check-in with Ari`
- `Make coaching sales page`

Each task card has a small goal attachment line:

- `Health -> Sign up for Bruce Frantzis Qigong`
- `Money -> Fundraiser for MTGOA goal`
- `Allyship -> First Allyship Dojo`

Per-task actions:

- `Keep as task`
- `Plant as BAR`
- `Upgrade to quest`
- `Park`

Copy:

- `Tasks stay light until you choose to plant them. BARs are for the pieces worth growing.`

### Screen 9: BAR Creation Confirmation

Purpose:

Show that a planted TTV task becomes a BAR with lineage.

Example:

- Task: `Practice Qigong`
- BAR title: `Practice Qigong`
- Lens: `Today`
- Goal lineage:
  - Weekly Health: `Practice Qigong`
  - Monthly Health: `Sign up for Bruce Frantzis Qigong`
  - Quarterly Health: `Weekly Qigong/Tai Chi practice`
  - Yearly Health: `Practicing Tai Chi and Qi Gong daily`

Plant gate asks lightly:

- Desired outcome: `Build a practice that carries me`
- Current dissatisfaction: `scattered / stiff / avoidant`
- Desired satisfaction: `grounded / alive / clear`

CTA:

- `Plant BAR`

Secondary:

- `Keep as task`

## Required Prototype States

Design these states:

1. New player with superpower result.
2. New player without superpower result.
3. Empty dream notes.
4. Suggestions generated from dream notes.
5. Player edits a suggestion.
6. Player parks a domain.
7. Yearly goals saved.
8. Quarterly descent from a yearly goal.
9. Weekly actions linked to monthly goal.
10. Tap the Vein handoff.
11. TTV task planted as BAR with lineage.

## Humane / Octalysis Guardrails

Use:

- Epic Meaning: `the year you are moving toward`
- Development and Accomplishment: visible lineage through year -> quarter -> month -> week -> today
- Empowerment: edit, reject, park, add your own
- Ownership: `your year frame`, `your authored lenses`
- Social Relatedness: optional Dojo/coaching support, not pressure

Avoid:

- streak UI
- red failure states
- `behind`, `overdue`, `failed`
- public sharing by default
- auto-generated obligations
- comparing domains against each other
- making all five domains feel equally urgent

## What Not To Design

- Do not design a public marketing page.
- Do not redesign the superpower quiz.
- Do not redesign the full Tap the Vein app.
- Do not create a separate daily planning workflow outside Tap the Vein.
- Do not make every TTV task automatically become a BAR.
- Do not add a giant analytics dashboard.
- Do not use bright productivity-dashboard aesthetics.

## Deliverables

Design a clickable prototype with:

1. Entry after superpower quiz.
2. Vague movement screen.
3. Five-domain dreaming screen.
4. Goal suggestions screen.
5. Year lens review screen.
6. Quarterly descent screen.
7. Monthly/weekly lineage screen.
8. Tap the Vein handoff screen.
9. BAR planting confirmation screen.

Prioritize mobile at 390px width. Include a desktop adaptation only if time allows.
