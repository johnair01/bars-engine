# Myths Read Diagnostic

## Requirements

- Add a public `Myths Read` diagnostic for Chapter 0 of Mastering the Game of Allyship.
- Present the flow as intro, twelve behavioral questions, and a result screen.
- Score answers exactly from the handoff: weighted raw/max/pct, peak tie-break, canonical order, floor rule, and strength labels.
- Result must show surfaced myth cards, a whole-board map, Emotional Alchemy charge capture, funnel CTAs, optional email save, and retake.
- Charge capture must ask what game the player wants to play with the emerged energy; do not route by emotion alone.
- Supported game doors: Shaman / Emotional Alchemy, Challenger / MythBusting, Regent / Map the Terrain, Architect / Build The System, Diplomat / RelationshipCraft, Sage / Build your own Allyship Campaign.
- Keep belief roots internal and do not display them on the result screen.

## Acceptance Criteria

- A visitor can open the route, start the quiz, answer all twelve items, and land on results.
- Back preserves answers.
- Result surfaces at least one myth and no more than three, with rank, strength, claim, diagnosis, chapter, and one move.
- Selecting a surfaced myth and charge flavor/intensity reveals a seeded BAR summary and a route label.
- Optional email save validates for `@` and swaps to a confirmation.
- The page links to the Allyship Deck sales surface, the Superpower quiz, and the book/manual path.

## Deferred

- Routing into exact live campaign scenes remains a follow-up once route targets are confirmed. The current slice saves the read and can seed a logged-in visitor's `charge_capture` BAR with the selected game face.
