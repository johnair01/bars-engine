# The Big Mind cave: a fork of the Cave of Lessons

Wendell's steer on the board of 10 October 2026, 20:19 (`bm-phone-first`, overruled): "I want it to be a fork of cave of
lessons that adds chambers between cave hallways with a voice blocking the path". The full brief is sprout
`campaigns/big-mind/build-brief.md` (sprout #37); the board answers are in six-faces-council
`council/ledger/2026-10-10-pull-201920.json`.

This is step 1 of the brief's order of work: the cave mouth, one chamber (the Protector) and the hallway past it. It is
the falsification test. If Wendell does not catch a second voice speaking or feel the chamber work, the next six wait.

## How it is a fork

- **One engine, two caves.** `cave/cave.js` now exports its pieces as `window.__oagCave.kit`: the route, the tunnel, the
  pebbles, the lantern, the faceless avatar and its walk, the daemon body, the breath and the page guards. `bigmind.js`
  builds its cave from those, so a fix to the engine reaches both caves. A page that only borrows the engine sets
  `window.__oagCaveNoStart` before loading `cave.js`, so the Cave of Lessons' doorway stays shut there.
- **No kit file.** The Big Mind cave needs three.js only. It does not load `cave-kit.glb` or `spots.json`.
- **The page** is `/ontology-game/big-mind` on the same site, built by `scripts/build-ontology-game.mjs` **(choice)**.

## The walk

1. **The cave mouth** is one screen of the rules from the workshop's opening: sit out any question or voice, take control
   back with the Self button at any time, walk back up whenever you like. It says this is a game, not therapy, and gives
   a crisis line (988 in the US, findahelpline.com elsewhere) **(choice: which line)**. It says nothing leaves the device.
   When something has been kept, the mouth lists it, with Forget per voice and Delete everything (`bmc-safety`).
2. **The first hallway.** Hold anywhere to walk; let go to stop. The walls breathe with the Cave of Lessons' breath
   (4 s in, 6 s out).
3. **The Protector's chamber.** The tunnel widens to almost twice its width, lit blue. The Protector (the daemon body in
   its own colour, carrying its shield, taller than the player) stands in the middle and blocks the way. The way past it
   stays gathered shut.
4. **The ask.** The guide, unnamed, asks "May I speak to the Protector?" Yes or Not now.
5. **The seat shift.** Yes walks the player into the voice's place. The voice fades as the player enters it, the player
   takes its colour, and a faint figure of the self stays where the player stood. The player turns to face the way they
   came and the camera looks over their shoulder at the self, which is the way the Protector keeps watch **(choice)**.
6. **Three questions**, in the workshop's order: its job, what it protects the self from, how it is thanked. Each offers
   the group's own answers as cards and an open line for the player's words (`bm-cards-and-line`). The second question
   takes several cards. Any question can be sat out.
