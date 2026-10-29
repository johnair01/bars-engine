# Fixture: Metal → Water → Wood, “Activate Hope”

## Purpose

Falsify the proposed bridge between Thought Strings and Emotional Alchemy before a room, persistence model, or AI layer is built around it. This fixture tests deterministic derivation only; it does not assert what a player feels, what their words mean, or what action they should take.

## Player-language material

The player may freely create and connect:

`excitement → possibility → hope`

and later bud:

`wonder → poignance → hope`

Those are player-language triangles. They remain valid even if none of their words is mapped to Emotional Alchemy.

## Confirmed anchors

The player explicitly confirms these exact canonical states:

| Word | EA channel | Element | Altitude | Confirmation |
|---|---|---|---|---|
| `wonder` | Fear | Metal | satisfied (Wonder-Excitement) | confirmed |
| `poignance` | Sadness | Water | satisfied | confirmed |
| `joy` | Joy | Wood | satisfied (Bliss) | confirmed |
| `hope` | none required | — | — | player concept; a proposed anchor must not drive logic |

## Expected derivation

The EA engine must derive, with no language-model interpretation:

```text
Metal / Fear / satisfied
  -- Sheng: Deepen Value --> Water / Sadness / satisfied
  -- Sheng: Renew Vitality --> Wood / Joy / satisfied
  -- Ke: Activate Hope --------------------------------> Wood / Joy / satisfied
```

This is a teaching triangle, not a claim that `hope` is a fundamental EA channel. `Activate Hope` is the exact name of the existing Metal → Wood Ke move, and may be displayed as a candidate practice frame only after the player-selected anchors make the triad available.

## Contract

1. Free words, EA anchors, EA moves, and BAR outcomes are different record types.
2. A player word is never assigned an EA anchor by string matching, a model, or another player.
3. A proposed or declined anchor cannot contribute to a derived triad.
4. All three anchors must have the same altitude because the present Sheng/Ke move table preserves altitude across its edges.
5. The engine returns a stable, versioned move set for the same confirmed anchor set.
6. The engine may offer the three exact move frames; it never selects an action or BAR for the player.
7. A BAR receives only player-selected word IDs, confirmed anchor IDs, move IDs, and an authored action summary. It never receives a full harvest, private note, or charge history by default.

## Falsification cases

| Input condition | Required result |
|---|---|
| `hope` has a proposed Wood anchor only | No additional EA triangle or move card appears. |
| Water anchor missing | No Metal–Water–Wood triad appears. |
| Wood anchor is neutral while Metal and Water are satisfied | No triad appears; state mismatch is shown plainly. |
| Input anchor order changes | Same ordered triad and move IDs are returned. |
| Player removes a confirmation | The derived triad disappears; player-language triangles stay untouched. |

## First BAR candidate, if the player chooses it

The room may offer structured frames:

- **Deepen Value:** What matters enough here that you want people to encounter it?
- **Renew Vitality:** What small act would let this become more alive?
- **Activate Hope:** What concrete possibility do you want to make more available?

The player may discard, save a private seed, or author a BAR such as: “Invite three people into a small dojo test.” Nothing is planted automatically.
