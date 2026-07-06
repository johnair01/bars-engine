# Hostile Review: Circumstance Story Tests

## Date

2026-07-04

## Review Target

Eight proposed story tests for the Emotional Alchemy route-hand system.

Each story is meant to test:

```text
circumstance -> present charge -> desired charge -> blocker -> route hand -> practice lens -> move recommendation
```

## Executive Finding

The proposed stories are directionally useful, but they are not yet strong enough as system tests.

They mostly test idealized cases where the vector is already obvious to the designer. That is not the real product problem.

The real product problem is:

```text
Can the system translate messy circumstance language into charge/vector/lens without smuggling in the answer?
```

Right now, several stories pre-bake the expected vector into the wording. That makes them good demonstrations but weak tests.

## Major Findings

### 1. The Stories Are Too Designer-Labeled

Many blockers already contain the concept we want the system to infer.

Examples:

- "I can’t receive the care inside this joy"
- "I don’t know where force belongs"
- "I don’t know where the aliveness is"

These are excellent internal phrases, but too clean for player input.

A real player is more likely to say:

- "Why do I feel sad when something good happens?"
- "I know something needs to be said, but I don’t want to blow it up."
- "Everyone is being reasonable and I’m bored out of my skull."

### 2. Present Charge Is Often Too Advanced

Several stories assume the player enters at a neutral/clean channel:

- `joy:neutral`
- `fear:neutral`
- `neutrality:neutral`
- `anger:neutral`

But we already believe most players enter through dissatisfaction.

The stories need two layers:

1. beginner entry: dissatisfied state
2. advanced entry: clean/neutral state

Otherwise we will overfit the test suite to advanced players.

### 3. Desired Charge Is Often Chosen To Prove The Move

Several stories set desired charge to match the vector we want to test.

That is okay for directed unit tests, but not enough for product testing.

Example:

```text
excited collaboration + missing old friend -> desired poignance
```

This tests `joy -> sadness`, but it does not test whether a player would choose poignance as a desired state.

We need a version where the desired state comes from a fixed satisfaction list:

- peace
- triumph
- poignance
- bliss
- excitement/wonder

Then we test whether route planning resolves the correct path.

### 4. Blocker-To-Lens Mapping Is Under-Tested

The current examples mention possible lenses but do not force hard distinctions.

We need stories where the same vector produces different lens recommendations based on blocker.

For example `joy -> sadness`:

| Blocker | Expected Lens |
|---|---|
| "I do not know why this good thing makes me sad." | Wake Up |
| "I cannot let myself feel the care in this." | Open Up |
| "I think needing this means I’m weak." | Clean Up |
| "I need to honor this without clinging." | Grow Up |
| "I know what this means and need to make contact." | Show Up |

Without this matrix, we are not really testing P1.

### 5. Some Expected Lenses Are Sloppy

Story 2 says Anger -> Fear could be `wake_up` or `grow_up`.

That ambiguity is fine for brainstorming, but bad for tests.

A golden story must have one expected lens and one reason.

If multiple lenses are plausible, create multiple variants.

### 6. Same-Channel Routes Are Underrepresented

The eight stories focus on translate vectors because those were recently built.

But the full loop depends just as much on:

```text
dissatisfied X -> neutral X
neutral X -> satisfied X
```

We need same-channel stories for:

- frustration -> anger -> triumph
- grief -> sadness -> poignance
- anxiety -> fear -> excitement/wonder
- restlessness -> joy -> bliss
- apathy/boredom -> neutrality -> peace

Otherwise we can test translation and still fail basic metabolism.

### 7. Domains And Superpowers Are Mostly Missing

The stories mention domains/superpowers only lightly.

But the product loop includes:

```text
allyship card -> domain/superpower context -> blocker -> move expression
```

We need to test whether the same vector changes expression under:

- storytelling
- skillful organizing
- direct action
- gather resources
- raise awareness

Do not mix these into one "scenario deck." Keep the tables clean:

```text
story fixture
domain fixture
superpower fixture
```

Then combine them intentionally.

### 8. Full Route-Hand Tests Need Card Count Assertions

The stories should explicitly assert expected card count:

- same-channel neutral -> satisfied: 1 card
- dissatisfied same-channel -> satisfied: 2 cards
- neutral cross-channel -> satisfied: 2 cards
- dissatisfied cross-channel -> satisfied: 3 cards

If this is not explicit, we may regress back into one-card-with-two-steps logic.

## Story-Level Review

### 1. Joy -> Sadness: Care Inside The Joy

Strongest story. Emotionally plausible and directly tests the renamed operation.

Weakness: blocker is too on-the-nose.

Better raw circumstance:

```text
I got invited into a collaboration I really want, and suddenly I miss the person I used to dream with. I keep trying to stay excited, but something in me gets quiet.
```

Expected:

- vector: `joy:neutral->sadness:neutral`
- operation: Find The Care In The Joy
- lens variant should change by blocker.

### 2. Anger -> Fear: Risk Before Force