7. **Secretly speaking** (`bm-dismiss-step-aside`). Some cards are answers another part would give: one about the
   Protector instead of as it (the self's ideas), one in the Fixer's job, one in the Controller's, one in the Skeptic's
   **(choice: which cards)**. The open line is heard for the same tells with a plain word list **(choice)**, and the player
   can always tap "This doesn't sound like the Protector". Any of these brings a second figure out behind the voice. The
   guide names the tell, the player names who spoke (the self's ideas, the Fixer, the Controller, the Skeptic, or not
   sure), thanks it and asks it to wait. It walks on ahead and waits by the wall of the next hallway. The Protector is
   asked again.
8. **Stepping back out.** The guide thanks the voice; the player walks back to the self's place, and the Protector comes
   back and steps to the wall.
9. **Keeping.** The lines the Protector spoke are listed; the player taps the ones to keep. Only those are saved
   (`bm-cards-and-line`).
10. **The way opens.** The walls past the chamber widen and the light surges, as in the Cave of Lessons.
11. **The second hallway.** The parts that were asked to wait stand by the wall; walking past one shows that it waits for
    its own turn. The hallway ends at the Controller, standing in the shut mouth of the next chamber, which says it opens
    in the next build. Walk back up, or rest.

**Declining** (`bm-decline`) is a full move. The Protector steps to the wall and waits, the way opens, and the save marks
it waiting. Nothing is marked skipped. Sitting out every question does the same.

## Saving

At every chamber (`bm-session`, own pace), in `localStorage` under `oag.bigmind.v1`, on this device only
(`bm-first-player`). The record is a seed: per voice its status (`spoken` or `waiting`), the kept lines and when; the parts
waiting; and where to come back in. It spawns no world (`bm-world-later`). Coming back to the mouth offers to go back in
past the Protector.

## Words

The questions and cards paraphrase the workshop transcript, 00:22 to 00:35, with no line quoted longer than one line and
no teacher or programme named (`bm-name-internal`). The cards are the group's answers: attack, danger from anywhere,
pain, shame, looking bad, risk, uncertainty, loss, losing control, too much excitement, other people, itself; for its
thanks, hardly any, the self calls it a prison, unfair, devalued, a full-time job.

## Not in this build

The other six guardian chambers, the check-ins before the Damaged Self and the centre, and the centre itself (the
Vulnerable Child and the player self, where the guide is revealed as the player's own integrated voice, `bm-guide`). The
parts asked to wait come back in later chambers; here they only wait in the hallway.

## Tests

`bigmind-test.mjs`, 55 checks at 390 by 844: the mouth and its rules, walking by holding, the chamber widened and the way
shut, the ask, the Self button, the seat shift, out-of-voice cards and open lines bringing the second figure out, naming
and thanking it, the voice asked again, in-voice lines not flagged, stepping back out, only kept lines saved, the way
opening, the waiting part in the next hallway, the next chamber shut, walking back up, resuming past the Protector,
forgetting, declining, deleting everything, and the Cave of Lessons still opening on its own page. Build with
`npm run build:ontology-game`, then run it from a folder with playwright and three@0.128.0:
`OAG_PUBLIC=/path/to/bars-engine/public OAG_SHOTS=/some/dir node bigmind-test.mjs`.

## Wendell's steer for later: the inner room (10 October 2026, 20:58)

His words: "eventually we will have an inner room that people can start their own inner explorations from but specifically
can guide players into the spots of their inner world that needs attention. For instance if I were to abandon a path
because I ran into a protector and didn't have the time to go deep I would meet that same protector in the inner room lobby
and be able to pick up the explorations from there. The lobby would get limited and this creates a healthy scarcity.
Eventually people can bring other parts of self with them on the inner explorations especially when we're mining for gold
to be used in external world actions".

Not built yet. What this build already gives it: a declined voice and every part asked to wait are saved with status
`waiting` (`voices[id].status`, `waiting[]`), which is the list the lobby would show. The lobby's size limit, how a part
comes along on an exploration, and how the gold reaches the outer world are open, for a council pass when the lobby is built.

## The chamber as a conversation (Wendell's playtest, 10 October 2026, 21:48)

His words: "There needs to be more back and forth between the player and the protector. We have to ask its permission to
step aside and if the player feels it doesn't want to give permission then they go down another dialogue path. The
experience it quite collapsed and doesn't have a feeling of dialogue yet".

- **The voice speaks first.** "Stop. Nobody goes past this point." The player answers (who are you, I'd like to hear
  from you, I need to get through) and the Protector answers back before anything is asked.
- **Three permissions.** The player asks to speak with it, asks it to step aside so they can stand where it stands, and,
  after stepping back out, asks to walk on past. Each time the player reads its answer: it lets me, it holds back, or I
  can't tell **(choice: the read is the player's, as the facilitator waits for a voice to come)**. A yes is answered in
  the Protector's words.
- **The refusal path.** When it holds back it says why. The player can ask what it is afraid would happen, say what it
  fears as it (cards or their own words), offer an assurance (cards or their own words), hear its answer and ask again;
  or wait with it; or leave it at its post. I can't tell means staying and breathing with it, then asking again.
- **Left at its post.** Before the seat shift it waits, nothing is marked skipped, and the player walks back up. At the end
  it keeps the way shut: what it said can still be kept, and the save marks it `keepsWay`, so the next sitting meets it
  at its post. "Not now" at the first meeting stays as before (`bm-decline`: it waits by the wall and the way opens).
- **Five questions**, each one following from the last, with the guide answering what the voice said: its job, how it
  protects (walls, borders, the alarm, reinforcements, a higher wall, a dome), what it protects from, how it is thanked,
  and how that feels. The fear it named in a refusal is offered among the lines to keep.

Tests: `bigmind-test.mjs` now has 72 checks, adding the meeting, each permission, the refusal path, the assurance, I
can't tell, and leaving it at its post.

## The charge, and getting acquainted from the outside (Wendell, 10 October 2026, 22:39)

His words: "each protector has a charge associated with it, when the charge goes below a certain amount they have gained
enough trust to be willing to step aside. We keep polling the player if it feels better AND they decide the charge
amount- this is where the ontology game intersects. Where does your concept of the protector live in your body? How
charged is the protector- and they can see the meter filled as they ask them questions that are closer to the evidence.
The information players need about each part is, what their job is, who do they work for, and how are their hours. The
player ultimately provides tehse answers but the "dialogue" is really an expeirence of getting aquantined from the
outside of a part that already lives within them".

- **Where it lives.** Once the Protector agrees to speak, the player says where it lives in the body: a body place card,
  or the ontology game's own body map (`OAGBody.pick`, now loaded on this page), or not yet.
- **How charged it is.** The player sets its charge from 0 to 10. A meter at the top of the screen shows the number, with
  a line at the ready mark.
- **Questions from the outside.** The self asks; the player gives the Protector's answer (cards or its words). The first
  three are what the player needs to know about every part: its job, who it works for, its hours. Then the ones closer
  to the evidence: what it protects from, how it does it, how it is thanked, how that feels.
- **Polling.** After every answer its words are said back, the guide answers them, and the player is asked whether it
  feels any different and how charged it is now. The meter follows the player's number.
- **Trust.** When the charge reaches 3 or below **(choice)**, the Protector offers to step aside, and the player asks its
  permission as before. If every question is asked and the charge is still above the mark, it says it doesn't know the
  player well enough yet: sit with it and check again, or leave it at its post.
- **Standing in its place** is now one look from where it stands: what does it want the self to know? Then the player
  steps back out and asks to walk on.
- **The save** adds where it lives and every charge the player gave, in order.

Tests: 80 checks.

## The easing: a reward when the charge falls (Wendell's playtest, 11 October 2026, 23:29)

His words: "There should be a visual reward for when the charge goes down".

- **When it plays.** Whenever the player gives a lower charge than the last one they gave. A charge that stays the same or
  rises plays nothing; the meter just follows the number, as before.
- **What the player sees.** The panel steps away for about two seconds so the chamber can answer **(choice)**. A ring of
  warm light spreads out from the Protector's feet, motes of light rise off it, and the Protector lets its breath out
  (it settles a little lower, then stands again). The line in the middle of the screen says "The Protector eases." with
  the numbers ("7 down to 5"). On the meter, the part that drained glows and fades, and the drop floats beside the number.
- **Bigger drops give more.** The ring's width and the light grow with the size of the drop. A drop of three or more says
  "eases a lot". Crossing the ready line gives the most: the lantern flares, and the line says "The Protector lets its
  breath out." **(choice: the scale)**
- **The chamber warms with calm.** Once the player has given a charge, the chamber's blue light warms toward gold by how
  calm the Protector is now, so a low charge reads in the room as well as on the meter **(choice)**.
- **Reduced motion.** With the device's reduced-motion setting on, the ring holds still, the motes and the breath are left
  out, and the line and the warmth still show.
- The Self button still works during the easing; the conversation picks up where it was when the player goes on.

Tests: 86 checks, adding the easing after a drop, its words and numbers, the ring and the meter playing, the biggest
easing at the ready line, the chamber warming, and one easing per drop.

## Two charges, and a W.A.V.E. on yours (board, 11 October 2026, 23:51)

His note of 11 October: "One should also be able to do W.A.V.E. in the cave on the protector (and other voices) in order
to gain more data about the motions charge that comes up while talking to the daemon". Council pass 2 (sprout
`campaigns/big-mind/6FACE_PASS2_big-mind-cave_2026-10-11.md`) put six positions on the board, and he let all six stand.
His answer to `bmw-whose-charge`: "Two charges, yours and its".

