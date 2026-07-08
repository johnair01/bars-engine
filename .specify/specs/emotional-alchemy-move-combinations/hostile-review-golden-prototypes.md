# Hostile Review: Golden Scenarios and Move Card Prototypes v0.1

## Verdict

Promising test bench, but the first hostile review overcorrected.

The artifact succeeds at separating scenario, superpower, domain, and blocker. The review's first pass made a category error: it treated Show Up as external action only. Emotional Alchemy needs both **inner Show Up** and **outer Show Up**. Just because something is internal does not make it Clean Up, and just because something is external does not make it Show Up.

Better standard:

```text
Show Up = invest available capacity into an enacted artifact or commitment.
```

That artifact can be internal or external:

- **Inner Show Up:** a self-allyship artifact, inner boundary, permission, values bridge, self-trust note, inner exit, personal plan, or embodied commitment that changes how the player will meet the charge.
- **Outer Show Up:** an ask, message, agreement, boundary, handoff, interruption, resource movement, repair, public truth, or witnessed action in a relationship/campaign.

The core question is not "did this touch the external world?" The core question is "did this enact the transformed charge as capacity, rather than merely analyze it?"

## Critical Findings

| Severity | Finding | Where It Shows Up | Why It Matters | Remediation |
|---|---|---|---|---|
| P0 | The review needs an orientation field before judging completion. | MP02, MP04, MP06, MP08, MP09, MP13, MP16, MP18 | Without `internal` vs `external`, the reviewer misclassifies legitimate inner Show Up as "only prep." A self-trust note, inner permission, or personal boundary can be a real Show Up artifact if it invests capacity. | Add `Orientation: internal/external` to every prototype. Judge completion against that orientation, not against external action by default. |
| P0 | Emotional vectors are sometimes labels, not mechanics. | MP07, MP09, MP11, MP15, MP17, MP19 | The vector should determine what distance is being closed. Several moves could be recommended without knowing the emotional vector at all, which means the alchemy layer is ornamental. | Add a "Vector Mechanic" field: what changes in the charge because this move is done? Example: fear -> wonder creates one new option that lowers threat and increases agency. |
| P1 | Some prototypes still confuse analysis with enacted inner capacity. | MP04, MP10, MP14, MP18, MP20 | Naming impact, cost, consent, care, and distance can be Clean Up, but it can also become Show Up when it produces an enacted artifact the player will actually live from. The distinction is enactment, not inner vs outer. | Split each prototype into "pre-move processing" and "Show Up artifact/action." The artifact/action may be inner or outer, but must change what the player can now do or refrain from doing. |
| P1 | Domain output is sometimes weaker than superpower style. | MP11, MP14, MP20 | A domain should define the type of output. MP14 says Direct Action but reads like a grief/contact exercise. MP11 says Raise Awareness but only shares with one relevant person, which may be fine, but the awareness target is underdefined. | Add a domain-specific output noun to every card: ask, signal, boundary, handoff, route, agreement, public truth, support path, repair message. |
| P1 | Several moves lack a subject/recipient distinction. | MP02, MP04, MP08, MP09, MP13, MP16, MP18 | Allyship-for-self and allyship-for-others are both valid. The issue is not lack of an external counterparty; the issue is not naming whether the move serves self, other, or collective. | Require `Subject: self/other/collective` and `Orientation: internal/external`. If private, name the inner recipient or capacity being served. |
| P1 | "Same card" comparisons are under-specified. | MP01-MP03, MP08/MP10/MP20, MP06/MP13/MP19 | The test claims same card + different blocker = different move, but "Show Up + Gather Resources" is a card family, not an actual card ID or operation. | Attach prototypes to generated card IDs or explicitly say this layer cites card families rather than exact deck cards. |
| P2 | Catalyst / Coach remains unresolved and will create product confusion. | Superpower table, MP03 | The artifact uses both names, which is acceptable in design notes but not in player-facing cards. | Decide one display label. Recommendation: use Catalyst as player-facing label; keep `coach` as legacy/code key until migration. |
| P2 | Some drift tests are good but not operational. | Most prototypes | "Did I escalate?" or "Is this avoidance?" helps reflection but does not prevent bad play. | Convert drift tests into fail conditions or guardrail prompts. Example: "Do not do this move if you cannot name the person protected by the interruption." |
| P2 | GS11 is unused. | Scenario table | Restlessness was the original motivating example, but no prototype tests it. | Add at least two GS11 prototypes: one that moves restlessness to clean Joy, and one that translates Joy to Neutrality or Wonder. |
| P2 | Fear/Neutrality language is inconsistent with the canonical channel set. | GS01, GS08, MP16, MP17 | "Clean Fear" is fine as neutral Fear, but "fear -> peace" crosses into Neutrality satisfaction and should be explicit. | Use state notation beside plain language: `fear:dissatisfied -> fear:neutral`, `fear:neutral -> neutrality:satisfied`, etc. |

