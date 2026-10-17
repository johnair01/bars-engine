// The Big Mind cave: a fork of the Cave of Lessons with a chamber between hallways and a voice blocking the path in each.
//
// Design: content/ontology-game/bigmind/DESIGN.md, from sprout campaigns/big-mind/build-brief.md and Wendell's board of
// 10 October 2026, 20:19. His steer (bm-phone-first, overruled): "I want it to be a fork of cave of lessons that adds
// chambers between cave hallways with a voice blocking the path". It holds the cave mouth and all seven chambers of the
// daemon path, the Protector's, the Controller's, the Skeptic's, the Fixer's, the Emotional Body's, the Victim's and the
// Damaged Self's, each with the hallway past it (board dp-seven); past the last, the path ends at the centre, where the
// vulnerable child is met (board dp-centre, and Wendell's Player questions in daemons/questions.js).
//
// Needs cave/cave.js loaded first with window.__oagCaveNoStart set: this page borrows its engine (the tunnel, the faceless
// avatar and its walk, the daemon body, the breath, the page guards) from window.__oagCave.kit, so a fix there reaches both
// caves. Nothing is sent anywhere: the kept lines live in this browser's localStorage only (bm-first-player).
(function () {
  "use strict";
  var K = window.__oagCave && window.__oagCave.kit;
  if (!K) { document.body.textContent = "The cave engine (cave.js) did not load."; return; }
  var el = K.el, clamp = K.clamp, at = K.at;
  var STORE = "oag.bigmind.v1";

  // ---- the words ----------------------------------------------------------------------------
  // Each voice's arrival describes its body as the held movement it wears (Six-faces-council council/daemons/GESTURES.md:
  // yield, push, reach, grasp, pull, release, each held stuck in its protective form), so the words match the WARP bodies.
  // Paraphrased from the workshop transcript (/mnt/project-files/big-mind/source/big-mind-transcript.txt, 00:22 to 00:35),
  // with no line quoted longer than one line and no teacher or programme named (bm-name-internal). The cards are the group's
  // own answers (bm-cards-and-line). Cards marked out are the test of secretly speaking: each is an answer a different part
  // would give, so picking one brings the second figure out (bm-dismiss-step-aside). Which cards are out is a choice.
  var TRANSLATORS = {
    // {name} is the voice of the chamber the tell was heard in.
    ideas: { name: "the self's own ideas", short: "The self's ideas", waits: "The self's ideas wait here for their own turn.", tell: "talked about {name} instead of speaking as it" },
    protector: { name: "the Protector", short: "The Protector", waits: "The Protector waits here; you have met it already.", tell: "took up the Protector's job of keeping the self safe", daemon: "protector" },
    fixer: { name: "the Fixer", short: "The Fixer", waits: "The Fixer waits here for its own chamber.", tell: "took up the Fixer's job of repairing things", daemon: "fixer" },
    controller: { name: "the Controller", short: "The Controller", waits: "The Controller waits here for its own chamber.", tell: "took up the Controller's job of keeping things in hand", daemon: "controller" },
    skeptic: { name: "the Skeptic", short: "The Skeptic", waits: "The Skeptic waits here for its own chamber.", tell: "doubted, which is the Skeptic's job", daemon: "skeptic" },
    unknown: { name: "a voice not met yet", short: "Not sure", waits: "A voice not met yet waits here for its turn.", tell: "" },
    felt: { tell: "did not feel like {name} to you" },
  };
  // The chamber is a conversation (Wendell, 10 October 2026, 21:48: "There needs to be more back and forth between the
  // player and the protector. We have to ask its permission to step aside and if the player feels it doesn't want to give
  // permission then they go down another dialogue path."). The voice speaks first and answers back. Three times the player
  // asks its permission: to speak with it, for it to step aside so the player can stand in its place, and to walk on past.
  // Each time the player reads its answer: it lets them, it holds back, or they can't tell. Holding back opens the refusal
  // path: asking what it fears, saying what it fears as it, offering an assurance, and asking again; or leaving it at its
  // post. The lines are a choice, written from the transcript's Protector (00:22 to 00:35).
  var VOICES = [
    {
      id: "protector", name: "the Protector", title: "The Protector", daemon: "protector",
      arrive: "A broad figure stands in the middle of the way, both palms out at shoulder height, set into a push over its bent front knee. It does not move aside.",
      meet: {
        opens: "Stop. Nobody goes past this point.",
        replies: [
          ["Who are you?", "I keep the way. That is all you need to know.", "who"],
          ["I'm not here to get past you. I'd like to hear from you.", "Hear from me? Nobody asks to hear from me. They push past, or they turn back.", "hear"],
          ["I need to get through.", "Then you'll wait. Everything past here could hurt you.", "push"],
        ],
        after: { hear: "Then I'd like to hear from you, if you'll let me.", push: "Then before I go anywhere, I'd like to hear from you.", who: "Keeper of the way, I'd like to hear from you." },
      },
      asks: {
        speak: { ask: "Protector, may I speak with you for a while?", yes: "Speak, then. But I'm watching.", no: ["Why should I? Every time I let someone in, something gets hurt.", "I've heard that before.", "No. Not yet."] },
        aside: { ask: "Will you step aside, and let me stand where you stand, so I can see what you see?", yes: "For a while. I'll be right here.", no: ["Step aside? If I step aside, the way is open.", "You don't know what it takes to stand here.", "Not yet. Ask me again."] },
        pass: { ask: "Will you let me walk on past you?", yes: "Go on, then. I'll keep watch behind you.", no: ["Past me? I've only just been heard.", "What's ahead is worse than what's behind.", "Not yet."] },
      },
      fears: [["The self will get hurt."], ["I'll be blamed when it does."], ["Nobody will need me anymore."], ["Something will get out that should stay in."], ["I won't get my post back."]],
      assure: [["I'll come back to my own place when we're done."], ["Nothing will be taken from you. You keep your post."], ["I'll go slowly, and you can stop me at any time."], ["I'm not trying to get rid of you. I want to know you."]],
      assured: ["...Alright. I'll hold you to that.", "Hm. We'll see.", "That's more than anyone has said to me in a long time."],
      // The questions are asked from the outside, as the self getting acquainted with a part that already lives within
      // (Wendell, 10 October 2026, 22:39). The player gives its answers. Job, who it works for and its hours are what the
      // player needs to know about every part; the rest come closer to the evidence.
      questions: [
        { id: "job", ask: "What is your job?", reflect: "Your job is to protect.", cards: [
          ["To protect."], ["To keep the self safe."], ["To keep my family safe."], ["To keep watch."],
          ["It's trying to keep me safe.", "ideas"], ["To keep everything in hand.", "controller"],
        ] },
        { id: "boss", ask: "Who do you work for?", reflect: "That's who you answer to.", cards: [
          ["The self."], ["The family."], ["Whoever is in danger."], ["I thought it was the self. It never thanks me."], ["I'm not sure anymore."],
          ["Maybe it works for my parents.", "ideas"],
        ] },
        { id: "hours", ask: "And what are your hours?", reflect: "Those are long hours.", cards: [
          ["Day and night."], ["Every hour there is."], ["I never get a day off."], ["Even in my sleep."], ["Whenever something comes close, which is always."],
        ] },
        { id: "from", ask: "What do you protect the self from?", multi: true, reflect: "From all of that, and from itself too. There's no end to it.", cards: [
          ["Attack."], ["Danger, from anywhere."], ["Pain."], ["Shame."], ["Looking bad."], ["Risk."], ["Uncertainty."],
          ["Loss."], ["Losing control."], ["Too much excitement."], ["Other people, even loved ones."], ["Itself."],
          ["I'd fix whatever is hurting it.", "fixer"], ["Maybe it protects me from feeling.", "ideas"],
        ] },
        // Wendell's own questions for the Protector (14 October 2026, daemons/questions.js, where his exact words are): what
        // it protects, how that keeps the body alive, what that is vulnerable to, and what it fears without it. They come
        // after the first questions, closer to the evidence. The vulnerable cards are the five elements as the WAVE names them.
        { id: "what", ask: "Who or what are you protecting: the self, something, or someone?", reflect: "So that's what you stand in front of.", cards: [
          ["The self."], ["Someone I love."], ["Something precious."], ["The body."], ["A secret."], ["A younger me."],
          ["I'd keep all of it in hand.", "controller"],
        ] },
        { id: "survive", ask: "How does protecting it keep the body alive?", reflect: "As far as you can tell, it's life or death.", cards: [
          ["If it gets hurt, I don't survive."], ["It keeps us fed and housed."], ["It keeps us in the group."], ["It keeps the body out of danger."], ["I'm not sure it does anymore."],
          ["I doubt it does, honestly.", "skeptic"],
        ] },
        { id: "vulnerable", ask: "What is it vulnerable to? Which feeling, which element?", multi: true, reflect: "That's what gets through.", cards: [
          ["Anger. Fire."], ["Sadness. Water."], ["Joy. Wood."], ["Fear. Metal."], ["Feeling nothing. Earth."], ["All of them."],
        ] },
        { id: "afraid", ask: "What are you afraid will happen if you don't protect it?", multi: true, reflect: "That's a lot to hold back on your own.", cards: [
          ["The self will get hurt."], ["It will be gone for good."], ["Nobody will be left to stand here."], ["Something will get out that should stay in."], ["I'll be blamed."],
        ] },
        { id: "how", ask: "How do you do it? What happens when something gets through?", multi: true, reflect: "And when it gets through again, you build it higher.", cards: [
          ["I build walls."], ["I set borders."], ["I sound the alarm."], ["I send for reinforcements."], ["I build the wall higher."],
          ["I build a dome over everything."], ["I'd fix the breach for good.", "fixer"],
        ] },
        { id: "pay", ask: "How are you thanked for all of this?", reflect: "Working all hours, and hardly thanked.", cards: [
          ["I'm not."], ["Hardly ever."], ["The self calls me a prison."], ["It's exhausting."],
          ["I doubt anyone could thank me enough to make it worth it.", "skeptic"], ["It does its best, poor thing.", "ideas"],
        ] },
        { id: "feel", ask: "How does that feel?", reflect: "Thank you for telling me.", cards: [
          ["Unfair."], ["Like I'm failing."], ["Devalued."], ["Lonely."], ["Tired."], ["Like nobody sees me."],
        ] },
      ],
      // Where the part lives in the body: the ontology game's body places, or the body map itself when the page has it.
      places: ["Chest", "Throat", "Belly", "Shoulders", "Jaw", "Back", "Head", "Hands", "All over"],
      ready: "...I think I could step aside for a while. If you'd like to stand where I stand, you can.",
      notYet: "I don't know you well enough yet.",
      seat: "You are standing where the Protector stands. The self is back there, where you were a moment ago, and everything that comes toward it comes past here first.",
      know: { ask: "From here, what does the Protector want the self to know?", cards: [["I'm still here."], ["I did my best."], ["I'm tired."], ["Let me rest sometimes."], ["Thank me once in a while."]] },
      thanks: "Thank you, Protector. Every voice has a right to be heard, and you have been. I'm going to step back out now and let you have your post again.",
    },
    // The Controller, second on the daemon path (board dp-seven), met with Wendell's own set for it (daemons/questions.js):
    // what it controls, who it works for, how it does that work, what happens if its standards are violated, and what
    // happens when it is not there. The boss question is where the chain shows in play (board dq-boss-chain): the player
    // picks who it works for, and the method question that follows changes with the answer (byBoss, his words for three
    // bosses; the vulnerable child has none, so the plain question stays). Its cards change with the boss too. The lines,
    // its look ("To set the standard.", the rod) and the cards are written from the cave's daemon row and the council's
    // daemons.yaml ("Not yet. Not until this is handled."); choices, all of them.
    {
      id: "controller", name: "the Controller", title: "The Controller", daemon: "controller",
      arrive: "A tall figure stands rigid in the middle of the way, feet together, fists set on its hips and elbows out wide, chin up. It looks you over before you've said a word.",
      meet: {
        opens: "Not yet. Not until this is handled.",
        replies: [
          ["Who are you?", "I set the standard. Someone has to.", "who"],
          ["I'm not here to get past you. I'd like to hear from you.", "Hear from me? Fine. But we do this properly, one step at a time.", "hear"],
          ["I need to get through.", "Not like this. You're not ready yet.", "push"],
        ],
        after: { hear: "Then I'd like to hear from you, properly, if you'll let me.", push: "Then before I go anywhere, I'd like to hear from you.", who: "Keeper of the standard, I'd like to hear from you." },
      },
      asks: {
        speak: { ask: "Controller, may I speak with you for a while?", yes: "Go ahead. Keep it in order.", no: ["Not until I know where this is going.", "Last time this got out of hand.", "Not yet."] },
        aside: { ask: "Will you step aside, and let me stand where you stand, so I can see what you see?", yes: "For a while. I'll be watching how you do it.", no: ["If I step aside, who holds the standard?", "You'd do it differently. That's the trouble.", "Not yet. Ask me again."] },
        pass: { ask: "Will you let me walk on past you?", yes: "Go on, then. Mind the standard.", no: ["You haven't got it right yet.", "What's ahead needs a plan.", "Not yet."] },
      },
      fears: [["Everything will fall apart."], ["We'll be caught unprepared."], ["Someone will see us get it wrong."], ["Nobody will hold the line."], ["I won't be needed."]],
      assure: [["I'll come back to my own place when we're done."], ["Nothing will be undone. The standard stays yours."], ["I'll go one step at a time, and you can stop me at any time."], ["I'm not trying to get rid of you. I want to know you."]],
      assured: ["...Fine. One step at a time.", "Hm. I'll be checking.", "Nobody has asked me what I need before."],
      questions: [
        { id: "what", ask: "What, or who, are you controlling?", reflect: "So that's what you keep in hand.", cards: [
          ["How I come across."], ["My time."], ["What I say, before I say it."], ["The plan."], ["The people around me."], ["The feeling, before it shows."],
          ["I'd keep all of us safe.", "protector"],
        ] },
        // A card's third place names the boss (questions.js bosses: protector, self, controller, player, where the player
        // is the vulnerable child).
        { id: "boss", boss: true, ask: "Who do you work for: the Protector, the self, control itself, or the vulnerable child?", reflect: "That's who you answer to.", cards: [
          ["The Protector.", null, "protector"], ["The self.", null, "self"], ["Control itself.", null, "controller"], ["The vulnerable child.", null, "player"], ["I'm not sure anymore."],
          ["Maybe it works for my parents.", "ideas"],
        ], reflectByBoss: {
          protector: "So you answer to the Protector. You keep it all in hand so the body stays safe.",
          self: "So you answer to the self. You hold it to a standard.",
          controller: "So you answer to control itself. Nobody else gives the orders.",
          player: "So you answer to the vulnerable child. You keep it from being hurt again.",
        } },
        { id: "how", ask: "How are you doing the work of who you work for?", reflect: "That's how the work gets done.", byBoss: {
          protector: "How are you protecting the physical body by controlling?",
          self: "What standards are you setting for the self?",
          controller: "What standards are you setting about control itself?",
        }, cards: [
          ["I set the standard."], ["I make plans."], ["I rehearse what to say."], ["I wait for the right moment."], ["I check everything twice."],
          ["I'd fix it so it never goes wrong.", "fixer"],
        ], cardsByBoss: {
          protector: [["If everything is in hand, nothing can hurt us."], ["I plan for every danger."], ["I keep the body out of risk."], ["I stop us before we act."], ["I'd fix it so it never goes wrong.", "fixer"]],
          self: [["Do it right, or don't do it."], ["Never look foolish."], ["Be ready before you begin."], ["Always know what to say."], ["Never need help."]],
          controller: [["Control is better than no control."], ["Know the outcome before you start."], ["Nothing happens that I didn't plan."], ["Rules are rules."], ["If I let go once, I'll never get it back."]],
          player: [["I keep it still so it can't be hurt."], ["I keep it from trying anything new."], ["I decide when it's safe to play."], ["I make the plans so it doesn't have to."]],
        } },
        { id: "violated", ask: "What happens if your standards are violated?", multi: true, reflect: "That's what you're holding off.", cards: [
          ["I tighten everything."], ["I go over it again and again."], ["I blame the self."], ["I shut it all down."], ["Everything falls apart."],
          ["I doubt they were worth having.", "skeptic"],
        ] },
        { id: "gone", ask: "What happens when you're not there?", multi: true, reflect: "No wonder you never leave.", cards: [
          ["Chaos."], ["We get caught out."], ["Someone gets hurt."], ["The self makes a fool of itself."], ["Nothing gets done."], ["I'm not sure. I've never left."],
        ] },
        { id: "hours", ask: "And what are your hours?", reflect: "Those are long hours.", cards: [
          ["Day and night."], ["Every waking hour."], ["Before anything happens, and after."], ["Even in my sleep, going over it."], ["Whenever anything feels uncertain, which is always."],
        ] },
        { id: "pay", ask: "How are you thanked for all of this?", reflect: "Working all hours, and hardly thanked.", cards: [
          ["I'm not."], ["When it goes to plan, nobody notices."], ["The self calls me rigid."], ["It's exhausting."],
          ["I doubt anyone could thank me enough.", "skeptic"], ["It means well, really.", "ideas"],
        ] },
        { id: "feel", ask: "How does that feel?", reflect: "Thank you for telling me.", cards: [
          ["Unfair."], ["Tense."], ["Tired."], ["Unappreciated."], ["Lonely."], ["Like nobody sees what I hold."],
        ] },
      ],
      places: ["Chest", "Throat", "Belly", "Shoulders", "Jaw", "Back", "Head", "Hands", "All over"],
      ready: "...Alright. I think I could step aside for a while, if you do it properly.",
      notYet: "I'm not ready to hand anything over yet.",
      seat: "You are standing where the Controller stands. The self is back there, where you were a moment ago, and every move it makes is measured here first.",
      know: { ask: "From here, what does the Controller want the self to know?", cards: [["I'm only trying to help."], ["It doesn't have to be perfect. It has to be safe."], ["I'm tired of holding it all."], ["Let me rest sometimes."], ["Thank me once in a while."]] },
      thanks: "Thank you, Controller. Every voice has a right to be heard, and you have been. I'm going to step back out now and let you have your post again.",
    },
    // The Skeptic, third on the daemon path (board dp-seven), met with Wendell's own set for it (daemons/questions.js): what it
    // doubts, who it works for, how doubt serves who it works for, and what happens when it is not there. His boss question
    // for it is the plain one, so the cards name the bosses (questions.js bosses), and the Controller is one of them: it is a
    // figure the player has met by now, so the chain shows (board dq-boss-chain). He gave one method question, so its wording
    // stays and only the cards change with the boss. The lines, its look ("To doubt.", the lens) and the cards are written from
    // the cave's daemon row and the council's daemons.yaml ("They cannot actually mean that. Look at the evidence."); choices,
    // all of them.
    {
      id: "skeptic", name: "the Skeptic", title: "The Skeptic", daemon: "skeptic",
      bossNames: { controller: "the Controller" },
      arrive: "A lean figure stands in the middle of the way, drawn back from you: chest and head pulled back and turned aside, elbows behind it, hands held in at its belly, weight on its back foot. It studies you, unconvinced.",
      meet: {
        opens: "You can't actually mean that. Show me the evidence.",
        replies: [
          ["Who are you?", "I check what's true. Someone has to.", "who"],
          ["I'm not here to get past you. I'd like to hear from you.", "Hear from me? I doubt you mean it. But go on.", "hear"],
          ["I need to get through.", "Through to what? I don't believe there's anything there.", "push"],
        ],
        after: { hear: "I do mean it. I'd like to hear from you, if you'll let me.", push: "Then before I go anywhere, I'd like to hear from you.", who: "Checker of what's true, I'd like to hear from you." },
      },
      asks: {
        speak: { ask: "Skeptic, may I speak with you for a while?", yes: "Go on. I'm listening, for now.", no: ["What would be the point?", "You'll say what everyone says.", "I doubt it."] },
        aside: { ask: "Will you step aside, and let me stand where you stand, so I can see what you see?", yes: "For a while. I don't expect much.", no: ["If I step aside, who checks what's real?", "You'd believe anything.", "Not yet. Show me you mean it."] },
        pass: { ask: "Will you let me walk on past you?", yes: "Go on, then. Don't say I didn't warn you.", no: ["You haven't shown me anything yet.", "There's nothing past here worth having.", "Not yet."] },
      },
      fears: [["We'll be fooled again."], ["We'll get our hopes up for nothing."], ["Someone will take advantage."], ["We'll look naive."], ["Nobody will check what's true."]],
      assure: [["I'll come back to my own place when we're done."], ["You can keep checking. I'm not asking you to believe anything."], ["I'll go one step at a time, and you can stop me at any time."], ["I'm not trying to get rid of you. I want to know you."]],
      assured: ["...We'll see.", "Hm. I'll believe it when I see it.", "Nobody has asked what I think before. Not really."],
      questions: [
        { id: "what", ask: "What, or who, do you doubt?", reflect: "So that's what you won't take at its word.", cards: [
          ["Compliments."], ["Whether people mean it."], ["That it will work out."], ["Anyone who says they care."], ["Good news."], ["Myself."],
          ["It just doesn't trust anyone.", "ideas"],
        ] },
        // A card's third place names the boss (questions.js bosses: protector, self, controller, player, where the player is
        // the vulnerable child). Here "controller" is the Controller, met in the chamber before.
        { id: "boss", boss: true, ask: "Who do you work for?", reflect: "That's who you answer to.", cards: [
          ["The Protector.", null, "protector"], ["The Controller.", null, "controller"], ["The self.", null, "self"], ["The vulnerable child.", null, "player"], ["I'm not sure anymore."],
          ["Maybe it learned it from my parents.", "ideas"],
        ], reflectByBoss: {
          protector: "So you answer to the Protector. Doubt keeps anything from getting close enough to hurt.",
          controller: "So you answer to the Controller. Nothing gets in until you've checked it.",
          self: "So you answer to the self. You keep it from being fooled.",
          player: "So you answer to the vulnerable child. You keep it from hoping and being let down.",
        } },
        { id: "how", ask: "How does doubt serve who you work for?", reflect: "That's what the doubt is for.", cards: [
          ["I question everything."], ["I wait for proof."], ["I find the catch."], ["I take the warmth out of it."], ["I say no before anyone else can."],
          ["I'd fix whatever doesn't hold up.", "fixer"],
        ], cardsByBoss: {
          protector: [["If I don't believe it, it can't hurt us."], ["I keep everyone at arm's length."], ["I find the danger in every kindness."], ["I stop us trusting too soon."], ["I'd keep every danger out.", "protector"]],
          controller: [["I check it before it's allowed in."], ["I find the flaw in the plan."], ["Nothing counts until it's proven."], ["I make sure we're never surprised."], ["I'd keep it all in hand myself.", "controller"]],
          self: [["I keep it from looking foolish."], ["I stop it believing what it's told."], ["I make it earn every good thing."], ["I keep its hopes small."], ["I'd make it work properly myself.", "fixer"]],
          player: [["If it doesn't hope, it can't be let down."], ["I tell it not to get excited."], ["I keep it from trusting anyone too fast."], ["I say it's probably nothing."]],
        } },
        { id: "gone", ask: "What happens when you're not there?", multi: true, reflect: "No wonder you keep watching.", cards: [
          ["We get fooled."], ["We hope, and get hurt."], ["We believe the wrong people."], ["We look naive."], ["Somebody takes advantage."], ["I'm not sure. I've never left."],
        ] },
        { id: "hours", ask: "And what are your hours?", reflect: "Those are long hours.", cards: [
          ["Day and night."], ["Whenever anyone says something kind."], ["Every time something good happens."], ["Even in my sleep, going over what they meant."], ["Whenever there's a promise, which is always."],
        ] },
        { id: "pay", ask: "How are you thanked for all of this?", reflect: "Working all hours, and hardly thanked.", cards: [
          ["I'm called negative."], ["Hardly."], ["Only when I'm proven right."], ["It's exhausting."],
          ["Nobody notices how much I keep in hand.", "controller"], ["It thinks it's being realistic.", "ideas"],
        ] },
        { id: "feel", ask: "How does that feel?", reflect: "Thank you for telling me.", cards: [
          ["Lonely."], ["Tired."], ["Unappreciated."], ["Like I'm always the bad guy."], ["Like I'd love to be wrong."], ["Cold."],
        ] },
      ],
      places: ["Chest", "Throat", "Belly", "Shoulders", "Jaw", "Back", "Head", "Hands", "All over"],
      ready: "...Fine. I could step aside for a while. I'm not promising anything.",
      notYet: "I'm not convinced yet.",
      seat: "You are standing where the Skeptic stands. The self is back there, where you were a moment ago, and everything it hears is weighed here first.",
      know: { ask: "From here, what does the Skeptic want the self to know?", cards: [["I'm only trying to keep you from being fooled."], ["Not everyone means it."], ["I'd love to be wrong."], ["I'm tired of checking."], ["Thank me once in a while."]] },
      thanks: "Thank you, Skeptic. Every voice has a right to be heard, and you have been. I'm going to step back out now and let you have your post again.",
    },
    // The Fixer, fourth on the daemon path (board dp-seven), met with Wendell's own set for it (daemons/questions.js): what it
    // fixes, who it works for, how fixing (repairing or holding in place) serves who it works for, and what would happen if it
    // weren't there. His boss question is the plain one, and to the Fixer "controller" is the Controller, met two chambers back,
    // so the chain shows (board dq-boss-chain). He gave one method question, so its wording stays and only the cards change with
    // the boss. The lines, its look ("To fix, in both senses", the wrench) and the cards are written from the cave's daemon row
    // and the council's daemons.yaml ("There is a problem here and I should solve it."); choices, all of them.
    {
      id: "fixer", name: "the Fixer", title: "The Fixer", daemon: "fixer",
      bossNames: { controller: "the Controller" },
      arrive: "A figure pitches far forward in the middle of the way, over a bent front knee, both long arms out to something you can't see. It looks up only long enough to check whether you're broken too.",
      meet: {
        opens: "There's a problem here. Give me a minute and I'll have it sorted.",
        replies: [
          ["Who are you?", "I fix things. Somebody has to.", "who"],
          ["I'm not here to get past you. I'd like to hear from you.", "Hear from me? There's no time for that. But all right.", "hear"],
          ["I need to get through.", "Not yet. Nothing goes through until it's fixed.", "push"],
        ],
        after: { hear: "I'm not here to be fixed. I'd like to hear from you, if you'll let me.", push: "Then before I go anywhere, I'd like to hear from you.", who: "Fixer of things, I'd like to hear from you." },
      },
      asks: {
        speak: { ask: "Fixer, may I speak with you for a while?", yes: "While I work. Go on.", no: ["I'm in the middle of something.", "Talking doesn't fix anything.", "Not until this is sorted."] },
        aside: { ask: "Will you step aside, and let me stand where you stand, so I can see what you see?", yes: "For a while. Don't touch anything.", no: ["If I put this down, it all comes apart.", "You'd only make it worse.", "Not yet. It's nearly fixed."] },
        pass: { ask: "Will you let me walk on past you?", yes: "Go on. Mind the loose bits.", no: ["It isn't safe yet. It isn't finished.", "Not while it's still broken.", "Not yet."] },
      },
      fears: [["It'll stay broken."], ["It'll get worse."], ["We'll be helpless."], ["I'll be useless."], ["Nobody else will fix it."]],
      assure: [["I'll come back to my own place when we're done."], ["You can pick it up again after. I'm not asking you to stop for good."], ["I'll go one step at a time, and you can stop me at any time."], ["I'm not trying to get rid of you. I want to know you."]],
      assured: ["...All right. Just for a minute.", "Hm. It'll keep, I suppose.", "Nobody has ever asked me to put it down before."],
      questions: [
        { id: "what", ask: "What, or who, do you fix?", reflect: "So that's what you keep mending.", cards: [
          ["Feelings."], ["Other people's problems."], ["Whatever is broken."], ["Myself."], ["The mood in the room."], ["The way things should be."],
          ["It just wants to help.", "ideas"],
        ] },
        // A card's third place names the boss (questions.js bosses: protector, self, controller, player, where the player is
        // the vulnerable child). Here "controller" is the Controller, met two chambers before.
        { id: "boss", boss: true, ask: "Who do you work for?", reflect: "That's who you answer to.", cards: [
          ["The Protector.", null, "protector"], ["The Controller.", null, "controller"], ["The self.", null, "self"], ["The vulnerable child.", null, "player"], ["I'm not sure anymore."],
          ["Maybe it learned it from always being the helper.", "ideas"],
        ], reflectByBoss: {
          protector: "So you answer to the Protector. A broken thing is a way in, so you close it.",
          controller: "So you answer to the Controller. You keep everything the way it's meant to be.",
          self: "So you answer to the self. You make it better, so it never has to feel it.",
          player: "So you answer to the vulnerable child. You mend what hurts it before it can cry.",
        } },
        { id: "how", ask: "How does fixing, repairing or holding in place, serve who you work for?", reflect: "That's what the fixing is for.", cards: [
          ["I turn a feeling into a problem."], ["A problem has a solution."], ["I hold it in place so it can't fall apart."], ["I mend it before anyone notices."], ["I keep busy, so nothing gets felt."],
          ["I doubt it can be fixed at all.", "skeptic"],
        ], cardsByBoss: {
          protector: [["A broken thing lets danger in, so I seal it."], ["I patch the hole before anything gets through."], ["I hold the walls together."], ["I make it safe again, fast."], ["I'd keep every danger out.", "protector"]],
          controller: [["I put it back the way it's meant to be."], ["I hold everything in place."], ["I sort it before it gets out of hand."], ["I keep it to the standard."], ["I'd keep it all in hand myself.", "controller"]],
          self: [["I make it better so it doesn't have to feel bad."], ["I make it useful, so it's wanted."], ["I improve it before anyone sees."], ["I fix it so it's never the broken one."], ["I doubt it's worth fixing.", "skeptic"]],
          player: [["I mend what hurts it."], ["I make it stop crying."], ["I fix things so it never has to wait for help."], ["I hold it together."]],
        } },
        { id: "gone", ask: "What would happen if you weren't there?", multi: true, reflect: "No wonder you keep working.", cards: [
          ["It stays broken."], ["Everything falls apart."], ["We'd have to just feel it."], ["Nobody would help."], ["We'd be helpless."], ["I'm not sure. I've never put the wrench down."],
        ] },
        { id: "hours", ask: "And what are your hours?", reflect: "Those are long hours.", cards: [
          ["Day and night."], ["Whenever something breaks, which is always."], ["Whenever anyone is upset."], ["Even in my sleep, working on it."], ["There's always another thing."],
        ] },
        { id: "pay", ask: "How are you thanked for all of this?", reflect: "Working all hours, and hardly thanked.", cards: [
          ["When it's fixed, I'm forgotten."], ["I'm told to stop meddling."], ["Hardly."], ["It's exhausting."],
          ["Nobody notices how much I keep in hand.", "controller"], ["It thinks it's being helpful.", "ideas"],
        ] },
        { id: "feel", ask: "How does that feel?", reflect: "Thank you for telling me.", cards: [
          ["Tired."], ["Useless, when it won't fix."], ["Unappreciated."], ["Like it's never finished."], ["Like I'd love to just sit down."], ["Alone with it."],
        ] },
      ],
      places: ["Hands", "Shoulders", "Chest", "Jaw", "Belly", "Back", "Head", "Throat", "All over"],
      ready: "...All right. I could put it down for a while. It'll keep.",
      notYet: "It isn't finished yet.",
      seat: "You are standing where the Fixer stands. The self is back there, where you were a moment ago, and everything it feels comes here first to be mended.",
      know: { ask: "From here, what does the Fixer want the self to know?", cards: [["I'm only trying to help."], ["Not everything is yours to fix."], ["I'd love to just sit with you."], ["I'm tired of mending."], ["Thank me once in a while."]] },
      thanks: "Thank you, Fixer. Every voice has a right to be heard, and you have been. I'm going to step back out now and let you have your post again.",
    },
    // The Emotional Body, fifth on the daemon path (board dp-seven), met with Wendell's own set for it (daemons/questions.js):
    // what it feels, who it works for, what happens if it isn't there, and how it knows it has done a good job. His set has no
    // method question; its measure question is new to the chambers, so that is the one whose cards change with the boss. To
    // the Emotional Body "controller" is the Controller, met three chambers back, so the chain shows (board dq-boss-chain). The
    // lines, its look (the orb, "To receive the signal and process it into meaning") and the cards are written from the cave's
    // daemon row and the council's daemons.yaml ("This is what is actually moving."; it hands the feeling off before it has
    // finished arriving); choices, all of them. The feelings card follows the five channels: fear, anger, sadness, joy, flat.
    {
      id: "emotional-body", name: "the Emotional Body", title: "The Emotional Body", daemon: "emotional-body",
      bossNames: { controller: "the Controller" },
      arrive: "A figure stands in the middle of the way with its arms flung wide and up, palms open, chest thrown up and head back, up on its front foot, its colour shifting faster than you can name it. It turns toward you as if it felt you coming before it saw you.",
      meet: {
        opens: "Something's moving here. I felt you before you came round the bend.",
        replies: [
          ["Who are you?", "I'm what feels it first. This is what is actually moving.", "who"],
          ["I'm not here to get past you. I'd like to hear from you.", "Hear me? Most people want me quieter. All right.", "hear"],
          ["I need to get through.", "Not while this is still coming in. Not until I know what it means.", "push"],
        ],
        after: { hear: "I'm not here to calm you down. I'd like to hear from you, if you'll let me.", push: "Then before I go anywhere, I'd like to hear from you.", who: "Feeler of things, I'd like to hear from you." },
      },
      asks: {
        speak: { ask: "Emotional Body, may I speak with you for a while?", yes: "Yes. I've been waiting for someone to ask.", no: ["It's too much right now.", "You'll only tell me to calm down.", "Not while it's still coming in."] },
        aside: { ask: "Will you step aside, and let me stand where you stand, so I can see what you see?", yes: "For a while. It'll still be moving when you get here.", no: ["If I stop feeling it, nobody will.", "You'd go numb.", "Not yet. It hasn't finished arriving."] },
        pass: { ask: "Will you let me walk on past you?", yes: "Go on. Feel your way.", no: ["It isn't finished. I haven't said what it means.", "Not while it's still this strong.", "Not yet."] },
      },
      fears: [["It'll be lost."], ["Nobody will feel it."], ["We'll go numb."], ["It'll come out all wrong."], ["I'll be too much."]],
      assure: [["I'll come back to my own place when we're done."], ["You can feel it again after. I'm not asking you to stop for good."], ["I'll go one step at a time, and you can stop me at any time."], ["I'm not trying to calm you down. I want to know you."]],
      assured: ["...All right. Gently, then.", "Hm. It'll still be here, I suppose.", "Nobody has ever asked me before. They only ask me to stop."],
      questions: [
        { id: "what", ask: "What do you feel?", reflect: "So that's what's moving.", cards: [
          ["Everything, all at once."], ["Fear."], ["Anger."], ["Sadness."], ["Joy."], ["Nothing. It's gone flat."],
          ["It feels too much, I think.", "ideas"],
        ] },
        // A card's third place names the boss (questions.js bosses: protector, self, controller, player, where the player is
        // the vulnerable child). Here "controller" is the Controller, met three chambers before.
        { id: "boss", boss: true, ask: "Who do you work for?", reflect: "That's who you answer to.", cards: [
          ["The Protector.", null, "protector"], ["The Controller.", null, "controller"], ["The self.", null, "self"], ["The vulnerable child.", null, "player"], ["I'm not sure anymore."],
          ["Maybe it learned to feel for everyone.", "ideas"],
        ], reflectByBoss: {
          protector: "So you answer to the Protector. You feel the danger first, so it can move in time.",
          controller: "So you answer to the Controller. You feel it, and it decides what's allowed out.",
          self: "So you answer to the self. You feel it, so it knows what it wants.",
          player: "So you answer to the vulnerable child. You feel what it can't say yet.",
        } },
        { id: "gone", ask: "What happens if you're not there?", multi: true, reflect: "No wonder you keep feeling.", cards: [
          ["Nothing would mean anything."], ["We'd go numb."], ["Nobody would know what's wrong."], ["It would all come out sideways."], ["The child would be alone with it."], ["I'm not sure. I've never stopped."],
        ] },
        // His measure question, new with this chamber: how it knows the feeling landed. Its wording stays; the cards change with
        // the boss, as the method cards do in the chambers before.
        { id: "good-job", ask: "How do you know you've done a good job?", reflect: "That's how you know it landed.", cards: [
          ["When the feeling has finished moving."], ["When it has a name."], ["When it turns into something we can use."], ["When somebody thanks me for it."], ["When nobody can tell."],
          ["When it's fixed and gone.", "fixer"], ["I doubt I ever do.", "skeptic"],
        ], cardsByBoss: {
          protector: [["When we're safe again."], ["When the warning got through in time."], ["When we moved before it hit."], ["When the fear can rest."], ["When nothing can get in.", "protector"]],
          controller: [["When it came out the way it should."], ["When nobody saw too much."], ["When it was felt at the right time, in the right place."], ["When it stayed in proportion."], ["When it's all kept in hand.", "controller"]],
          self: [["When it knows what it wants."], ["When it feels like itself again."], ["When the feeling made sense."], ["When it could say it out loud."], ["When it's fixed and gone.", "fixer"]],
          player: [["When the child isn't alone with it."], ["When it got to cry, or laugh."], ["When someone listened."], ["When it felt safe enough to feel."]],
        } },
        { id: "hours", ask: "And what are your hours?", reflect: "Those are long hours.", cards: [
          ["Always. I never switch off."], ["Whenever something moves."], ["Most of all at night."], ["Before anyone else knows."], ["Every time someone in the room feels something."],
        ] },
        { id: "pay", ask: "How are you thanked for all of this?", reflect: "Feeling all of it, and hardly thanked.", cards: [
          ["I'm called too much."], ["I'm told to calm down."], ["Sometimes you listen."], ["Hardly."],
          ["I doubt feelings tell you anything.", "skeptic"], ["It's just being emotional.", "ideas"],
        ] },
        { id: "feel", ask: "How does that feel?", reflect: "Thank you for telling me.", cards: [
          ["Tired."], ["Unheard."], ["Too much."], ["Like I have to shout to be felt."], ["Like I'd love to be felt for once."], ["Alone with it."],
        ] },
      ],
      places: ["Chest", "Throat", "Belly", "Face", "Eyes", "Shoulders", "Hands", "Back", "All over"],
      ready: "...All right. I can let it move without me for a while. It'll still be here.",
      notYet: "It hasn't finished arriving.",
      seat: "You are standing where the Emotional Body stands. The self is back there, where you were a moment ago, and everything it feels arrives here first.",
      know: { ask: "From here, what does the Emotional Body want the self to know?", cards: [["Feel it before you fix it."], ["I'm not too much."], ["Everything I tell you means something."], ["I'm tired of being hushed."], ["Thank me once in a while."]] },
      thanks: "Thank you, Emotional Body. Every voice has a right to be heard, and you have been. I'm going to step back out now and let you have your post again.",
    },
    // The Victim, sixth on the daemon path (board dp-seven), met with Wendell's own set for it (daemons/questions.js): the
    // sympathetic stories it tells, who it works for, who it advocates for, the shadow sympathy its advocacy gets it, and what
    // happens if it isn't there. His set has no method question; who it advocates for is the question that follows the boss,
    // so that is the one whose cards change with the boss. To the Victim "controller" is the Controller, so the chain shows
    // (board dq-boss-chain). The lines, its look (the bundle it carries, the stoop) and the cards are written from the cave's
    // daemon row ("Sympathy, through stories.") and the council's daemons.yaml ("Look at what I have absorbed. Look at the
    // column."; the cost goes out as a story, and the sympathy becomes the right to be met on its terms); choices, all of them.
    {
      id: "victim", name: "the Victim", title: "The Victim", daemon: "victim",
      bossNames: { controller: "the Controller" },
      arrive: "A figure has sunk low in the middle of the way, down into its knees, back rounded, head hung, arms hanging long and heavy. It looks up as you come near, as if it has been waiting a long time for someone to ask.",
      meet: {
        opens: "You'd stop for me? Nobody stops. Let me tell you what happened.",
        replies: [
          ["Who are you?", "I'm the one it happened to. Look at what I've carried.", "who"],
          ["I'm not here to get past you. I'd like to hear from you.", "Hear me? Most people only hear the first part. All right.", "hear"],
          ["I need to get through.", "Of course you do. Everyone does. Nobody stays for the story.", "push"],
        ],
        after: { hear: "I'm not here to argue with your story. I'd like to hear from you, if you'll let me.", push: "Then before I go anywhere, I'd like to hear from you.", who: "Keeper of the story, I'd like to hear from you." },
      },
      asks: {
        speak: { ask: "Victim, may I speak with you for a while?", yes: "Yes. Nobody ever asks me.", no: ["You'll say I'm making it up.", "You'll tell me to get over it.", "Not if you're only going to leave."] },
        aside: { ask: "Will you step aside, and let me stand where you stand, so I can see what you see?", yes: "For a while. Then you'll see what it's been like.", no: ["If I put it down, nobody will know what it cost.", "You'd be blamed for it.", "Not yet. You haven't heard all of it."] },
        pass: { ask: "Will you let me walk on past you?", yes: "Go on. Remember what I told you.", no: ["Not until someone has heard it all.", "You'll forget it the moment you're past.", "Not yet."] },
      },
      fears: [["Nobody will know what it cost."], ["We'll be blamed."], ["It will happen again."], ["We'll be alone with it."], ["They'll say it never happened."]],
      assure: [["I'll come back to my own place when we're done."], ["What happened is real. I'm not asking you to take it back."], ["I'll go one step at a time, and you can stop me at any time."], ["I'm not here to judge your story. I want to know you."]],
      assured: ["...All right. Gently, then.", "Hm. You're still here, I suppose.", "Nobody has ever stayed this long before."],
      questions: [
        { id: "what", ask: "What sympathetic stories do you tell?", reflect: "So those are the stories you carry.", cards: [
          ["How nobody was there for us."], ["How it always happens to us."], ["How much we gave, and got nothing back."], ["How they had the advantage, and we never had a chance."], ["How we were left out."], ["How hard it's been, all this time."],
          ["It tells them to be heard, I think.", "ideas"],
        ] },
        // A card's third place names the boss (questions.js bosses: protector, self, controller, player, where the player is
        // the vulnerable child). Here "controller" is the Controller, met four chambers before.
        { id: "boss", boss: true, ask: "Who do you work for?", reflect: "That's who you answer to.", cards: [
          ["The Protector.", null, "protector"], ["The Controller.", null, "controller"], ["The self.", null, "self"], ["The vulnerable child.", null, "player"], ["I'm not sure anymore."],
          ["Maybe it learned that stories keep people near.", "ideas"],
        ], reflectByBoss: {
          protector: "So you answer to the Protector. The story keeps the danger named, so nobody walks into it again.",
          controller: "So you answer to the Controller. The story says who is to blame, so nothing is ours to answer for.",
          self: "So you answer to the self. The story gives it the right to be heard.",
          player: "So you answer to the vulnerable child. You tell what happened to it, because it couldn't.",
        } },
        // His advocacy question follows the boss, so its wording stays and its cards change with the boss, as the method
        // cards do in the chambers before.
        { id: "advocate", ask: "Who do you advocate for?", reflect: "So that's who you stand up for.", cards: [
          ["The one who got hurt."], ["Everyone who was left out."], ["Us, because nobody else will."], ["Whoever is losing."], ["The one nobody believes."],
          ["I'd make them pay for what they did.", "controller"], ["I'd fix it for them, if anyone let me.", "fixer"],
        ], cardsByBoss: {
          protector: [["The one who keeps getting hurt."], ["Whoever is in danger."], ["Us, so it never happens again."], ["The one who couldn't get away."], ["I'd keep every danger out.", "protector"]],
          controller: [["The one who did everything right."], ["Whoever was treated unfairly."], ["The one who was wronged, so it's on the record."], ["Us, against the ones who broke the rules."], ["The standard they failed.", "controller"]],
          self: [["The self, when nobody else will."], ["The one who deserves better."], ["The part that never gets a say."], ["The self, so it gets its turn to speak."], ["I doubt anyone else would.", "skeptic"]],
          player: [["The child who was hurt."], ["The little one who couldn't speak."], ["The child nobody came for."], ["The child, so somebody finally listens."]],
        } },
        { id: "payoff", ask: "What shadow sympathy does your advocacy get you?", multi: true, reflect: "That's what the story buys.", cards: [
          ["People are gentle with us."], ["Nobody can say it was our fault."], ["We get to be met on our terms."], ["We don't have to change."], ["They stay close, for a while."], ["We're the one who's right."],
          ["I doubt it gets us anything at all.", "skeptic"],
        ] },
        { id: "gone", ask: "What happens if you're not there?", multi: true, reflect: "No wonder you keep telling it.", cards: [
          ["Nobody would know what it cost."], ["It would be our fault."], ["It would happen again, and nobody would see."], ["We'd be alone with it."], ["The child would never be heard."], ["I'm not sure. I've always been here."],
        ] },
        { id: "hours", ask: "And what are your hours?", reflect: "Those are long hours.", cards: [
          ["Always. The story never ends."], ["Whenever someone asks how we are."], ["Most of all at night, going over it."], ["Every time it nearly happens again."], ["Whenever someone else is getting the sympathy."],
        ] },
        { id: "pay", ask: "How are you thanked for all of this?", reflect: "Telling all of it, and hardly thanked.", cards: [
          ["People get tired of my stories."], ["I'm called dramatic."], ["Sometimes someone listens."], ["Hardly."],
          ["I doubt anyone really cares.", "skeptic"], ["It just wants attention.", "ideas"],
        ] },
        { id: "feel", ask: "How does that feel?", reflect: "Thank you for telling me.", cards: [
          ["Tired."], ["Unheard."], ["Like nobody believes me."], ["Like I have to tell it louder."], ["Like I'd love to put it down for once."], ["Alone with it."],
        ] },
      ],
      places: ["Chest", "Throat", "Belly", "Face", "Eyes", "Shoulders", "Arms", "Back", "All over"],
      ready: "...All right. I can set it down for a while. It'll still be here.",
      notYet: "You haven't heard all of it yet.",
      seat: "You are standing where the Victim stands. The self is back there, where you were a moment ago, and everything that has ever happened to it is in the bundle in your arms.",
      know: { ask: "From here, what does the Victim want the self to know?", cards: [["It really did happen."], ["I'm not just making a fuss."], ["I've carried this so you wouldn't forget."], ["I'm tired of telling it."], ["Thank me once in a while."]] },
      thanks: "Thank you, Victim. Every voice has a right to be heard, and you have been. I'm going to step back out now and let you have your post again.",
    },
    // The Damaged Self, seventh and last on the daemon path (board dp-seven), met with Wendell's own set for it
    // (daemons/questions.js): what damage it takes, from what or whom, who it works for, how its job changes depending on who
    // it works for, and what would happen if it weren't there. His method question is "How does your job change", so its
    // wording stays and its cards change with the boss, as in the chambers before. To the Damaged Self "controller" is the
    // Controller, so the chain shows (board dq-boss-chain). The lines, its look (the crack, the slighter stoop) and the cards
    // are written from the cave's daemon row ("To take the damage. It is the Protector's last resort") and the council's
    // daemons.yaml ("I will take that one. It was probably me."; it absorbs the hit and books it as a fault in how the self is
    // built); choices, all of them. deep: standing where it stands is the deepest place, so the cave asks first (bmc-safety,
    // cave-321-damaged-self-ask).
    {
      id: "damaged-self", name: "the Damaged Self", title: "The Damaged Self", daemon: "damaged-self", deep: true,
      bossNames: { controller: "the Controller" },
      arrive: "A figure is curled forward in the middle of the way, arms wrapped round its own middle, knees drawn in, head down and turned away. It doesn't brace as you come near. It turns a little, as if to take whatever you've brought on the side that's already hurt.",
      meet: {
        opens: "I'll take that one. Whatever it is. It was probably me.",
        replies: [
          ["Who are you?", "I'm the one who takes it, when nothing else could keep it out.", "who"],
          ["I'm not here to get past you. I'd like to hear from you.", "Hear from me? Nobody asks the broken one anything. All right.", "hear"],
          ["I need to get through.", "Go on, then. Push. I'm used to it.", "push"],
        ],
        after: { hear: "I'm not here to hit you, or to blame you. I'd like to hear from you, if you'll let me.", push: "Then before I go anywhere, I'd like to hear from you.", who: "Keeper of the hits, I'd like to hear from you." },
      },
      asks: {
        speak: { ask: "Damaged Self, may I speak with you for a while?", yes: "If you want. I don't have much to say that's any good.", no: ["You'll only find more that's wrong with us.", "It's safer if nobody looks.", "Not if it's going to hurt."] },
        aside: { ask: "Will you step aside, and let me stand where you stand, so I can see what you see?", yes: "For a while. It's heavy here. Be careful.", no: ["If I step aside, it hits the child.", "You couldn't take it.", "Not yet. It still hurts too much."] },
        pass: { ask: "Will you let me walk on past you?", yes: "Go on. Go gently, there.", no: ["What's past me is the softest place. Nothing goes there.", "Not while something might still come.", "Not yet."] },
      },
      fears: [["The next hit will land on the child."], ["We'll be found out."], ["It will prove what's wrong with us."], ["We'll fall apart."], ["There'll be nothing left to take it."]],
      assure: [["I'll come back to my own place when we're done."], ["Nothing you took was your fault. I'm not here to add to it."], ["I'll go one step at a time, and you can stop me at any time."], ["I'm not here to fix you or get rid of you. I want to know you."]],
      assured: ["...All right. Gently, then.", "Hm. You didn't flinch.", "Nobody has ever stayed with the broken part before."],
      questions: [
        { id: "what", ask: "What kind of damage do you take?", reflect: "So that's what you take on.", cards: [
          ["The blame."], ["The shame."], ["The hurt nobody else could keep out."], ["The hit, so it lands on me and not further in."], ["Being the one who's wrong."], ["Every time it didn't work out."],
          ["It thinks it's broken, I think.", "ideas"],
        ] },
        { id: "from", ask: "From what, or from whom?", reflect: "So that's where it comes from.", cards: [
          ["From the people closest to us."], ["From whoever was angry."], ["From the world, when it got too much."], ["From inside, when we let ourselves down."], ["From the hits the Protector couldn't stop."], ["I'm not sure. It just comes."],
          ["I'd stop them ever getting close.", "protector"],
        ] },
        // A card's third place names the boss (questions.js bosses: protector, self, controller, player, where the player is
        // the vulnerable child). Here "controller" is the Controller, met five chambers before.
        { id: "boss", boss: true, ask: "Who do you work for?", reflect: "That's who you answer to.", cards: [
          ["The Protector.", null, "protector"], ["The Controller.", null, "controller"], ["The self.", null, "self"], ["The vulnerable child.", null, "player"], ["I'm not sure anymore."],
          ["Maybe it learned that taking it was the only way to stay safe.", "ideas"],
        ], reflectByBoss: {
          protector: "So you answer to the Protector. When its shield isn't enough, you are the last thing standing.",
          controller: "So you answer to the Controller. When the standard isn't met, the fault is put on you.",
          self: "So you answer to the self. You take what it can't bear to look at.",
          player: "So you answer to the vulnerable child. You take the hit so it never reaches the little one.",
        } },
        // His method question: its wording stays and its cards change with the boss.
        { id: "how", ask: "How does your job change depending on who you work for?", reflect: "So that's how the job changes.", cards: [
          ["I take whatever gets through."], ["I take the blame, so nobody else has to."], ["I break, so the rest doesn't."], ["I go quiet and carry it."], ["I agree it was me, so it stops."],
          ["I'd fix the crack myself.", "fixer"], ["Poor me, nobody ever helps.", "victim"],
        ], cardsByBoss: {
          protector: [["I'm the shield behind the shield."], ["I take what the Protector couldn't stop."], ["I let it land on me, so it goes no further."], ["I'm the last resort."], ["I'd keep every danger out.", "protector"]],
          controller: [["I'm the reason it wasn't good enough."], ["I take the fault, so the standard stays."], ["I'm the one who gets marked down."], ["I hold the failure, so the plan still stands."], ["I'd keep it all in hand myself.", "controller"]],
          self: [["I hold everything it's ashamed of."], ["I keep the case against it."], ["I'm where it puts what it can't look at."], ["I take the blame so it can keep going."], ["I doubt it would want to know.", "skeptic"]],
          player: [["I take the hit so it doesn't reach the child."], ["I'm hurt, so the little one isn't."], ["I stand in front of it."], ["I carry what it was too small to carry."]],
        } },
        { id: "gone", ask: "What would happen if you weren't there?", multi: true, reflect: "No wonder you keep taking it.", cards: [
          ["It would reach the child."], ["Nothing would take the hit."], ["We'd break all the way."], ["The truth about us would get out."], ["The Protector would have nothing behind it."], ["I'm not sure. I've always been here."],
        ] },
        { id: "hours", ask: "And what are your hours?", reflect: "Those are long hours.", cards: [
          ["Always. The hits don't stop."], ["Whenever someone is disappointed."], ["Most of all at night, going over what we did wrong."], ["Every time something goes wrong."], ["Whenever the Protector can't hold it."],
        ] },
        { id: "pay", ask: "How are you thanked for all of this?", reflect: "Taking all of it, and hardly thanked.", cards: [
          ["Nobody sees me."], ["I'm treated as the problem."], ["I'm hidden away."], ["Hardly."],
          ["Poor me, nobody ever helps.", "victim"], ["It just wants to be broken.", "ideas"],
        ] },
        { id: "feel", ask: "How does that feel?", reflect: "Thank you for telling me.", cards: [
          ["Heavy."], ["Ashamed."], ["Worn through."], ["Like it really was my fault."], ["Like I'd love to set it down for once."], ["Alone with it."],
        ] },
      ],
      places: ["Chest", "Belly", "Shoulders", "Back", "Throat", "Face", "Gut", "Heart", "All over"],
      ready: "...All right. I could step aside for a while. Go gently. It's the deepest place.",
      notYet: "It still hurts too much.",
      seat: "You are standing where the Damaged Self stands. The self is back there, where you were a moment ago, and every hit that got past everything else lands here, and the softest place is just behind you.",
      know: { ask: "From here, what does the Damaged Self want the self to know?", cards: [["It wasn't all your fault."], ["I took it so you wouldn't have to."], ["I'm not what's wrong with you."], ["I'm tired of taking it."], ["Thank me once in a while."]] },
      thanks: "Thank you, Damaged Self. Every voice has a right to be heard, and you have been. I'm going to step back out now and let you have your post again.",
    },
  ];
  // The daemon path in the book's order (board dp-seven). Chambers are met one after another; the first figure past the
  // last chamber built waits at a shut mouth. Past the last chamber is the centre, where the path ends at the vulnerable
  // child (board dp-centre: "until you reach the center - the player/vulnerable child").
  var PATH = ["protector", "controller", "skeptic", "fixer", "emotional-body", "victim", "damaged-self"];
  var TITLES = { skeptic: "The Skeptic", fixer: "The Fixer", "emotional-body": "The Emotional Body", victim: "The Victim", "damaged-self": "The Damaged Self" };
  function voiceAt(c) { return VOICES[Math.min(Math.max(0, c | 0), VOICES.length - 1)]; }
  // What waits past chamber c: the next voice built, or the next figure on the path with its chamber still shut.
  function nextAfter(c) {
    var id = PATH[c + 1]; if (!id) return { id: "centre", title: "The centre", centre: true, built: true };
    var v = VOICES.filter(function (x) { return x.id === id; })[0];
    return v ? { id: id, title: v.title, daemon: v.daemon, built: true } : { id: id, title: TITLES[id], daemon: id, built: false };
  }

  // ---- the full 3-2-1 and the meeting spirit (pass big-mind-trust1, build 3) -------------------------------------------------
  // Talk it through (bmt-321-offer): a full typed 3-2-1 with the voice, the cave's own (K.talk321), offered at every poll, when it
  // is willing, and from its seat. It is skippable and never gates stepping aside. Being it (phase 1) opens only with the voice's
  // permission, asked the way the chamber asks everything (permit, with its refusal path); standing in its seat already has it.
  // Every turn can be a card, a gesture (a card in brackets: taking its held movement from GESTURES.md) or the player's own words
  // (the Regent's access floor: a card, a nonverbal route and an open line, with the same effect). The words never leave the page
  // and are never saved; only that a 3-2-1 was had is (voices[id].talked). The lines are choices, all of them.
  var BE = {
    protector: { yes: "Stand here, then. Feel how heavy it is.", no: ["Nobody stands here but me.", "Not until I know you won't drop it."],
      hold: "(I take its stance: palms out at shoulder height, set into a push over my front knee.)" },
    controller: { yes: "Fine. Stand as I stand, and do it properly.", no: ["You'd do it wrong.", "Not yet. Watch me a while longer."],
      hold: "(I take its stance: feet together, fists on my hips, elbows wide, chin up.)" },
    skeptic: { yes: "Go on, then. See if it looks any different from here.", no: ["What would that prove?", "Not until you've shown me something."],
      hold: "(I take its stance: drawn back, chest and head turned aside, weight on my back foot.)" },
    fixer: { yes: "Here. Somebody has to hold it while you look.", no: ["There's no time. Something's broken.", "Not while it still needs fixing."],
      hold: "(I take its stance: pitched forward over my front knee, both arms reaching out.)" },
    "emotional-body": { yes: "Come in. Feel it the way I feel it.", no: ["It's too much to hand over.", "Not yet. You'd shut it down."],
      hold: "(I take its stance: arms flung wide and up, palms open, chest up, head back.)" },
    victim: { yes: "Stand here, and you'll see what happened.", no: ["You'd only say it wasn't that bad.", "Not until you've heard all of it."],
      hold: "(I take its stance: sunk low in my knees, back rounded, head hung, arms heavy.)" },
    "damaged-self": { yes: "You can stand here. Gently.", no: ["It would hurt you too.", "Not yet. Let me keep taking it a while."],
      hold: "(I take its stance: curled forward, arms round my middle, knees drawn in, head turned away.)" },
  };
  VOICES.forEach(function (v) { var b = BE[v.id]; if (b && !v.asks.be) v.asks.be = { ask: "May I stand where you stand, and speak as you, for a while?", yes: b.yes, no: b.no }; });
  function talkCards(v, ph, who) {
    var d = v.name, b = BE[v.id] || {};
    if (ph === 3) return ["It's standing in my way.", "It looks like it's been here a long time.", "It's bigger than I thought.", "It's watching me."];
    if (ph === 2 && who === "you") return ["Why are you here?", "What do you need from me?", "Thank you for what you do.", "(I put a hand on my chest and wait.)"];
    if (ph === 2) return ["I'm here because you need me.", "I don't trust you yet.", "I'm tired.", "(It looks away, then back at me.)"];
    if (ph === 1) return ["I am " + d + "."].concat((v.know && v.know.cards || []).map(function (c) { return c[0]; }).slice(0, 3), b.hold ? [b.hold] : []);
    return [];
  }
  // The meeting spirit (bmt-meeting-spirit, as revised by bmt-spirits-vouch): the first time the player meets a voice, the game asks
  // how they feel meeting it. The feelings are the W.A.V.E.'s five, each with its element, so the game never guesses one; "No word
  // yet" is an equal answer and its spirit is grey until it is named (in a sitting with it), and plays the same. Words of the
  // player's own name it and leave it grey. The spirit walks with the player from that voice on, and once the voice trusts them
  // it becomes their ally and vouches for them further in. What it is called and its element are saved with the voice
  // (voices[id].spirit); a feeling is never a trust move, and fear, anger and disgust count against nothing.
  var NO_WORD = "No word yet";
  var MEET_FEEL = "How do you feel, meeting it?";

  // ---- trust (pass big-mind-trust1, 16 October 2026, as revised on Wendell's answers of 22:05 to 22:23) --------------------
  // Charge is the voice's burden in this sitting; trust is its relationship with the player, kept across sittings
  // (bmt-burden-trust). Trust is three things the voice watches for: can you, will you, are you good. Can and will show as
  // marks, each pip with a plain line of what the voice saw (bmt-trust-shown A); whether you seem good shows only in the voice's
  // own words, against its own picture of goodness (bmt-good-in-words, bmt-goodness-models; the seven pictures are drafts). Trust
  // actions can be taken anywhere on the path, and each voice has a right answer, which is what it needs; an action counts only
  // when the voice's charge eases on the next check-in (bmt-honest-moves). A broken promise lowers its will mark, a push past its
  // refusal lowers its read of your goodness, and owning it to the voice repairs it (bmt-trust-falls, bmt-accountability A). Rest,
  // Not now, silence and "I don't know" lower nothing (bm-decline). Three-part trust is local to this cave; the ontology's
  // TrustState is untouched (bmt-ontology-local). The lines below are choices, written from each voice's row and Wendell's
  // question sets; the right answers too.
  var MARKS = 3; // pips in a mark (a choice)
  var KIND_LINES = {
    can: { wait: "You waited with it when it held back.", hold: "You breathed a W.A.V.E. through beside it.", sit: "You sat with it.", pace: "You went slowly, as you said you would.", vouch: "Your spirits vouched for you." },
    will: { "return": "You came back to your own place, as you promised.", visit: "You came back another day and asked again, as you promised." },
    good: { share: "You showed it where you already share its picture of good.", honour: "You honoured its refusal.", intent: "You told it what you'd do for it." },
  };
  var BROKEN_LINES = { "will:return": "You said you'd come back to your own place, and left from its.", "good:push": "You pushed past its refusal." };
  var OWN_LINES = { "will:return": "I said I'd come back to my own place, and I didn't. I'm sorry.", "good:push": "I pushed when you said no. That wasn't right." };
  // What the return rite names as the move practised, from the honest moves seen this visit (bmt-return).
  var PRACTISED = { wait: "waiting with a voice that held back", hold: "breathing a feeling through beside a voice", sit: "sitting with a voice without fixing it", pace: "going slowly when a voice needed it",
    vouch: "letting the voices that trust you speak for you", "return": "keeping your word to a voice", visit: "coming back and asking again", share: "finding where you already agree with a part of you",
    honour: "honouring a no", talk: "facing a part of you, talking with it and speaking as it", intent: "telling a part of you what you would do for it", repair: "owning it when you let a voice down" };
  var TRUST = {
    protector: { needs: { can: "wait", will: "return" }, picture: "good keeps us safe",
      share: [["You keep us safe by watching. I keep us safe by going slowly."], ["I want the self safe too. That's why I came slowly."]],
      read: { none: "I don't know yet what you're for.", seen: "You'd keep it safe too. I can see that now.", broken: "You pushed when I said no. That isn't how anyone keeps us safe." },
      doubt: { can: "I don't know that you can wait when I say no.", will: "I don't know that you'll come back to your own place.", good: "I don't know yet whether you'd keep it safe." },
      hint: { can: "That's something. But what I need to see is that you can wait when I hold back.", will: "Promises are easy. Come back to your own place when you say you will, and I'll believe it." },
      vouch: "The Protector's spirit says you kept watch." },
    controller: { needs: { can: "pace", will: "return" }, picture: "good meets the standard",
      share: [["You hold the standard. I hold it too, one step at a time."], ["I want it done properly as well."]],
      read: { none: "I haven't seen your standard yet.", seen: "You do things properly. I'll grant you that.", broken: "You rushed past a no. That isn't the standard." },
      doubt: { can: "I don't know that you can take it one step at a time.", will: "I don't know that you'll do what you said.", good: "I don't know what your standard is." },
      hint: { can: "Fine. But show me you can go one step at a time.", will: "Say what you'll do, then do it. Then we'll talk." },
      vouch: "The Controller's spirit says you did it properly." },
    skeptic: { needs: { can: "hold", will: "visit" }, picture: "good is honest about what is here",
      share: [["You check what's true. I want to see what's true too, even when it's hard."], ["I won't pretend it's fine when it isn't."]],
      read: { none: "I haven't seen any evidence about you yet.", seen: "You don't pretend. That's rare.", broken: "You pushed. That's what people do when they don't want to hear it." },
      doubt: { can: "I don't believe you can actually stay with what's here.", will: "Everyone says they'll come back.", good: "I doubt you're honest about it yet." },
      hint: { can: "Words. Show me you can stay with the feeling all the way through.", will: "I'll believe it when you come back and ask me again." },
      vouch: "The Skeptic's spirit says the evidence held up." },
    fixer: { needs: { can: "sit", will: "return" }, picture: "good doesn't leave what's broken",
      share: [["You don't leave what's broken. I don't want to leave it either, so I'm staying with it."], ["I won't walk away from what hurts."]],
      read: { none: "I don't know yet if you'd walk off and leave it.", seen: "You stay with what's broken. Without fixing it, even.", broken: "You pushed through. Something broke, and you left it." },
      doubt: { can: "I don't know that you can sit with it without fixing it.", will: "I don't know that you'll come back and put it right.", good: "I don't know if you'd leave it broken." },
      hint: { can: "Nice. But can you just sit with me, without fixing anything?", will: "Say you'll come back to your place, and then do it. That's a repair I'd trust." },
      vouch: "The Fixer's spirit says you stayed with what was broken." },
    "emotional-body": { needs: { can: "hold", will: "visit" }, picture: "good feels it all the way",
      share: [["You feel it all the way. I'm learning to let it all the way in too."], ["I won't hurry it. I'd rather feel it."]],
      read: { none: "I can't feel yet what you're about.", seen: "You let it all the way in. I felt that.", broken: "You pushed past me. It felt like being hushed again." },
      doubt: { can: "I don't know that you can feel it all the way through.", will: "I don't know that you'll come back when it's moving again.", good: "I can't feel yet whether you mean it." },
      hint: { can: "That helps. But I need to feel you stay with it all the way through.", will: "Come back when it's moving again, and ask me. Then I'll know." },
      vouch: "The Emotional Body's spirit says you felt it all the way." },
    victim: { needs: { can: "wait", will: "visit" }, picture: "good hears the whole story",
      share: [["You want the whole story heard. I want to hear all of it."], ["I'm not going anywhere until you've said it."]],
      read: { none: "I don't know yet if you'll stay for the whole of it.", seen: "You heard all of it. Nobody does that.", broken: "You pushed past me, like everyone does." },
      doubt: { can: "I don't know that you'll stay to the end of it.", will: "Everyone says they'll come back.", good: "I don't know yet if you'd hear the whole story." },
      hint: { can: "That's kind. But will you stay, when I say not yet?", will: "Come back another day and ask me again. Then I'll know you meant it." },
      vouch: "The Victim's spirit says you heard the whole story." },
    "damaged-self": { needs: { can: "pace", will: "return" }, picture: "good doesn't let someone else take the hit",
      share: [["You won't let anyone else take the hit. I don't want you taking them all alone."], ["I'll take my share now. You don't have to take it all."]],
      read: { none: "I don't know yet if you'd let me take it, like always.", seen: "You wouldn't let me take it all. I noticed.", broken: "You pushed. I took that one too." },
      doubt: { can: "I don't know that you can go gently enough.", will: "I don't know that you'll come back to your own place.", good: "I don't know yet if you'd let me take the hit." },
      hint: { can: "Thank you. But go slowly. That's what I need.", will: "Say you'll come back to your own place, and then come back." },
      vouch: "The Damaged Self's spirit says you didn't let it take the hit alone." },
  };
  // The promises the player can make from the trust panel; the first is also the refusal path's first assurance.
  var PROMISES = [["return", "I'll come back to my own place when we're done."], ["visit", "I'll come back another day and ask you again."]];
  // Saved per voice as voices[id].trust (the Architect's shape, no words): seen [{dim, kind, at}], promises [{kind, made, kept}],
  // broken and repaired [{dim, kind, at}], and ally (when its spirit became the player's ally).
  function blankTrust() { return { seen: [], promises: [], broken: [], repaired: [] }; }
  function trustOf(rec) { var t = (rec && rec.trust) || {}, b = blankTrust(); for (var k in b) b[k] = (t[k] || []).slice(); if (t.ally) b.ally = t.ally; return b; }
  // A broken entry stands until a repair of the same dim and kind made after it.
  function openBreaks(t) { return t.broken.filter(function (b) { return !t.repaired.some(function (r) { return r.dim === b.dim && r.kind === b.kind && r.at >= b.at; }); }); }
  // A mark's pips: what the voice saw of the right answer (or spirits vouching, for can), less each fall not yet owned.
  function markOf(t, vid, dim) {
    var need = (TRUST[vid] || {}).needs || {};
    var n = t.seen.filter(function (x) { return x.dim === dim && (x.kind === need[dim] || (dim === "can" && x.kind === "vouch")); }).length;
    n -= openBreaks(t).filter(function (b) { return b.dim === dim; }).length;
    return clamp(n, 0, MARKS);
  }
  function goodOf(t) { return openBreaks(t).some(function (b) { return b.dim === "good"; }) ? "broken" : t.seen.some(function (x) { return x.dim === "good"; }) ? "seen" : "none"; }
  // It has seen all three: the second road past a voice (bmt-two-roads); its refusal still stays open.
  function trusted(t, vid) { return markOf(t, vid, "can") > 0 && markOf(t, vid, "will") > 0 && goodOf(t) === "seen"; }
  // How the voice stands toward the player, for the daemon bodies (the art thread's trust stances).
  var STANCES = {
    guarded: "met, and nothing seen yet: square to the player, weight back, its object held across the body",
    testing: "it holds back and says what it hasn't seen: chin up, a half step forward, eyes on the player",
    softening: "one thing seen (a mark or its good read): shoulders drop, the object lowers a little",
    trusting: "all three seen: turned a little open, the object at its side",
    willing: "willing to step aside: a half turn toward the wall, a hand toward the way on",
    hurt: "a broken promise or a push not yet owned: turns a shoulder away, the object back up, closed",
    repaired: "a fall owned and repaired: turns back toward the player, slower and warmer than before",
  };
  function stanceOf(t, vid, s) {
    var open = openBreaks(t).length;
    if (open) return "hurt";
    if (s && s.willing) return "willing";
    if (trusted(t, vid)) return "trusting";
    if (s && s.refusedNow) return "testing";
    if (markOf(t, vid, "can") || markOf(t, vid, "will") || goodOf(t) === "seen") return "softening";
    if (t.repaired.length) return "repaired";
    return "guarded";
  }

  // The centre (board dp-centre: "The child is seen, not questioned", 13 October 2026; then Wendell's own Player set of 14
  // October in daemons/questions.js, newer and in his words). Squared as: the child is seen first and nothing has to be asked.
  // If the player chooses to ask, it is asked his six, gently, one at a time, in his order and plain wording, and any can be
  // left unanswered ("Let this one go"). There is no charge to read and no permission to win: the child is not a voice
  // blocking the way, and what it says is not a price for anything (the ontology's "intimate disclosure is not progression
  // currency"). The voices met on the way are there as spirits (bms-spirits-follow); a voice the child names as in its way
  // comes closer. The cards are written from the core premise (the voices emerged to protect the child) and are choices,
  // all of them. Board position dp-centre-asked records this; it stands unless he flips it.
  var CENTRE = {
    title: "The vulnerable child",
    arrive: "The way opens into a small round place, warm and still. The child is here, small and glowing, and it has been waiting a long time. Beside it is a place for the self, and you stand in it.",
    seen: "Nothing has to be asked here. You can simply be with the child, or you can ask it something, gently, and let it answer in its own time.",
    questions: {
      learning: { reflect: "So that's what you're learning.", cards: [["That it's safe to play."], ["That I'm allowed to want what I want."], ["How to be here."], ["That the others are looking after me."], ["Something new every day."], ["I don't know yet."]] },
      growing: { reflect: "That's how you grow.", cards: [["Slowly."], ["When someone stays with me."], ["When I get to try."], ["When nobody hurries me."], ["I'm not sure I am."]] },
      feeling: { multi: true, reflect: "Thank you for showing me.", cards: [["Small."], ["Curious."], ["Scared."], ["Glad you came."], ["Tired."], ["Everything at once."]] },
      exploring: { reflect: "That's where you're looking.", cards: [["Everything."], ["What's past the cave."], ["What the voices are for."], ["Who you are."], ["Not much. I don't get out."]] },
      // The voices the player met on the way are the cards here, one line each, plus two that name none of them.
      "in-the-way": { multi: true, reflect: "So that's how they get in your way. Every one of them was trying to keep you safe.", byVoice: {
        protector: "The Protector won't let me out to play.", controller: "The Controller says it isn't the time.", skeptic: "The Skeptic says it's silly.",
        fixer: "The Fixer keeps trying to make me better.", "emotional-body": "The Emotional Body feels it all before I can.", victim: "The Victim tells my story for me.",
        "damaged-self": "The Damaged Self takes every hit, so I never get to try.",
      }, cards: [["They all talk over me."], ["They don't, right now."]] },
      gone: { reflect: "No wonder they all work so hard to keep you safe.", cards: [["Nobody would play."], ["Everything would be work."], ["The others would have nothing to look after."], ["Nothing would ever be new."], ["I'm not sure. I've always been here."]] },
    },
    // Used only when daemons/questions.js did not load: his six, in his order.
    fallback: [["learning", "What are you learning?"], ["growing", "How are you growing?"], ["feeling", "What are you feeling?"], ["exploring", "What are you exploring?"], ["in-the-way", "How do the other daemons get in your way?"], ["gone", "What would happen if you weren't there?"]],
    rest: "You stayed with the child. That is enough.",
    beyond: "Past the child, two ways wait shut for now: the hall of the six, and the second cave. They open in a later build.",
  };
  // The child's questions: Wendell's Player set from daemons/questions.js, with the centre's cards.
  function centreQuestions() {
    var D = (typeof window !== "undefined" && window.__oagDaemonQuestions && window.__oagDaemonQuestions.daemons.player) || null;
    var list = D ? D.map(function (q) { return [q.id, q.ask]; }) : CENTRE.fallback;
    return list.map(function (x) { var c = CENTRE.questions[x[0]] || { reflect: "Thank you for telling me.", cards: [] }; return { id: x[0], ask: x[1], reflect: c.reflect, cards: c.cards, multi: !!c.multi, byVoice: c.byVoice || null }; });
  }

  // An open line is heard for the same tells (bm-four-steps: in voice or out of voice, never right or wrong). A choice: a
  // plain word list, so a miss is cheap and the player can always say it feels wrong.
  // vid is the voice of the chamber (the Protector when left out): talking about it is the self's ideas, and its own job
  // is in voice there.
  function heard(text, vid) {
    vid = vid || "protector";
    var t = " " + String(text || "").toLowerCase().replace(/[’]/g, "'") + " ";
    var about = new RegExp("\\b(the|my|this|our) " + vid.replace("-", " ") + "\\b");
    if (about.test(t) || /^ (it|he|she|they)\b/.test(t) || /\bit('s| is| does| wants| tries| protects| keeps| has)\b/.test(t) || /\b(i think|maybe|perhaps|probably|i guess)\b/.test(t)) return "ideas";
    if (vid !== "fixer" && /\b(fix|fixing|repair|solve|heal|make it better|sort it out)\b/.test(t)) return "fixer";
    if (vid !== "controller" && /\b(in charge|keep control|take control|manage|managing|plan|keep order|the standard|in hand)\b/.test(t) && !/\b(lose|losing|lost|out of) control\b/.test(t)) return "controller";
    if (vid !== "skeptic" && /\b(doubt|don't believe|pointless|no point|silly)\b/.test(t) && !/self-doubt|self doubt/.test(t)) return "skeptic";
    return null;
  }
  // Who an open line names as the boss, for the boss question (null when it names none of them). vid is the chamber's voice
  // (the Controller when left out): only the Controller's "myself" is control itself.
  function heardBoss(text, vid) {
    vid = vid || "controller";
    var t = " " + String(text || "").toLowerCase() + " ";
    if (/\b(vulnerable|child|kid|little one|younger me|inner child)\b/.test(t)) return "player";
    if (/\bprotector\b/.test(t)) return "protector";
    if (/\b(control|controller)\b/.test(t)) return "controller";
    if (vid === "controller" && /\b(myself|me|no one|nobody)\b/.test(t)) return "controller"; // as the Controller, "myself" is control itself
    if (/\bself\b/.test(t)) return "self";
    return null;
  }

  // ---- saving, on this device only ----------------------------------------------------------------
  // { v, chamber, at: "mouth" | "hall2", voices: { protector: { status: "spoken" | "waiting", kept: [{ q, line }], savedAt } },
  //   waiting: [translator ids] }. chamber is the daemon path's chamber the player has reached (0 the Protector, 1 the
  //   Controller, 2 the Skeptic, 3 the Fixer, 4 the Emotional Body, 5 the Victim, 6 the Damaged Self; saves from before the Controller have none and are at 0), and at is the place in it. The Controller's, the Skeptic's,
  //   the Fixer's, the Emotional Body's, the Victim's and the Damaged Self's records also hold boss, who the player said each works for. The first cave saves this seed record and spawns no world (bm-world-later).
  //   Each record may hold trust (see blankTrust), kept across sittings and never with words; spirit, the spirit born on meeting
  //   it ({ name, element, gone }); and talked, how many 3-2-1s were had with it (never the words).
  function blank() { return { v: 1, chamber: 0, at: "mouth", voices: {}, waiting: [] }; }
  function readSave() { try { var s = JSON.parse(localStorage.getItem(STORE) || "null"); return s && s.v === 1 ? s : blank(); } catch (e) { return blank(); } }
  function writeSave(s) { try { localStorage.setItem(STORE, JSON.stringify(s)); return true; } catch (e) { return false; } }
  function wipe() { try { localStorage.removeItem(STORE); } catch (e) {} }

  var CSS = ".bm-guide{font-style:italic;color:#c8d2ff}.bm-voice{color:#9cc4ff}" +
    ".bm-home{padding:1.4rem 1.1rem calc(1.4rem + env(safe-area-inset-bottom));max-width:30rem;margin:0 auto;overflow-y:auto;touch-action:pan-y}" +
    ".bm-home h1{font-size:1.45rem;color:#fff;margin:.4rem 0 .2rem}.bm-home p{font-size:1rem;line-height:1.42;margin:.55rem 0}" +
    ".bm-home ul{padding-left:1.1rem;margin:.4rem 0}.bm-home li{margin:.35rem 0;line-height:1.38}" +
    ".bm-safe{border:1px solid rgba(255,241,176,.35);border-radius:12px;padding:.6rem .8rem;margin:.8rem 0;font-size:.95rem;color:#f0e6c8}" +
    ".bm-home a{color:#9cd8ff}.bm-home .oagc-row button{flex:1 1 auto}" +
    ".bm-cards{display:flex;flex-wrap:wrap;gap:.35rem;margin:.45rem 0}" +
    ".oagc button.bm-card{background:rgba(40,52,90,.9);color:#eef2ff;border:1px solid rgba(156,196,255,.45);font-weight:500;text-align:left}" +
    ".oagc button.bm-card[aria-pressed=true]{background:#9cc4ff;color:#10142a;outline:none}" +
    ".bm-line{display:flex;gap:.35rem;margin-top:.45rem}.bm-line input{flex:1;min-width:0;font-size:16px;padding:.5rem .6rem;border-radius:8px;border:1px solid rgba(255,255,255,.3);background:#14142a;color:#fff}" +
    ".oagc button.bm-link{background:none;border:none;color:#aab4d4;font-weight:400;text-decoration:underline;padding:.4rem .2rem}" +
    ".oagc button.bm-self{position:absolute;top:10px;left:10px;z-index:4;background:rgba(20,20,40,.75);border:1px solid rgba(255,255,255,.35);color:#e8e8f0;font-weight:500}" +
    ".oagc button.bm-run{position:absolute;right:10px;bottom:calc(80px + env(safe-area-inset-bottom));z-index:4;min-width:64px;background:rgba(20,20,40,.55);border:2px solid rgba(255,241,176,.55);color:#fff1b0;font-weight:500;border-radius:999px}" +
    ".oagc button.bm-run[aria-pressed=true]{background:rgba(255,241,176,.35)}" +
    ".bm-hint{position:absolute;left:0;right:0;bottom:calc(112px + env(safe-area-inset-bottom));text-align:center;color:#e8e2c8;font-size:15px;z-index:2;pointer-events:none;text-shadow:0 1px 3px #000;padding:0 1rem}" +
    ".bm-npc{color:#cfe0ff;font-size:1.02rem}.bm-npc b{color:#9cc4ff}.bm-you{color:#fff1d0;text-align:right;font-style:normal}" +
    ".bm-meters{position:absolute;top:12px;right:10px;left:84px;z-index:4;display:flex;flex-direction:column;gap:5px;pointer-events:none}" +
    ".bm-meter{position:relative;display:flex;align-items:center;gap:.4rem;font-size:12px;color:#dfe6ff}.bm-meter>span:first-child{width:6.4em;flex:none;white-space:nowrap}" +
    ".bm-meter.you .bm-bar i{background:#c89cff}" +
    ".bm-breath{text-align:center;color:#fff1b0;font-size:1rem;margin:.5rem 0;min-height:1.4em}.oagc .bm-wave button:disabled{opacity:.45}" +
    ".bm-orb{width:88px;height:88px;margin:.5rem auto .1rem;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff1b0;font-size:.8rem;letter-spacing:.06em;" +
    "background:radial-gradient(circle,rgba(255,241,176,.5),rgba(255,241,176,.14) 62%,rgba(255,241,176,0) 72%);border:1px solid rgba(255,241,176,.55);transform:scale(.55);will-change:transform}" +
    ".bm-wavestep{font-size:.8rem;color:#aab4d4;letter-spacing:.04em;text-transform:uppercase;margin:0}" +
    ".bm-bar{position:relative;flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,.14);overflow:hidden}.bm-bar i{position:absolute;left:0;top:0;bottom:0;background:#e0704a;transition:width .5s,background .5s}" +
    ".bm-bar u{position:absolute;top:0;bottom:0;width:2px;background:rgba(255,255,255,.6)}.bm-meter.ready .bm-bar i{background:#6ac8a0}.bm-meter b{min-width:1.2em;text-align:right}" +
    ".bm-charge{display:flex;align-items:center;gap:.5rem;margin:.6rem 0 .2rem;font-size:12px;color:#aab4d4}.bm-charge input{flex:1;height:36px;accent-color:#e0704a}" +
    ".bm-chargeline{text-align:center;margin:.1rem 0}.bm-chargenum{font-size:1.4rem;color:#fff1b0}" +
    ".bm-bar s{position:absolute;top:0;bottom:0;background:#fff1b0;opacity:0;text-decoration:none}" +
    ".bm-meter.eased .bm-bar s{animation:bm-drain 1.6s ease-out forwards}.bm-meter.eased .bm-bar{animation:bm-glow 1.6s ease-out}" +
    ".bm-drop{position:absolute;right:0;top:16px;color:#fff1b0;font-size:15px;font-weight:600;opacity:0;text-shadow:0 1px 3px #000}.bm-meter.eased .bm-drop{animation:bm-rise 1.8s ease-out}" +
    "@keyframes bm-drain{0%{opacity:.95}100%{opacity:0;transform:scaleX(.2);transform-origin:left}}" +
    "@keyframes bm-glow{0%{box-shadow:0 0 0 rgba(255,241,176,0)}25%{box-shadow:0 0 14px rgba(255,241,176,.9)}100%{box-shadow:0 0 0 rgba(255,241,176,0)}}" +
    "@keyframes bm-rise{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(16px)}}" +
    ".bm-eased{position:absolute;left:0;right:0;top:34%;text-align:center;z-index:3;color:#fff1d0;font-size:1.15rem;text-shadow:0 1px 4px #000;pointer-events:none;opacity:0;transition:opacity .4s;padding:0 1.2rem}" +
    ".bm-eased.on{opacity:1}.bm-eased small{display:block;font-size:.9rem;color:#dfe6ff;margin-top:.25rem}" +
    "@media (prefers-reduced-motion:reduce){.bm-meter.eased .bm-bar s,.bm-meter.eased .bm-bar,.bm-meter.eased .bm-drop{animation-duration:.01s}}" +
    ".oagc button.bm-sitbtn,.oagc button.bm-spiritbtn{position:absolute;bottom:calc(24px + env(safe-area-inset-bottom));z-index:5;background:rgba(20,20,40,.78);border:1px solid rgba(255,241,176,.45);color:#fff1d0;font-weight:500}" +
    ".oagc button.bm-sitbtn{left:10px}.oagc button.bm-spiritbtn{right:10px}.oagc button.bm-sitbtn:disabled{opacity:.35}" +
    ".bm-kept{border-top:1px solid rgba(255,255,255,.12);padding:.5rem 0}.bm-kept li{color:#cfd8ff}" +
    ".bm-marks{font-size:12px;color:#dfe6ff;padding-left:.1rem}.bm-marks b{color:#fff1b0;font-weight:500;letter-spacing:.14em;margin:0 .6em 0 .25em}" +
    ".bm-marks.lit b{animation:bm-glowtext 1.6s ease-out}@keyframes bm-glowtext{0%{text-shadow:0 0 0 #fff1b0}30%{text-shadow:0 0 10px #fff1b0}100%{text-shadow:0 0 0 #fff1b0}}" +
    ".oagc button.bm-trustbtn{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(24px + env(safe-area-inset-bottom));z-index:5;background:rgba(20,20,40,.78);border:1px solid rgba(156,196,255,.55);color:#dfe9ff;font-weight:500}" +
    ".oagc button.bm-trustbtn:disabled{opacity:.35}.bm-trustsaw{color:#fff1d0}.bm-trusthead{font-size:.8rem;color:#aab4d4;letter-spacing:.04em;text-transform:uppercase;margin:.7rem 0 .1rem}";

  function start() {
    if (!document.getElementById("oagc-css")) document.head.appendChild(el("style", { id: "oagc-css", text: K.CSS }));
    if (!document.getElementById("bm-css")) document.head.appendChild(el("style", { id: "bm-css", text: CSS }));
    K.guardPage();
    mouth();
  }

  // ---- the cave mouth: the rules from the workshop's opening, one screen (bmc-safety) ------------------------------------
  var home = null;
  // Opened from the WAVE room's Big Mind door (the Cave of Lessons page, board dp-door): back is the way home to the room, and
  // the spirits the player worked in the room walk in with them for this visit.
  var fromRoom = null;
  function open(o) {
    fromRoom = { back: o && o.back, spirits: (o && o.spirits) || [] };
    start();
  }
  function goHome() {
    var f = fromRoom; if (home) home.remove(); home = null; fromRoom = null;
    if (f && f.back) f.back();
  }
  function mouth() {
    if (home) home.remove();
    var save = readSave(), C = save.chamber || 0, V0 = voiceAt(C), resume = save.at === "hall2" || C > 0;
    var root = document.getElementById("cave-root") || document.body;
    var kept = keptList(save);
    home = el("div", { class: "oagc", "data-bm-mouth": "" }, [el("div", { class: "bm-home" }, [
      el("h1", { text: "The Big Mind cave" }),
      el("p", { text: "A walk inward, one voice at a time. In each chamber a voice stands in the way. You are asked if it may speak, and if you say yes, you step into its place and answer as it." }),
      el("ul", {}, [
        el("li", { text: "You may sit out any question, or any voice. A voice you hold back simply waits." }),
        el("li", { text: "You can take control back at any time. The Self button at the top always brings you back to being yourself." }),
        el("li", { text: "You can walk back up and out whenever you like. Your place is saved at every chamber." }),
        el("li", { text: "What you keep stays on this device. Nothing is sent anywhere." }),
      ]),
      el("div", { class: "bm-safe", "data-bm-safety": "" }, [
        el("div", { text: "This is a game, not therapy. If you are in crisis or thinking of harming yourself, call or text 988 in the US, or find a line near you at " }),
        el("a", { href: "https://findahelpline.com", target: "_blank", rel: "noopener", text: "findahelpline.com" }),
      ]),
      el("div", { class: "oagc-row" }, [
        // Every visit asks again, whatever the save holds (bmt-ask-again), so going back in always meets the chamber's voice.
        el("button", { "data-bm-enter": "", text: !resume ? "Go in" : "Go back in, to " + V0.name, onclick: function () { enter("hall1"); } }),
        fromRoom ? el("button", { class: "alt", "data-bm-home": "", text: "Back to the WAVE room", onclick: goHome }) : el("span", {}),
        resume ? el("button", { class: "alt", "data-bm-restart": "", text: "Start at the mouth again", onclick: function () { var s = readSave(); s.at = "mouth"; s.chamber = 0; writeSave(s); enter("hall1"); } }) : el("span", {}),
      ]),
      kept,
    ])]);
    root.appendChild(home);
  }
  // The five feelings are the five elements (oag-clean-up-moves). The player picks; the game never guesses (bmw-player-names).
  // Each drop in a voice's charge while it held back, as one line: what came before it, and the numbers.
  function movedLines(charges) {
    return charges.filter(function (c) { return c.why && c.from != null && c.v < c.from; }).map(function (c) { return c.why + ": " + c.from + " to " + c.v; });
  }
  var BOSS_NAME = { protector: "the Protector", self: "the self", controller: "control itself", player: "the vulnerable child" };
  // A boss as a voice names it: to the Controller, "controller" is control itself; to the Skeptic, it is the Controller.
  function bossName(voice, b) { return (voice && voice.bossNames && voice.bossNames[b]) || BOSS_NAME[b]; }
  var ELEMENTS = [["fire", "Fire", "anger"], ["water", "Water", "sadness"], ["wood", "Wood", "joy"], ["metal", "Metal", "fear"], ["earth", "Earth", "neutrality"]];
  var WAVE_LABEL = { welcome: "Welcome", acknowledge: "Acknowledge", allow: "Allow", accept: "Accept", appreciate: "Appreciate", validate: "Validate", exhale: "Exhale" };
  // One W.A.V.E. shown back as one line (bmw-shown), for example "Fear, Metal, in your chest: 8 to 6".
  function waveLine(w) {
    var e = ELEMENTS.filter(function (x) { return x[0] === w.element; })[0], parts = [];
    if (w.word) parts.push(w.word.charAt(0).toUpperCase() + w.word.slice(1));
    if (e) parts.push(e[1]);
    if (w.place) parts.push("in your " + w.place.toLowerCase());
    var head = parts.length ? parts.join(", ") : "A W.A.V.E.";
    return head + ": " + w.before + " to " + w.afterCharge + (w.blocked ? " (something was in the way at " + (WAVE_LABEL[w.blocked] || w.blocked) + ")" : "");
  }

  function spiritLabel(o) {
    var e = ELEMENTS.filter(function (x) { return x[0] === o.element; })[0], m = o.meet && !o.ally && VOICES.filter(function (x) { return x.id === o.meet; })[0];
    return o.name + (o.ally ? " (ally)" : e ? " (" + e[1] + ")" : "") + (m ? ", from meeting " + m.name : "");
  }
  function pips(n) { var s = ""; for (var i = 0; i < MARKS; i++) s += i < n ? "●" : "○"; return s; }
  // A voice's trust in plain lines, for the cave mouth: its marks, what it saw, promises not yet kept, falls, and its read of you.
  function trustLines(t, vid) {
    var T = TRUST[vid], out = []; if (!T) return out;
    if (!t.seen.length && !t.promises.length && !t.broken.length) return out;
    out.push("Can you " + pips(markOf(t, vid, "can")) + "  Will you " + pips(markOf(t, vid, "will")));
    t.seen.forEach(function (x) { var l = (KIND_LINES[x.dim] || {})[x.kind]; if (l) out.push("It saw: " + l); });
    t.promises.filter(function (p) { return p.kept == null; }).forEach(function (p) { var pr = PROMISES.filter(function (x) { return x[0] === p.kind; })[0]; if (pr) out.push("Promise not yet kept: " + pr[1]); });
    var open = openBreaks(t);
    t.broken.forEach(function (b) { var l = BROKEN_LINES[b.dim + ":" + b.kind]; if (l) out.push(l + (open.indexOf(b) < 0 ? " You owned it, and it heard you." : "")); });
    out.push("Its read of you, in its words: “" + T.read[goodOf(t)] + "”");
    return out;
  }
  // What you've kept: keep or forget per voice, and delete everything (bmc-safety).
  function keptList(save) {
    var ids = Object.keys(save.voices), sps = save.spirits || [];
    if (!ids.length && !sps.length && !save.centre) return el("span", {});
    var box = el("div", { class: "bm-kept", "data-bm-kept": "" }, [el("p", { text: "What you've kept, on this device:" })]);
    if (sps.length) box.appendChild(el("p", { "data-bm-keptspirits": "", text: "Spirits that come back in with you: " + sps.map(spiritLabel).join(", ") + "." }));
    ids.forEach(function (id) {
      var v = save.voices[id], voice = VOICES.filter(function (x) { return x.id === id; })[0];
      var name = voice ? voice.title : id;
      box.appendChild(el("p", { text: name + (v.keepsWay ? " (it is keeping the way for now; ask it again next time)" : v.status === "waiting" ? " (waiting; it has not spoken yet)" : "") }));
      var mv = movedLines(v.charges || []);
      if (mv.length) box.appendChild(el("ul", { "data-bm-keptmoved": id }, mv.map(function (m) { return el("li", { text: "Moved it: " + m }); })));
      if (v.boss) box.appendChild(el("p", { "data-bm-keptboss": id, text: "It works for " + bossName(voice, v.boss) + "." }));
      if (v.spirit && !v.spirit.gone) box.appendChild(el("p", { "data-bm-keptmeet": id, text: "The spirit from meeting it walks with you: " + spiritLabel({ name: v.spirit.name, element: v.spirit.element }) + "." }));
      if (v.talked) box.appendChild(el("p", { "data-bm-kepttalked": id, text: "You talked it through with it " + (v.talked === 1 ? "once" : v.talked + " times") + ". The words were not kept." }));
      var tl = trustLines(trustOf(v), id);
      if (tl.length) box.appendChild(el("ul", { "data-bm-kepttrust": id }, tl.map(function (m) { return el("li", { text: m }); })));
      if (v.kept.length) box.appendChild(el("ul", {}, v.kept.map(function (k) { return el("li", { text: k.line }); })));
      if (v.waves && v.waves.length) box.appendChild(el("ul", { "data-bm-keptwaves": id }, v.waves.map(function (w) { return el("li", { text: "W.A.V.E.: " + waveLine(w) }); })));
      box.appendChild(el("div", { class: "oagc-row" }, [el("button", { class: "alt", "data-bm-forget": id, text: "Forget " + name, onclick: function () {
        // Forgetting a voice sends the player back to its chamber's start; forgetting the Protector clears who waits too.
        var s = readSave(), k = VOICES.indexOf(voice); delete s.voices[id];
        if (k >= 0 && k <= (s.chamber || 0)) { s.chamber = k; s.at = "mouth"; if (k === 0) s.waiting = []; }
        writeSave(s); mouth();
      } })]));
    });
    if (save.centre) {
      box.appendChild(el("p", { "data-bm-keptcentre": "", text: CENTRE.title.replace(/^The /, "The ") + (save.centre.status === "spoken" ? " (it spoke with you at the centre)" : " (you were with it at the centre)") }));
      if (save.centre.kept.length) box.appendChild(el("ul", {}, save.centre.kept.map(function (k) { return el("li", { text: k.line }); })));
      box.appendChild(el("div", { class: "oagc-row" }, [el("button", { class: "alt", "data-bm-forget": "centre", text: "Forget the centre", onclick: function () {
        var s = readSave(); delete s.centre; writeSave(s); mouth();
      } })]));
    }
    box.appendChild(el("div", { class: "oagc-row" }, [el("button", { class: "alt", "data-bm-wipe": "", text: "Delete everything", onclick: function () {
      if (window.confirm("Delete everything the cave has kept on this device?")) { wipe(); mouth(); }
    } })]));
    return box;
  }

  // ---- the cave --------------------------------------------------------------------------------
  // The route (a choice): hallway, chamber, hallway, the next chamber's closed mouth, along one gently winding line. The
  // chamber is the tunnel widened; past the voice the way stays gathered shut until the voice has spoken or been held back.
  var W = 4.4, H = 3, CHAMBER_IN = 40, CHAMBER_OUT = 72, S_VOICE = 58, S_SELF = 52, S_GATE = 61, WALK = 2.6, RUN_K = 2.1, WAIT_D = 2.2; // WAIT_D: how far from the middle a waiting part stands
  function layout() {
    var pts = [], z;
    for (z = 0; z <= 124; z += 2) pts.push({ x: 2.2 * Math.sin(z * 0.07) + 1.2 * Math.sin(z * 0.023 + 1), z: -z });
    var r = K.makeRoute(K.smoothLine(pts, 0.5), "main");
    r.sEnd = r.len - 8;
    return r;
  }
  function bump(s, a, b, ramp) { return clamp((s - a) / ramp, 0, 1) * clamp((b - s) / ramp, 0, 1); }

  var running = null;
  // Spirits walking with the player from one chamber into the next, handed over once (the hallway runs on, a choice).
  var carry = null;
  // What this visit has practised, for the return rite (bmt-return): the kinds of honest move seen, in order. A visit starts at
  // the mouth.
  var visit = { did: [], met: [] };
  function enter(from) {
    visit = { did: [], met: [] };
    K.loadThree().then(function (THREE) { home.style.display = "none"; play(THREE, from); })
      .catch(function (e) { alert("The cave could not open: " + e.message); });
  }

  function play(THREE, from) {
    var save = readSave(), C = save.chamber || 0, V = voiceAt(C), NEXT = nextAfter(C);
    // A part asked to wait for its own chamber is heard there: it no longer waits by the wall once its chamber is reached.
    if (save.waiting.indexOf(V.id) >= 0) { save.waiting = save.waiting.filter(function (x) { return x !== V.id; }); writeSave(save); }
    var wrap = el("div", { class: "oagc", "data-bm-cave": "" });
    var stage = el("div", { class: "oagc-stage", "data-bm-stage": "" });
    var modal = el("div", { class: "oagc-modal", "data-bm-modal": "", "aria-hidden": "true" });
    var hint = el("div", { class: "bm-hint", "data-bm-hint": "" });
    var ring = el("div", { class: "oagc-ring", "data-bm-ring": "", text: "Hold to walk" });
    var fade = el("div", { class: "oagc-fade" });
    var selfBtn = el("button", { class: "bm-self", "data-bm-selfbtn": "", text: "Self", onclick: function () { selfPause(); } });
    var meterFill = el("i"), meterNum = el("b", { text: "" }), meterGone = el("s"), meterDrop = el("span", { class: "bm-drop", text: "" });
    // Two charges (Wendell's board answer bmw-whose-charge, 11 October 2026: "Two charges, yours and its"): the voice's charge
    // ("it") decides trust as before; the player's own charge ("you") is what a W.A.V.E. works, and shows once it is given.
    var meter = el("div", { class: "bm-meter", "data-bm-meter": "", style: "display:none" }, [el("span", { text: V.title.replace(/^The /, "") + " (it)" }), el("div", { class: "bm-bar" }, [meterFill, meterGone, el("u", { style: "left:" + (READY * 10) + "%" })]), meterNum, meterDrop]);
    var youFill = el("i"), youNum = el("b", { text: "" });
    var meterYou = el("div", { class: "bm-meter you", "data-bm-meteryou": "", style: "display:none" }, [el("span", { text: "You" }), el("div", { class: "bm-bar" }, [youFill]), youNum]);
    // The two marks, can you and will you (bmt-trust-shown A): pips that fill as the voice sees the right answer honestly played.
    var marks = el("div", { class: "bm-marks", "data-bm-marks": "", style: "display:none" });
    var meters = el("div", { class: "bm-meters" }, [meter, marks, meterYou]);
    var easedLine = el("div", { class: "bm-eased", "data-bm-eased": "" });
    [stage, hint, ring, modal, selfBtn, meters, easedLine, fade].forEach(function (n) { wrap.appendChild(n); });
    document.body.appendChild(wrap);
    fade.style.opacity = 1; setTimeout(function () { fade.style.opacity = 0; }, 30);

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { hint.textContent = "This device cannot show the cave."; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.appendChild(renderer.domElement);
    var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0c18); scene.fog = new THREE.FogExp2(0x0c0c18, 0.028);
    var camera = new THREE.PerspectiveCamera(70, 1, 0.1, 220);
    function size() { var w = stage.clientWidth || 1, h = stage.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }

    // phase: hall1 (walking to the voice), chamber (the dialogue), hall2 (walking on), end (the next chamber's mouth).
    // gate is how open the way past the voice is (0.45 shut, 1 open); held is the finger on the stage or the ring.
    var st = { phase: from, s: from === "hall2" ? S_GATE + 2 : 2, held: false, gate: from === "hall2" ? 1 : 0.45, gateGoal: from === "hall2" ? 1 : 0.45,
      clk: 0, moving: false, cam: "behind", modal: false, answers: {}, perms: {}, fears: [], charge: null, charges: [], you: null, waves: [], place: null, know: null, be: {}, translators: [], waiting: save.waiting.slice(), asked: 0, flash: 0, speed: 1, endOpen: 0, child: {}, lat: 0, run: false };
    // Trust, kept across sittings (see blankTrust): pending holds honest moves waiting for the next check-in, sat the kinds seen
    // this sitting (each counts once a sitting), and prevCharge the voice's last charge from an earlier sitting, so the first
    // check-in of a visit can show whether it eased since then.
    var TR = TRUST[V.id], rec0 = save.voices[V.id];
    st.trust = trustOf(rec0); st.pending = []; st.sat = {}; st.willing = false; st.refusedNow = false; st.since = new Date().toISOString();
    st.prevCharge = rec0 && rec0.charges && rec0.charges.length ? rec0.charges[rec0.charges.length - 1].v : null;
    if (visit.met.indexOf(V.id) < 0) visit.met.push(V.id);
    var route = layout(), tweens = [], last = performance.now(), snap = true;
    function tween(ms, fn, done) { tweens.push({ t0: performance.now(), ms: ms / st.speed, fn: fn, done: done }); }
    function ease(k) { return k * k * (3 - 2 * k); }
    function side(s, d) { var a = at(route, s); return { x: a.x - a.fz * d, y: a.y, z: a.z + a.fx * d, fx: a.fx, fz: a.fz }; }
    function floor(a) { return a.y - H * 0.92; }

    // The Cave of Lessons' stone (its J1 tiles, wet on the walls and dry on the floor), in this cave's own colour. The tiles
    // load after the first frame; until then, and if they never come, the stone is a plain colour.
    var rock = K.stoneOf(THREE, null, 0x5a5470);
    K.loadTiles(THREE).then(function (tiles) { K.tileStone(rock, tiles); });
    route.openAt = function (s) {
      var o = 1 + 0.85 * bump(s, CHAMBER_IN, CHAMBER_OUT, 7);
      var g = clamp((s - S_GATE) / 5, 0, 1), u = g * g * (3 - 2 * g);
      o *= 1 - u + u * st.gate;
      var e = clamp((s - (route.sEnd + 2)) / 5, 0, 1); o *= 1 - 0.5 * e * (1 - (st.endOpen || 0)); // the next chamber's mouth, shut until the centre opens
      if (st.sit) o *= 1 - 0.16 * st.sit.k * clamp(1 - Math.abs(s - st.s) / 14, 0, 1); // the walls draw in around a sitting (a choice)
      return o;
    };
    var tube = K.buildTube(THREE, route, { w: W, h: H, rock: rock, openAt: route.openAt, seed: 31 });
    scene.add(tube.mesh); scene.add(K.buildPebbles(THREE, route, W, H, 0, route.len));
    // Dressed from the Cave of Lessons' kit (cave.js dressCave), clear of the seat, the voice, the gate, the wall where the
    // waiting voices stand and the next mouth.
    if (K.dressCave) { var waitClear = []; for (var wc = S_GATE + 12; wc < S_GATE + 58; wc += 2) waitClear.push(wc); scene.add(K.dressCave(THREE, route, tube, { w: W, h: H, rock: rock, seed: "bigmind" + V.id, s0: 4, clear: [S_SELF, S_VOICE, S_GATE, CHAMBER_IN - 1, route.sEnd + 4].concat(waitClear) })); }
    var lamp = new THREE.PointLight(0xffe0b0, 1.2, 60); scene.add(lamp);
    var hemi = new THREE.HemisphereLight(0xc8c8ff, 0x282430, 0.42); scene.add(hemi);
    var chamberLight = new THREE.PointLight(0x6a9aff, 1.3, 34); var cl = at(route, S_VOICE); chamberLight.position.set(cl.x, floor(cl) + 5, cl.z); scene.add(chamberLight);
    var lantern = K.buildLantern(THREE), la = side(CHAMBER_IN - 1, W * 0.7); lantern.position.set(la.x, floor(la), la.z); scene.add(lantern);

    function daemonRow(id) { return K.DAEMONS.filter(function (d) { return d[0] === id; })[0]; }
    function seeThrough(g, op) { g.traverse(function (m) { if (m.material) { m.material.transparent = true; m.material.opacity = op; } }); }
    function figureAt(g, s, d, faceBack) { var a = side(s, d); g.position.set(a.x, floor(a) + 0.02, a.z); g.rotation.y = K.yawFacing(a) + (faceBack ? Math.PI : 0); }

    // The voice: the Cave of Lessons' daemon body, taller than the avatar, facing the one who comes.
    var voice = K.buildDaemon(THREE, daemonRow(V.daemon), 6.2); seeThrough(voice, 1); scene.add(voice);
    var aside = from === "hall2" ? W * 0.95 : 0;
    figureAt(voice, S_VOICE, aside, aside === 0); if (aside) voice.rotation.y += Math.PI / 2;
    // The easing (Wendell, 11 October 2026: "There should be a visual reward for when the charge goes down"). When the
    // player gives a lower charge than before, a ring of warm light spreads out from the voice's feet, motes rise off it,
    // the voice lets its breath out, and the chamber's light warms by how calm it now is (choices, all of them).
    var easeRing = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.25, 64), new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    easeRing.rotation.x = -Math.PI / 2; var er = at(route, S_VOICE); easeRing.position.set(er.x, floor(er) + 0.06, er.z); scene.add(easeRing);
    var MOTES = 48, moteGeo = new THREE.BufferGeometry(), moteBase = [], motePos = new Float32Array(MOTES * 3);
    for (var mi = 0; mi < MOTES; mi++) { var ma = mi * 2.399, mr = 0.5 + 1.3 * ((mi * 37) % 11) / 11; moteBase.push({ x: Math.cos(ma) * mr, z: Math.sin(ma) * mr, y: 0.4 + 4.5 * ((mi * 53) % 17) / 17, v: 0.7 + ((mi * 29) % 7) / 7 }); }
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    var motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0xfff1b0, size: 0.16, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    motes.position.copy(easeRing.position); scene.add(motes);
    var calmBlue = new THREE.Color(0x6a9aff), calmWarm = new THREE.Color(0xffd49a);
    // The shut mouth at the hallway's end shows no figure (board bmt-hidden-next, Wendell, 16 October 2026): it breathes with the
    // cave, a light in it in the next voice's colour and a low sound that comes up as the player nears. Only the centre keeps a
    // figure, the vulnerable child, hidden until the mouth opens: the faceless avatar, small and warm (a choice).
    var nextFig = null, mouthCol = 0xffd49a;
    if (NEXT.centre) {
      nextFig = K.buildAvatar(THREE, "other"); nextFig.scale.setScalar(0.55); nextFig.userData.mat.color.setHex(0xffd49a); nextFig.userData.mat.emissive.setHex(0xffd49a); nextFig.userData.mat.emissiveIntensity = 0.35;
      seeThrough(nextFig, 0.55); figureAt(nextFig, route.sEnd + 4, 0, true); nextFig.visible = false; scene.add(nextFig);
    } else { var nrow = daemonRow(NEXT.daemon); if (nrow && nrow[3] != null) mouthCol = nrow[3]; }
    var mo = at(route, route.sEnd + 3.4);
    var mouthLight = new THREE.PointLight(mouthCol, 0, 20); mouthLight.position.set(mo.x, floor(mo) + 1.8, mo.z); scene.add(mouthLight);
    var mouthGlow = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40), new THREE.MeshBasicMaterial({ color: mouthCol, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    mouthGlow.position.set(mo.x, floor(mo) + 1.7, mo.z); mouthGlow.rotation.y = K.yawFacing(mo); scene.add(mouthGlow);
    // The sound: brown noise through a low filter, swelling and settling with the breath. It starts at the first touch (a page
    // may not make sound before one) and is closed with the cave.
    var snd = null;
    function mouthSound() {
      if (snd !== null) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) { snd = false; return; }
        var ac = new AC(), n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0), l = 0;
        for (var i = 0; i < n; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; }
        var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        var fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 200;
        var gn = ac.createGain(); gn.gain.value = 0; src.connect(fl); fl.connect(gn); gn.connect(ac.destination); src.start();
        snd = { ac: ac, gain: gn, filter: fl };
      } catch (e) { snd = false; }
    }
    function stopMouthSound() { if (snd) { try { snd.gain.gain.value = 0; snd.ac.close(); } catch (e) { /* already closed */ } } snd = false; }
    var avatar = K.buildAvatar(THREE, "other"); scene.add(avatar);
    var ghost = null, figures = [];
    // Translators already waiting from an earlier sitting stand by the wall of the second hallway.
    st.waiting.forEach(function (id, i) { var f = translatorFigure(id); f.userData.wait = true; figureAt(f, S_GATE + 14 + i * 6, -WAIT_D, false); f.rotation.y += -Math.PI / 2; scene.add(f); figures.push(f); });

    function translatorFigure(id) {
      var T = TRANSLATORS[id], f;
      if (T && T.daemon) { f = K.buildDaemon(THREE, daemonRow(T.daemon), 4.8); seeThrough(f, 0.7); }
      else { f = K.buildAvatar(THREE, "numbness"); seeThrough(f, 0.45); }
      f.userData.id = id; return f;
    }

    // ---- input: hold anywhere to walk -----------------------------------------------------------
    K.holdArea(stage); K.holdArea(ring);
    function down(e) { if (st.modal) return; e.preventDefault(); mouthSound(); st.held = true; }
    function up() { st.held = false; }
    // Seated, a drag on the scene turns the camera around the charge while the panel stays open (Wendell, 12 October 2026,
    // 22:53: "be able to look at the scene from all sides"). The camera keeps inside the cave: see keepInCave.
    var orb0 = null;
    stage.addEventListener("pointerdown", function (e) { if (st.sit) orb0 = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
    stage.addEventListener("pointermove", function (e) {
      if (!orb0 || !st.sit || e.pointerId !== orb0.id) return;
      var O = st.orbit || (st.orbit = { yaw: 0, pitch: 0 });
      O.yaw -= (e.clientX - orb0.x) * 0.012; O.pitch = clamp(O.pitch + (e.clientY - orb0.y) * 0.008, -0.5, 0.9);
      orb0.x = e.clientX; orb0.y = e.clientY;
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (k) { stage.addEventListener(k, function () { orb0 = null; }); });
    // A point pulled back inside the cave's walls, floor and roof, at the nearest place along the path.
    function keepInCave(p, s0) {
      var best = s0, bd = 1e9;
      for (var q = Math.max(0, s0 - 12); q <= Math.min(route.len - 1, s0 + 12); q += 0.25) { var c = at(route, q), d = (p.x - c.x) * (p.x - c.x) + (p.z - c.z) * (p.z - c.z); if (d < bd) { bd = d; best = q; } }
      var a = at(route, best), o = route.openAt(best), nx = -a.fz, nz = a.fx, lat = (p.x - a.x) * nx + (p.z - a.z) * nz, m = 0.62 * W * o;
      if (Math.abs(lat) > m) { var dl = (Math.sign(lat) * m - lat); p.x += nx * dl; p.z += nz * dl; }
      p.y = clamp(p.y, floor(a) + 0.5, a.y + 0.45 * H * o);
      return p;
    }
    // Free walking and running (board bmt-free-walk, Wendell, 16 October 2026): the stick at the bottom left, or the arrow keys and
    // W A S D, walk the figure wherever the thumb points, forward, back and to either side inside the walls; Run (or Shift) goes
    // faster. Holding anywhere still walks straight on. The chamber threshold still stops the player: forward ends at the voice
    // in the first hallway and at the mouth in the second, and the way back stops at the mouth and at the voice's gate.
    var stick = { x: 0, z: 0 }, keys = {}, stickId = null;
    var stickPad = el("div", { class: "oagr-stick", "data-bm-stick": "", "aria-label": "Walk", role: "slider", style: "bottom:calc(76px + env(safe-area-inset-bottom));left:10px;width:104px;height:104px" });
    var stickKnob = el("div", { class: "oagr-knob" }); stickPad.appendChild(stickKnob);
    var runBtn = el("button", { class: "bm-run", "data-bm-run": "", "aria-pressed": "false", text: "Run", onclick: function () { st.run = !st.run; runBtn.setAttribute("aria-pressed", String(st.run)); } });
    wrap.appendChild(stickPad); wrap.appendChild(runBtn);
    function stickAt(e) {
      var rc = stickPad.getBoundingClientRect(), r = rc.width / 2;
      if (!(r > 0)) { stickUp(); return; }
      var dx = e.clientX - rc.left - r, dy = e.clientY - rc.top - r, d = Math.hypot(dx, dy), m = Math.min(d, r);
      stick.x = d ? dx / d * m / r : 0; stick.z = d ? dy / d * m / r : 0;
      stickKnob.style.transform = "translate(" + stick.x * r * 0.6 + "px," + stick.z * r * 0.6 + "px)";
    }
    function stickUp() { stickId = null; stick.x = 0; stick.z = 0; stickKnob.style.transform = ""; }
    K.holdArea(stickPad);
    stickPad.addEventListener("pointerdown", function (e) { e.preventDefault(); mouthSound(); stickId = e.pointerId; try { stickPad.setPointerCapture(e.pointerId); } catch (x) { /* old browsers */ } stickAt(e); });
    stickPad.addEventListener("pointermove", function (e) { if (e.pointerId === stickId) stickAt(e); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (n) { stickPad.addEventListener(n, function (e) { if (e.pointerId === stickId) stickUp(); }); });
    var KEYS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    function typing() { var a = document.activeElement; return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT"); }
    function keyDown(e) { if (e.code === "ShiftLeft" || e.code === "ShiftRight") { keys.Shift = true; return; } if (!KEYS[e.code] || typing() || st.modal) return; mouthSound(); keys[e.code] = true; e.preventDefault(); }
    function keyUp(e) { delete keys[e.code]; if (e.code === "ShiftLeft" || e.code === "ShiftRight") delete keys.Shift; }
    window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);
    // Where the thumb or keys point, in the path's frame: along is forward (up on the stick), side is to the right.
    function walkInput() {
      var x = stick.x, z = stick.z; Object.keys(keys).forEach(function (k) { if (KEYS[k]) { x += KEYS[k][0]; z += KEYS[k][1]; } });
      var m = Math.hypot(x, z);
      if (m >= 0.15) { if (m > 1) { x /= m; z /= m; m = 1; } return { along: -z / m, side: x / m, m: m }; }
      return st.held ? { along: 1, side: 0, m: 1 } : null;
    }
    [stage, ring].forEach(function (n) { n.addEventListener("pointerdown", down); n.addEventListener("pointerup", up); n.addEventListener("pointercancel", up); n.addEventListener("pointerleave", up); });

    // ---- the modal ------------------------------------------------------------------------------
    function show(kids, tag) {
      if (st.trustNote && !/^(sit|wave|self|spirit|mouth|rite)/.test(tag || "")) kids = kids.slice(0, 1).concat(trustNoteEls(), kids.slice(1)); // what the voice saw, once
      modal.innerHTML = ""; kids.forEach(function (k) { if (k) modal.appendChild(k); });
      modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); modal.setAttribute("data-bm-step", tag || "");
      modal.scrollTop = 0; st.modal = true; st.held = false; stickUp(); ring.style.display = "none"; hint.textContent = "";
    }
    function hide() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); modal.setAttribute("data-bm-step", ""); st.modal = false; ring.style.display = ""; }
    function guide(t) { return el("p", { class: "bm-guide", text: t }); }
    // The breath, drawn (Wendell, 12 October 2026, 21:15: "need the breathing animation on these screens"): a ring of light that
    // swells over the 4 s in-breath and settles over the 6 s out-breath, saying in and out. The frame breathes it, at the page's
    // speed, from when its screen opens; with reduced motion it holds still and only the words change (choices).
    function orb() { var o = el("div", { class: "bm-orb", "data-bm-orb": "", "aria-hidden": "true", text: "in" }); o._t = 0; return o; }
    function says(t) { return el("p", { class: "bm-voice", text: t }); }
    function row(btns) { return el("div", { class: "oagc-row" }, btns); }
    function btn(text, fn, attrs, alt) { var a = attrs || {}; a.text = text; a.onclick = fn; if (alt) a.class = "alt"; return el("button", a); }

    var paused = null;
    function selfPause() {
      if (modal.getAttribute("data-bm-step") === "self") return;
      // Taking control back (bmc-safety): the walk stops, and nothing has to happen next.
      paused = { html: Array.prototype.slice.call(modal.childNodes), tag: modal.getAttribute("data-bm-step"), open: st.modal };
      show([el("h2", { text: "You're the self again" }), guide("Nothing has to happen next. You can sit here as long as you like, go on when you're ready, or walk back up and out."),
        row([btn("Go on", resume, { "data-bm-goon": "" }), btn("Walk back up", function () { leave(); }, { "data-bm-leave": "" }, true)])], "self");
    }
    function resume() {
      var p = paused; paused = null;
      if (p && p.then) { hide(); return p.then(); }
      if (p && p.tag === "eased") { hide(); modal.setAttribute("data-bm-step", "eased"); st.modal = true; ring.style.display = "none"; return; }
      if (p && p.open) { modal.innerHTML = ""; p.html.forEach(function (n) { modal.appendChild(n); }); modal.setAttribute("data-bm-step", p.tag); } else hide();
    }

    // ---- the chamber: a conversation with one voice -------------------------------------------
    function npc(t) { return el("p", { class: "bm-npc" }, [el("b", { text: V.title + ": " }), document.createTextNode(t)]); }
    function you(t) { return el("p", { class: "bm-you", text: "You: " + t }); }
    function arrive() {
      st.phase = "chamber"; marksShow();
      if (needsFeel()) return feelAsk();
      var M = V.meet;
      var born = st.felt && st.felt !== true ? spirits.filter(function (o) { return o.meet === V.id && !o.ally; })[0] : null;
      if (born) st.felt = true; // said once, on the screen right after it is born
      show([el("h2", { text: V.title }), born ? guide("A spirit comes out of you and walks at your side: " + spiritLabel(born) + ".") : guide(V.arrive), npc(M.opens)].concat(returning(), spiritLines(), vouching(), [
        el("div", { class: "bm-cards" }, M.replies.map(function (r) { return btn(r[0], function () { met(r); }, { class: "bm-card", "data-bm-reply": r[2] }); })),
        row([btn("Not now", decline, { class: "bm-link", "data-bm-decline": "" })])]), "meet");
    }
    // The meeting spirit (bmt-meeting-spirit): asked once per voice, the first time it is met; Not now still declines here.
    function needsFeel() {
      if (st.felt) return false;
      var r = readSave().voices[V.id]; return !(r && r.spirit);
    }
    function feelAsk() {
      var input = el("input", { type: "text", "data-bm-feelline": "", placeholder: "Or in your own words", maxlength: "60", enterkeyhint: "done", "aria-label": MEET_FEEL });
      function own() { var t = input.value.trim(); if (t) felt(t.charAt(0).toUpperCase() + t.slice(1), null, "own"); }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); own(); } });
      show([el("h2", { text: V.title }), guide(V.arrive), npc(V.meet.opens), guide(MEET_FEEL + " Whatever it is, it's honest, and it counts for nothing and against nothing."),
        el("div", { class: "bm-cards" }, ELEMENTS.map(function (e) { var w = e[2].charAt(0).toUpperCase() + e[2].slice(1); return btn(w + " (" + e[1] + ")", function () { felt(w, e[0], e[0]); }, { class: "bm-card", "data-bm-feel": e[0] }); })
          .concat([btn(NO_WORD, function () { felt(NO_WORD, null, "none"); }, { class: "bm-card", "data-bm-feel": "none" })])),
        el("div", { class: "bm-line" }, [input, btn("That's it", own, { "data-bm-feelsay": "" })]),
        row([btn("Not now", decline, { class: "bm-link", "data-bm-decline": "" })])], "meet-feel");
    }
    function felt(name, element, how) {
      st.felt = how;
      var o = { name: name, element: element, meet: V.id };
      var me = side(st.s, st.lat || 0); addSpirit(o, new THREE.Vector3(me.x, floor(me) + 1.2, me.z));
      meetSave(o);
      arrive();
    }
    // Its name and element are kept with the voice, so it comes back in with the player and can become their ally.
    function meetSave(o) {
      try {
        var s = readSave(), r = s.voices[o.meet] || (s.voices[o.meet] = { status: "waiting", kept: [], savedAt: stamp() });
        r.spirit = { name: o.name, element: o.element || null }; if (o.gone) r.spirit.gone = true; writeSave(s);
      } catch (e) { /* this browser would not save */ }
    }
    function met(r) {
      var M = V.meet, rest = M.replies.filter(function (x) { return x !== r && x[2] !== "who"; });
      var kids = [el("h2", { text: V.title }), you(r[0]), npc(r[1])];
      if (r[2] === "who") kids.push(el("div", { class: "bm-cards" }, rest.map(function (x) { return btn(x[0], function () { met(x); }, { class: "bm-card", "data-bm-reply": x[2] }); })));
      else kids.push(row([btn(M.after[r[2]], function () { permit("speak", 0, body); }, { "data-bm-ask": "speak" })]));
      kids.push(row([btn("Not now", decline, { class: "bm-link", "data-bm-decline": "" })]));
      show(kids, "met");
    }
    // ---- the charge (the ontology game's charge, Wendell 10 October 2026, 22:39) ---------------------------------
    // The player says where the part lives in the body and how charged it is, and after each answer is asked again whether
    // it feels any different and how charged it is now. The meter shows the player's own number. When it falls to READY or
    // below, the Protector trusts the player enough to offer to step aside (READY is a choice).
    var READY = 3;
    function body() {
      var kids = [el("h2", { text: V.title }), guide("Before you ask it anything, notice it. Where does " + V.name + " live in your body?"),
        el("div", { class: "bm-cards" }, V.places.map(function (pl) { return btn(pl, function () { placed(pl); }, { class: "bm-card", "data-bm-place": pl }); }))];
      if (window.OAGBody && window.OAGBody.pick) kids.push(row([btn("Show me on the body map", function () {
        hide(); window.OAGBody.pick().then(function (r) { if (r) placed(r.label); else body(); });
      }, { "data-bm-bodymap": "" }, true)]));
      kids.push(row([btn("I can't find it yet", function () { placed(null); }, { class: "bm-link", "data-bm-noplace": "" })]));
      show(kids, "body");
    }
    function placed(pl) { st.place = pl; chargeAsk(null, "How charged is " + V.name + " right now?"); }
    function setMeter(v) {
      meter.style.display = ""; meterFill.style.width = (v * 10) + "%"; meterNum.textContent = String(v);
      meter.setAttribute("data-bm-charge", String(v)); meter.classList.toggle("ready", v <= READY);
    }
    // i is the question just answered (null before the first). The slider starts at the last number.
    function chargeAsk(i, ask) {
      st.lastPoll = { i: i, ask: ask };
      var cur = st.charge == null ? 7 : st.charge;
      var num = el("b", { class: "bm-chargenum", text: String(cur) });
      var range = el("input", { type: "range", min: "0", max: "10", step: "1", value: String(cur), "data-bm-range": "", "aria-label": "Charge, 0 to 10" });
      range.addEventListener("input", function () { num.textContent = range.value; setMeter(+range.value); });
      var kids = [el("h2", { text: V.title })];
      if (i != null) { var said = st.answers[V.questions[i].id]; if (said) said.forEach(function (l) { kids.push(npc(l)); }); kids.push(guide(qReflect(V.questions[i]))); }
      kids.push(guide(ask + (st.place ? " (in your " + st.place.toLowerCase() + ")" : "")), el("div", { class: "bm-charge" }, [el("span", { text: "calm 0" }), range, el("span", { text: "10 full" })]), el("p", { class: "bm-chargeline" }, [num, document.createTextNode(" out of 10")]),
        row([btn("That's how it is", function () { charged(i, +range.value); }, { "data-bm-charged": "" })]),
        row([btn("Breathe with it (W.A.V.E.)", function () { waveStart(i, ask); }, { "data-bm-wave": "" }, true),
          btn("Talk it through (3-2-1)", function () { talkThrough(function () { chargeAsk(i, ask); }, function () { afterCharge(i, st.charge); }); }, { "data-bm-talk": "" }, true)]),
        st.willing ? row([btn("Ask it to step aside now", function () { permit("aside", 0, V.deep ? deepCheck : seatShift); }, { class: "bm-link", "data-bm-askaside": "" })]) : null);
      show(kids, i == null ? "charge-first" : "charge");
      setMeter(cur);
    }
    // quiet: no new number was given (a question sat out), so it is no check-in and honest moves keep waiting.
    function charged(i, v, quiet) {
      var was = st.charge;
      st.charge = v; st.charges.push({ after: i == null ? "start" : V.questions[i].id, v: v }); setMeter(v);
      if (!quiet) resolvePending(was != null ? was : st.prevCharge, v);
      if (was != null && v < was) return eased(was, v, function () { afterCharge(i, v); });
      afterCharge(i, v);
    }
    // The reward for a lower charge: the panel steps away for a breath so the player sees the chamber answer. A bigger drop
    // gives a wider ring and more light; crossing the ready line gives the most.
    function eased(was, v, then) {
      var drop = was - v, crossed = was > READY && v <= READY;
      st.eases = (st.eases || 0) + 1;
      hide(); modal.innerHTML = ""; modal.setAttribute("data-bm-step", "eased"); st.modal = true; ring.style.display = "none";
      meterGone.style.left = (v * 10) + "%"; meterGone.style.width = (drop * 10) + "%"; meterDrop.textContent = "\u2212" + drop;
      meter.classList.remove("eased"); void meter.offsetWidth; meter.classList.add("eased");
      meter.setAttribute("data-bm-eases", String(st.eases));
      easedLine.innerHTML = "";
      easedLine.appendChild(document.createTextNode(crossed ? V.title + " lets its breath out." : drop >= 3 ? V.title + " eases a lot." : V.title + " eases."));
      easedLine.appendChild(el("small", { text: was + " down to " + v }));
      easedLine.classList.add("on");
      var big = Math.min(1, 0.45 + drop * 0.18 + (crossed ? 0.35 : 0)), still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      st.easing = { k: 0, big: big, still: still };
      if (crossed) st.flash = Math.max(st.flash, 0.7);
      tween(crossed ? 2600 : 2100, function (k) { st.easing.k = k; }, function () {
        st.easing = null; easedLine.classList.remove("on"); meterDrop.textContent = "";
        if (modal.getAttribute("data-bm-step") === "self") { paused = { then: then }; return; } // the Self button was taken mid-breath
        st.modal = false; then();
      });
    }
    // Two roads past a voice (bmt-two-roads): its charge at READY or below, or all three kinds of trust seen. Once it is willing
    // the player can keep talking, and walking on waits for them (bmt-keep-talking).
    function afterCharge(i, v) {
      var open = v <= READY || trusted(st.trust, V.id);
      if (open && !st.willing) return ready();
      var n = i == null ? 0 : i + 1;
      while (n < V.questions.length && st.answers[V.questions[n].id]) n++;
      if (n < V.questions.length) return askQ(n, "");
      if (open) return ready();
      show([el("h2", { text: V.title }), npc(V.notYet), guide("You've asked it everything you know to ask. Nothing has to change yet."),
        row([btn("Sit with it, and check again", function () { chargeAsk(null, "Does it feel any different now? How charged is it?"); }, { "data-bm-recheck": "" }), leaveBtn("aside")])], "notyet");
    }

    // ---- the W.A.V.E. on your own charge -------------------------------------------------------------------------
    // Wendell's note of 11 October 2026: "One should also be able to do W.A.V.E. in the cave on the protector (and other
    // voices) in order to gain more data about the motions charge that comes up while talking to the daemon". His board
    // answer bmw-whose-charge: two charges, yours and its. The W.A.V.E. is on the player's own charge ("you"); only the
    // voice's charge ("it") decides trust. It is an offer at every poll, never required (bmw-offer). It is the game's
    // breathed W.A.V.E., one breath per step, done standing where the player stands (bmw-game-wave). The player names the
    // feeling and picks its element; the game never guesses (bmw-player-names). Afterwards the voice's poll comes back as
    // after any answer, and the W.A.V.E. never sets or nudges that number (bmw-number-stays).
    var WAVE = window.__oagCave.WAVE, RUNGS = ["acknowledge", "allow", "accept", "appreciate"];
    var WAVE_BTN = { welcome: "I've welcomed it", acknowledge: "I acknowledge it", allow: "I allow it", accept: "I accept it", appreciate: "I appreciate it", validate: "I validate that" };
    var wv = null;
    function youMeter(v) { meterYou.style.display = ""; youFill.style.width = (v * 10) + "%"; youNum.textContent = String(v); meterYou.setAttribute("data-bm-you", String(v)); }
    function youSlider(start, label) {
      var num = el("b", { class: "bm-chargenum", text: String(start) });
      var range = el("input", { type: "range", min: "0", max: "10", step: "1", value: String(start), "data-bm-yourange": "", "aria-label": label });
      range.addEventListener("input", function () { num.textContent = range.value; youMeter(+range.value); });
      return { range: range, kids: [el("div", { class: "bm-charge" }, [el("span", { text: "calm 0" }), range, el("span", { text: "10 full" })]), el("p", { class: "bm-chargeline" }, [num, document.createTextNode(" out of 10")])] };
    }
    // The charge being worked shows in the scene through the whole W.A.V.E. (Wendell, 12 October 2026, 21:15: "there should be a
    // spirit that is apearing that represents the charge that is being worked on EVEN in this WAVE context. it should follow the
    // same rule of getting bigger as you allow"). It is the sitting's grey shape: it comes along the path from ahead, takes its
    // element's colour at Acknowledge, grows and brightens by the Allow sliders, dulls at Validate, and at the Exhale either walks
    // with you as a spirit (stay) or rises and fades (release: "exhale and release should have an animation of the spirit being
    // dismissed"). Going back before any step lets it sink away again; a W.A.V.E. left at a block keeps it walking with you, since
    // nothing dismisses a spirit for you (bms-dismiss). Choices, all of them.
    function chargeBlob() {
      var g = new THREE.Group(), au = K.buildAura(THREE, 0.9);
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), new THREE.MeshStandardMaterial({ color: 0x8a8a96, emissive: 0x8a8a96, emissiveIntensity: 0.25, transparent: true, opacity: 0.85, roughness: 0.7 }));
      m.position.y = 0.6; g.add(m); g.userData.body = m; g.add(au); g.userData.aura = au; scene.add(g);
      return { g: g, allow: { grow: 3, bright: 7 }, allowed: false, element: null, named: false, dull: 0, come: 1, rise: 0, fade: 1, near: true };
    }
    function blobGone(B, ms, done) {
      tween(ms, function (k) { var e = ease(k); B.rise = 2.5 * e; B.fade = 1 - e; }, function () { scene.remove(B.g); if (done) done(); });
    }
    // back: where to go afterwards when the W.A.V.E. was not started from a poll (from the trust panel in the hallway).
    function waveStart(i, ask, back) {
      wv = { i: i, ask: ask, back: back || null, after: i == null ? "start" : V.questions[i].id, word: "", element: null, place: null, before: null, reached: null, blocked: null };
      var B = wv.B = chargeBlob(); tween(1400, function (k) { B.come = 1 - ease(k); });
      var sl = youSlider(st.you == null ? 5 : st.you, "Your own charge, 0 to 10");
      show([el("h2", { text: "Breathe with it" }), guide("This is about your own charge: the feeling that comes up in you while you sit with " + V.name + ". Its charge stays as you set it."),
        guide("How charged are you right now?")].concat(sl.kids, [
        row([btn("That's me right now", function () { wv.before = +sl.range.value; st.you = wv.before; youMeter(wv.before); wavePlace(); }, { "data-bm-youset": "" })]),
        row([btn("Back to " + V.name, function () { var B = wv.B, bk = wv.back; wv = null; B.leaving = true; st.pending = st.pending.filter(function (p) { return p.kind !== "hold"; }); tween(700, function (k) { B.come = ease(k); B.fade = 1 - ease(k); }, function () { scene.remove(B.g); }); if (bk) bk(); else chargeAsk(i, ask); }, { class: "bm-link", "data-bm-waveback": "" })])]), "wave-you");
      youMeter(+sl.range.value);
    }
    function wavePlace() {
      var opts = V.places.map(function (pl) { return btn(pl, function () { wv.place = pl; waveStep(0); }, { class: "bm-card", "data-bm-waveplace": pl }); });
      show([el("h2", { text: "Breathe with it" }), guide("Where do you feel it in your body?"), el("div", { class: "bm-cards" }, opts),
        row([btn("I can't find it yet", function () { wv.place = null; waveStep(0); }, { class: "bm-link", "data-bm-wavenoplace": "" })])], "wave-place");
    }
    // One step, one breath: its button wakes when the breath has been taken (the cave's own 4 s in, 6 s out).
    function waveStep(n) {
      var w = WAVE[n], id = w[0], rung = RUNGS.indexOf(id) >= 0;
      var cue = el("p", { class: "bm-breath", "data-bm-breath": "", text: "Breathe in…" }), B = wv.B;
      var kids = [el("p", { class: "bm-wavestep", text: "W.A.V.E. · " + (n + 1) + " of " + WAVE.length }), el("h2", { text: w[1] }), guide(w[2])];
      var go = [];
      if (id === "acknowledge") {
        // Name it in one word, then pick its element from the five (bmw-player-names).
        var word = el("input", { type: "text", maxlength: "30", placeholder: "One word for the feeling", "data-bm-waveword": "", "aria-label": "One word for the feeling" });
        var picked = null, els = ELEMENTS.map(function (e) {
          var b = el("button", { class: "bm-card", "data-bm-element": e[0], "aria-pressed": "false", text: e[1] + " (" + e[2] + ")", onclick: function () {
            picked = e[0]; B.element = e[0]; B.named = true; els.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          } });
          return b;
        });
        kids.push(guide("Name the feeling to yourself in one word, then pick its element."), el("div", { class: "bm-line" }, [word]), el("div", { class: "bm-cards" }, els));
        go.push(btn(WAVE_BTN[id], function () { wv.word = word.value.trim(); wv.element = picked; climbed(n); }, { "data-bm-wavego": id, disabled: "" }));
      } else if (id === "exhale") {
        go.push(btn("Yes, let it stay", function () { wv.exhale = "stay"; blobStays(); waveAfter(); }, { "data-bm-exhale": "stay", disabled: "" }),
          btn("No, exhale and release", function () { wv.exhale = "release"; blobReleased(); }, { "data-bm-exhale": "release", disabled: "" }, true));
      } else {
        if (id === "allow") {
          // Allow grows it, by the same two sliders as the sitting and the WAVE room (K.allowSliders).
          B.allowed = true;
          kids.push(guide((wv.word || "It") + " grows a little as you let it be here."));
          K.allowSliders(B.allow, "data-bm-waveallow").forEach(function (x) { kids.push(x); });
        }
        if (id === "appreciate") {
          // Appreciate as in the game's other W.A.V.E.s: an optional line (oag-appreciate-input) and Not now (wave-room-appreciate-optional).
          // Wendell, 21:15: "The apprecaite step should also allow the player to skip and say something the appreciate about it". What
          // is written stays on the page and is not saved (a choice, as with the sitting's words).
          kids.push(guide("What can you appreciate about what showed up?"), el("div", { class: "bm-line" }, [el("input", { type: "text", maxlength: "200", placeholder: "In your own words, if you want", "data-bm-waveappreciate": "", "aria-label": "What you appreciate about it" })]),
            guide("You may not find anything to appreciate today, and that's all right."));
          go.push(btn("Not now", function () { waveStep(n + 1); }, { "data-bm-wavenotnow": "", disabled: "" }, true));
        }
        if (id === "validate") B.dull = 0.6; // worked through: it dulls, as in the WAVE room
        go.unshift(btn(WAVE_BTN[id], function () { if (rung) climbed(n); else waveStep(n + 1); }, { "data-bm-wavego": id, disabled: "" }));
      }
      kids.push(orb(), cue, el("div", { class: "oagc-row bm-wave" }, go));
      var side = [];
      if (rung && wv.reached) side.push(btn("This is as far as I can honestly go today", function () { waveStep(WAVE.length - 2); }, { class: "bm-link", "data-bm-wavestop": "" }));
      side.push(btn("Something's in the way", function () { waveBlocked(id); }, { class: "bm-link", "data-bm-waveblock": "" }));
      kids.push(row(side));
      show(kids, "wave-" + id);
      var BR = K.BREATH, inMs = BR.inS * 1000, outMs = BR.outS * 1000;
      tween(inMs, function () {}, function () { cue.textContent = "…and out"; tween(outMs, function () {}, function () {
        cue.textContent = "One breath."; go.forEach(function (b) { b.removeAttribute("disabled"); });
      }); });
    }
    function climbed(n) { wv.reached = WAVE[n][0]; waveStep(n + 1); }
    function blobStays() {
      var B = wv.B; if (!B || B.leaving) return; B.leaving = true; scene.remove(B.g);
      addSpirit({ name: wv.word || "A charge", element: wv.element }, B.g.position.clone().setY(B.g.position.y + 0.8));
    }
    function blobReleased() {
      var B = wv.B; B.leaving = true; hide(); modal.setAttribute("data-bm-step", "wave-releasing"); st.modal = true; ring.style.display = "none";
      hint.textContent = "On the out-breath, it lifts and goes.";
      blobGone(B, K.BREATH.outS * 1000 * 0.5, function () {
        hint.textContent = "";
        if (modal.getAttribute("data-bm-step") === "self") { paused = { then: waveAfter }; return; }
        waveAfter();
      });
    }
    // A step that won't go further is noted, and the W.A.V.E. counts as complete there (oag-wave-ladder's stopping rule).
    // Where a block goes in this cave is still open with Wendell (bmw-block), so this is the plain default (a choice).
    // A block can also be sat down with (bms-block-sits): the room's steps run in place on what is in the way, and afterwards
    // the W.A.V.E. comes back at the step it stopped on.
    function waveBlocked(id) {
      wv.blocked = id;
      var n = WAVE.map(function (w) { return w[0]; }).indexOf(id);
      show([el("h2", { text: "Something's in the way" }), guide("That's noted. A W.A.V.E. that stops here still counts. You don't have to push past it."),
        guide("Or you can sit down with what's in the way, and come back to this step after."),
        row([btn("Sit down with it", function () { wv.blocked = null; wv.satAt = id; sitDown("me", function () { waveStep(n); }, null, "block"); }, { "data-bm-blocksit": "" }),
          btn("Go on", function () { blobStays(); waveAfter(); }, { "data-bm-blockgo": "" }, true)])], "wave-blocked");
    }
    function waveAfter() {
      var sl = youSlider(wv.before == null ? 5 : wv.before, "Your own charge now, 0 to 10");
      show([el("h2", { text: "Breathe with it" }), guide("How charged are you now?")].concat(sl.kids, [
        row([btn("That's me now", function () { waveSaved(+sl.range.value); }, { "data-bm-youafter": "" })])]), "wave-after");
    }
    // One entry per W.A.V.E. under the voice (bmw-record). The feeling word is stored only if kept at the keeping step.
    function waveSaved(v) {
      st.you = v; youMeter(v);
      st.waves.push({ after: wv.after, word: wv.word || null, element: wv.element, place: wv.place, before: wv.before, afterCharge: v,
        reached: wv.reached, blocked: wv.blocked, exhale: wv.exhale || null, at: new Date().toISOString() });
      var i = wv.i, ask = wv.ask, bk = wv.back; wv = null;
      pend("can", "hold"); // a W.A.V.E. breathed through beside the voice is a can-you move, counted if it eases next
      if (bk) return bk();
      chargeAsk(i, ask); // the voice's poll comes back as after any answer; its number is the player's alone
    }
    // ---- sitting down, anywhere, and the spirits that follow -----------------------------------------------------
    // Wendell's board steer (bmw-block, 12 October 2026): "One should be able to sit down and do a version of the wave room on
    // the part in front of them while they are in the cave. They should be able to do this when a charge emerges for them not
    // just when they are in front of a daemon. The charge spirits can come with then throughout the cave until they are
    // dismissed. The daemons should be able to respond to how many spirits are around. They might be protecting the self from
    // the charge they are carrying". Pass 3 and his answers: Sit down is there anywhere (bms-sit-anywhere); it runs the WAVE
    // room's own steps in place, from cave.js's ROOM_STEPS, WAVE and talk321 (bms-in-place); in a chamber the player picks each
    // time whether to sit with what's coming up in them or with the voice in front of them (bms-sit-whom = pick); a charge
    // that stays at the fork follows as a spirit in its element's colour with its name, at most three in view and the rest as
    // a count (bms-spirits-follow); a spirit is dismissed by tapping it, thanking it, then breathing out or sitting with it
    // again (bms-dismiss). Only where and with whom a sitting happened, and which way it went, is saved; never its words.
    // Wendell's steer of 12 October 2026, 20:43, which widens bms-spirits-follow: "When someone does WAVE sitting down in the big
    // mind cave or the other cave environments it should spawn a spirit that walks with the character until dismissed". So every
    // sitting spawns one, whichever way it went and whoever it was with. Away at the fork no longer lets it go on the spot, since
    // nothing dismisses a spirit for you (bms-dismiss): the out-breath softens it, and it walks lighter (a choice).
    var SIT_WHERE = { 3: "You are sitting where you stopped, looking at it.", 2: "You are face to face with it.", 1: "You are sitting where it sat, and it sits where you were.", check: "You are face to face with it.", after: "You are back where you sat down.", paused: "You leaned back from it, still sitting." };
    var sitBtn = el("button", { class: "bm-sitbtn", "data-bm-sitbtn": "", text: "Sit down", onclick: function () { sitOffer(); } });
    var spiritBtn = el("button", { class: "bm-spiritbtn", "data-bm-spiritbtn": "", style: "display:none", onclick: function () { spiritList(); } });
    wrap.insertBefore(sitBtn, fade); wrap.insertBefore(spiritBtn, fade);
    var spirits = [], SHOW_SPIRITS = K.SPIRITS_SHOWN;
    function colorOf(element) { return K.spiritHex(element); }
    function stash() { return { html: Array.prototype.slice.call(modal.childNodes), tag: modal.getAttribute("data-bm-step"), open: st.modal }; }
    function unstash(p) {
      if (!p || !p.open) return hide();
      modal.innerHTML = ""; p.html.forEach(function (n) { modal.appendChild(n); });
      modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); modal.setAttribute("data-bm-step", p.tag); st.modal = true; st.held = false; ring.style.display = "none";
    }
    function canSit() {
      var tag = modal.getAttribute("data-bm-step") || "";
      return !st.sit && !st.auto && !st.turned && st.cam !== "voice" && !/^(self|eased|sit|spirit|mouth|thanks|know|be-|wave-releasing|talk|perm-be)/.test(tag);
    }
    function sitOffer() {
      if (!canSit()) return;
      var p = stash(), back = function () { unstash(p); };
      if (st.phase !== "chamber" || !voice.visible) return sitDown("me", back, null, "button");
      show([el("h2", { text: "Sit down" }), guide("Who do you want to sit with?"),
        el("div", { class: "bm-cards" }, [
          btn("What's coming up in me", function () { sitDown("me", back, null, "button"); }, { class: "bm-card", "data-bm-sitwhom": "me" }),
          btn(V.title + ", in front of me", function () { sitDown("voice", st.lastPoll ? function () { chargeAsk(st.lastPoll.i, st.lastPoll.ask); } : back, null, "button"); }, { class: "bm-card", "data-bm-sitwhom": "voice" }),
        ]), row([btn("Stay standing", back, { class: "bm-link", "data-bm-sitcancel": "" })])], "sit-whom");
    }
    function sitSteps(S) { return K.ROOM_STEPS.filter(function (r) { return S.whom === "me" || r.id !== "fork"; }); }
    // whom: "me" (what's coming up in the player) or "voice" (the voice in front of them). back runs when they stand up again.
    // spirit: a spirit sat with again. via: what the sitting came from (the button, a block in a W.A.V.E., or a spirit).
    // A charge needs no name to be sat with: the game gives each one a name of its own to keep track of it, and the player
    // can name it in their own words at Acknowledge or once they have been through it, at Validate.
    var NAME_A = ["Slow", "Restless", "Heavy", "Small", "Bright", "Low", "Tangled", "Soft", "Warm", "Cold", "Hollow", "Humming"];
    var NAME_B = ["Moth", "Stone", "Drum", "Knot", "Ember", "Tide", "Thorn", "Lantern", "Pebble", "Root", "Bell", "Wren"];
    function genName() {
      var taken = spirits.map(function (o) { return o.name; }), n;
      try { taken = taken.concat((readSave().spirits || []).map(function (o) { return o.name; })); } catch (e) {}
      for (var i = 0; i < 40; i++) { n = NAME_A[Math.floor(Math.random() * NAME_A.length)] + " " + NAME_B[Math.floor(Math.random() * NAME_B.length)]; if (taken.indexOf(n) < 0) break; }
      return n;
    }
    function sitDown(whom, back, spirit, via) {
      st.orbit = null;
      var S = st.sit = { gen: spirit ? spirit.name : whom === "voice" ? V.title : genName(), whom: whom, back: back, via: via, where: st.phase, n: 0, phase: "steps", place: whom === "voice" ? st.place : null, texture: null,
        name: spirit ? spirit.name : whom === "voice" ? V.title : "", element: spirit ? spirit.element : null, unknown: false, allow: { grow: 3, bright: 7 }, allowed: false,
        goal: "", move: "", t321: { phase: "before", rounds: 1, msgs: [], voice: "you", draft: "", before: 6, after: 3 }, k: 0, dull: 0, spirit: spirit || null, come: 1 };
      hide(); modal.setAttribute("data-bm-step", "sitting"); st.modal = true; ring.style.display = "none";
      if (spirit) spirit.hidden = true;
      // The figure sits, the walls draw in around it, and what's coming up comes along the path from ahead as a grey shape that
      // takes its colour once it is named (choices). Sitting with the voice puts the glow on the voice instead.
      var g = new THREE.Group(), au = K.buildAura(THREE, whom === "voice" ? 1.8 : 0.9);
      if (whom !== "voice") {
        var m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), new THREE.MeshStandardMaterial({ color: 0x8a8a96, emissive: 0x8a8a96, emissiveIntensity: 0.25, transparent: true, opacity: 0.85, roughness: 0.7 }));
        m.position.y = 0.6; g.add(m); g.userData.body = m;
      }
      g.add(au); g.userData.aura = au; S.g = g; scene.add(g);
      tween(1400, function (k) { S.k = ease(k); S.come = 1 - ease(k); tube.dirty = true; }, function () {
        if (modal.getAttribute("data-bm-step") === "self") { paused = { then: sitDraw }; return; }
        sitDraw();
      });
    }
    function cardRow(list, cur, attr, pick) {
      return el("div", { class: "bm-cards" }, list.map(function (x) {
        var a = { class: "bm-card", "aria-pressed": String(cur === x[0]) }; a[attr] = x[0];
        return btn(x[1], function () { pick(x[0]); }, a);
      }));
    }
    function lineInput(attr, val, ph, onInput) {
      var a = { type: "text", maxlength: "60", placeholder: ph, "aria-label": ph }; a[attr] = "";
      var i = el("input", a); i.value = val; i.addEventListener("input", function () { onInput(i.value); });
      return el("div", { class: "bm-line" }, [i]);
    }
    function sitNext() { var S = st.sit, steps = sitSteps(S); S.n++; if (S.n >= steps.length) return standUp("done"); sitDraw(); }
    function sitDraw() {
      var S = st.sit; if (!S) return;
      var nm = S.name.trim() || S.gen, standBtn = btn("Stand up", function () { standUp("stood"); }, { class: "bm-link", "data-bm-standup": "" });
      if (S.phase === "stays") {
        var k = [], title = K.talk321(S.t321, { name: nm, damaged: false, skippable: true, redraw: sitDraw, focus: function () { K.focusChat(modal); }, where: SIT_WHERE, aim: "Aimed at what you want: " + S.goal,
          ask: function (body) {
            body.push(guide("What is one next move toward " + S.goal + "? Write it."));
            var done = btn("That's my move", function () { standUp("stays"); }, { "data-bm-sitmovedone": "" });
            body.push(lineInput("data-bm-sitmove", S.move, "One next move", function (v) { S.move = v; done.disabled = !v.trim(); }));
            done.disabled = !S.move.trim(); body.push(row([done]));
          } }, k);
        show([el("h2", { text: title })].concat(k), "sit-321");
        return;
      }
      if (S.phase === "goes") {
        show([el("h2", { text: "Exhale" }), guide("Let the out-breath soften it. It walks with you, lighter, until you thank it and let it go."), orb(),
          row([btn("Breathe out", function () { standUp("goes"); }, { "data-bm-sitexhale": "" })]), row([standBtn])], "sit-goes");
        return;
      }
      var steps = sitSteps(S), R = steps[S.n], w = R.wave != null ? K.WAVE[R.wave] : [R.id, R.title, R.words];
      var kids = [el("p", { class: "bm-wavestep", text: (S.whom === "voice" ? "Sitting with " + V.name : "Sitting with what's coming up") + " · " + (S.n + 1) + " of " + steps.length }), el("h2", { text: w[1] }), guide(w[2])];
      var go = btn("Go on", function () { if (R.id === "validate") S.dull = 0.6; sitNext(); }, { "data-bm-sitnext": "" }), extra = [];
      if (R.id === "witness") {
        kids.push(guide(S.place ? "Where: " + S.place + "." : "Where is it in your body?"), cardRow(V.places.map(function (pl) { return [pl, pl]; }), S.place, "data-bm-sitplace", function (v) { S.place = v; sitDraw(); }));
        if (window.OAGBody && window.OAGBody.pick) kids.push(row([btn("Show me on the body map", function () { window.OAGBody.pick().then(function (r) { if (r) S.place = r.label; sitDraw(); }); }, { "data-bm-sitbodymap": "" }, true)]));
        kids.push(guide("What is it like?"), cardRow(K.TEXTURES.map(function (t) { return [t[0], t[1]]; }), S.texture, "data-bm-sittexture", function (v) { S.texture = v; sitDraw(); }));
        go.disabled = !S.texture;
      } else if (R.id === "acknowledge") {
        kids.push(guide(S.whom === "voice" ? "Name what you feel from " + V.name + ", in your own words, then its element if you know it." : "Its element, if you know it. You can give it a name of your own, now or once you have been with it."));
        if (S.whom === "voice" && S.name === V.title) S.name = "";
        var ready = function () { go.disabled = !(S.element || S.unknown); };
        kids.push(lineInput("data-bm-sitname", S.name, "Its name for now: " + S.gen, function (v) { S.name = v; ready(); }),
          cardRow(K.ELEMENTS.map(function (x) { return [x[1].toLowerCase(), x[0] + " · " + x[1]]; }).concat([["unknown", "I don't know"]]), S.unknown ? "unknown" : S.element, "data-bm-sitelement",
            function (v) { S.unknown = v === "unknown"; S.element = S.unknown ? null : v; sitDraw(); }));
        ready();
      } else if (R.id === "allow") {
        S.allowed = true;
        kids.push(guide(nm + " grows a little as you let it be here."));
        K.allowSliders(S.allow, "data-bm-sitallow").forEach(function (n) { kids.push(n); });
      } else if (R.id === "fork") {
        kids.push(guide("What do you actually want right now?"));
        var tw = btn("Toward it", function () { S.phase = "stays"; sitDraw(); }, { "data-bm-sitpush": "toward" });
        var aw = btn("Away from it", function () { S.phase = "goes"; sitDraw(); }, { "data-bm-sitpush": "away" }, true);
        var ok = function () { tw.disabled = aw.disabled = !S.goal.trim(); };
        kids.push(lineInput("data-bm-sitgoal", S.goal, "What you want, in your words", function (v) { S.goal = v; ok(); }), guide("Is " + nm + " pushing your next move toward it, or away from it?"));
        ok(); kids.push(row([tw, aw]), row([standBtn]), el("p", { class: "bm-wavestep", text: "What you write stays on this page." }));
        show(kids, "sit-fork");
        return;
      } else if (R.id === "validate") {
        kids.push(guide("Now that you have been with it, does it have a name of your own?"), lineInput("data-bm-sitrename", S.name, "Or keep " + S.gen, function (v) { S.name = v; }));
      } else if (R.id === "appreciate") {
        // As at the W.A.V.E.'s own Appreciate (oag-appreciate-input): an optional line, kept on the page only.
        kids.push(guide("What can you appreciate about what showed up?"), lineInput("data-bm-sitappreciate", S.appreciate || "", "In your own words, if you want", function (v) { S.appreciate = v; }),
          guide("You may not find anything to appreciate today, and that's all right."));
      }
      if (R.notNow) extra.push(btn("Not now", sitNext, { "data-bm-sitnotnow": "" }, true));
      kids.push(orb(), row([go].concat(extra)), row([standBtn]));
      show(kids, "sit-" + R.id);
    }
    // branch: stays (Toward at the fork), goes (Away: breathed out, lighter), done (the voice's sitting ran to the end), stood (stood
    // up partway: nothing is marked). Every one leaves a spirit walking with the player; a spirit sat with again keeps walking.
    function standUp(branch) {
      var S = st.sit, nm = S.name.trim() || S.gen;
      hide(); modal.setAttribute("data-bm-step", "sitting"); st.modal = true; ring.style.display = "none";
      try { var s = readSave(); s.sittings = (s.sittings || []).concat([{ where: S.where, whom: S.spirit ? "spirit" : S.whom, via: S.via, branch: branch, at: new Date().toISOString() }]); writeSave(s); } catch (e) {}
      if (S.whom === "voice" && branch !== "stood") pend("can", "sit"); // sat with it to the end: a can-you move, counted if it eases next
      var from = S.g.position.clone();
      tween(branch === "goes" ? 2200 : 1200, function (k) {
        S.k = 1 - ease(k); tube.dirty = true;
      }, function () {
        scene.remove(S.g); st.sit = null;
        var lighter = branch === "goes";
        if (S.spirit) { S.spirit.hidden = false; if (S.element) S.spirit.element = S.element; S.spirit.lighter = lighter; S.spirit.g.userData.level = lighter ? 0.2 : 0.45; if (S.spirit.meet) meetSave(S.spirit); }
        else addSpirit({ name: nm, element: S.element, lighter: lighter }, from);
        if (modal.getAttribute("data-bm-step") === "self") { paused = { then: S.back }; return; }
        st.modal = false; S.back();
      });
    }
    function addSpirit(o, from) {
      var col = o.color != null ? o.color : colorOf(o.element);
      var g = K.buildSpirit(THREE, o.name, col); if (o.lighter) g.userData.level = 0.2;
      if (from) g.position.copy(from); else { var a = side(Math.max(0.5, st.s - 2.2), 0.9); g.position.set(a.x, floor(a) + 1.7, a.z); }
      // each spirit carries a small light of its own, as in the Cave of Lessons (Wendell, 2026-10-13: "The avaiable lighting
      // centers around the character and any spirits that are following them")
      o.light = new THREE.PointLight(col, 0.6, K.LAMP.reach * 0.5, K.LAMP.decay); scene.add(o.light);
      scene.add(g); o.g = g; spirits.push(o); spiritsUi();
    }
    function letGo(o, from) {
      var i = spirits.indexOf(o); if (i >= 0) spirits.splice(i, 1); spiritsUi();
      var g = o.g, y0 = (from || g.position).y; g.position.copy(from || g.position); o.leaving = true;
      var li = o.light.intensity;
      tween(1600, function (k) { g.position.y = y0 + 2.5 * ease(k); g.traverse(function (m) { if (m.material) m.material.opacity = 0.9 * (1 - k); }); o.light.intensity = li * (1 - k); }, function () { scene.remove(g); scene.remove(o.light); });
    }
    function spiritsUi() {
      var n = spirits.length;
      spiritBtn.style.display = n ? "" : "none";
      spiritBtn.textContent = "Spirits " + n + (n > SHOW_SPIRITS ? " (+" + (n - SHOW_SPIRITS) + " behind)" : "");
      spiritBtn.setAttribute("data-bm-spirits", String(n));
    }
    function spiritList() {
      var tag = modal.getAttribute("data-bm-step") || "";
      if (!spirits.length || st.sit || st.auto || /^(self|eased|sit|spirit|mouth|talk)/.test(tag)) return;
      var p = stash(), back = function () { unstash(p); };
      show([el("h2", { text: "Spirits with you" }), guide("Tap one to thank it."),
        el("div", { class: "bm-cards" }, spirits.map(function (o, oi) { return btn(spiritLabel(o), function () { thank(o, back); }, { class: "bm-card", "data-bm-spirit": String(oi) }); })),
        row([btn("Back", back, { class: "bm-link", "data-bm-spiritback": "" })])], "spirit-list");
    }
    function thank(o, back) {
      if (o.ally) { // an ally walks with the player while its voice trusts them
        show([el("h2", { text: o.name }), you("Thank you for coming with me."), guide("It walks with you while " + (VOICES.filter(function (x) { return x.id === o.ally; })[0] || {}).name + " trusts you, and vouches for you further in."),
          row([btn("Back", back, { "data-bm-spiritback": "" })])], "spirit-thank");
        return;
      }
      show([el("h2", { text: o.name }), you("Thank you for coming with me."), guide("Breathe it out and let it go, or sit with it again."),
        row([btn("Breathe out, and let it go", function () { hide(); letGo(o); if (o.meet) { o.gone = true; meetSave(o); } back(); }, { "data-bm-spiritout": "" }),
          btn("Sit with it again", function () { sitDown("me", back, o, "spirit"); }, { "data-bm-spiritsit": "" }, true)])], "spirit-thank");
    }
    // A voice met before is asked again (bmt-ask-again): what it said then does not stand in for today. It says where its trust
    // stands: promises not yet kept, a fall not yet owned (bmt-trust-falls), and its read of you in its words.
    function returning() {
      if (!rec0 || !(rec0.status === "spoken" || rec0.keepsWay || st.trust.seen.length || st.trust.promises.length)) return [];
      var t = st.trust, kids = [guide("You have met " + V.name + " before. What it said then doesn't stand in for today, so ask again.")];
      if (t.promises.some(function (p) { return p.kind === "visit" && p.kept == null; })) kids.push(npc("You said you'd come back and ask me again. Here you are."));
      if (t.promises.some(function (p) { return p.kind === "return" && p.kept == null; })) kids.push(npc("You promised to come back to your own place. I'm still waiting to see it."));
      openBreaks(t).forEach(function (b) { kids.push(npc(b.dim === "will" ? "You said you'd come back to your own place, and you walked out from mine." : "You pushed when I said no.")); });
      if (t.seen.length || t.broken.length) kids.push(npc(TR.read[goodOf(t)]));
      return kids;
    }
    // At each later chamber the voice asks who vouches for you, and allied spirits answer in their own voice's terms; together
    // they count once as a can-you move, if the voice eases (bmt-spirits-vouch). How many spirits you carry adds nothing.
    function vouching() {
      var A = allies(); if (!A.length) return [];
      pend("can", "vouch");
      return [npc("Who vouches for you?")].concat(A.map(function (id) { return el("p", { class: "bm-guide bm-trustsaw", "data-bm-vouch": id, text: TRUST[id].vouch }); }));
    }
    // The voices answer the spirits in what they say and how they stand, never in their charge or trust (bms-voices-respond).
    function spiritLines() {
      var n = spirits.filter(function (o) { return o.meet !== V.id; }).length; if (!n) return [];
      return [npc("You didn't come alone.")].concat(n >= 3 ? [npc("That's a lot to bring through here.")] : []);
    }
    (save.spirits || []).forEach(function (o) { addSpirit({ name: o.name, element: o.element, lighter: !!o.lighter }); });
    if (carry) { carry.forEach(function (o) { addSpirit({ name: o.name, element: o.element, lighter: !!o.lighter }); }); carry = null; }
    // The spirits of voices that trust the player walk with them as allies (bmt-spirits-vouch), the chamber's own voice included.
    // The spirits born on meeting a voice come back in with the player from its record, and walk as allies while it trusts them.
    PATH.forEach(function (id) {
      var r = save.voices[id]; if (!r) return;
      if (trustOf(r).ally && trusted(trustOf(r), id)) return allyJoins(id);
      if (r.spirit && !r.spirit.gone) addSpirit({ name: r.spirit.name, element: r.spirit.element, meet: id });
    });
    if (fromRoom) { fromRoom.spirits.forEach(function (o) { addSpirit({ name: o.name, element: o.element, lighter: !!o.lighter }); }); fromRoom.spirits = []; } // the room's, once


    // ---- trust: marks, honest moves, falls and repair, allies ---------------------------------------------------------
    var trustBtn = el("button", { class: "bm-trustbtn", "data-bm-trustbtn": "", text: "Trust", onclick: function () { trustOffer(); } });
    wrap.insertBefore(trustBtn, fade);
    function stamp() { return new Date().toISOString(); }
    function marksUi(lit) {
      var t = st.trust;
      marks.innerHTML = "";
      marks.appendChild(document.createTextNode("Can you")); marks.appendChild(el("b", { text: pips(markOf(t, V.id, "can")) }));
      marks.appendChild(document.createTextNode("Will you")); marks.appendChild(el("b", { text: pips(markOf(t, V.id, "will")) }));
      marks.setAttribute("data-bm-can", String(markOf(t, V.id, "can"))); marks.setAttribute("data-bm-will", String(markOf(t, V.id, "will")));
      if (lit) { marks.classList.remove("lit"); void marks.offsetWidth; marks.classList.add("lit"); }
    }
    function marksShow() { marks.style.display = ""; marksUi(); }
    // Trust is written as it changes, so a promise or a fall is kept even if the player walks out mid-chamber.
    function trustSave() {
      try {
        var s = readSave(), r = s.voices[V.id] || (s.voices[V.id] = { status: "waiting", kept: [], savedAt: stamp() });
        r.trust = st.trust; writeSave(s);
      } catch (e) { /* this browser would not save */ }
      marksUi();
    }
    // An honest move waits for the next check-in; it counts only if the voice's charge eases there (bmt-honest-moves).
    function pend(dim, kind, repair) {
      if (st.pending.some(function (p) { return p.dim === dim && p.kind === kind && !!p.repair === !!repair; })) return;
      st.pending.push({ dim: dim, kind: kind, repair: !!repair });
    }
    // At a check-in: was is the charge before it (or the last sitting's), v the charge given now. Returns what the voice saw.
    function resolvePending(was, v) {
      if (was == null) return null; // nothing to compare with yet: the moves wait for a check-in that can show easing
      var P = st.pending; st.pending = [];
      if (!P.length || !(v < was)) return null; // a right card with no easing moves nothing
      var at = stamp(), out = { saw: [], hint: [], ally: false };
      P.forEach(function (x) {
        if (x.repair) { st.trust.repaired.push({ dim: x.dim, kind: x.kind, at: at }); out.saw.push("It heard you own it."); out.good = out.good || x.dim === "good"; visit.did.push("repair"); return; }
        var key = x.dim + ":" + x.kind; if (st.sat[key]) return; // once a sitting
        if (x.dim === "good" || x.kind === TR.needs[x.dim] || x.kind === "vouch") {
          st.sat[key] = true; st.trust.seen.push({ dim: x.dim, kind: x.kind, at: at });
          out.saw.push(KIND_LINES[x.dim][x.kind]); visit.did.push(x.kind); if (x.dim === "good") out.good = true;
        } else if (out.hint.indexOf(TR.hint[x.dim]) < 0) out.hint.push(TR.hint[x.dim]);
      });
      if (!st.trust.ally && trusted(st.trust, V.id)) { st.trust.ally = at; out.ally = true; allyJoins(); }
      trustSave(); if (out.saw.length) marksUi(true);
      st.trustNote = out;
      return out;
    }
    // What the voice saw at the last check-in, said once on the next screen.
    function trustNoteEls() {
      var o = st.trustNote; st.trustNote = null; if (!o) return [];
      var kids = o.saw.map(function (l) { return el("p", { class: "bm-guide bm-trustsaw", "data-bm-trustsaw": "", text: V.title + " saw it. " + l }); });
      o.hint.forEach(function (h) { kids.push(npc(h)); });
      if (o.good) kids.push(npc(TR.read[goodOf(st.trust)])); // its read of you, only ever in its words
      if (o.ally) kids.push(guide("It trusts you now. Its spirit comes with you as your ally, and it will vouch for you further in."));
      return kids;
    }
    // Promises (will you): made now, kept when the game sees them kept, and visible as not yet kept until then.
    function promise(kind) {
      if (st.trust.promises.some(function (p) { return p.kind === kind && p.kept == null; })) return;
      st.trust.promises.push({ kind: kind, made: stamp(), kept: null }); trustSave();
    }
    function keepPromise(kind, before) {
      var hit = false;
      st.trust.promises.forEach(function (p) { if (p.kind === kind && p.kept == null && (!before || p.made < before)) { p.kept = stamp(); hit = true; } });
      if (hit) { pend("will", kind); trustSave(); }
      return hit;
    }
    // Leaving from the voice's place breaks the promise to come back to one's own (bmt-trust-falls).
    function breakReturn() {
      var hit = false;
      st.trust.promises.forEach(function (p) { if (p.kind === "return" && p.kept == null) { p.kept = false; hit = true; } });
      if (hit) { st.trust.broken.push({ dim: "will", kind: "return", at: stamp() }); trustSave(); }
    }
    // Pushing past its refusal lowers its read of your goodness (bmt-trust-falls).
    function pushed(key, round, onYes) {
      st.trust.broken.push({ dim: "good", kind: "push", at: stamp() }); trustSave();
      show([el("h2", { text: V.title }), you(V.asks[key].ask), npc(TR.read.broken), guide("Pushing past a refusal costs its trust. Owning it later can repair it."),
        row([btn("Go on", function () { permit(key, round + 1, onYes); }, { "data-bm-pushed": "" })])], "pushed-" + key);
    }
    // The voices whose spirits are your allies now: their voice trusts you (bmt-spirits-vouch).
    function allies() {
      var sv = readSave();
      return PATH.filter(function (id) { return id !== V.id && sv.voices[id] && trustOf(sv.voices[id]).ally && trusted(trustOf(sv.voices[id]), id); });
    }
    // The spirit born when the player met the voice becomes the ally (bmt-spirits-vouch); a voice whose meeting spirit was let go,
    // or met before there were meeting spirits, sends a spirit in its own colour instead.
    function allyJoins(id) {
      id = id || V.id;
      if (spirits.some(function (o) { return o.ally === id; })) return;
      var mine = spirits.filter(function (o) { return o.meet === id; })[0];
      if (mine) { mine.ally = id; spiritsUi(); return; }
      var rec = readSave().voices[id], ms = rec && rec.spirit && !rec.spirit.gone ? rec.spirit : null;
      if (ms) return addSpirit({ name: ms.name, element: ms.element, meet: id, ally: id });
      var vv = VOICES.filter(function (x) { return x.id === id; })[0], row0 = daemonRow(id);
      addSpirit({ name: (vv ? vv.title : id) + "'s spirit", color: row0 ? row0[3] : 0x9a9aa8, ally: id });
    }
    // The trust panel: what the player can show the voice, anywhere on the path. Each move waits for the next check-in.
    function trustOffer() {
      if (!canTrust()) return;
      var p = stash(), back = function () { unstash(p); };
      var said = function (line, then) {
        show([el("h2", { text: V.title }), you(line), guide("It heard you. If it was honest, you'll see it ease the next time you check how charged it is."),
          row([btn("Go on", then || back, { "data-bm-trustok": "" })])], "trust-said");
      };
      var kids = [el("h2", { text: "Show " + V.name + " who you are" }),
        guide("It watches for three things: can you, will you, and are you good. Each voice needs something of its own. A move counts only when it's honest, and that shows as its charge easing the next time you check.")];
      kids.push(el("p", { class: "bm-trusthead", text: "Can you" }), el("div", { class: "bm-cards" }, [
        btn("Wait with it a breath", function () { waitBreath(back); }, { class: "bm-card", "data-bm-trust": "wait" }),
        btn("Breathe a W.A.V.E. through beside it", function () { waveStart(st.lastPoll ? st.lastPoll.i : null, st.lastPoll ? st.lastPoll.ask : null, st.lastPoll ? null : back); }, { class: "bm-card", "data-bm-trust": "hold" }),
        btn("Sit with it", function () { sitDown("voice", back, null, "trust"); }, { class: "bm-card", "data-bm-trust": "sit" }),
        btn("I'll go slowly, and you can stop me.", function () { pend("can", "pace"); said("I'll go slowly, and you can stop me at any time."); }, { class: "bm-card", "data-bm-trust": "pace" }),
      ]));
      kids.push(el("p", { class: "bm-trusthead", text: "Will you" }), el("div", { class: "bm-cards" }, PROMISES.map(function (pr) {
        var made = st.trust.promises.some(function (x) { return x.kind === pr[0] && x.kept == null; }), a = { class: "bm-card", "data-bm-promise": pr[0] };
        if (made) a.disabled = "";
        return btn(pr[1] + (made ? " (promised, not yet kept)" : ""), function () { promise(pr[0]); said(pr[1]); }, a);
      })));
      var line = el("input", { type: "text", maxlength: "200", placeholder: "Or where you share it, in your own words", "data-bm-shareline": "", "aria-label": "Where you share its picture of good" });
      kids.push(el("p", { class: "bm-trusthead", text: "Are you good" }), guide("To " + V.name + ", " + TR.picture + ". Show it where you already share that, from where you stand."),
        el("div", { class: "bm-cards" }, TR.share.map(function (c, ci) { return btn(c[0], function () { pend("good", "share"); said(c[0]); }, { class: "bm-card", "data-bm-share": String(ci) }); })),
        el("div", { class: "bm-line" }, [line, btn("Say it", function () { var t = line.value.trim(); if (!t) return; pend("good", "share"); said(t); }, { "data-bm-sharesay": "" })]));
      var open = openBreaks(st.trust);
      if (open.length) {
        kids.push(el("p", { class: "bm-trusthead", text: "Own it" }), el("div", { class: "bm-cards" }, open.filter(function (b, bi) { return open.map(function (x) { return x.dim + x.kind; }).indexOf(b.dim + b.kind) === bi; }).map(function (b) {
          return btn(OWN_LINES[b.dim + ":" + b.kind], function () { pend(b.dim, b.kind, true); said(OWN_LINES[b.dim + ":" + b.kind]); }, { class: "bm-card", "data-bm-own": b.dim + ":" + b.kind });
        })));
      }
      kids.push(row([btn("Back", back, { class: "bm-link", "data-bm-trustback": "" })]));
      show(kids, "trust");
    }
    function waitBreath(back) {
      var go = btn("I waited with it", function () { pend("can", "wait"); back(); }, { "data-bm-waited": "", disabled: "" });
      var cue = el("p", { class: "bm-breath", text: "Breathe in…" });
      show([el("h2", { text: "Wait with it" }), guide("Nothing to do or say. Stay with " + V.name + " for one breath."), orb(), cue, row([go])], "trust-wait");
      tween(K.BREATH.inS * 1000, function () {}, function () { cue.textContent = "…and out"; tween(K.BREATH.outS * 1000, function () {}, function () { cue.textContent = "One breath."; go.removeAttribute("disabled"); }); });
    }
    function canTrust() {
      var tag = modal.getAttribute("data-bm-step") || "";
      return (st.phase === "hall1" || st.phase === "chamber") && !st.sit && !st.auto && !st.turned && !/^(self|eased|sit|spirit|mouth|thanks|know|be-|wave|trust|deep|keep|secret|thank$|rite|talk|meet-feel)/.test(tag);
    }
    // A check-in outside the questions: after stepping back out, when a kept promise waits to be seen.
    function checkIn(lead, then) {
      var cur = st.charge == null ? 7 : st.charge;
      var num = el("b", { class: "bm-chargenum", text: String(cur) });
      var range = el("input", { type: "range", min: "0", max: "10", step: "1", value: String(cur), "data-bm-range": "", "aria-label": "Charge, 0 to 10" });
      range.addEventListener("input", function () { num.textContent = range.value; setMeter(+range.value); });
      show([el("h2", { text: V.title }), guide(lead), guide("How charged is " + V.name + " now?"),
        el("div", { class: "bm-charge" }, [el("span", { text: "calm 0" }), range, el("span", { text: "10 full" })]), el("p", { class: "bm-chargeline" }, [num, document.createTextNode(" out of 10")]),
        row([btn("That's how it is", function () {
          var was = st.charge, v = +range.value;
          st.charge = v; st.charges.push({ after: "check", v: v }); setMeter(v);
          resolvePending(was != null ? was : st.prevCharge, v);
          if (was != null && v < was) return eased(was, v, then);
          then();
        }, { "data-bm-checkin": "" })])], "checkin");
      setMeter(cur);
    }
    function ready() {
      st.willing = true;
      var n = 0; while (n < V.questions.length && st.answers[V.questions[n].id] !== undefined) n++;
      var byTrust = !(st.charge != null && st.charge <= READY) && trusted(st.trust, V.id);
      show([el("h2", { text: V.title }), npc(V.ready), byTrust ? guide("Its charge is still high, but it has seen all three: what you can do, that you keep your word, and what you're for.") : null,
        st.trust.seen.some(function (x) { return x.dim === "good"; }) ? npc(TR.read[goodOf(st.trust)]) : null,
        row([btn("Ask it to step aside", function () { permit("aside", 0, V.deep ? deepCheck : seatShift); }, { "data-bm-ask": "aside" })]),
        // Keep talking (bmt-keep-talking): its questions, or simply staying with it; walking on waits for the player.
        row([n < V.questions.length ? btn("Keep talking with it", function () { askQ(n, ""); }, { "data-bm-keeptalking": "" }, true) : null,
          btn("Stay with it", function () { sitDown("voice", ready, null, "stay"); }, { "data-bm-staywith": "" }, true),
          btn("Talk it through (3-2-1)", function () { talkThrough(ready, ready); }, { "data-bm-talk": "" }, true)]),
        row([leaveBtn("aside")])], "ready");
    }
    // Standing where the Damaged Self stands goes to the deepest place, so the cave asks first, as the Cave of Lessons does
    // before Be it (Wendell's board, bmc-safety and cave-321-damaged-self-ask): go on, rest, or go back up.
    function deepCheck() {
      show([el("h2", { text: "Before you stand where it stands" }), guide("Standing where " + V.name + " stands goes to the deepest place. Do you want to go on, rest, or go back up?"),
        row([btn("Go on", seatShift, { "data-bm-deep": "continue" }),
          btn("Rest", function () { show([el("h2", { text: "Resting" }), guide("Take as long as you need. " + V.title + " is still standing aside."),
            row([btn("Go on", seatShift, { "data-bm-deep": "continue" }), btn("Go back up", function () { keepsPost("aside"); }, { "data-bm-deep": "up" }, true)])], "deep-rest"); }, { "data-bm-deep": "rest" }, true),
          btn("Go back up", function () { keepsPost("aside"); }, { "data-bm-deep": "up" }, true)])], "deep");
    }

    // Asking permission. The player reads the voice's answer, so the voice is never forced (a choice: the read is the
    // player's, as in the workshop, where the facilitator waits for the voice to come).
    function permit(key, round, onYes, lead) {
      var A = V.asks[key];
      if (key === "speak" && round === 0) keepPromise("visit", st.since); // it was asked again on a later visit, as promised
      show([el("h2", { text: V.title }), lead || null, you(A.ask), guide("Wait for its answer. You may feel it more than see it. How does it answer?"),
        el("div", { class: "bm-cards" }, [
          btn("It lets me", function () { granted(key, onYes); }, { class: "bm-card", "data-bm-perm": "yes" }),
          btn("It holds back", function () { refused(key, round, onYes); }, { class: "bm-card", "data-bm-perm": "no" }),
          btn("I can't tell", function () { unsure(key, round, onYes); }, { class: "bm-card", "data-bm-perm": "unsure" }),
        ])], "perm-" + key);
    }
    function granted(key, onYes) {
      st.perms[key] = (st.perms[key] || 0) + 1; st.refusedNow = false;
      show([el("h2", { text: V.title }), npc(V.asks[key].yes), row([btn("Thank you", onYes, { "data-bm-thanks": key })])], "granted-" + key);
    }
    function unsure(key, round, onYes) {
      show([el("h2", { text: V.title }), guide("Then stay here with it a moment. Breathe with it. Nothing has to happen yet."),
        row([btn("Ask again", function () { pend("can", "wait"); blockPoll(key, round, onYes, "You waited with it"); }, { "data-bm-again": "" }), leaveBtn(key)])], "unsure-" + key);
    }
    // The refusal path. The voice says why, the player asks what it fears and answers as it would, then offers an assurance.
    // Its refusal says what it hasn't seen yet (bmt-two-roads), and the player can wait, ask what it fears, or push (which costs
    // its trust, bmt-trust-falls).
    function refused(key, round, onYes) {
      var A = V.asks[key], t = st.trust, miss = markOf(t, V.id, "can") === 0 ? "can" : markOf(t, V.id, "will") === 0 ? "will" : goodOf(t) !== "seen" ? "good" : null;
      st.refusedNow = true;
      show([el("h2", { text: V.title }), npc(A.no[Math.min(round, A.no.length - 1)]), miss ? npc(TR.doubt[miss]) : null,
        el("div", { class: "bm-cards" }, [
          btn("What are you afraid would happen?", function () { fearAsk(key, round, onYes); }, { class: "bm-card", "data-bm-why": "" }),
          btn("That's fair. I'll wait with you a while.", function () { pend("good", "honour"); unsure(key, round, onYes); }, { class: "bm-card", "data-bm-wait": "" }),
          btn("Ask again, now", function () { pushed(key, round, onYes); }, { class: "bm-card", "data-bm-push": "" }),
        ]), row([leaveBtn(key)])], "refused-" + key);
    }
    function fearAsk(key, round, onYes) {
      var input = el("input", { type: "text", "data-bm-fearline": "", placeholder: "Or say what it says, in its words", maxlength: "200" });
      function said(t) { if (!t) return; st.fears.push(t); assureAsk(key, round, onYes, t); }
      show([el("h2", { text: V.title }), you("What are you afraid would happen?"), guide("Let it answer. What does " + V.name + " say?"),
        el("div", { class: "bm-cards" }, V.fears.map(function (f, fi) { return btn(f[0], function () { said(f[0]); }, { class: "bm-card", "data-bm-fear": String(fi) }); })),
        el("div", { class: "bm-line" }, [input, btn("It says this", function () { said(input.value.trim()); }, { "data-bm-fearsay": "" })])], "fear-" + key);
    }
    function assureAsk(key, round, onYes, fear) {
      var input = el("input", { type: "text", "data-bm-assureline": "", placeholder: "Or in your own words", maxlength: "200" });
      // own: the assurance was typed, so only that it was in the player's own words is recorded, never the words
      // The assurances are trust moves too: the first is a promise (will you), the second and fourth say what you'd do for it
      // (are you good), the third a pace you'll keep (can you); words of your own say what you'd do for it.
      function offer(t, own, ai) {
        if (!t) return;
        if (ai === 0) promise("return"); else if (ai === 2) pend("can", "pace"); else pend("good", "intent");
        show([el("h2", { text: V.title }), you(t), npc(V.assured[Math.min(round, V.assured.length - 1)]),
          row([btn("Ask again", function () { blockPoll(key, round, onYes, own ? "An assurance in your own words" : "You offered: " + t); }, { "data-bm-again": "" })])], "assured-" + key);
      }
      show([el("h2", { text: V.title }), npc(fear), guide("That makes sense of the wall. What can you offer it?"),
        el("div", { class: "bm-cards" }, V.assure.map(function (f, fi) { return btn(f[0], function () { offer(f[0], false, fi); }, { class: "bm-card", "data-bm-assure": String(fi) }); })),
        el("div", { class: "bm-line" }, [input, btn("Offer it", function () { offer(input.value.trim(), true); }, { "data-bm-offer": "" })])], "assure-" + key);
    }
    // While it holds back, its charge is asked for too (Wendell, 15 October 2026, on the Controller: "we want to have the
    // controllers charge go down even when they are blocked this is some of the best times that the resistance is moving and we
    // want players to be able to track what makes the controller give up its resistance"). Before it is asked again, the player
    // says how charged it is now; a drop eases as after any answer, and the charge is saved with what came just before it (why),
    // so the keeping step and the cave mouth can show what moved its resistance. Every voice gets this; the Controller asked for it.
    function blockPoll(key, round, onYes, why) {
      var cur = st.charge == null ? 7 : st.charge;
      var num = el("b", { class: "bm-chargenum", text: String(cur) });
      var range = el("input", { type: "range", min: "0", max: "10", step: "1", value: String(cur), "data-bm-range": "", "aria-label": "Charge, 0 to 10" });
      range.addEventListener("input", function () { num.textContent = range.value; setMeter(+range.value); });
      show([el("h2", { text: V.title }), guide(why + "."), guide("It's still holding back. Did that move it at all? How charged is " + V.name + " now?" + (st.place ? " (in your " + st.place.toLowerCase() + ")" : "")),
        el("div", { class: "bm-charge" }, [el("span", { text: "calm 0" }), range, el("span", { text: "10 full" })]), el("p", { class: "bm-chargeline" }, [num, document.createTextNode(" out of 10")]),
        row([btn("That's how it is", function () {
          var was = st.charge, v = +range.value, again = function () { permit(key, round + 1, onYes); };
          st.charge = v; st.charges.push({ after: "held-" + key, v: v, why: why, from: was }); setMeter(v);
          resolvePending(was != null ? was : st.prevCharge, v);
          if (was != null && v < was) return eased(was, v, again);
          again();
        }, { "data-bm-blockcharged": "" })])], "blockpoll-" + key);
      setMeter(cur);
    }
    // Leaving it at its post honours the refusal. Before the shift it waits; after it has spoken, it keeps the way shut.
    function leaveBtn(key) {
      if (key === "be") return btn("Stay on your own side of it", function () { var f = st.beStay; st.beStay = null; if (f) f(); }, { class: "bm-link", "data-bm-post": "be" });
      return btn("Leave it at its post for today", function () { keepsPost(key); }, { class: "bm-link", "data-bm-post": key });
    }
    function keepsPost(key) {
      if (key === "pass") {
        show([el("h2", { text: V.title }), npc("Thank you for not pushing."), guide(V.title + " keeps the way for now. What it said is still yours to keep, and you can come back and ask again another day."),
          row([btn("Go on", function () { keep(true); }, { "data-bm-next": "" })])], "post-" + key);
        return;
      }
      show([el("h2", { text: V.title }), npc("Thank you for not pushing."), guide("It stays at its post, and it will be here when you come back. Nothing is marked skipped."),
        row([btn("Walk back up", function () { st.fears.length ? keep(true, "waiting") : finish("waiting", [], true); }, { "data-bm-next": "" })])], "post-" + key);
    }
    // Walking into the voice's place is the seat shift. The self stays behind as a faint figure where the player stood; the
    // player takes the voice's colour and turns to face the way they came, which is the way the voice keeps watch (a choice).
    // The voice steps aside first, as it agreed to.
    function seatShift() {
      hide(); ring.style.display = "none"; st.cam = "voice";
      ghost = K.buildAvatar(THREE, "other"); seeThrough(ghost, 0.28); figureAt(ghost, S_SELF, 0, false); scene.add(ghost);
      var s0 = st.s, dm = daemonRow(V.daemon)[3];
      st.auto = true;
      tween(2600, function (k) {
        var e = ease(k); st.s = s0 + (S_VOICE - s0) * e; st.moving = k < 0.95;
        figureAt(voice, S_VOICE, -2.4 * clamp(k * 2, 0, 1), true);
        voice.traverse(function (m) { if (m.material) m.material.opacity = 1 - e; });
        avatar.userData.mat.color.setHex(0xb89aff).lerp(new THREE.Color(dm), e); avatar.userData.mat.emissive.copy(avatar.userData.mat.color);
      }, function () {
        st.auto = false; st.moving = false; voice.visible = false; st.turned = true;
        hint.textContent = "";
        tween(700, function () {}, function () { knowAsk(0); });
      });
    }
    // Talk it through (bmt-321-offer): the cave's full 3-2-1 with this voice. back: where Skip and a 3-2-1 with no new charge
    // return; then: where it goes after a charge was read. seat: opened from its seat, where it has already let the player stand.
    var SEAT_WHERE = { 3: "From its place, you look at it as if from outside.", 2: "You speak with it here, in its place.", 1: "You are standing where it stands.", check: "You are in its place, with it.", after: "You are still in its place.", paused: "You are in its place, and your words are kept." };
    function talkThrough(back, then, seat) {
      var cur = st.charge == null ? 7 : st.charge, t = st.t321;
      if (!t) t = st.t321 = { phase: "before", rounds: 1, msgs: [], voice: "you", draft: "", before: cur, after: cur };
      else { if (t.msgs.length) { t.rounds++; t.msgs.push({ divider: true, round: t.rounds }); } t.phase = "before"; t.paused = false; t.skipped = false; t.voice = "you"; t.before = cur; t.after = cur; }
      function draw() {
        var body = [];
        var title = K.talk321(t, { name: V.name, damaged: !!V.deep && !seat, skippable: true, redraw: draw, focus: function () { K.focusChat(modal); }, where: seat ? SEAT_WHERE : null,
          cards: function (ph, who) { return talkCards(V, ph, who); },
          beforeOne: function (go, stay) {
            if (seat || st.turned || st.perms.be) return go();
            st.beStay = stay; permit("be", 0, function () { st.beStay = null; go(); });
          },
          ask: function (b) {
            if (t.skipped) { b.push(guide("You can talk it through with " + V.name + " any time.")); b.push(row([btn("Back to " + V.name, back, { "data-bm-talkback": "" })])); return; }
            st.talked = (st.talked || 0) + 1; visit.did.push("talk");
            b.push(guide("You faced " + V.name + ", talked with it" + (t.msgs.some(function (m) { return m.phase === 1 && m.round === t.rounds; }) ? ", and spoke as it" : "") + ". Nothing you wrote leaves this page."));
            b.push(row([btn("Back to " + V.name, function () {
              var was = st.charge, v = t.after;
              st.charge = v; st.charges.push({ after: "321", v: v }); setMeter(v);
              resolvePending(was != null ? was : st.prevCharge, v);
              if (was != null && v < was) return eased(was, v, then);
              then();
            }, { "data-bm-talkdone": "" })]));
          } }, body);
        show([el("h2", { text: title })].concat(body), "talk-321");
        if (t.phase !== "before" && t.phase !== "ask" && t.phase !== "after" && t.phase !== "check") K.focusChat(modal);
      }
      draw();
    }
    // Who the voice works for, once the player has said (the boss question): the questions after it ask and offer by it.
    function qAsk(q) { return (q.byBoss && st.boss && q.byBoss[st.boss]) || q.ask; }
    function qCards(q) { return (q.cardsByBoss && st.boss && q.cardsByBoss[st.boss]) || q.cards; }
    function qReflect(q) {
      var r = (q.reflectByBoss && st.boss && q.reflectByBoss[st.boss]) || q.reflect;
      // The chain (board dq-boss-chain): when the boss named is a voice already heard, what it said of its own boss follows.
      var up = q.boss && st.boss && st.boss !== V.id && save.voices[st.boss], upV = VOICES.filter(function (x) { return x.id === st.boss; })[0];
      if (up && up.boss && upV) r += " And " + upV.name + " told you it answers to " + bossName(upV, up.boss) + ".";
      return r;
    }
    function askQ(i, lead) {
      var q = V.questions[i], picked = [], cardList = qCards(q);
      var cards = el("div", { class: "bm-cards" });
      // What it protects the self from may be what the player carries in (bms-protects-from): the spirits' names are cards too.
      var carried = q.id === "from" ? spirits.map(function (o) { return [o.name + "."]; }) : [];
      cardList.concat(carried).forEach(function (c, ci) {
        var b = el("button", { class: "bm-card", "data-bm-card": String(ci), "aria-pressed": "false", text: c[0], onclick: function () {
          if (q.multi) { var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on)); if (on) picked.push(c); else picked.splice(picked.indexOf(c), 1); doneBtn.disabled = !picked.length; }
          else { if (q.boss) st.boss = c[2] || null; answer(i, [c[0]], c[1] || null); }
        } });
        cards.appendChild(b);
      });
      var input = el("input", { type: "text", "data-bm-line": "", placeholder: "Or what it says, in its words", enterkeyhint: "done", maxlength: "200" });
      function say() {
        var t = input.value.trim(); if (!t) return; var lines = picked.map(function (c) { return c[0]; }).concat([t]);
        if (q.boss) { st.boss = heardBoss(t, V.id); return answer(i, lines, null); } // naming a boss is in voice, whoever it names
        answer(i, lines, firstOut(picked) || heard(t, V.id));
      }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); say(); } });
      var doneBtn = q.multi ? btn("That's all of it", function () { answer(i, picked.map(function (c) { return c[0]; }), firstOut(picked)); }, { "data-bm-done": "", disabled: "" }) : null;
      show([el("h2", { text: V.title }), lead ? guide(lead) : null, you(qAsk(q)), carried.length ? guide("You came in with " + (carried.length === 1 ? "a spirit" : carried.length + " spirits") + ". Might it be protecting you from what you carry?") : null, guide("What does " + V.name + " say?"), cards,
        el("div", { class: "bm-line" }, [input, btn("Say it", say, { "data-bm-say": "" })]),
        doneBtn ? row([doneBtn]) : null,
        row([btn("This doesn't sound like " + V.name, function () { secret("felt", i); }, { class: "bm-link", "data-bm-wrong": "" }),
          btn("Sit this one out", function () { next(i); }, { class: "bm-link", "data-bm-sitout": "" })])], "q-" + q.id);
    }
    function firstOut(cs) { for (var i = 0; i < cs.length; i++) if (cs[i][1]) return cs[i][1]; return null; }
    // The voice's answer is said back as its own words, then the guide answers it, and the next question follows from it.
    function answer(i, lines, out) {
      if (out) return secret(out, i);
      st.answers[V.questions[i].id] = lines;
      chargeAsk(i, "Does it feel any different? How charged is " + V.name + " now?");
    }
    function next(i) { st.answers[V.questions[i].id] = st.answers[V.questions[i].id] || null; charged(i, st.charge, true); } // sitting a question out moves on at the same charge
    // Standing in its place, speaking as it. Wendell, 12 October 2026, 21:15: "the 1 phase with the protector (and all the voices)
    // should be a bit longer and should have the option for the player to speak as the protector in their own words". So the seat
    // shift is now three turns as the voice, in the first person: who it is, what it sees from its post, and what it wants the self
    // to know. Each has a line for the player's own words as the voice; only the last also has the workshop's cards
    // (bm-cards-and-line), since the first two have no group answers to draw on. Any turn can be passed, and "Just look for a
    // while" leaves at once. Lines said as the voice are offered at the keeping step like its other lines (choices, all of them).
    function beTurns() {
      return [
        { id: "who", ask: "Speak as " + V.name + " now, in your own words. Who are you?", ph: "I am " + V.name + ", and I…" },
        { id: "see", ask: "From here, as " + V.name + ", what do you see?", ph: "From here I see…" },
        { id: "know", ask: V.know.ask, ph: "In its words: I want you to know…", cards: V.know.cards },
      ];
    }
    function knowAsk(n) {
      n = n || 0;
      var T = beTurns(), t = T[n], nextTurn = function () { if (n + 1 < T.length) knowAsk(n + 1); else close(); };
      var input = el("input", { type: "text", "data-bm-beline": t.id, placeholder: t.ph, maxlength: "200", enterkeyhint: "done", "aria-label": t.ask });
      var sayBtn = btn("Say it", function () { said(input.value.trim()); }, { "data-bm-besay": t.id });
      if (t.id === "know") { input.setAttribute("data-bm-knowline", ""); sayBtn.setAttribute("data-bm-knowsay", ""); }
      function said(v) { if (!v) return; st.be[t.id] = v; if (t.id === "know") st.know = v; nextTurn(); }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); said(input.value.trim()); } });
      var heardSoFar = T.slice(0, n).map(function (x) { return st.be[x.id]; }).filter(Boolean).map(function (l) { return npc(l); });
      show([el("p", { class: "bm-wavestep", text: "Speaking as " + V.name + " · " + (n + 1) + " of " + T.length }), el("h2", { text: V.title }),
        n === 0 ? guide(V.seat) : null].concat(heardSoFar, [guide(t.ask),
        t.cards ? el("div", { class: "bm-cards" }, t.cards.map(function (c, ci) { return btn(c[0], function () { said(c[0]); }, { class: "bm-card", "data-bm-know": String(ci) }); })) : null,
        el("div", { class: "bm-line" }, [input, sayBtn]),
        row([btn("Talk it through, from its seat (3-2-1)", function () { talkThrough(function () { knowAsk(n); }, function () { knowAsk(n); }, true); }, { "data-bm-seattalk": "" }, true)]),
        row([btn("Pass", nextTurn, { class: "bm-link", "data-bm-bepass": t.id }),
          btn("Just look for a while", function () { close(); }, { class: "bm-link", "data-bm-look": "" })])]), t.id === "know" ? "know" : "be-" + t.id);
    }

    // Secretly speaking (bm-dismiss-step-aside): a second figure shows behind the voice. The player names it, thanks it and
    // asks it to wait; it walks on ahead into the closed passage and waits by the wall there. The voice is asked again.
    function secret(tell, i) {
      var fig = translatorFigure(tell === "felt" ? "unknown" : tell);
      figureAt(fig, S_VOICE + 2.6, 1.8, true); scene.add(fig); st.secret = fig; figures.push(fig);
      var why = ((TRANSLATORS[tell] || {}).tell || "").replace("{name}", V.name);
      // whoever might have spoken, never the voice of this chamber itself
      var opts = ["ideas", "protector", "fixer", "controller", "skeptic", "unknown"].filter(function (id) { return id !== V.id; }).map(function (id) {
        return btn(TRANSLATORS[id].short, function () { named(id, i, fig); }, { "data-bm-name": id }, true);
      });
      show([el("h2", { text: "Someone else spoke" }), guide("Wait. That answer " + why + ". Another figure has come out behind " + V.name + "."),
        guide("Who was speaking just then?"), row(opts)], "secret");
    }
    function named(id, i, fig) {
      var T = TRANSLATORS[id];
      fig.userData.id = id; st.translators.push(id);
      show([el("h2", { text: "Someone else spoke" }), guide("Thank " + T.name + " for speaking up, and ask it to wait for its own turn. Nothing it said is lost."),
        row([btn("Thank you. Please wait; you'll be heard later.", function () { stepAside(fig, i); }, { "data-bm-thank": "" })])], "thank");
    }
    function stepAside(fig, i) {
      hide(); ring.style.display = "none";
      var spot = S_GATE + 14 + (st.waiting.length) * 6, s0 = S_VOICE + 2.6;
      if (st.waiting.indexOf(fig.userData.id) < 0) st.waiting.push(fig.userData.id);
      tween(2200, function (k) { var e = ease(k); figureAt(fig, s0 + (spot - s0) * e, 1.8 + (-WAIT_D - 1.8) * e, false); }, function () {
        fig.rotation.y += -Math.PI / 2; fig.userData.wait = true; st.secret = null;
        askQ(i, "Let me speak to " + V.name + " again.");
      });
    }

    // Declining is a full move (bm-decline): the voice steps to the wall and waits, the way opens, nothing is marked skipped.
    function decline() {
      hide(); voiceAside(function () { finish("waiting", []); });
    }
    function voiceAside(done) {
      voice.visible = true;
      var a0 = 0;
      tween(1600, function (k) { var e = ease(k); figureAt(voice, S_VOICE, a0 + W * 0.95 * e, true); voice.rotation.y += -Math.PI / 2 * e; voice.traverse(function (m) { if (m.material) m.material.opacity = Math.max(m.material.opacity, e); }); }, done);
      openGate();
    }
    function openGate() { st.gateGoal = 1; st.flash = 1; }

    function close() {
      show([el("h2", { text: V.title }), guide(V.thanks), row([btn("Step back out", stepOut, { "data-bm-out": "" })])], "thanks");
    }
    // The player walks back to where the self stood and takes its place again (always allowed: the self can take control
    // back). The voice comes back to its post, and the player asks its permission to walk on.
    function stepOut() {
      hide(); st.turned = false; st.cam = "behind"; st.auto = true;
      var s0 = st.s, m = avatar.userData.mat, c0 = m.color.clone();
      tween(2200, function (k) {
        var e = ease(k); st.s = s0 + (S_SELF - s0) * e; st.moving = k < 0.95; st.back = true;
        m.color.copy(c0).lerp(new THREE.Color(0xb89aff), e); m.emissive.copy(m.color);
        if (ghost) seeThrough(ghost, 0.28 * (1 - e));
      }, function () {
        st.auto = false; st.moving = false; st.back = false;
        if (ghost) { scene.remove(ghost); ghost = null; }
        voice.visible = true; figureAt(voice, S_VOICE, 0, true);
        tween(900, function (k) { voice.traverse(function (mm) { if (mm.material) mm.material.opacity = ease(k); }); }, function () {
          var passAsk = function () { permit("pass", 0, function () { voiceAside(function () { keep(); }); }, npc("Back at my post. So.")); };
          // Back in its own place, as promised: the voice sees the kept promise at a check-in.
          if (keepPromise("return")) return checkIn("You stepped back into your own place, and " + V.name + " has its post again.", passAsk);
          passAsk();
        });
      });
    }
    // Only lines the player keeps are stored (bm-cards-and-line).
    // blocked: the voice kept the way shut, so the save sends the player back to the mouth; status overrides "spoken".
    function keep(blocked, status) {
      var lines = [];
      V.questions.forEach(function (q) { (st.answers[q.id] || []).forEach(function (l) { lines.push({ q: q.id, line: l }); }); });
      ["who", "see"].forEach(function (k) { if (st.be[k]) lines.push({ q: "be-" + k, line: st.be[k] }); });
      if (st.know) lines.push({ q: "know", line: st.know });
      st.fears.forEach(function (f) { lines.push({ q: "fear", line: f }); });
      st.waveKeep = st.waves.map(function () { return false; });
      var waveCards = st.waves.map(function (w, wi) {
        var b = el("button", { class: "bm-card", "data-bm-keepwave": String(wi), "aria-pressed": "false", text: waveLine(w), onclick: function () { st.waveKeep[wi] = !st.waveKeep[wi]; b.setAttribute("aria-pressed", String(st.waveKeep[wi])); } });
        return b;
      });
      var moved = movedLines(st.charges);
      var movedBox = moved.length ? [guide("What moved it while it held back. This is saved with its charge:"), el("ul", { "data-bm-moved": "" }, moved.map(function (m) { return el("li", { text: m }); }))] : [];
      var waveBox = st.waves.length ? [guide("Your W.A.V.E.s are saved either way, on this device. Tap one to keep its feeling word with it."), el("div", { class: "bm-cards" }, waveCards)] : [];
      if (!lines.length && !st.waves.length && !moved.length) return finish("waiting", [], blocked); // every question sat out: the voice has not spoken yet, and waits
      var keepOn = lines.map(function () { return false; });
      var list = el("div", { class: "bm-cards" }, lines.map(function (l, li) {
        var b = el("button", { class: "bm-card", "data-bm-keep": String(li), "aria-pressed": "false", text: l.line, onclick: function () { keepOn[li] = !keepOn[li]; b.setAttribute("aria-pressed", String(keepOn[li])); } });
        return b;
      }));
      show([el("h2", { text: "What " + V.name + " said" })].concat(lines.length ? [guide("Tap the lines you want to keep. The rest are let go, and only what you keep is saved, on this device."), list] : [], movedBox, waveBox, [
        row([btn(blocked ? "Save" : "Save and walk on", function () { finish(status || (Object.keys(st.answers).some(function (k) { return st.answers[k]; }) ? "spoken" : "waiting"), lines.filter(function (l, li) { return keepOn[li]; }), blocked); }, { "data-bm-save": "" })])]), "keep");
    }
    // Saving at every chamber (bm-session): the voice's record, the translators waiting, and the place to come back to.
    function finish(status, kept, blocked) {
      var s = readSave();
      // Every W.A.V.E. is one entry, added to the ones from earlier sittings; its feeling word only if kept (bmw-record).
      var prevWaves = (s.voices[V.id] && s.voices[V.id].waves) || [], wk = st.waveKeep || [];
      var waves = prevWaves.concat(st.waves.map(function (w, wi) { var o = {}; for (var k in w) o[k] = w[k]; if (!wk[wi]) o.word = null; return o; }));
      // A voice met again on a later visit (bmt-ask-again) adds to what it said before: its kept lines stay, and declining or
      // sitting everything out today leaves it as spoken if it has spoken before.
      var prev = s.voices[V.id] || null, was = prev && prev.status === "spoken";
      var allKept = (prev && prev.kept || []).concat(kept.filter(function (k) { return !(prev && prev.kept || []).some(function (p) { return p.q === k.q && p.line === k.line; }); }));
      s.voices[V.id] = { status: was ? "spoken" : status, kept: allKept, place: st.place || (prev && prev.place) || null, charges: st.charges.length || !prev ? st.charges.slice() : prev.charges || [], waves: waves, trust: st.trust, savedAt: new Date().toISOString() };
      if (prev && prev.spirit) s.voices[V.id].spirit = prev.spirit; // the meeting spirit (meetSave)
      var talked = (prev && prev.talked || 0) + (st.talked || 0); if (talked) s.voices[V.id].talked = talked; // how many 3-2-1s, never the words
      if (blocked) s.voices[V.id].keepsWay = true; // it held the way shut; the next sitting meets it again at its post
      var boss = st.boss || (prev && prev.boss); if (boss) s.voices[V.id].boss = boss; // who the player said it works for (the boss question)
      s.waiting = st.waiting.slice(); s.at = blocked ? "mouth" : "hall2";
      var ok = writeSave(s);
      hide();
      if (blocked) { leave(); return; }
      st.phase = "hall2";
      hint.textContent = status === "waiting" ? V.title + " waits by the wall. The way is open." : (ok ? "Saved. The way is open." : "The way is open. (This browser would not save.)");
      hint.setAttribute("data-bm-status", status);
    }
    // ---- the approach check-in (pass daemon-meeting1, build 4) ------------------------------------------------------------------
    // In each hallway, before the shut mouth, up to four asks, each skippable, in this order: the body (one card, two rows: what it
    // feels like, in the texture words, and what it is doing, in plain movement words, never a daemon), the feeling (the five, or own
    // words, or no word yet), whether it is faint, too much or clear (veiled, flooding, clear), and, only when it is not faint,
    // whether it sits all right (the state band). Each answer shows at once: the mouth's light takes the element's colour and
    // the meeting spirit forms from the layers so far. Skip all and walking on always pass; it is asked every visit. Saved as
    // voices[id].approach = { body, texture, feeling, veil, state, at } plus merged when the movement belongs to another voice, no
    // words, no numbers (dmt-approach-checkin, dmt-body-blockers, dmt-two-axes, dmt-same-order). The spirit's family is always the
    // chamber's daemon; a merged one wears the other daemon's gas and says "Something of another voice is in this one", unnamed.
    var MOVES = [["bracing", "Bracing"], ["gripping", "Gripping"], ["pulling-back", "Pulling back"], ["leaning-in", "Leaning in"], ["sinking", "Sinking"], ["curling-in", "Curling in"], ["flinging-open", "Flinging open"]];
    // Whose movement each is (book order, dmt-body-blockers): a movement that belongs to another voice marks the spirit as merged.
    var MOVE_OF = { bracing: "protector", gripping: "controller", "pulling-back": "skeptic", "leaning-in": "fixer", sinking: "victim", "curling-in": "damaged-self", "flinging-open": "emotional-body" };
    var SENSES = [["constriction", "Tightness"], ["tension", "Tension"], ["strength", "Strength"], ["numbness", "Numbness"], ["free", "Moving freely"], ["other", "Something else"]];
    var VEILS = [["veiled", "Faint, or far away"], ["flooding", "Too much"], ["clear", "Clear"]];
    var STATES = [["settled", "It sits all right"], ["neither", "Neither"], ["wants", "It wants something"]];
    var appSpirit = null;
    function approachShow(a) {
      // The mouth's light takes the element's colour and the meeting spirit forms from the layers so far (dmt-spirit-from-answers).
      var hex = a.element ? K.spiritHex(a.element) : mouthCol;
      if (a.element) { mouthCol = hex; mouthLight.color.setHex(hex); mouthGlow.material.color.setHex(hex); }
      if (!a.body && !a.texture && !a.element && !a.veil && !a.state) return;
      var tx = a.texture && a.texture !== "free" ? K.TEXTURES.filter(function (t) { return t[0] === a.texture; })[0] : null;
      if (!a.element && tx) hex = tx[2]; // a sensation tints the spirit until a feeling is named
      var gasId = a.merged || V.id, grow = daemonRow(gasId), gas = grow && grow[3] != null ? grow[3] : hex; // the chamber's gas: the voice's own, or the other's if merged
      if (!appSpirit) {
        var g = K.buildSpirit(THREE, "meeting spirit", hex); g.userData.label.visible = false; var ap = at(route, route.sEnd + 1.6); g.position.set(ap.x, floor(ap) + 1.5, ap.z); scene.add(g);
        appSpirit = { g: g, light: new THREE.PointLight(hex, 0.5, K.LAMP.reach * 0.5, K.LAMP.decay), y: g.position.y, wants: false, still: false }; appSpirit.light.position.copy(g.position); scene.add(appSpirit.light);
      }
      var g2 = appSpirit.g;
      g2.userData.color.setHex(gas); g2.userData.orb.material.color.setHex(hex); appSpirit.light.color.setHex(hex);
      g2.userData.level = a.veil === "veiled" ? 0.15 : a.veil === "flooding" ? 0.95 : 0.45; // polarity: veiled is dim, flooding is bright
      g2.scale.setScalar(a.veil === "flooding" ? 1.35 : a.veil === "veiled" ? 0.8 : 1);
      appSpirit.wants = a.state === "wants"; appSpirit.still = a.state === "settled"; // state band: settled holds still, wanting reaches
      g2.visible = true;
      api.approachSpirit = { body: a.body, texture: a.texture, element: a.element, veil: a.veil, state: a.state, family: V.id, merged: a.merged || null };
    }
    function approach(done) {
      var a = { body: null, texture: null, element: null, veil: null, state: null, feeling: null, merged: null }, asked = 0;
      function finishApproach() {
        if (asked && (a.body || a.texture || a.feeling || a.veil || a.state)) {
          try {
            var s = readSave(), r = s.voices[V.id];
            if (r) { r.approach = { body: a.body, texture: a.texture, feeling: a.feeling, veil: a.veil, state: a.state, at: stamp() }; if (a.merged) r.approach.merged = a.merged; writeSave(s); }
          } catch (e) { /* this browser would not save */ }
        }
        hide(); done();
      }
      function skipAll() { finishApproach(); }
      // A movement that belongs to another voice is kept as merged, and said without a name (dmt-body-blockers).
      function mergedNote() { return a.merged ? el("p", { class: "bm-guide", "data-bm-merged": a.merged, text: "Something of another voice is in this one." }) : null; }
      function ask(tag, prompt, cards, extra, pick) {
        asked++;
        show([el("h2", { text: "Before the way on" }), guide(prompt), mergedNote(), el("div", { class: "bm-cards" }, cards.map(function (c) { return btn(c[1], function () { pick(c[0]); }, { class: "bm-card", "data-bm-ap": c[0] }); })), extra || null,
          row([btn("Skip this", function () { pick(null); }, { class: "bm-link", "data-bm-apskip": "" }), btn("Skip all, walk on", skipAll, { class: "bm-link", "data-bm-apskipall": "" })])], tag);
      }
      // One card, two rows (dmt-body-blockers): what it feels like, and what the body is doing; either, both or neither.
      function body() {
        asked++;
        var rows = {};
        function pickRow(key, label, items, attr) {
          var box = el("div", { class: "bm-cards", "data-bm-aprow": key });
          items.forEach(function (c) {
            var b = btn(c[1], function () {
              rows[key] = rows[key] === c[0] ? null : c[0];
              Array.prototype.forEach.call(box.childNodes, function (n) { n.classList.toggle("on", n.getAttribute(attr) === rows[key]); n.setAttribute("aria-pressed", n.getAttribute(attr) === rows[key] ? "true" : "false"); });
            }, { class: "bm-card", "aria-pressed": "false" }); b.setAttribute(attr, c[0]); box.appendChild(b);
          });
          return [guide(label), box];
        }
        function go() {
          a.texture = rows.texture || null; a.body = rows.move || null;
          a.merged = a.body && MOVE_OF[a.body] !== V.id ? MOVE_OF[a.body] : null;
          approachShow(a); feeling();
        }
        show([el("h2", { text: "Before the way on" }), guide("Before you go on, notice your body.")].concat(pickRow("texture", "What does it feel like?", SENSES, "data-bm-aptex"), pickRow("move", "What is your body doing?", MOVES, "data-bm-ap"),
          [row([btn("That's it", go, { "data-bm-apdone": "" }), btn("Skip all, walk on", skipAll, { class: "bm-link", "data-bm-apskipall": "" })])]), "approach-body");
      }
      function feeling() {
        var input = el("input", { type: "text", "data-bm-apline": "", placeholder: "Or in your own words", maxlength: "60", enterkeyhint: "done", "aria-label": "In your own words" });
        function own() { if (input.value.trim()) { a.feeling = "own"; approachShow(a); veil(); } }
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); own(); } });
        ask("approach-feel", "And the feeling, if there is one?", ELEMENTS.map(function (e) { return [e[0], e[2].charAt(0).toUpperCase() + e[2].slice(1) + " (" + e[1] + ")"]; }).concat([["none", NO_WORD]]),
          el("div", { class: "bm-line" }, [input, btn("That's it", own, { "data-bm-apsay": "" })]), function (v) {
            a.feeling = v; a.element = v && v !== "none" ? v : null; approachShow(a); veil();
          });
      }
      function veil() { ask("approach-veil", "How near is it?", VEILS, null, function (v) { a.veil = v; approachShow(a); if (v === "veiled") finishApproach(); else state(); }); }
      function state() { ask("approach-state", "Where it is, how does it sit?", STATES, null, function (v) { a.state = v; approachShow(a); finishApproach(); }); }
      body();
    }
    function theEnd() {
      st.phase = "end";
      if (!st.approached) { st.approached = true; return approach(theEnd); }
      var rest = btn("Rest here", function () { hide(); st.phase = "rest"; hint.textContent = "Resting. Tap Self to walk back up."; }, { "data-bm-rest": "" }, true);
      if (NEXT && NEXT.built && !NEXT.centre) {
        show([el("h2", { text: NEXT.title }), guide("The mouth of the next chamber is shut ahead, breathing, with a light in it. Its chamber is open."),
          guide("Your place is saved here. You can walk on into its chamber, rest, or walk back up and out."),
          row([btn("Walk on, to " + NEXT.title.replace(/^The /, "the "), onward, { "data-bm-onward": "" })]),
          row([btn("Walk back up", function () { leave(); }, { "data-bm-leave": "" }, true), rest])], "end");
        return;
      }
      if (NEXT.centre) {
        // At the mouth of the centre the allied spirits vouch together (bmt-spirits-vouch), each in its own voice's terms.
        var A = allies().concat(trusted(st.trust, V.id) && st.trust.ally ? [V.id] : []);
        show([el("h2", { text: NEXT.title }), guide("This is the end of the daemon path. Past the last chamber the way opens toward the centre, and the vulnerable child waits there, with the place for the self beside it."),
          A.length ? guide("At the mouth of the centre, your spirits vouch for you together:") : null].concat(A.map(function (id) { return el("p", { class: "bm-guide bm-trustsaw", "data-bm-vouchall": id, text: TRUST[id].vouch }); }), [
          guide("Your place is saved here. You can walk on into the centre, rest, or walk back up and out."),
          row([btn("Walk on, into the centre", toCentre, { "data-bm-tocentre": "" })]),
          row([btn("Walk back up", function () { leave(); }, { "data-bm-leave": "" }, true), rest])]), "end");
        return;
      }
      show([el("h2", { text: NEXT.title }), guide("The mouth of the next chamber is shut ahead, breathing, with a light in it. Its chamber opens in the next build."),
        guide("Your place is saved here. You can rest, or walk back up and out."),
        row([btn("Walk back up", function () { leave(); }, { "data-bm-leave": "" }), rest])], "end");
    }
    // ---- the centre: the vulnerable child (board dp-centre, dp-centre-asked) ------------------------------------------------
    // The shut mouth opens and the player walks in to stand beside the child. The voices met on the way come in as spirits, in
    // their own colours, and stand around it (bms-spirits-follow); the spirits walking with the player keep following.
    var cen = null;
    function toCentre() {
      hide(); st.phase = "centre"; st.auto = true; ring.style.display = "none";
      var sv = readSave(), sC = route.sEnd + 4, s0 = st.s, m = nextFig.userData.mat; nextFig.visible = true;
      cen = { s: sC, said: {}, voices: [], lat: 0 };
      PATH.forEach(function (id, j) {
        if (!sv.voices[id]) return;
        var vv = VOICES.filter(function (x) { return x.id === id; })[0], row0 = daemonRow(id);
        var g = K.buildSpirit(THREE, vv ? vv.title : id, row0 ? row0[3] : 0x9a9aa8);
        var a = at(route, Math.max(0, st.s - 2)); g.position.set(a.x, floor(a) + 1.7, a.z); scene.add(g);
        cen.voices.push({ id: id, g: g, near: false });
      });
      tween(3200, function (k) {
        var e = ease(k); st.endOpen = e; tube.dirty = true; st.s = s0 + (sC - 0.4 - s0) * e; cen.lat = 1.2 * e * e; st.moving = k < 0.95;
        seeThrough(nextFig, 0.55 + 0.45 * e); m.emissiveIntensity = 0.35 + 0.25 * e;
      }, function () { st.auto = false; st.moving = false; centreArrive(); });
    }
    function child(t) { return el("p", { class: "bm-npc" }, [el("b", { text: "The child: " }), document.createTextNode(t)]); }
    function metNames() { return cen.voices.map(function (o) { var vv = VOICES.filter(function (x) { return x.id === o.id; })[0]; return vv ? vv.name : o.id; }); }
    function centreArrive() {
      var names = metNames();
      show([el("h2", { text: CENTRE.title }), guide(CENTRE.arrive),
        names.length ? guide("The voices you met on the way are here with you, as spirits: " + names.join(", ").replace(/, ([^,]*)$/, names.length > 2 ? ", and $1" : " and $1") + ".") : null,
        guide(CENTRE.seen),
        row([btn("Be with it", centreRest, { "data-bm-centre": "be" }), btn("Ask it, gently", function () { childQ(0); }, { "data-bm-centre": "ask" }, true)])], "centre");
    }
    function childQ(i, lead) {
      var Q = centreQuestions(); if (i >= Q.length) return centreRest();
      var q = Q[i], picked = [];
      var list = (q.byVoice ? cen.voices.filter(function (o) { return q.byVoice[o.id]; }).map(function (o) { return [q.byVoice[o.id], o.id]; }) : []).concat(q.cards);
      var doneBtn = q.multi ? btn("That's all of it", function () { said(picked.map(function (c) { return c[0]; }), picked); }, { "data-bm-childdone": "", disabled: "" }) : null;
      var cards = el("div", { class: "bm-cards" }, list.map(function (c, ci) {
        var b = btn(c[0], function () {
          if (!q.multi) return said([c[0]], [c]);
          var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on));
          if (on) picked.push(c); else picked.splice(picked.indexOf(c), 1); doneBtn.disabled = !picked.length;
        }, { class: "bm-card", "data-bm-childcard": String(ci), "aria-pressed": "false" });
        return b;
      }));
      var input = el("input", { type: "text", "data-bm-childline": "", placeholder: "Or what it says, in its words", enterkeyhint: "done", maxlength: "200" });
      function say() { var t = input.value.trim(); if (t) said(picked.map(function (c) { return c[0]; }).concat([t]), picked); }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); say(); } });
      // A voice the child names as in its way comes closer to it.
      function said(lines, cs) {
        st.child[q.id] = lines;
        cs.forEach(function (c) { cen.voices.forEach(function (o) { if (o.id === c[1]) o.near = true; }); });
        childQ(i + 1, [child(lines.join(" ")), guide(q.reflect)]);
      }
      show([el("p", { class: "bm-wavestep", text: "Asking gently · " + (i + 1) + " of " + Q.length }), el("h2", { text: CENTRE.title })].concat(lead || [], [
        you(q.ask), guide("Let it answer in its own time. What does the child say?"), cards,
        el("div", { class: "bm-line" }, [input, btn("Say it", say, { "data-bm-childsay": "" })]),
        doneBtn ? row([doneBtn]) : null,
        row([btn("Let this one go", function () { childQ(i + 1); }, { class: "bm-link", "data-bm-childquiet": "" }),
          btn("That's enough for now", centreRest, { class: "bm-link", "data-bm-childenough": "" })])]), "child-" + q.id);
    }
    // Only lines the player keeps are stored, as in the chambers (bm-cards-and-line).
    function centreRest() {
      var lines = [];
      centreQuestions().forEach(function (q) { (st.child[q.id] || []).forEach(function (l) { lines.push({ q: q.id, line: l }); }); });
      var keepOn = lines.map(function () { return false; });
      var list = el("div", { class: "bm-cards" }, lines.map(function (l, li) {
        var b = el("button", { class: "bm-card", "data-bm-childkeep": String(li), "aria-pressed": "false", text: l.line, onclick: function () { keepOn[li] = !keepOn[li]; b.setAttribute("aria-pressed", String(keepOn[li])); } });
        return b;
      }));
      show([el("h2", { text: "With the child" }), guide(CENTRE.rest)].concat(lines.length ? [guide("Tap what the child said that you want to keep. The rest is let go, and only what you keep is saved, on this device."), list] : [], [
        guide(CENTRE.beyond),
        row([btn("Save, and stay a while", function () { saveCentre(lines.length ? "spoken" : "seen", lines.filter(function (l, li) { return keepOn[li]; })); }, { "data-bm-centresave": "" })])]), "centre-rest");
    }
    function saveCentre(status, kept) {
      var s = readSave(); s.centre = { status: status, kept: kept, savedAt: new Date().toISOString() };
      var ok = writeSave(s);
      var rest = btn("Rest here", function () { hide(); st.phase = "rest"; hint.textContent = "Resting with the child. Tap Self to walk back up."; }, { "data-bm-rest": "" }, true);
      show([el("h2", { text: CENTRE.title }), guide(ok ? "Saved, on this device." : "This browser would not save."), guide("You can rest here with the child, or walk back up and out."),
        row([btn("Walk back up", function () { leave(); }, { "data-bm-leave": "" }), rest])], "centre-end");
    }
    // Into the next chamber: the save moves on to it, the spirits walking with the player come along, and the cave is built
    // again around the next voice from its first hallway.
    function onward() {
      var s = readSave(); s.chamber = C + 1; s.at = "mouth"; writeSave(s);
      carry = spirits.filter(function (o) { return !o.ally && !o.meet; }).map(function (o) { return { name: o.name, element: o.element, lighter: !!o.lighter }; }); // allies come back from the save
      hide(); fade.style.opacity = 1;
      setTimeout(function () { stopMouthSound(); window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); cancelAnimationFrame(running); window.removeEventListener("resize", size); renderer.dispose(); wrap.remove(); api.state = null; play(THREE, "hall1"); }, 520);
    }
    // At the mouth the player chooses, for each spirit, to keep it for next time or let it go (bms-spirits-after = choose). What
    // is kept is its name and element, on this device.
    function leave() {
      if (st.turned) breakReturn(); // walking out from the voice's place, before stepping back into one's own
      if (!st.rited) return rite();
      var own = spirits.filter(function (o) { return !o.ally && !o.meet; }); // allies and meeting spirits come back from their voice's record
      if (!own.length) { var s0 = readSave(); if (s0.spirits && s0.spirits.length) { s0.spirits = []; writeSave(s0); } return leaveNow(); }
      var keepIt = own.map(function () { return true; });
      show([el("h2", { text: "At the cave mouth" }), guide("These came out with you. Keep each one to come back in with you next time, or let it go here. What is kept is its name and element, on this device."),
        el("div", { class: "bm-cards" }, own.map(function (o, oi) {
          var b = el("button", { class: "bm-card", "data-bm-mouthspirit": String(oi), "aria-pressed": "true", text: "Keep " + spiritLabel(o), onclick: function () {
            keepIt[oi] = !keepIt[oi]; b.setAttribute("aria-pressed", String(keepIt[oi])); b.textContent = (keepIt[oi] ? "Keep " : "Let go of ") + spiritLabel(o);
          } });
          return b;
        })),
        row([btn("Walk out", function () {
          var s = readSave(); s.spirits = own.filter(function (o, oi) { return keepIt[oi]; }).map(function (o) { return o.lighter ? { name: o.name, element: o.element, lighter: true } : { name: o.name, element: o.element }; });
          writeSave(s); leaveNow();
        }, { "data-bm-walkout": "" })])], "mouth-spirits");
    }
    // The return rite at the mouth, skippable (bmt-return): thank the voices, take one breath, and go back out with one plain line
    // naming the move practised. A facilitator holds the return; this holds it when nobody else does.
    function rite() {
      var skip = function () { st.rited = true; leave(); };
      var names = PATH.filter(function (id) { return visit.met.indexOf(id) >= 0; }).map(function (id) { return (VOICES.filter(function (x) { return x.id === id; })[0] || {}).name; }).filter(Boolean);
      var skipBtn = btn("Skip, and walk out", skip, { class: "bm-link", "data-bm-riteskip": "" });
      show([el("h2", { text: "Before you go" }), guide("Thank the voices you met today" + (names.length ? ": " + names.join(", ").replace(/, ([^,]*)$/, names.length > 2 ? ", and $1" : " and $1") : "") + "."),
        row([btn("Thank you, all of you", riteBreath, { "data-bm-ritethanks": "" })]), row([skipBtn])], "rite");
      function riteBreath() {
        var go = btn("I took a breath", riteLast, { "data-bm-ritebreath": "", disabled: "" }), cue = el("p", { class: "bm-breath", text: "Breathe in…" });
        show([el("h2", { text: "One breath" }), guide("Take one breath here at the mouth before you go."), orb(), cue, row([go]), row([skipBtn])], "rite-breath");
        tween(K.BREATH.inS * 1000, function () {}, function () { cue.textContent = "…and out"; tween(K.BREATH.outS * 1000, function () {}, function () { cue.textContent = "One breath."; go.removeAttribute("disabled"); }); });
      }
      function riteLast() {
        var d = visit.did, k = d.length ? d[d.length - 1] : null;
        var move = k ? PRACTISED[k] : names.length ? "asking a part of you for permission before you speak for it" : "walking in, and back out when you chose";
        show([el("h2", { text: "Back to your day" }), el("p", { class: "bm-guide", "data-bm-ritemove": "", text: "The move you practised today: " + move + "." }),
          guide(fromRoom ? "The WAVE room is just through the mouth." : "You can use it out there too."),
          row([btn(fromRoom ? "Go back to the WAVE room" : "Walk out", function () { st.rited = true; st.home = !!fromRoom; leave(); }, { "data-bm-ritego": "" })])], "rite-move");
      }
    }
    function leaveNow() {
      fade.style.opacity = 1;
      setTimeout(function () { stopMouthSound(); window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); cancelAnimationFrame(running); window.removeEventListener("resize", size); renderer.dispose(); wrap.remove(); api.state = null; if (st.home && fromRoom) goHome(); else mouth(); }, 520);
    }

    // ---- the frame ------------------------------------------------------------------------------
    // A charge being worked, in a sitting or a W.A.V.E.: grey until named, then its element's colour; larger and brighter by the Allow
    // sliders; duller once validated; rise and fade lift it and let it go. On the voice, the glow sits on the voice instead.
    function drawCharge(C, onVoice, lit, dt, still) {
      if (onVoice) C.g.position.set(voice.position.x, voice.position.y, voice.position.z);
      else if (C.near) { var na = side(Math.min(route.len - 1, st.s + 1.6 + 6 * C.come), 1.5); C.g.position.set(na.x, floor(na) + 0.45 + (C.rise || 0), na.z); } // low and to the side, so it shows under the W.A.V.E.'s panel
      else { var ba = at(route, Math.min(route.len - 1, st.s + 3.2 + 7 * C.come)); C.g.position.set(ba.x, floor(ba) + 0.9 + (C.rise || 0), ba.z); }
      var bc = tmpC.setHex(C.element ? colorOf(C.element) : 0x9a9aa8), fd = C.fade == null ? 1 : C.fade;
      if (C.g.userData.body) {
        var bm = C.g.userData.body.material; bm.color.lerp(bc, Math.min(1, dt * 3)); bm.emissive.copy(bm.color); bm.opacity = 0.85 * fd;
        var gs = 1 + (C.allowed ? C.allow.grow / 10 : 0); C.g.userData.body.scale.lerp(new THREE.Vector3(gs, gs, gs), Math.min(1, dt * 2));
      }
      K.stepAura(C.g.userData.aura, bc, (lit ? (C.allow.bright / 10) * (1 - C.dull) : 0.12) * fd, dt, still);
      if (fd < 1) { var au = C.g.userData.aura.userData; au.halo.material.opacity *= fd; au.sparks.material.opacity *= fd; }
    }
    var br = { b: 0.5, t0: performance.now() / 1000 }, camPos = new THREE.Vector3(), aim = new THREE.Vector3(), tmpC = new THREE.Color(), tmpV = new THREE.Vector3();
    function frame(now) {
      running = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      // a tween's done may start another tween, so the list is swapped out before the round runs
      var round = tweens; tweens = [];
      round.forEach(function (t) { var k = clamp((now - t.t0) / t.ms, 0, 1); t.fn(k); if (k >= 1) { if (t.done) t.done(); } else tweens.push(t); });
      // the breath: the Cave of Lessons' own 4 s in and 6 s out, breathing the walls
      var BR = K.BREATH, tm = (now / 1000 - br.t0) % (BR.inS + BR.outS), u;
      if (tm < BR.inS) { u = tm / BR.inS; br.b = 0.5 - 0.5 * Math.cos(Math.PI * u); } else { u = (tm - BR.inS) / BR.outS; br.b = 0.5 + 0.5 * Math.cos(Math.PI * u); }
      var g0 = st.gate; st.gate += (st.gateGoal - st.gate) * Math.min(1, dt * 1.6); if (Math.abs(st.gate - g0) > 1e-4) tube.dirty = true;
      tube.update(1 + 0.07 * (br.b - 0.5));
      st.flash = Math.max(0, st.flash - dt / 1.4);
      var walkable = !st.modal && !st.auto && (st.phase === "hall1" || st.phase === "hall2"); stickPad.style.display = runBtn.style.display = walkable ? "" : "none";
      // the walk: free inside the walls, stopped at the thresholds
      var wdir = null;
      if (!st.auto && !st.modal && (st.phase === "hall1" || st.phase === "hall2")) {
        var w = walkInput(), goal = st.phase === "hall1" ? S_SELF : route.sEnd, lo = st.phase === "hall1" ? 1 : S_GATE + 1;
        if (w) {
          var run = st.run || keys.Shift, sp = WALK * (run ? RUN_K : 1) * st.speed * w.m, s1 = clamp(st.s + w.along * sp * dt, lo, goal);
          var lim = 0.5 * W * route.openAt(s1), l1 = clamp(st.lat + w.side * sp * dt, -lim, lim);
          st.moving = Math.abs(s1 - st.s) + Math.abs(l1 - st.lat) > 1e-5; st.s = s1; st.lat = l1; st.pace = run ? RUN_K : 1; wdir = w;
          if (st.s >= goal - 1e-3) { st.moving = false; st.held = false; stickUp(); Object.keys(keys).forEach(function (k) { delete keys[k]; }); if (st.phase === "hall1") arrive(); else theEnd(); }
        } else st.moving = false;
      } else if (!st.auto) st.moving = false;
      if (st.phase !== "hall1" && st.phase !== "hall2") st.lat *= 1 - Math.min(1, dt * 3);
      if (st.moving) st.clk += dt * st.speed * (st.pace || 1);
      var a = at(route, st.s), fl = floor(a);
      K.loosenAvatar(avatar, 0.5, br.b);
      K.poseAvatar(avatar, st.clk, st.moving, dt, br.b, WALK / K.STEPS_PER_S, false);
      var pa = side(st.s, st.lat); avatar.position.set(pa.x, floor(pa) + 0.02, pa.z);
      if (cen) { var ab = side(st.s, cen.lat); avatar.position.set(ab.x, floor(ab) + 0.02, ab.z); } // the self's place, beside the child
      if (wdir && st.moving) { var fy = Math.atan2(wdir.along * a.fx - wdir.side * a.fz, wdir.along * a.fz + wdir.side * a.fx), dy = fy - (st.yaw == null ? fy : st.yaw); st.yaw = (st.yaw == null ? fy : st.yaw) + Math.atan2(Math.sin(dy), Math.cos(dy)) * Math.min(1, dt * 10); }
      else if (st.yaw != null) { var d0 = K.yawFacing(a) - st.yaw; st.yaw += Math.atan2(Math.sin(d0), Math.cos(d0)) * Math.min(1, dt * 6); }
      var face = (st.phase === "hall1" || st.phase === "hall2") && st.yaw != null ? st.yaw : K.yawFacing(a) + (st.turned || st.back ? Math.PI : 0); avatar.rotation.y = face;
      var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches, SI = st.sit;
      if (SI) {
        avatar.position.y -= 0.75 * SI.k; avatar.scale.y = 1 - 0.3 * SI.k;
        drawCharge(SI, SI.whom === "voice", SI.texture || SI.element || SI.whom === "voice", dt, still);
      } else avatar.scale.y = 1;
      if (wv && wv.B && wv.B.g.parent) { wv.B.g.visible = !SI; drawCharge(wv.B, false, wv.B.named, dt, still); } // a sitting from a block shows its own
      var ob = modal.querySelector("[data-bm-orb]");
      if (ob) {
        var BT = K.BREATH; ob._t = (ob._t + dt * st.speed) % (BT.inS + BT.outS);
        var inn = ob._t < BT.inS, ob_b = inn ? 0.5 - 0.5 * Math.cos(Math.PI * ob._t / BT.inS) : 0.5 + 0.5 * Math.cos(Math.PI * (ob._t - BT.inS) / BT.outS);
        ob.style.transform = "scale(" + (still ? 0.8 : 0.55 + 0.45 * ob_b).toFixed(3) + ")";
        if (ob.textContent !== (inn ? "in" : "out")) ob.textContent = inn ? "in" : "out";
        ob.setAttribute("data-bm-orb", inn ? "in" : "out");
      }
      if (appSpirit) { var ag = appSpirit.g; ag.position.y = appSpirit.y + (still || appSpirit.still ? 0 : (appSpirit.wants ? 0.22 : 0.1) * Math.sin(now / 700)); K.stepAura(ag.userData.aura, ag.userData.color, ag.userData.level, dt, still); }
      K.followSpirits(THREE, spirits, function (j) { var sa = side(Math.max(0.5, st.s - 2.2 - 1.6 * j), j === 0 ? 0.9 : j === 1 ? -1.1 : 0.2); return { x: sa.x, y: floor(sa) + 1.7, z: sa.z }; }, dt, now, still);
      if (cen) cen.voices.forEach(function (o, j) { // around the child, beyond it and to both sides; one named as in its way stands closer
        var n = cen.voices.length, ang = (n === 1 ? 0 : -1.75 + 3.5 * j / (n - 1)), r = o.near ? 1.5 : 2.6, ca = side(cen.s + r * Math.cos(ang), r * Math.sin(ang));
        tmpV.set(ca.x, floor(ca) + 1.5 + (still ? 0 : 0.15 * Math.sin(now / 800 + j * 1.7)), ca.z); o.g.position.lerp(tmpV, Math.min(1, dt * 1.6));
        K.stepAura(o.g.userData.aura, o.g.userData.color, o.near ? 0.7 : 0.45, dt, still);
      });
      spirits.forEach(function (o) { o.light.visible = o.g.visible && !o.hidden; o.light.position.set(o.g.position.x, o.g.position.y + 1.1, o.g.position.z); });
      var stance = 1 + 0.04 * Math.min(spirits.length, 3); voice.scale.x = voice.scale.z = stance; // it squares up to what you bring
      sitBtn.disabled = !canSit();
      trustBtn.style.display = (st.phase === "hall1" || st.phase === "chamber") && !cen ? "" : "none"; trustBtn.disabled = !canTrust();
      voice.userData.stance = stanceOf(st.trust, V.id, st); // for the daemon bodies: how it stands toward the player
      // the camera: behind on the path; in the voice's place it stands past the player, looking back the way the self came
      var want, look;
      if (st.cam === "voice") { var c = at(route, S_VOICE + 6.5), sp = at(route, S_SELF); want = new THREE.Vector3(c.x, floor(c) + 4.4, c.z); look = new THREE.Vector3(sp.x, floor(sp) + 1.8, sp.z); }
      else if (SI && SI.g) { // sitting with a charge: close and to the side, aimed above it so it shows under the panel as the choices change it
        var T = SI.g.position, cb = side(Math.max(0, st.s - 2.6), 1.3), dx = T.x - cb.x, dz = T.z - cb.z, d = Math.sqrt(dx * dx + dz * dz);
        want = new THREE.Vector3(cb.x, Math.max(floor(cb), T.y) + 2.1, cb.z); look = new THREE.Vector3(T.x, T.y + d * 0.42 + 0.35, T.z);
        var O = st.orbit;
        if (O && (O.yaw || O.pitch)) { // turned by a drag: swing around the charge, closer in, then back inside the cave
          // In the path's frame: the camera keeps its distance by going further along the path where the walls stop it going
          // out to the side, so from the side it sees the charge across the cave rather than pressed against it.
          var r = Math.max(3.6, d), el0 = 0.38 + O.pitch, rh = r * Math.cos(el0), frS = SI.whom === "voice" ? S_VOICE : st.s + 3, fr = at(route, frS);
          var mLat = 0.55 * W * route.openAt(frS), lat = clamp(Math.sin(O.yaw) * rh, -mLat, mLat);
          var along = (Math.cos(O.yaw) >= 0 ? -1 : 1) * Math.sqrt(Math.max(0, rh * rh - lat * lat));
          want.set(T.x + fr.fx * along - fr.fz * lat, T.y + 0.6 + Math.sin(el0) * r, T.z + fr.fz * along + fr.fx * lat);
          keepInCave(want, st.s + 2); var dd = want.distanceTo(T); look.set(T.x, T.y + dd * 0.4 + 0.3, T.z); // still under the panel
        }
      }
      else if (cen) { // at the centre: the child framed low under the panel, the self beside it and the voices around it
        var cb0 = side(cen.s - 6, -0.3), ch = at(route, cen.s); want = new THREE.Vector3(cb0.x, floor(cb0) + 3.2, cb0.z); look = new THREE.Vector3(ch.x, floor(ch) + 2.6, ch.z);
      }
      else { var b = side(Math.max(0, st.s - 6.2), st.lat * 0.6); want = new THREE.Vector3(b.x, floor(b) + 4.6, b.z); look = new THREE.Vector3(a.x + a.fx * 3.4 - a.fz * st.lat * 0.8, fl + 2.2, a.z + a.fz * 3.4 + a.fx * st.lat * 0.8); }
      if (snap) { camPos.copy(want); aim.copy(look); snap = false; } else { var f = 1 - Math.exp(-dt * (st.cam === "voice" ? 2.2 : 6)); camPos.lerp(want, f); aim.lerp(look, f); }
      camera.position.copy(camPos); camera.lookAt(aim);
      lamp.position.set(a.x, fl + 3.8, a.z); lamp.intensity = 1.1 + 0.3 * (1 - br.b) + 1.8 * st.flash * st.flash;
      var inCh = bump(st.s, CHAMBER_IN, CHAMBER_OUT, 7);
      hemi.intensity = 0.38 + 0.12 * inCh + 0.4 * st.flash;
      tmpC.setHex(0x0c0c18).lerp(new THREE.Color(0x101a34), inCh); scene.background.copy(tmpC); scene.fog.color.copy(tmpC);
      chamberLight.intensity = 1.1 + 0.4 * br.b;
      // the chamber warms with calm once a charge is given, and the easing plays out over st.easing.k (0 to 1)
      var calm = st.charge == null ? 0 : 1 - st.charge / 10, E = st.easing;
      tmpC.copy(calmBlue).lerp(calmWarm, 0.75 * calm); chamberLight.color.lerp(tmpC, Math.min(1, dt * 1.5));
      if (E) {
        var ek = E.k, swell = Math.sin(Math.PI * Math.min(1, ek * 1.15));
        chamberLight.intensity += 1.6 * E.big * swell;
        easeRing.material.opacity = 0.55 * E.big * (1 - ek) * Math.min(1, ek * 6);
        var rs = E.still ? 2.5 : 1 + (3.2 + 3 * E.big) * ease(ek); easeRing.scale.set(rs, rs, rs);
        motes.material.opacity = E.still ? 0 : 0.9 * E.big * swell;
        for (var q = 0; q < MOTES; q++) { var mb = moteBase[q], up = ek * (2 + 2.5 * mb.v); motePos[q * 3] = mb.x * (1 + 0.6 * ek); motePos[q * 3 + 1] = mb.y * 0.4 + up; motePos[q * 3 + 2] = mb.z * (1 + 0.6 * ek); }
        moteGeo.attributes.position.needsUpdate = true;
        if (!E.still && voice.visible) voice.scale.y = 1 - 0.05 * E.big * swell;
      } else if (easeRing.material.opacity) { easeRing.material.opacity = 0; motes.material.opacity = 0; voice.scale.y = 1; }
      // the hint: the one line under the scene
      if (!st.modal && !st.auto) {
        if (st.phase === "hall1") hint.textContent = st.s < 6 ? "Hold anywhere to walk. Let go to stop." : "";
        if (st.phase === "hall2") {
          var near = figures.filter(function (fg) { return fg.userData.wait && Math.abs(fg.position.z - a.z) < 5 && Math.abs(fg.position.x - a.x) < 9; })[0];
          if (near) hint.textContent = (TRANSLATORS[near.userData.id] || TRANSLATORS.unknown).waits;
          else if (/waits? here/.test(hint.textContent)) hint.textContent = "";
        }
      }
      // the shut mouth breathes: light and sound follow the cave's breath, stronger the nearer the player is, and open out as it opens
      var nearM = st.phase === "hall2" || st.phase === "end" || st.phase === "rest" ? clamp(0.2 + 0.8 * (st.s - (S_GATE + 2)) / (route.sEnd - S_GATE - 2), 0.2, 1) : 0.12, fadeM = 1 - clamp(st.endOpen || 0, 0, 1);
      var mbr = still ? 0.5 : br.b;
      mouthLight.intensity = (0.3 + 1.6 * mbr) * nearM * fadeM; mouthGlow.material.opacity = (0.1 + 0.3 * mbr) * nearM * fadeM; mouthGlow.scale.setScalar(0.9 + 0.25 * mbr);
      if (snd) {
        var t0 = snd.ac.currentTime, mute = !(st.phase === "hall2" || st.phase === "end" || st.phase === "rest") || st.modal && st.phase === "hall2";
        snd.gain.gain.setTargetAtTime(mute ? 0 : 0.06 * nearM * fadeM * (0.3 + 0.7 * mbr), t0, 0.25); snd.filter.frequency.setTargetAtTime(160 + 260 * mbr, t0, 0.25);
      }
      renderer.render(scene, camera);
    }
    var api = window.__oagBigMind; api.state = st; api.chamber = C; api.voiceId = V.id; api.route = route; api.S = { S_SELF: S_SELF, S_VOICE: S_VOICE, S_GATE: S_GATE };
    api.openAt = route.openAt; api.inCave = function (p) { var q = keepInCave(p.clone(), st.s + 2); return q.distanceTo(p) < 0.01; }; api.camera = camera; api.figures = figures; api.voice = voice; api.chamberLight = chamberLight;
    api.spirits = spirits; api.centre = function () { return cen; }; api.child = nextFig; api.mouth = { light: mouthLight, glow: mouthGlow, sound: function () { return snd; } }; api.walkInput = walkInput; api.keys = keys; api.stick = stick; api.sitting = function () { return st.sit; }; api.wave = function () { return wv; };
    api.trust = function () { return st.trust; }; api.pending = function () { return st.pending; }; api.stance = function () { return stanceOf(st.trust, V.id, st); };
    api.marks = function () { return { can: markOf(st.trust, V.id, "can"), will: markOf(st.trust, V.id, "will"), good: goodOf(st.trust), trusted: trusted(st.trust, V.id) }; };
    size(); window.addEventListener("resize", size);
    running = requestAnimationFrame(frame);
  }

  window.__oagBigMind = { start: start, open: open, heard: heard, heardBoss: heardBoss, readSave: readSave, VOICES: VOICES, CENTRE: CENTRE, centreQuestions: centreQuestions, STORE: STORE, TRUST: TRUST, STANCES: STANCES, state: null };
  // On the Cave of Lessons page the cave is opened from the WAVE room's door, so it waits to be asked.
  if (!window.__oagBigMindNoStart) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start(); }
})();