- **Two charges on the meter.** The top of the screen now has two bars: "Protector (it)", the voice's charge, and "You",
  the player's own. The voice's bar decides trust exactly as before (3 or below). The player's bar shows once they give it.
- **The offer** (`bmw-offer`). Every charge poll has "Breathe with it (W.A.V.E.)" under the slider. It is never required
  and never a condition of the voice stepping aside. Going back from its first screen returns to the same poll.
- **Your charge first.** The W.A.V.E. asks how charged you are, 0 to 10, then where you feel it in your body (the same body
  places, or not yet).
- **The game's W.A.V.E.** (`bmw-game-wave`), done standing where you stand: Welcome, Acknowledge, Allow, Accept,
  Appreciate, Validate, Exhale, with the Cave of Lessons' words. Each step is one breath: its button wakes after the cave's
  4 s in and 6 s out. From Allow on, "This is as far as I can honestly go today" goes on to Validate. The Exhale asks
  whether to let it stay or exhale and release.
- **Naming it** (`bmw-player-names`). At Acknowledge the player names the feeling in one word, then picks its element from
  the five (Fire anger, Water sadness, Wood joy, Metal fear, Earth neutrality). Nothing is picked for them.
- **After.** How charged are you now? Then the voice's poll comes back as after any answer, the slider at the voice's last
  number (`bmw-number-stays`). The W.A.V.E. never sets or nudges the voice's number, and your own charge falling plays no
  easing for the voice.