## Prototype-Level Notes

| ID | Keep / Fix / Cut | Hostile Note | Required Fix |
|---|---|---|---|
| MP01 | Keep | This is one of the stronger moves. It has consent, resource specificity, and an actual ask. | Change completion to "ask sent, opt-out included, response tracked" unless there is a named reason not to send. |
| MP02 | Fix | Useful Strategist move, but it needs orientation. If external, "ready to send" is incomplete. If internal, a bounded ask template can be a valid artifact if it creates capacity to ask. | Add orientation. External version sends/schedules; internal version creates a reusable ask constraint and names when it will be used. |
| MP03 | Keep | Clean enough. It closes distance through a small ask. | Define "low-risk" mechanically: one person, reversible ask, no deadline pressure. |
| MP04 | Fix | Could be inner Show Up or outer Show Up. A consent-aware truth statement may be a real Storyteller artifact if the move is internal; if external, it needs delivery or a principled withholding. | Add orientation. Internal completion: a truth/consent artifact the player commits to follow. External completion: bring it to the right room/person or withhold with a named protection reason. |
| MP05 | Keep | This actually interrupts a pattern. | Add a safety check: what relationship or mission trust must remain intact? |
| MP06 | Fix | Good organizing move. Private sequencing can be inner Show Up if it produces a personal operating artifact; group sequencing is outer Show Up. | Add orientation. Internal completion: personal decision path and next self-commitment. External completion: propose sequence and get owner/checkpoint agreement. |
| MP07 | Keep/Fix | Strong axis distinction from MP06. Connector + organizing makes sense. | Add a named counterparty on both sides of the handoff. |
| MP08 | Fix | Mapping an exit can be a valid inner Escape Artist Show Up if the blocker is inner captivity. For external obligations, it needs a communicated pause/refusal/renegotiation unless unsafe. | Add orientation and subject. Internal: name cage, clean exit, and what to carry forward. External: communicate or prepare a safe off-ramp. |
| MP09 | Fix | Off-fit Strategist + Direct Action works, but it risks becoming problem-solving theatre in both orientations. | Require the route to preserve agency. Internal: one option the self can genuinely choose. External: one option the affected person/group can choose. |
| MP10 | Fix | "Compost" is evocative and can be true inner Show Up if it produces a ritual/resource the player lives from. It becomes weak when it stays as self-processing. | Require a specific artifact: ritual, resource, repair script, or renewed action tied to the original care. |
| MP11 | Fix | Storyteller is right, but "short truthful recap" may be too light. | Require the recap to change a next action, ask, or morale condition. |
| MP12 | Keep | Strongest Direct Action prototype. | Add scope: interrupt the next repetition, not the whole system. |
| MP13 | Keep/Fix | Good same-vector/domain contrast. External version requires adoption by a group or decision owner. Internal version can be a personal prevention rule. | Add orientation and completion standard. |
| MP14 | Fix | This is close to sadness stabilization, but Direct Action is weak. | Make the distance-closing action concrete: send message, show up, visit, schedule, donate, make call, deliver object. |
| MP15 | Keep | Good Connector + Gather Resources expression. | Add consent language to the request for companionship/witness. |
| MP16 | Fix | Dashboard can be inner or outer. Internal dashboard preserves the player's capacity; external dashboard supports group decision. | Add orientation. External version shares with decision owner; internal version creates a decision rule for the player. |
| MP17 | Keep/Fix | Good contrast with MP16. | Name the resource and the trusted route; "support route" is too vague. |
| MP18 | Fix | Important, but "drafted or requested" is mushy unless the orientation is internal and the draft is the artifact that will govern future storytelling. | Add orientation. External: revise public frame or request change from owner. Internal: create a consent rule for what stories the player will/won't tell. |
| MP19 | Keep | Strong Connector-in-Organizing off-fit. It externalizes invisible labor into structure. | Add recipient/counterparty and an actual agreement target. |
| MP20 | Keep/Fix | Good alchemical repair move, but repair is high-stakes and can be misused. | Require impact ownership without demand for forgiveness; include "no reply required" option where appropriate. |

