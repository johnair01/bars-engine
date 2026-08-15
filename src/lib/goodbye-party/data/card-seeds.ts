/**
 * Authored party content for Goodbye Yellow Brick Road, keyed by base Oracle card id.
 *
 * This is the *interpretation layer*: the canonical Oracle deck keeps art, suit,
 * rank, and title; this file supplies what each card means for one night in
 * Portland. `scripts/generate-goodbye-party-interpretations.ts` expands these
 * seeds into the runtime `interpretations.json` (alchemy + achievement metadata
 * are derived there from suit/lens/depth so the authored text stays readable).
 *
 * Two lenses per card:
 *   goodbye — the threshold. Leaving, being seen off, what Portland made of you.
 *   spicy   — the hotter state of the same card. Browsable all night; random
 *             Spicy play unlocks at midnight.
 *
 * Three depths per lens, escalating activation energy, not intensity of demand:
 *   easy   — under a minute, one move, right here in the room.
 *   medium — involves another person and some exposure.
 *   hard   — makes a durable thing: an artifact, a plan, a piece of social
 *            infrastructure that outlives the night. Captured as a BAR.
 *
 * Every prompt is an invitation. None of them assign anyone else's time, body,
 * or yes.
 */

export type LensSeed = {
  /** Short noun phrase; becomes the achievement title via the family pattern. */
  motif: string
  easy: string
  medium: string
  hard: string
}

export type CardSeed = {
  goodbye: LensSeed
  spicy: LensSeed
}

