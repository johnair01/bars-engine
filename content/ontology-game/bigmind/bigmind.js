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
  var VOICES = [
    {
      id: "protector", name: "the Protector", title: "The Protector", daemon: "protector",
      arrive: "A broad figure stands in the middle of the way, holding a shield. It does not move aside.",
      ask: "May I speak to the Protector?",
      seat: "You are the Protector now, not the self. The self is standing back there, where you were a moment ago.",
      questions: [
        { id: "job", ask: "Protector, what is your job?", cards: [
          ["To protect."], ["To keep the self safe."], ["To keep my family safe."], ["To keep watch, day and night."],
          ["I build walls and sound the alarm."], ["It's trying to keep me safe.", "ideas"], ["To keep everything in hand.", "controller"],
        ] },
        { id: "from", ask: "What do you protect the self from?", multi: true, cards: [
          ["Attack."], ["Danger, from anywhere."], ["Pain."], ["Shame."], ["Looking bad."], ["Risk."], ["Uncertainty."],
          ["Loss."], ["Losing control."], ["Too much excitement."], ["Other people, even loved ones."], ["Itself."],
          ["I'd fix whatever is hurting it.", "fixer"], ["Maybe it protects me from feeling.", "ideas"],
        ] },
        { id: "pay", ask: "And how are you thanked for all of this?", cards: [
          ["I'm not."], ["Hardly ever."], ["The self calls me a prison."], ["It feels unfair."], ["I feel devalued."],
          ["It's a full-time job, and exhausting."], ["I doubt anyone could thank me enough to make it worth it.", "skeptic"],
          ["It does its best, poor thing.", "ideas"],
        ] },
      ],
      thanks: "Thank you, Protector. Every voice has a right to be heard, and you have been. You can give the self its place back.",
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
  // What you've kept: keep or forget per voice, and delete everything (bmc-safety).
  function keptList(save) {
    var ids = Object.keys(save.voices);
    if (!ids.length) return el("span", {});
    var box = el("div", { class: "bm-kept", "data-bm-kept": "" }, [el("p", { text: "What you've kept, on this device:" })]);
    ids.forEach(function (id) {
      var v = save.voices[id], voice = VOICES.filter(function (x) { return x.id === id; })[0];
      var name = voice ? voice.title : id;
      box.appendChild(el("p", { text: name + (v.status === "waiting" ? " (waiting; it has not spoken yet)" : "") }));
      if (v.kept.length) box.appendChild(el("ul", {}, v.kept.map(function (k) { return el("li", { text: k.line }); })));
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
    [stage, hint, ring, modal, selfBtn, fade].forEach(function (n) { wrap.appendChild(n); });
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
      clk: 0, moving: false, cam: "behind", modal: false, answers: {}, translators: [], waiting: save.waiting.slice(), asked: 0, flash: 0, speed: 1 };
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
      if (p && p.open) { modal.innerHTML = ""; p.html.forEach(function (n) { modal.appendChild(n); }); modal.setAttribute("data-bm-step", p.tag); } else hide();
    }

    // ---- the chamber: the four moves of the workshop with one voice -------------------------------------------
    function arrive() {
      st.phase = "chamber";
      show([el("h2", { text: V.title }), guide(V.arrive), guide(V.ask),
        row([btn("Yes. Step into its place", seatShift, { "data-bm-yes": "" }), btn("Not now", decline, { "data-bm-decline": "" }, true)])], "ask");
    }
    // Walking into the voice's place is the seat shift. The self stays behind as a faint figure where the player stood; the
    // player takes the voice's colour and turns to face the way they came, which is the way the voice keeps watch (a choice).
    function seatShift() {
      hide(); ring.style.display = "none"; st.cam = "voice";
      ghost = K.buildAvatar(THREE, "other"); seeThrough(ghost, 0.28); figureAt(ghost, S_SELF, 0, false); scene.add(ghost);
      var s0 = st.s, dm = daemonRow(V.daemon)[3];
      st.auto = true;
      tween(2600, function (k) {
        var e = ease(k); st.s = s0 + (S_VOICE - s0) * e; st.moving = k < 0.95;
        voice.traverse(function (m) { if (m.material) m.material.opacity = 1 - e; });
        avatar.userData.mat.color.setHex(0xb89aff).lerp(new THREE.Color(dm), e); avatar.userData.mat.emissive.copy(avatar.userData.mat.color);
      }, function () {
        st.auto = false; st.moving = false; voice.visible = false; st.turned = true;
        hint.textContent = "";
        tween(700, function () {}, function () { st.asked = 0; askQ(0, ""); });
      });
    }
    function askQ(i, lead) {
      var q = V.questions[i], picked = [];
      var cards = el("div", { class: "bm-cards" });
      q.cards.forEach(function (c, ci) {
        var b = el("button", { class: "bm-card", "data-bm-card": String(ci), "aria-pressed": "false", text: c[0], onclick: function () {
          if (q.multi) { var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on)); if (on) picked.push(c); else picked.splice(picked.indexOf(c), 1); doneBtn.disabled = !picked.length; }
          else answer(i, [c[0]], c[1] || null);
        } });
        cards.appendChild(b);
      });
      var input = el("input", { type: "text", "data-bm-line": "", placeholder: "Or in your own words, as the Protector", enterkeyhint: "done", maxlength: "200" });
      function say() { var t = input.value.trim(); if (!t) return; var lines = picked.map(function (c) { return c[0]; }).concat([t]); answer(i, lines, firstOut(picked) || heard(t)); }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); say(); } });
      var doneBtn = q.multi ? btn("That's all of it", function () { answer(i, picked.map(function (c) { return c[0]; }), firstOut(picked)); }, { "data-bm-done": "", disabled: "" }) : null;
      show([el("h2", { text: V.title }), lead ? guide(lead) : (i === 0 ? guide(V.seat) : null), guide(q.ask), cards,
        el("div", { class: "bm-line" }, [input, btn("Say it", say, { "data-bm-say": "" })]),
        doneBtn ? row([doneBtn]) : null,
        row([btn("This doesn't sound like the Protector", function () { secret("felt", i); }, { class: "bm-link", "data-bm-wrong": "" }),
          btn("Sit this one out", function () { next(i); }, { class: "bm-link", "data-bm-sitout": "" })])], "q-" + q.id);
    }
    function firstOut(cs) { for (var i = 0; i < cs.length; i++) if (cs[i][1]) return cs[i][1]; return null; }
    function answer(i, lines, out) {
      if (out) return secret(out, i);
      st.answers[V.questions[i].id] = lines;
      show([el("h2", { text: V.title })].concat(lines.map(says)).concat([row([btn("Go on", function () { next(i); }, { "data-bm-next": "" })])]), "said");
    }
    function next(i) { if (i + 1 < V.questions.length) askQ(i + 1, ""); else close(); }

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
    // The player walks back to where the self stood and takes its place again; the voice comes back and steps to the wall.
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
        voice.traverse(function (mm) { if (mm.material) mm.material.opacity = 0; });
        voiceAside(function () { keep(); });
      });
    }
    // Only lines the player keeps are stored (bm-cards-and-line).
    function keep() {
      var lines = [];
      V.questions.forEach(function (q) { (st.answers[q.id] || []).forEach(function (l) { lines.push({ q: q.id, line: l }); }); });
      if (!lines.length) return finish("waiting", []); // every question sat out: the voice has not spoken yet, and waits
      var keepOn = lines.map(function () { return false; });
      var list = el("div", { class: "bm-cards" }, lines.map(function (l, li) {
        var b = el("button", { class: "bm-card", "data-bm-keep": String(li), "aria-pressed": "false", text: l.line, onclick: function () { keepOn[li] = !keepOn[li]; b.setAttribute("aria-pressed", String(keepOn[li])); } });
        return b;
      }));
      show([el("h2", { text: "What the Protector said" }), guide("Tap the lines you want to keep. The rest are let go, and only what you keep is saved, on this device."), list,
        row([btn("Save and walk on", function () { finish("spoken", lines.filter(function (l, li) { return keepOn[li]; })); }, { "data-bm-save": "" })])], "keep");
    }
    // Saving at every chamber (bm-session): the voice's record, the translators waiting, and the place to come back to.
    function finish(status, kept) {
      var s = readSave();
      s.voices[V.id] = { status: status, kept: kept, savedAt: new Date().toISOString() };
      s.waiting = st.waiting.slice(); s.at = "hall2";
      var ok = writeSave(s);
      hide(); st.phase = "hall2";
      hint.textContent = status === "waiting" ? "The Protector waits by the wall. The way is open." : (ok ? "Saved. The way is open." : "The way is open. (This browser would not save.)");
      hint.setAttribute("data-bm-status", status);
    }
    function theEnd() {
      st.phase = "end";
      show([el("h2", { text: NEXT.title }), guide("Another figure waits at the mouth of the next chamber. Its chamber opens in the next build."),
        guide("Your place is saved here. You can rest, or walk back up and out."),
        row([btn("Walk back up", function () { leave(); }, { "data-bm-leave": "" }), btn("Rest here", function () { hide(); st.phase = "rest"; hint.textContent = "Resting. Tap Self to walk back up."; }, { "data-bm-rest": "" }, true)])], "end");
    }
    function leave() {
      fade.style.opacity = 1;
      setTimeout(function () { cancelAnimationFrame(running); window.removeEventListener("resize", size); renderer.dispose(); wrap.remove(); api.state = null; mouth(); }, 520);
    }

    // ---- the frame ------------------------------------------------------------------------------
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
    api.openAt = route.openAt; api.camera = camera; api.figures = figures; api.voice = voice;
    size(); window.addEventListener("resize", size);
    running = requestAnimationFrame(frame);
  }

  window.__oagBigMind = { start: start, heard: heard, readSave: readSave, VOICES: VOICES, STORE: STORE, state: null };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
