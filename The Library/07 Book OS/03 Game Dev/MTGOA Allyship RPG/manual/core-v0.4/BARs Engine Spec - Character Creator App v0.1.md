# BARs Engine Spec - Character Creator App v0.1

Status: product/app spec

Purpose: define a bars-engine app version of MTGOA student creation as a choose-your-own-adventure character sheet.

Related manual artifact:

- `Chapter 3 Prose Draft - Create Your Student v0.1.md`

## Product Goal

Build an interactive character creation flow that lets a player create a Student Record by choosing, rolling, or answering prompts step by step.

The app should feel like an admission interface aboard the school-ship, not a generic web form.

The player should finish with:

- a complete Student Record
- a printable/shareable character sheet
- a short admission summary
- saved structured data for future play, campaign packets, and advancement

## Core Experience

The flow is choose-your-own-adventure with two modes at each reflective step:

- **Choose:** the player picks the prompt, option, or answer that already resonates.
- **Roll:** the app rolls a table and provides context, examples, or a partial sentence the player can accept, edit, or reroll.

The app should never force deep introspection as a blank page.

It should always offer a handle.

## Voice

Use the same two-voice system as the manual:

- Regent voice for official instructions and step framing
- Council of Joannes marginalia for warnings, snide clarification, and real-talk

Example:

Regent:

> The ship noticed you before you noticed it. Select three Admission Prompts, or allow the admission office to produce a procedurally adequate provocation.

Council note:

> "Procedurally adequate provocation" means roll the table if your brain has become furniture.

## User Flow

## 1. Start Admission

Player chooses:

- Quick Build
- Full Admission

Quick Build creates a playable student in fewer steps.

Full Admission exposes every prompt and relationship field.

## 2. Admission Prompts

Player chooses at least three Admission Prompts.

For each chosen prompt, the player may answer freely or roll 1d6 on that prompt's option table.

Each prompt includes:

- prompt text
- six rollable answer scaffolds
- context paragraph for each scaffold
- example answer
- optional "make it stranger" button
- optional "make it more grounded" button

Data captured:

- selected prompt ids
- player answers
- whether answer was chosen, rolled, or edited from a suggestion

## 3. Name, Vibe, Arrival

Fields:

- name
- pronouns
- age band
- look
- personal object
- first impression
- arrival rumor
- arrival detail

Support:

- choose from list
- roll list
- free text

## 4. Allyship Gift

Options:

- Signal Gift
- Spark Gift
- Shelter Gift
- Pattern Gift
- Bridge Gift
- Horizon Gift

Each option displays:

- identity invitation
- starting edge
- risk
- prompt

Player may:

- choose directly
- answer 2-3 preference questions and receive a recommendation
- roll randomly

## 5. House

Options:

- Provisioners
- Weavers
- Linekeepers
- Lanternbearers

Each option displays:

- direct-address prose
- what you gain
- shadow
- House prompt
- Trust / Heat prompt

Data captured:

- House
- friend/rival
- Trust or Heat target

## 6. School Triangle

Player selects:

- Home School
- Curiosity School
- Avoided School

Schools:

- Body / Sense
- Line / Act
- Oath / Steady
- Pattern / Shape
- Bridge / Tend
- Horizon / Speak

Validation:

- default: three distinct Schools
- allow override if a campaign packet permits exceptions

Data captured:

- Home School
- Curiosity School
- Avoided School
- lieutenant contact
- three prompts

## 7. Stats

Player assigns:

- +2 to one stat
- +1 to two stats
- 0 to two stats
- -1 to one stat

Stats:

- Sense
- Act
- Steady
- Shape
- Tend
- Speak

App support:

- drag-and-drop values
- suggested spread based on Gift, House, School, and Belief
- warning if player accidentally duplicates a value outside the allowed spread

## 8. Ensemble Role

Options:

- Spark
- Anchor
- Builder
- Scout
- Witness

Each option displays:

- function
- team gift
- risk
- starting move
- relationship prompt

App should allow multiple players in same campaign to choose the same Role.

If more than one player uses the app in a campaign room, show crew ecology:

- overlaps
- gaps
- suggested relationship questions

## 9. Self-Sabotaging Belief

Options:

- I'm Not Good Enough
- I'm Not Ready
- I Don't Belong
- I'm Insignificant
- I'm Not Worthy
- I'm Not Capable

Each option displays:

- what it sounds like
- how it helped
- how it distorts allyship
- trigger
- temptation
- wound move
- growth move
- relationship prompt

App support:

- choose directly
- roll
- answer "under pressure I..." questions for recommendation

## 10. Offer, Cost, Line, Bond

Each field supports:

- choose from examples
- roll from tables
- free text
- edit generated suggestion

The app should show the related move immediately after the player writes the field.

## 11. Crew Relationships

Player asks and answers:

- one trust question
- one concern question
- one need question

For solo character creation, app can generate placeholder NPC/student names.

For campaign room mode, app can target other player records.

## 12. Review And Admission Statement

App generates:

> I am ___, a ___ of the ___ House.
> I usually help by ___.
> I am training with the School of ___.
> Under pressure I start believing ___.
> My Line is ___.
> My Bond is ___.
> I am not ready because ___.
> I am here anyway.

Player can edit before saving.

## Output

The app produces:

- Student Record JSON
- printable character sheet
- markdown export
- admission statement
- crew relationship summary

## Data Model Sketch

```json
{
  "id": "student_uuid",
  "name": "",
  "pronouns": "",
  "ageBand": "",
  "look": "",
  "personalObject": "",
  "firstImpression": "",
  "arrival": {
    "detail": "",
    "rumor": "",
    "prompts": []
  },
  "gift": {
    "id": "",
    "name": "",
    "startingEdge": "",
    "risk": ""
  },
  "house": {
    "id": "",
    "name": "",
    "contact": "",
    "trustOrHeat": []
  },
  "schools": {
    "home": "",
    "curiosity": "",
    "avoided": "",
    "lieutenant": ""
  },
  "stats": {
    "sense": 0,
    "act": 0,
    "steady": 0,
    "shape": 0,
    "tend": 0,
    "speak": 0
  },
  "role": {
    "id": "",
    "name": "",
    "startingMove": ""
  },
  "belief": {
    "id": "",
    "name": "",
    "trigger": "",
    "temptation": "",
    "woundMove": "",
    "growthMove": ""
  },
  "features": {
    "offer": "",
    "cost": "",
    "line": "",
    "bond": ""
  },
  "resources": {
    "capacity": 3,
    "clarity": 0,
    "adversity": 0,
    "tension": 0,
    "growth": 0
  },
  "relationships": []
}
```

## Design Requirements

- Always let players choose, roll, reroll, or edit.
- Show the Student Record filling in as the player progresses.
- Keep official voice and marginalia visually distinct.
- Preserve incomplete answers as `Unknown` instead of blocking progress.
- Support Quick Build and Full Admission.
- Support future campaign packet overlays.
- Export cleanly to printable and markdown formats.

## Future Enhancements

- campaign room multiplayer creation
- House and School art/sigil integration
- recommended stats based on choices
- campaign packet-specific prompts
- teacher/lieutenant generator
- relationship web visualization
- advancement tracking
- session debrief integration