Strong vector. Good practical use case.

Weakness: "I need to act, but I don’t know what risk my action creates" is too clean.

Better raw circumstance:

```text
I want to call this out in the group chat right now, but I can feel that if I do it badly someone vulnerable may get exposed.
```

Expected:

- vector: `anger:neutral->fear:neutral`
- operation: Risk Before Force
- likely lens: Grow Up if blocker is right-sizing force; Wake Up if blocker is locating risk.

Make two variants instead of one ambiguous test.

### 3. Neutrality -> Joy: Find The Live Part

Good test for avoiding false positivity.

Weakness: "I don’t know where the aliveness is" is designer language.

Better raw circumstance:

```text
The meeting is calm and orderly, but everyone feels flat. Nothing is wrong enough to fix, and yet nobody wants to be there.
```

Expected:

- vector: `neutrality:neutral->joy:neutral`
- operation: Find The Live Part
- lens: Wake Up if locating energy; Show Up if creating invitation.

### 4. Fear -> Joy: Edge Into Experiment

Good test for fear becoming play/experiment.

Weakness: "I’m afraid of being seen, but I want to try" may resolve as fear -> fear satisfaction rather than fear -> joy.

If desired state is wonder/excitement, same-channel fear transcend might be enough.

To force `fear -> joy`, the story needs participation as target:

```text
I want to tell the story publicly, not just survive being seen. I want it to become a shared experiment instead of a private fear test.
```

### 5. Neutrality -> Anger: Force Belongs Somewhere

Strong test. This is a real failure mode for "balanced" players.

Weakness: too designer-labeled.

Better raw circumstance:

```text
I can see everyone’s side so clearly that I keep saying nothing. Meanwhile the same harmful decision keeps moving forward.
```

Expected:

- vector: `neutrality:neutral->anger:neutral`
- operation: Find Where Force Belongs
- lens: Grow Up or Show Up depending blocker.

### 6. Joy -> Fear: Exposure In Possibility

Strong and important.

Weakness: may be confused with self-sabotage belief if the blocker is "people will see what I can’t do yet."

That is useful, but then expected lens should probably be Clean Up.

Better raw circumstance:

```text
This opportunity lights me up, but saying yes would make my actual limits visible. I keep wanting to overpromise so nobody sees the gap.
```

Expected:

- vector: `joy:neutral->fear:neutral`
- operation: Map The Exposure In The Possibility
- lens: Clean Up

### 7. Neutrality -> Sadness: What Matters In The Field

Strong field-to-care story.

Weakness: "staying abstract" is a good blocker but still somewhat advanced.

Better raw circumstance:

```text
When I look at the whole family situation, I can explain everyone’s position. But the moment I think about one neglected relationship, I go quiet and want to change the subject.
```

Expected:

- vector: `neutrality:neutral->sadness:neutral`
- operation: Find What Matters In The Field
- lens: Open Up or Clean Up depending blocker.

### 8. Dissatisfied Start: Restlessness -> Peace

Important route-count test.

Weakness: it tests routing more than move quality because `joy:neutral->neutrality:neutral` does not yet have a mechanic operation.

Expected:

```text
joy:dissatisfied->joy:neutral
joy:neutral->neutrality:neutral
neutrality:neutral->neutrality:satisfied
```

Gap revealed:

`joy:neutral->neutrality:neutral` is one of the 12 missing mechanic operations. This story should become a regression test after that operation is authored.

## Stronger Test Suite Shape

Replace the 8 loose examples with 12 golden story fixtures:

### A. Eight Authored Translate Operation Tests

One story for each existing mechanic operation.

Each fixture should include:

- raw circumstance text
- fixed present state
- fixed desired state
- blocker text
- expected route
- expected operation
- expected lens
- expected role
- expected card count

### B. Five Lens Variants For One Operation

Use `joy:neutral->sadness:neutral` because it is emotionally subtle.

Same vector, five blockers:

- Wake Up
- Open Up
- Clean Up
- Grow Up
- Show Up

This tests the blocker-to-lens selector.

### C. Five Same-Channel Metabolize/Transcend Tests

One for each channel.

These protect the basic emotional alchemy loop.

### D. Circumstance Translation Tests

These should be separate from route-hand tests.

Input:

```text
raw circumstance only
```

Expected:

```text
present dissatisfaction/neutral state
desired satisfaction state
blocker candidate
confidence
clarifying question if confidence is low
```

## Recommendation

Do not turn these stories into tests exactly as written.

First split them into two layers:

1. **Golden Route Fixtures**: clean expected state/vector/lens assertions.
2. **Raw Circumstance Fixtures**: messy player-language inputs that test future circumstance parsing.

The current stories are good seeds for both, but they currently mix the layers.

## Next Implementation Step

Create:

```text
src/lib/charge-metabolism/__tests__/golden-story-fixtures.test.ts
```

Start with:

- 8 authored translate operation fixtures
- 5 lens variants for Find The Care In The Joy

Do not yet test raw circumstance parsing until a circumstance parser exists.
