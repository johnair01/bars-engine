# Understood — relationship conflict game MVP

A live tabletop prototype for two people playing together at the same time. The bars-engine build serves it at `/understood/play`, with a guided rehearsal at `/understood/demo`. Players speak aloud; the app does not ask them to type or record their disclosures. Sessions live in the current browser's local storage. Conflict meters are hidden game information. An owner can check their number only after a deliberate device handoff, by pressing and holding the covered meter control while the partner looks away.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Choose **Try the guided demo** from setup or visit `/?demo=1` to guide fictional readers Ari and Bea through a complete game. Demo state never replaces a saved real session. `npm run build` checks TypeScript and makes a production bundle. From the bars-engine root, run `npm run build:understood` before `npm run dev` to generate the embedded files.

## Demo rules

1. Each player privately sets a 1–5 resolution meter and starts with five chips of each color. Together they name the issue aloud. They may choose who opens or use an animated coin toss to suggest an opener. A six-line I Ching draw, cast with three virtual coins per line from bottom to top, sets a reflection prompt before play. Lines 6 and 9 are marked as changing. Players also set a turn timer (off, 1, 1½, 2, or 3 minutes). The active player’s seat displays the current player, countdown, available actions, and pass control in place of its usual heading. On a phone this display moves from the top of the board to the bottom as turns change. The timer signals when time is up; it never passes the turn automatically.
2. Color determines a move: red names anger through a boundary or change; green names delight or appreciation; blue names sadness and points to the value underneath it; black names fear; white names a neutral observation or uncertainty.
3. Each side of the felt board has **five stack spaces**. Tap a chip in your hand to open its placement modal. Choose face up (questions welcome) or face down (feeling only), choose a stack, and place it. A face-down chip has an engraved back and a face-down label; a stack with multiple layers has a count badge. One chip can be placed per turn, whether spoken or silent. Further layers wait for later turns. Dragging from hand to stack remains a quick placement option. On your turn, make one spoken bid, speak one unspoken chip already in a stack, or pass. **Only the active player needs to press Finish my turn or Pass my turn** to hand play to the other person.
4. Tap a chip in a stack to inspect it in a modal, change its face, speak or release it when eligible, ask about it, or add another layer.
5. The active player may place one chip in any of their five stacks. Unspoken chips can be spoken on a later turn. Speaking a queued chip uses no new chip from the hand, but requires at least one chip still in hand. With an empty hand, the player asks about the partner's chips until a chip is received.
6. Only the chip's speaker decides when that feeling has been heard. In a multilayer stack, mark each feeling heard first; no chip can leave until every layer has been heard. Releasing a heard chip then gives it to the listener. The owner chooses whether that hearing cools the public conversation temperature or moves their private conflict meter down one notch. If it is not heard, add an unspoken chip to the stack on a later turn. A partner can donate a chip when more depth is needed.
7. Either player may ask about the other's open spoken chips at any time. A player with no chips asks for free. Players may offer voluntary disclosures as part of a chip trade.
8. At zero, a player announces resolution on their side and can continue helping the other player. Both private meters reaching zero while the public conversation temperature is settled ends the session cooperatively.

## Turn and chip economy

| Move | Timing | Chip flow | Uses the spoken bid? |
| --- | --- | --- | --- |
| Place and speak one chip | Your turn | Hand → your stack | Yes |
| Speak a waiting chip | Your turn, with at least one chip in hand | Already in your stack | Yes |
| Pass | Your turn | None | Gives up the bid |
| Add an unspoken chip | Your turn, once per turn | Hand → your stack | No |
| Ask about an open chip | Anytime | Offer held; returned if more is shared, given to speaker if there is nothing more. Free when hand is empty. | No |
| Donate or trade | Anytime, by agreement | Between hands | No |
| Signal hotter | Anytime, once per player per turn | Public temperature +1 (up to 5) | No |
| Mark a chip heard | When its owner feels heard | Stays in its stack until every layer is heard | No |
| Release a heard chip | Once every layer in its stack is heard | Owner's stack → listener's hand; public temperature −1 or owner's hidden meter −1 | No |

The 50 starting chips circulate; none are destroyed. Scarcity is **local**: a player may lack the color they need even while many chips sit in the other hand or in stacks. A stack stores unspoken pressure but delays transfer. A heard release replenishes the listener's hand, while donation and trade can restore access before hearing is complete. These are hypotheses to test in live play, especially whether repeated questions need a further limit.

## MVP rulings to test

- A paid “tell me more” question holds the offered chip temporarily. If the speaker shares more, it returns to the asker; if there is nothing more, the speaker keeps it.
- A trade offer includes an in-person disclosure. The partner chooses what they would like to hear; either person may decline. The trade economy needs playtesting.
- The owner chooses whether a heard chip cools the visible conversation temperature or lowers their private conflict meter. The interface does not judge the quality of the listener's response.
- This build uses one shared board on one device, for two people in the same room. Separate-device synchronized play would need a shared session server and truly private views.

## Design precedents

These sources informed the design. They describe mechanics or relationship concepts; they do not establish that this MVP resolves conflict.

- [Empathy Poker](https://www.nvc.org.nz/files/2013/08/NVC-Card-Games.pdf): a player owns the meaning of feelings and needs offered to them.
- [Mixed Emotions](https://www.mixed-emotions.com/booklet): two people lay out feelings and discuss shared emotions in conflict.
- [Talk it Out](https://talkitoutgame.com/details/how-it-works/): a speech token protects uninterrupted expression.
- [Hanabi rules](https://cdn.1j1ju.com/medias/b3/a9/0e-hanabi-rulebook.pdf): information is exchanged through a limited token economy.
- [So Long Sucker rules](https://chezhans.uber.space/so-long-sucker/rules/): colored chips stack, change hands, and may be donated so play can continue.
- [Gottman Institute on bids](https://www.gottman.com/blog/make-or-break-your-relationship-the-little-things/): bids for connection gain meaning from a partner's response.
- [University of Oregon I Ching guide](https://hexadecimal.uoregon.edu/ching/explain.html): three coins generate each of six lines from bottom to top; 6 and 9 are changing lines. The opening draw is a reflection ritual, not a prediction or conflict-resolution claim.

## Playtest questions

- Do the two chip faces make sense without instruction?
- Does a stack help partners notice what is accumulating without feeling pressured to speak immediately?
- Does paying for curiosity feel supportive or transactional?
- When a player has no chips, do questions and donations reliably restart the exchange?
- Do players distinguish being heard from merely receiving an answer?
