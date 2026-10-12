// The Big Mind cave: a fork of the Cave of Lessons with a chamber between hallways and a voice blocking the path in each.
//
// Design: content/ontology-game/bigmind/DESIGN.md, from sprout campaigns/big-mind/build-brief.md and Wendell's board of
// 10 October 2026, 20:19. His steer (bm-phone-first, overruled): "I want it to be a fork of cave of lessons that adds
// chambers between cave hallways with a voice blocking the path". This first build holds the cave mouth, the Protector's
// chamber and the hallway past it; the other six chambers and the centre wait on his playtest.
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
  // Paraphrased from the workshop transcript (/mnt/project-files/big-mind/source/big-mind-transcript.txt, 00:22 to 00:35),
  // with no line quoted longer than one line and no teacher or programme named (bm-name-internal). The cards are the group's
  // own answers (bm-cards-and-line). Cards marked out are the test of secretly speaking: each is an answer a different part
  // would give, so picking one brings the second figure out (bm-dismiss-step-aside). Which cards are out is a choice.
  var TRANSLATORS = {
    ideas: { name: "the self's own ideas", short: "The self's ideas", waits: "The self's ideas wait here for their own turn.", tell: "talked about the Protector instead of speaking as it" },
    fixer: { name: "the Fixer", short: "The Fixer", waits: "The Fixer waits here for its own chamber.", tell: "took up the Fixer's job of repairing things", daemon: "fixer" },
    controller: { name: "the Controller", short: "The Controller", waits: "The Controller waits here for its own chamber.", tell: "took up the Controller's job of keeping things in hand", daemon: "controller" },
    skeptic: { name: "the Skeptic", short: "The Skeptic", waits: "The Skeptic waits here for its own chamber.", tell: "doubted, which is the Skeptic's job", daemon: "skeptic" },
    unknown: { name: "a voice not met yet", short: "Not sure", waits: "A voice not met yet waits here for its turn.", tell: "" },
    felt: { tell: "did not feel like the Protector to you" },
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
      arrive: "A broad figure stands in the middle of the way, holding a shield. It does not move aside.",
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
  ];
  var NEXT = { id: "controller", title: "The Controller", daemon: "controller" };

  // An open line is heard for the same tells (bm-four-steps: in voice or out of voice, never right or wrong). A choice: a
  // plain word list, so a miss is cheap and the player can always say it feels wrong.
  function heard(text) {
    var t = " " + String(text || "").toLowerCase().replace(/[’]/g, "'") + " ";
    if (/\b(the|my|this|our) protector\b/.test(t) || /^ (it|he|she|they)\b/.test(t) || /\bit('s| is| does| wants| tries| protects| keeps| has)\b/.test(t) || /\b(i think|maybe|perhaps|probably|i guess)\b/.test(t)) return "ideas";
    if (/\b(fix|fixing|repair|solve|heal|make it better|sort it out)\b/.test(t)) return "fixer";
    if (/\b(in charge|keep control|take control|manage|managing|plan|keep order|the standard|in hand)\b/.test(t) && !/\b(lose|losing|lost|out of) control\b/.test(t)) return "controller";
    if (/\b(doubt|don't believe|pointless|no point|silly)\b/.test(t) && !/self-doubt|self doubt/.test(t)) return "skeptic";
    return null;
  }

  // ---- saving, on this device only ----------------------------------------------------------------
  // { v, at: "mouth" | "hall2", voices: { protector: { status: "spoken" | "waiting", kept: [{ q, line }], savedAt } },
  //   waiting: [translator ids] }. The first cave saves this seed record and spawns no world (bm-world-later).
  function blank() { return { v: 1, at: "mouth", voices: {}, waiting: [] }; }
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
    ".bm-kept{border-top:1px solid rgba(255,255,255,.12);padding:.5rem 0}.bm-kept li{color:#cfd8ff}";

  function start() {
    if (!document.getElementById("oagc-css")) document.head.appendChild(el("style", { id: "oagc-css", text: K.CSS }));
    if (!document.getElementById("bm-css")) document.head.appendChild(el("style", { id: "bm-css", text: CSS }));
    K.guardPage();
    mouth();
  }

  // ---- the cave mouth: the rules from the workshop's opening, one screen (bmc-safety) ------------------------------------
  var home = null;
  function mouth() {
    if (home) home.remove();
    var save = readSave(), resume = save.at === "hall2";
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
        el("button", { "data-bm-enter": "", text: resume ? "Go back in, past the Protector" : "Go in", onclick: function () { enter(resume ? "hall2" : "hall1"); } }),
        resume ? el("button", { class: "alt", "data-bm-restart": "", text: "Start at the mouth again", onclick: function () { var s = readSave(); s.at = "mouth"; writeSave(s); enter("hall1"); } }) : el("span", {}),
      ]),
      kept,
    ])]);
    root.appendChild(home);
  }
  // The five feelings are the five elements (oag-clean-up-moves). The player picks; the game never guesses (bmw-player-names).
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

  function spiritLabel(o) { var e = ELEMENTS.filter(function (x) { return x[0] === o.element; })[0]; return o.name + (e ? " (" + e[1] + ")" : ""); }
  // What you've kept: keep or forget per voice, and delete everything (bmc-safety).
  function keptList(save) {
    var ids = Object.keys(save.voices), sps = save.spirits || [];
    if (!ids.length && !sps.length) return el("span", {});
    var box = el("div", { class: "bm-kept", "data-bm-kept": "" }, [el("p", { text: "What you've kept, on this device:" })]);
    if (sps.length) box.appendChild(el("p", { "data-bm-keptspirits": "", text: "Spirits that come back in with you: " + sps.map(spiritLabel).join(", ") + "." }));
    ids.forEach(function (id) {
      var v = save.voices[id], voice = VOICES.filter(function (x) { return x.id === id; })[0];
      var name = voice ? voice.title : id;
      box.appendChild(el("p", { text: name + (v.keepsWay ? " (it is keeping the way for now; ask it again next time)" : v.status === "waiting" ? " (waiting; it has not spoken yet)" : "") }));
      if (v.kept.length) box.appendChild(el("ul", {}, v.kept.map(function (k) { return el("li", { text: k.line }); })));
      if (v.waves && v.waves.length) box.appendChild(el("ul", { "data-bm-keptwaves": id }, v.waves.map(function (w) { return el("li", { text: "W.A.V.E.: " + waveLine(w) }); })));
      box.appendChild(el("div", { class: "oagc-row" }, [el("button", { class: "alt", "data-bm-forget": id, text: "Forget " + name, onclick: function () {
        var s = readSave(); delete s.voices[id]; if (id === "protector") { s.at = "mouth"; s.waiting = []; } writeSave(s); mouth();
      } })]));
    });
    box.appendChild(el("div", { class: "oagc-row" }, [el("button", { class: "alt", "data-bm-wipe": "", text: "Delete everything", onclick: function () {
      if (window.confirm("Delete everything the cave has kept on this device?")) { wipe(); mouth(); }
    } })]));
    return box;
  }

  // ---- the cave --------------------------------------------------------------------------------
  // The route (a choice): hallway, chamber, hallway, the next chamber's closed mouth, along one gently winding line. The
  // chamber is the tunnel widened; past the voice the way stays gathered shut until the voice has spoken or been held back.
  var W = 4.4, H = 3, CHAMBER_IN = 40, CHAMBER_OUT = 72, S_VOICE = 58, S_SELF = 52, S_GATE = 61, WALK = 2.6, WAIT_D = 2.2; // WAIT_D: how far from the middle a waiting part stands
  function layout() {
    var pts = [], z;
    for (z = 0; z <= 124; z += 2) pts.push({ x: 2.2 * Math.sin(z * 0.07) + 1.2 * Math.sin(z * 0.023 + 1), z: -z });
    var r = K.makeRoute(K.smoothLine(pts, 0.5), "main");
    r.sEnd = r.len - 8;
    return r;
  }
  function bump(s, a, b, ramp) { return clamp((s - a) / ramp, 0, 1) * clamp((b - s) / ramp, 0, 1); }

  var running = null;
  function enter(from) {
    K.loadThree().then(function (THREE) { home.style.display = "none"; play(THREE, from); })
      .catch(function (e) { alert("The cave could not open: " + e.message); });
  }

  function play(THREE, from) {
    var save = readSave(), V = VOICES[0];
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
    var meters = el("div", { class: "bm-meters" }, [meter, meterYou]);
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
      clk: 0, moving: false, cam: "behind", modal: false, answers: {}, perms: {}, fears: [], charge: null, charges: [], you: null, waves: [], place: null, know: null, be: {}, translators: [], waiting: save.waiting.slice(), asked: 0, flash: 0, speed: 1 };
    var route = layout(), tweens = [], last = performance.now(), snap = true;
    function tween(ms, fn, done) { tweens.push({ t0: performance.now(), ms: ms / st.speed, fn: fn, done: done }); }
    function ease(k) { return k * k * (3 - 2 * k); }
    function side(s, d) { var a = at(route, s); return { x: a.x - a.fz * d, y: a.y, z: a.z + a.fx * d, fx: a.fx, fz: a.fz }; }
    function floor(a) { return a.y - H * 0.92; }

    var rock = new THREE.MeshStandardMaterial({ color: 0x5a5470, roughness: 0.95, side: THREE.DoubleSide });
    route.openAt = function (s) {
      var o = 1 + 0.85 * bump(s, CHAMBER_IN, CHAMBER_OUT, 7);
      var g = clamp((s - S_GATE) / 5, 0, 1), u = g * g * (3 - 2 * g);
      o *= 1 - u + u * st.gate;
      var e = clamp((s - (route.sEnd + 2)) / 5, 0, 1); o *= 1 - 0.5 * e; // the next chamber's mouth, shut for now
      if (st.sit) o *= 1 - 0.16 * st.sit.k * clamp(1 - Math.abs(s - st.s) / 14, 0, 1); // the walls draw in around a sitting (a choice)
      return o;
    };
    var tube = K.buildTube(THREE, route, { w: W, h: H, rock: rock, openAt: route.openAt, seed: 31 });
    scene.add(tube.mesh); scene.add(K.buildPebbles(THREE, route, W, H, 0, route.len));
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
    var nextFig = K.buildDaemon(THREE, daemonRow(NEXT.daemon), 6); seeThrough(nextFig, 0.55); figureAt(nextFig, route.sEnd + 4, 0, true); scene.add(nextFig);
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
    function down(e) { if (st.modal) return; e.preventDefault(); st.held = true; }
    function up() { st.held = false; }
    [stage, ring].forEach(function (n) { n.addEventListener("pointerdown", down); n.addEventListener("pointerup", up); n.addEventListener("pointercancel", up); n.addEventListener("pointerleave", up); });

    // ---- the modal ------------------------------------------------------------------------------
    function show(kids, tag) {
      modal.innerHTML = ""; kids.forEach(function (k) { if (k) modal.appendChild(k); });
      modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); modal.setAttribute("data-bm-step", tag || "");
      modal.scrollTop = 0; st.modal = true; st.held = false; ring.style.display = "none"; hint.textContent = "";
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
      st.phase = "chamber";
      var M = V.meet;
      show([el("h2", { text: V.title }), guide(V.arrive), npc(M.opens)].concat(spiritLines(), [
        el("div", { class: "bm-cards" }, M.replies.map(function (r) { return btn(r[0], function () { met(r); }, { class: "bm-card", "data-bm-reply": r[2] }); })),
        row([btn("Not now", decline, { class: "bm-link", "data-bm-decline": "" })])]), "meet");
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
      var kids = [el("h2", { text: V.title }), guide("Before you ask it anything, notice it. Where does the Protector live in your body?"),
        el("div", { class: "bm-cards" }, V.places.map(function (pl) { return btn(pl, function () { placed(pl); }, { class: "bm-card", "data-bm-place": pl }); }))];
      if (window.OAGBody && window.OAGBody.pick) kids.push(row([btn("Show me on the body map", function () {
        hide(); window.OAGBody.pick().then(function (r) { if (r) placed(r.label); else body(); });
      }, { "data-bm-bodymap": "" }, true)]));
      kids.push(row([btn("I can't find it yet", function () { placed(null); }, { class: "bm-link", "data-bm-noplace": "" })]));
      show(kids, "body");
    }
    function placed(pl) { st.place = pl; chargeAsk(null, "How charged is the Protector right now?"); }
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
      if (i != null) { var said = st.answers[V.questions[i].id]; if (said) said.forEach(function (l) { kids.push(npc(l)); }); kids.push(guide(V.questions[i].reflect)); }
      kids.push(guide(ask + (st.place ? " (in your " + st.place.toLowerCase() + ")" : "")), el("div", { class: "bm-charge" }, [el("span", { text: "calm 0" }), range, el("span", { text: "10 full" })]), el("p", { class: "bm-chargeline" }, [num, document.createTextNode(" out of 10")]),
        row([btn("That's how it is", function () { charged(i, +range.value); }, { "data-bm-charged": "" })]),
        row([btn("Breathe with it (W.A.V.E.)", function () { waveStart(i, ask); }, { "data-bm-wave": "" }, true)]));
      show(kids, i == null ? "charge-first" : "charge");
      setMeter(cur);
    }
    function charged(i, v) {
      var was = st.charge;
      st.charge = v; st.charges.push({ after: i == null ? "start" : V.questions[i].id, v: v }); setMeter(v);
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
      easedLine.appendChild(document.createTextNode(crossed ? "The Protector lets its breath out." : drop >= 3 ? "The Protector eases a lot." : "The Protector eases."));
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
    function afterCharge(i, v) {
      if (v <= READY) return ready();
      var n = i == null ? 0 : i + 1;
      while (n < V.questions.length && st.answers[V.questions[n].id]) n++;
      if (n < V.questions.length) return askQ(n, "");
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
    function waveStart(i, ask) {
      wv = { i: i, ask: ask, after: i == null ? "start" : V.questions[i].id, word: "", element: null, place: null, before: null, reached: null, blocked: null };
      var B = wv.B = chargeBlob(); tween(1400, function (k) { B.come = 1 - ease(k); });
      var sl = youSlider(st.you == null ? 5 : st.you, "Your own charge, 0 to 10");
      show([el("h2", { text: "Breathe with it" }), guide("This is about your own charge: the feeling that comes up in you while you sit with " + V.name + ". Its charge stays as you set it."),
        guide("How charged are you right now?")].concat(sl.kids, [
        row([btn("That's me right now", function () { wv.before = +sl.range.value; st.you = wv.before; youMeter(wv.before); wavePlace(); }, { "data-bm-youset": "" })]),
        row([btn("Back to " + V.name, function () { var B = wv.B; wv = null; B.leaving = true; tween(700, function (k) { B.come = ease(k); B.fade = 1 - ease(k); }, function () { scene.remove(B.g); }); chargeAsk(i, ask); }, { class: "bm-link", "data-bm-waveback": "" })])]), "wave-you");
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
      var i = wv.i, ask = wv.ask; wv = null;
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
      return !st.sit && !st.auto && !st.turned && st.cam !== "voice" && !/^(self|eased|sit|spirit|mouth|thanks|know|be-|wave-releasing)/.test(tag);
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
    function sitDown(whom, back, spirit, via) {
      var S = st.sit = { whom: whom, back: back, via: via, where: st.phase, n: 0, phase: "steps", place: whom === "voice" ? st.place : null, texture: null,
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
      var nm = S.name.trim() || "it", standBtn = btn("Stand up", function () { standUp("stood"); }, { class: "bm-link", "data-bm-standup": "" });
      if (S.phase === "stays") {
        var k = [], title = K.talk321(S.t321, { name: nm, damaged: false, redraw: sitDraw, focus: function () { K.focusChat(modal); }, where: SIT_WHERE, aim: "Aimed at what you want: " + S.goal,
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
        kids.push(guide(S.whom === "voice" ? "Name what you feel from " + V.name + ", in your own words, then its element if you know it." : "Give it a name, in your own words. Then its element, if you know it."));
        if (S.whom === "voice" && S.name === V.title) S.name = "";
        var ready = function () { go.disabled = !(S.name.trim() && (S.element || S.unknown)); };
        kids.push(lineInput("data-bm-sitname", S.name, "A name for it", function (v) { S.name = v; ready(); }),
          cardRow(K.ELEMENTS.map(function (x) { return [x[1].toLowerCase(), x[0] + " · " + x[1]]; }).concat([["unknown", "I don't know"]]), S.unknown ? "unknown" : S.element, "data-bm-sitelement",
            function (v) { S.unknown = v === "unknown"; S.element = S.unknown ? null : v; sitDraw(); }));
        ready();
      } else if (R.id === "allow") {
        S.allowed = true;
        kids.push(guide((S.name.trim() || "It") + " grows a little as you let it be here."));
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
      var S = st.sit, nm = S.name.trim();
      hide(); modal.setAttribute("data-bm-step", "sitting"); st.modal = true; ring.style.display = "none";
      try { var s = readSave(); s.sittings = (s.sittings || []).concat([{ where: S.where, whom: S.spirit ? "spirit" : S.whom, via: S.via, branch: branch, at: new Date().toISOString() }]); writeSave(s); } catch (e) {}
      var from = S.g.position.clone();
      tween(branch === "goes" ? 2200 : 1200, function (k) {
        S.k = 1 - ease(k); tube.dirty = true;
      }, function () {
        scene.remove(S.g); st.sit = null;
        var lighter = branch === "goes";
        if (S.spirit) { S.spirit.hidden = false; if (S.element) S.spirit.element = S.element; S.spirit.lighter = lighter; S.spirit.g.userData.level = lighter ? 0.2 : 0.45; }
        else addSpirit({ name: nm || "A charge", element: S.element, lighter: lighter }, from);
        if (modal.getAttribute("data-bm-step") === "self") { paused = { then: S.back }; return; }
        st.modal = false; S.back();
      });
    }
    function addSpirit(o, from) {
      var g = K.buildSpirit(THREE, o.name, colorOf(o.element)); if (o.lighter) g.userData.level = 0.2;
      if (from) g.position.copy(from); else { var a = side(Math.max(0.5, st.s - 2.2), 0.9); g.position.set(a.x, floor(a) + 1.7, a.z); }
      scene.add(g); o.g = g; spirits.push(o); spiritsUi();
    }
    function letGo(o, from) {
      var i = spirits.indexOf(o); if (i >= 0) spirits.splice(i, 1); spiritsUi();
      var g = o.g, y0 = (from || g.position).y; g.position.copy(from || g.position); o.leaving = true;
      tween(1600, function (k) { g.position.y = y0 + 2.5 * ease(k); g.traverse(function (m) { if (m.material) m.material.opacity = 0.9 * (1 - k); }); }, function () { scene.remove(g); });
    }
    function spiritsUi() {
      var n = spirits.length;
      spiritBtn.style.display = n ? "" : "none";
      spiritBtn.textContent = "Spirits " + n + (n > SHOW_SPIRITS ? " (+" + (n - SHOW_SPIRITS) + " behind)" : "");
      spiritBtn.setAttribute("data-bm-spirits", String(n));
    }
    function spiritList() {
      var tag = modal.getAttribute("data-bm-step") || "";
      if (!spirits.length || st.sit || st.auto || /^(self|eased|sit|spirit|mouth)/.test(tag)) return;
      var p = stash(), back = function () { unstash(p); };
      show([el("h2", { text: "Spirits with you" }), guide("Tap one to thank it."),
        el("div", { class: "bm-cards" }, spirits.map(function (o, oi) { return btn(spiritLabel(o), function () { thank(o, back); }, { class: "bm-card", "data-bm-spirit": String(oi) }); })),
        row([btn("Back", back, { class: "bm-link", "data-bm-spiritback": "" })])], "spirit-list");
    }
    function thank(o, back) {
      show([el("h2", { text: o.name }), you("Thank you for coming with me."), guide("Breathe it out and let it go, or sit with it again."),
        row([btn("Breathe out, and let it go", function () { hide(); letGo(o); back(); }, { "data-bm-spiritout": "" }),
          btn("Sit with it again", function () { sitDown("me", back, o, "spirit"); }, { "data-bm-spiritsit": "" }, true)])], "spirit-thank");
    }
    // The voices answer the spirits in what they say and how they stand, never in their charge or trust (bms-voices-respond).
    function spiritLines() {
      var n = spirits.length; if (!n) return [];
      return [npc("You didn't come alone.")].concat(n >= 3 ? [npc("That's a lot to bring through here.")] : []);
    }
    (save.spirits || []).forEach(function (o) { addSpirit({ name: o.name, element: o.element, lighter: !!o.lighter }); });

    function ready() {
      show([el("h2", { text: V.title }), npc(V.ready), row([btn("Ask it to step aside", function () { permit("aside", 0, seatShift); }, { "data-bm-ask": "aside" }), leaveBtn("aside")])], "ready");
    }

    // Asking permission. The player reads the voice's answer, so the voice is never forced (a choice: the read is the
    // player's, as in the workshop, where the facilitator waits for the voice to come).
    function permit(key, round, onYes, lead) {
      var A = V.asks[key];
      show([el("h2", { text: V.title }), lead || null, you(A.ask), guide("Wait for its answer. You may feel it more than see it. How does it answer?"),
        el("div", { class: "bm-cards" }, [
          btn("It lets me", function () { granted(key, onYes); }, { class: "bm-card", "data-bm-perm": "yes" }),
          btn("It holds back", function () { refused(key, round, onYes); }, { class: "bm-card", "data-bm-perm": "no" }),
          btn("I can't tell", function () { unsure(key, round, onYes); }, { class: "bm-card", "data-bm-perm": "unsure" }),
        ])], "perm-" + key);
    }
    function granted(key, onYes) {
      st.perms[key] = (st.perms[key] || 0) + 1;
      show([el("h2", { text: V.title }), npc(V.asks[key].yes), row([btn("Thank you", onYes, { "data-bm-thanks": key })])], "granted-" + key);
    }
    function unsure(key, round, onYes) {
      show([el("h2", { text: V.title }), guide("Then stay here with it a moment. Breathe with it. Nothing has to happen yet."),
        row([btn("Ask again", function () { permit(key, round + 1, onYes); }, { "data-bm-again": "" }), leaveBtn(key)])], "unsure-" + key);
    }
    // The refusal path. The voice says why, the player asks what it fears and answers as it would, then offers an assurance.
    function refused(key, round, onYes) {
      var A = V.asks[key];
      show([el("h2", { text: V.title }), npc(A.no[Math.min(round, A.no.length - 1)]),
        el("div", { class: "bm-cards" }, [
          btn("What are you afraid would happen?", function () { fearAsk(key, round, onYes); }, { class: "bm-card", "data-bm-why": "" }),
          btn("That's fair. I'll wait with you a while.", function () { unsure(key, round, onYes); }, { class: "bm-card", "data-bm-wait": "" }),
        ]), row([leaveBtn(key)])], "refused-" + key);
    }
    function fearAsk(key, round, onYes) {
      var input = el("input", { type: "text", "data-bm-fearline": "", placeholder: "Or say what it says, in its words", maxlength: "200" });
      function said(t) { if (!t) return; st.fears.push(t); assureAsk(key, round, onYes, t); }
      show([el("h2", { text: V.title }), you("What are you afraid would happen?"), guide("Let it answer. What does the Protector say?"),
        el("div", { class: "bm-cards" }, V.fears.map(function (f, fi) { return btn(f[0], function () { said(f[0]); }, { class: "bm-card", "data-bm-fear": String(fi) }); })),
        el("div", { class: "bm-line" }, [input, btn("It says this", function () { said(input.value.trim()); }, { "data-bm-fearsay": "" })])], "fear-" + key);
    }
    function assureAsk(key, round, onYes, fear) {
      var input = el("input", { type: "text", "data-bm-assureline": "", placeholder: "Or in your own words", maxlength: "200" });
      function offer(t) {
        if (!t) return;
        show([el("h2", { text: V.title }), you(t), npc(V.assured[Math.min(round, V.assured.length - 1)]),
          row([btn("Ask again", function () { permit(key, round + 1, onYes); }, { "data-bm-again": "" })])], "assured-" + key);
      }
      show([el("h2", { text: V.title }), npc(fear), guide("That makes sense of the wall. What can you offer it?"),
        el("div", { class: "bm-cards" }, V.assure.map(function (f, fi) { return btn(f[0], function () { offer(f[0]); }, { class: "bm-card", "data-bm-assure": String(fi) }); })),
        el("div", { class: "bm-line" }, [input, btn("Offer it", function () { offer(input.value.trim()); }, { "data-bm-offer": "" })])], "assure-" + key);
    }
    // Leaving it at its post honours the refusal. Before the shift it waits; after it has spoken, it keeps the way shut.
    function leaveBtn(key) {
      return btn("Leave it at its post for today", function () { keepsPost(key); }, { class: "bm-link", "data-bm-post": key });
    }
    function keepsPost(key) {
      if (key === "pass") {
        show([el("h2", { text: V.title }), npc("Thank you for not pushing."), guide("The Protector keeps the way for now. What it said is still yours to keep, and you can come back and ask again another day."),
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
    function askQ(i, lead) {
      var q = V.questions[i], picked = [];
      var cards = el("div", { class: "bm-cards" });
      // What it protects the self from may be what the player carries in (bms-protects-from): the spirits' names are cards too.
      var carried = q.id === "from" ? spirits.map(function (o) { return [o.name + "."]; }) : [];
      q.cards.concat(carried).forEach(function (c, ci) {
        var b = el("button", { class: "bm-card", "data-bm-card": String(ci), "aria-pressed": "false", text: c[0], onclick: function () {
          if (q.multi) { var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on)); if (on) picked.push(c); else picked.splice(picked.indexOf(c), 1); doneBtn.disabled = !picked.length; }
          else answer(i, [c[0]], c[1] || null);
        } });
        cards.appendChild(b);
      });
      var input = el("input", { type: "text", "data-bm-line": "", placeholder: "Or what it says, in its words", enterkeyhint: "done", maxlength: "200" });
      function say() { var t = input.value.trim(); if (!t) return; var lines = picked.map(function (c) { return c[0]; }).concat([t]); answer(i, lines, firstOut(picked) || heard(t)); }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); say(); } });
      var doneBtn = q.multi ? btn("That's all of it", function () { answer(i, picked.map(function (c) { return c[0]; }), firstOut(picked)); }, { "data-bm-done": "", disabled: "" }) : null;
      show([el("h2", { text: V.title }), lead ? guide(lead) : null, you(q.ask), carried.length ? guide("You came in with " + (carried.length === 1 ? "a spirit" : carried.length + " spirits") + ". Might it be protecting you from what you carry?") : null, guide("What does the Protector say?"), cards,
        el("div", { class: "bm-line" }, [input, btn("Say it", say, { "data-bm-say": "" })]),
        doneBtn ? row([doneBtn]) : null,
        row([btn("This doesn't sound like the Protector", function () { secret("felt", i); }, { class: "bm-link", "data-bm-wrong": "" }),
          btn("Sit this one out", function () { next(i); }, { class: "bm-link", "data-bm-sitout": "" })])], "q-" + q.id);
    }
    function firstOut(cs) { for (var i = 0; i < cs.length; i++) if (cs[i][1]) return cs[i][1]; return null; }
    // The voice's answer is said back as its own words, then the guide answers it, and the next question follows from it.
    function answer(i, lines, out) {
      if (out) return secret(out, i);
      st.answers[V.questions[i].id] = lines;
      chargeAsk(i, "Does it feel any different? How charged is the Protector now?");
    }
    function next(i) { st.answers[V.questions[i].id] = st.answers[V.questions[i].id] || null; charged(i, st.charge); } // sitting a question out moves on at the same charge
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
        row([btn("Pass", nextTurn, { class: "bm-link", "data-bm-bepass": t.id }),
          btn("Just look for a while", function () { close(); }, { class: "bm-link", "data-bm-look": "" })])]), t.id === "know" ? "know" : "be-" + t.id);
    }

    // Secretly speaking (bm-dismiss-step-aside): a second figure shows behind the voice. The player names it, thanks it and
    // asks it to wait; it walks on ahead into the closed passage and waits by the wall there. The voice is asked again.
    function secret(tell, i) {
      var fig = translatorFigure(tell === "felt" ? "unknown" : tell);
      figureAt(fig, S_VOICE + 2.6, 1.8, true); scene.add(fig); st.secret = fig; figures.push(fig);
      var why = (TRANSLATORS[tell] || {}).tell;
      var opts = ["ideas", "fixer", "controller", "skeptic", "unknown"].map(function (id) {
        return btn(TRANSLATORS[id].short, function () { named(id, i, fig); }, { "data-bm-name": id }, true);
      });
      show([el("h2", { text: "Someone else spoke" }), guide("Wait. That answer " + why + ". Another figure has come out behind the Protector."),
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
        askQ(i, "Let me speak to the Protector again.");
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
          permit("pass", 0, function () { voiceAside(function () { keep(); }); }, npc("Back at my post. So."));
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
      var waveBox = st.waves.length ? [guide("Your W.A.V.E.s are saved either way, on this device. Tap one to keep its feeling word with it."), el("div", { class: "bm-cards" }, waveCards)] : [];
      if (!lines.length && !st.waves.length) return finish("waiting", [], blocked); // every question sat out: the voice has not spoken yet, and waits
      var keepOn = lines.map(function () { return false; });
      var list = el("div", { class: "bm-cards" }, lines.map(function (l, li) {
        var b = el("button", { class: "bm-card", "data-bm-keep": String(li), "aria-pressed": "false", text: l.line, onclick: function () { keepOn[li] = !keepOn[li]; b.setAttribute("aria-pressed", String(keepOn[li])); } });
        return b;
      }));
      show([el("h2", { text: "What the Protector said" })].concat(lines.length ? [guide("Tap the lines you want to keep. The rest are let go, and only what you keep is saved, on this device."), list] : [], waveBox, [
        row([btn(blocked ? "Save" : "Save and walk on", function () { finish(status || (Object.keys(st.answers).some(function (k) { return st.answers[k]; }) ? "spoken" : "waiting"), lines.filter(function (l, li) { return keepOn[li]; }), blocked); }, { "data-bm-save": "" })])]), "keep");
    }
    // Saving at every chamber (bm-session): the voice's record, the translators waiting, and the place to come back to.
    function finish(status, kept, blocked) {
      var s = readSave();
      // Every W.A.V.E. is one entry, added to the ones from earlier sittings; its feeling word only if kept (bmw-record).
      var prevWaves = (s.voices[V.id] && s.voices[V.id].waves) || [], wk = st.waveKeep || [];
      var waves = prevWaves.concat(st.waves.map(function (w, wi) { var o = {}; for (var k in w) o[k] = w[k]; if (!wk[wi]) o.word = null; return o; }));
      s.voices[V.id] = { status: status, kept: kept, place: st.place || null, charges: st.charges.slice(), waves: waves, savedAt: new Date().toISOString() };
      if (blocked) s.voices[V.id].keepsWay = true; // it held the way shut; the next sitting meets it again at its post
      s.waiting = st.waiting.slice(); s.at = blocked ? "mouth" : "hall2";
      var ok = writeSave(s);
      hide();
      if (blocked) { leave(); return; }
      st.phase = "hall2";
      hint.textContent = status === "waiting" ? "The Protector waits by the wall. The way is open." : (ok ? "Saved. The way is open." : "The way is open. (This browser would not save.)");
      hint.setAttribute("data-bm-status", status);
    }
    function theEnd() {
      st.phase = "end";
      show([el("h2", { text: NEXT.title }), guide("Another figure waits at the mouth of the next chamber. Its chamber opens in the next build."),
        guide("Your place is saved here. You can rest, or walk back up and out."),
        row([btn("Walk back up", function () { leave(); }, { "data-bm-leave": "" }), btn("Rest here", function () { hide(); st.phase = "rest"; hint.textContent = "Resting. Tap Self to walk back up."; }, { "data-bm-rest": "" }, true)])], "end");
    }
    // At the mouth the player chooses, for each spirit, to keep it for next time or let it go (bms-spirits-after = choose). What
    // is kept is its name and element, on this device.
    function leave() {
      if (!spirits.length) { var s0 = readSave(); if (s0.spirits && s0.spirits.length) { s0.spirits = []; writeSave(s0); } return leaveNow(); }
      var keepIt = spirits.map(function () { return true; });
      show([el("h2", { text: "At the cave mouth" }), guide("These came out with you. Keep each one to come back in with you next time, or let it go here. What is kept is its name and element, on this device."),
        el("div", { class: "bm-cards" }, spirits.map(function (o, oi) {
          var b = el("button", { class: "bm-card", "data-bm-mouthspirit": String(oi), "aria-pressed": "true", text: "Keep " + spiritLabel(o), onclick: function () {
            keepIt[oi] = !keepIt[oi]; b.setAttribute("aria-pressed", String(keepIt[oi])); b.textContent = (keepIt[oi] ? "Keep " : "Let go of ") + spiritLabel(o);
          } });
          return b;
        })),
        row([btn("Walk out", function () {
          var s = readSave(); s.spirits = spirits.filter(function (o, oi) { return keepIt[oi]; }).map(function (o) { return o.lighter ? { name: o.name, element: o.element, lighter: true } : { name: o.name, element: o.element }; });
          writeSave(s); leaveNow();
        }, { "data-bm-walkout": "" })])], "mouth-spirits");
    }
    function leaveNow() {
      fade.style.opacity = 1;
      setTimeout(function () { cancelAnimationFrame(running); window.removeEventListener("resize", size); renderer.dispose(); wrap.remove(); api.state = null; mouth(); }, 520);
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
    var br = { b: 0.5, t0: performance.now() / 1000 }, camPos = new THREE.Vector3(), aim = new THREE.Vector3(), tmpC = new THREE.Color();
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
      // the walk
      if (!st.auto && !st.modal && st.held && (st.phase === "hall1" || st.phase === "hall2")) {
        var goal = st.phase === "hall1" ? S_SELF : route.sEnd;
        st.s = Math.min(goal, st.s + WALK * st.speed * dt); st.moving = st.s < goal;
        if (st.s >= goal - 1e-3) { st.moving = false; st.held = false; if (st.phase === "hall1") arrive(); else theEnd(); }
      } else if (!st.auto) st.moving = false;
      if (st.moving) st.clk += dt * st.speed;
      var a = at(route, st.s), fl = floor(a);
      K.loosenAvatar(avatar, 0.5, br.b);
      K.poseAvatar(avatar, st.clk, st.moving, dt, br.b, WALK / K.STEPS_PER_S, false);
      avatar.position.set(a.x, fl + 0.02, a.z);
      var face = K.yawFacing(a) + (st.turned || st.back ? Math.PI : 0); avatar.rotation.y = face;
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
      K.followSpirits(THREE, spirits, function (j) { var sa = side(Math.max(0.5, st.s - 2.2 - 1.6 * j), j === 0 ? 0.9 : j === 1 ? -1.1 : 0.2); return { x: sa.x, y: floor(sa) + 1.7, z: sa.z }; }, dt, now, still);
      var stance = 1 + 0.04 * Math.min(spirits.length, 3); voice.scale.x = voice.scale.z = stance; // it squares up to what you bring
      sitBtn.disabled = !canSit();
      // the camera: behind on the path; in the voice's place it stands past the player, looking back the way the self came
      var want, look;
      if (st.cam === "voice") { var c = at(route, S_VOICE + 6.5), sp = at(route, S_SELF); want = new THREE.Vector3(c.x, floor(c) + 4.4, c.z); look = new THREE.Vector3(sp.x, floor(sp) + 1.8, sp.z); }
      else { var b = at(route, Math.max(0, st.s - 6.2)); want = new THREE.Vector3(b.x, floor(b) + 4.6, b.z); look = new THREE.Vector3(a.x + a.fx * 3.4, fl + 2.2, a.z + a.fz * 3.4); }
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
      renderer.render(scene, camera);
    }
    var api = window.__oagBigMind; api.state = st; api.route = route; api.S = { S_SELF: S_SELF, S_VOICE: S_VOICE, S_GATE: S_GATE };
    api.openAt = route.openAt; api.camera = camera; api.figures = figures; api.voice = voice; api.chamberLight = chamberLight;
    api.spirits = spirits; api.sitting = function () { return st.sit; }; api.wave = function () { return wv; };
    size(); window.addEventListener("resize", size);
    running = requestAnimationFrame(frame);
  }

  window.__oagBigMind = { start: start, heard: heard, readSave: readSave, VOICES: VOICES, STORE: STORE, state: null };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