export const CARD_SEEDS: Record<string, CardSeed> = {
  // ── WAKE UP — notice what's real between you ──────────────────────────────
  'WU-A': {
    goodbye: {
      motif: 'the First Noticing',
      easy: 'Find someone you have not talked to yet tonight and tell them one thing you noticed about them in the last ten minutes.',
      medium: 'Tell Wendell one specific thing you noticed about him that he probably thinks nobody clocked.',
      hard: 'Start a list, on paper or in a note, of things this room noticed about each other tonight. Get five entries from five different people and give the list to Wendell before you leave.',
    },
    spicy: {
      motif: 'the Room Read',
      easy: 'Look around and privately name the person whose energy you are most drawn to right now. Do not act on it yet. Just clock it.',
      medium: 'Tell someone what you noticed about them the moment they walked in — the real thing, not the polite version.',
      hard: 'Be the person who names the actual temperature of the party out loud, then propose the thing the room clearly wants and does not have a container for yet.',
    },
  },
  'WU-J': {
    goodbye: {
      motif: 'the Sharpening',
      easy: 'Say the sharpest true kind thing you have about someone in this room, to their face, in one sentence.',
      medium: 'Ask someone here to tell you the sharpest true thing they see in you. Let it land without correcting them.',
      hard: 'Collect a one-line portrait of Wendell from three people who see him differently and write them down side by side. That triptych is the going-away gift.',
    },
    spicy: {
      motif: 'the Sharp Compliment',
      easy: 'Pay someone a compliment specific enough that it could not be recycled for anyone else in the room.',
      medium: 'Tell someone the thing you find compelling about them that you would normally keep behind your teeth.',
      hard: 'Run a five-minute compliment gauntlet: get three people in a row, each says the sharpest true thing about the next. Do it where people can see it happening.',
    },
  },
  'WU-Q': {
    goodbye: {
      motif: 'the Long Pause',
      easy: 'Step outside or into a quieter corner for sixty seconds. Come back and tell one person what you noticed in the quiet.',
      medium: 'Take one person out of the noise for three minutes and ask them what they are actually feeling about tonight.',
      hard: 'Make a quiet room. Claim a corner, tell people it is the slow room, and stay in it long enough that at least three real conversations happen there.',
    },
    spicy: {
      motif: 'the Held Beat',
      easy: 'Hold eye contact with someone one beat longer than is comfortable, then smile and say what you were thinking.',
      medium: 'Ask someone to sit with you for one song and not fill the silence. See what shows up.',
      hard: 'Host the slow corner after karaoke — low light, low volume, no phones — and keep it alive for at least half an hour.',
    },
  },
  'WU-K': {
    goodbye: {
      motif: 'the After',
      easy: 'Tell someone how you two first met, out loud, in front of them.',
      medium: 'Find someone you have known a long time and name one thing that is different between you now than when you started.',
      hard: 'Write down the origin story of how you met Wendell — where, when, what happened — and add it to a shared pile with everyone else who does the same tonight.',
    },
    spicy: {
      motif: 'the Rewrite',
      easy: 'Tell someone the version of how you met that you have never told them.',
      medium: 'Ask someone what their first impression of you actually was. Ask for the unflattering version too.',
      hard: 'Start the group chat that keeps this specific configuration of people alive after tonight, and get at least six people into it before you leave.',
    },
  },
  'WU-2': {
    goodbye: {
      motif: 'the Temperature Check',
      easy: 'Say your current energy in one word to the next person you see, and ask for theirs.',
      medium: 'Ask three people how they are actually doing about Wendell leaving. Do not fix any of the answers.',
      hard: 'Take the temperature of the whole party and adjust it — change the music, open a window, start food, start a game — whatever the room is asking for and nobody has done.',
    },
    spicy: {
      motif: 'the Heat Check',
      easy: 'Rate the room out of ten to someone and make them defend a different number.',
      medium: 'Ask someone what would make tonight a ten for them, and see if any of it is in your power to offer.',
      hard: 'Own the vibe for one full hour: music, lighting, drinks, whatever it takes. Hand it off deliberately to someone else when your hour is up.',
    },
  },
  'WU-3': {
    goodbye: {
      motif: 'the Unfinished Thing',
      easy: 'Name one thing that feels unfinished between you and this city, out loud, to anyone.',
      medium: 'Tell someone here about something between you two that never quite got resolved. It does not have to get resolved tonight.',
      hard: 'Pick the unfinished thing you actually want to finish and make one concrete arrangement tonight — a date, a call, a plan — with the person it involves.',
    },
    spicy: {
      motif: 'the Loose Thread',
      easy: 'Name the flirtation in your life that never went anywhere. Out loud. To one person.',
      medium: 'Tell someone here about a moment between you two that you have both been politely ignoring.',
      hard: 'Take one loose thread from tonight and turn it into an actual plan with an actual date before the party ends.',
    },
  },
  'WU-4': {
    goodbye: {
      motif: 'the Unsaid Thing',
      easy: 'Say one thing you almost said to someone tonight but did not.',
      medium: 'Tell Wendell the thing you were going to keep to yourself until after he moved.',
      hard: 'Be the person who says the unsaid thing to the whole room — the toast nobody has made yet. Then write it down so it survives the night.',
    },
    spicy: {
      motif: 'the Confession',
      easy: 'Tell one person one thing about you that would surprise them.',
      medium: 'Tell someone the thing you have been not-saying to them specifically.',
      hard: 'Run a confession round: three or more people, one real admission each, nobody allowed to make it weird afterward. You hold the container.',
    },
  },
  'WU-5': {
    goodbye: {
      motif: 'the Peripheral Vision',
      easy: 'Find the person on the edge of the party and go stand with them.',
      medium: 'Notice what someone here needs and has not asked for, then ask if you can get it for them.',
      hard: 'Spend twenty minutes as the host nobody appointed: bring the wallflowers in, refill what is empty, introduce two people who should know each other. Log who you connected.',
    },
    spicy: {
      motif: 'the Side-Eye',
      easy: 'Tell someone what you have noticed them doing all night that they think is subtle.',
      medium: 'Ask someone what they have been avoiding looking at tonight, and offer to look at it with them.',
      hard: 'Be the person who spots what the party is too polite to name and gives it somewhere to go — a game, a dare, a container. Set it up and run it.',
    },
  },
  'WU-6': {
    goodbye: {
      motif: 'the Arrival',
      easy: 'Tell someone what it feels like to be around them.',
      medium: 'Ask someone what it feels like to be around you. Take the answer without arguing.',
      hard: 'Give three different people the same question — what does it feel like when Wendell walks in? — write the answers down, and hand them over.',
    },
    spicy: {
      motif: 'the Entrance',
      easy: 'Make a second entrance. Leave the room and come back the way you wish you had arrived.',
      medium: 'Tell someone what happens in your body when they walk into a room.',
      hard: 'Stage an arrival for someone else — announce them, clear a path, make the room turn. Consent first, spectacle second.',
    },
  },
  'WU-7': {
    goodbye: {
      motif: 'the Witnessing',
      easy: 'Say what you are watching in yourself right now, out loud, to one person.',
      medium: 'Ask someone to witness something you are going through, without advice. Then do the same for them.',
      hard: 'Be the night\'s witness: get a photo or a written line from every cluster of people at this party and assemble it into one artifact before you leave.',
    },
    spicy: {
      motif: 'the Watcher',
      easy: 'Tell someone the thing you keep watching them do.',
      medium: 'Ask someone to describe you the way a stranger watching from across the room would.',
      hard: 'Document the spicy half of the night on purpose — photos, quotes, the karaoke setlist — and get consent from everyone in it before anything leaves the house.',
    },
  },
  'WU-8': {
    goodbye: {
      motif: 'the Small Astonishment',
      easy: 'Name one small thing that astonished you this week to the nearest person.',
      medium: 'Walk someone to something in this house you find beautiful and tell them why.',
      hard: 'Collect five small astonishments from five people tonight and turn them into something Wendell can take with him — a note, a list, a recording.',
    },
    spicy: {
      motif: 'the Close Look',
      easy: 'Tell someone one specific physical detail about them you have always noticed.',
      medium: 'Ask someone what detail about you they clocked first, and believe them.',
      hard: 'Run the vibes showcase: give people a stage, a rotation, and a rule set they consent to, then hand out the honors.',
    },
  },
  'WU-9': {
    goodbye: {
      motif: 'the Echo',
      easy: 'Tell someone what it costs you to show up honestly, in one sentence.',
      medium: 'Ask someone what showing up tonight cost them. Some people drove a long way, or came anyway.',
      hard: 'Find out who is having the hardest time with this goodbye and make sure they are not alone at midnight. Arrange it now, not later.',
    },
    spicy: {
      motif: 'the Aftershock',
      easy: 'Name the song that would wreck you if it played right now.',
      medium: 'Tell someone what you will remember from tonight in a year.',
      hard: 'Take over the karaoke queue for one rotation and make sure the people who would never sign up get sung to, or get to sing.',
    },
  },
  'WU-10': {
    goodbye: {
      motif: 'the Distance',
      easy: 'Tell someone how connected you feel to them right now, honestly, on a scale of one to ten.',
      medium: 'Name the distance between you and someone here that neither of you has mentioned.',
      hard: 'Pick the person you have drifted furthest from and set up the actual thing that closes the gap — a call, a visit, a standing date. Make it exist before you leave.',
    },
    spicy: {
      motif: 'the Gap',
      easy: 'Stand closer to someone than you normally would, and ask if that is alright.',
      medium: 'Tell someone the distance you have been keeping and why.',
      hard: 'Close a gap that has been open for years. One conversation, tonight, with the person it is actually with.',
    },
  },

  // ── CLEAN UP — consent, honesty, repair ───────────────────────────────────
  'CU-A': {
    goodbye: {
      motif: 'the Small Honesty',
      easy: 'Name one thing you let slide with someone here, to them, without making it a whole thing.',
      medium: 'Tell someone the small honest thing you have been rounding off for months.',
      hard: 'Make the repair you have been carrying about this city before you leave the house tonight. One conversation, done properly.',
    },
    spicy: {
      motif: 'the Clean Ask',
      easy: 'Ask someone for something small and make it genuinely easy to decline.',
      medium: 'Make the ask you have been circling all night. Say the actual thing. Accept any answer.',
      hard: 'Teach the room the clean ask by demonstrating it — ask out loud, in front of people, in a way that makes no easier for anyone to say yes than to say no.',
    },
  },
  'CU-J': {
    goodbye: {
      motif: 'the Confession Dial',
      easy: 'Tell one person one thing you have been less than fully honest about tonight.',
      medium: 'Say the careful thing directly to the person you have been careful with.',
      hard: 'Have the conversation you were planning to have by text after you moved. Have it here, in person, tonight.',
    },
    spicy: {
      motif: 'the Turned-Up Dial',
      easy: 'Say the flirtier version of the thing you were about to say.',
      medium: 'Tell someone exactly how interested you are, on the record, with no exit ramp built into the sentence.',
      hard: 'Set the dial for the whole party: propose the rules for how bold tonight gets, get people to agree to them out loud, and hold them.',
    },
  },
  'CU-Q': {
    goodbye: {
      motif: 'the Tide',
      easy: 'Name one thing that stayed with you from a moment you let pass.',
      medium: 'Give someone the apology you have owed them, in full, without a defense attached.',
      hard: 'Make the repair that would let you leave Portland clean. Whoever it is with, find them or call them tonight.',
    },
    spicy: {
      motif: 'the Undertow',
      easy: 'Say the thing you almost said and then swallowed, ten minutes ago.',
      medium: 'Tell someone about the moment between you two that you have both been pretending was nothing.',
      hard: 'Be the person who cleans up an awkward moment at this party instead of letting it set. Go back, name it, resolve it.',
    },
  },
  'CU-K': {
    goodbye: {
      motif: 'the Reckoning',
      easy: 'Say one honest sentence about who you have been in this friend group.',
      medium: 'Tell someone the most honest account you can give of who you have been to them.',
      hard: 'Write the honest account of what this Portland chapter was — the good and the rest — and read one paragraph of it out loud to at least one person.',
    },
    spicy: {
      motif: 'the Full Account',
      easy: 'Admit one thing you have been performing tonight.',
      medium: 'Tell someone the least flattering true thing about how you do desire.',
      hard: 'Own something publicly that you have been managing privately, and let the room hold it without rescuing you.',
    },
  },
  'CU-2': {
    goodbye: {
      motif: 'the Mirror',
      easy: 'Name one thing that bugs you in someone else that you know you also do.',
      medium: 'Tell someone the thing you have been projecting onto them, and take it back.',
      hard: 'Untangle one long-running misread between you and someone here. Get to the actual thing, then tell them what you are doing differently.',
    },
    spicy: {
      motif: 'the Projection',
      easy: 'Say out loud the story you have been telling yourself about someone here tonight.',
      medium: 'Check that story with the person it is about. Ask if it is true.',
      hard: 'Run the game where people guess what the room assumes about them, then get told the truth. Set the consent rules first.',
    },
  },
  'CU-3': {
    goodbye: {
      motif: 'the Ask',
      easy: 'Ask someone here for one small thing you have been talking yourself out of.',
      medium: 'Ask Wendell for the thing you want from him before he leaves — the goodbye, the conversation, the promise, the thing.',
      hard: 'Ask for something that requires other people to organize: a send-off, a visit, a caravan, a reunion. Get the first three yeses tonight.',
    },
    spicy: {
      motif: 'the Bold Ask',
      easy: 'Ask someone for a dance. Actually ask.',
      medium: 'Ask for the thing you would normally wait to be offered. Make declining costless.',
      hard: 'Build the container for other people\'s bold asks — a spot, a format, a rule that makes no a completely normal answer — and run it for an hour.',
    },
  },
  'CU-4': {
    goodbye: {
      motif: 'the Withhold',
      easy: 'Say one true thing about this friendship you have been keeping to yourself.',
      medium: 'Stop pretending one thing is fine and tell the person it is not fine with.',
      hard: 'Name the thing everyone here has been politely not saying about Wendell leaving, out loud, to the room.',
    },
    spicy: {
      motif: 'the Held Card',
      easy: 'Say the thing you were saving for later. It is later.',
      medium: 'Tell someone what you have been withholding from them and why you were withholding it.',
      hard: 'Make the party a place where withheld things can land: start it yourself, then keep the space open long enough that two other people use it.',
    },
  },
  'CU-5': {
    goodbye: {
      motif: 'the Pattern',
      easy: 'Name one habit of yours that affects the people close to you.',
      medium: 'Ask someone to name the pattern they see in you. Do not defend it.',
      hard: 'Name the pattern you keep bringing to goodbyes, tell someone here what you are doing differently this time, and ask them to hold you to it after the move.',
    },
    spicy: {
      motif: 'the Tell',
      easy: 'Name your tell — the thing you do when you are interested.',
      medium: 'Ask someone what your tell is. They have almost certainly noticed.',
      hard: 'Break your own pattern in public tonight. Do the thing you always avoid at parties, and tell one person that is what you are doing.',
    },
  },
  'CU-6': {
    goodbye: {
      motif: 'the Repair',
      easy: 'Tell someone about a moment you walked past that stayed with you.',
      medium: 'Make one thing right with someone at this party. Not a big thing. A real one.',
      hard: 'Repair the relationship you would most regret leaving broken. Tonight, in person, however long it takes.',
    },
    spicy: {
      motif: 'the Do-Over',
      easy: 'Redo a moment from earlier tonight that you fumbled.',
      medium: 'Go back to someone and take a second run at the thing you said badly.',
      hard: 'Be the repair crew for the night: when something goes sideways at this party, you are the one who goes back and fixes it. Take the job out loud.',
    },
  },
  'CU-7': {
    goodbye: {
      motif: 'the Gift Back',
      easy: 'Name one thing someone here does for you that you have never acknowledged. Tell them.',
      medium: 'Give back to Wendell one specific thing he gave you — name it, and say what it did.',
      hard: 'Organize the giving-back: get five people to each name one thing Wendell gave them, capture it, and hand it over as one piece.',
    },
    spicy: {
      motif: 'the Return',
      easy: 'Return a compliment you have been sitting on for months.',
      medium: 'Give someone the thing they have been giving everyone else all night — attention, a drink, a dance, a rescue from a conversation.',
      hard: 'Make sure the people running tonight — cooking, pouring, DJing, hosting — get taken care of. Organize it and see it through.',
    },
  },
  'CU-8': {
    goodbye: {
      motif: 'the Shadow',
      easy: 'Name a version of yourself you do not usually show at parties.',
      medium: 'Show a piece of it to one person here, on purpose.',
      hard: 'Say the hardest true thing about yourself to the room, or to the person it most concerns, and stay in the room afterward.',
    },
    spicy: {
      motif: 'the Other Self',
      easy: 'Do one thing tonight that the version of you that showed up would not do.',
      medium: 'Tell someone who you are when nobody is being careful.',
      hard: 'Take a real risk in front of people — the song, the dance, the outfit, the announcement — and let it be witnessed all the way through.',
    },
  },
  'CU-9': {
    goodbye: {
      motif: 'the Cost',
      easy: 'Tell someone what it costs you to stay close to people.',
      medium: 'Ask someone what tonight is costing them and take the answer seriously.',
      hard: 'Find who is running on empty at this party and make it your job that they get fed, watered, sat down, and talked to.',
    },
    spicy: {
      motif: 'the Price',
      easy: 'Name what you want tonight that you have decided is too much to ask for.',
      medium: 'Ask for a fraction of it anyway.',
      hard: 'Take on the unglamorous job that makes the fun possible — the dishes, the rides, the water, the door — and do it without announcing it more than once.',
    },
  },
  'CU-10': {
    goodbye: {
      motif: 'the Receiving',
      easy: 'Let someone compliment you and say only thank you.',
      medium: 'Ask someone to tell you what you have meant to them, and let all of it in.',
      hard: 'Make sure Wendell actually receives tonight. Watch him deflect, and put it back in front of him until it lands.',
    },
    spicy: {
      motif: 'the Taking',
      easy: 'Accept the next offer made to you without minimizing it.',
      medium: 'Ask for exactly what you want and receive it without apologizing for the size of it.',
      hard: 'Be the person who makes receiving normal here — call it out every time someone deflects a good thing, all night, gently.',
    },
  },

  // ── GROW UP — build the capacity ──────────────────────────────────────────
  'GU-A': {
    goodbye: {
      motif: 'the Stage',
      easy: 'Tell someone one thing you understand now that you could not have at twenty-two.',
      medium: 'Ask the youngest and the oldest person here the same question and compare the answers.',
      hard: 'Write the letter to whoever moves into Wendell\'s place in this scene — what this city taught you, what to skip. Leave it with someone.',
    },
    spicy: {
      motif: 'the Grown Version',
      easy: 'Say one thing you are better at now than you were at twenty-two.',
      medium: 'Tell someone the thing you would have been too scared to say ten years ago, and say it now.',
      hard: 'Run the after-midnight thing you would have been too nervous to host five years ago. Set it up properly, consent and all.',
    },
  },
  'GU-J': {
    goodbye: {
      motif: 'the Unguarded Moment',
      easy: 'Tell someone something about yourself you do not usually lead with.',
      medium: 'Let one person see the version of you that you protect them from.',
      hard: 'Be unguarded in front of the room — the toast, the song, the story you never tell — and let it be recorded.',
    },
    spicy: {
      motif: 'the Drop',
      easy: 'Drop the bit. Say the sincere version.',
      medium: 'Tell someone what you actually want from tonight, without a joke wrapped around it.',
      hard: 'Make sincerity available at this party: start a corner where the jokes come down, and keep it running long enough for three people to use it.',
    },
  },
  'GU-Q': {
    goodbye: {
      motif: 'the Longer Arc',
      easy: 'Name one way you have changed your mind about what good friendship looks like.',
      medium: 'Tell someone what you want to grow into next, that you have not told anyone.',
      hard: 'Say the next-chapter thing out loud to three people so it exists outside your head, then write it down and give a copy to one of them.',
    },
    spicy: {
      motif: 'the Next Want',
      easy: 'Name the thing you want more of in your life, in one word, to one person.',
      medium: 'Tell someone the want you have been embarrassed about.',
      hard: 'Turn a want into a plan tonight — the trip, the project, the standing night — and get one other person committed to it.',
    },
  },
  'GU-K': {
    goodbye: {
      motif: 'the Integration',
      easy: 'Name the through-line across your closest friendships in one sentence.',
      medium: 'Ask someone what they think your through-line is.',
      hard: 'Gather what this room knows about Wendell into one shape — the through-line of him — and give it to him in a form he can keep.',
    },
    spicy: {
      motif: 'the Whole Thing',
      easy: 'Say the part of yourself you usually keep out of the party version.',
      medium: 'Bring your whole self to one conversation tonight and see what happens.',
      hard: 'Make the party integrate: get the karaoke people, the kitchen people, and the yard people into one room doing one thing, at least once.',
    },
  },
  'GU-2': {
    goodbye: {
      motif: 'the Reframe',
      easy: 'Tell a story about this city, then tell the version where you are not the hero.',
      medium: 'Ask someone to retell a shared memory from their side. Do not correct them.',
      hard: 'Rewrite one story you have been carrying about a person here, with them, tonight. Say what you are replacing it with.',
    },
    spicy: {
      motif: 'the Second Take',
      easy: 'Retell a story from tonight with the boring parts removed and the true parts left in.',
      medium: 'Ask someone how they would tell the story of you two.',
      hard: 'Run the storytelling round after karaoke: same event, three narrators, everyone hears how differently it landed.',
    },
  },
  'GU-3': {
    goodbye: {
      motif: 'the Question',
      easy: 'Ask someone the question you have been curious about but never asked.',
      medium: 'Ask Wendell the question you have been saving. This is the last easy chance.',
      hard: 'Collect the questions this room still has for each other, write them down, and leave the list somewhere it will get used again.',
    },
    spicy: {
      motif: 'the Real Question',
      easy: 'Ask someone a question you would not ask sober.',
      medium: 'Ask someone what they want that they have not said tonight.',
      hard: 'Run a question round with real stakes — everyone consents to the rules first, anyone can pass, nobody explains their pass.',
    },
  },
  'GU-4': {
    goodbye: {
      motif: 'the Capacity',
      easy: 'Name the emotional capacity you are still building, to one person.',
      medium: 'Ask someone to practice it with you for five minutes right now.',
      hard: 'Set up the thing that keeps you practicing after tonight — a standing call, a check-in, a partner — and get their actual yes.',
    },
    spicy: {
      motif: 'the Stretch',
      easy: 'Do one small thing tonight at the edge of your comfort.',
      medium: 'Tell someone what you are stretching toward and let them watch you do it.',
      hard: 'Be the person who makes the stretch safe for other people: propose the bold thing, go first, and make it fine for anyone to sit out.',
    },
  },
  'GU-5': {
    goodbye: {
      motif: 'the Other Side',
      easy: 'Tell someone what you think tonight is like from Wendell\'s side.',
      medium: 'Ask someone what a hard moment between you looked like from where they stood.',
      hard: 'Go find the person whose experience of this friend group has been most different from yours, and spend twenty real minutes learning it.',
    },
    spicy: {
      motif: 'the Reverse Angle',
      easy: 'Guess out loud what someone thinks of you, then let them correct it.',
      medium: 'Ask someone what the person who loves them most wishes they understood about themselves.',
      hard: 'Make sure the people at the edges of this party get seen tonight. Find three of them and do it deliberately.',
    },
  },
  'GU-6': {
    goodbye: {
      motif: 'the Inherited Pattern',
      easy: 'Name one thing about how you do friendship that you learned at home.',
      medium: 'Tell someone what you were taught about receiving care that you are still unlearning.',
      hard: 'Name the inherited thing you are refusing to carry into the next city, out loud, to someone who will remember you said it.',
    },
    spicy: {
      motif: 'the Old Script',
      easy: 'Name one rule about desire you inherited and never chose.',
      medium: 'Tell someone which rule you are breaking tonight.',
      hard: 'Write down the actual agreements this house is running on tonight — consent, hot tub, karaoke, spicy — and get them posted where people can see them.',
    },
  },
  'GU-7': {
    goodbye: {
      motif: 'the Permission',
      easy: 'Name one thing you are giving yourself permission to be bad at.',
      medium: 'Give someone else permission out loud for something they have been waiting to be allowed.',
      hard: 'Stop waiting on one thing tonight. Whatever you have been holding until you have it figured out — start it here, with a witness.',
    },
    spicy: {
      motif: 'the Green Light',
      easy: 'Give yourself permission for one thing tonight and tell one person what it is.',
      medium: 'Ask someone for the green light on something specific, and mean it when you accept the answer.',
      hard: 'Be the permission structure for the night: make it visibly okay to leave early, sit out, go in the hot tub, or not.',
    },
  },
  'GU-8': {
    goodbye: {
      motif: 'the Blind Spot',
      easy: 'Ask someone what kind of friend they think you are capable of being.',
      medium: 'Ask someone here to name your blind spot. Thank them for the answer.',
      hard: 'Do the thing you can almost see yourself doing — the version of you that has not shown up yet. Pick one, do it tonight, in front of people.',
    },
    spicy: {
      motif: 'the Almost',
      easy: 'Name the thing you almost do at parties and never quite do.',
      medium: 'Tell someone what stops you, and ask them to nudge you past it once tonight.',
      hard: 'Do the almost-thing. Sing it, say it, ask it, join it. Tonight is the night with the lowest possible cost.',
    },
  },
  'GU-9': {
    goodbye: {
      motif: 'the Threshold',
      easy: 'Name the threshold you are standing at, in one sentence, to anyone.',
      medium: 'Ask someone what they are about to cross into. Listen for the fear under it.',
      hard: 'Mark the threshold for the room: call everyone together, name what is ending, and make it an actual moment rather than a slow fade.',
    },
    spicy: {
      motif: 'the Edge',
      easy: 'Name what you are afraid of becoming, quietly, to one person.',
      medium: 'Tell someone what you want that scares you.',
      hard: 'Run the midnight crossing: gather people, mark the hour out loud, and hand the night over to what comes next.',
    },
  },
  'GU-10': {
    goodbye: {
      motif: 'the Long View',
      easy: 'Say what you want your close friendships to feel like in ten years.',
      medium: 'Tell someone what you will need from them once Wendell is gone.',
      hard: 'Build the thing that keeps this group alive at distance — the annual date, the thread, the visit rotation. Get real commitments tonight, not vibes.',
    },
    spicy: {
      motif: 'the Ten-Year Version',
      easy: 'Describe the party you want to be throwing in ten years.',
      medium: 'Tell someone what you want to still be doing at fifty that people would find surprising.',
      hard: 'Start the tradition. Name it, date it, and get at least four people signed up before you leave tonight.',
    },
  },

  // ── SHOW UP — make the move ───────────────────────────────────────────────
  'SU-A': {
    goodbye: {
      motif: 'the First Move',
      easy: 'Text someone not at this party the thing you have been meaning to say.',
      medium: 'Say the thing to Wendell now rather than in the airport text.',
      hard: 'Reach the person who should be here and is not. Call them from the party, put them on speaker, and let the room say hello.',
    },
    spicy: {
      motif: 'the Opening Move',
      easy: 'Make the first move on a conversation you have been orbiting all night.',
      medium: 'Make the actual first move. Ask directly, accept any answer, move on cleanly either way.',
      hard: 'Go first on the thing the whole party is waiting for someone to go first on. Then get out of the way.',
    },
  },
  'SU-J': {
    goodbye: {
      motif: 'the Risk',
      easy: 'Do one thing in the next ten minutes that is slightly outside your comfort zone.',
      medium: 'Offer Wendell the thing that feels most exposing to offer.',
      hard: 'Take the real risk: the toast, the song, the confession, the offer of help that commits you to something. Do it where everyone can see.',
    },
    spicy: {
      motif: 'the Dare',
      easy: 'Take a small dare from someone here. You may set the terms.',
      medium: 'Offer a dare to someone and let them counteroffer.',
      hard: 'Run the dare economy for an hour — consent rules first, anyone can pass, nothing that involves anyone who has not opted in.',
    },
  },
  'SU-Q': {
    goodbye: {
      motif: 'the Open Door',
      easy: 'Tell someone one way they could make it easier to reach you.',
      medium: 'Remove one barrier that has been making it hard to stay in touch with someone. Do it now — the number, the invite, the app.',
      hard: 'Build the open door for the whole group: the shared calendar, the thread, the standing invite. Set it up tonight and get people in it.',
    },
    spicy: {
      motif: 'the Invitation',
      easy: 'Invite someone into whatever you are doing right now.',
      medium: 'Extend the invitation you have been assuming would be declined.',
      hard: 'Host the thing after this: the hot tub, the after-party, the breakfast. Name the time, name the place, invite people out loud.',
    },
  },
  'SU-K': {
    goodbye: {
      motif: 'the Witness',
      easy: 'Tell someone one thing you have witnessed in them recently that you never named.',
      medium: 'Do something for Wendell tonight that is only possible because you actually see him.',
      hard: 'Give the toast that proves this room has been paying attention. Then write it down and hand over the paper.',
    },
    spicy: {
      motif: 'the Seen Thing',
      easy: 'Tell someone what you see in them that they undersell.',
      medium: 'Make someone feel unmistakably seen for one full minute.',
      hard: 'Run the honors: go around and give everyone in a group one specific true thing. Nobody gets skipped.',
    },
  },
  'SU-2': {
    goodbye: {
      motif: 'the Proactive',
      easy: 'Do for someone the thing they always do for others.',
      medium: 'Do the thing for Wendell he has been waiting to be asked for, without making him ask.',
      hard: 'Handle a piece of the move itself — boxes, the drive, the storage, the last week. Commit to something specific with a date on it.',
    },
    spicy: {
      motif: 'the Unasked',
      easy: 'Get someone the thing they were about to get up for.',
      medium: 'Do the unasked-for thing that makes someone\'s night, and do not narrate it.',
      hard: 'Take the job nobody asked you to take — the door, the rides home, the water station — and hold it all night.',
    },
  },
  'SU-3': {
    goodbye: {
      motif: 'the Showing Up',
      easy: 'Name one thing Wendell needs tonight and go do it.',
      medium: 'Show up for someone here the way they show up for everyone else. Pick one thing. Do it now.',
      hard: 'Show up for Wendell the way he has shown up for this scene — pick the specific thing, do it tonight, and put a date on the rest.',
    },
    spicy: {
      motif: 'the Turn Up',
      easy: 'Be the first one on the dance floor.',
      medium: 'Bring one person with you onto the dance floor who was not going to go.',
      hard: 'Make the dance party actually happen: music, lights, first three songs, and the people. Own it start to finish.',
    },
  },
  'SU-4': {
    goodbye: {
      motif: 'the Commitment',
      easy: 'Name one small repeatable thing you will do to stay connected after the move.',
      medium: 'Tell Wendell the commitment and let him hold you to it.',
      hard: 'Make the commitment real tonight: put it in a calendar, in a thread, or in someone else\'s hands, with a date.',
    },
    spicy: {
      motif: 'the Standing Date',
      easy: 'Propose something specific to someone here. A day and a thing.',
      medium: 'Lock it in before you leave. Calendar, not vibes.',
      hard: 'Start the standing thing — the monthly night, the crew, the tradition — and get the first date on four people\'s calendars tonight.',
    },
  },
  'SU-5': {
    goodbye: {
      motif: 'the Seeing',
      easy: 'Tell someone one thing you see in them that they do not see in themselves.',
      medium: 'Do the thing for someone tonight that only makes sense if you have been paying close attention.',
      hard: 'Make the artifact only you could make for Wendell — you know the detail nobody else knows. Make the thing tonight and hand it over.',
    },
    spicy: {
      motif: 'the Notice',
      easy: 'Tell someone the detail about them you have never mentioned.',
      medium: 'Act on something you noticed — get them the thing, play them the song, introduce them to the person.',
      hard: 'Curate a set for this room from what you have noticed about it tonight, and play it.',
    },
  },
  'SU-6': {
    goodbye: {
      motif: 'the Schedule',
      easy: 'Propose a specific thing on a specific date to one person here.',
      medium: 'Book the visit. Pick a month, say it out loud, and put it in a phone.',
      hard: 'Organize the group visit or the send-off caravan. Date, people, logistics — get it to the point where it will happen without you chasing it.',
    },
    spicy: {
      motif: 'the Plan',
      easy: 'Propose the after-hours thing to one person.',
      medium: 'Propose it to the group and make it easy to opt out.',
      hard: 'Own the whole midnight transition — karaoke out, hot tub in, who needs what, where the towels are. Plan it and run it.',
    },
  },
  'SU-7': {
    goodbye: {
      motif: 'the Check-In',
      easy: 'Send someone not here a message that is not a question and not about you.',
      medium: 'Check in with someone here about the thing they did not bring up. Because you noticed.',
      hard: 'Take responsibility for checking on Wendell in the two weeks after the move — set the reminder tonight, in front of him.',
    },
    spicy: {
      motif: 'the Pulse',
      easy: 'Ask someone if they are having a good time and wait for the real answer.',
      medium: 'Find the person having the worst night and change it.',
      hard: 'Be the party\'s care line all night: check in, get people water, arrange rides, notice who needs an exit. Say out loud that you have got it.',
    },
  },
  'SU-8': {
    goodbye: {
      motif: 'the Presence',
      easy: 'Be with someone for two minutes without being useful.',
      medium: 'Do the thing for Wendell that requires you to be present rather than helpful.',
      hard: 'Do the thing you have been avoiding because it would require you to be fully seen — tonight, in this house.',
    },
    spicy: {
      motif: 'the Full Attention',
      easy: 'Put your phone away for one full song and stay in the conversation.',
      medium: 'Give someone twenty minutes of undivided attention and tell them that is what you are doing.',
      hard: 'Make a no-phones zone for an hour, get people to agree to it, and hold the line.',
    },
  },
  'SU-9': {
    goodbye: {
      motif: 'the Pour',
      easy: 'Do one thing tonight that costs you something small — time, comfort, effort.',
      medium: 'Do the most generous thing you can think of for someone here before you leave.',
      hard: 'Give something real to the send-off: the drive to the airport, the storage unit, the couch, the money, the week. Say it, mean it, put a date on it.',
    },
    spicy: {
      motif: 'the Big Pour',
      easy: 'Buy, pour, cook, or carry something for someone right now.',
      medium: 'Give the thing you were saving. Tonight is what you were saving it for.',
      hard: 'Be the one who makes the last hour of this party good — food, water, music, rides. Stay until it is done.',
    },
  },
  'SU-10': {
    goodbye: {
      motif: 'the Reciprocity',
      easy: 'Do one thing that reflects who you have become in this friendship, not who you were at the start.',
      medium: 'Give Wendell the thing only someone who has known him this long could give.',
      hard: 'Make the keepsake: the object, the recording, the book, the mix. Something that only exists because this specific group of people was in this specific house tonight.',
    },
    spicy: {
      motif: 'the Only-You Thing',
      easy: 'Do the thing at this party that only you would do.',
      medium: 'Give someone the thing only you could give them.',
      hard: 'Close the night. Whatever the last thing should be — the song, the toast, the jump in the hot tub, the group photo — make it happen and make it land.',
    },
  },
}