- **Something in the way.** Every step has "Something's in the way". For now the blocked step is noted and the W.A.V.E.
  counts as complete there, then asks your charge after **(choice)**. Where a block goes in this cave was `bmw-block`; he
  answered with a steer instead of an option (below), so this stays the plain default until that pass is built.
- **The record** (`bmw-record`). Each W.A.V.E. is one entry under the voice: after which question, the feeling word, the
  element, the body place, your charge before and after, the highest rung, any blocked step, the exhale, and when.
  Entries add up across sittings, so the Challenger's lever test can be read off them. The feeling word is stored only if
  the player taps that W.A.V.E. at the keeping step; the rest of the entry is saved either way, on the device, and Forget
  and Delete everything remove it.
- **Shown back** (`bmw-shown`). At the keeping step and in the mouth's list, one line each: "Dread, Metal, in your chest: 8
  to 6".

Tests: 108 checks, adding the offer at every poll, the two bars, your charge first, a breath per step, naming and picking
the element with nothing picked for you, stopping on a rung, the exhale, the voice's number and easing left alone, the
record, a blocked step, the feeling word kept only when tapped, and the line shown back at the mouth.

His steer on `bmw-block` (11 October 2026, 23:53), not built yet: "One should be able to sit down and do a version of the
wave room on the part in front of them while they are in the cave. They should be able to do this when a charge emerges
for them not just when they are in front of a daemon. The charge spirits can come with then throughout the cave until
they are dismissed. The daemons should be able to respond to how many spirits are around. They might be protecting the
self from the charge they are carrying". A council pass takes it first.

## Sitting down, and the spirits that follow (Wendell's board, 12 October 2026; pass 3)

His steer on `bmw-block`: "One should be able to sit down and do a version of the wave room on the part in front of them while
they are in the cave. They should be able to do this when a charge emerges for them not just when they are in front of a daemon.
The charge spirits can come with then throughout the cave until they are dismissed. The daemons should be able to respond to how
many spirits are around. They might be protecting the self from the charge they are carrying". Pass 3 (sprout
`campaigns/big-mind/6FACE_PASS3_big-mind-cave_2026-10-12.md`) set eight positions; he answered the two questions.

- **Sit down, anywhere** (`bms-sit-anywhere`). A Sit down button sits at the bottom left in every hallway and chamber. The figure
  sits, the walls draw in around it, and what's coming up comes along the path as a grey shape that takes its element's colour
  once it is named. Sitting with the voice puts the glow on the voice instead.
- **The room's own steps, in place** (`bms-in-place`, `bms-build-order`). The sitting runs cave.js's `ROOM_STEPS`, `WAVE`,
  `TEXTURES`, `ELEMENTS`, `allowSliders`, `buildAura` and `talk321`, exported on the kit, so the WAVE room and the cave share one
  copy: Welcome, Witness, Acknowledge, Allow (with the size and brightness sliders), Accept, Appreciate (with Not now), Validate
  (it dulls), and the fork. Toward runs the 3-2-1 aimed at what the player wants, then one next move; Away breathes it out.
- **Who to sit with** (`bms-sit-whom`, his answer: pick). In a chamber the player picks each time: what's coming up in them, or
  the voice in front of them. Sitting with the voice has no fork and comes back to the voice's charge poll.
- **A block sits down** (`bms-block-sits`). "Something's in the way" in a W.A.V.E. now offers Sit down with it, and standing up
  comes back to the W.A.V.E. step it stopped on.
- **Spirits follow** (`bms-spirits-follow`). A charge that stays at the fork follows as a spirit in its element's colour with its
  name. At most three are in view; the Spirits button at the bottom right counts them all.
- **Dismissing** (`bms-dismiss`). Tap Spirits, tap one, thank it, then breathe it out or sit with it again.
- **The voices respond** (`bms-voices-respond`). With any spirit, the Protector says "You didn't come alone.", and with three or
  more, "That's a lot to bring through here." It stands wider by 4% a spirit, up to three. Spirits never move its charge or trust.