## Axis Bleed Audit

| Axis | Current Risk | Example | Fix |
|---|---|---|---|
| Scenario vs Domain | Some scenarios imply a domain so strongly that the domain stops doing work. | GS06 almost forces Direct Action. | Add at least one non-obvious domain version for strong scenarios, or mark them as domain-primary fixtures. |
| Superpower vs Domain | Strategist in Direct Action and Connector in Skillful Organizing are useful but need explicit off-fit handling. | MP09, MP19 | Add "natural/off-fit" field and explain why this off-fit is being tested. |
| Card vs Move | "Show Up + Domain" is too broad to prove same card tests. | MP01-MP03 | Use exact deck card IDs or define "card family" as the current abstraction. |
| Blocker vs Vector | Some blockers do the real differentiation while the vector is passive. | MP01-MP03 | Add vector mechanic and blocker mechanic separately. |
| Emotional Alchemy vs Allyship | Some cards are just solid allyship moves without visible emotional transformation. | MP02, MP06, MP13, MP16 | Require the move to name how the charge changes after completion. |
| Inner vs Outer Show Up | The first review incorrectly treats external contact as the proof of Show Up. | MP02, MP04, MP08, MP16, MP18 | Add orientation and artifact standard. Inner Show Up must produce an enacted artifact or commitment; outer Show Up must produce campaign/relationship contact. |

## Mechanical Standard For The Next Version

Every prototype should pass five tests:

1. **Vector Test:** Does the move use the emotional vector, or could it be recommended without knowing the charge?
2. **Distance Test:** What exact distance closes after the move: relational, material, narrative, structural, energetic, or protective?
3. **Enactment Test:** Does the move enact capacity as an inner artifact/commitment or an outer action/contact?
4. **Axis Test:** Can we tell what the superpower contributes that the domain does not?
5. **Shadow Test:** Is there a concrete fail condition, not just a reflective question?

## Recommended Remediation

Do not rewrite all 20 at once.

First, revise five prototypes into the final card grammar, with both orientation and subject named:

- MP01 Consent Bridge Ask.
- MP05 Interrupt The False Calm.
- MP08 Clean Exit Map.
- MP12 Pattern Interruption.
- MP19 Exit The Glue Role.

These cover resource, awareness, direct action, direct interruption, and organizing/handoff. If those five become mechanically crisp, the rest of the set will have a pattern to follow.

## Proposed Card Grammar v0.2

| Field | Purpose |
|---|---|
| Scenario ID | Which golden scenario is being tested. |
| State Vector | Canonical state notation plus plain language. |
| Superpower | The gift/style of impact. |
| Domain | The field of output. |
| Card Context | Exact deck card ID or declared card family. |
| Orientation | `internal` for self-allyship / inner move; `external` for world-facing allyship / outer move. |
| Subject | `self`, `other`, or `collective`. |
| Blocker | The obstruction that changes the move. |
| Pre-Move | Any Wake/Open/Clean/Grow step required before action. |
| Show Up Artifact / Act | The enacted inner artifact/commitment or outer contact/action. |
| Completion | Observable done condition. |
| Distance Closed | What changed because the move happened. |
| Shadow Fail Condition | When not to use this move or how it goes bad. |

## Bottom Line

The 20 prototypes are strong enough to review and weak enough to be useful. The corrected main standard is:

Show Up means the move must enact capacity.

Sometimes that enactment is external contact. Sometimes it is an inner artifact that changes what the player can now hold, choose, refuse, ask, protect, or practice.

If the player only named, drafted, mapped, or prepared, the card is not automatically wrong. It is wrong only if the naming/drafting/mapping/preparing does not become an enacted capacity or commitment.
