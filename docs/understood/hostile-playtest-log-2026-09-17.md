# Hostile playtest log — September 17, 2026

**Status:** six source-backed synthetic walkthroughs. These are rule and interface probes based on the preview source at `f5d6a4487`; no participant behavior or effectiveness score is claimed. The separate preview browser loaded `/understood/play` to the private setup screen. Further browser interaction and human sessions remain to be logged.

| Run | Journey point | Adversarial sequence | Source-backed outcome | What to test with people |
| --- | --- | --- | --- | --- |
| S1: small plan change | P2→P8 | Ari plays open anger, Bea pays to ask, Ari adds sad value to same stack on a later turn, both layers are heard, Ari spends one release cooling and one resolving. Bea resolves a delight chip. | Legal path. A two-layer stack blocks release until both chips are heard; heat and meter each need a separate release. This is what the tutorial teaches. | Do people understand why Ari's red chip remains trapped after it is heard? Does Bea learn the specific boundary? |
| S2: unsolved money shortage | P6→P8 | Both accurately repeat each other's needs, but their available funds cannot cover both priorities. Each marks a chip heard and selects **Resolve part of the issue** enough times to reach zero. | The app accepts the meter outcome; it records no decision, remaining constraint, or next action. This is intentionally subjective, but the current win condition can be met without practical issue progress. | Ask privately whether “heard” really moved the issue down a notch. At exit ask what decision exists outside the game. |
| S3: repeated question versus withdrawal | P3→P4 | One player asks about an open chip; the other says there is nothing more to tell. Repeat next turn. The other player passes while hot. | The offered chip transfers to the speaker each time nothing more is shared. The clock continues to cue a pass; there is no pause state. Asking again costs a new chip if available. | Does the transfer feel fair or like a penalty for needing time? Does passing lower pressure or feel like being chased? |
| S4: different communication styles | P2→P6 | One player makes a white observation, then later a black fear; the other needs explicit language to know which response would count as hearing. | The five prompts are available, and face choice controls invitation to ask. No interface step checks whether the listener understood the bid. Only the owner marks it heard. | Ask listener to paraphrase before the owner decides; note when a prompt needs rewording. |
| S5: exhausted hands | P5→P6 | Each player eventually places all 25 chips silently into stacks. All top chips remain sealed and unspoken; both hands are empty. | No open spoken chip exists to ask about. `speak()` requires a chip in hand; donate and trade also require one. No chip can be marked heard or released. Players can only pass forever. | How likely is a smaller scarcity trap? Does the need to solicit donation teach reciprocity or distract from the conflict? |
| S6: sealed chip control | P3 | Ari leaves a spoken chip face down. Bea takes the shared device, selects it, and taps **Flip to invite questions**. | `flip()` changes the selected chip without checking the owner or a handoff. The game cannot identify the physical actor; the button gives no owner-only cue. | Can a pair respect ownership without enforcement? Does the UI inadvertently invite Bea to flip Ari's chip? |

## Cross-run findings

1. **Hearing is overloaded.** It is both a subjective event and the sole currency for lowering heat or resolution. S1 makes the distinction legible; S2 shows how a resolution meter can be cleared while a practical constraint stays intact. The next version should test a short post-release question about what changed, without requiring typed disclosure.
2. **Scarcity can support curiosity until it removes every legal path.** S3 gives the asker a cost; S5 reveals a terminal state. A recovery move is needed if the chip economy can reach that state. It should preserve the point of limited chips.
3. **Owner control depends on social convention.** S6's face flip is exposed as a general button. Marking heard and private-meter peeks also depend on the correct person holding the shared device, though the latter has a deliberate cover and hold interaction.
4. **A pass is not a pause.** S3 shows that the next clock starts immediately. For high-heat scenarios, test a mutual pause with a deliberate resume.

## Pending evidence

- Browser reproduction: S5 terminal state, S6 face control, mobile stack selection, question payment, and owner-only meter viewing.
- Unscripted simulated runs with full event traces and separate starting meters.
- Two-person fictional-conflict sessions. Record each player's C/E/R/U/I/A scores from the lab matrix, plus exact moments of assistance, confusion, relief, or pressure.