- **What it protects you from** (`bms-protects-from`). The "from" question offers the spirits' names as answers, and the guide
  asks whether it might be protecting you from what you carry.
- **At the mouth** (`bms-spirits-after`, his answer: choose). Leaving shows each spirit with Keep or Let go. A kept spirit is its
  name and element on this device, and it comes back in with the player next time. The mouth lists kept spirits.
- **The record.** Each sitting saves where it happened, with whom, what it came from and which way it went (`s.sittings`), with
  no words. Choices: the button places, the narrowing (16%), the grey shape, the spirits' places behind the figure.

## Every sit-down spawns a spirit (Wendell, 12 October 2026, 20:43)

His steer, which widens `bms-spirits-follow`: "When someone does WAVE sitting down in the big mind cave or the other cave
environments it should spawn a spirit that walks with the character until dismissed".

- **Big Mind cave.** Every sitting now leaves a spirit, whichever way it went: Toward, Away, with the voice, from a block, or
  stood up partway (then it is "A charge" in grey until it is named). Away at the fork no longer lets it go on the spot, because
  nothing dismisses a spirit for you (`bms-dismiss`): the out-breath softens it and it walks lighter. Sitting with a spirit again
  keeps that one spirit. Dismissing is unchanged: tap Spirits, thank it, then breathe it out or sit with it again.
- **Cave of Lessons.** Every charge worked through in the WAVE room walks back into the cave with the player as a spirit, in its
  element's colour with its name, lighter if it was breathed out at the fork. Spirits shows at the top of the screen; tap it,
  thank one, then breathe it out or take it home again (the room opens with its feeling known). Choices: they walk this visit
  only, and the room opened from the body map on its own has no cave to walk, so it spawns none.
- **One spirit for every cave.** cave.js holds `buildSpirit`, `followSpirits` and `spiritHex` on the kit, so both caves draw and
  walk the same spirit.

## The W.A.V.E. screens, the charge you can see, and speaking as the voice (Wendell, 12 October 2026, 21:15)

His playtest notes, on the W.A.V.E. at the charge poll: "need the breathing animation on these screens / The wave screen is
showing up as a modal, but there should be a spirit that is apearing that represents the charge that is being worked on EVEN in
this WAVE context. it should follow the same rule of getting bigger as you allow / The apprecaite step should also allow the
player to skip and say something the appreciate about it jsut like in the other WAVE containers / exhale and release should have
an animation of the spirit being dismissed / Also the 1 phase with the protector (and all the voices) should be a bit longer and
should have the option for the player to speak as the protector in their own words."

- **The breath, drawn.** Every W.A.V.E. step and every sitting step has a ring of light that swells over the 4 s in-breath and
  settles over the 6 s out-breath, saying in and out. With reduced motion it holds still and only the word changes. Choice: the
  ring's look and size.
- **The charge you can see.** From "Breathe with it" on, the charge being worked comes along the path as the sitting's grey
  shape, low and to the side so it shows under the panel. It takes its element's colour at Acknowledge, grows and brightens at
  Allow by the same two sliders a sitting uses, and dulls at Validate.
- **Appreciate** has the line from `oag-appreciate-input` ("What can you appreciate about what showed up?", and "You may not find
  anything to appreciate today, and that's all right.") and Not now (`wave-room-appreciate-optional`), at the poll's W.A.V.E. and
  in a sitting. What is written there stays on the page and is not saved (a choice, as with a sitting's words).
- **Exhale.** "No, exhale and release" lifts the charge and fades it on the out-breath, then asks how charged you are now. "Yes,
  let it stay" turns it into a spirit that walks with you, named with your feeling word. A W.A.V.E. left at a block keeps its
  charge walking with you too, because nothing dismisses a spirit for you (`bms-dismiss`). Going back before the first step lets
  it sink away, since nothing was worked yet. Choices, all of them.
- **Speaking as the voice.** Standing in its place is now three turns in the first person: who it is ("I am the Protector, and
  I…"), what it sees from its post, and what it wants the self to know. Each has a line for the player's own words as the voice;
  the last keeps the workshop's cards too, since the first two have no group answers to draw on. The guide shows what was said
  as the voice back on the next turn. Any turn can be passed, and "Just look for a while" steps back out at once. Lines said as
  the voice are offered at the keeping step with its other lines. The turns are written for any voice from its name, so the
  later chambers get them as they open. Choices: the three turns and their wording.
