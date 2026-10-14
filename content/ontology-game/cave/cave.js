// The Cave of Lessons: the ontology game's block work, played inside the body map.
//
// Design: content/ontology-game/cave/DESIGN.md. Wendell, 9 October 2026: "create a version where the game
// happens inside the body map instead of the body map being inside the game". The player taps the figure
// (the body map's own picker, OAGBody.pick); the tapped place is a portal. At the portal they name what they
// bring (charge, elemental channel, face), and only then does one generic chamber form, dressed in that
// energy (board ruling c3d-spot-shape, overruled 9 October). Each further place named in the same sitting is
// its own chamber, joined to the others by a path through the body.
//
// Needs body-map.js (OAGBody) loaded first. Reads cave-kit.glb and spots.json beside the page; they are
// made by build_kit.py.
//
// The next build (board of 9 October, 20:35): after the doorway the chamber is one winding path with a stretch for
// each W.A.V.E. step, walked by a small avatar that wears the charge. A block on any step opens a side passage that
// holds the five places; Release walks back to the exact marker, and blocks nest. The cave breathes (about 11
// seconds a breath); nothing is scored or required, and the calm button stills it.
(function () {
  "use strict";
  var BASE = window.__oagCaveBase || "/ontology-game/cave/";
  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

  // The five places of block work (game.jsx BLOCK_STEPS, lines 1200-1206). They are no longer the main walk: they line
  // a side passage that opens when the player blocks. s is the place's distance along the passage; key is the name
  // the saved scan uses for a block met there.
  var PLACES = [
    { id: "gate", step: "1 Game masters' gate", key: "gate", s: 30 },
    { id: "mouth", step: "2 Sensation", key: "sensation", s: 60 },
    { id: "pool", step: "3 Element", key: "element", s: 90 },
    { id: "passage", step: "4 Daemon", key: "daemon", s: 120 },
    { id: "way_out", step: "Release", key: "release", s: 150 },
  ];
  var PLACE_BY = {}; PLACES.forEach(function (p) { PLACE_BY[p.id] = p; });
  // The W.A.V.E. steps in order, copied from game.jsx WAVE_STEPS (lines 1092-1108): id, label, prompt.
  var WAVE = [
    ["welcome", "Welcome", "Let whatever's here be here for a moment, without needing it to be different yet."],
    ["acknowledge", "Acknowledge", "Admit that it's here. You don't have to like it."],
    ["allow", "Allow", "Let it take up as much of you as it's taking. You don't have to make it smaller."],
    ["accept", "Accept", "Let it be here without fighting it."],
    ["appreciate", "Appreciate", "Find what it's been trying to do for you."],
    ["validate", "Validate", "Your body has the right to feel this, whatever it is."],
    ["exhale", "Exhale", "Is this feeling in alignment with what you actually want right now?"],
  ];
  // The path as a short table (a choice): one stretch per W.A.V.E. step, each with its length and how far it
  // wanders sideways. Every stretch ends in a switchback to the next. The seed jitters lengths and bends, so the
  // same scan gives the same cave.
  // Rows are short because the switchback between two rows already gives each stretch about 30 units: a stretch is one breath
  // of walking (see below), so a stretch near 40 units keeps the stride of the avatar natural. Welcome is longer because it
  // has no switchback before it.
  var STRETCHES = [
    ["welcome", 36, 0], ["acknowledge", 12, 1.4], ["allow", 12, -1.5], ["accept", 12, 1.3],
    ["appreciate", 12, -1.4], ["validate", 12, 1.5], ["exhale", 12, 0],
  ];
  var LEAD = 5;          // straight run behind the first stand, so the camera has a path to follow
  // The breath is the ontology game's own: game.jsx lines 1330-1331 set BREATH_IN_MS = 4000 and BREATH_OUT_MS = 6000 for
  // its breath ring. The cave reads the same two numbers, so a hold here is the same inhale and exhale as there.
  var BREATH_IN_MS = 4000;
  var BREATH_OUT_MS = 6000;
  var BREATH = { inS: BREATH_IN_MS / 1000, outS: BREATH_OUT_MS / 1000 };
  var BREATH_S = BREATH.inS + BREATH.outS;
  // The walk: while the player holds, the figure walks at a steady pace, WALK_SPEED units a second, STEPS_PER_S steps a
  // second (choices). It used to take one full breath for every stretch, which made the hall of the six slow; the breath
  // is walked in the WAVE itself now (Wendell, 2026-10-13: "we should disambiguate the walk speed to breath. We have that
  // built into the manual wave experience so we don't need that anymore"). The cave still breathes on its own.
  // Wendell, 2026-10-14, after walking the hall with the stick: "the walking is rather slow". 4 units a second was about one
  // body length (3.6) a second; 7 is about two, an ordinary game walk, with room above it for running. Free walking takes
  // quicker steps (STRIDE_K) so the feet keep up with the ground.
  var WALK_SPEED = 7, STRIDE_K = 1.3;
  var STEPS_PER_S = 2.5;
  var MARK_AHEAD = 3.6;  // the marker floats this far ahead of the stand
  var MARK_Y = 2.0;      // and this high above the floor
  // How long a stretch of D units takes to walk, in seconds of holding.
  function stretchTime(D) { return Math.max(0.5, D / WALK_SPEED); }
  // What each stretch looks like (a choice). The seven take their light from the game's element colours (ELEMENTS below:
  // Earth, Fire, Water, Wood, Metal) and then climb to gold and daylight; the fog brightens, thins, and the walls open
  // wider as the steps climb. open scales the wall rings, fog is the fog and background colour, fogK scales the charge's
  // fog density, hemi is the ambient light.
  var STEP_LOOK = [
    { id: "welcome", light: 0xa8844a, fog: 0x1a140e, fogK: 1.3, open: 0.88, hemi: 0.34 },     // Earth: receiving, close
    { id: "acknowledge", light: 0xe0602a, fog: 0x2a120c, fogK: 1.15, open: 0.96, hemi: 0.38 }, // Fire: it is admitted
    { id: "allow", light: 0x3a78d0, fog: 0x0e1a30, fogK: 1.0, open: 1.04, hemi: 0.42 },        // Water: it takes the room it takes
    { id: "accept", light: 0x4aa84a, fog: 0x10261a, fogK: 0.9, open: 1.12, hemi: 0.46 },       // Wood: it grows without a fight
    { id: "appreciate", light: 0xc8ccd4, fog: 0x2a2c34, fogK: 0.8, open: 1.2, hemi: 0.52 },    // Metal: what it was for
    { id: "validate", light: 0xffd28a, fog: 0x42361e, fogK: 0.65, open: 1.28, hemi: 0.6 },     // gold: the right to feel it
    { id: "exhale", light: 0xfff4d8, fog: 0x6a6450, fogK: 0.45, open: 1.38, hemi: 0.7 },       // daylight: the way out
  ];
  var SIDE_LOOK = { id: "side", light: 0xa890ff, fog: 0x120e22, fogK: 1.1, open: 0.95, hemi: 0.36 }; // a violet hush for a block
  var OPEN_MAX = 1.38;
  var CLOSED = 0.5; // a stretch not yet chosen: its walls gathered in, waiting for the choice at its marker
  var HOLD_ABOUT_AFTER = 15; // seconds without touching the ring before the cave breathes on its own again
  // Textures as the body map names them (body-map.js TEXTURES) and the wall tint each gives (a choice).
  var TEXTURES = [
    ["constriction", "tightness", 0x8a4b3a], ["tension", "tension", 0x8c7a3a], ["numbness", "numbness", 0x6c7a8a],
    ["strength", "strength", 0x3a8a6c], ["other", "something else", 0x7a5ca8],
  ];
  // Channels and their elements (game.jsx CLEAN_UP_MOVES, lines 1257-1289: name, element, gist) and the pool colour.
  var ELEMENTS = [
    ["Anger", "Fire", "Burn it away", 0xe0602a], ["Sadness", "Water", "Let it flow", 0x3a78d0],
    ["Joy", "Wood", "Happy Apples", 0x4aa84a], ["Fear", "Metal", "Sharpen it", 0xc8ccd4],
    ["Neutrality", "Earth", "Rest and receive", 0xa8844a],
  ];
  // The six faces (game.jsx faces, line 745, and precisionQuestions, line 755) and the stone colour each gets (a choice).
  var FACES = [
    ["magenta", "Magenta", "Knows through presence and relational field", "Where is the presence you're reaching for?", 0xd040a0],
    ["red", "Red", "Knows through power, force, capacity", "What power are you trying to move or assert?", 0xd83a3a],
    ["amber", "Amber", "Knows through order, law, tradition, duty", "What rule or tradition is this about?", 0xe0a020],
    ["orange", "Orange", "Knows through understanding, clarity, coherence", "What understanding or clarity are you looking for?", 0xe87a28],
    ["green", "Green", "Knows through perspectives, voices, integration", "What perspectives or voices are involved?", 0x40b858],
    ["teal", "Teal", "Knows through systems, how everything learns", "How is the system trying to learn through this?", 0x20a8a8],
  ];
  // Each face's look for its branch (Wendell, 11 October 2026: "Branches are going wild. The screen should give you a dropdown
  // that styles the branch they are on with the style and vibes of the branch they choose"). A face's branch opens in its own
  // look, and the dropdown on the screen dresses it in any face's: the walls, the light, the fog, and motes in its colour. The
  // colours follow each face's stone; the rest is a choice. drift is how the motes move: 0 still, 1 restless.
  var FACE_LOOK = {
    magenta: { light: 0xff86d4, fog: 0x200a1a, fogK: 1.05, hemi: 0.4, rock: 0x6a3a5c, drift: 0.25, vibe: "close and warm" },
    red: { light: 0xff6a48, fog: 0x260a08, fogK: 0.9, hemi: 0.46, rock: 0x7a302a, drift: 1, vibe: "hot and strong" },
    amber: { light: 0xffcc66, fog: 0x221808, fogK: 1, hemi: 0.42, rock: 0x7e6232, drift: 0, vibe: "steady and ordered" },
    orange: { light: 0xffaa66, fog: 0x1e1208, fogK: 0.75, hemi: 0.52, rock: 0x7c4c2c, drift: 0.5, vibe: "clear and bright" },
    green: { light: 0x8ae49a, fog: 0x0c1c10, fogK: 0.9, hemi: 0.46, rock: 0x3c6a44, drift: 0.4, vibe: "many and together" },
    teal: { light: 0x78e4e4, fog: 0x081a1c, fogK: 0.7, hemi: 0.52, rock: 0x2c686a, drift: 0.7, vibe: "wide and moving" },
  };
  // ---- the levels (LEVELS.md, build order step 1: the walkable skeleton) ------------------------------------------------------
  // Wendell, 13 October 2026: "This is 6 minigames connected to a hub." Home base is the WAVE room; its portal opens on the hall
  // of the six, a round chamber with a door for each face; each door leads to that face's tunnel, and every tunnel ends at the
  // centre of the self, worn in the colour of the face the player came by, with portals to the other five. No minigames yet:
  // each tunnel is two stretches and ends in its face's question. Each face's tunnel has its own cave (LEVELS.md's six tunnels,
  // first sketches, a choice): e, roof, rib, jag and sharp as in CAVE_SHAPE below, and w how wide it runs against the chamber.
  var FACE_SHAPE = {
    magenta: { e: 0.45, roof: 0.9, rib: 0, jag: 0.06, sharp: 1, w: 0.9 },              // close and warm: low and round
    red: { e: 0.95, roof: 0.85, rib: 0.18, ribEvery: 5, jag: 0.15, sharp: 0.3, w: 0.78 }, // hot, cracked, narrow
    amber: { e: 0.22, roof: 1.15, rib: 0.12, ribEvery: 8, jag: 0.02, sharp: 1, w: 1 },   // carved: square, ribbed like pillars
    orange: { e: 1, roof: 1.35, rib: 0, jag: 0.03, sharp: 1, w: 1 },                     // a clear geode: a tall diamond
    green: { e: 0.5, roof: 1.05, rib: 0.25, ribEvery: 4, jag: 0.06, sharp: 1, w: 1.1 },  // many alcoves: the walls bay in and out
    teal: { e: 0.35, roof: 1.25, rib: 0, jag: 0.08, sharp: 0.5, w: 1.25 },               // wide and moving
  };
  // A tunnel's two stretches, as STRETCHES is the walk's: the way in, then a bend to where the face asks its question.
  var TUNNEL_ROWS = [["way-in", 30, 0], ["asks", 24, 1.3]];
  // The two round chambers (the hall and the centre): one ring of path round an open middle. R is the ring's radius, w its
  // half-width; the inner wall is cut away so the middle (the six stones, the pool) shows across the chamber.
  var ROUND = { R: 16, w: 7, shape: { e: 0.35, roof: 1.6, rib: 0, jag: 0.03, sharp: 1 } };
  var HALL_LOOK = { light: 0xffd8a0, fog: 0x161018, fogK: 1, hemi: 0.5, open: 1, drift: 0 };
  var ROUND_ROCK = 0x5a4e48;
  // The seven daemons (game.jsx DAEMONS, lines 1222-1230: id, name, essence), the colour each wears and what it
  // carries (choices: the seven share one body and differ by colour, posture and what they carry).
  var DAEMONS = [
    ["protector", "The Protector", "To protect: to keep you alive.", 0x4a78c8, "shield"],
    ["controller", "The Controller", "To set the standard.", 0x8a8f9a, "rod"],
    ["skeptic", "The Skeptic", "To doubt.", 0xb89a3a, "lens"],
    ["fixer", "The Fixer", "To fix, in both senses: to repair what's broken, and to hold something in place.", 0xc8742a, "wrench"],
    ["victim", "The Victim", "Sympathy, through stories.", 0x7a6aa8, "bundle"],
    ["damaged-self", "The Damaged Self", "To take the damage. It is the Protector's last resort, because absorbing a hit is a form of protection.", 0x6a4a4a, "crack"],
    ["emotional-body", "The Emotional Body", "To receive the signal and process it into meaning. It is where Emotional Alchemy happens.", 0x3ab890, "orb"],
  ];
  // Game.jsx CHANNEL_JOBS (line 1176): how each channel does its job, shown at the pool.
  var CHANNEL_JOBS = {
    Anger: "Anger's job is to find obstacles to be overcome, or boundaries to be created or destroyed.",
    Sadness: "Sadness's job is to point you toward what you care about and how far away you are from it.",
    Fear: "Fear's job is to detect threat and risk.",
    Joy: "Joy's job is to show you what's aligned with your delight.",
    Neutrality: "Neutrality's job is detachment and perspective, the view that lets you see the whole.",
  };
  // How a charge shapes the one generic chamber: width factor and fog (choices).
  // Wendell, 10 October 2026: "the cave is a bit narrow". The chamber is wider (6 from 4.4) and the charges spread less: tightness
  // still draws the walls in, but no longer to a corridor.
  var CHARGE_LOOK = { constriction: { w: 0.78, fog: 0.03 }, tension: { w: 0.9, fog: 0.02 }, numbness: { w: 1.1, fog: 0.05 }, strength: { w: 1.2, fog: 0.012 }, other: { w: 1, fog: 0.02 } };
  // The one chamber every portal opens (half-width, half-height and length in chamber units).
  var CHAMBER = { w: 6, h: 3, length: 20 };
  var FIG = 14; // chamber units per metre of the figure, for the paths that join two places
  // Game.jsx DAEMON_WORKS_FOR, line 1236.
  var DAEMON_WORKS_FOR = "You, the Player. Every daemon is there to protect you, and to work for your enjoyment.";
  // Meeting a daemon the Big Mind way (board merge-layout, 13 October 2026: the Big Mind cave's chambers become this cave's
  // daemon stops). Ask its permission to speak with it, step into its place, answer its questions as it, and ask a voice that
  // is secretly speaking to step aside and wait for its own turn. The questions follow the Big Mind cave's (bigmind.js VOICES):
  // its job, what it protects you from, how it is thanked. The Protector's cards are the workshop group's answers, from the Big
  // Mind cave; the other six daemons' cards are written from their jobs above (a choice). A card with a second entry is an
  // answer another part would give, so picking it brings that part out from behind the daemon (bm-dismiss-step-aside).
  var MEET_Q = [
    { id: "job", ask: "What is your job?" },
    { id: "from", ask: "What do you protect me from?", multi: true },
    { id: "thanks", ask: "How are you thanked for it?" },
  ];
  var MEET_CARDS = {
    "protector": {
      job: [["To protect."], ["To keep you safe."], ["To keep watch."], ["It's trying to keep me safe.", "ideas"], ["To keep everything in hand.", "controller"]],
      from: [["Attack."], ["Danger, from anywhere."], ["Pain."], ["Shame."], ["Looking bad."], ["Risk."], ["Uncertainty."], ["Loss."], ["Losing control."], ["Other people, even loved ones."], ["Itself."], ["I'd fix whatever is hurting you.", "fixer"]],
      thanks: [["I'm not."], ["Hardly ever."], ["You call me a prison."], ["It's exhausting."], ["I doubt anyone could thank me enough.", "skeptic"], ["It does its best, poor thing.", "ideas"]],
    },
    "controller": {
      job: [["To set the standard."], ["To keep things in order."], ["To make sure it's done right."], ["To decide what happens next."], ["To keep every danger out.", "protector"], ["It just wants things to go well.", "ideas"]],
      from: [["Mess."], ["Mistakes."], ["Being caught unprepared."], ["Chaos."], ["Falling short."], ["Other people's standards."], ["I'd repair whatever goes wrong.", "fixer"]],
      thanks: [["When it goes right, nobody notices."], ["I'm called rigid."], ["Never enough."], ["Nothing is ever good enough to thank.", "skeptic"]],
    },
    "skeptic": {
      job: [["To doubt."], ["To test what's true."], ["To ask whether it holds up."], ["To keep you from being fooled."], ["It's just being careful.", "ideas"], ["To keep you safe from harm.", "protector"]],
      from: [["Being fooled."], ["False hope."], ["Looking naive."], ["Promises that don't hold."], ["Wasting yourself on what won't work."], ["I'd make it work properly myself.", "fixer"]],
      thanks: [["I'm called negative."], ["Hardly."], ["Only when I'm proven right."], ["Nobody ever feels sorry for me.", "victim"]],
    },
    "fixer": {
      job: [["To fix things."], ["To repair what's broken."], ["To hold things in place."], ["To make it better."], ["To set the standard for how it should be.", "controller"], ["It wants to help.", "ideas"]],
      from: [["Things staying broken."], ["Feeling helpless."], ["It getting worse."], ["Being useless."], ["I doubt it can be fixed at all.", "skeptic"]],
      thanks: [["When it's fixed, you forget me."], ["I'm told to stop meddling."], ["There's always another thing."], ["I'm the one who's broken.", "damaged-self"]],
    },
    "victim": {
      job: [["To get sympathy."], ["To tell what happened to us."], ["To be seen hurting."], ["To get help."], ["It just wants to be heard.", "ideas"], ["To take the hit so you don't have to.", "damaged-self"]],
      from: [["Being blamed."], ["Being alone with it."], ["Being ignored."], ["Having to act before you're ready."], ["I'd keep every danger out.", "protector"]],
      thanks: [["People get tired of my stories."], ["I'm called dramatic."], ["Sometimes someone listens."], ["I doubt anyone really cares.", "skeptic"]],
    },
    "damaged-self": {
      job: [["To take the damage."], ["To absorb the hit."], ["To carry what hurts."], ["To be the last resort."], ["It's broken, I think.", "ideas"], ["To fix the crack myself.", "fixer"]],
      from: [["The full force of the blow."], ["Falling apart."], ["What can't be carried."], ["I'd stop it ever getting close.", "protector"]],
      thanks: [["Nobody sees me."], ["I'm treated as the problem."], ["I'm hidden away."], ["Poor me, nobody ever helps.", "victim"]],
    },
    "emotional-body": {
      job: [["To feel the signal."], ["To make meaning from it."], ["To turn feeling into something you can use."], ["To let it move through."], ["It's just being emotional.", "ideas"], ["To keep it all under control.", "controller"]],
      from: [["Going numb."], ["Missing what matters."], ["Signals that pile up unfelt."], ["I'd repair the feeling so it stops.", "fixer"]],
      thanks: [["I'm called too much."], ["I'm told to calm down."], ["Sometimes you listen."], ["I doubt feelings tell you anything.", "skeptic"]],
    },
  };
  // Who else might be speaking, and how the guide names the tell (bigmind.js TRANSLATORS, widened to all seven daemons).
  var MEET_TELL = {
    ideas: "talked about it instead of speaking as it", protector: "took up the Protector's job of keeping you safe",
    controller: "took up the Controller's job of setting the standard", skeptic: "doubted, which is the Skeptic's job",
    fixer: "took up the Fixer's job of repairing things", victim: "told it as a story for sympathy, which is the Victim's way",
    "damaged-self": "took the hit, which is the Damaged Self's job", "emotional-body": "felt it through for its meaning, which is the Emotional Body's job",
  };
  var MEET_OTHERS = [["ideas", "Your own ideas", "", 0x9a9aa8, ""], ["unknown", "Not sure", "", 0x6a6a74, ""]];
  // An open line is heard for the same tells, with a plain word list (bigmind.js heard): a miss is cheap, and the player can
  // always say it doesn't sound like the daemon.
  function meetHeard(text, self) {
    var t = " " + String(text || "").toLowerCase().replace(/[’]/g, "'") + " ", out = null;
    if (/^ (it|he|she|they)\b/.test(t) || /\bit('s| is| does| wants| tries| keeps| has)\b/.test(t) || /\b(i think|maybe|perhaps|probably|i guess)\b/.test(t)) out = "ideas";
    else if (/\b(fix|fixing|repair|solve|heal|make it better|sort it out)\b/.test(t)) out = "fixer";
    else if (/\b(in charge|keep control|take control|manage|managing|keep order|the standard|in hand)\b/.test(t) && !/\b(lose|losing|lost|out of) control\b/.test(t)) out = "controller";
    else if (/\b(doubt|don't believe|pointless|no point|silly)\b/.test(t) && !/self-doubt|self doubt/.test(t)) out = "skeptic";
    return out === self ? null : out;
  }

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  // Small builders for the pages' words and buttons, shared by the cave and the WAVE room.
  function P(text, attrs) { var a = attrs || {}; a.text = text; return el("p", a); }
  function btn(label, attrs, fn, alt) { var a = attrs || {}; a.text = label; a.onclick = fn; if (alt) a["class"] = "alt"; return el("button", a); }
  function row(kids) { return el("div", { class: "oagc-row" }, kids); }
  function choice(opts, picked, onPick) {
    return el("div", { class: "oagc-row" }, opts.map(function (o) {
      return el("button", { class: "alt", "data-cave-choice": o[0], "aria-pressed": String(picked === o[0]), text: o[1], onclick: function () { onPick(o); } });
    }));
  }

  // ---- reading the kit -------------------------------------------------------------------
  function parseKit(buf) {
    var dv = new DataView(buf);
    var jsonLen = dv.getUint32(12, true);
    var json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
    var bin = 20 + jsonLen + 8;
    var TYPES = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array };
    var SIZES = { SCALAR: 1, VEC3: 3, VEC4: 4 };
    function acc(i) {
      var a = json.accessors[i], v = json.bufferViews[a.bufferView], T = TYPES[a.componentType];
      return new T(buf.slice(bin + (v.byteOffset || 0) + (a.byteOffset || 0), bin + (v.byteOffset || 0) + (a.byteOffset || 0) + a.count * SIZES[a.type] * T.BYTES_PER_ELEMENT));
    }
    var out = {};
    (json.nodes || []).forEach(function (n) {
      if (n.mesh === undefined) return;
      var p = json.meshes[n.mesh].primitives[0];
      out[n.name] = { position: acc(p.attributes.POSITION), normal: acc(p.attributes.NORMAL), index: acc(p.indices) };
      // the detail pass's shade and baked shadow (tools/blender-cloud/detail.py): one grey per vertex, 0 to 65535
      if (p.attributes.COLOR_0 !== undefined) out[n.name].color = acc(p.attributes.COLOR_0);
    });
    return out;
  }
  // The stone textures, baked by bake_tiles.py from the chamber's own (chamber.py, J1): seamless 512 px tiles. A tile that
  // does not load leaves its stone a plain colour, as before.
  var TILES = ["wet_stone", "dry_stone", "crystal_vein"];
  function loadTiles(THREE) {
    var loader = new THREE.TextureLoader(), out = {};
    return Promise.all(TILES.map(function (k) {
      return new Promise(function (res) {
        loader.load(BASE + "textures/" + k + ".jpg", function (t) {
          t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; out[k] = t; res();
        }, undefined, function () { res(); });
      });
    })).then(function () { return out; });
  }
  var assets = null;
  function load() {
    if (assets) return assets;
    assets = Promise.all([
      fetch(BASE + "cave-kit.glb").then(function (r) { if (!r.ok) throw new Error("cave-kit.glb " + r.status); return r.arrayBuffer(); }).then(parseKit),
      fetch(BASE + "spots.json").then(function (r) { if (!r.ok) throw new Error("spots.json " + r.status); return r.json(); }),
      new Promise(function (res, rej) {
        if (window.THREE) return res(window.THREE);
        var s = el("script", { src: THREE_URL });
        s.onload = function () { res(window.THREE); };
        s.onerror = function () { rej(new Error("three.js did not load")); };
        document.head.appendChild(s);
      }),
    ]).then(function (r) {
      return loadTiles(r[2]).then(function (tiles) { return { kit: r[0], spots: r[1].spots, THREE: r[2], tiles: tiles }; });
    }).catch(function (e) { assets = null; throw e; });
    return assets;
  }


  // ---- the dressing: what the charge and the feeling do to the cave ----------------------------
  function lookup(table, key) { return table.filter(function (r) { return r[0] === key; })[0]; }

  // A piece with the detail pass's vertex shade takes it in its colour and in its glow, so a glowing cap's gills and
  // stem sit darker than its top instead of glowing as one flat shape. One shaded copy per material.
  function shaded(THREE, mat) {
    if (mat.userData.shaded) return mat.userData.shaded;
    var m = mat.clone();
    m.vertexColors = true;
    m.onBeforeCompile = function (sh) {
      sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n#ifdef USE_COLOR\n  totalEmissiveRadiance *= vColor.rgb;\n#endif");
    };
    mat.userData.shaded = m;
    return m;
  }

  function geomOf(THREE, piece) {
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(piece.position, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(piece.normal, 3));
    g.setIndex(new THREE.BufferAttribute(piece.index, 1));
    var p = piece.position, uv = new Float32Array(p.length / 3 * 2);
    for (var i = 0; i < p.length / 3; i++) { uv[i * 2] = (Math.atan2(p[i * 3], p[i * 3 + 2]) / Math.PI + 1) * 0.5; uv[i * 2 + 1] = p[i * 3 + 1] * 0.5; }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    if (piece.color) {
      var c = piece.color, rgb = new Float32Array(c.length / 4 * 3);
      for (i = 0; i < c.length / 4; i++) { rgb[i * 3] = c[i * 4] / 65535; rgb[i * 3 + 1] = c[i * 4 + 1] / 65535; rgb[i * 3 + 2] = c[i * 4 + 2] / 65535; }
      g.setAttribute("color", new THREE.BufferAttribute(rgb, 3));
    }
    return g;
  }

  // The stone of one tunnel: wet stone on the walls, dry stone on the floor, crystal vein on the spires and the crystals' rock
  // beds (Wendell, 2026-10-13: "Let's incorporate what we've made so far into the cave games"). The tiles are neutral grey;
  // the charge's wall colour tints all three. rock is the wall material and carries the other two.
  var TILE_UNITS = 3.2; // chamber units per repeat of a tile
  var STONE = { wall: { tile: "wet_stone", lift: 1.7 }, floor: { tile: "dry_stone", lift: 1.35 }, vein: { tile: "crystal_vein", lift: 1.9, glow: 0.55 } };
  function stoneOf(THREE, tiles, hex) {
    var m = {};
    Object.keys(STONE).forEach(function (k) { m[k] = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95, side: THREE.DoubleSide }); m[k].userData.lift = 1; });
    var rock = m.wall; rock.userData.floor = m.floor; rock.userData.vein = m.vein;
    rock.userData.hex = hex;
    return tileStone(rock, tiles);
  }
  // Lays the tiles on a stone made without them, as the Big Mind cave's is (it draws before its tiles have loaded).
  function tileStone(rock, tiles) {
    var m = { wall: rock, floor: rock.userData.floor, vein: rock.userData.vein };
    rock.userData.tiles = tiles;
    Object.keys(STONE).forEach(function (k) {
      var st = STONE[k], map = tiles && tiles[st.tile], x = m[k]; if (!x || !map) return;
      x.map = map; x.userData.lift = st.lift;
      if (st.glow) { x.emissive.setHex(0xffffff); x.emissiveMap = map; x.emissiveIntensity = st.glow; }
      x.needsUpdate = true;
    });
    tintStone(rock, rock.userData.hex);
    return rock;
  }
  // The room's stone laid in the room's own units, so a stone on its round wall or its floor is the size it is in a tunnel: the
  // wall and dome wrap round the room (a whole number of tiles, so the seam behind the charge's door does not show), and the
  // floor lies flat. mesh must already stand where it goes.
  // The WAVE room's rug: woven rings in the five elements' warm earth colours, drawn once on a canvas.
  function rugTexture(THREE) {
    var cv = document.createElement("canvas"); cv.width = cv.height = 256; var g = cv.getContext("2d");
    var rings = ["#5a2a22", "#a0522d", "#d9a441", "#6b3a2a", "#c97b4a", "#3e5a4a", "#e2c48a", "#7a2f2a"];
    for (var n = 0; n < rings.length; n++) { g.beginPath(); g.arc(128, 128, 128 - n * 15, 0, Math.PI * 2); g.fillStyle = rings[n]; g.fill(); }
    g.strokeStyle = "rgba(255,240,210,.35)"; g.lineWidth = 2;
    for (var k = 0; k < 24; k++) { var a = k / 24 * Math.PI * 2; g.beginPath(); g.moveTo(128 + Math.cos(a) * 20, 128 + Math.sin(a) * 20); g.lineTo(128 + Math.cos(a) * 124, 128 + Math.sin(a) * 124); g.stroke(); }
    var t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  function roomUV(THREE, mesh, R, flat) {
    mesh.updateMatrixWorld(true);
    var g = mesh.geometry = mesh.geometry.clone(), p = g.attributes.position, uv = new Float32Array(p.count * 2), v = new THREE.Vector3();
    var k = Math.round(2 * Math.PI * R / TILE_UNITS) / (2 * Math.PI);
    for (var i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld);
      if (flat) { uv[i * 2] = v.x / TILE_UNITS; uv[i * 2 + 1] = v.z / TILE_UNITS; }
      else { uv[i * 2] = (Math.atan2(v.x, v.z) / (2 * Math.PI) + 0.5) * 2 * Math.PI * k; uv[i * 2 + 1] = v.y / TILE_UNITS; }
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return mesh;
  }
  function tintStone(rock, hex) {
    rock.userData.hex = hex;
    [rock, rock.userData.floor, rock.userData.vein].forEach(function (m) { if (m) m.color.setHex(hex).multiplyScalar(m.userData.lift || 1); });
  }

  // A seed from words, and a small seeded random: the same scan gives the same cave.
  function hashOf(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rngOf(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }


  // ---- a route: the line the avatar walks, sampled every half unit ------------------------------
  // r = { X, Y, Z, S (distance along, measured flat), len, stops: [{ s, ... }] }. The avatar only ever stands on this line.
  // Y is the floor's rise and fall: the main path is level, and a side path ramps down under it and back up.
  function makeRoute(pts, kind) {
    var r = { X: [], Y: [], Z: [], S: [], kind: kind, stops: [] }, acc = 0;
    pts.forEach(function (p, i) {
      if (i) acc += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
      r.X.push(p.x); r.Y.push(p.y || 0); r.Z.push(p.z); r.S.push(acc);
    });
    r.len = acc;
    return r;
  }
  function ptOn(r, s) {
    s = r.loop ? ((s % r.len) + r.len) % r.len : Math.max(0, Math.min(r.len, s)); // a ring goes round
    var lo = 0, hi = r.S.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (r.S[m] <= s) lo = m; else hi = m; }
    var k = (s - r.S[lo]) / Math.max(1e-6, r.S[hi] - r.S[lo]);
    return { x: r.X[lo] + (r.X[hi] - r.X[lo]) * k, y: r.Y[lo] + (r.Y[hi] - r.Y[lo]) * k, z: r.Z[lo] + (r.Z[hi] - r.Z[lo]) * k };
  }
  function at(r, s) { // point and unit forward direction (flat)
    var p = ptOn(r, s), a = ptOn(r, s - 0.6), b = ptOn(r, s + 0.6), dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    return { x: p.x, y: p.y, z: p.z, fx: dx / l, fz: dz / l };
  }
  function yawFacing(f) { return Math.atan2(f.fx, f.fz); } // a figure that faces +z
  function distToRoute(r, x, z) { // how far a point is from the line (the test uses it: the avatar never leaves it)
    var best = 1e9;
    for (var i = 1; i < r.X.length; i++) {
      var ax = r.X[i - 1], az = r.Z[i - 1], bx = r.X[i] - ax, bz = r.Z[i] - az, l2 = bx * bx + bz * bz || 1;
      var t = clamp((((x - ax) * bx) + ((z - az) * bz)) / l2, 0, 1);
      best = Math.min(best, Math.hypot(ax + bx * t - x, az + bz * t - z));
    }
    return best;
  }
  // Resample a polyline every ds units (flat distance), after two rounds of corner cutting so the line flows.
  function smoothLine(pts, ds) {
    for (var it = 0; it < 2; it++) {
      var q = [pts[0]];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        q.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25, z: a.z * 0.75 + b.z * 0.25 });
        q.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75, z: a.z * 0.25 + b.z * 0.75 });
      }
      q.push(pts[pts.length - 1]); pts = q;
    }
    var r = makeRoute(pts, "tmp"), out = [];
    for (var s = 0; s < r.len; s += ds) out.push(ptOn(r, s));
    out.push(ptOn(r, r.len));
    return out;
  }

  // The main path: seven rows, one per W.A.V.E. step, joined by half-circle switchbacks; each row wanders a little.
  // Rows are far enough apart that the walls never meet, even opened to their widest and breathing in, so there are no free
  // turns and no dead ends.
  function layoutMain(seed, w, table) {
    var R = rngOf(hashOf(seed));
    var rows = (table || STRETCHES).map(function (r) { return { step: r[0], len: r[1] * (0.9 + 0.2 * R()), amp: r[2] * (0.75 + 0.5 * R()) }; });
    var ampMax = 0; rows.forEach(function (r) { ampMax = Math.max(ampMax, Math.abs(r.amp)); });
    var ru = Math.max(9, w * OPEN_MAX * 1.06 + ampMax + 1.5), pitch = 2 * ru, ds = 0.5, pts = [], ends = [], x = 0, dir = 1;
    for (var k = -LEAD / ds; k < 0; k++) pts.push({ x: k * ds, z: 0 });
    rows.forEach(function (row, i) {
      var z0 = -i * pitch, n = Math.max(2, Math.round(row.len / ds));
      for (var j = 0; j <= n; j++) {
        var u = j / n, off = row.amp * Math.pow(Math.sin(Math.PI * u), 2) * Math.sin(2 * Math.PI * u);
        if (i === 0 || j > 0) pts.push({ x: x + dir * row.len * u, z: z0 + off });
      }
      ends.push(pts.length - 1);
      var xe = x + dir * row.len;
      if (i < rows.length - 1) {
        var m = Math.max(10, Math.round(Math.PI * ru / ds));
        for (var q = 1; q <= m; q++) { var phi = Math.PI * q / m; pts.push({ x: xe + dir * ru * Math.sin(phi), z: z0 - ru + ru * Math.cos(phi) }); }
        x = xe; dir = -dir;
      } else {
        for (var e = 1; e <= 20; e++) pts.push({ x: xe + dir * e * ds, z: z0 }); // the way out
      }
    });
    var r = makeRoute(pts, "main");
    r.startS = LEAD; r.rows = rows.map(function (row) { return { step: row.step, len: Math.round(row.len * 10) / 10, amp: Math.round(row.amp * 10) / 10 }; });
    r.stops = ends.map(function (e, i) { return { s: r.S[e] - 1.5, wave: i }; });
    r.exitS = r.len; r.pitch = pitch;
    return r;
  }
  // A round chamber's path: one closed ring, walked forward (s grows), every half unit. side is the side its middle is on.
  function layoutRing(R) {
    var n = Math.round(2 * Math.PI * R / 0.5), pts = [];
    for (var i = 0; i <= n; i++) { var ph = 2 * Math.PI * i / n; pts.push({ x: R * Math.sin(ph), z: R * Math.cos(ph) }); }
    var r = makeRoute(pts, "round"), a = at(r, 1);
    r.loop = true; r.startS = 0; r.R = R;
    r.inner = (-a.fz * -a.x + a.fx * -a.z) > 0 ? 1 : -1; // the profile's +x side faces the middle when this is 1
    return r;
  }

  // Which side a branch leaves by: the outside of the bend the path is in, so its legs spread apart instead of crossing.
  // A straight stretch alternates by depth.
  function outerSide(route, s, depth) {
    var a = at(route, s - 3), b = at(route, s + 3), cross = a.fx * b.fz - a.fz * b.fx;
    if (Math.abs(cross) < 0.02) return depth % 2 ? -1 : 1;
    return cross > 0 ? -1 : 1;
  }
  // A branch: a loop that leaves the parent path through one opening in its wall and comes back through a second opening
  // beside the first, ending on the very spot it left from (playtesters: a side path loops back onto the path it branched
  // from). A side passage ramps down under the cave (drop), swings round a wide loop and climbs back; a face's branch at
  // the gate is a short level loop. In the parent's frame at s: u runs along the path, v out through the wall.
  // The loop leaves forward and comes back from behind (Wendell, 2026-10-13: the opening "shouldn't generate behind the
  // character" and the figure "should not have to rotate more than 90 degrees" to reach it), so the way in is ahead and to
  // the side, and the way back joins the path still walking forward.
  // o = { wb: half-width, g: half the gap between the two openings, W0: the parent's wall, L1: leg length, alpha: how far
  // the legs splay, R: the loop's radius, drop }.
  function layoutBranch(parent, sAt, side, o) {
    var b = at(parent, sAt), nx = -b.fz * side, nz = b.fx * side;
    function P(u, v, dy) { return { x: b.x - b.fx * u + nx * v, y: b.y + dy, z: b.z - b.fz * u + nz * v }; }
    var sa = Math.sin(o.alpha), ca = Math.cos(o.alpha), ctl = [P(0, 0, 0), P(-o.g * 0.7, o.W0 * 0.5, 0), P(-o.g, o.W0, 0)], i, k;
    var n1 = Math.max(1, Math.round(o.L1 / 2));
    for (i = 1; i <= n1; i++) { k = i / n1; ctl.push(P(-o.g - o.L1 * sa * k, o.W0 + o.L1 * ca * k, -o.drop * k)); }
    var c = o.g + o.L1 * sa, v1 = o.W0 + o.L1 * ca, R = Math.max(o.R, c + 1), Rc = Math.sqrt(R * R - c * c), cv = v1 + Rc;
    var phA = Math.atan2(-Rc, -c), phB = Math.atan2(-Rc, c) - 2 * Math.PI, m = Math.max(12, Math.round(R * Math.abs(phA - phB) / 1.5));
    for (var j = 1; j < m; j++) { var ph = phA + (phB - phA) * j / m; ctl.push(P(R * Math.cos(ph), cv + R * Math.sin(ph), -o.drop)); }
    for (i = n1; i >= 1; i--) { k = i / n1; ctl.push(P(o.g + o.L1 * sa * k, o.W0 + o.L1 * ca * k, -o.drop * k)); }
    ctl.push(P(o.g, o.W0, 0)); ctl.push(P(o.g * 0.7, o.W0 * 0.5, 0)); ctl.push(P(0, 0, 0));
    var r = makeRoute(smoothLine(ctl, 0.5), "branch");
    // Where the loop passes through the parent's wall, going out and coming back.
    var vOf = function (q) { return (r.X[q] - b.x) * nx + (r.Z[q] - b.z) * nz; }, qa = 0, qb = r.X.length - 1;
    while (qa < r.X.length - 1 && vOf(qa) < o.W0 * 0.92) qa++;
    while (qb > 0 && vOf(qb) < o.W0 * 0.92) qb--;
    // The tube runs the whole loop, from the middle of the parent's path and back to it (Wendell, 2026-10-13: "the segments
    // between the tunnels are leaving dark gaps", and again at the Acknowledge stretch: "branching paths need hardening for
    // these kinds of glitches"). It used to start at the wall, then part way in, and either way its open end crossed the
    // parent's wall where the branch meets it at a slant or under a high roof, so the void showed through the end of the
    // tube. Inside the parent it narrows (see taper in buildTube), so its open ends lie wholly inside the parent's stone,
    // its floor lies under the parent's own and its walls stand as the opening's jambs.
    r.sFrom = 0; r.sTo = r.len; r.sIn = Math.max(0, r.S[qa] - 0.6); r.sOut = Math.min(r.len, r.S[qb] + 0.6); // the stretch outside the parent
    // where the ramp ends and the loop runs level (a face's branch beside a stone must stand on level stone)
    var qf = 0; while (qf < r.X.length - 1 && r.Y[qf] > b.y - o.drop + 0.05) qf++; r.sLevel = r.S[qf];
    function nearestParentS(q) {
      var best = 1e9, bs = sAt;
      for (var p = 0; p < parent.X.length; p++) {
        if (Math.abs(parent.S[p] - sAt) > o.g + 12) continue;
        var d = Math.hypot(parent.X[p] - r.X[q], parent.Z[p] - r.Z[q]); if (d < best) { best = d; bs = parent.S[p]; }
      }
      return bs;
    }
    r.cross = [qa, qb].map(function (q) { return { x: r.X[q], y: r.Y[q], z: r.Z[q] }; }); // where it passes through the wall
    r.holes = [nearestParentS(qa), nearestParentS(qb)].map(function (ps) { return { s0: ps - o.wb * 1.08, s1: ps + o.wb * 1.08, side: side }; });
    r.side = side; r.parent = parent; r.at = sAt; r.drop = o.drop; r.startS = 0;
    return r;
  }

  // ---- the walls: one continuous tunnel along a route ---------------------------------------------
  // Wendell, 10 October 2026: "the cave is a bit narrow and there are major segments". The tunnel is now one surface swept
  // along the route (a rounded arch with a flat floor, a ring every unit, rock bumps that flow along it), so nothing breaks
  // between stretches. openAt(s) widens it along its length; update(k) breathes it. Holes cut the openings a branch leaves by.
  // Each charge has its own cave (Wendell, 2026-10-13: "Strength, constriction, strength and numbness should have different cave
  // shapes. I'm almost tempted to have the numbness not even have a cave structure but a blackness"). e is the profile's
  // roundness (low: a full squarish hall; 1: a pointed diamond), roof how high the roof rises, rib how hard the walls pinch in
  // and every how many units, jag how rough the stone is and sharp how crisp its edges. dark: the stone is lost in blackness.
  var CAVE_SHAPE = {
    constriction: { e: 0.8, roof: 0.82, rib: 0.22, ribEvery: 6, jag: 0.06, sharp: 1 },     // a squeezed slot that pinches in
    tension: { e: 1.05, roof: 1.3, rib: 0, jag: 0.15, sharp: 0.3 },                       // tall, angular, cracked stone
    numbness: { e: 0.5, roof: 1.1, rib: 0, jag: 0.02, sharp: 1, dark: true },              // hardly a cave: blackness
    strength: { e: 0.32, roof: 1.3, rib: 0, jag: 0.035, sharp: 1 },                       // a wide, high, domed hall
    other: { e: 0.55, roof: 1, rib: 0, jag: 0.075, sharp: 1 },                            // the cave as it was
  };
  var PROF = 20, PX = [], PY = [];
  function profileOf(e, roof) {
    var px = [], py = [];
    for (var j = 0; j < PROF; j++) {
      var t = (j / PROF) * Math.PI * 2, cx = Math.cos(t), sy = Math.sin(t), y = 0.04 + 0.96 * (sy < 0 ? -1 : 1) * Math.pow(Math.abs(sy), e);
      px.push((cx < 0 ? -1 : 1) * Math.pow(Math.abs(cx), e));
      py.push(y > 0 ? y * roof : y); // the floor sits at -0.92 of the height whatever the roof does
    }
    return { PX: px, PY: py };
  }
  (function () { var p = profileOf(0.55, 1); PX = p.PX; PY = p.PY; })();
  var TAPER = 0.5;
  var WITHIN_SEAM = 2.5; // how far in from where a branch crosses its parent's wall its faces still overlap the parent's (units)
  function buildTube(THREE, route, o) {
    var shape = o.shape || CAVE_SHAPE.other, prof = profileOf(shape.e, shape.roof), PX = prof.PX, PY = prof.PY;
    var s0 = o.sFrom || 0, s1 = o.sTo == null ? route.len : o.sTo, n = Math.max(2, Math.floor(s1 - s0) + 1), ds = (s1 - s0) / (n - 1);
    var ring = [], i, j;
    for (i = 0; i < n; i++) { var s = s0 + i * ds, a = at(route, s); ring.push({ s: s, x: a.x, y: a.y, z: a.z, nx: -a.fz, nz: a.fx }); }
    var C = PROF + 1; // one column more than the profile: the last repeats the first, so the tiles meet without a smear
    var pos = new Float32Array(n * C * 3), jit = new Float32Array(n * PROF), uv = new Float32Array(n * C * 2), seed = o.seed || 0;
    var arc = [0];
    for (j = 1; j <= PROF; j++) arc.push(arc[j - 1] + Math.hypot((PX[j % PROF] - PX[j - 1]) * o.w, (PY[j % PROF] - PY[j - 1]) * o.h));
    for (i = 0; i < n; i++) for (j = 0; j < C; j++) { uv[(i * C + j) * 2] = ring[i].s / TILE_UNITS; uv[(i * C + j) * 2 + 1] = arc[j] / TILE_UNITS; }
    for (i = 0; i < n; i++) for (j = 0; j < PROF; j++) {
      var floor = PY[j] < -0.8, sv = ring[i].s;
      var wave = 0.6 * Math.sin(sv * 0.37 + j * 2.1 + seed) + 0.4 * Math.sin(sv * 0.11 + j * 0.7 + seed * 1.3) + (shape.sharp < 1 ? 0.5 * Math.sin(sv * 1.3 + j * 3.7 + seed) : 0);
      jit[i * PROF + j] = 1 + (floor ? 0.01 : shape.jag) * (wave < 0 ? -1 : 1) * Math.pow(Math.min(1, Math.abs(wave)), shape.sharp);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    var mesh = new THREE.Mesh(geo, [o.rock.userData.floor || o.rock, o.rock]); mesh.frustumCulled = false;
    var t = { mesh: mesh, rock: o.rock, holes: [], k: -1, dirty: true, n: n, ring: ring, w: o.w, h: o.h };
    // Where two tunnels meet, each gives way only where the other's inside is (Wendell, 2026-10-13: "the segments between
    // the tunnels are leaving dark gaps"). A hole with a tube cuts this tube's stone only where all four corners of a face
    // lie inside that tube; t.within drops this tube's own faces near its ends that lie wholly inside its parent. Faces that
    // straddle the seam stay on both sides, so the two overlap there and never leave a gap. Both are worked out from the
    // stone as it stands, and again whenever the breath has moved it (see update).
    function vin(other, q, thr) { var c = other.contain({ x: pos[q * 3], y: pos[q * 3 + 1], z: pos[q * 3 + 2] }); return !!c && c.ratio < thr; }
    t.index = function () {
      var floorIdx = [], idx = [], shaped = t.k >= 0, memo = {};
      function quadIn(other, key, thr, a, b, c, d) {
        if (!shaped || !other || other.k < 0) return false;
        var m = memo[key] || (memo[key] = {});
        return [a, b, c, d].every(function (q) { return q in m ? m[q] : (m[q] = vin(other, q, thr)); });
      }
      for (var i = 0; i < n - 1; i++) for (var j = 0; j < PROF; j++) {
        var j1 = (j + 1) % PROF, cut = false, a = i * C + j, b = i * C + j + 1, c = (i + 1) * C + j, d = (i + 1) * C + j + 1;
        for (var q = 0; q < t.holes.length && !cut; q++) {
          var H = t.holes[q];
          if (H.tube) cut = ring[i].s >= H.s0 - 2 && ring[i + 1].s <= H.s1 + 2 && PX[j] * H.side > -0.2 && PX[j1] * H.side > -0.2 && quadIn(H.tube, "h" + q, 0.88, a, b, c, d);
          else cut = ring[i].s >= H.s0 && ring[i + 1].s <= H.s1 && PX[j] * H.side > 0.05 && PX[j1] * H.side > 0.05 && (H.all ? !(PY[j] < -0.8 && PY[j1] < -0.8) : PY[j] > -0.86 && PY[j1] > -0.86 && PY[j] < 0.8 && PY[j1] < 0.8);
        }
        if (!cut && t.within && (ring[i].s < t.within.s0 || ring[i + 1].s > t.within.s1)) {
          // Near the seam a face goes only when it lies well inside the parent, so the two overlap there. Further in, any face
          // inside the parent at all goes: a face's branch beside a narrow passage left slabs of its walls standing in the
          // passage, and its floor showing through the passage's floor (Wendell, 2026-10-13: "Cave is breaking here").
          var deep = ring[i + 1].s < t.within.s0 - WITHIN_SEAM || ring[i].s > t.within.s1 + WITHIN_SEAM;
          // Its floor in there lies a hair under the parent's and flickered through it, so it goes too, out to just past the parent's stone.
          var flo = PY[j] < -0.8 && PY[j1] < -0.8;
          cut = deep ? quadIn(t.within.tube, flo ? "wf" : "wd", flo ? 1.2 : 1, a, b, c, d) : quadIn(t.within.tube, "w", 0.92, a, b, c, d);
        }
        if (cut) continue;
        (PY[j] < -0.8 && PY[j1] < -0.8 ? floorIdx : idx).push(a, c, b, b, c, d);
      }
      geo.setIndex(floorIdx.concat(idx)); geo.clearGroups();
      geo.addGroup(0, floorIdx.length, 0); geo.addGroup(floorIdx.length, idx.length, 1); t.kIdx = t.k;
      if (!shaped) t.dirty = true;
    };
    // A branch narrows where it lies inside its parent (o.taper: { s0, s1 }, the stretch outside it), down to TAPER at its
    // ends, so its open ends sit wholly inside the parent's stone, clear of its walls and roof as they breathe and bulge.
    // Its faces in there are dropped anyway (t.within), so the narrowing never shows.
    function taperAt(sv) {
      var tp = o.taper; if (!tp) return 1;
      var u = sv < tp.s0 ? (tp.s0 - sv) / Math.max(1e-6, tp.s0 - s0) : sv > tp.s1 ? (sv - tp.s1) / Math.max(1e-6, s1 - tp.s1) : 0;
      return 1 - (1 - TAPER) * Math.min(1, u);
    }
    t.exact = function () { return !!t.within || t.holes.some(function (H) { return H.tube; }); };
    t.addHole = function (H) { t.holes.push(H); t.index(); };
    // How far inside the tunnel a point is, against the stone as it stands this frame (breath, bumps and all): ratio is 0 at
    // the middle of the nearest ring's cross-section and 1 on its stone. clamp(f) gives the point pulled in to ratio f.
    // Null when the point is past either end of the tube. The camera uses it to stay inside (see the frame loop).
    t.contain = function (P, cap) {
      if (t.k < 0) return null; // not shaped yet
      var bi = 0, bd = 1e18, i, j;
      for (i = 0; i < n; i++) { var dx = P.x - ring[i].x, dy = P.y - ring[i].y, dz = P.z - ring[i].z, d = dx * dx + dy * dy * 0.25 + dz * dz; if (d < bd) { bd = d; bi = i; } }
      var R = ring[bi], fx = R.nz, fz = -R.nx, ox = P.x - R.x, oz = P.z - R.z;
      var lx = ox * R.nx + oz * R.nz, ly = P.y - R.y, along = ox * fx + oz * fz;
      var past = (bi === 0 && along < -0.5) || (bi === n - 1 && along > 0.5);
      if (past && !cap) return null;
      if (past) along = bi === 0 ? 0.5 : -0.5; // cap: a point past an end is held just inside it
      var vx = [], vy = [], lo = 1e9, hi = -1e9;
      for (j = 0; j < PROF; j++) { var p = (bi * C + j) * 3; vx.push((pos[p] - R.x) * R.nx + (pos[p + 2] - R.z) * R.nz); vy.push(pos[p + 1] - R.y); lo = Math.min(lo, vy[j]); hi = Math.max(hi, vy[j]); }
      var cy = (lo + hi) / 2, ddx = lx, ddy = ly - cy, L = Math.hypot(ddx, ddy), ux = L > 1e-6 ? ddx / L : 0, uy = L > 1e-6 ? ddy / L : 1, rmax = 1e9;
      for (j = 0; j < PROF; j++) { // where the ray from the middle meets the outline
        var j1 = (j + 1) % PROF, ex = vx[j1] - vx[j], ey = vy[j1] - vy[j], wx = vx[j], wy = vy[j] - cy, den = ux * ey - uy * ex;
        if (Math.abs(den) < 1e-9) continue;
        var tr = (wx * ey - wy * ex) / den, te = (wx * uy - wy * ux) / den;
        if (tr > 0 && te >= -1e-6 && te <= 1 + 1e-6) rmax = Math.min(rmax, tr);
      }
      if (rmax > 1e8) return null;
      return { ratio: past ? Math.max(9, L / rmax) : L / rmax, room: past ? -9 : rmax - L, clamp: function (f, m) {
        var r = Math.max(0, Math.min(L, f * rmax, rmax - (m || 0))), x = ux * r, y = cy + uy * r;
        return { x: R.x + R.nx * x + fx * along, y: R.y + y, z: R.z + R.nz * x + fz * along };
      } };
    };
    t.update = function (k) {
      if (Math.abs(k - t.k) < 0.0008 && !t.dirty) return;
      var moved = t.dirty; t.k = k; t.dirty = false;
      var kh = 1 + (k - 1) * 0.5, sink = o.within ? 0.03 : 0; // a branch's floor lies a hair under its parent's, so the two never flicker where they overlap
      for (var i = 0; i < n; i++) {
        var R = ring[i], wf = o.openAt(R.s) * k * o.w * (shape.rib ? 1 - shape.rib * Math.pow(0.5 + 0.5 * Math.cos(R.s * Math.PI * 2 / shape.ribEvery + seed), 3) : 1);
        var tp = taperAt(R.s); wf *= tp;
        for (var j = 0; j < C; j++) {
          var jj = j % PROF, p = (i * C + j) * 3, jt = jit[i * PROF + jj], fl = PY[jj] < -0.8, xx = PX[jj] * wf * jt;
          pos[p] = R.x + R.nx * xx; pos[p + 1] = R.y + (fl ? PY[jj] * o.h - sink : PY[jj] * o.h * kh * jt * tp); pos[p + 2] = R.z + R.nz * xx;
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
      var nm = geo.attributes.normal.array; // the seam's two columns share one normal, so the light shows no line
      for (var i2 = 0; i2 < n; i2++) for (var q = 0; q < 3; q++) {
        var e0 = i2 * C * 3 + q, e1 = (i2 * C + PROF) * 3 + q, avg = (nm[e0] + nm[e1]) / 2; nm[e0] = nm[e1] = avg;
      }
      geo.computeBoundingSphere();
      t.mounts.forEach(t.place);
      if (t.exact() && (moved || t.kIdx == null || Math.abs(k - t.kIdx) > 0.025)) t.index(); // the seams follow the breath
    };
    // Pieces that grow out of the stone (Wendell, 2026-10-13: "the placement of the elements need to feel a lot more natural
    // including having the elements comes out of the wall in various ways"). A mount is a point on the tube's surface: s along
    // the path and j round the profile (fractional; 0 is the middle of the +x wall, PROF / 4 the roof, 3 PROF / 4 the floor).
    // The piece's up axis follows the stone's inward normal, tipped and turned a little, sunk a little, and it moves with the
    // walls as they breathe. into: the piece's up axis points into the stone, so its top is what meets it (a hanging root).
    t.mounts = [];
    var M3 = { p: [0, 0, 0], n: [0, 0, 0] }, UP, QA, QB, VN;
    t.surface = function (sv, jf) {
      var fi = clamp((sv - s0) / ds, 0, n - 1.001), i = Math.floor(fi), u = fi - i, jw = ((jf % PROF) + PROF) % PROF, j = Math.floor(jw), v = jw - j;
      var nm = geo.attributes.normal.array, cx = 0, cy = 0, cz = 0;
      M3.p[0] = M3.p[1] = M3.p[2] = M3.n[0] = M3.n[1] = M3.n[2] = 0;
      [[i, j, (1 - u) * (1 - v)], [i + 1, j, u * (1 - v)], [i, j + 1, (1 - u) * v], [i + 1, j + 1, u * v]].forEach(function (c) {
        var e = (c[0] * C + c[1]) * 3;
        for (var q = 0; q < 3; q++) { M3.p[q] += pos[e + q] * c[2]; M3.n[q] += nm[e + q] * c[2]; }
      });
      var a = at(route, sv); cx = a.x - M3.p[0]; cy = a.y - M3.p[1]; cz = a.z - M3.p[2];
      var L = Math.hypot(M3.n[0], M3.n[1], M3.n[2]) || 1, sg = (M3.n[0] * cx + M3.n[1] * cy + M3.n[2] * cz) < 0 ? -1 : 1; // the normal that faces the path
      for (var q2 = 0; q2 < 3; q2++) M3.n[q2] *= sg / L;
      return M3;
    };
    t.place = function (m) {
      if (!UP) { UP = new THREE.Vector3(0, 1, 0); QA = new THREE.Quaternion(); QB = new THREE.Quaternion(); VN = new THREE.Vector3(); }
      var S = t.surface(m.s, m.j), d = m.into ? -1 : 1;
      VN.set(S.n[0] * d, S.n[1] * d, S.n[2] * d);
      QA.setFromUnitVectors(UP, VN);
      QB.setFromEuler(new THREE.Euler(m.tilt, m.spin, m.tilt2, "YXZ"));
      m.obj.quaternion.copy(QA).multiply(QB);
      var off = m.into ? m.len * (1 - m.sink) : -m.len * m.sink; // a hanging piece hangs its full length from the stone
      m.obj.position.set(S.p[0] + S.n[0] * off, S.p[1] + S.n[1] * off, S.p[2] + S.n[2] * off);
    };
    t.mount = function (obj, sv, jf, o2) {
      var m = { obj: obj, s: sv, j: jf, into: !!o2.into, len: o2.len || 0, sink: o2.sink == null ? 0.12 : o2.sink, tilt: o2.tilt || 0, tilt2: o2.tilt2 || 0, spin: o2.spin || 0 };
      t.mounts.push(m); t.place(m); return m;
    };
    t.index(); t.update(1);
    return t;
  }
  // The path stays lit: small warm stones down both edges of the floor.
  function buildPebbles(THREE, route, w, h, s0, s1) {
    var count = Math.floor((s1 - s0) / 2.5) * 2 + 2, pe = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }), count), c = 0;
    var M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), Sc = new THREE.Vector3(1, 1, 1);
    pe.frustumCulled = false;
    for (var s = s0 + 1; s < s1 - 1 && c < count - 1; s += 2.5) {
      var a = at(route, s);
      [-1, 1].forEach(function (sd) { P.set(a.x + -a.fz * sd * w * 0.3, a.y - h * 0.92 + 0.1, a.z + a.fx * sd * w * 0.3); M.compose(P, Q, Sc); pe.setMatrixAt(c++, M); });
    }
    pe.count = c; pe.instanceMatrix.needsUpdate = true;
    return pe;
  }

  // Chamber dressing from the kit: stone_spire, glow_cap, root_curl and crystal_cluster (with its rock bed), each built
  // in Blender from a picture (build_kit.py, pictures/). Spires stand at the foot of the wall, glow caps grow in twos
  // and threes, roots hang from the roof, crystals sit on their rocks. Nothing is set near a stop, and a piece where a side passage opens is hidden. An older kit without the
  // pieces leaves the chamber bare. The same seed dresses the same way. A kit with the grown pieces (grow.py, from procgen:
  // Wendell, 2026-10-13, "how the mushrooms and roots cluster", "let's wire this into the cave") swaps them in: a clump of
  // mushrooms where the caps grew, braided roots through the roof, a mat of roots pressed along the wall, and a colony with
  // its mycelium beside the pool (dressSide). Without them the pieces from pictures grow as before.
  var DRESS_ROOT = 0x4a3426, DRESS_GLOW = 0x7fe8c8;
  // The crystal as a building block (Wendell, 2026-10-13: "vary sizes and colors from this asset to give us changeable
  // building blocks to work with"). One Blender piece gives many looks: size scales the cluster, tall stretches the
  // crystals upward, wide spreads the cluster and its rocks, and tint names its colour. The rock bed takes the cave's rock
  // and is not stretched upward. violet is his picture's colour; the other five are choices.
  var CRYSTAL_TINTS = [["violet", 0x8f84ff], ["ice", 0x9fd8ff], ["rose", 0xff8fb8], ["amber", 0xffb84a], ["jade", 0x5fe0a0], ["smoke", 0xb8b0c8]];
  var CRYSTAL_RANGE = { size: [0.28, 0.62], tall: [0.8, 1.35], wide: [0.85, 1.2] }; // size is a share of the chamber height
  function crystalBlock(THREE, G, look, rock, mats) {
    var t = lookup(CRYSTAL_TINTS, look.tint) || CRYSTAL_TINTS[0], key = t[0], size = look.size, tall = look.tall || 1, wide = look.wide || 1;
    mats = mats || {};
    if (!mats[key]) mats[key] = new THREE.MeshStandardMaterial({ color: t[1], emissive: t[1], emissiveIntensity: 0.45, roughness: 0.25, flatShading: true });
    var g = new THREE.Group(), cl = new THREE.Mesh(G.crystal_cluster, mats[key]), bed = new THREE.Mesh(G.crystal_cluster_bed, rock);
    cl.scale.set(size * wide, size * tall, size * wide); bed.scale.set(size * wide, size, size * wide);
    g.add(cl); g.add(bed);
    g.userData.look = { tint: key, size: size, tall: tall, wide: wide };
    return g;
  }
  // Where a piece grows, round the profile on the +x side (see buildTube's mounts); the -x side mirrors it. Spires stand at the
  // foot of the wall or hang from the roof, crystals break out of any stone, caps grow in clumps from the floor's edge and
  // the low wall, and roots hang thick end up from the roof (Wendell, 2026-10-13: "the root elements are unpside down").
  var ZONES = { foot: [16.6, 17.3], low: [17.6, 18.6], mid: [19.2, 20.8], high: [1.5, 3], roof: [3.6, 4.6] };
  var SPIRE = { len: [0.12, 0.62], fat: [0.55, 1.5] }; // a spire's length as a share of the chamber height, and its girth
  var ZONE_SIZE = { foot: 1, low: 0.75, mid: 0.55, high: 0.5, roof: 0.5 }; // how big a piece may grow there, as a share of its floor size
  // The grown pieces' sizes as a share of the chamber height (choices): a clump's spread, a hanging root's length, a wall
  // mat's spread, the pool's colony's spread. GLOWS names the pieces that still show in numbness's dark.
  var GROWN = { clump: [0.38, 0.6], hang: [0.4, 0.62], mat: [0.55, 0.85], colony: 0.62 };
  var GLOWS = ["glow_cap", "crystal_cluster", "mush_clump"];
  // Fog of war (Wendell, 2026-10-13: "You can't see into the full cave. The avaiable lighting centers around the character and
  // any spirits that are following them"). The figure carries the light: it reaches so far and falls off, the sky light is a
  // trace, and the far cave sinks into darkened fog. Glowing things (caps, crystals, markers, the element) still show.
  // Looking with the thumb: how far a pixel of drag tilts, how far it can tilt (pushed up, then pulled down), how long the
  // thumb rests before the look eases back behind the figure (ms), and how close to the roof the camera may rise (choices).
  var LOOK = { pitchPerPx: 0.004, pitch: [-1.3, 0.6], settle: 600, roof: 1.75 };
  // numbFog and numbFill (Wendell, 2026-10-13: "we need brighter light in the numbness"): the numb cave thins its fog to this
  // share so the circle round the figure isn't hazed out, its sky light is this share of the other caves', and the figure's
  // light burns this much brighter there. The circle is still one size, and steady along the whole walk.
  var LAMP = { reach: 16, decay: 1.6, above: 1.9, power: 1.35, ambient: 0.22, dim: 0.35, fog: 1.6, numbFog: 0.4, numbFill: 1, numbLamp: 1.35 };
  // Numbness is hardly a cave: past the figure's light everything is lost in the black, and only glowing things hang in the
  // dark. Its stone still shows where the figure's light reaches (Wendell, 2026-10-13: "The fear cave is
  // too dark. We need consistent lighting throughout so people can see a radius around them but have darkness on all
  // sides"); it used to be hidden outright, so the figure walked in nothing.
  function darken(shape, rock, dressing) {
    if (!shape || !shape.dark) return;
    tintStone(rock, rock.userData.hex);
    (dressing.userData.items || []).forEach(function (it) { if (GLOWS.indexOf(it.piece) < 0) it.mesh.visible = false; });
  }
  var ELEMENT_ZONES = { Anger: ["foot", "low", "low"], Sadness: ["foot"], Joy: ["foot", "foot", "low"], Fear: ["foot", "low", "mid", "high", "roof"], Neutrality: ["foot", "foot", "low"] };
  function zoneJ(z, sd, rnd) { var r = ZONES[z], j = r[0] + rnd() * (r[1] - r[0]); return sd > 0 ? j : PROF / 2 - j; }
  function buildDressing(THREE, route, G, o) {
    var g = new THREE.Group(), items = [];
    g.userData.items = items;
    if (!G.stone_spire || !G.glow_cap || !G.root_curl) return g;
    var rnd = rngOf(hashOf(o.seed)), w = o.w, h = o.h, floorY = -h * 0.92, tube = route.tube;
    var rootMat = new THREE.MeshStandardMaterial({ color: DRESS_ROOT, roughness: 0.9 });
    var capMat = new THREE.MeshStandardMaterial({ color: DRESS_GLOW, emissive: DRESS_GLOW, emissiveIntensity: 0.55, roughness: 0.6 });
    var crystalMats = {}, vein = o.rock.userData.vein || o.rock;
    var keepClear = (route.stops || []).map(function (st) { return st.s; }).concat(o.clear || []);
    function clear(s) { return keepClear.every(function (c) { return Math.abs(c - s) > 2.5; }); }
    function pickZone(list) { return list[Math.floor(rnd() * list.length)]; }
    function grow(piece, obj, s, sd, zone, opt) { // mount on the stone; an older route without mounts sets it on the floor as before
      opt = opt || {};
      if (tube && tube.mount) {
        tube.mount(obj, s, zoneJ(zone, sd, rnd), { into: opt.into, len: opt.len, sink: opt.sink, tilt: (rnd() - 0.5) * (opt.tip || 0.7), tilt2: (rnd() - 0.5) * (opt.tip || 0.7), spin: rnd() * Math.PI * 2 });
      } else {
        var a = at(route, s); obj.position.set(a.x + -a.fz * sd * w * 0.34, a.y + floorY, a.z + a.fx * sd * w * 0.34); obj.rotation.y = rnd() * Math.PI * 2;
      }
      g.add(obj); var it = { piece: piece, s: s, side: sd, zone: zone, mesh: obj }; items.push(it); return it;
    }
    function mesh(piece, mat, size) { var m = new THREE.Mesh(G[piece], G[piece].attributes.color ? shaded(THREE, mat) : mat); m.scale.setScalar(size); return m; }
    for (var s = o.s0 + 3; s < o.s1 - 3; s += 4 + rnd() * 3) {
      var sd = rnd() < 0.5 ? -1 : 1, k = rnd(), i, n2, zone;
      if (!clear(s)) continue;
      if (G.crystal_cluster && G.crystal_cluster_bed && k >= 0.8) { // a vein of one to three clusters, one tint, sizes falling off
        var R = CRYSTAL_RANGE, pick = function (r) { return r[0] + rnd() * (r[1] - r[0]); }, tint = CRYSTAL_TINTS[Math.floor(rnd() * CRYSTAL_TINTS.length)][0];
        zone = pickZone(["foot", "foot", "low", "mid", "high", "roof"]);
        for (i = 0, n2 = 1 + Math.floor(rnd() * 3); i < n2; i++) {
          var cb = crystalBlock(THREE, G, { tint: tint, size: h * pick(R.size) * ZONE_SIZE[zone] * (1 - 0.25 * i), tall: pick(R.tall), wide: pick(R.wide) }, vein, crystalMats);
          grow("crystal_cluster", cb, s + (i ? (rnd() - 0.5) * 1.6 : 0), sd, zone, { sink: 0.18, tip: 0.9 }).look = cb.userData.look;
        }
      } else if (k < 0.35) { // spires: stalagmites from the floor, stalactites from the roof, each its own size (Wendell, 2026-10-13:
        // "The rock spires need do have stochastic sizes- stalagtite and stalagmites"). Most are small, a few tall; thin or squat.
        zone = rnd() < 0.55 ? pickZone(["foot", "foot", "low"]) : "roof";
        for (i = 0, n2 = 1 + Math.floor(rnd() * 4); i < n2; i++) {
          var sp = mesh("stone_spire", vein, 1), len = h * SPIRE.len[0] + h * (SPIRE.len[1] - SPIRE.len[0]) * Math.pow(rnd(), 1.8), fat = SPIRE.fat[0] + rnd() * (SPIRE.fat[1] - SPIRE.fat[0]);
          len *= zone === "roof" ? 0.8 : ZONE_SIZE[zone];
          sp.scale.set(len * fat, len, len * fat);
          grow("stone_spire", sp, s + i * (0.35 + rnd() * 0.7), sd, zone, { sink: 0.06, tip: 0.3 }).look = { len: Math.round(len / h * 100) / 100, fat: Math.round(fat * 100) / 100 };
        }
      } else if (k < 0.62 && G.mush_clump) { // a grown clump of mushrooms, on the floor's edge or the wall like shelf fungus
        zone = pickZone(["foot", "low", "low", "mid"]);
        var cs = h * (GROWN.clump[0] + rnd() * (GROWN.clump[1] - GROWN.clump[0])) * (zone === "foot" ? 1 : 0.75);
        grow("mush_clump", mesh("mush_clump", capMat, cs), s, sd, zone, { sink: 0.1, tip: 0.5 });
      } else if (k < 0.62) { // caps in a clump, on the floor's edge or the wall like shelf fungus
        zone = pickZone(["foot", "low", "low", "mid"]);
        for (i = 0, n2 = 2 + Math.floor(rnd() * 3); i < n2; i++)
          grow("glow_cap", mesh("glow_cap", capMat, h * (0.1 + rnd() * 0.1) * (zone === "foot" ? 1 : 0.8)), s + (i - 1) * 0.4, sd, zone, { sink: 0.15, tip: 0.8 });
      } else if (G.root_hang && G.root_creep && rnd() < 0.45) { // a mat of roots pressed along the wall
        zone = pickZone(["mid", "high", "high"]);
        var ms = h * (GROWN.mat[0] + rnd() * (GROWN.mat[1] - GROWN.mat[0]));
        grow("root_creep", mesh("root_creep", rootMat, ms), s, sd, zone, { sink: 0.35, tip: 0.25 });
      } else if (G.root_hang) { // braided roots through the roof, thick end into the stone
        zone = rnd() < 0.7 ? "roof" : "high";
        var hs = h * (GROWN.hang[0] + rnd() * (GROWN.hang[1] - GROWN.hang[0]));
        grow("root_hang", mesh("root_hang", rootMat, hs), s, sd, zone, { into: true, len: hs, sink: 0.08, tip: 0.4 });
      } else { // roots hang from the roof, thick end into the stone
        zone = rnd() < 0.7 ? "roof" : "high";
        for (i = 0, n2 = 1 + Math.floor(rnd() * 2); i < n2; i++) {
          var size = h * (0.28 + rnd() * 0.14);
          grow("root_curl", mesh("root_curl", rootMat, size), s + i * 0.7, sd, zone, { into: true, len: size, sink: 0.1, tip: 0.4 });
        }
      }
    }
    if (route.tube) {
      var addHole = route.tube.addHole;
      route.tube.addHole = function (H) {
        addHole(H);
        items.forEach(function (it) { if (it.side === H.side && it.s > H.s0 - 1.5 && it.s < H.s1 + 1.5) it.mesh.visible = false; });
      };
    }
    return g;
  }

  // A glowing marker floating just ahead of a stand; the lit ones stay lit.
  function buildMarker(THREE, w, h, color) {
    return new THREE.Mesh(new THREE.SphereGeometry(Math.min(0.55, w * 0.14), 14, 10), new THREE.MeshBasicMaterial({ color: color || 0xfff1b0, transparent: true, opacity: 0.4 }));
  }
  // A lantern that stays where the player branched.
  function buildLantern(THREE) {
    var g = new THREE.Group(), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.1, 6), new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.9 }));
    pole.position.y = 0.55; g.add(pole);
    var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
    lamp.position.y = 1.2; g.add(lamp);
    var cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.9 }));
    cap.position.y = 1.5; g.add(cap);
    g.userData.lamp = lamp;
    return g;
  }
  // ---- the avatar: a jointed, faceless human wearing the charge -------------------------------------
  // Built from three.js primitives (rounded capsules made by lathe, and one shared sphere), in a 2.2-unit design height and
  // scaled up by AVATAR_H / 2.2. Every joint is a named group that turns: hip, knee and ankle on each leg, shoulder and elbow
  // on each arm, the spine, the neck. Each charge has a look at the start and a looser look after the last step (choices):
  // tightness is narrow and drawn in, tension is tall and taut, numbness is fogged and translucent, strength is bright.
  // sx and sy are scale, op is opacity.
  var AVATAR_LOOK = {
    constriction: { color: 0xc8785f, sx: [0.66, 1.0], sy: [0.96, 1.0], op: [1, 1], glow: [0.08, 0.3] },
    tension: { color: 0xd8b658, sx: [0.82, 1.0], sy: [1.2, 1.02], op: [1, 1], glow: [0.05, 0.25] },
    numbness: { color: 0xa8bcd2, sx: [0.95, 1.0], sy: [1.0, 1.0], op: [0.35, 0.85], glow: [0.02, 0.2] },
    strength: { color: 0x5fe0b0, sx: [1.0, 1.04], sy: [1.0, 1.0], op: [1, 1], glow: [0.95, 0.5] },
    other: { color: 0xb89aff, sx: [0.9, 1.0], sy: [1.0, 1.0], op: [1, 1], glow: [0.15, 0.3] },
    self: { color: 0xd8cfc2, sx: [1.0, 1.0], sy: [1.0, 1.0], op: [1, 1], glow: [0.1, 0.1] }, // the WAVE room: the charge has come out of the figure
  };
  var AVATAR_H = 3.6, DESIGN_H = 2.2, HIP_Y = 1.15, THIGH = 0.52, SHIN = 0.5, LEG_WORLD = (THIGH + SHIN) * AVATAR_H / DESIGN_H;
  // A rounded limb: a lathe of two hemispheres joined by a straight run of length S, radius r, centred on the origin along y.
  function capsuleGeo(THREE, r, S) {
    var pts = [], n = 3, i, a;
    for (i = 0; i <= n; i++) { a = -Math.PI / 2 + (Math.PI / 2) * i / n; pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r), -S / 2 + Math.sin(a) * r)); }
    for (i = 0; i <= n; i++) { a = (Math.PI / 2) * i / n; pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r), S / 2 + Math.sin(a) * r)); }
    return new THREE.LatheGeometry(pts, 8);
  }
  function buildAvatar(THREE, texture) {
    var look = AVATAR_LOOK[texture] || AVATAR_LOOK.other;
    var mat = new THREE.MeshStandardMaterial({ color: look.color, roughness: 0.7, emissive: look.color, emissiveIntensity: 0.12, transparent: true });
    var mat2 = new THREE.MeshStandardMaterial({ color: new THREE.Color(look.color).multiplyScalar(0.6), roughness: 0.8, emissive: look.color, emissiveIntensity: 0.06, transparent: true });
    var J = {}, ball = new THREE.SphereGeometry(1, 10, 8);
    function node(name, parent, x, y, z) { var g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); J[name] = g; return g; }
    function put(geo, m, parent, x, y, z, sx, sy, sz) { var o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (sx) o.scale.set(sx, sy, sz); parent.add(o); return o; }
    var fit = new THREE.Group(); fit.scale.setScalar(AVATAR_H / DESIGN_H);
    var body = new THREE.Group(); fit.add(body);                  // the look scales this one; the soles stay on the floor
    var hips = node("hips", body, 0, HIP_Y, 0);
    put(ball, mat2, hips, 0, 0, 0, 0.19, 0.12, 0.13);              // pelvis
    var gT = capsuleGeo(THREE, 0.105, THIGH), gS = capsuleGeo(THREE, 0.08, SHIN), gF = capsuleGeo(THREE, 0.06, 0.16);
    var gU = capsuleGeo(THREE, 0.06, 0.34), gL = capsuleGeo(THREE, 0.05, 0.31);
    [["L", 1], ["R", -1]].forEach(function (sd) {
      var n = sd[0], k = sd[1];
      var hip = node("hip" + n, hips, k * 0.1, -0.02, 0); put(gT, mat2, hip, 0, -THIGH / 2, 0);
      var knee = node("knee" + n, hip, 0, -THIGH, 0); put(gS, mat2, knee, 0, -SHIN / 2, 0);
      var ankle = node("ankle" + n, knee, 0, -SHIN, 0); put(gF, mat2, ankle, 0, -0.05, 0.07).rotation.x = Math.PI / 2;
    });
    var spine = node("spine", hips, 0, 0.02, 0);
    put(capsuleGeo(THREE, 0.15, 0.36), mat, spine, 0, 0.24, 0, 1.15, 1, 0.78);   // torso
    var chest = put(ball, new THREE.MeshBasicMaterial({ color: 0xfff1d0, transparent: true, opacity: 0.8 }), spine, 0, 0.36, 0.115, 0.05, 0.05, 0.05);
    var neck = node("neck", spine, 0, 0.56, 0); put(capsuleGeo(THREE, 0.05, 0.08), mat, neck, 0, 0.04, 0);
    var head = node("head", neck, 0, 0.12, 0); put(ball, mat, head, 0, 0.1, 0, 0.13, 0.15, 0.14);       // smooth: no face
    [["L", 1], ["R", -1]].forEach(function (sd) {
      var n = sd[0], k = sd[1];
      var sh = node("shoulder" + n, spine, k * 0.25, 0.5, 0); put(ball, mat, sh, 0, 0, 0, 0.075, 0.075, 0.075); put(gU, mat, sh, 0, -0.17, 0);
      var el = node("elbow" + n, sh, 0, -0.34, 0); put(gL, mat, el, 0, -0.155, 0);
      var wr = node("wrist" + n, el, 0, -0.31, 0); put(ball, mat, wr, 0, -0.04, 0, 0.055, 0.055, 0.055);
    });
    var o = new THREE.Group(); o.add(fit);                        // the outer group is what moves
    o.userData = { body: body, mat: mat, mat2: mat2, chest: chest, look: look, loose: -1, feet: 0, J: J, g: 0, amp: 0.3, stepIdx: 0 };
    return o;
  }
  // loose runs from 0 (as the player brought it) to 1 (after the last step); it eases in a step at a time.
  function loosenAvatar(av, loose, breath) {
    var d = av.userData, l = d.look, k = Math.max(0, Math.min(1, loose));
    function mix(p) { return p[0] + (p[1] - p[0]) * k; }
    d.body.scale.set(mix(l.sx), mix(l.sy), mix(l.sx));
    d.mat.opacity = d.mat2.opacity = mix(l.op);
    d.mat.emissiveIntensity = mix(l.glow) + 0.18 * breath; d.mat2.emissiveIntensity = d.mat.emissiveIntensity * 0.5;
    d.chest.material.opacity = 0.55 + 0.4 * breath;
    d.chest.scale.setScalar(0.05 * (0.85 + 0.35 * breath));
  }
  // The pose. clk is the walk clock in seconds (two steps a second, so the phase turns once a second); moving blends the walk
  // in and out; stepLen is the world length of a step now, which sets how far the legs swing. Hips swing from the hip joint
  // with the knee bending as the leg comes through, the arms swing against the legs, the torso turns a little and the hips
  // sink as the legs spread. Standing, the figure breathes: the chest and shoulders lift with the cave's breath.
  function poseAvatar(av, clk, moving, dt, breath, stepLen, still) {
    var d = av.userData, J = d.J, ph = clk * Math.PI * STEPS_PER_S;
    d.g += ((moving ? 1 : 0) - d.g) * Math.min(1, dt * 9);
    var g = d.g, target = Math.max(0.2, Math.min(0.62, Math.asin(Math.min(0.9, stepLen / 2 / LEG_WORLD))));
    d.amp += (target - d.amp) * Math.min(1, dt * 6);
    var A = d.amp, sL = Math.sin(ph), sR = Math.sin(ph + Math.PI);
    J.hipL.rotation.x = -A * sL * g; J.hipR.rotation.x = -A * sR * g;
    J.kneeL.rotation.x = g * (0.12 + 0.95 * Math.max(0, Math.cos(ph))); J.kneeR.rotation.x = g * (0.12 + 0.95 * Math.max(0, Math.cos(ph + Math.PI)));
    J.ankleL.rotation.x = -(J.hipL.rotation.x + J.kneeL.rotation.x) * 0.8; J.ankleR.rotation.x = -(J.hipR.rotation.x + J.kneeR.rotation.x) * 0.8;
    var B = A * 0.85, b = still ? 0.5 : breath;
    J.shoulderL.rotation.x = B * sL * g; J.shoulderR.rotation.x = B * sR * g;
    J.elbowL.rotation.x = -g * (0.25 + 0.35 * Math.max(0, -sL)); J.elbowR.rotation.x = -g * (0.25 + 0.35 * Math.max(0, -sR));
    J.shoulderL.rotation.z = 0.09 + 0.05 * b; J.shoulderR.rotation.z = -(0.09 + 0.05 * b);
    J.spine.rotation.x = 0.07 * g; J.spine.rotation.y = 0.14 * sL * g;
    J.hips.rotation.y = -0.1 * sL * g;
    J.hips.position.y = HIP_Y - g * LEG_WORLD / (AVATAR_H / DESIGN_H) * (1 - Math.cos(A)) * 0.85 * Math.abs(sL);
    // the breath, when standing: the chest swells and the shoulders and head lift a little
    var idle = 1 - g;
    J.spine.scale.set(1 + 0.05 * (b - 0.5) * idle, 1 + 0.04 * (b - 0.5) * idle, 1 + 0.06 * (b - 0.5) * idle);
    J.shoulderL.position.y = J.shoulderR.position.y = 0.5 + 0.03 * (b - 0.5) * idle;
    J.neck.rotation.x = 0.05 * (0.5 - b) * idle;
    // footfalls: step n lands at n / STEPS_PER_S seconds into the stretch
    var idx = Math.floor(clk * STEPS_PER_S + 1e-9);
    if (idx > d.stepIdx) d.stepIdx = idx;
  }
  // Bytes of geometry a group holds, counted once per geometry (the page test holds the avatar to about 50 KB).
  function geometryBytes(root) {
    var seen = [], total = 0;
    root.traverse(function (m) {
      var g = m.geometry; if (!g || seen.indexOf(g) >= 0) return; seen.push(g);
      Object.keys(g.attributes).forEach(function (k) { total += g.attributes[k].array.byteLength; });
      if (g.index) total += g.index.array.byteLength;
    });
    return total;
  }

  // The water element's pool: an uneven shore of wet stones round a dark basin, and a surface that moves. The surface is one
  // flat fan; its ripples live in the fragment shader (no extra vertices on a phone): a slow swell that crosses it, rings
  // where a drop falls from the roof every few seconds, light rippling under it, and a sheen at a low angle that takes the
  // lamp's colour, so the figure's own light slides across the water as it walks past. Calm stills the drops and slows the swell.
  // Wendell, 2026-10-13: "I'd want it to interface more smoothly with the rock boundaries". The water runs on under the shore
  // stones and thins to nothing before its edge, the stones sit down in it and are dark where they are wet, and the basin
  // shades from black at the middle to the stone's colour at the rim, so no hard line shows where water meets rock.
  var waterCalm = false, waterSheen = null; // set each frame from the calm button and the figure's lamp
  var WATER_VERT = "attribute float aEdge;\nvarying float vPoolE;\nvarying vec2 vPoolP;\nvarying vec3 vPoolX;\nvarying vec3 vPoolY;\nvarying vec3 vPoolZ;\nuniform float uPoolR;\n";
  var WATER_FRAG = [
    "varying float vPoolE;", "varying vec2 vPoolP;", "varying vec3 vPoolX;", "varying vec3 vPoolY;", "varying vec3 vPoolZ;",
    "uniform float uTime;", "uniform float uSwell;", "uniform float uFade;", "uniform vec3 uSheen;", "uniform vec4 uDrip[4];",
    "float poolH(vec2 p) {",
    "  float h = uSwell * (0.012 * sin(dot(p, vec2(0.8, 0.6)) * 7.0 + uTime * 1.3) + 0.008 * sin(dot(p, vec2(-0.5, 0.86)) * 11.0 - uTime * 1.7)",
    "    + 0.005 * sin(dot(p, vec2(0.2, -0.98)) * 17.0 + uTime * 2.3));",
    "  for (int i = 0; i < 4; i++) {",
    "    float age = uTime - uDrip[i].z;",
    "    if (age > 0.0 && age < 3.5) {",
    "      float d = length(p - uDrip[i].xy) - age * 0.45;",
    "      h += uDrip[i].w * 0.065 * sin(d * 30.0) * exp(-d * d * 40.0) * exp(-age * 1.1);",
    "    }",
    "  }",
    "  return h;",
    "}",
  ].join("\n") + "\n";
  // A fan over an outline, flat in x-z, with aEdge 0 at the middle and 1 at the rim (the shaders fade on it).
  function fanGeo(THREE, n, rimAt, y) {
    var pos = [0, y, 0], edge = [0], idx = [];
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, rr = rimAt(a); pos.push(Math.cos(a) * rr, y, Math.sin(a) * rr); edge.push(1); idx.push(0, 1 + (i + 1) % n, 1 + i); }
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("aEdge", new THREE.Float32BufferAttribute(edge, 1));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  }
  // A material that thins to nothing over the last part of a fan (from: the aEdge where the fade starts).
  function edgeFaded(m, from) {
    var prev = m.onBeforeCompile;
    m.transparent = true; m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
    m.onBeforeCompile = function (sh) {
      if (prev) prev(sh);
      if (sh.vertexShader.indexOf("vPoolE") < 0) {
        sh.vertexShader = "attribute float aEdge;\nvarying float vPoolE;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n  vPoolE = aEdge;");
        sh.fragmentShader = "varying float vPoolE;\n" + sh.fragmentShader;
      }
      sh.fragmentShader = sh.fragmentShader.replace("#include <alphamap_fragment>", "#include <alphamap_fragment>\n  diffuseColor.a *= 1.0 - smoothstep(" + from.toFixed(2) + ", 1.0, vPoolE);");
    };
    return m;
  }
  function waterMaterial(THREE, r, o) {
    var m = new THREE.MeshStandardMaterial({ color: o.puddle ? 0x0b1e30 : 0x12324f, roughness: 0.08, metalness: 0.3, emissive: 0x2a58a0, emissiveIntensity: o.puddle ? 0.3 : 0.3, opacity: o.puddle ? 0.85 : 0.9 });
    var u = { uTime: { value: 0 }, uSwell: { value: 1 }, uPoolR: { value: r }, uSheen: { value: new THREE.Color(0xffe0b0) },
      uDrip: { value: [0, 1, 2, 3].map(function () { return new THREE.Vector4(0, 0, -99, 0); }) } };
    m.userData.water = u;
    m.onBeforeCompile = function (sh) {
      Object.keys(u).forEach(function (k) { sh.uniforms[k] = u[k]; });
      sh.vertexShader = WATER_VERT + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n  vPoolE = aEdge;\n  vPoolP = position.xz / uPoolR;\n" +
        "  vPoolX = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));\n  vPoolY = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));\n  vPoolZ = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));");
      sh.fragmentShader = WATER_FRAG + sh.fragmentShader
        .replace("#include <alphamap_fragment>", "#include <alphamap_fragment>\n  diffuseColor.a *= 1.0 - smoothstep(" + (o.puddle ? "0.6" : "0.72") + ", 1.0, vPoolE);")
        .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\n" +
          "  float pe = 0.01, ph = poolH(vPoolP);\n  vec2 pg = vec2(poolH(vPoolP + vec2(pe, 0.0)) - ph, poolH(vPoolP + vec2(0.0, pe)) - ph) / pe;\n" +
          "  normal = normalize(normalize(vPoolY) - (pg.x * normalize(vPoolX) + pg.y * normalize(vPoolZ)) * 2.2);")
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n" +
          "  float pf = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);\n" +
          "  vec2 cq = vPoolP * 9.0;\n  float pc = sin(cq.x + sin(cq.y * 1.3 + uTime * 0.9) * 1.7 + uTime * 0.6) * sin(cq.y + sin(cq.x * 1.1 - uTime * 0.7) * 1.7 - uTime * 0.5);\n" +
          "  totalEmissiveRadiance += uSheen * (pf * 0.45 + clamp(length(pg) * 1.5, 0.0, 0.6)) + diffuseColor.rgb * pow(abs(pc), 6.0) * 0.45 * uSwell;");
    };
    m.transparent = true; m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
    return m;
  }
  var dropGeo = null;
  // buildPool(THREE, g, r, o): o.puddle lays a shallow puddle on the floor instead (no stones, no basin, a wet dark halo round it,
  // fewer drops), for the water caves the figure walks through. g.userData.splash(x, z, amp) opens a ring at a point in g's space.
  function buildPool(THREE, g, r, o) {
    o = o || {};
    var seed = o.seed != null ? o.seed : (r * 977.3) % 1, n = 40, puddle = !!o.puddle;
    function shore(a) { return (puddle ? 0.8 : 0.68) + 0.08 * Math.sin(3 * a + seed * 6.3) + 0.05 * Math.sin(5 * a + seed * 11.1) + (puddle ? 0.06 * Math.sin(2 * a + seed * 3.7) : 0); }
    var waterY = puddle ? 0.03 : r * 0.07;
    if (puddle) { // the wet stone round a puddle, darker than the dry floor and fading out into it
      g.add(new THREE.Mesh(fanGeo(THREE, n, function (a) { return r * shore(a) * 1.45; }, 0.02), edgeFaded(new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.4 }), 0.35)));
    } else { // the basin: black at the middle, the stone's own colour by the rim, reaching out under the stones
      var bg = fanGeo(THREE, n, function (a) { return r * shore(a) * 1.15; }, r * 0.01), bc = [];
      for (var bi = 0; bi < bg.attributes.position.count; bi++) { var rim = bg.attributes.aEdge.array[bi]; bc.push(0.03 + 0.2 * rim, 0.06 + 0.2 * rim, 0.09 + 0.21 * rim); }
      bg.setAttribute("color", new THREE.Float32BufferAttribute(bc, 3));
      g.add(new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9 })));
    }
    var wm = waterMaterial(THREE, r, o), water = new THREE.Mesh(fanGeo(THREE, n, function (a) { return r * shore(a) * (puddle ? 1 : 1.1); }, waterY), wm);
    water.renderOrder = 1; g.add(water);
    if (!puddle) {
      // the shore: smooth stones merged into one mesh, sitting down in the water's edge, dark where they are wet
      var ico = new THREE.IcosahedronGeometry(1, 2), src = ico.attributes.position, sp = [], sn = [], sc = [], tmp = new THREE.Vector3(), nx = new THREE.Vector3(), M = new THREE.Matrix4(), N = new THREE.Matrix3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S3 = new THREE.Vector3();
      var ns = 24 + Math.floor(seed * 5), wetTo = waterY + r * 0.035;
      for (var i = 0; i < ns; i++) {
        var a = (i + 0.35 * Math.sin(i * 7.1 + seed * 9)) / ns * Math.PI * 2, s = r * (0.06 + 0.05 * ((i * 5 + Math.floor(seed * 7)) % 4) / 3), rr = r * shore(a) + s * 0.55;
        M.compose(tmp.set(Math.cos(a) * rr, waterY - s * 0.12, Math.sin(a) * rr), Q.setFromEuler(E.set(0.3 * Math.sin(i * 3.3), a, 0.3 * Math.cos(i * 2.1))), S3.set(s * 1.5, s * 0.5, s * 1.1));
        N.getNormalMatrix(M);
        for (var v = 0; v < src.count; v++) {
          tmp.fromBufferAttribute(src, v); nx.copy(tmp).applyMatrix3(N).normalize(); sn.push(nx.x, nx.y, nx.z);
          tmp.multiplyScalar(1 + 0.18 * Math.sin(tmp.x * 5.1 + i * 1.7) * Math.sin(tmp.y * 4.3 + tmp.z * 3.7 + i)); // lumpy, like stone
          tmp.applyMatrix4(M); sp.push(tmp.x, tmp.y, tmp.z);
          var wet = Math.max(0, Math.min(1, (wetTo - tmp.y) / (r * 0.04))), k = 1 - 0.5 * wet; sc.push(k, k, k * (1 + 0.08 * wet));
        }
      }
      var sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute("normal", new THREE.Float32BufferAttribute(sn, 3)); sg.setAttribute("color", new THREE.Float32BufferAttribute(sc, 3));
      g.add(new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0x737a86, vertexColors: true, roughness: 0.7, metalness: 0.05 })));
    }
    // a drop falls from the dark above, and its ring opens where it lands
    if (!dropGeo) dropGeo = new THREE.SphereGeometry(1, 8, 6);
    var drop = new THREE.Mesh(dropGeo, new THREE.MeshBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.85 }));
    var dr0 = Math.max(r, 0.8);
    drop.scale.set(dr0 * 0.025, dr0 * 0.05, dr0 * 0.025); drop.visible = false; g.add(drop);
    var u = wm.userData.water, clock = 0, last = 0, next = (puddle ? 2 : 0.6) + seed * (puddle ? 6 : 2), slot = 0, fall = null, rnd = rngOf(hashOf("pool:" + seed));
    function ring(x, z, amp) { u.uDrip.value[slot].set(x, z, clock, amp); slot = (slot + 1) % 4; }
    g.userData.splash = function (x, z, amp) { ring(x / r, z / r, amp == null ? 1 : amp); };
    water.onBeforeRender = function () {
      var now = performance.now() / 1000, dt = last ? Math.min(0.1, now - last) : 0; last = now;
      if (waterSheen) u.uSheen.value.copy(waterSheen);
      clock += dt * (waterCalm ? 0.3 : 1); u.uTime.value = clock;
      u.uSwell.value += ((waterCalm ? 0.4 : 1) * (puddle ? 0.35 : 1) - u.uSwell.value) * Math.min(1, dt * 2); // a puddle is too shallow to swell much
      if (fall) {
        var k = (clock - fall.t) / 0.55;
        if (k >= 1) { ring(fall.x, fall.z, 0.6 + rnd() * 0.5); fall = null; drop.visible = false; }
        else drop.position.set(fall.x * r, waterY + dr0 * 2.4 * (1 - k * k), fall.z * r);
      } else if (clock > next && !waterCalm) {
        var da = rnd() * Math.PI * 2, rd = Math.sqrt(rnd()) * 0.5;
        fall = { x: Math.cos(da) * rd, z: Math.sin(da) * rd, t: clock }; drop.visible = true; next = clock + (puddle ? 5 + rnd() * 6 : 2.2 + rnd() * 3);
      }
    };
    water.userData.water = u;
    return g;
  }

  // One object per element, built from rounded shapes (choices): fire is a cluster of flames, water a still pool, wood a
  // young tree, metal a crystal spire, earth a boulder. Each is the same wherever it appears.
  function buildElement(THREE, name, r) {
    var g = new THREE.Group(), e = lookup(ELEMENTS, name);
    function mat(c, em, ei, rough) { return new THREE.MeshStandardMaterial({ color: c, roughness: rough == null ? 0.7 : rough, emissive: em || 0x000000, emissiveIntensity: ei || 0 }); }
    function add(geo, m, x, y, z) { var o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; }
    if (name === "Anger") { // Fire: a ring of stones and three flames
      add(new THREE.TorusGeometry(r * 0.55, r * 0.1, 8, 14), mat(0x4a3a34), 0, r * 0.1, 0).rotation.x = Math.PI / 2;
      [[0, 1], [0.25, 0.7], [-0.25, 0.75]].forEach(function (f) { var fl = add(new THREE.ConeGeometry(r * 0.2, r * f[1] * 1.5, 10), mat(0xe0602a, 0xff7a20, 0.9), f[0] * r, r * f[1] * 0.75, 0); fl.userData.flame = true; });
    } else if (name === "Sadness") { // Water: a pool that moves (Wendell, 2026-10-13: "we need to start looking at more dynamic
      // water effects than the generic geometric pool")
      buildPool(THREE, g, r);
    } else if (name === "Joy") { // Wood, as it grows underground and at a cave's mouth (Wendell, 2026-10-13: "the wood elements
      // shouldn't be underground trees thats foolish, but roots and bushes and grass makes a lot more sense"): a low bush, tufts of
      // grass round it, and a root that curls out of the stone beside them.
      var leaf = mat(0x4aa84a, 0x2a7a2a, 0.25), leaf2 = mat(0x6ac85a, 0x2a7a2a, 0.25), blade = mat(0x7ad06a, 0x2a6a2a, 0.2), root = mat(0x6a4a2a, 0, 0, 0.9);
      [[0, 0.32, 0, 0.42, leaf], [0.3, 0.26, 0.12, 0.3, leaf2], [-0.28, 0.24, -0.1, 0.32, leaf], [0.05, 0.5, -0.15, 0.26, leaf2]].forEach(function (b) {
        add(new THREE.IcosahedronGeometry(r * b[3], 1), b[4], r * b[0], r * b[1], r * b[2]).scale.set(1.15, 0.8, 1.05);
      });
      for (var gi = 0; gi < 9; gi++) {
        var ga = gi * 2.4, gr = r * (0.55 + 0.18 * (gi % 3)), gh = r * (0.35 + 0.12 * ((gi * 7) % 4));
        var bl = add(new THREE.ConeGeometry(r * 0.035, gh, 4), blade, Math.cos(ga) * gr, gh / 2, Math.sin(ga) * gr);
        bl.rotation.z = 0.25 * Math.cos(ga * 1.7); bl.rotation.x = 0.25 * Math.sin(ga * 1.3);
      }
      var curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-r * 0.7, 0, r * 0.2), new THREE.Vector3(-r * 0.75, r * 0.25, r * 0.45), new THREE.Vector3(-r * 0.45, r * 0.12, r * 0.7), new THREE.Vector3(-r * 0.2, 0, r * 0.62)]);
      add(new THREE.TubeGeometry(curve, 12, r * 0.05, 5, false), root, 0, 0, 0);
    } else if (name === "Fear") { // Metal: a crystal spire
      add(new THREE.OctahedronGeometry(r * 0.35, 0), mat(0xc8ccd4, 0x6a7080, 0.25, 0.15), 0, r * 0.9, 0).scale.set(0.6, 2, 0.6);
      add(new THREE.OctahedronGeometry(r * 0.2, 0), mat(0xaab0bc, 0x6a7080, 0.2, 0.15), r * 0.4, r * 0.35, 0).scale.set(0.6, 1.6, 0.6);
    } else { // Earth: a boulder with moss
      add(new THREE.DodecahedronGeometry(r * 0.5, 0), mat(0xa8844a, 0x4a3a1a, 0.1, 0.95), 0, r * 0.4, 0).scale.set(1.2, 0.8, 1);
      add(new THREE.SphereGeometry(r * 0.2, 10, 8), mat(0x6a8a4a), r * 0.2, r * 0.75, 0).scale.set(1.2, 0.5, 1);
    }
    return g;
  }

  // The daemon: one body for all seven, no face, fused rounded shapes. It differs by colour, posture and what it carries.
  function buildDaemon(THREE, d, h, seg) {
    var g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: d[3], roughness: 0.7, emissive: d[3], emissiveIntensity: 0.12 });
    function part(geo, x, y, z, sx, sy, sz) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; }
    var S = new THREE.SphereGeometry(1, (seg || [20, 14])[0], (seg || [20, 14])[1]), stoop = d[0] === "victim" ? 0.35 : d[0] === "damaged-self" ? 0.2 : 0;
    var u = h * 0.5;
    var torso = part(S, 0, u * 0.55, 0, u * 0.28, u * 0.5, u * 0.22);
    torso.rotation.x = stoop;
    part(S, 0, u * 1.18, stoop * u * 0.4, u * 0.19, u * 0.21, u * 0.19);            // the head: smooth, no face
    part(S, -u * 0.3, u * 0.6, 0, u * 0.09, u * 0.4, u * 0.09).rotation.z = 0.15;      // arms
    part(S, u * 0.3, u * 0.6, 0, u * 0.09, u * 0.4, u * 0.09).rotation.z = -0.15;
    part(S, -u * 0.12, u * 0.1, 0, u * 0.1, u * 0.28, u * 0.1);                       // legs
    part(S, u * 0.12, u * 0.1, 0, u * 0.1, u * 0.28, u * 0.1);
    var dark = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.5, emissive: 0x303030 });
    function carry(m) { g.add(m); }
    var c = d[4];
    if (c === "shield") { var sh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), dark); sh.scale.set(u * 0.3, u * 0.38, u * 0.05); sh.position.set(-u * 0.42, u * 0.65, u * 0.18); carry(sh); }
    if (c === "rod") { var rd = new THREE.Mesh(new THREE.CylinderGeometry(u * 0.025, u * 0.025, u * 1.5, 8), dark); rd.position.set(u * 0.42, u * 0.7, 0); carry(rd); }
    if (c === "lens") { var ln = new THREE.Mesh(new THREE.TorusGeometry(u * 0.16, u * 0.03, 8, 20), dark); ln.position.set(u * 0.42, u * 0.9, u * 0.1); carry(ln); }
    if (c === "wrench") { var wr = new THREE.Mesh(new THREE.BoxGeometry(u * 0.06, u * 0.5, u * 0.06), dark); wr.position.set(u * 0.42, u * 0.55, u * 0.05); wr.rotation.z = -0.5; carry(wr); }
    if (c === "bundle") { var bu = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), dark); bu.scale.set(u * 0.28, u * 0.22, u * 0.22); bu.position.set(0, u * 0.9, -u * 0.25); carry(bu); }
    if (c === "crack") { var cr = new THREE.Mesh(new THREE.BoxGeometry(u * 0.03, u * 0.7, u * 0.4), new THREE.MeshBasicMaterial({ color: 0x14080a })); cr.position.set(0, u * 0.6, u * 0.12); carry(cr); }
    if (c === "orb") { var ob = new THREE.Mesh(new THREE.SphereGeometry(u * 0.14, 14, 10), new THREE.MeshBasicMaterial({ color: 0xc8fff0 })); ob.position.set(0, u * 0.7, u * 0.2); carry(ob); g.userData.orb = ob; }
    g.userData.mat = mat;
    return g;
  }

  // The intensity a creature carries shows around it (Wendell, 11 October 2026: "We need there to be effects that get brighter
  // as the intensity increases and duller when they are worked though"): a soft halo and sparks rising in its colour. One aura
  // serves the room's creatures and the cave's daemons. stepAura sets it from a level, 0 (worked through) to 1 (as bright as it
  // can get).
  var AURA_SPARKS = 48, auraTex = null;
  function buildAura(THREE, r) {
    var g = new THREE.Group();
    if (!auraTex) {
      var cv = document.createElement("canvas"); cv.width = cv.height = 64; var cx = cv.getContext && cv.getContext("2d");
      if (cx) { var gr = cx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); cx.fillStyle = gr; cx.fillRect(0, 0, 64, 64); }
      auraTex = new THREE.CanvasTexture(cv);
    }
    var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.position.y = r * 0.6; g.add(halo);
    var pos = new Float32Array(AURA_SPARKS * 3), seeds = [], rnd = rngOf(hashOf("aura" + r));
    for (var i = 0; i < AURA_SPARKS; i++) seeds.push({ a: rnd() * Math.PI * 2, d: r * (0.35 + 0.4 * rnd()), y: rnd(), v: 0.25 + 0.5 * rnd() });
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var sparks = new THREE.Points(geo, new THREE.PointsMaterial({ map: auraTex, color: 0xffffff, size: r * 0.12, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.add(sparks);
    g.userData = { halo: halo, sparks: sparks, seeds: seeds, r: r, level: 0, t: 0 };
    return g;
  }
  function stepAura(aura, color, level, dt, still) {
    var u = aura.userData, r = u.r;
    u.level += (level - u.level) * Math.min(1, dt * 2); u.t += still ? 0 : dt;
    var L = u.level, pulse = still ? 0 : 0.06 * Math.sin(u.t * 2.4);
    u.halo.material.color.copy(color); u.halo.material.opacity = 0.08 + 0.62 * L;
    u.halo.scale.setScalar(r * (1.4 + 1.6 * L + pulse));
    u.sparks.material.color.copy(color); u.sparks.material.opacity = 0.15 + 0.85 * L;
    var n = Math.round(AURA_SPARKS * Math.min(1, 0.1 + L)), p = u.sparks.geometry.attributes.position;
    for (var i = 0; i < AURA_SPARKS; i++) {
      var s = u.seeds[i], y = (s.y + u.t * s.v * (0.3 + L)) % 1;
      p.array[i * 3] = Math.cos(s.a + u.t * 0.4) * s.d; p.array[i * 3 + 1] = r * (0.1 + 1.5 * y); p.array[i * 3 + 2] = Math.sin(s.a + u.t * 0.4) * s.d;
    }
    p.needsUpdate = true; u.sparks.geometry.setDrawRange(0, n);
  }
  // Allow (Wendell, 11 October 2026): "When you are allowing I want the creature to get a bit bigger. I want peopel to be able to
  // decide how large it is gets via slider and how bright it can get in its emotional color." a = { grow, bright }, each 0 to 10.
  // grow is how much larger it gets (0 its own size, 10 twice it); bright is the most it can glow, which the charge fills.
  var ALLOW_GROW = 3, ALLOW_BRIGHT = 7; // it grows a little by itself, and can glow fairly bright, until the player says otherwise
  function allowSliders(a, attr, onChange) {
    return [["grow", "How large it gets", function (v) { return v === 0 ? "its own size" : "×" + (1 + v / 10).toFixed(1); }],
      ["bright", "How bright its colour can get", function (v) { return v + " of 10"; }]].map(function (q) {
      var inp = el("input", { type: "range", min: "0", max: "10", step: "1", "aria-label": q[1] }); inp.setAttribute(attr, q[0]);
      inp.value = a[q[0]];
      var out = el("span", { class: "oagc-read", text: q[2](a[q[0]]) }); out.setAttribute(attr + "-read", q[0]);
      inp.addEventListener("input", function () { a[q[0]] = +inp.value; out.textContent = q[2](a[q[0]]); if (onChange) onChange(); });
      return el("div", {}, [el("p", { class: "oagc-note", text: q[1] }), el("div", { class: "oagc-slide" }, [inp, out])]);
    });
  }
  // How charged a creature is, 0 to 10, from its 3-2-1: the reading before while it is worked, the reading after once given.
  function heatOf(t, fallback) {
    if (!t) return fallback;
    return t.phase === "after" || t.phase === "ask" ? t.after : t.before;
  }
  function labelSprite(THREE, name, color, w) {
    var cv = document.createElement("canvas"); cv.width = 512; cv.height = 96;
    var cx = cv.getContext && cv.getContext("2d");
    if (cx) { cx.font = "600 44px -apple-system,Segoe UI,Roboto,sans-serif"; cx.textAlign = "center"; cx.fillStyle = color || "#fff1d0"; cx.fillText(name.slice(0, 22), 256, 62); }
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false })); s.scale.set(w, w * 0.1875, 1);
    return s;
  }

  // A charge worked sitting down walks with the player as a spirit until it is dismissed (Wendell, 12 October 2026, 20:43: "When
  // someone does WAVE sitting down in the big mind cave or the other cave environments it should spawn a spirit that walks with
  // the character until dismissed"). One look serves every cave: an orb in its element's colour, its aura, and its name above it.
  // followSpirits floats them toward spot(j), the j-th place in view; past SPIRITS_SHOWN they are hidden and only counted.
  var SPIRITS_SHOWN = 3;
  function buildSpirit(THREE, name, hex) {
    var g = new THREE.Group();
    var orb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.9 }));
    var au = buildAura(THREE, 0.7), label = labelSprite(THREE, name, "#fff1d0", 2.4); label.position.y = 0.95;
    g.add(orb); g.add(au); g.add(label); g.userData = { aura: au, color: new THREE.Color(hex), orb: orb, label: label, level: 0.45 };
    return g;
  }
  function followSpirits(THREE, list, spot, dt, now, still) {
    var shown = 0, v = new THREE.Vector3();
    list.forEach(function (o) {
      var g = o.g; g.visible = !o.hidden && shown < SPIRITS_SHOWN; if (!g.visible) return;
      var j = shown++, p = spot(j); v.set(p.x, p.y + (still ? 0 : 0.18 * Math.sin(now / 700 + j * 2)), p.z);
      g.position.lerp(v, Math.min(1, dt * 2.2));
      stepAura(g.userData.aura, g.userData.color, g.userData.level, dt, still);
    });
  }
  // The element's colour for a spirit, by the element's own name (Fire) or the feeling's (Anger), any case.
  function spiritHex(element) {
    var k = String(element || "").toLowerCase(), r = ELEMENTS.filter(function (x) { return x[0].toLowerCase() === k || x[1].toLowerCase() === k; })[0];
    return r ? r[3] : 0x9a9aa8;
  }

  // The 3-2-1 chat, ported from bars-engine's Clean321Flow (src/components/clean321/Clean321Flow.tsx): one thread the player
  // writes entirely (the system never writes a turn); 3 Face it, "it", one voice; 2 Talk to it, two voices with a switcher
  // (You and the daemon); 1 Be it, "I am"; a charge reading before and after. The daemon steps aside when the player says it
  // feels satisfied (board: cave-daemon-wall); another round keeps the thread and starts again at 3. Nothing leaves the page,
  // and completeClean321's rewards stay with the NOW page. Returns the page's title.
  var T321 = [
    ["it", 3, "3 · Face it", "3rd person · \"it\"", "Name {d} as \"it\", at arm's length. Describe it.", "Describe it...", "Talk to it →"],
    ["you", 2, "2 · Talk to it", "2nd person · \"you\"", "Speak to {d}, then let it answer back. Each line you send hands the voice to the other side.", "Speak to it...", "Be it →"],
    ["i", 1, "1 · Be it", "1st person · \"I am\"", "Speak as {d}. \"I am...\"", "Speak as it. \"I am...\"", "How charged is it now? →"],
  ];
  // talk321(t, o, body): o = { name, damaged (the Damaged Self's check before Be it), redraw, focus, where (the staged
  // places' words, by step), aim (a line shown on every step, or none), before(body) (more for the first page, or none),
  // ask(body) (the last page, after the charge reading), skippable (a Skip button on every page that goes straight to ask) }.
  // Wendell, 12 October 2026, 23:11: "321s are optional and should have an option to skip". The sit-down and the WAVE room
  // pass skippable; the cave's 3-2-1 with a daemon in the way does not, since it is how the daemon steps aside.
  // The cave aims it at the daemon standing in the way; the WAVE room aims it at what the player wants right now.
  var WHERE_CAVE = { 3: "You are looking at it from across the chamber.", 2: "You are face to face with it.", 1: "You are standing where it stood.", check: "You are face to face with it.", after: "You have stepped back to your own place.", paused: "You are across the chamber, at your own place." };
  function talk321(t, o, body) {
    var n = o.name, ph = t.phase, title = "3-2-1 with " + n + (t.rounds > 1 ? " · round " + t.rounds : ""), WHERE = o.where || WHERE_CAVE;
    function slider(which) {
      var inp = el("input", { type: "range", min: "0", max: "10", step: "1", "data-cave-321-charge": which, "aria-label": "Charge, 0 to 10" });
      inp.value = t[which];
      var out = el("span", { class: "oagc-read", "data-cave-321-read": which, text: t[which] + " of 10" });
      inp.addEventListener("input", function () { t[which] = +inp.value; out.textContent = t[which] + " of 10"; });
      return el("div", { class: "oagc-slide" }, [inp, out]);
    }
    var stepBack = btn("Step back", { "data-cave-321-back": "" }, function () { t.draft = ""; t.paused = true; o.redraw(); }, true);
    var skip = o.skippable ? btn("Skip the 3-2-1", { "data-cave-321-skip": "" }, function () { t.draft = ""; t.skipped = true; t.phase = "ask"; o.redraw(); }, true) : null;
    if (t.paused) {
      body.push(P("Stepped back", { "data-cave-321-step": "paused" }));
      body.push(P(WHERE.paused + " " + n + " still stands there, and your words are kept. Nothing is skipped."));
      body.push(row([btn("Go back in", { "data-cave-321-resume": "" }, function () { t.paused = false; o.redraw(); })]));
    } else if (ph === "before") {
      body.push(P("Before you start", { "data-cave-321-step": "before" }));
      body.push(P("How charged is this with " + n + " right now? The 3-2-1 cools it into something you can work with: face it, talk to it, be it."));
      body.push(slider("before"));
      if (o.before) o.before(body);
      body.push(row([btn("Run the 3-2-1", { "data-cave-321-start": "" }, function () { t.phase = 3; o.redraw(); }), skip]));
    } else if (ph === "after") {
      body.push(P("After the 3-2-1", { "data-cave-321-step": "after" }));
      body.push(P(WHERE.after, { "data-cave-321-where": "" }));
      body.push(P("How charged is it now? Before, it was " + t.before + " of 10."));
      body.push(slider("after"));
      body.push(row([btn("Continue", { "data-cave-321-after": "" }, function () { t.phase = "ask"; o.redraw(); })]));
    } else if (ph === "check") {
      // Wendell's board, bmc-safety and cave-321-damaged-self-ask: at the deepest door the cave asks first.
      body.push(P("Before you become it", { "data-cave-321-step": "check" }));
      body.push(P(WHERE.check, { "data-cave-321-where": "" }));
      body.push(P("Being " + n + " goes to the deepest place. Do you want to go on, rest, or go back up?", { "data-cave-321-checkask": "" }));
      body.push(row([
        btn("Continue", { "data-cave-321-check": "continue" }, function () { t.phase = 1; o.redraw(); }),
        btn("Rest", { "data-cave-321-check": "rest" }, function () { t.paused = true; o.redraw(); }, true),
        btn("Go back up", { "data-cave-321-check": "up" }, function () { t.phase = 2; o.redraw(); }, true),
      ]));
    } else if (ph === "ask") {
      o.ask(body);
    } else {
      var k = T321[3 - ph], voice = ph === 3 ? "you" : ph === 1 ? "it" : t.voice;
      body.push(P(k[2] + " · " + k[3], { "data-cave-321-step": k[0] }));
      body.push(P(WHERE[ph], { "data-cave-321-where": "" }));
      if (o.aim) body.push(P(o.aim, { "data-cave-321-aim": "" }));
      body.push(P(k[4].replace("{d}", n)));
      var log = el("div", { class: "oagc-log", "data-cave-321-log": "" });
      t.msgs.forEach(function (m) {
        if (m.divider) { log.appendChild(el("div", { class: "oagc-div", text: "Round " + m.round })); return; }
        log.appendChild(el("div", { class: "oagc-msg " + (m.voice === "you" ? "you" : "it"), "data-cave-bubble": m.voice, "data-cave-bubble-phase": String(m.phase) }, [
          el("small", { text: m.voice === "you" ? "You" : (m.phase === 1 ? "As " + n : n) }), el("div", { text: m.text })]));
      });
      if (!t.msgs.length) log.appendChild(el("div", { class: "oagc-div", text: "Every line is yours to write." }));
      body.push(log);
      if (ph === 2) {
        body.push(el("div", { class: "oagc-row" }, ["you", "it"].map(function (v) {
          return el("button", { class: v === t.voice ? "" : "alt", "data-cave-321-voice": v, "aria-pressed": v === t.voice ? "true" : "false", text: v === "you" ? "Speak as you" : "Speak as " + n, onclick: function () { t.voice = v; o.redraw(); o.focus(); } });
        })));
      }
      var hint = ph === 2 && t.voice === "it" ? "Answer as " + n + "..." : k[5];
      var ta = el("input", { type: "text", placeholder: hint, "data-cave-321-text": k[0], "aria-label": hint });
      ta.value = t.draft;
      var send = function () {
        var text = ta.value.trim(); if (!text) return;
        t.msgs.push({ phase: ph, voice: voice, text: text, round: t.rounds }); t.draft = "";
        // Wendell, 11 October 2026: "Automatic switching in the 2 phase to show the perspective shifting is desired." Each line
        // sent in Talk to it hands the voice to the other side, and the camera swings with it. The voice buttons still override.
        if (ph === 2) t.voice = voice === "you" ? "it" : "you";
        o.redraw(); o.focus();
      };
      ta.addEventListener("input", function () { t.draft = ta.value; });
      ta.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send(); } });
      body.push(el("div", { class: "oagc-compose" }, [ta, el("button", { "data-cave-321-send": "", "aria-label": "Send", text: "↑", onclick: send })]));
      body.push(row([btn(k[6], { "data-cave-321-next": "" }, function () { t.draft = ""; t.phase = ph === 1 ? "after" : ph === 2 && o.damaged ? "check" : ph - 1; o.redraw(); }), stepBack, skip]));
    }
    return title;
  }
  // After a chat page redraws, the text box takes focus again so the player can keep writing, and the thread scrolls to its end.
  // The panel scrolls to its end too, so the text box stays in view line after line (Wendell, 12 October 2026, 22:53:
  // "resetting and scrolling is gettin gpretty tedious").
  function focusChat(modal) {
    var i = modal.querySelector("[data-cave-321-text]"), l = modal.querySelector("[data-cave-321-log]");
    if (l) l.scrollTop = l.scrollHeight;
    if (i) modal.scrollTop = modal.scrollHeight;
    if (i) { try { i.focus({ preventScroll: true }); } catch (e) { i.focus(); } }
  }

  // ---- the page --------------------------------------------------------------------------
  // Nothing on this page is selectable, and a long press does nothing: no text selection or magnifier, no callout menu, no tap
  // highlight, no double-tap zoom. The canvas and the ring take touch-action:none (they are the hold area); buttons use
  // manipulation, so they stay tappable. Typed text in an input is the one thing that can be selected.
  var CSS = "html,body,.oagc,.oagc *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}" +
    "html{touch-action:manipulation}input,textarea,.oagc input,.oagc textarea{-webkit-user-select:text;user-select:text}" +
    ".oagc{position:fixed;inset:0;z-index:900;background:#0e0e1a;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;flex-direction:column;overflow:hidden}" +
    ".oagc canvas{display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:none}" +
    ".oagc-stage{position:absolute;inset:0;touch-action:none}" +
    ".oagc-card{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:.7rem 1rem calc(.7rem + env(safe-area-inset-bottom));background:rgba(20,20,40,.96);border-top:1px solid rgba(255,255,255,.12);max-height:62vh;overflow-y:auto;touch-action:manipulation}" +
    // the pane: small, in the scene, above the figure's head with a tail pointing down at it
    ".oagc-pane{position:absolute;left:0;top:0;z-index:3;width:max-content;max-width:min(270px,calc(100vw - 24px));padding:.45rem .65rem .5rem;background:rgba(12,12,28,.8);border:1px solid rgba(255,241,176,.55);border-radius:12px;color:#f4f4fa;font-size:15px;line-height:1.3;will-change:transform;cursor:pointer;touch-action:manipulation}" +
    ".oagc-pane strong{display:block;color:#fff1b0;font-size:16px;margin-bottom:.15rem}.oagc-pane span{display:block}.oagc-pane small{display:block;margin-top:.3rem;color:#aab0c4;font-size:12px}" +
    ".oagc-pane:after{content:'';position:absolute;left:var(--tail,50%);bottom:-8px;margin-left:-8px;border:8px solid transparent;border-bottom:0;border-top-color:rgba(255,241,176,.55)}" +
    // the modal: the pane grown large, near the top so the figure and the way ahead stay in sight below it
    ".oagc-modal{position:absolute;left:12px;right:12px;top:58px;z-index:4;max-width:420px;margin:0 auto;max-height:calc(62vh - 58px);overflow-y:auto;padding:.8rem .9rem;background:rgba(12,12,28,.86);border:1px solid rgba(255,241,176,.5);border-radius:16px;opacity:0;transform:scale(.35);pointer-events:none;transition:opacity .22s,transform .25s;touch-action:manipulation}" +
    ".oagc-modal.open{opacity:1;transform:none;pointer-events:auto}" +
    ".oagc-modal h2{margin:0 0 .35rem;font-size:1.15rem;color:#fff1b0}.oagc-modal p{margin:.35rem 0;font-size:1rem;line-height:1.35}.oagc-modal .oagc-row{margin-top:.5rem}" +
    ".oagc-card h2{margin:0 0 .3rem;font-size:1rem;color:#fff}.oagc-card h3{margin:.55rem 0 0;font-size:.82rem;color:#aab;font-weight:600}.oagc-card p{margin:.3rem 0;font-size:.92rem}" +
    ".oagc-log{display:flex;flex-direction:column;gap:.4rem;max-height:22vh;overflow-y:auto;margin:.4rem 0;padding:.3rem;border-radius:8px;background:rgba(0,0,0,.25)}" +
    ".oagc-msg{max-width:84%;padding:.35rem .55rem;border-radius:12px;font-size:.95rem;line-height:1.3;word-break:break-word}.oagc-msg small{display:block;font-size:.7rem;opacity:.75;margin-bottom:.1rem}" +
    ".oagc-msg.you{align-self:flex-end;background:rgba(150,110,255,.22);border:1px solid rgba(150,110,255,.5)}.oagc-msg.it{align-self:flex-start;background:rgba(100,200,255,.14);border:1px solid rgba(100,200,255,.5)}" +
    ".oagc-div{align-self:center;font-size:.72rem;color:#aab0c4;text-transform:uppercase;letter-spacing:.08em}" +
    ".oagc-compose{display:flex;gap:.35rem;margin-top:.4rem}.oagc-compose input{flex:1;min-width:0;min-height:44px;padding:0 .7rem;border-radius:8px;border:1px solid rgba(255,255,255,.3);background:rgba(20,20,40,.9);color:#f4f4fa;font-size:16px}" +
    ".oagc-compose button{min-width:44px;padding:.5rem}" +
    ".oagc-slide{display:flex;align-items:center;gap:.6rem;margin:.4rem 0}.oagc-slide input{flex:1;min-height:44px}.oagc-read{white-space:nowrap;font-size:.9rem;color:#fff1b0}" +
    ".oagc-note{font-size:.8rem!important;color:#aab0c4;margin:.4rem 0 0!important}" +
    ".oagc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:normal;pointer-events:none}" +
    ".oagc-row{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.4rem}" +
    ".oagc button{background:#64c8ff;color:#10142a;border:none;border-radius:8px;padding:.5rem .8rem;font-size:.9rem;font-weight:600;min-height:44px;cursor:pointer;width:auto;margin:0;touch-action:manipulation}" +
    ".oagc button:disabled{opacity:.4}" +
    ".oagc button.alt{background:rgba(20,20,40,.85);border:1px solid rgba(255,255,255,.3);color:#e0e0e0;font-weight:400}" +
    ".oagc button[aria-pressed=true]{outline:2px solid #fff}" +
    ".oagc button.oagc-calm,.oagc button.oagc-ringbtn{position:absolute;top:10px;background:rgba(20,20,40,.7);border:1px solid rgba(255,255,255,.35);color:#e8e8f0;font-weight:500;z-index:4}" +
    ".oagc button.oagc-calm{right:10px}.oagc button.oagc-ringbtn{left:10px}" +
    // the stick (left thumb) and a thing's prompt (right thumb), shared by the WAVE room and the caves
    ".oagr-door{position:absolute;right:calc(14px + env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom));z-index:6;width:min(230px,calc(100vw - 170px));padding:.6rem .7rem;background:rgba(12,12,28,.88);border:1px solid rgba(255,241,176,.55);border-radius:14px;color:#f4f4fa;touch-action:manipulation}" +
    ".oagr-door h2{margin:0 0 .2rem;font-size:1.05rem;color:#fff1b0}.oagr-door p{margin:.15rem 0 .45rem;font-size:.85rem;line-height:1.3}.oagr-door button{width:100%}.oagr-door button+button{margin-top:.35rem}" +
    ".oagr-stick{position:absolute;left:calc(16px + env(safe-area-inset-left));bottom:calc(18px + env(safe-area-inset-bottom));z-index:5;width:116px;height:116px;border-radius:50%;background:rgba(20,20,40,.45);border:2px solid rgba(255,241,176,.55);touch-action:none;display:flex;align-items:center;justify-content:center;cursor:grab}" +
    ".oagr-knob{width:48px;height:48px;border-radius:50%;background:rgba(255,241,176,.75);box-shadow:0 0 12px rgba(255,241,176,.6);pointer-events:none}" +
    ".oagc button.oagc-sitbtn{position:absolute;right:calc(14px + env(safe-area-inset-right));bottom:calc(24px + env(safe-area-inset-bottom));z-index:5;background:rgba(20,20,40,.78);border:1px solid rgba(255,241,176,.45);color:#fff1d0;font-weight:500}.oagc button.oagc-sitbtn:disabled{opacity:.35}" +
    ".oagc-orb{width:88px;height:88px;margin:.5rem auto .1rem;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff1b0;font-size:.8rem;letter-spacing:.06em;" +
    "background:radial-gradient(circle,rgba(255,241,176,.5),rgba(255,241,176,.14) 62%,rgba(255,241,176,0) 72%);border:1px solid rgba(255,241,176,.55);transform:scale(.55);will-change:transform}" +
    ".oagc button.oagc-spiritbtn{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:5;background:rgba(20,20,40,.78);border:1px solid rgba(255,241,176,.45);color:#fff1d0;font-weight:500}" +
    ".oagc-spirits{position:absolute;left:12px;right:12px;top:58px;z-index:6;max-width:420px;margin:0 auto;padding:.8rem .9rem;background:rgba(12,12,28,.92);border:1px solid rgba(255,241,176,.5);border-radius:16px}" +
    ".oagc-spirits h2{font-size:1.1rem;color:#fff;margin:0 0 .3rem}.oagc-spirits p{margin:.3rem 0;font-size:.95rem}.oagc-spirits .oagc-you{color:#fff1d0}" +
    ".oagc-style{position:absolute;top:62px;right:10px;z-index:4;max-width:calc(100vw - 20px);min-height:44px;padding:0 .6rem;border-radius:8px;border:1px solid rgba(255,255,255,.35);background:rgba(20,20,40,.85);color:#f4f4fa;font-size:16px}" +
    ".oagc-ring{position:absolute;left:50%;bottom:14px;width:88px;height:88px;margin-left:-44px;border-radius:50%;border:3px solid rgba(255,241,176,.85);background:rgba(255,241,176,.12);display:flex;align-items:center;justify-content:center;text-align:center;font-size:.68rem;line-height:1.15;color:#fff1b0;z-index:2;touch-action:none}" +
    ".oagc-fade{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .5s;z-index:5}" +
    ".oagc-home{padding:2rem 1rem;max-width:34rem;margin:auto;text-align:center}.oagc-home h1{font-size:1.5rem;color:#fff}";

  // The page-wide guards (iOS long press and pinch): no context menu, no selection start, no gesture zoom. Typed text in an
  // input is left alone. Added once; the cave test dispatches these events and checks they were cancelled.
  var guarded = false;
  function guardPage() {
    if (guarded) return; guarded = true;
    function inField(e) { var t = e.target && (e.target.nodeType === 3 ? e.target.parentNode : e.target); return !!(t && t.closest && t.closest("input,textarea")); }
    document.addEventListener("contextmenu", function (e) { if (!inField(e)) e.preventDefault(); }, true);
    document.addEventListener("selectstart", function (e) { if (!inField(e)) e.preventDefault(); }, true);
    document.addEventListener("dragstart", function (e) { e.preventDefault(); }, true);
    ["gesturestart", "gesturechange", "gestureend"].forEach(function (n) { document.addEventListener(n, function (e) { e.preventDefault(); }, { passive: false }); });
  }
  // Touches on the hold area (the canvas, the ring) are never scrolls, zooms or long presses.
  function holdArea(node) {
    ["touchstart", "touchmove"].forEach(function (n) { node.addEventListener(n, function (e) { if (e.cancelable) e.preventDefault(); }, { passive: false }); });
  }

  function start() {
    if (!document.getElementById("oagc-css")) document.head.appendChild(el("style", { id: "oagc-css", text: CSS }));
    guardPage();
    var root = document.getElementById("cave-root") || document.body;
    var home = el("div", { class: "oagc", "data-cave-home": "" }, [el("div", { class: "oagc-home" }, [
      el("h1", { text: "The Cave of Lessons" }),
      el("p", { text: "Your body is the world. Tap where the charge is, and go in." }),
      el("button", { "data-cave-dive": "", text: "Find the place", onclick: function () {
        window.OAGBody.pick().then(function (r) { if (r) dive(r.label, home); });
      } }),
      // The WAVE room on its own, from the body map (board wave-room-cave-link = both): tap where the charge is, and sit with it.
      el("p", { text: "Or sit with it at home: a room with a door, where a charge is welcomed in, worked, and let go." }),
      el("button", { class: "alt", "data-room-open": "", text: "Sit in the WAVE room", onclick: function () {
        window.OAGBody.pick().then(function (r) {
          if (r) load().then(function (A) { return homeBase(A, home, { where: r.label }); }).catch(function (e) { alert("The room could not open: " + e.message); });
        });
      } }),
    ])]);
    root.appendChild(home);
  }

  var running = null;
  function spotNamed(A, label) {
    var l = String(label).trim().toLowerCase();
    return A.spots.filter(function (s) { return s.words.toLowerCase() === l; })[0];
  }
  function dive(label, home) {
    load().then(function (A) {
      var spot = spotNamed(A, label);
      if (!spot) {
        // A typed place the figure does not name is not guessed at; the player is sent back to tap the figure.
        alert("That place is not on the figure yet. Tap the figure to choose one.");
        return;
      }
      enter(A, spot, home);
    }).catch(function (e) { alert("The cave could not open: " + e.message); });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  // Home base (LEVELS.md): the WAVE room, opened from the body map, with a portal in its wall. Going through it opens the hall of
  // the six; "Go home" from the hall or the centre comes back here. Leaving the room by its own way out ends at the front page.
  // Its Big Mind door (board dp-door) opens the Big Mind cave on this same page, with the room's spirits along; walking back out
  // of that cave's mouth comes home to the room.
  function homeBase(A, home, o) {
    var bigMind = !!(window.__oagBigMind && window.__oagBigMind.open);
    return openRoom(A, { from: "body", where: o.where, portal: true, bigMind: bigMind }).then(function (r) {
      if (r && r.portal) enter(A, null, home, { where: o.where, spirits: r.spirits || [] });
      else if (r && r.bigmind) window.__oagBigMind.open({ spirits: r.spirits || [], back: function () { homeBase(A, home, o); } });
      return r;
    });
  }

  // One sitting: the places named so far, each its own cave, joined by paths. The renderer stays up between them.
  // lv: a sitting that starts at the hall of the six (through the room's portal) in place of a doorway on the body: { where, spirits }.
  function enter(A, firstSpot, home, lv) {
    var THREE = A.THREE;
    var wrap = el("div", { class: "oagc", "data-cave-chamber": firstSpot ? firstSpot.id : "level" });
    var fade = el("div", { class: "oagc-fade" });
    // The canvas fills the page. The doorway (charge, feeling) and the path between places keep the bottom panel (card). Inside
    // the cave the words live in the pane, a small panel in the scene that follows the figure; at a stop, or when tapped, it
    // grows into the modal, which holds every choice the stop needs before the walk goes on.
    var canvasBox = el("div", { class: "oagc-stage" });
    var card = el("div", { class: "oagc-card", "data-cave-card": "", style: "display:none" });
    var pane = el("div", { class: "oagc-pane", "data-cave-pane": "", role: "button", tabindex: "0", style: "display:none" });
    var modal = el("div", { class: "oagc-modal", "data-cave-modal": "", "aria-hidden": "true" });
    var stat = el("div", { class: "oagc-sr", "data-cave-signtext": "", "aria-live": "polite" }); // the words as page text, and the state marks
    wrap.appendChild(canvasBox); wrap.appendChild(pane); wrap.appendChild(modal); wrap.appendChild(card); wrap.appendChild(stat); wrap.appendChild(fade);
    wrap.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    document.body.appendChild(wrap);
    fade.style.opacity = 1; setTimeout(function () { fade.style.opacity = 0; }, 30); // the dive: in from black
    home.style.display = "none";

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) {
      card.style.display = ""; card.textContent = "This device cannot show the cave. The body map and the game still work."; return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    canvasBox.appendChild(renderer.domElement);
    var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0c16); scene.fog = new THREE.FogExp2(0x0c0c16, 0.02);
    var camera = new THREE.PerspectiveCamera(70, 1, 0.1, 260);

    // The sitting. sens[i] = { id, spot, texture, element, saved, passed, blocked: [], skipped: [] }.
    // walk = { route, s, s0, D, t, target (a stop on the route), arrived, blk }. stack holds where each branch left from.
    // speed scales the walk clock (the test sets it above 1 to cross a stretch faster than one breath); it is 1 in play.
    var state = { sens: [], cur: null, mode: "portal", dress: null, look: { yaw: 0, pitch: 0 }, walk: null, stack: [], calm: false, ringOn: false, held: false, speed: 1, touched: false, layout: null, walkedOnce: false, modal: false, auto: null };
    var parts = {}, ch = null, flight = null, busy = false, tweens = [], blockN = 0, snapCam = true, avatar = null, lamp = null, hemi = null, glow = [], carried = [], tmpV = new THREE.Vector3();
    // A spirit that follows the player carries a small light of its own (Wendell, 2026-10-13: "The avaiable lighting centers
    // around the character and any spirits that are following them"). The spirits back from the WAVE room carry one each.
    function carryLight(obj, hex) { var l = new THREE.PointLight(hex || 0xc8e0ff, 0.6, LAMP.reach * 0.5, LAMP.decay); scene.add(l); carried.push({ obj: obj, light: l }); return l; }
    function dropLight(obj) { carried = carried.filter(function (c) { if (c.obj !== obj) return true; scene.remove(c.light); return false; }); }
    var docked = true;
    // The light of the stretch being walked (lk eases toward the table row), the walls' openness per stretch, and the surge on
    // a choice. revealed is the last stretch the player has chosen to walk; the ones past it stay gathered shut and dark until
    // the choice at their marker opens them (Wendell, 10 October: the scene changes in response to the choice).
    var lk = { idx: 0, light: new THREE.Color(STEP_LOOK[0].light), fog: new THREE.Color(STEP_LOOK[0].fog), fogK: STEP_LOOK[0].fogK, hemi: STEP_LOOK[0].hemi, flash: 0 };
    var openCur = STEP_LOOK.map(function () { return CLOSED; }), revealed = -1;
    var page = { title: "", text: "", foot: "", has: false };
    var camPos = new THREE.Vector3(), lookAt = new THREE.Vector3(), looseNow = 0, last = performance.now(), lanternsOn = [];
    var br = { b: 0.5, target: 0.5, d: 0, t0: performance.now() / 1000, ring: 0, ringHeld: false, lastRing: -1e9, k: 1 };
    var WARM = new THREE.Color(0xffa860);

    function clearScene() {
      while (scene.children.length) scene.remove(scene.children[0]);
      ch = null; flight = null; busy = false; tweens = []; avatar = null; lamp = null; hemi = null; glow = []; lanternsOn = []; carried = [];
      state.walk = null; state.stack = []; state.auto = null; snapCam = true; page.has = false;
      lk.idx = 0; lk.flash = 0; revealed = -1; openCur = STEP_LOOK.map(function () { return CLOSED; });
      scene.background.setHex(0x0c0c16); scene.fog.color.setHex(0x0c0c16);
    }
    function addSensation(spot) {
      var s = { id: spot.id, spot: spot, texture: null, element: null, saved: false, passed: 0, blocked: [], skipped: [] };
      state.sens.push(s); return s;
    }
    function size() {
      var w = canvasBox.clientWidth || 1, h = canvasBox.clientHeight || 1;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    function tween(ms, fn, done) { tweens.push({ t0: performance.now(), ms: ms, fn: fn, done: done }); }
    function ease(k) { return k * k * (3 - 2 * k); }
    function me() { return state.cur; }

    // ---- breath and calm -------------------------------------------------------------------
    var calmBtn = el("button", { class: "oagc-calm", "data-cave-calm": "", "aria-pressed": "false", text: "Calm", onclick: function () {
      state.calm = !state.calm; calmBtn.setAttribute("aria-pressed", String(state.calm)); syncRing();
    } });
    var ringBtn = el("button", { class: "oagc-ringbtn", "data-cave-ringbtn": "", "aria-pressed": "false", text: "Breath ring", onclick: function () {
      state.ringOn = !state.ringOn; ringBtn.setAttribute("aria-pressed", String(state.ringOn)); syncRing();
    } });
    var ring = el("div", { class: "oagc-ring", "data-cave-ring": "", text: "Hold to breathe in. Let go to breathe out." });
    function ringDown(e) { e.preventDefault(); try { ring.setPointerCapture(e.pointerId); } catch (x) {} br.ringHeld = true; br.lastRing = performance.now() / 1000; }
    function ringUp() { br.ringHeld = false; br.lastRing = performance.now() / 1000; }
    holdArea(ring);
    ring.addEventListener("pointerdown", ringDown); ring.addEventListener("pointerup", ringUp); ring.addEventListener("pointercancel", ringUp);
    function syncRing() {
      var show = state.ringOn && !state.calm;
      if (show && !ring.parentNode) canvasBox.appendChild(ring); else if (!show && ring.parentNode) ring.remove();
      if (!show) br.ringHeld = false;
    }
    canvasBox.appendChild(calmBtn); canvasBox.appendChild(ringBtn);
    // The branch's style: shown while walking a face's branch, set to that face at first; any face's look can dress it.
    var styleSel = el("select", { class: "oagc-style", "data-cave-branch-style": "", "aria-label": "This branch's style" });
    FACES.forEach(function (f) { styleSel.appendChild(el("option", { value: f[0], text: f[1] + " · " + FACE_LOOK[f[0]].vibe })); });
    styleSel.style.display = "none"; canvasBox.appendChild(styleSel);
    styleSel.addEventListener("change", function () {
      var r = state.walk && state.walk.route; if (!r || r.kind !== "face") return;
      r.style = styleSel.value; lk.flash = Math.max(lk.flash, 0.5);
      r.markers.forEach(function (m) { if (m.material.color) m.material.color.setHex(lookup(FACES, r.style)[4]); });
    });
    var styleFor = null;
    function syncStyle(route) {
      var on = route.kind === "face" && !flight && !modal.classList.contains("open"); // out of the way of the page
      if (on && styleFor !== route) { styleSel.value = route.style; styleFor = route; }
      if (!on) styleFor = null;
      var d = on ? "" : "none"; if (styleSel.style.display !== d) styleSel.style.display = d;
    }
    function breathStep(dt, nowS) {
      var T = BREATH_S, u, wk = state.walk;
      if (state.calm) { br.target = 0.5; br.d = 0; }
      else if (state.ringOn && nowS - br.lastRing < HOLD_ABOUT_AFTER) {
        var prev = br.ring;
        br.ring = clamp(br.ring + (br.ringHeld ? dt / BREATH.inS : -dt / BREATH.outS), 0, 1);
        br.target = br.ring; br.d = (br.ring - prev) / Math.max(dt, 1e-3);
      } else {
        var tm = (((nowS - br.t0) % T) + T) % T;
        if (tm < BREATH.inS) { u = tm / BREATH.inS; br.target = 0.5 - 0.5 * Math.cos(Math.PI * u); br.d = (Math.PI / 2) * Math.sin(Math.PI * u) / BREATH.inS; }
        else { u = (tm - BREATH.inS) / BREATH.outS; br.target = 0.5 + 0.5 * Math.cos(Math.PI * u); br.d = -(Math.PI / 2) * Math.sin(Math.PI * u) / BREATH.outS; }
        if (state.ringOn) br.ring = br.target;
      }
      br.b += (br.target - br.b) * Math.min(1, dt * 8);
      br.k = 1 + 0.08 * (br.b - 0.5);
      if (state.calm) { br.b = 0.5; br.k = 1; }
    }

    // ---- input: hold to walk, drag to look, tap an object -------------------------------------
    // One touch does both (Wendell, 2026-10-13: "For navigation one needs to be able to look walk and pan in the same touch.
    // One keeps walking even as they drag to move the camera. Should follow touch rules so dragging down moves the camera down
    // and pushing up moves the camera up (and has it looking down on the character)"). A drag no longer stops the walk; the
    // look eases back behind the figure only once the thumb has rested a moment (LOOK.settle).
    // The camera goes where the finger goes, as if it were the viewer's head (Wendell, 2026-10-13): a drag to the right
    // swings the camera to the figure's right, a drag up lifts it, a drag down lowers it. A positive yaw is the right.
    var ray = new THREE.Raycaster(), drag = null, dom = renderer.domElement;
    holdArea(dom);
    dom.addEventListener("pointerdown", function (e) {
      try { dom.setPointerCapture(e.pointerId); } catch (x) {}
      drag = { x: e.clientX, y: e.clientY, moved: 0, t: Date.now(), last: 0 }; state.held = true;
    });
    dom.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
      if (drag.moved > 12) {
        drag.last = Date.now();
        state.look.yaw = clamp(state.look.yaw + dx * 0.006, -Math.PI, Math.PI);
        state.look.pitch = clamp(state.look.pitch + dy * LOOK.pitchPerPx, LOOK.pitch[0], LOOK.pitch[1]);
      }
    });
    function lift() { state.held = false; drag = null; }
    dom.addEventListener("pointercancel", lift);
    dom.addEventListener("pointerup", function (e) {
      var wasTap = drag && drag.moved < 8 && Date.now() - drag.t < 350; lift();
      if (!wasTap || !ch || busy) return;
      var r = dom.getBoundingClientRect(), c = ctxOf();
      ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera);
      var kids = [];
      if (c && c.elObj) c.elObj.traverse(function (m) { if (m.isMesh) kids.push(m); });
      var hit = ray.intersectObjects(kids)[0];
      if (hit && hit.object.userData.interact) touch();
    });

    // ---- the pane and the modal ------------------------------------------------------------
    function openModal() {
      if (docked) return;
      var r = pane.getBoundingClientRect(), m = modal.getBoundingClientRect();
      if (r.width) modal.style.transformOrigin = Math.round(r.left + r.width / 2 - m.left) + "px " + Math.round(r.top + r.height / 2 - m.top) + "px";
      state.modal = true; modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); pane.style.visibility = "hidden";
    }
    function closeModal() { state.modal = false; modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); pane.style.visibility = ""; }
    pane.addEventListener("click", function () { openModal(); });
    // fill puts a page up. The doorway's pages (dock true) are the bottom panel, as they were. Inside the cave the title and the
    // first paragraph are the pane, which follows the figure and stays readable the whole walk; the modal holds the whole page:
    // every paragraph and every choice. A page with choices opens the modal (a stop); a page without them keeps the pane.
    function fill(title, kids, dock) {
      stat.removeAttribute("data-cave-marker"); stat.removeAttribute("data-cave-walking");
      card.innerHTML = ""; stat.innerHTML = ""; modal.innerHTML = ""; docked = !!dock;
      if (docked) {
        closeModal(); pane.style.display = "none";
        card.style.display = "";
        card.appendChild(el("h2", { text: title }));
        kids.forEach(function (k) { card.appendChild(k); });
        return;
      }
      card.style.display = "none";
      var paras = [], foot = "", ctls = [];
      kids.forEach(function (k) { if (k.tagName === "P") { if (k.hasAttribute("data-cave-hint")) foot = k.textContent; else paras.push(k); } else ctls.push(k); });
      stat.appendChild(el("h2", { text: title })); paras.forEach(function (p) { stat.appendChild(el("p", { text: p.textContent })); });
      page.title = title; page.text = paras.length ? paras[0].textContent : ""; page.foot = foot; page.has = true;
      pane.innerHTML = "";
      pane.appendChild(el("strong", { text: title }));
      if (page.text) pane.appendChild(el("span", { text: page.text }));
      if (foot) pane.appendChild(el("small", { text: foot }));
      pane.style.display = "";
      modal.appendChild(el("h2", { text: title }));
      paras.forEach(function (p) { modal.appendChild(p); });
      ctls.forEach(function (c) { modal.appendChild(c); });
      if (ctls.length) { modal.appendChild(row([btn("Look around", { "data-cave-shrink": "" }, closeModal, true)])); openModal(); }
      else { modal.appendChild(row([btn("Keep walking", { "data-cave-close": "" }, closeModal, true)])); closeModal(); }
    }

    // ---- the doorway: one question per page, and the cave changes with each answer -------------
    function portal(s) {
      clearScene(); state.cur = s; state.mode = "portal"; state.look = { yaw: 0, pitch: 0 };
      scene.fog.density = 0.02; camera.position.set(0, 0, 6); camera.rotation.set(0, 0, 0);
      scene.add(new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.12, 10, 36), new THREE.MeshBasicMaterial({ color: 0xfff1b0 })));
      scene.add(new THREE.HemisphereLight(0xffffff, 0x302828, 0.5));
      wrap.setAttribute("data-cave-chamber", s.id);
      s.texture = null; s.element = null; s.passed = 0;
      fill("A doorway at " + s.spot.words, [
        P("What does it feel like there?"),
        choice(TEXTURES.map(function (t) { return [t[0], t[1]]; }), null, function (o) { s.texture = o[0]; form(s); }),
      ], true);
      stat.setAttribute("data-cave-place", "portal");
    }

    // The cave forms around the charge at once, with the avatar standing at the start. The way ahead stays gathered shut until
    // the feeling is named: that choice opens the first stretch.
    function form(s) {
      clearScene(); parts = {}; state.mode = "chamber"; state.look = { yaw: 0, pitch: 0 }; state.touched = false;
      var look = CHARGE_LOOK[s.texture] || CHARGE_LOOK.other, tex = lookup(TEXTURES, s.texture) || TEXTURES[4];
      var G = {}; Object.keys(A.kit).forEach(function (k) { G[k] = geomOf(THREE, A.kit[k]); });
      var w = CHAMBER.w * look.w, h = CHAMBER.h;
      parts.G = G; parts.w = w; parts.h = h; parts.fog = look.fog;
      parts.tiles = A.tiles; parts.rock = stoneOf(THREE, A.tiles, tex[2]);
      var main = layoutMain(s.spot.id + ":" + s.texture, w);
      main.group = new THREE.Group(); main.w = w;
      main.openAt = function (sv) { // stretch q runs from marker q-1 to marker q; past a marker its walls ease over 8 units into the next
        var st = main.stops, q = 0; while (q < st.length - 1 && st[q].s < sv) q++;
        if (q === 0) return openCur[0];
        var u = clamp((sv - st[q - 1].s) / 8, 0, 1); u = u * u * (3 - 2 * u);
        return openCur[q - 1] * (1 - u) + openCur[q] * u;
      };
      parts.shape = CAVE_SHAPE[s.texture] || CAVE_SHAPE.other;
      main.tube = buildTube(THREE, main, { w: w, h: h, rock: parts.rock, openAt: main.openAt, seed: hashOf(s.spot.id) % 97, shape: parts.shape });
      main.group.add(main.tube.mesh); main.group.add(buildPebbles(THREE, main, w, h, 0, main.len));
      // the tunnel's first end is stone, so looking back from the start shows rock, not the dark outside. It is drawn only
      // while the camera is in front of it: at the start the camera can sit behind it, and then it would hide everything.
      var a0m = at(main, 0.4), capM = new THREE.Mesh(new THREE.CircleGeometry(1, 28), parts.rock);
      capM.position.set(a0m.x, a0m.y + h * 0.1, a0m.z); capM.rotation.y = Math.atan2(a0m.fx, a0m.fz); capM.scale.set(w * OPEN_MAX * 1.4, h * 1.6, 1); main.group.add(capM);
      main.cap = { mesh: capM, x: a0m.x, z: a0m.z, fx: a0m.fx, fz: a0m.fz };
      main.dressing = buildDressing(THREE, main, G, { w: w, h: h, rock: parts.rock, s0: 0, s1: main.len, seed: s.spot.id + ":" + s.texture + ":dress", clear: [main.startS + 9, main.exitS] });
      main.group.add(main.dressing); darken(parts.shape, parts.rock, main.dressing);
      state.cave = { shape: CAVE_SHAPE[s.texture] ? s.texture : "other", walls: parts.rock.visible, roof: parts.shape.roof, e: parts.shape.e };
      state.dressing = main.dressing.userData.items.map(function (it) { return it.piece; });
      state.crystals = main.dressing.userData.items.filter(function (it) { return it.look && it.piece === "crystal_cluster"; }).map(function (it) { return it.look; });
      state.spires = main.dressing.userData.items.filter(function (it) { return it.piece === "stone_spire"; }).map(function (it) { return { zone: it.zone, len: it.look.len, fat: it.look.fat }; });
      state.dressZones = main.dressing.userData.items.map(function (it) { return it.piece + ":" + it.zone; });
      main.markers = main.stops.map(function (st, i) {
        var m = buildMarker(THREE, w, h, STEP_LOOK[i].light), a = at(main, st.s + MARK_AHEAD); m.position.set(a.x, a.y - h * 0.92 + MARK_Y, a.z); main.group.add(m); return m;
      });
      main.ctx = { holder: new THREE.Group(), lampHex: 0xffe0b0 };
      var ea = at(main, main.startS + 9), side = Math.min(w * 0.4, 2);
      main.ctx.holder.position.set(ea.x + -ea.fz * -side, -h * 0.92, ea.z + ea.fx * -side);
      main.group.add(main.ctx.holder);
      var xa = at(main, main.exitS - 0.2), arch = new THREE.Mesh(G.portal_arch, new THREE.MeshBasicMaterial({ color: 0xfff1b0 }));
      arch.position.set(xa.x, -h * 0.92, xa.z); arch.rotation.y = yawFacing(xa); arch.scale.setScalar(Math.min(w * 0.55, h * 0.7));
      main.group.add(arch); main.arch = arch;
      var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 40, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
      beam.position.set(xa.x, 18, xa.z); main.group.add(beam);
      scene.add(main.group); ch = { main: main, w: w, h: h };
      lamp = new THREE.PointLight(0xffe0b0, 1.1, LAMP.reach, LAMP.decay); scene.add(lamp);
      hemi = new THREE.HemisphereLight(0xffffff, 0x302828, 0.45 * LAMP.ambient); scene.add(hemi);
      scene.fog.density = look.fog * STEP_LOOK[0].fogK;
      lk.idx = 0; lk.light.setHex(STEP_LOOK[0].light); lk.fog.setHex(STEP_LOOK[0].fog); lk.fogK = STEP_LOOK[0].fogK; lk.hemi = STEP_LOOK[0].hemi; lk.flash = 0;
      scene.background.copy(lk.fog); scene.fog.color.copy(lk.fog);
      avatar = buildAvatar(THREE, s.texture); scene.add(avatar);
      parts.dress = { wall: tex[2], width: Math.round(w * 100) / 100, fog: look.fog, element: null, lamp: 0xffe0b0 };
      state.dress = parts.dress;
      state.layout = { seed: s.spot.id + ":" + s.texture, rows: main.rows, stops: main.stops.map(function (v) { return Math.round(v.s * 100) / 100; }), length: Math.round(main.len * 10) / 10 };
      state.walk = newWalk(main, null, main.startS);
      state.mainRoute = main;
      looseNow = 0;
      feeling(s);
    }
    function feeling(s) {
      fill("Which feeling is here?", [
        P("The walls have taken your " + lookup(TEXTURES, s.texture)[1] + ". Its feeling has an element. Naming it opens the way."),
        choice(ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }), null, function (o) {
          s.element = o[0]; setElementOn(state.mainRoute.ctx, o[0], Math.min(ch.w * 0.3, 1.3)); layPuddles(state.mainRoute, s.spot.id + ":" + s.texture, o[0]); parts.dress.element = o[0]; parts.dress.lamp = lookup(ELEMENTS, o[0])[3];
          hint(0);
        }),
        row([btn("I don't know", { "data-cave-element-unknown": "" }, function () { s.element = null; layPuddles(state.mainRoute, "", null); hint(0); }, true)]),
      ], true);
      stat.setAttribute("data-cave-place", "portal");
    }
    function setElementOn(ctx, name, r) {
      var e = lookup(ELEMENTS, name);
      while (ctx.holder.children.length) ctx.holder.remove(ctx.holder.children[0]);
      var obj = buildElement(THREE, name, r);
      obj.traverse(function (m) { if (m.isMesh) { m.userData.interact = name; if (m.material.emissiveIntensity) glow.push({ m: m.material, base: m.material.emissiveIntensity }); } });
      ctx.holder.add(obj); ctx.elObj = obj; ctx.lampHex = e[3]; ctx.element = name;
    }

    // ---- walking ---------------------------------------------------------------------------
    function newWalk(route, blk, s) { return { route: route, s: s, s0: s, sMin: s, D: 1, t: 0, ready: false, moving: false, target: 0, arrived: false, blk: blk, lat: 0, dir: 1, yaw: null, near: null }; }
    function ctxOf() { return state.walk && state.walk.route.ctx; }
    function stopAt(route, place) { for (var i = 0; i < route.stops.length; i++) if (route.stops[i].place === place) return route.stops[i]; return null; }
    function stopOf(wk) { return wk.route.stops[wk.target]; }
    var PLACE_ASK = { mouth: "What is the block like, in the body?", pool: "Which feeling is here? Tap its element.", passage: "A daemon stands in the way.",
      gate: "Six stones, one for each face. Each opens a branch of its own.", way_out: "Light from above. Breathe out." };
    // hint(i) starts the walk to stop i of the route the avatar is on: the pane shows where it is going, the clock is reset, and
    // on the main path the stretch is opened (the choice at the last marker is what opens it).
    function hint(i) {
      var wk = state.walk, stp = wk.route.stops[i], kind = wk.route.kind, label, words;
      wk.target = i;
      stat.setAttribute("data-cave-place", "walk");
      if (wk.route.loop) wk.s = ((wk.s % wk.route.len) + wk.route.len) % wk.route.len; // round a ring, the next stop is always ahead
      if (stp.level) { label = stp.walkTitle || stp.title; words = stp.walkWords || stp.words; }
      else if (stp.wave != null) { label = WAVE[i][1]; words = WAVE[i][2]; }
      else if (stp.face) { var f = lookup(FACES, stp.face); label = f[1] + "'s branch"; words = f[3]; }
      else { var pl = PLACE_BY[stp.place]; label = pl.step + (stp.stone != null ? " · " + FACES[stp.stone][1] : ""); words = stp.stone != null ? FACES[stp.stone][1] + ": " + FACES[stp.stone][2] + ". Its branch opens here." : PLACE_ASK[stp.place]; }
      var kids = [P(words)];
      if (!state.walkedOnce) kids.push(P("Walk with the stick, or the arrow keys. Drag to look. Tap these words to open them.", { "data-cave-hint": "" }));
      fill(label, kids);
      stat.setAttribute("data-cave-walking", stp.level ? "level-" + stp.level + (stp.toFace ? "-" + stp.toFace : "") : stp.wave != null ? WAVE[i][0] : stp.face ? "face-" + stp.face : stp.place);
      wk.arrived = false; wk.ready = true; wk.s0 = wk.s; wk.D = Math.max(1, stp.s - wk.s + (wk.route.loop && stp.s <= wk.s ? wk.route.len : 0)); wk.t = 0; wk.moving = false;
      var was = wk.near; hidePrompt();
      if (was != null && was !== i) wk.quiet = was; // the stop just chosen at stays quiet until the figure walks off it
      if (avatar) { avatar.userData.stepIdx = 0; avatar.userData.stepsIn = 0; avatar.userData.stepsOut = 0; }
      if (kind === "main") { if (i > revealed) { revealed = i; lk.flash = 1; } }
      else lk.flash = Math.max(lk.flash, 0.5);
    }
    function arrive() {
      var wk = state.walk, stp = stopOf(wk);
      if (stp.level) levelCard(stp);
      else if (stp.wave != null) markerCard(wk.target);
      else if (stp.face) faceCard(wk.blk);
      else placeCard(wk.blk);
    }
    // ---- free walking (Wendell, 14 October 2026: "Ok I think we've reached the maturity where we don't have to have the walking
    // happening on rails. It's causing more trouble than it's work and we need to test the ergonomics of Freeform navigation in
    // preparation of introducing running") -------------------------------------------------------------------------------
    // The stick at the bottom left, or the arrow keys and W A S D, walk the figure wherever the thumb points as the camera sees
    // it, at one steady WALK_SPEED, as in the WAVE room. The figure keeps to the tunnel: wk.s is how far along the path it is and
    // wk.lat how far to one side of the path's line, held inside the floor. The way ahead past the stop being walked to stays
    // gathered shut, so on the main path and a branch the figure walks up to that stop and no further; in the levels it walks
    // anywhere. Coming to a stop shows its prompt by the right thumb (DESIGN.md, the five phone-game rules); a tap there opens
    // its page. state.auto is still a short walk the game takes itself: up out of a branch onto the path it left from.
    var stick = { x: 0, z: 0 }, keys = {}, stickId = null;
    var stickPad = el("div", { class: "oagr-stick", "data-cave-stick": "", "aria-label": "Walk", role: "slider", style: "display:none" });
    var stickKnob = el("div", { class: "oagr-knob" }); stickPad.appendChild(stickKnob); canvasBox.appendChild(stickPad);
    var promptBox = el("div", { class: "oagr-door", "data-cave-prompt-box": "", style: "display:none" }); canvasBox.appendChild(promptBox);
    function stickAt(e) { // a hidden stick lets go (the WAVE room's iPhone fix: a hidden stick measures 0 wide)
      var rc = stickPad.getBoundingClientRect(), r = rc.width / 2;
      if (!(r > 0) || stickPad.style.display === "none") { stickUp(); return; }
      var dx = e.clientX - rc.left - r, dy = e.clientY - rc.top - r, d = Math.hypot(dx, dy), m = Math.min(d, r);
      stick.x = d ? dx / d * m / r : 0; stick.z = d ? dy / d * m / r : 0;
      stickKnob.style.transform = "translate(" + stick.x * r * 0.6 + "px," + stick.z * r * 0.6 + "px)";
    }
    function stickUp() { stickId = null; stick.x = 0; stick.z = 0; stickKnob.style.transform = ""; }
    holdArea(stickPad);
    stickPad.addEventListener("pointerdown", function (e) { e.preventDefault(); stickId = e.pointerId; try { stickPad.setPointerCapture(e.pointerId); } catch (x) { /* old browsers */ } stickAt(e); });
    stickPad.addEventListener("pointermove", function (e) { if (e.pointerId === stickId) stickAt(e); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (n) { stickPad.addEventListener(n, function (e) { if (e.pointerId === stickId) stickUp(); }); });
    var KEYS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    function typing() { var a = document.activeElement; return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT"); }
    function keyDown(e) { if (!KEYS[e.code] || typing() || !canWalk()) return; keys[e.code] = true; e.preventDefault(); }
    function keyUp(e) { delete keys[e.code]; }
    window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);
    // The stick shows whenever the walk is in view, and hides only while a page is open (rule 5) or the game has the figure.
    function canWalk() { return state.mode === "chamber" && !!state.walk && state.walk.ready && !state.modal && !sit && !busy && !flight && !state.rise; }
    function wantWalk() {
      var x = stick.x, z = stick.z; Object.keys(keys).forEach(function (k) { x += KEYS[k][0]; z += KEYS[k][1]; });
      var m = Math.hypot(x, z); if (!(m >= 0.15)) return null; if (m > 1) { x /= m; z /= m; m = 1; }
      var fx = lookAt.x - camPos.x, fz = lookAt.z - camPos.z, fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
      return { x: -z * fx - x * fz, z: -z * fz + x * fx, m: m, fwd: -z / m }; // forward times -z, plus right (-fz, fx) times x
    }
    function wrapAng(d) { while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
    // How far along and to the side the figure may stand on the route it is walking.
    function walkRange(wk) {
      var r = wk.route, stp = r.stops[wk.target], hw = (r.w || ch.w) * (r.kind === "main" || r.level ? r.openAt(wk.s) : SIDE_LOOK.open);
      var lo = r.loop ? -Infinity : Math.max(r.level ? 0.8 : wk.sMin, 0.8), hi = r.loop ? Infinity : r.len - 0.8;
      if (!r.level && stp) hi = Math.min(hi, stp.s + 0.6); // the way ahead stays gathered shut until its stop's choice
      if (r.level && !r.loop) hi = Math.min(hi, r.stops[r.stops.length - 1].s + 1.2); // a face's tunnel ends at its arch
      var outer = r.doors ? -r.inner : 1, lim = hw * 0.6;
      return { lo: lo, hi: hi, latLo: r.doors ? (outer > 0 ? -hw * 0.9 : -lim) : -lim, latHi: r.doors ? (outer > 0 ? lim : hw * 0.9) : lim };
    }
    function walkStep(dt) {
      var wk = state.walk; if (!wk) return;
      wk.moving = false;
      var au = state.auto;
      if (au) {
        au.k = Math.min(1, au.k + dt / au.dur); wk.s = au.s0 + (au.s1 - au.s0) * ease(au.k); wk.lat *= 1 - Math.min(1, dt * 3); wk.moving = true; au.clk += dt;
        if (wk.camYaw != null) wk.camYaw += wrapAng(yawFacing(at(wk.route, wk.s)) - wk.camYaw) * Math.min(1, dt * 3); // the camera follows the game's own walk
        if (au.k >= 1) { state.auto = null; wk.moving = false; au.done(); }
        return;
      }
      var on = canWalk();
      stickPad.style.display = on ? "" : "none";
      if (!on) { if (stickId != null) stickUp(); keys = {}; if (promptBox.style.display !== "none" && (state.modal || sit || busy)) promptBox.style.display = "none"; return; }
      if (wk.near != null && promptBox.style.display === "none" && !wk.arrived) showPrompt(wk.route.stops[wk.near]);
      if (wk.arrived) wk.lat *= 1 - Math.min(1, dt * 2); // standing at a stop is standing on its spot
      var w = wantWalk();
      if (w) {
        var r = wk.route, a = at(r, wk.s), nx = -a.fz, nz = a.fx, sp = WALK_SPEED * state.speed * (state.calm ? 0.8 : 1) * w.m;
        var along = w.x * a.fx + w.z * a.fz, side = w.x * nx + w.z * nz;
        // Walking away from the camera against the way it faces (the camera turned round by a drag): the camera takes that way
        // as ahead, and the turn is kept in the look so the view does not jump; it eases back behind the figure as it walks.
        if (wk.camYaw == null) wk.camYaw = yawFacing(a);
        if (state.look.yaw && !state.peek) { wk.camYaw = wrapAng(wk.camYaw + state.look.yaw); state.look.yaw = 0; } // a look turned by hand becomes the way the camera follows
        var lim = walkRange(wk), s1 = clamp(wk.s + along * sp * dt, lim.lo, lim.hi);
        var deadEnd = !r.loop && along < -0.2 && s1 <= lim.lo + 1e-3;
        if (r.loop) s1 = ((s1 % r.len) + r.len) % r.len;
        var lat1 = clamp(wk.lat + side * sp * dt, lim.latLo, lim.latHi);
        var p0 = at(r, wk.s), x0 = p0.x - p0.fz * wk.lat, z0 = p0.z + p0.fx * wk.lat;
        wk.s = s1; wk.lat = lat1;
        var p1 = at(r, wk.s), mx = p1.x - p1.fz * wk.lat - x0, mz = p1.z + p1.fx * wk.lat - z0, moved = Math.hypot(mx, mz);
        if (moved > 1e-4) {
          wk.moving = true; state.walkedOnce = true; wk.t += dt * state.speed * w.m * STRIDE_K;
          var my = Math.atan2(mx, mz); // the way the figure actually went: along a wall it slides, so it faces along the wall
          wk.yaw = wk.yaw == null ? my : wk.yaw + wrapAng(my - wk.yaw) * Math.min(1, dt * 10);
          // Walking away from the camera, it comes round behind the figure; walking back or sideways it stays put, so the thumb
          // keeps meaning the same way (the WAVE room's rule).
          // It turns along the way, the way the figure is going, so up on the stick keeps walking round the bends of a tunnel and
          // round the ring of the hall and the centre to the next door; across the way the thumb goes sideways. (Turning toward
          // wherever the figure went made a held diagonal chase itself round the hall's ring into its walls.)
          if (w.fwd > 0.3) {
            if (Math.abs(along) > 0.2 && !deadEnd) wk.dir = along > 0 ? 1 : -1;
            var want = yawFacing(at(r, wk.s)) + (wk.dir < 0 ? Math.PI : 0);
            wk.camYaw += wrapAng(want - wk.camYaw) * Math.min(1, dt * 2.5 * w.fwd);
          }
        }
        if (deadEnd && w.fwd > 0.3) {
          // Pushed ahead into the dead end behind (the start of a branch, the way back): the camera turns round to the open way.
          wk.dir = 1; wk.camYaw += wrapAng(yawFacing(a) - wk.camYaw) * Math.min(1, dt * 2.5 * w.fwd);
        }
      }
      stopZones(wk);
    }
    function wrapLoop(r, d) { return d - r.len * Math.round(d / r.len); }
    // ---- stops are places the figure walks up to: a prompt by the right thumb, the page from a tap ------------------------
    // On the main path and a branch the stop is the one being walked to; in the levels every stop is a door or a place to stand,
    // and the one the figure is at becomes the one walked to. A zone shows a little sooner than it hides (rule 3).
    function stopGap(r, st, s) { return r.loop ? Math.abs(wrapLoop(r, s - st.s)) : Math.abs(s - st.s); }
    function stopZones(wk) {
      var r = wk.route, idx = null;
      if (wk.quiet != null && (!r.stops[wk.quiet] || stopGap(r, r.stops[wk.quiet], wk.s) > 3.4)) wk.quiet = null;
      if (wk.near != null && r.stops[wk.near] && stopGap(r, r.stops[wk.near], wk.s) < 3.4) idx = wk.near;
      else (r.level ? r.stops.map(function (st, i) { return i; }) : [wk.target]).forEach(function (i) {
        if (idx == null && i !== wk.quiet && r.stops[i] && stopGap(r, r.stops[i], wk.s) < 2.2) idx = i;
      });
      if (idx === wk.near) return;
      if (idx == null) { // walked off: the prompt goes, and a stop that was open is left (walking away is how a player says no)
        wk.near = null; hidePrompt();
        if (wk.arrived) { wk.arrived = false; hint(wk.target); }
        return;
      }
      if (r.level && idx !== wk.target) hint(idx);
      wk.near = idx; showPrompt(r.stops[idx]);
    }
    function hidePrompt() { promptBox.style.display = "none"; promptBox.innerHTML = ""; var wk = state.walk; if (wk) wk.near = null; }
    function showPrompt(stp) {
      var words, title, kids = [];
      if (stp.level) { title = stp.title; words = stp.words; }
      else if (stp.wave != null) { title = WAVE[state.walk.target][1]; words = WAVE[state.walk.target][2]; }
      else if (stp.face) { var f0 = lookup(FACES, stp.face); title = f0[1] + " asks"; words = f0[3]; }
      else { var pl = PLACE_BY[stp.place]; title = pl.step + (stp.stone != null ? " · " + FACES[stp.stone][1] : ""); words = stp.stone != null ? FACES[stp.stone][2] + "." : PLACE_ASK[stp.place]; }
      kids.push(el("h2", { text: title })); // a stop's words are in the pane above the figure; a door's question goes with its way through
      if (stp.toFace) kids.push(P(words, { "data-level-asks": stp.toFace }));
      if (stp.level === "door" || stp.level === "portal") { // a door shows its way through, as the WAVE room's doors do
        var f = lookup(FACES, stp.toFace), go = { "data-level-go-face": f[0] }; go[stp.level === "door" ? "data-level-door" : "data-level-portal"] = f[0];
        if (stp.level === "door" && state.level.visited.indexOf(f[0]) >= 0) kids.push(P("You have walked this one. Its lantern is lit."));
        kids.push(btn("Go through", go, function () { hidePrompt(); goTo("tunnel", f[0]); }));
      } else if (stp.level === "home") kids.push(btn("Go home", { "data-level-home": "" }, function () { hidePrompt(); goHome(); }));
      else if (stp.level === "ways") kids.push(btn("Back to the hall", { "data-level-hall": "" }, function () { hidePrompt(); goTo("hall"); }), btn("Go home", { "data-level-home": "" }, function () { hidePrompt(); goHome(); }, true));
      else kids.push(btn("Stop here", { "data-cave-stop": "" }, stopHere));
      promptBox.innerHTML = ""; kids.forEach(function (k) { promptBox.appendChild(k); }); promptBox.style.display = ""; sitBtn.style.display = "none"; // one prompt at a time
    }
    // A tap on the prompt: the figure stops at the stop, and its page opens.
    function stopHere() {
      var wk = state.walk; if (!wk || busy) return;
      promptBox.style.display = "none"; wk.arrived = true; wk.moving = false; stickUp(); keys = {}; arrive();
    }
    function autoWalk(s1, done) {
      var wk = state.walk; state.auto = { s0: wk.s, s1: s1, k: 0, dur: Math.max(0.5, Math.abs(s1 - wk.s) / 7) / Math.max(1, state.speed / 4), clk: 0, done: done };
    }

    // ---- the main path's markers: go on, or "this step won't go further" ---------------------------
    function markerCard(i) {
      var s = me(), wv = WAVE[i], last = i === WAVE.length - 1, body = [];
      stat.setAttribute("data-cave-place", "marker");
      if (s.blocked.indexOf(wv[0]) >= 0) body.push(P("You came back round to " + wv[1] + ". The way you looped is lit beside you.", { "data-cave-back": "" }));
      body.push(P(wv[2], { "data-cave-prompt": "" }));
      if (!last) body.push(P("The way ahead is gathered shut. It opens when you choose.", { "data-cave-shut": "" }));
      var kids = [btn(last ? "Come back out" : "Go on", { "data-cave-go": "" }, function () { goOn(i); }), btn("This step won't go further", { "data-cave-block": "" }, function () { openBlock(wv[0], wv[1]); }, true)];
      body.push(row(kids));
      if (last) {
        var rest = state.sens.filter(function (o) { return o !== s; });
        if (rest.length) body.push(P("Other places showed up in this sitting. A path runs to each from here."));
        if (rest.length) body.push(row(rest.map(function (o) {
          return btn((o.saved ? "Back to " : "Follow the path to ") + o.spot.words, { "data-cave-portal": o.id }, function () { follow(o.id); }, true);
        })));
        body.push(P("Is anything else showing up somewhere else in your body?"));
        body.push(row([btn("Yes, name another place", { "data-cave-add": "" }, addPlace, true)]));
      }
      fill(wv[1], body);
      stat.setAttribute("data-cave-marker", wv[0]);
    }
    function goOn(i) {
      if (busy) return;
      var s = me(); s.passed = Math.max(s.passed, i + 1);
      if (i < WAVE.length - 1) hint(i + 1); else finishOut();
    }
    function finishOut() {
      busy = true; stat.setAttribute("data-cave-place", "rising"); fill("Light from above", [P("Breathe out.")]);
      var y0 = camera.position.y;
      tween(2200, function (k) { state.rise = { k: ease(k), y0: y0 }; }, function () { state.rise = null; leave(true); });
    }

    // ---- branches: a loop out through the wall and back to the same spot ----------------------------
    // kind "side": a block's side passage, which ramps down under the cave and holds the five places. kind "face": one face's
    // short level branch at the gate. The parent's wall opens twice (out and back), a lantern stands between the openings,
    // and the loop is kept after the player comes back round, so the way they went stays visible.
    function makeBranch(frame, kind, depth, face) {
      var parent = frame.route, w = ch.w, h = ch.h, side = outerSide(parent, frame.s, depth);
      var pw = (parent.w || w) * (parent.kind === "main" || parent.level ? parent.openAt(frame.s) : SIDE_LOOK.open);
      var o = kind === "side" ? { wb: w * 0.8, g: w * 0.8 * 1.3, W0: pw, L1: 18, alpha: 0.7, R: 34, drop: 10 }
        : { wb: w * 0.65, g: w * 0.65 * 1.3, W0: pw, L1: 2, alpha: 0, R: w * 0.65 * 1.3 + 2.5, drop: 0 };
      var route = layoutBranch(parent, frame.s, side, o);
      route.w = o.wb; route.kind = kind; route.group = new THREE.Group();
      route.parentTube = parent.tube; route.pendingExit = route.holes[1]; // the wall opens in reveal(): the way in now, the way back later
      var rock = frame.blk ? frame.blk.rock : parts.rock;
      if (kind === "side") rock = stoneOf(THREE, parts.tiles, rock.userData.hex);
      if (kind === "face") rock = stoneOf(THREE, parts.tiles, FACE_LOOK[face].rock); // its own walls, so a style stays on this branch
      route.openAt = function () { return SIDE_LOOK.open; };
      var shp = CAVE_SHAPE[frame.blk ? frame.blk.texture : state.cur.texture] || CAVE_SHAPE.other;
      route.tube = buildTube(THREE, route, { within: true, w: o.wb, h: h, rock: rock, openAt: route.openAt, sFrom: route.sFrom, sTo: route.sTo, taper: { s0: route.sIn, s1: route.sOut }, seed: depth * 13 + blockN, shape: shp });
      route.holes.forEach(function (H) { H.tube = route.tube; });
      route.tube.within = { tube: parent.tube, s0: route.sIn + 1, s1: route.sOut - 1 };
      route.tube.update(br.k); route.tube.index();
      // a disc of floor under each meeting, a hair below both floors: where the two tunnels' rounded lower walls cross at a
      // slant, no sliver of the dark below can show through. Only a level branch gets one: a passage ramps down, its floor
      // falls away below the disc, and the disc stood over the ramp as a flat plate (Wendell, 2026-10-13: "Something funky is
      // going on here with the floor").
      if (!(o.drop > 0)) route.cross.forEach(function (cp) {
        var disc = new THREE.Mesh(new THREE.CircleGeometry(o.wb * 1.5, 24), rock.userData.floor || rock);
        disc.rotation.x = -Math.PI / 2; disc.position.set(cp.x, cp.y - h * 0.92 - 0.06, cp.z); route.group.add(disc);
      });
      route.group.add(route.tube.mesh); route.group.add(buildPebbles(THREE, route, o.wb, h, route.sIn, route.sOut));
      var dr = buildDressing(THREE, route, parts.G, { w: o.wb, h: h, rock: rock, s0: route.sIn, s1: route.sOut, seed: kind + ":" + depth + ":" + blockN });
      route.group.add(dr); darken(shp, rock, dr);
      // Only the way in shows (Wendell, 2026-10-13: "We should only see the entrance"): it gets a glowing rim, and the way back
      // opens without one when the player is round the far side of the loop. A lantern stands where they left the path.
      route.light = kind === "face" ? lookup(FACES, face)[4] : SIDE_LOOK.light;
      route.pw = pw;
      var a0 = at(parent, (route.holes[0].s0 + route.holes[0].s1) / 2), rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 8, 28), new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true }));
      var nx0 = -a0.fz * side, nz0 = a0.fx * side;
      rim.position.set(a0.x + nx0 * pw * 0.97, a0.y - h * 0.25, a0.z + nz0 * pw * 0.97); rim.rotation.y = Math.atan2(nx0, nz0);
      rim.scale.set(0.01, 0.01, 1); rim.visible = false; route.group.add(rim);
      route.rims = [rim];
      var b = at(parent, frame.s), lan = buildLantern(THREE);
      lan.position.set(b.x + -b.fz * side * pw * 0.8, b.y - h * 0.92, b.z + b.fx * side * pw * 0.8);
      route.group.add(lan); lanternsOn.push(lan);
      if (kind === "side") {
        // the five places along the loop; the six stones of the gate each have a stop of their own, a face's branch beside it
        // Wendell, 10 October 2026: the gates are forks in the path and belong at the beginning, so the six stones come first
        // (stops 0-5), then the mouth, the pool and the daemon (stops 6-8), then the way out.
        // The first stone stands past the ramp, far enough on that its branch's openings cut level wall (2026-10-13: on the
        // ramp a level branch met a sloping wall and left dark gaps, and the camera behind the figure was outside both).
        var L = route.len, pos = { mouth: 0.46, pool: 0.58, passage: 0.7 }, half = w * 0.65 * (1.3 + 1.08);
        var g0 = Math.max(0.04 * L, route.sLevel + half + 1), gs = Math.max(0, Math.min(0.06 * L, (pos.mouth * L - 6 - g0) / 5));
        route.stops = [];
        FACES.forEach(function (f, i) { route.stops.push({ s: g0 + i * gs, place: "gate", stone: i }); });
        route.stops.push({ s: pos.mouth * L, place: "mouth" }, { s: pos.pool * L, place: "pool" }, { s: pos.passage * L, place: "passage" });
        route.stops.push({ s: route.sOut - 2.5, place: "way_out" });
      } else route.stops = [{ s: route.sOut - 1.2, face: face }];
      route.markers = route.stops.map(function (st) {
        var m = buildMarker(THREE, o.wb, h, kind === "face" ? lookup(FACES, face)[4] : SIDE_LOOK.light), a = at(route, Math.min(route.len, st.s + MARK_AHEAD));
        m.position.set(a.x, a.y - h * 0.92 + MARK_Y, a.z); route.group.add(m); return m;
      });
      route.ctx = { holder: new THREE.Group(), lampHex: 0xffe0b0, stones: [] };
      if (kind === "face") { route.style = face; route.motes = buildMotes(route, o.wb, h); route.group.add(route.motes); }
      scene.add(route.group);
      return route;
    }
    // Motes along a face's branch, in the colour of the style it wears.
    function buildMotes(route, wb, h) {
      var N = 90, pos = new Float32Array(N * 3), rnd = rngOf(hashOf("motes" + route.len)), seeds = [];
      for (var i = 0; i < N; i++) seeds.push({ s: route.sIn + rnd() * (route.sOut - route.sIn), lat: (rnd() - 0.5) * wb * 1.4, y: rnd(), v: 0.3 + rnd() });
      var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      var m = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.16, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.userData = { seeds: seeds, t: 0, h: h, route: route };
      return m;
    }
    function stepMotes(m, look, dt, still) {
      var u = m.userData, p = m.geometry.attributes.position; u.t += still ? 0 : dt * (0.2 + look.drift);
      m.material.color.lerp(tmpC.setHex(look.light), Math.min(1, dt * 2));
      for (var i = 0; i < u.seeds.length; i++) {
        var sd = u.seeds[i], a = at(u.route, sd.s), y = (sd.y + u.t * sd.v * 0.15) % 1, sw = look.drift * 0.4 * Math.sin(u.t * 2 + i);
        p.array[i * 3] = a.x + -a.fz * (sd.lat + sw); p.array[i * 3 + 1] = a.y - u.h * 0.9 + u.h * 1.6 * y; p.array[i * 3 + 2] = a.z + a.fx * (sd.lat + sw);
      }
      p.needsUpdate = true;
    }
    function faceLook(style) { var L = FACE_LOOK[style]; return { light: L.light, fog: L.fog, fogK: L.fogK, hemi: L.hemi, open: SIDE_LOOK.open, drift: L.drift }; }
    // An opening appears (Wendell, 2026-10-13: "The transitions should also be more magical it's a bit jarring how it shows up
    // now"). Light gathers on the stone first: a veil in the branch's colour brightens over the spot while sparks spiral in
    // and the rim turns open. The stone gives way under the veil at its brightest, then the veil thins away and the sparks
    // drift out through the opening. which: 0 the way in (with its rim), 1 the way back (light only).
    function reveal(route, which, done) {
      var H = route.holes[which], parent = route.parentTube, a = at(route.parent, (H.s0 + H.s1) / 2);
      var nx = -a.fz * H.side, nz = a.fx * H.side, pw = route.pw, h = ch.h, col = new THREE.Color(route.light).lerp(new THREE.Color(0xfff1b0), 0.35);
      var at0 = new THREE.Vector3(a.x + nx * pw * 0.85, a.y - h * 0.25, a.z + nz * pw * 0.85), sx = route.w * 1.05, sy = h * 0.62;
      var veil = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      veil.position.copy(at0); veil.rotation.y = Math.atan2(nx, nz); veil.scale.set(0.01, 0.01, 1); route.group.add(veil);
      var N = 70, sp = new Float32Array(N * 3), seeds = [], rnd = rngOf(hashOf("spark" + which + route.len));
      for (var i = 0; i < N; i++) seeds.push({ a: rnd() * Math.PI * 2, r: 1.2 + rnd() * 1.4, v: 0.6 + rnd() * 0.8, out: 0.5 + rnd() * 2.5 });
      var sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
      var sparks = new THREE.Points(sg, new THREE.PointsMaterial({ color: col, size: 0.14, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      route.group.add(sparks);
      var tx = Math.cos(veil.rotation.y), tz = -Math.sin(veil.rotation.y); // along the wall, in the veil's plane
      var rim = which === 0 ? route.rims[0] : null, cut = false;
      if (rim) rim.visible = true;
      if (which === 0) { busy = true; state.peek = { x: at0.x, z: at0.z, until: performance.now() + 2600 }; }
      tween(which === 0 ? 1700 : 1300, function (k) {
        var gather = Math.min(1, k / 0.45), fadeK = Math.max(0, (k - 0.45) / 0.55), eg = ease(gather);
        veil.material.opacity = 0.85 * eg * (1 - ease(fadeK));
        veil.scale.set(sx * (0.2 + 0.8 * eg), sy * (0.2 + 0.8 * eg), 1);
        if (rim) { var back = 1 + 0.18 * Math.sin(Math.PI * Math.min(1, k / 0.7)); rim.scale.set((0.01 + 1.3 * eg) * (k > 0.45 ? back : 1), (0.01 + 1.7 * eg) * (k > 0.45 ? back : 1), 1); rim.rotation.z = (1 - eg) * Math.PI * 1.5; }
        if (!cut && k >= 0.45) { cut = true; parent.addHole(H); if (which === 1) route.pendingExit = null; }
        sparks.material.opacity = Math.min(1, k * 4) * (1 - fadeK);
        for (var i = 0; i < N; i++) {
          var sd = seeds[i], rr = gather < 1 ? sd.r * (1 - 0.85 * eg) : 0.15 + fadeK * sd.out, an = sd.a + k * 6 * sd.v;
          var lx = Math.cos(an) * rr * sx * 0.7, ly = Math.sin(an) * rr * sy * 0.7, push = fadeK * fadeK * sd.out * 1.5;
          sp[i * 3] = at0.x + tx * lx + nx * push; sp[i * 3 + 1] = at0.y + ly; sp[i * 3 + 2] = at0.z + tz * lx + nz * push;
        }
        sg.attributes.position.needsUpdate = true;
      }, function () {
        route.group.remove(veil); route.group.remove(sparks); veil.geometry.dispose(); sg.dispose();
        if (which === 0) busy = false;
        if (done) done();
      });
    }
    // The way back opens once the player is round the far side of the loop (or at once if the game walks them back).
    function openWayBack(route) { if (route.pendingExit && !route.exitOpening) { route.exitOpening = true; reveal(route, 1); } }
    // A block: the wall opens, and a side passage loops out from here and back to this spot.
    function openBlock(stepId, label) {
      if (busy) return;
      var wk = state.walk, s = me(), depth = state.stack.length + 1, stp = stopOf(wk);
      var key = wk.blk ? wk.blk.key + ">" + PLACE_BY[stp.place].key : stepId;
      if (s.blocked.indexOf(key) < 0) s.blocked.push(key);
      var frame = { route: wk.route, s: wk.s, sMin: wk.sMin, target: wk.target, blk: wk.blk, key: key, label: label, kind: "side" };
      var route = makeBranch(frame, "side", depth);
      var par = frame.blk, tex = par ? par.texture : s.texture;
      var blk = { id: "b" + (++blockN), key: key, label: label, depth: depth, texture: tex, element: null, unknownEl: false, deco: [], daemon: null, stepAside: null, dug: 0, gate: [], route: route, frame: frame, touched: false };
      blk.rock = route.tube.rock; tintStone(blk.rock, (lookup(TEXTURES, tex) || TEXTURES[4])[2]);
      dressSide(blk);
      frame.child = blk;
      stat.setAttribute("data-cave-place", "opening"); fill(label, [P("The wall opens. The path loops out from here and comes back to this spot.")]);
      reveal(route, 0, function () {
        state.stack.push(frame);
        state.walk = newWalk(route, blk, 0);
        hint(0);
      });
    }
    // A face's branch at the gate: a short level loop out of the wall beside that face's stone and back.
    function openFace(blk, stone) {
      if (busy) return;
      var wk = state.walk, f = FACES[stone];
      var frame = { route: wk.route, s: wk.s, sMin: wk.sMin, target: wk.target, blk: blk, key: blk.key + ">face-" + f[0], label: f[1], kind: "face", stone: stone };
      // the last face's branch is put away (its openings close), so neighbouring branches never cross
      if (blk.lastFace) {
        var old = blk.lastFace; scene.remove(old.group);
        wk.route.tube.holes = wk.route.tube.holes.filter(function (H) { return old.holes.indexOf(H) < 0; }); wk.route.tube.index();
        lanternsOn = lanternsOn.filter(function (l) { return l.parent !== old.group; });
      }
      var route = makeBranch(frame, "face", state.stack.length + 1, f[0]);
      frame.child = { route: route }; blk.lastFace = route;
      fill(f[1] + "'s branch", [P("The wall beside the " + f[1] + " stone opens.")]);
      reveal(route, 0, function () {
        state.stack.push(frame);
        state.walk = newWalk(route, blk, 0);
        hint(0);
      });
    }
    // The side passage's objects: the element beside the pool, the six stones, and the arch at the way out.
    function dressSide(blk) {
      var route = blk.route, ctx = route.ctx, G = parts.G, h = ch.h, wb = route.w, inner = -route.side;
      function beside(s, lat) { var a = at(route, s); return { x: a.x + -a.fz * inner * lat, y: a.y - h * 0.92, z: a.z + a.fx * inner * lat, a: a }; }
      var pool = stopAt(route, "pool"), pe = beside(pool.s + 9, Math.min(wb * 0.4, 2.2));
      ctx.holder.position.set(pe.x, pe.y, pe.z); route.group.add(ctx.holder);
      if (blk.element) setElementOn(ctx, blk.element, Math.min(wb * 0.45, 2));
      if (G.mush_colony) { // the colony grows across the path from the element, its mycelium showing between the stems
        var pc = beside(pool.s + 3, -Math.min(wb * 0.34, 2)), col = new THREE.Mesh(G.mush_colony, shaded(THREE, new THREE.MeshStandardMaterial({ color: DRESS_GLOW, emissive: DRESS_GLOW, emissiveIntensity: 0.55, roughness: 0.6 })));
        col.position.set(pc.x, pc.y, pc.z); col.rotation.y = yawFacing(pc.a); col.scale.setScalar(Math.min(h * GROWN.colony, wb * 0.5));
        route.group.add(col); ctx.colony = col;
      }
      route.stops.forEach(function (st) {
        if (st.stone == null) return;
        var f = FACES[st.stone], p = beside(st.s + 2.5, wb * 0.55);
        var stone = new THREE.Mesh(G.gate_stone, new THREE.MeshStandardMaterial({ color: 0x70707e, roughness: 0.8, emissive: 0x000000 }));
        stone.position.set(p.x, p.y, p.z); stone.scale.set(2.2, Math.min(h * 1.1, 3.4), 2.2); stone.userData.face = f[0];
        route.group.add(stone); ctx.stones.push(stone);
      });
      var wo = route.stops[route.stops.length - 1], aw = at(route, Math.min(route.len, wo.s + 1.5));
      var arch = new THREE.Mesh(G.portal_arch, new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true })); ctx.arch = arch;
      arch.position.set(aw.x, aw.y - h * 0.92, aw.z); arch.rotation.y = yawFacing(aw); arch.scale.setScalar(Math.min(wb * 0.55, h * 0.7)); route.group.add(arch);
    }

    // Coming back round: the avatar walks the last of the loop up onto the very spot it left from. Release returns one level;
    // a skip goes back to the main path from any depth (with a short fade, because it jumps).
    function backRound(done) {
      if (busy) return;
      var wk = state.walk; busy = true; closeModal();
      if (wk.route.pendingExit) openWayBack(wk.route);
      autoWalk(wk.route.len, function () {
        var fr = state.stack.pop();
        state.walk = backOn(fr, fr.blk);
        busy = false; done(fr);
      });
    }
    // The walk on the route a branch left from, standing at the stop it left from.
    function backOn(fr, blk) { var w = newWalk(fr.route, blk, fr.s); w.sMin = fr.sMin != null ? fr.sMin : w.sMin; w.dir = 1; w.ready = true; w.target = fr.target; w.arrived = true; w.near = fr.target; return w; }
    function release() {
      backRound(function (fr) {
        var pb = fr.blk;
        if (pb && fr.route.stops[fr.target].place === "passage" && pb.stepAside === "not-yet") { pb.dug++; pb.stepAside = null; } // the daemon is asked again
        arrive();
      });
    }
    function faceBack() {
      backRound(function (fr) {
        var blk = fr.blk, f = FACES[fr.stone];
        if (blk.gate.indexOf(f[0]) < 0) blk.gate.push(f[0]);
        if (blk.route.ctx.arch) blk.route.ctx.arch.material.opacity = 1; // the openings and the arch shine again once out of the loop
        if (fr.child && fr.child.route) fr.child.route.rims.forEach(function (r) { r.material.opacity = 1; });
        blk.route.ctx.stones.forEach(function (st) {
          if (blk.gate.indexOf(st.userData.face) >= 0) { var col = lookup(FACES, st.userData.face)[4]; st.material.color.setHex(col); st.material.emissive.setHex(col); st.material.emissiveIntensity = st.userData.face === f[0] ? 0.9 : 0.45; }
        });
        lk.flash = 1;
        next(blk);
      });
    }
    function skip() {
      if (busy) return;
      var s = me(), wk = state.walk;
      var chain = [], b = wk.blk; while (b) { chain.unshift(b.key); b = b.frame.blk; }
      chain.forEach(function (k) { if (s.skipped.indexOf(k) < 0) s.skipped.push(k); });
      busy = true; closeModal(); fade.style.opacity = 1;
      setTimeout(function () {
        var fr = state.stack[0]; state.stack = [];
        state.walk = backOn(fr, null);
        snapCam = true; busy = false; fade.style.opacity = 0;
        arrive();
      }, 520);
    }

    // ---- the side passage's places ----------------------------------------------------------------
    function next(blk) {
      var wk = state.walk;
      if (wk.target < wk.route.stops.length - 1) hint(wk.target + 1);
    }
    // Wendell, 10 October 2026: "Elements should be hidden out of sight until the player chooses one. Can be fog of war or w/e.
    // Also the cave should be decorated with the element after it's been chosen. There should also be an option to say I don't
    // know." The element beside the pool stays out of the scene until it is named; naming it lights the passage with its
    // colour and scatters small ones of it along both walls.
    function decorate(blk) {
      var route = blk.route, h = ch.h, wb = route.w, inner = -route.side;
      var gone = blk.deco || [];
      gone.forEach(function (o) { route.group.remove(o); }); blk.deco = [];
      if (route.tube && route.tube.mounts) route.tube.mounts = route.tube.mounts.filter(function (m) { return gone.indexOf(m.obj) < 0; });
      if (!blk.element) return;
      // Each small one grows out of the stone where its element would (2026-10-13): fire and stone from the floor's edge and low
      // wall, water pools at the foot, bushes and grass keep to the floor's edge and the low wall, metal breaks out anywhere, the roof included.
      var rnd = rngOf(hashOf(blk.key + ":" + blk.element)), zones = ELEMENT_ZONES[blk.element] || ["foot"];
      for (var i = 0; i < 8; i++) {
        var sv = route.len * (0.06 + 0.11 * i + rnd() * 0.05), sd = rnd() < 0.5 ? -1 : 1, zone = zones[Math.floor(rnd() * zones.length)];
        var o = buildElement(THREE, blk.element, Math.min(wb * 0.2, 0.9) * (0.6 + rnd() * 0.6) * (zone === "foot" ? 1 : 0.8));
        if (route.tube && route.tube.mount) route.tube.mount(o, sv, zoneJ(zone, sd, rnd), { sink: 0.05, tilt: (rnd() - 0.5) * 0.5, tilt2: (rnd() - 0.5) * 0.5, spin: rnd() * Math.PI * 2 });
        else { var a = at(route, sv), lat = sd * wb * 0.62; o.position.set(a.x + -a.fz * inner * lat, a.y - h * 0.92, a.z + a.fx * inner * lat); }
        route.group.add(o); blk.deco.push(o);
      }
      // Wendell, 2026-10-13: "In the water caves we want the water to be dynamically spread through the cave as though there
      // are a number of puddles. We might even have player Walk through them". A water passage's floor holds puddles along the
      // path, some across it, so the figure walks through them and each step opens a ring.
      layPuddles(route, blk.key, blk.element);
    }
    // Wendell, 2026-10-13: "In the water caves we want the water to be dynamically spread through the cave as though there
    // are a number of puddles. We might even have player Walk through them". A water cave's floor (the main tunnel when its
    // feeling is named Sadness, or a side passage whose element is water) holds puddles along the path, some across it, so
    // the figure walks through them and each step opens a ring.
    function layPuddles(route, key, element) {
      (route.puddles || []).forEach(function (p) { route.group.remove(p.g); });
      route.puddles = [];
      if (element !== "Sadness") return;
      var rnd = rngOf(hashOf(key + ":puddles")), h = ch.h, wb = route.w, np = Math.max(4, Math.floor(route.len / 7));
      for (var pi = 0; pi < np; pi++) {
        var ps = route.len * (0.06 + 0.88 * (pi + 0.2 + rnd() * 0.6) / np), pa = at(route, ps), plat = (rnd() - 0.5) * wb * 0.6;
        var pr = Math.min(wb * 0.42, 1.7) * (0.55 + rnd() * 0.5), pg = buildPool(THREE, new THREE.Group(), pr, { puddle: true, seed: rnd() });
        pg.position.set(pa.x + -pa.fz * plat, pa.y - h * 0.92, pa.z + pa.fx * plat); pg.rotation.y = rnd() * Math.PI * 2;
        route.group.add(pg); route.puddles.push({ g: pg, r: pr });
      }
    }
    // A step that lands in a puddle opens a ring where the foot came down.
    var splashTmp = null;
    function splashAt(route, x, y, z) {
      if (!route.puddles || !route.puddles.length) return;
      if (!splashTmp) splashTmp = new THREE.Vector3();
      route.puddles.forEach(function (p) {
        var dx = x - p.g.position.x, dz = z - p.g.position.z;
        if (dx * dx + dz * dz > p.r * p.r * 0.8 || Math.abs(y - p.g.position.y) > 1) return;
        splashTmp.set(x, p.g.position.y, z); p.g.worldToLocal(route.group.localToWorld(splashTmp));
        p.g.userData.splash(splashTmp.x, splashTmp.z, 1.2);
      });
    }
    function redress(blk) {
      tintStone(blk.rock, (lookup(TEXTURES, blk.texture) || TEXTURES[4])[2]);
      var c = blk.route.ctx;
      if (blk.element && c.element !== blk.element) { setElementOn(c, blk.element, Math.min(blk.route.w * 0.45, 2)); blk.touched = false; decorate(blk); }
      lk.flash = Math.max(lk.flash, 0.7);
    }
    function touch() {
      var c = ctxOf(); if (!c) return;
      c.pulse = performance.now(); state.touched = true;
      var wk = state.walk; if (wk.blk && wk.arrived && stopOf(wk).place === "pool") { wk.blk.touched = true; placeCard(wk.blk); }
    }
    function placeCard(blk) {
      var wk = state.walk, stp = stopOf(wk), p = PLACE_BY[stp.place], body = [], kids = [];
      stat.setAttribute("data-cave-place", stp.place);
      var go = btn("Continue", { "data-cave-next": "" }, function () { next(blk); }), title = p.step;
      if (stp.place === "mouth") {
        body.push(P("What is the block like, in the body?"));
        body.push(choice(TEXTURES.map(function (t) { return [t[0], t[1]]; }), blk.texture, function (o) { blk.texture = o[0]; redress(blk); placeCard(blk); }));
        body.push(P("Is anything else showing up somewhere else in your body?"));
        body.push(row([btn("Yes, name another place", { "data-cave-add": "" }, addPlace, true)]));
        var s = me();
        if (state.sens.length > 1) body.push(P("Also named this sitting: " + state.sens.filter(function (o) { return o !== s; }).map(function (o) { return o.spot.words; }).join(", ") + ".", { "data-cave-also": "" }));
      } else if (stp.place === "pool") {
        var e = blk.element && lookup(ELEMENTS, blk.element);
        if (!e) {
          body.push(P(blk.unknownEl ? "You don't know which feeling this is, and that is allowed. It stays hidden. Name one if it comes to you." : "Which feeling is here? Its element stays hidden until you choose one. Or say you don't know.", { "data-cave-element-hidden": "" }));
        } else {
          body.push(P(e[0] + " is " + e[1] + ". Tap it. The move that goes with it: " + e[2] + "."));
          if (blk.touched) body.push(P("It answers you. " + e[2] + ".", { "data-cave-touched": "" }));
          body.push(P(CHANNEL_JOBS[e[0]], { "data-cave-job": "" }));
        }
        body.push(choice(ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }), blk.element, function (o) { blk.element = o[0]; blk.unknownEl = false; redress(blk); placeCard(blk); }));
        body.push(row([btn("I don't know", { "data-cave-element-unknown": "" }, function () { blk.unknownEl = true; placeCard(blk); }, true)]));
      } else if (stp.place === "passage") {
        var d = blk.daemon && lookup(DAEMONS, blk.daemon);
        if (!d) {
          body.push(P("A daemon stands in the way. Which one is it?"));
          body.push(choice(DAEMONS.map(function (x) { return [x[0], x[1]]; }), null, function (o) { meet(blk, o[0]); }));
          go.disabled = true;
        } else if (!blk.met && blk.bm) {
          title = meetCard(blk, d, body); go.disabled = true;
        } else {
          body.push(P(d[1] + "'s job: " + d[2], { "data-cave-daemon-job": "" }));
          body.push(P("Who it works for: " + DAEMON_WORKS_FOR, { "data-cave-daemon-for": "" }));
          if (!blk.met) {
            // Met the Big Mind way (board merge-layout): its permission first. "Not now" is a full answer; the daemon still holds the
            // way and is asked to step aside, as before (cave-daemon-wall), so nothing here becomes a skip.
            body.push(P("May I speak with " + lowerName(d[1]) + "?", { "data-cave-bm-ask": "" }));
            body.push(P("Ask it first. It can say no, and that is an answer too."));
            body.push(row([
              btn("It says yes", { "data-cave-bm-speak": "yes" }, function () { blk.bm = { phase: "q", n: 0, picked: [], heard: {}, seat: true, draft: "", waiting: [] }; placeCard(blk); }),
              btn("Not now", { "data-cave-bm-speak": "not-now" }, function () { blk.met = "declined"; placeCard(blk); }, true),
            ]));
            go.disabled = true;
          } else if (!blk.stepAside) {
            if (blk.met === "declined" && !blk.dug) body.push(P(d[1] + " would rather not speak yet.", { "data-cave-met": "declined" }));
            if (blk.met === "spoken" && !blk.dug) body.push(P("You stood in its place and spoke as it. It has been heard.", { "data-cave-met": "spoken" }));
            if (blk.dug) body.push(P("You worked what it was holding.", { "data-cave-dug": "" }));
            body.push(P(blk.dug ? "Will it step aside now?" : "Knowing that, will it step aside?"));
            body.push(row([
              btn("Yes, it steps aside", { "data-cave-aside": "yes" }, function () { blk.stepAside = "yes"; moveDaemon(blk); placeCard(blk); }),
              btn("Not yet", { "data-cave-aside": "not-yet" }, function () { blk.stepAside = "not-yet"; placeCard(blk); }, true),
            ]));
            go.disabled = true;
          } else if (blk.stepAside === "yes") {
            body.push(P(d[1] + " stepped to the wall, and the way is open.", { "data-cave-open": "" }));
          } else {
            // Wendell, 10 October 2026: "This type of blocker shouldn't be able to be moved past and there should be an encounter
            // where they only stand aside after resolving the emergent issue presented by the daemon." The way stays shut; the
            // encounter is digging into what it holds (the game's own rule: "If a block won't release, you dig deeper into what's
            // holding it", game.jsx line 3380), a branch of its own, and then it is asked again (board: cave-daemon-encounter).
            // Wendell, 10 October 2026 (board cave-daemon-wall, overruled): "We shouldn't have a skip. If a daemon pops up then
            // it needs to be worked with. We can pivot to a 321 discussion with the part until it feels satisfied." The 3-2-1
            // runs here, round after round, until the player says it is satisfied; then it steps aside. Its wording follows
            // src/components/nursery/ThreeTwoOneDialogue.tsx. The words stay on this page and are not saved.
            var t = blk.t321;
            if (blk.home) {
              // Back from the WAVE room by the lantern: the charge was worked there, so the daemon is asked again. Only Yes opens the way.
              body.push(P("You took it home and worked it in the WAVE room. The lantern you left stands here.", { "data-cave-home-back": "" }));
              body.push(P("Does " + d[1] + " feel satisfied?"));
              body.push(row([
                btn("Yes, it is satisfied", { "data-cave-home-satisfied": "yes" }, function () { blk.home = null; if (blk.dm) blk.dm.heat = Math.min(blk.dm.heat, 3); blk.stepAside = "yes"; moveDaemon(blk); placeCard(blk); }),
                btn("Not yet", { "data-cave-home-satisfied": "not-yet" }, function () { blk.home = null; placeCard(blk); }, true),
              ]));
            } else if (!t) {
              body.push(P(d[1] + " won't move, and you can't walk past it. It is still doing its job here, for you.", { "data-cave-wall": "" }));
              body.push(P("Talk with it, 3-2-1, until it feels satisfied, work what it is holding and ask it again when you come back round, or take it home to the WAVE room."));
              body.push(row([
                btn("Talk with it", { "data-cave-321": "" }, function () { blk.t321 = { phase: "before", rounds: 1, msgs: [], voice: "you", draft: "", before: 8, after: 3 }; blk.dm.allowed = true; placeCard(blk); }),
                btn("Work what it holds", { "data-cave-dig": "" }, function () { openBlock("daemon", d[1]); }, true),
                btn("Take it home", { "data-cave-take-home": "" }, function () { takeHome(blk, d); }, true),
              ]));
            } else {
              title = chat321(blk, d, t, body);
            }
            go.disabled = true;
          }
        }
      } else if (stp.place === "gate") {
        var f = FACES[stp.stone], walked = blk.gate.indexOf(f[0]) >= 0;
        title = p.step + " · " + f[1];
        body.push(P(f[1] + ": " + f[2] + ". " + blk.gate.length + " of 6 branches walked.", { "data-cave-stone-says": "" }));
        if (!walked) {
          body.push(row([btn("Walk " + f[1] + "'s branch", { "data-cave-stone": f[0] }, function () { openFace(blk, stp.stone); })]));
          go.disabled = true;
        }
      } else {
        body.push(P("Light from above. Breathe out, and come back round to " + blk.label + "."));
        go = btn("Return to " + blk.label, { "data-cave-release": "" }, release);
      }
      // No skip once a daemon has shown up and not stepped aside, here or in any block this one opened from: it is worked with.
      if (stp.place === "passage" && blk.stepAside !== "yes") { /* the daemon is here: no skip, no way on until it steps aside */ }
      else {
        kids.push(go);
        if (stp.place !== "way_out") kids.push(btn("This step won't go further", { "data-cave-block": "" }, function () { openBlock(p.key, p.step); }, true));
        if (stp.place !== "way_out" && !daemonHolds(blk)) kids.push(btn("Skip", { "data-cave-skip": "" }, skip, true));
      }
      fill(title, body.concat([row(kids)]));
    }
    // "Take it home" (board wave-room-cave-link = both, by lantern): a lantern is left at this spot, the cave rests, and the charge
    // goes to the WAVE room with its feeling known. When the room is done the cave comes back, at the lantern, and the daemon is
    // asked again. Nothing is skipped: the charge is worked, only in another place.
    function takeHome(blk, d) {
      if (busy) return;
      busy = true; closeModal();
      var wk = state.walk, a = at(wk.route, wk.s), inner = -(wk.route.side || 1), lat = (wk.route.w || ch.w) * 0.5, lan = buildLantern(THREE);
      lan.position.set(a.x + -a.fz * inner * lat, a.y - ch.h * 0.92, a.z + a.fx * inner * lat);
      wk.route.group.add(lan); lanternsOn.push(lan); blk.homeLantern = lan;
      fade.style.opacity = 1;
      setTimeout(function () {
        cancelAnimationFrame(running); wrap.style.display = "none";
        openRoom(A, { from: "cave", where: me().spot.words, texture: blk.texture, element: blk.element, daemon: d[1] }).then(function (r) {
          wrap.style.display = ""; snapCam = true; last = performance.now(); render();
          blk.home = r || {}; busy = false; fade.style.opacity = 0; placeCard(blk);
          ((r && r.spirits) || []).forEach(function (o) { addSpirit(o); });
        });
      }, 520);
    }
    // ---- the spirits that walk with you (Wendell, 12 October 2026, 20:43) --------------------------------------------------
    // Every charge worked through in the WAVE room comes back into the cave with the player as a spirit, in its element's colour
    // with its name, and walks behind the figure until the player dismisses it: tap Spirits, thank it, then breathe it out or take
    // it home again (the Big Mind cave's bms-dismiss). Nothing dismisses one for you. A charge breathed out at the room's fork
    // comes back lighter (a choice). They walk this visit only; leaving the cave leaves them at its doorway (a choice).
    var spirits = [];
    var spiritBtn = el("button", { class: "oagc-spiritbtn", "data-cave-spiritbtn": "", style: "display:none", onclick: function () { spiritPanel(); } });
    var spiritBox = el("div", { class: "oagc-spirits", "data-cave-spirits": "", style: "display:none" });
    canvasBox.appendChild(spiritBtn); wrap.appendChild(spiritBox);
    function addSpirit(o, at0) {
      var g = buildSpirit(THREE, o.name, o.hex != null ? o.hex : spiritHex(o.element)); if (o.lighter) g.userData.level = 0.2;
      if (at0) g.position.copy(at0); else if (avatar) g.position.set(avatar.position.x, avatar.position.y + 1.7, avatar.position.z);
      scene.add(g); o.g = g; o.light = carryLight(g, g.userData.color.getHex()); spirits.push(o); spiritsUi();
    }
    function spiritsUi() {
      var n = spirits.length;
      spiritBtn.style.display = n ? "" : "none";
      spiritBtn.textContent = "Spirits " + n + (n > SPIRITS_SHOWN ? " (+" + (n - SPIRITS_SHOWN) + " behind)" : "");
      spiritBtn.setAttribute("data-cave-spirits-n", String(n));
    }
    function spiritPanel(o) {
      spiritBox.innerHTML = ""; spiritBox.style.display = "";
      if (!o) {
        spiritBox.appendChild(el("h2", { text: "Spirits with you" })); spiritBox.appendChild(P("Tap one to thank it."));
        spiritBox.appendChild(el("div", { class: "oagc-row" }, spirits.map(function (x, i) {
          var b = btn(x.name, { "data-cave-spirit": String(i) }, function () { spiritPanel(x); }, true); return b;
        })));
        spiritBox.appendChild(row([btn("Back", { "data-cave-spirit-back": "" }, function () { spiritBox.style.display = "none"; }, true)]));
        return;
      }
      spiritBox.appendChild(el("h2", { text: o.name }));
      spiritBox.appendChild(P("You: Thank you for coming with me.", { class: "oagc-you" }));
      spiritBox.appendChild(P("Breathe it out and let it go, or take it home and sit with it again."));
      spiritBox.appendChild(row([btn("Breathe out, and let it go", { "data-cave-spirit-out": "" }, function () { spiritBox.style.display = "none"; letSpiritGo(o); }),
        btn("Take it home again", { "data-cave-spirit-home": "" }, function () { spiritBox.style.display = "none"; spiritHome(o); }, true)]));
    }
    function letSpiritGo(o) {
      var i = spirits.indexOf(o); if (i >= 0) spirits.splice(i, 1); spiritsUi();
      var g = o.g, y0 = g.position.y;
      var li = o.light && o.light.intensity;
      tween(1600, function (k) { g.position.y = y0 + 2.5 * ease(k); g.traverse(function (m) { if (m.material) m.material.opacity = 0.9 * (1 - k); }); if (o.light) o.light.intensity = li * (1 - k); }, function () { scene.remove(g); dropLight(g); });
    }
    // Sitting with it again: the room opens with its feeling known. What is worked there comes back out; if nothing is, it does.
    function spiritHome(o) {
      if (busy || !state.walk) return;
      busy = true; fade.style.opacity = 1;
      var i = spirits.indexOf(o); if (i >= 0) spirits.splice(i, 1); scene.remove(o.g); dropLight(o.g); spiritsUi();
      setTimeout(function () {
        cancelAnimationFrame(running); wrap.style.display = "none";
        openRoom(A, { from: "cave", where: me() ? me().spot.words : "", element: o.element }).then(function (r) {
          wrap.style.display = ""; snapCam = true; last = performance.now(); render(); busy = false; fade.style.opacity = 0;
          var back = (r && r.spirits) || []; if (!back.length) back = [{ name: o.name, element: o.element, hex: o.hex, lighter: o.lighter }];
          back.forEach(function (x) { addSpirit(x); });
        });
      }, 520);
    }
    // ---- sitting down where you are (the Big Mind cave's sit-down, brought into this cave, 13 October 2026) --------------------
    // Wendell, 2026-10-13: "Also we need to import the WAVE process into this map. I think we're almost to the point where we can
    // merge the bigmind cave and this cave". Sit down anywhere on the walk (bms-sit-anywhere) and the WAVE room's steps run in place
    // (bms-in-place): the same table (ROOM_STEPS) and the same 3-2-1 (talk321), here in the tunnel, without the room's door. The
    // figure sits down, and what's coming up comes along the path from ahead as a grey shape that takes its
    // texture's colour at Witness and its element's at Acknowledge, grows with Allow's sliders and steadies at Validate. A breathing
    // ring keeps the cave's breath on every step. Standing up at the end of the WAVE leaves a spirit that walks behind the figure
    // with its own light (`bms-away-lighter`: breathed out at the fork, it walks lighter). The game names each charge (two words,
    // as in the Big Mind cave); the player can give it a name of their own at Acknowledge or Validate.
    var SIT_WHERE = { 3: "You are sitting where you stopped, looking at it.", 2: "You are face to face with it.", 1: "You are sitting where it sat, and it sits where you were.", check: "You are face to face with it.", after: "You are back where you sat down.", paused: "You leaned back from it, still sitting." };
    var NAME_A = ["Slow", "Restless", "Heavy", "Small", "Bright", "Low", "Tangled", "Soft", "Warm", "Cold", "Hollow", "Humming"];
    var NAME_B = ["Moth", "Stone", "Drum", "Knot", "Ember", "Tide", "Thorn", "Lantern", "Pebble", "Root", "Bell", "Wren"];
    function genName() {
      var taken = spirits.map(function (o) { return o.name; }), n;
      for (var i = 0; i < 40; i++) { n = NAME_A[Math.floor(Math.random() * NAME_A.length)] + " " + NAME_B[Math.floor(Math.random() * NAME_B.length)]; if (taken.indexOf(n) < 0) break; }
      return n;
    }
    var sit = null;
    var sitBtn = el("button", { class: "oagc-sitbtn", "data-cave-sitbtn": "", style: "display:none", text: "Sit down", onclick: function () { sitDown(null); } });
    canvasBox.appendChild(sitBtn);
    // A page that is up (a stop's choices, a 3-2-1) is put aside while the player sits, and comes back when they stand.
    function canSit() { return state.mode === "chamber" && !!state.walk && !sit && !busy && !flight && spiritBox.style.display === "none"; }
    // What was on the page when the player sat down comes back when they stand up.
    function stashPage() {
      return { modal: Array.prototype.slice.call(modal.childNodes), stat: Array.prototype.slice.call(stat.childNodes), pane: Array.prototype.slice.call(pane.childNodes),
        paneShown: pane.style.display, open: state.modal, page: { title: page.title, text: page.text, foot: page.foot, has: page.has } };
    }
    function unstashPage(p) {
      [[modal, p.modal], [stat, p.stat], [pane, p.pane]].forEach(function (x) { x[0].innerHTML = ""; x[1].forEach(function (n) { x[0].appendChild(n); }); });
      pane.style.display = p.paneShown; page.title = p.page.title; page.text = p.page.text; page.foot = p.page.foot; page.has = p.page.has;
      if (p.open) openModal(); else closeModal();
    }
    function sitPage(title, kids, tag) {
      modal.innerHTML = ""; modal.setAttribute("data-cave-sit-step", tag);
      modal.appendChild(el("h2", { text: title })); kids.forEach(function (k) { if (k) modal.appendChild(k); });
      pane.innerHTML = ""; pane.appendChild(el("strong", { text: title }));
      page.title = title; page.text = ""; openModal();
    }
    function breathOrb() { var o = el("div", { class: "oagc-orb", "data-cave-orb": "in", "aria-hidden": "true", text: "in" }); o._t = 0; return o; }
    function line(attr, val, ph, onInput) {
      var i = el("input", { type: "text", maxlength: "60", placeholder: ph, "aria-label": ph }); i.setAttribute(attr, ""); i.value = val;
      i.addEventListener("input", function () { onInput(i.value); });
      return el("div", { class: "oagc-compose" }, [i]);
    }
    function cards(list, cur, attr, pick) {
      return row(list.map(function (x) { var a = { "aria-pressed": String(cur === x[0]) }; a[attr] = x[0]; return btn(x[1], a, function () { pick(x[0]); }, cur !== x[0]); }));
    }
    // spirit: a spirit sat with again (it keeps its name and element, and walks on after).
    function sitDown(spirit) {
      if (!spirit && !canSit()) return;
      var wk = state.walk;
      var S = sit = { gen: spirit ? spirit.name : genName(), back: stashPage(), n: 0, phase: "steps", place: null, texture: null, name: spirit ? spirit.name : "",
        element: spirit ? spirit.element : null, unknown: false, allow: { grow: ALLOW_GROW, bright: ALLOW_BRIGHT }, allowed: false, valid: false, goal: "", move: "", appreciate: "",
        t321: { phase: "before", rounds: 1, msgs: [], voice: "you", draft: "", before: 6, after: 3 }, k: 0, come: 1, spirit: spirit || null, route: wk.route, s: wk.s };
      if (spirit) { var i = spirits.indexOf(spirit); if (i >= 0) spirits.splice(i, 1); scene.remove(spirit.g); dropLight(spirit.g); spiritsUi(); }
      state.held = false; sitBtn.style.display = "none";
      var g = new THREE.Group(), au = buildAura(THREE, 0.9);
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), new THREE.MeshStandardMaterial({ color: 0x8a8a96, emissive: 0x8a8a96, emissiveIntensity: 0.25, transparent: true, opacity: 0.85, roughness: 0.7 }));
      m.position.y = 0.6; g.add(m); g.add(au); g.userData = { body: m, aura: au, color: new THREE.Color(0x8a8a96) };
      S.g = g; S.light = carryLight(g, 0x9a9aa8); scene.add(g);
      tween(1400, function (k) { S.k = ease(k); S.come = 1 - ease(k); }, sitDraw);
    }
    function sitHex(S) { return S.element ? spiritHex(S.element) : S.texture ? (lookup(TEXTURES, S.texture) || TEXTURES[4])[2] : 0x8a8a96; }
    function sitNext() { sit.n++; if (sit.n >= ROOM_STEPS.length) return standUp("done"); sitDraw(); }
    function sitDraw() {
      var S = sit; if (!S) return;
      var nm = S.name.trim() || S.gen, stand = btn("Stand up", { "data-cave-standup": "" }, function () { standUp("stood"); }, true);
      if (S.phase === "stays") {
        var k = [], title = talk321(S.t321, { name: nm, damaged: false, skippable: true, redraw: sitDraw, focus: function () { focusChat(modal); }, where: SIT_WHERE, aim: "Aimed at what you want: " + S.goal,
          ask: function (body) {
            body.push(P("What is one next move toward " + S.goal + "? Write it."));
            var done = btn("That's my move", { "data-cave-sitmovedone": "" }, function () { standUp("stays"); });
            body.push(line("data-cave-sitmove", S.move, "One next move", function (v) { S.move = v; done.disabled = !v.trim(); }));
            done.disabled = !S.move.trim(); body.push(row([done]));
          } }, k);
        sitPage(title, k, "321");
        return;
      }
      if (S.phase === "goes") {
        sitPage("Exhale", [P("Let the out-breath soften it. It walks with you, lighter, until you thank it and let it go."), breathOrb(),
          row([btn("Breathe out", { "data-cave-sitexhale": "" }, function () { standUp("goes"); })]), row([stand])], "goes");
        return;
      }
      var R = ROOM_STEPS[S.n], w = R.wave != null ? WAVE[R.wave] : [R.id, R.title, R.words];
      var kids = [P("Sitting with what's coming up · " + (S.n + 1) + " of " + ROOM_STEPS.length, { class: "oagc-note" }), P(w[2])];
      var go = btn("Go on", { "data-cave-sitnext": "" }, function () { if (R.id === "validate") S.valid = true; sitNext(); }), extra = [];
      if (R.id === "witness") {
        kids.push(P(S.place ? "Where: " + S.place + "." : "Where is it in your body?"));
        if (window.OAGBody && window.OAGBody.pick) kids.push(row([btn(S.place ? "Somewhere else" : "Show me on the body map", { "data-cave-sitbodymap": "" }, function () { window.OAGBody.pick().then(function (r) { if (r) S.place = r.label; sitDraw(); }); }, true)]));
        kids.push(P("What is it like?"), cards(TEXTURES.map(function (t) { return [t[0], t[1]]; }), S.texture, "data-cave-sittexture", function (v) { S.texture = v; sitDraw(); }));
        go.disabled = !S.texture;
      } else if (R.id === "acknowledge") {
        kids.push(P("Its element, if you know it. You can give it a name of your own, now or once you have been with it."));
        kids.push(line("data-cave-sitname", S.name, "Its name for now: " + S.gen, function (v) { S.name = v; }),
          cards(ELEMENTS.map(function (x) { return [x[0], x[1] + " · " + x[0]]; }).concat([["unknown", "I don't know"]]), S.unknown ? "unknown" : S.element, "data-cave-sitelement",
            function (v) { S.unknown = v === "unknown"; S.element = S.unknown ? null : v; sitDraw(); }));
        go.disabled = !(S.element || S.unknown);
      } else if (R.id === "allow") {
        S.allowed = true;
        kids.push(P(nm + " grows a little as you let it be here."));
        allowSliders(S.allow, "data-cave-sitallow").forEach(function (n) { kids.push(n); });
      } else if (R.id === "appreciate") {
        kids.push(line("data-cave-sitappreciate", S.appreciate, "In your own words, if you want", function (v) { S.appreciate = v; }),
          P("You may not find anything to appreciate today, and that's all right."));
      } else if (R.id === "validate") {
        kids.push(P("Now that you have been with it, does it have a name of your own?"), line("data-cave-sitrename", S.name, "Or keep " + S.gen, function (v) { S.name = v; }));
      } else if (R.id === "fork") {
        kids.push(P("What do you actually want right now?"));
        var tw = btn("Toward it", { "data-cave-sitpush": "toward" }, function () { S.phase = "stays"; sitDraw(); });
        var aw = btn("Away from it", { "data-cave-sitpush": "away" }, function () { S.phase = "goes"; sitDraw(); }, true);
        var ok = function () { tw.disabled = aw.disabled = !S.goal.trim(); };
        kids.push(line("data-cave-sitgoal", S.goal, "What you want, in your words", function (v) { S.goal = v; ok(); }), P("Is " + nm + " pushing your next move toward it, or away from it?"));
        ok(); kids.push(row([tw, aw]), row([stand]), P("What you write stays on this page.", { class: "oagc-note" }));
        sitPage(w[1], kids, "fork");
        return;
      }
      if (R.notNow) extra.push(btn("Not now", { "data-cave-sitnotnow": "" }, sitNext, true));
      kids.push(breathOrb(), row([go].concat(extra)), row([stand]));
      sitPage(w[1], kids, R.id);
    }
    // branch: stays (Toward), goes (Away: breathed out, lighter), done, stood (stood up partway). A spirit emerges only from a
    // WAVE gone through to the end (Wendell, 2026-10-13: "if you sit down without going through the whole wave process a spirit
    // is auto created. It should only emerge once it's been engaged with"): standing up partway sends the shape back the way it
    // came, and a spirit sat with again walks on as it was.
    function standUp(branch) {
      var S = sit; if (!S) return;
      modal.innerHTML = ""; modal.setAttribute("data-cave-sit-step", "standing"); closeModal();
      var from = S.g.position.clone(), nm = S.name.trim() || S.gen;
      tween(branch === "goes" ? 2200 : 1200, function (k) { S.k = 1 - ease(k); if (branch === "stood" && !S.spirit) S.come = ease(k); }, function () {
        scene.remove(S.g); dropLight(S.g); sit = null; modal.removeAttribute("data-cave-sit-step");
        var o = { name: nm, element: S.element, lighter: branch === "goes" };
        if (S.spirit) { o.name = S.spirit.name; o.element = S.element || S.spirit.element; o.hex = S.element ? null : S.spirit.hex; o.lighter = branch === "goes" || S.spirit.lighter; }
        o.hex = o.element ? null : sitHex(S);
        if (branch !== "stood" || S.spirit) addSpirit(o, from);
        unstashPage(S.back);
      });
    }
    // Each frame: the shape comes from ahead and settles in front of the figure, and the figure lowers to sit.
    function sitFrame(dt, nowMs, route, wk, h) {
      var S = sit; if (!S || route !== S.route) return;
      var a = at(route, Math.min(route.len || 1e9, wk.s + 2.4 + 9 * S.come));
      S.g.position.set(a.x, a.y - h * 0.92 + 0.15 + 0.05 * Math.sin(nowMs / 700), a.z);
      avatar.position.y -= 0.32 * S.k;
      var hex = sitHex(S), body = S.g.userData.body, col = S.g.userData.color.lerp(tmpC.setHex(hex), Math.min(1, dt * 3));
      body.material.color.copy(col); body.material.emissive.copy(col);
      var grow = S.allowed ? 1 + S.allow.grow / 10 : 1; S.g.scale.setScalar(S.g.scale.x + (grow - S.g.scale.x) * Math.min(1, dt * 2));
      body.material.emissiveIntensity = S.valid ? 0.35 : 0.25 + (state.calm ? 0 : 0.12 * Math.sin(nowMs / 90));
      stepAura(S.g.userData.aura, col, S.allowed ? S.allow.bright / 10 : 0.3, dt, state.calm);
      if (S.light) S.light.color.copy(col);
      var ob = modal.querySelector("[data-cave-orb]");
      if (ob) {
        ob._t = (ob._t + dt) % (BREATH.inS + BREATH.outS);
        var inn = ob._t < BREATH.inS, b = inn ? 0.5 - 0.5 * Math.cos(Math.PI * ob._t / BREATH.inS) : 0.5 + 0.5 * Math.cos(Math.PI * (ob._t - BREATH.inS) / BREATH.outS);
        ob.style.transform = "scale(" + (state.calm ? 0.8 : 0.55 + 0.45 * b).toFixed(3) + ")";
        if (ob.textContent !== (inn ? "in" : "out")) { ob.textContent = inn ? "in" : "out"; ob.setAttribute("data-cave-orb", ob.textContent); }
      }
    }
    // How brightly a daemon glows, 0 to 1: its charge (the 3-2-1's readings), up to the brightness the player allowed it, and
    // duller once it has stepped aside.
    function daemonLevel(b) { var dm = b.dm; return clamp(heatOf(b.t321, dm.heat) / 10, 0, 1) * (dm.bright / 10) * (b.stepAside === "yes" ? 0.3 : 1); }
    // True when this block, or one it was opened from, has a daemon that has not stepped aside.
    function daemonHolds(b) { while (b) { if (b.daemon && b.stepAside !== "yes") return true; b = b.frame.blk; } return false; }
    // The 3-2-1 with the daemon in the way (talk321, above, holds the chat). Asked at the end whether it feels satisfied.
    function chat321(blk, d, t, body) {
      return talk321(t, { name: d[1], damaged: blk.daemon === "damaged-self", redraw: function () { placeCard(blk); }, focus: function () { focusChat(modal); },
        // Allow, at the daemon (callsheet wave-room, Next: the room's sliders reach the cave's daemons): it grows a little by itself
        before: function (body) {
          body.push(el("div", { "data-cave-allow": "" }, [el("p", { text: "Allow it: let it be as big and as bright as it is." })].concat(allowSliders(blk.dm, "data-cave-allow-slider"))));
        },
        ask: function (body) {
        body.push(P("Does " + d[1] + " feel satisfied?", { "data-cave-321-ask": "" }));
        body.push(P("Charge " + t.before + " → " + t.after + (t.after < t.before ? ", down " + (t.before - t.after) + "." : ".") + " Your words stay on this page and are not saved."));
        body.push(row([
          btn("Yes, it is satisfied", { "data-cave-satisfied": "yes" }, function () { blk.dm.heat = t.after; blk.stepAside = "yes"; blk.t321 = null; moveDaemon(blk); placeCard(blk); }),
          btn("Not yet, another round", { "data-cave-satisfied": "not-yet" }, function () { t.phase = 3; t.rounds++; t.before = t.after; t.msgs.push({ round: t.rounds, divider: true }); placeCard(blk); }, true),
        ]));
        } }, body);
    }
    // ---- meeting a daemon the Big Mind way (board merge-layout) --------------------------------------------------------
    // blk.bm.phase: q (a question, answered as the daemon from its place), secret (another voice spoke), thank (it is asked to
    // wait), out (the guide thanks the daemon), done. blk.met: "spoken" or "declined" once the meeting is over. The words stay
    // on this page and are not saved, like the 3-2-1's.
    function lowerName(n) { return n.replace(/^The /, "the "); }
    function voiceRow(id) { return lookup(DAEMONS, id) || lookup(MEET_OTHERS, id); }
    function meetCard(blk, d, body) {
      var m = blk.bm, nm = lowerName(d[1]);
      var leave = btn("Step back out", { "data-cave-bm-leave": "" }, function () { meetDone(blk); }, true);
      if (m.phase === "secret") {
        var why = m.tell === "felt" ? "did not feel like " + nm + " to you" : MEET_TELL[m.tell];
        body.push(P("Wait. That answer " + why + ". Someone else has come out behind " + nm + ".", { "data-cave-bm-secret": m.tell }));
        body.push(P("Who was speaking just then?"));
        body.push(el("div", { class: "oagc-row" }, DAEMONS.filter(function (x) { return x[0] !== blk.daemon; }).concat(MEET_OTHERS).map(function (x) {
          return btn(x[1], { "data-cave-bm-name": x[0] }, function () { m.who = x[0]; m.phase = "thank"; waiterOut(blk, x[0]); placeCard(blk); }, true);
        })));
        return "Someone else spoke";
      }
      if (m.phase === "thank") {
        var w = voiceRow(m.who), wn = m.who === "ideas" ? "your own ideas" : m.who === "unknown" ? "the voice you don't know yet" : lowerName(w[1]);
        body.push(P("Thank " + wn + " for speaking up, and ask it to wait for its own turn. Nothing it said is lost.", { "data-cave-bm-thankask": m.who }));
        body.push(row([btn("Thank you. Please wait; you'll be heard later.", { "data-cave-bm-thank": "" }, function () {
          if (m.waiting.indexOf(m.who) < 0) m.waiting.push(m.who);
          waiterAside(blk); m.phase = "q"; m.lead = "Let me speak to " + nm + " again."; m.picked = []; placeCard(blk);
        })]));
        return "Someone else spoke";
      }
      if (m.phase === "out") {
        var said = [];
        MEET_Q.forEach(function (q) { (m.heard[q.id] || []).forEach(function (l) { said.push(l); }); });
        if (said.length) body.push(el("div", { "data-cave-bm-heard": String(said.length) }, [P(d[1] + " said:")].concat(said.map(function (l) { return P("“" + l + "”", { class: "oagc-note" }); }))));
        body.push(P("Thank you, " + d[1].replace(/^The /, "") + ". Every voice has a right to be heard, and you have been. I'm stepping back out to my own place now, and you have your post again.", { "data-cave-bm-thanks": "" }));
        body.push(row([btn("Step back out", { "data-cave-bm-out": "" }, function () { meetDone(blk); })]));
        return d[1];
      }
      var q = MEET_Q[m.n], cards = ((MEET_CARDS[blk.daemon] || {})[q.id] || []).slice();
      // What it protects you from may be what you carry in (bms-protects-from): the spirits' names are cards too.
      if (q.id === "from") spirits.forEach(function (o) { if (o.name) cards.push([o.name + "."]); });
      body.push(P("Speaking as " + d[1] + " · " + (m.n + 1) + " of " + MEET_Q.length, { class: "oagc-note", "data-cave-bm-step": q.id }));
      if (m.seat) body.push(P("You step into " + nm + "'s place. It steps back to where you stood, and you look back the way you came, the way it keeps watch.", { "data-cave-bm-seat": "" }));
      if (m.lead) body.push(P(m.lead));
      body.push(P(q.ask + " Answer as " + nm + ".", { "data-cave-bm-q": q.id }));
      function answer(lines, out) {
        if (out && out !== blk.daemon) { m.phase = "secret"; m.tell = out; m.draft = ""; placeCard(blk); return; }
        m.heard[q.id] = lines; nextQ();
      }
      function nextQ() { m.picked = []; m.lead = null; m.seat = false; m.draft = ""; m.n++; if (m.n >= MEET_Q.length) m.phase = "out"; placeCard(blk); }
      function firstOut(cs) { for (var i = 0; i < cs.length; i++) if (cs[i][1]) return cs[i][1]; return null; }
      body.push(el("div", { class: "oagc-row" }, cards.map(function (c, ci) {
        var on = m.picked.indexOf(c[0]) >= 0;
        return el("button", { class: on ? "" : "alt", "data-cave-bm-card": String(ci), "aria-pressed": String(on), text: c[0], onclick: function () {
          if (!q.multi) return answer([c[0]], c[1] || null);
          var i = m.picked.indexOf(c[0]); if (i >= 0) m.picked.splice(i, 1); else m.picked.push(c[0]);
          if (c[1] && i < 0) return answer(m.picked.slice(), c[1]);
          placeCard(blk);
        } });
      })));
      var input = el("input", { type: "text", "data-cave-bm-line": "", placeholder: "Or in its own words", maxlength: "200", enterkeyhint: "done", "aria-label": q.ask });
      input.value = m.draft || "";
      input.addEventListener("input", function () { m.draft = input.value; });
      function say() { var t = input.value.trim(); if (!t) return; var picked = cards.filter(function (c) { return m.picked.indexOf(c[0]) >= 0; }); answer(m.picked.concat([t]), firstOut(picked) || meetHeard(t, blk.daemon)); }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); say(); } });
      body.push(el("div", { class: "oagc-compose" }, [input, el("button", { "data-cave-bm-say": "", "aria-label": "Say it", text: "↑", onclick: say })]));
      var kids = [];
      if (q.multi) { var done = btn("That's all of it", { "data-cave-bm-done": "" }, function () { answer(m.picked.slice(), null); }); done.disabled = !m.picked.length; kids.push(done); }
      kids.push(btn("This doesn't sound like " + nm, { "data-cave-bm-wrong": "" }, function () { m.phase = "secret"; m.tell = "felt"; placeCard(blk); }, true));
      kids.push(btn("Sit this one out", { "data-cave-bm-sitout": "" }, nextQ, true));
      kids.push(leave);
      body.push(row(kids));
      return d[1];
    }
    // Stepping back out is always allowed (the Big Mind cave's Self button): the player takes their own place again.
    function meetDone(blk) {
      var m = blk.bm, any = Object.keys(m.heard).some(function (k) { return m.heard[k] && m.heard[k].length; });
      m.phase = "done"; blk.met = any ? "spoken" : "declined";
      placeCard(blk);
    }
    // A voice that was secretly speaking comes out behind the daemon, then walks on ahead and waits by the wall for its own turn.
    function waiterOut(blk, id) {
      var c = blk.route.ctx, r = blk.route, h = ch.h, vr = voiceRow(id); if (!c || c.daemonS == null || !vr) return;
      var fig = buildDaemon(THREE, vr, h * 0.8), a = at(r, c.daemonS + 2.6), lat = (r.w || ch.w) * 0.25;
      fig.position.set(a.x - a.fz * lat, a.y - h * 0.9, a.z + a.fx * lat); fig.rotation.y = yawFacing({ fx: -a.fx, fz: -a.fz });
      fig.userData.who = id; r.group.add(fig); blk.waiters = (blk.waiters || []).concat([fig]); blk.bm.fig = fig;
    }
    function waiterAside(blk) {
      var fig = blk.bm.fig, c = blk.route.ctx, r = blk.route, h = ch.h; blk.bm.fig = null; if (!fig || !c) return;
      var k = blk.waiters.length - 1, s0 = c.daemonS + 2.6, s1 = c.daemonS + 10 + 3 * k, lat0 = (r.w || ch.w) * 0.25, lat1 = (r.w || ch.w) * 0.75;
      tween(2000, function (t) {
        var e = ease(t), a = at(r, s0 + (s1 - s0) * e), lat = lat0 + (lat1 - lat0) * e;
        fig.position.set(a.x - a.fz * lat, a.y - h * 0.9, a.z + a.fx * lat); fig.rotation.y = yawFacing(a);
      }, function () { var a = at(r, s1); fig.rotation.y = yawFacing({ fx: a.fz, fz: -a.fx }); fig.userData.wait = true; });
    }
    function faceCard(blk) {
      var stp = stopOf(state.walk), f = lookup(FACES, stp.face);
      stat.setAttribute("data-cave-place", "face");
      fill(f[1] + " asks", [P(f[3], { "data-cave-face-asks": "" }), P(f[1] + " knows through " + f[2].replace(/^Knows through /, "") + "."), row([btn("Back to the ring", { "data-cave-face-back": "" }, faceBack)])]);
    }

    // ---- the levels: the hall of the six, a face's tunnel, the centre of the self (LEVELS.md, build order step 1) ---------
    // Every move between them is a walk or a door, never a menu. The sitting (the spirits that walk with the player, the doors
    // walked) goes along from place to place; each place is built in the same renderer after a fade, as the dive is.
    var levelG = null;
    function levelStart(o) {
      state.level = { place: null, face: null, where: o.where || "", visited: [], trail: [] };
      state.cur = { id: "level", spot: { id: "level", words: o.where || "the hall" }, texture: "other", element: null, saved: false, passed: 0, blocked: [], skipped: [], level: true };
      state.sens.push(state.cur);
      buildLevel("hall");
      (o.spirits || []).forEach(function (sp) { addSpirit(sp); });
    }
    function goTo(place, face) {
      if (busy) return;
      busy = true; closeModal(); fade.style.opacity = 1;
      setTimeout(function () { busy = false; buildLevel(place, face); fade.style.opacity = 0; }, 520);
    }
    // Home is the WAVE room: this sitting ends and the room opens, with its portal back to the hall.
    function goHome() {
      if (busy) return;
      busy = true; closeModal();
      var where = state.level.where; leave(false);
      setTimeout(function () { homeBase(A, home, { where: where }); }, 540);
    }
    function buildLevel(place, face) {
      var L = state.level, from = L.face;
      clearScene(); parts = {}; state.mode = "chamber"; state.look = { yaw: 0, pitch: 0 }; state.touched = false;
      if (!levelG) { levelG = {}; Object.keys(A.kit).forEach(function (k) { levelG[k] = geomOf(THREE, A.kit[k]); }); }
      parts.G = levelG; parts.tiles = A.tiles; parts.fog = 0.02;
      L.place = place; L.trail.push(place + (place === "tunnel" ? ":" + face : ""));
      if (place === "tunnel") { L.face = face; if (L.visited.indexOf(face) < 0) L.visited.push(face); }
      var h = CHAMBER.h, route = place === "tunnel" ? tunnelRoute(face, h) : roundRoute(place, from, h);
      scene.add(route.group); ch = { main: route, w: route.w, h: h };
      state.mainRoute = route; state.cave = { shape: place === "tunnel" ? face : "round", walls: true, roof: parts.shape.roof, e: parts.shape.e };
      lamp = new THREE.PointLight(0xffe0b0, 1.1, LAMP.reach, LAMP.decay); scene.add(lamp);
      hemi = new THREE.HemisphereLight(0xffffff, 0x302828, 0.45 * LAMP.ambient); scene.add(hemi);
      var lg = route.look;
      lk.idx = -1; lk.light.setHex(lg.light); lk.fog.setHex(lg.fog); lk.fogK = lg.fogK; lk.hemi = lg.hemi; lk.flash = 0.6;
      scene.background.copy(lk.fog); scene.fog.color.copy(lk.fog); scene.fog.density = parts.fog * lg.fogK;
      avatar = buildAvatar(THREE, "self"); scene.add(avatar);
      parts.dress = { wall: parts.rock.userData.hex, width: route.w, fog: parts.fog, element: null, lamp: 0xffe0b0 };
      state.dress = parts.dress;
      state.walk = newWalk(route, null, route.startS);
      var a0 = at(route, route.startS);
      spirits.forEach(function (sp) { sp.g.position.set(a0.x, a0.y - h * 0.92 + 1.7, a0.z); sp.light = carryLight(sp.g, sp.g.userData.color.getHex()); });
      wrap.setAttribute("data-cave-chamber", place); wrap.setAttribute("data-cave-level", place); wrap.setAttribute("data-cave-level-face", place === "hall" ? "" : L.face || "");
      looseNow = 0;
      hint(0);
    }
    // A face's tunnel: the walk's own winding path, two stretches long, in the face's cave and light. It ends in an arch that
    // opens on the centre of the self.
    function tunnelRoute(face, h) {
      var f = lookup(FACES, face), sh = FACE_SHAPE[face], w = CHAMBER.w * sh.w, G = parts.G;
      var r = layoutMain("tunnel:" + face, w, TUNNEL_ROWS);
      r.kind = "tunnel"; r.level = true; r.face = face; r.w = w; r.group = new THREE.Group(); r.look = faceLook(face);
      r.openAt = function () { return 1; }; r.sIn = 0; r.sOut = r.len;
      var rock = parts.rock = stoneOf(THREE, A.tiles, FACE_LOOK[face].rock); parts.shape = sh;
      r.tube = buildTube(THREE, r, { w: w, h: h, rock: rock, openAt: r.openAt, seed: hashOf(face) % 97, shape: sh });
      r.group.add(r.tube.mesh); r.group.add(buildPebbles(THREE, r, w, h, 0, r.len));
      var a0 = at(r, 0.4), cap = new THREE.Mesh(new THREE.CircleGeometry(1, 28), rock);
      cap.position.set(a0.x, a0.y + h * 0.1, a0.z); cap.rotation.y = Math.atan2(a0.fx, a0.fz); cap.scale.set(w * 1.4, h * 1.6, 1); r.group.add(cap);
      r.cap = { mesh: cap, x: a0.x, z: a0.z, fx: a0.fx, fz: a0.fz };
      var dr = buildDressing(THREE, r, G, { w: w, h: h, rock: rock, s0: 0, s1: r.len, seed: "tunnel:" + face + ":dress", clear: [r.startS + 9, r.exitS] });
      r.group.add(dr); darken(sh, rock, dr);
      r.stops = r.stops.map(function (st, i) {
        return i === 0 ? { s: st.s, level: "knows", title: f[1] + "'s tunnel", words: f[2] + ". The stone here is " + FACE_LOOK[face].vibe + "." }
          : { s: st.s, level: "asks", title: f[1] + " asks", words: f[3] };
      });
      r.markers = r.stops.map(function (st) { var m = buildMarker(THREE, w, h, f[4]), a = at(r, st.s + MARK_AHEAD); m.position.set(a.x, a.y - h * 0.92 + MARK_Y, a.z); r.group.add(m); return m; });
      var xa = at(r, r.exitS - 0.2), arch = new THREE.Mesh(G.portal_arch, new THREE.MeshBasicMaterial({ color: f[4] }));
      arch.position.set(xa.x, -h * 0.92, xa.z); arch.rotation.y = yawFacing(xa); arch.scale.setScalar(Math.min(w * 0.55, h * 0.7)); r.group.add(arch);
      var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 40, 12, 1, true), new THREE.MeshBasicMaterial({ color: FACE_LOOK[face].light, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
      beam.position.set(xa.x, 18, xa.z); r.group.add(beam);
      r.motes = buildMotes(r, w, h); r.group.add(r.motes);
      r.ctx = { holder: new THREE.Group(), lampHex: FACE_LOOK[face].light };
      return r;
    }
    // The hall and the centre: one ring of path round an open middle, its doors in the outer wall. The hall's doors go round in
    // altitude order with the face's stone in the middle before each, and the portal home last. The centre wears the face the
    // player came by (its light, its stone, its pool), its portals start from the next face on, and its last stop holds the
    // ways back. The portal just come through is dim.
    function roundRoute(place, from, h) {
      var centre = place === "centre" && !!from, w = ROUND.w, r = layoutRing(ROUND.R), fl = -h * 0.92, out = -r.inner;
      r.level = true; r.w = w; r.group = new THREE.Group(); r.look = centre ? faceLook(from) : HALL_LOOK;
      r.openAt = function () { return 1; }; r.startS = 3;
      var rock = parts.rock = stoneOf(THREE, A.tiles, centre ? FACE_LOOK[from].rock : ROUND_ROCK); parts.shape = ROUND.shape;
      r.tube = buildTube(THREE, r, { w: w, h: h, rock: rock, openAt: r.openAt, seed: centre ? 41 : 17, shape: ROUND.shape });
      r.tube.addHole({ s0: -10, s1: r.len + 10, side: r.inner, all: true }); // the inner wall and that half of the roof: gone, so the middle shows
      r.group.add(r.tube.mesh); r.group.add(buildPebbles(THREE, r, w, h, 0, r.len));
      var floor = new THREE.Mesh(new THREE.CircleGeometry(ROUND.R - w * 0.15, 64), rock.userData.floor || rock);
      floor.rotation.x = -Math.PI / 2; floor.position.y = fl - 0.05; r.group.add(floor);
      var order = FACES.map(function (f) { return f[0]; }), list;
      if (centre) { var k = order.indexOf(from); list = order.slice(k + 1).concat(order.slice(0, k)); } else list = order;
      var n = list.length + 1, G = parts.G;
      r.stops = list.map(function (id, i) {
        var f = lookup(FACES, id);
        return { s: r.startS + r.len * (i + 1) / (n + 1), level: centre ? "portal" : "door", toFace: id, title: f[1] + (centre ? "'s portal" : "'s door"), words: f[3] };
      });
      r.stops.push(centre ? { s: r.startS + r.len * n / (n + 1), level: "ways", title: "The ways back", words: "Back to the hall of the six, or home to the WAVE room." }
        : { s: r.startS + r.len * n / (n + 1), level: "home", title: "The portal home", words: "The way you came in. The WAVE room is through it." });
      if (centre) { var fr = lookup(FACES, from); r.stops[0].walkTitle = "The centre of the self"; r.stops[0].walkWords = "You came by " + fr[1] + ", so the chamber wears its colour. The other five faces' portals glow round the wall."; }
      else { r.stops[0].walkTitle = "The hall of the six"; r.stops[0].walkWords = "Six doors round the wall, one for each face. Walk to one, and its question shows."; }
      // A door in the outer wall, the figure's size and more (Wendell, 14 October 2026: "The gates for the 6 game master room are too
      // small. They should be doors."): a frame in the face's colour, its opening lit with the face's light, the door leaf
      // standing open into the hall, a lit threshold and the face's name above. It stands just in from the stone, where the
      // wall is upright, and the frame runs back to the stone so no gap shows beside it.
      var DOOR_W = 3.2, DOOR_H = Math.min(5, AVATAR_H * 1.4), DOOR_AT = 0.9;
      function doorShape(x0) { var sh = new THREE.Shape(), rr = DOOR_W / 2; sh.moveTo(x0 - rr, 0); sh.lineTo(x0 + rr, 0); sh.lineTo(x0 + rr, DOOR_H - rr); sh.absarc(x0, DOOR_H - rr, rr, 0, Math.PI, false); sh.lineTo(x0 - rr, 0); return sh; }
      function door(s, hex, dim, name) {
        var a = at(r, s), nx = -a.fz * out, nz = a.fx * out, rr = DOOR_W / 2, g = new THREE.Group();
        g.position.set(a.x + nx * w * DOOR_AT, fl, a.z + nz * w * DOOR_AT); g.rotation.y = Math.atan2(nx, nz); // local +z runs out into the stone
        var lit = new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.35);
        var opening = new THREE.Mesh(new THREE.ShapeGeometry(doorShape(0), 20), new THREE.MeshBasicMaterial({ color: lit, transparent: true, opacity: dim ? 0.25 : 0.92, side: THREE.DoubleSide }));
        opening.position.z = 0.35; g.add(opening);
        var frameMat = new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: dim ? 0.1 : 0.35, roughness: 0.7, transparent: !!dim, opacity: dim ? 0.4 : 1 });
        [-1, 1].forEach(function (k) { var post = new THREE.Mesh(new THREE.BoxGeometry(0.42, DOOR_H - rr, 1.3), frameMat); post.position.set(k * (rr + 0.21), (DOOR_H - rr) / 2, 0.4); g.add(post); });
        var arch = new THREE.Mesh(G.portal_arch, frameMat); arch.scale.set(rr + 0.21, rr + 0.21, 4); arch.position.set(0, DOOR_H - rr, 0.1); g.add(arch);
        var cap = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + 0.84, 0.4, 1.3), frameMat); cap.position.set(0, DOOR_H + 0.25, 0.4); g.add(cap);
        var leafMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x5a3c28).lerp(new THREE.Color(hex), 0.3), roughness: 0.85, side: THREE.DoubleSide, transparent: !!dim, opacity: dim ? 0.4 : 1 });
        var hinge = new THREE.Group(); hinge.position.set(-rr, 0, 0.3); hinge.rotation.y = -1.15; g.add(hinge); // open, swung in toward the hall
        var leaf = new THREE.Mesh(new THREE.ShapeGeometry(doorShape(rr), 20), leafMat); hinge.add(leaf);
        var sill = new THREE.Mesh(new THREE.CircleGeometry(rr + 0.4, 28, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: lit, transparent: true, opacity: dim ? 0.1 : 0.4, depthWrite: false }));
        sill.rotation.x = -Math.PI / 2; sill.position.set(0, 0.03, 0.3); g.add(sill);
        if (name) { var tag = labelSprite(THREE, name, "#" + new THREE.Color(hex).getHexString(), 2.6); tag.position.set(0, DOOR_H + 0.95, 0); g.add(tag); }
        g.userData = { w: DOOR_W, h: DOOR_H };
        r.group.add(g); (r.doorMeshes = r.doorMeshes || []).push(g);
        return { a: a, nx: nx, nz: nz };
      }
      r.doors = {};
      r.stops.forEach(function (st) {
        var f = st.toFace ? lookup(FACES, st.toFace) : null, d = door(st.s, f ? f[4] : 0xfff1b0, false, f ? f[1] : centre ? "The ways back" : "Home"); // its prompt shows in front of it
        if (f) r.doors[f[0]] = { x: d.a.x + d.nx * w * DOOR_AT, z: d.a.z + d.nz * w * DOOR_AT };
        if (f && !centre) { // the face's stone stands in the middle before its door
          var stone = new THREE.Mesh(G.gate_stone, new THREE.MeshStandardMaterial({ color: f[4], emissive: f[4], emissiveIntensity: 0.6, roughness: 0.8 }));
          stone.position.set(d.a.x - d.nx * (w + 1.4), fl, d.a.z - d.nz * (w + 1.4)); stone.scale.set(2.2, Math.min(h * 1.1, 3.4), 2.2); stone.userData.face = f[0]; r.group.add(stone);
        }
        if (f && !centre && state.level.visited.indexOf(f[0]) >= 0) { // a door walked this sitting keeps a lantern
          var lan = buildLantern(THREE); lan.position.set(d.a.x + d.nx * w * 0.55 - d.a.fx * 2.2, fl, d.a.z + d.nz * w * 0.55 - d.a.fz * 2.2); r.group.add(lan); lanternsOn.push(lan);
        }
      });
      var mid = new THREE.PointLight(r.look.light, 0.9, ROUND.R * 2.2, 1.2); mid.position.set(0, h * 1.2, 0); r.group.add(mid); // the middle has a light of its own
      if (centre) {
        door(0.5, lookup(FACES, from)[4], true); // the way just come through, dim behind the player
        var pool = new THREE.Mesh(new THREE.CircleGeometry(ROUND.R - w - 2.2, 48), new THREE.MeshBasicMaterial({ color: FACE_LOOK[from].light, transparent: true, opacity: 0.55 }));
        pool.rotation.x = -Math.PI / 2; pool.position.y = fl + 0.03; r.group.add(pool); r.pool = pool;
        var beam = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 4, 40, 16, 1, true), new THREE.MeshBasicMaterial({ color: FACE_LOOK[from].light, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
        beam.position.y = 18; r.group.add(beam);
      }
      r.markers = r.stops.map(function (st) { var f = st.toFace ? lookup(FACES, st.toFace) : null, m = buildMarker(THREE, w, h, f ? f[4] : 0xfff1b0), a = at(r, st.s + MARK_AHEAD); m.position.set(a.x, a.y - h * 0.92 + MARK_Y, a.z); r.group.add(m); return m; });
      r.ctx = { holder: new THREE.Group(), lampHex: centre ? FACE_LOOK[from].light : 0xffe0b0 };
      return r;
    }
    function levelCard(stp) {
      var wk = state.walk, n = wk.route.stops.length, f = stp.toFace ? lookup(FACES, stp.toFace) : state.level.face ? lookup(FACES, state.level.face) : null, kids = [];
      var walkOn = function (label) { return btn(label || "Walk on", { "data-level-walkon": "" }, function () { hint((wk.target + 1) % n); }, true); };
      var block = function () { return btn("This step won't go further", { "data-cave-block": "" }, function () { openBlock("tunnel-" + state.level.face, stp.title); }, true); };
      stat.setAttribute("data-cave-place", "level-" + stp.level);
      if (stp.level === "door" || stp.level === "portal") {
        kids.push(P(stp.words, { "data-level-asks": stp.toFace }), P(f[1] + " knows through " + f[2].replace(/^Knows through /, "") + "."));
        if (stp.level === "door" && state.level.visited.indexOf(f[0]) >= 0) kids.push(P("You have walked this one. Its lantern is lit."));
        var go = { "data-level-go-face": f[0] }; go[stp.level === "door" ? "data-level-door" : "data-level-portal"] = f[0];
        kids.push(row([btn("Go through", go, function () { goTo("tunnel", f[0]); }), walkOn()]));
      } else if (stp.level === "home") {
        kids.push(P(stp.words), row([btn("Go home", { "data-level-home": "" }, goHome), walkOn("Walk round again")]));
      } else if (stp.level === "ways") {
        kids.push(P(stp.words), row([btn("Back to the hall", { "data-level-hall": "" }, function () { goTo("hall"); }), btn("Go home", { "data-level-home": "" }, goHome, true), walkOn("Walk round again")]));
      } else if (stp.level === "knows") {
        kids.push(P(stp.words), row([btn("Go on", { "data-level-go": "" }, function () { hint(1); }), block()]));
      } else { // asks: the face's question, at the tunnel's end
        kids.push(P(stp.words, { "data-level-asks": state.level.face }), P("Past the arch is the centre of the self."), row([btn("Walk into the centre of the self", { "data-level-centre": "" }, function () { goTo("centre"); }), block()]));
      }
      fill(stp.title, kids);
    }

    function addPlace() {
      window.OAGBody.pick().then(function (r) {
        if (!r) return;
        var sp = spotNamed(A, r.label);
        if (!sp) { alert("That place is not on the figure yet. Tap the figure to choose one."); return; }
        if (!state.sens.filter(function (o) { return o.id === sp.id; }).length) addSensation(sp);
        if (state.walk.arrived) arrive();
      });
    }
    function meet(blk, id) {
      blk.daemon = id;
      var route = blk.route, c = route.ctx, d = lookup(DAEMONS, id), h = ch.h, a = at(route, stopAt(route, "passage").s + 6);
      if (c.daemonFig) route.group.remove(c.daemonFig);
      c.daemonFig = buildDaemon(THREE, d, h * 1.1);
      c.daemonFig.position.set(a.x, a.y - h * 0.9, a.z); c.daemonFig.rotation.y = yawFacing({ fx: -a.fx, fz: -a.fz });
      c.daemonBase = { x: a.x, z: a.z, nx: -a.fz, nz: a.fx }; c.daemonS = stopAt(route, "passage").s + 6; c.daemonRoute = route; c.daemonMoved = false;
      // its charge shows around it, and Allow's sliders set how large it gets and how bright it can glow (see buildAura)
      c.daemonAura = buildAura(THREE, h * 0.6); c.daemonFig.add(c.daemonAura); c.daemonBlk = blk; c.daemonHex = d[3];
      blk.dm = blk.dm || { grow: ALLOW_GROW, bright: ALLOW_BRIGHT, heat: 6, allowed: false };
      route.group.add(c.daemonFig);
      placeCard(blk);
    }
    function moveDaemon(blk) {
      var c = blk.route.ctx; if (!c.daemonFig) return;
      c.daemonMoved = true; c.daemonT = { t0: performance.now(), to: blk.route.w * 0.6 };
    }

    // ---- the path between two places -------------------------------------------------------
    function save(s) {
      if (s.saved || !s.texture || s.level) return;
      s.saved = true;
      window.OAGBody.record({ location: s.spot.words, texture: s.texture, channel: s.element, where: "cave", blocked: s.blocked.slice(), skipped: s.skipped.slice() });
    }
    function follow(id) {
      var from = me(), to = state.sens.filter(function (o) { return o.id === id; })[0];
      if (!to || to === from || state.mode === "path" || busy) return;
      save(from);
      var Pp = function (sp) { return new THREE.Vector3(sp.position[0] * FIG, (sp.position[1] - 0.9) * FIG, sp.position[2] * FIG); };
      var a = Pp(from.spot), b = Pp(to.spot), mid = a.clone().add(b).multiplyScalar(0.5);
      mid.x *= 0.25; mid.z *= 0.25;
      var curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.5), mid, mid.clone().lerp(b, 0.5), b]);
      clearScene(); state.mode = "path"; state.path = { from: from.id, to: to.id };
      var tint = new THREE.Color((lookup(TEXTURES, from.texture) || TEXTURES[4])[2]).multiplyScalar(0.45);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 1.1, 12, false), new THREE.MeshStandardMaterial({ color: tint, roughness: 0.9, side: THREE.BackSide })));
      scene.add(new THREE.HemisphereLight(0xffffff, 0x302828, 0.35));
      var fl = new THREE.PointLight(0xfff1b0, 0.9, 12); scene.add(fl);
      scene.fog.density = 0.05;
      fill("A path inside the body", [P("From " + from.spot.words + " to " + to.spot.words + ".")], true);
      stat.setAttribute("data-cave-place", "path");
      flight = { curve: curve, t: 0, lamp: fl, done: function () { portal(to); } };
    }
    function leave(doSave) {
      if (doSave && me()) save(me());
      fade.style.opacity = 1;
      setTimeout(function () {
        cancelAnimationFrame(running); window.removeEventListener("resize", size); window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp);
        renderer.dispose(); wrap.remove(); home.style.display = "";
        window.__oagCave.last = state;
      }, 500);
    }

    // The pane follows the figure: it sits above the avatar's head on the screen, held inside the screen and below the buttons.
    var hv = new THREE.Vector3(), paneAt = null;
    function layoutPane() {
      paneAt = null;
      if (docked || !avatar || !page.has || pane.style.display === "none") return;
      var W = canvasBox.clientWidth || 1, H = canvasBox.clientHeight || 1, pw = pane.offsetWidth, ph = pane.offsetHeight;
      hv.set(avatar.position.x, avatar.position.y + AVATAR_H + 0.4, avatar.position.z).project(camera);
      var hx = (hv.x + 1) / 2 * W, hy = (1 - hv.y) / 2 * H;
      if (hv.z > 1) { hx = W / 2; hy = H * 0.6; }
      var x = clamp(hx - pw / 2, 8, Math.max(8, W - pw - 8)), y = clamp(hy - ph - 14, 58, Math.max(58, H - ph - 12));
      pane.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
      pane.style.setProperty("--tail", Math.round(clamp(hx - x, 16, pw - 16)) + "px");
      paneAt = { x: x, y: y, w: pw, h: ph, headX: hx, headY: hy };
    }

    // ---- the frame -------------------------------------------------------------------------
    var tmp = new THREE.Vector3(), baseLamp = new THREE.Color(), tmpC = new THREE.Color();
    var CAM_BACK = 6.2, CAM_UP = 4.6;
    // ---- the staged 3-2-1: where the player and the daemon stand at each step -----------------------------------------
    var stageProbe, stg = { cu: 0, cd: 0, flip: 0, ctx: null, route: null, cam: "far" };
    function t321Of(wk) { return wk && wk.blk && wk.blk.t321 || null; }
    // The target places for the chat's current step, or null when there is no 3-2-1 being staged. u is how far the player's
    // figure has walked toward the daemon's first place (6 is that place); cd is how far the daemon has walked to the player's.
    function stageTarget(wk, c) {
      var b = wk && wk.blk, bm = b && !b.met && b.bm; // meeting it the Big Mind way: the player stands in its place, as at Be it
      if (bm && wk.arrived && c && c.daemonS != null && c.daemonFig && bm.phase !== "done") return { u: 6, cd: 1, flip: 1, cam: "its" };
      var t = t321Of(wk); if (!t || !wk.arrived || !c || c.daemonS == null || !c.daemonFig) return null;
      if (t.paused) return { u: 0, cd: 0, flip: 0, cam: "far" };
      if (t.phase === 2) return { u: 3, cd: 0, flip: 0, cam: t.voice === "it" ? "face-it" : "face-you" };
      if (t.phase === 1 || t.phase === "check") return t.phase === 1 ? { u: 6, cd: 1, flip: 1, cam: "its" } : { u: 3, cd: 0, flip: 0, cam: "face-you" };
      return { u: 0, cd: 0, flip: 0, cam: "far" };
    }
    function placeDaemon(c, cd) {
      if (!c || !c.daemonFig || c.daemonS == null || c.daemonT || c.daemonMoved) return;
      var r = c.daemonRoute, d = at(r, c.daemonS - 6 * cd), h = ch.h;
      c.daemonFig.position.set(d.x, d.y - h * 0.9, d.z);
      c.daemonFig.rotation.y = yawFacing({ fx: cd > 0.5 ? d.fx : -d.fx, fz: cd > 0.5 ? d.fz : -d.fz });
    }
    // Camera and aim for a stage. sa and sd are the path frames under the player's figure and the daemon's first place.
    function stageCam(cam, sa, sd, h, t) {
      var fl = sa.y - h * 0.92, nx = -sa.fz, nz = sa.fx, V = function (x, y, z) { return new THREE.Vector3(x, y, z); };
      if (cam === "face-you") return { pos: V(sa.x - sa.fx * 2.3 + nx * 1.2, fl + 3.4, sa.z - sa.fz * 2.3 + nz * 1.2), aim: V(sd.x, fl + 2.6, sd.z) };
      if (cam === "face-it") return { pos: V(sd.x + sd.fx * 2.3 - nx * 1.2, fl + 3.4, sd.z + sd.fz * 2.3 - nz * 1.2), aim: V(sa.x, fl + 2.6, sa.z) };
      if (cam === "its") return { pos: V(sa.x + sa.fx * 4.2, fl + 4.2, sa.z + sa.fz * 4.2), aim: V(sa.x - sa.fx * 8, fl + 2.2, sa.z - sa.fz * 8) };
      return { pos: V(sa.x - sa.fx * 7.4, fl + 5.2, sa.z - sa.fz * 7.4), aim: V(sd.x, fl + 2.6, sd.z) }; // far: across the chamber
    }
    stageProbe = function () { return { cam: stg.cam, cu: stg.cu, cd: stg.cd, flip: stg.flip, camPos: [camera.position.x, camera.position.y, camera.position.z], avatar: avatar ? [avatar.position.x, avatar.position.z] : null, daemon: stg.ctx && stg.ctx.daemonFig ? [stg.ctx.daemonFig.position.x, stg.ctx.daemonFig.position.z] : null }; };
    function render() {
      var nowMs = performance.now(), dt = Math.min(0.5, (nowMs - last) / 1000); last = nowMs;
      breathStep(dt, nowMs / 1000);
      tweens = tweens.filter(function (tw) {
        var k = Math.min(1, (nowMs - tw.t0) / tw.ms); tw.fn(k);
        if (k >= 1) { if (tw.done) tw.done(); return false; }
        return true;
      });
      sitBtn.style.display = !sit && state.mode === "chamber" && state.walk && promptBox.style.display === "none" ? "" : "none";
      if (flight) {
        flight.t = Math.min(1, flight.t + 0.006);
        var p = flight.curve.getPoint(flight.t), q = flight.curve.getPoint(Math.min(1, flight.t + 0.02));
        camera.position.copy(p); camera.lookAt(q); flight.lamp.position.copy(p);
        if (flight.t >= 1) { var done = flight.done; flight = null; done(); }
      } else if (ch && state.walk && avatar) {
        walkStep(dt);
        var wk = state.walk, route = wk.route, a = at(route, wk.s), h = ch.h, fl = a.y - h * 0.92, c = ctxOf();
        var dir = wk.dir || 1, lat = wk.lat || 0, pathYaw = yawFacing(a);
        a = { x: a.x - a.fz * lat, y: a.y, z: a.z + a.fx * lat, fx: a.fx * dir, fz: a.fz * dir }; // where the figure stands, and the way ahead as the camera takes it
        looseNow += (me().passed / WAVE.length - looseNow) * Math.min(1, dt * 2);
        loosenAvatar(avatar, looseNow, br.b);
        // The staged 3-2-1 (board: cave-321-form = staged): each step of the chat is a place. Face it from across the chamber; Talk
        // to it face to face; Be it from where the daemon stood, looking back; then a step back to one's own place. The player's
        // figure walks between the places and the daemon's figure trades places with it. Step back always returns to the far place.
        var stT = stageTarget(wk, c), stCam = null, stMoving = false;
        if (stg.ctx && stg.ctx !== c) { placeDaemon(stg.ctx, 0); stg.cu = 0; stg.cd = 0; stg.flip = 0; stg.ctx = null; }
        if (stT || stg.cu > 0.002 || stg.cd > 0.002 || stg.flip > 0.002) {
          var sc = stT ? c : stg.ctx, tg = stT || { u: 0, cd: 0, flip: 0 }, se = 1 - Math.exp(-dt * 2.2);
          stg.ctx = sc; stg.route = route; stg.cam = stT ? stT.cam : "far";
          var pu = stg.cu; stg.cu += (tg.u - stg.cu) * se; stg.cd += (tg.cd - stg.cd) * se; stg.flip += (tg.flip - stg.flip) * se;
          stMoving = Math.abs(stg.cu - pu) / Math.max(dt, 0.001) > 0.4;
          if (Math.abs(tg.u - stg.cu) < 0.002) stg.cu = tg.u; if (Math.abs(tg.cd - stg.cd) < 0.002) stg.cd = tg.cd; if (Math.abs(tg.flip - stg.flip) < 0.002) stg.flip = tg.flip;
          placeDaemon(sc, stg.cd);
          if (!stT && stg.cu === 0 && stg.cd === 0 && stg.flip === 0) stg.ctx = null;
        }
        var stepLen = state.auto ? 0.9 : WALK_SPEED / (STEPS_PER_S * STRIDE_K);
        poseAvatar(avatar, state.auto ? state.auto.clk : wk.t, wk.moving || stMoving, dt, br.b, stepLen, state.calm);
        avatar.position.set(a.x, fl + 0.02, a.z);
        avatar.rotation.y = wk.yaw != null && !state.auto ? wk.yaw : pathYaw;
        if (avatar.userData.stepIdx !== avatar.userData.splashIdx) { avatar.userData.splashIdx = avatar.userData.stepIdx; if (!state.calm) splashAt(route, a.x, fl, a.z); }
        if (stg.ctx) { // the figure stands at its place in the staged scene, and the camera is set for it
          var sa = at(route, stg.ctx.daemonS - 6 + stg.cu), sd = at(route, stg.ctx.daemonS);
          avatar.position.set(sa.x, sa.y - h * 0.92 + 0.02, sa.z); avatar.rotation.y = yawFacing(sa) + Math.PI * stg.flip;
          stCam = stageCam(stg.cam, sa, sd, h, t321Of(wk));
        }
        if (spirits.length) { // the spirits walk behind the figure, on the path it came along
          followSpirits(THREE, spirits, function (j) {
            var sp = at(route, Math.max(0, wk.s - dir * (2.2 + 1.6 * j))), d = (j === 0 ? 0.9 : j === 1 ? -1.1 : 0.2) + lat * 0.6;
            return { x: sp.x - sp.fz * d, y: sp.y - h * 0.92 + 1.7, z: sp.z + sp.fx * d };
          }, dt, nowMs, state.calm);
          spirits.forEach(function (o) { if (!o.g.parent) scene.add(o.g); });
        }
        if (sit) sitFrame(dt, nowMs, route, wk, h);
        sitBtn.disabled = !canSit();
        if (route.pendingExit && wk.s > route.len * 0.5) openWayBack(route);
        // camera: behind the figure on the way it follows (wk.camYaw), and a little above. It follows the figure itself, not the
        // path's line (Wendell, 14 October 2026: "Camera controls are clunky in the game master space"): walking across the hall
        // to a door, the camera comes round behind the figure as in the WAVE room. The stone keeps it inside (keepIn, below).
        var frT = state.stack[state.stack.length - 1], back = route.kind === "face" ? 3.6 : CAM_BACK; // a face's tight loop keeps the camera closer
        if (wk.camYaw == null) wk.camYaw = yawFacing(a);
        a.fx = Math.sin(wk.camYaw); a.fz = Math.cos(wk.camYaw); // the way ahead, as the camera takes it
        var cs = wk.s - back, cby = at(route, route.loop ? (cs % route.len + route.len) % route.len : clamp(cs, 0, route.len)).y;
        var cbx = a.x - a.fx * back, cbz = a.z - a.fz * back;
        if (state.peek) { // while an opening appears the camera swings round to show it beside the figure, then lets go
          var px0 = cbx - a.x, pz0 = cbz - a.z, ox = state.peek.x - a.x, oz = state.peek.z - a.z, bestY = 0, bestD = -9;
          for (var yq = -1.4; yq <= 1.4; yq += 0.05) { // the swing that puts the opening straight past the figure; half of it frames both
            var qx = px0 * Math.cos(yq) + pz0 * Math.sin(yq), qz = -px0 * Math.sin(yq) + pz0 * Math.cos(yq), dd = (-qx * ox - qz * oz) / Math.max(1e-6, Math.hypot(qx, qz) * Math.hypot(ox, oz));
            if (dd > bestD) { bestD = dd; bestY = yq; }
          }
          var want0 = bestY * 0.6;
          state.look.yaw += (want0 - state.look.yaw) * (1 - Math.exp(-dt * 3));
          if (nowMs > state.peek.until) state.peek = null;
        }
        var ry = state.look.yaw; tmp.set(cbx - a.x, 0, cbz - a.z);
        var cx = a.x + tmp.x * Math.cos(ry) + tmp.z * Math.sin(ry), cz = a.z - tmp.x * Math.sin(ry) + tmp.z * Math.cos(ry);
        // the camera stays under the roof of the tunnel where it is, so a ramp never lifts it out
        // pitch below 0 is the thumb pushed up: the camera rises toward the roof and looks down on the figure
        var pu = Math.max(0, -state.look.pitch / -LOOK.pitch[0]), cy0 = Math.min(Math.max(cby, a.y) - h * 0.92 + CAM_UP, cby - h * 0.92 + 5);
        var want = new THREE.Vector3(cx, Math.min(cy0 - state.look.pitch * 2.6, fl + h * LOOK.roof), cz);
        var aim = new THREE.Vector3(a.x + a.fx * 3.4 * (1 - pu), fl + 2.2 - 1.2 * pu, a.z + a.fz * 3.4 * (1 - pu));
        if (state.peek) aim.lerp(tmpV.set(state.peek.x, fl + 1.6, state.peek.z), 0.5); // and looks toward it
        if (stCam) { want.copy(stCam.pos); aim.copy(stCam.aim); }
        if (state.camAt) { want.fromArray(state.camAt[0]); aim.fromArray(state.camAt[1]); } // tests: a view from anywhere (an overhead of a level)
        if (state.rise) { want.y = state.rise.y0 + 16 * state.rise.k; aim.set(a.x + a.fx * 6, state.rise.y0 + 6 + 20 * state.rise.k, a.z + a.fz * 6); }
        // The camera stays inside the stone like a drone on a leash (Wendell, 2026-10-13: "Camera shouldn't break the ceiling.
        // We'll need a dynamic camera the follows the player more effectively not unlike a drone. So it stays within the
        // boundaries of the cave"). Where it wants to be, and where it is after easing, are both pulled back inside the
        // tunnel that holds them best: the one being walked, or on a branch's first steps the one it left.
        var tubes = [route.tube]; if (frT && frT.route.tube) tubes.push(frT.route.tube);
        var keepIn = function (v, f, m) { // f of the way to the stone, and at least m short of it
          var best = null; tubes.forEach(function (tb) { var c2 = tb.contain(v, true); if (c2 && (!best || c2.ratio < best.ratio)) best = c2; });
          if (best && (best.ratio > f || best.room < m)) { var q = best.clamp(f, m); v.set(q.x, q.y, q.z); }
        };
        var free = !stCam && !state.rise && !state.camAt;
        if (free) keepIn(want, 0.94, 0.35);
        if (snapCam) { camPos.copy(want); lookAt.copy(aim); snapCam = false; }
        else { var f = 1 - Math.exp(-dt * (stCam ? 3 : 6)); camPos.lerp(want, f); lookAt.lerp(aim, f); }
        if (free) keepIn(camPos, 0.96, 0.25);
        camera.position.copy(camPos); camera.lookAt(lookAt); camera.updateMatrixWorld();
        if (state.camFix) { var ca = state.camFix; camera.position.set(ca[0], ca[1], ca[2]); camera.lookAt(ca[3], ca[4], ca[5]); camera.updateMatrixWorld(); } // tests: a fixed view
        var cp = ch && ch.main && ch.main.cap; if (cp) cp.mesh.visible = (camPos.x - cp.x) * cp.fx + (camPos.z - cp.z) * cp.fz > 0.3;
        // the look follows the choice: the stretch the player chose to walk (or the violet hush of a branch)
        var lg = route.look || (route.kind === "main" ? STEP_LOOK[clamp(wk.target, 0, 6)] : route.kind === "face" ? faceLook(route.style) : SIDE_LOOK), fe = 1 - Math.exp(-dt * 2.2);
        if (route.kind === "face") { // the branch wears its style: the walls ease to its rock, the motes drift in its light
          var rk = route.tube.rock, sc = route.styleCol || (route.styleCol = new THREE.Color(rk.userData.hex)); // the stone's tint, kept unrounded
          tintStone(rk, sc.lerp(tmpC.setHex(FACE_LOOK[route.style].rock), fe).getHex());
        }
        if (route.motes) stepMotes(route.motes, lg, dt, state.calm);
        // a face's loop is tight, so its two glowing openings fill the view from inside it: they fade while the player walks it
        state.stack.forEach(function (fr) {
          var cr = fr.child && fr.child.route, op = route.kind === "face" ? 0.15 : 1;
          if (cr && cr.rims) cr.rims.forEach(function (r) { r.material.opacity += (op - r.material.opacity) * fe; });
          var ar = fr.child && fr.child.route && fr.child.route.ctx && fr.child.route.ctx.arch; if (ar) ar.material.opacity += (op - ar.material.opacity) * fe; // and the way-out arch it loops beside
        });
        syncStyle(route);
        lk.idx = route.kind === "main" ? wk.target : -1;
        lk.light.lerp(tmpC.setHex(lg.light), fe); lk.fog.lerp(tmpC.setHex(lg.fog), fe);
        lk.fogK += (lg.fogK - lk.fogK) * fe; lk.hemi += (lg.hemi - lk.hemi) * fe; lk.flash = Math.max(0, lk.flash - dt / 1.1);
        scene.background.copy(lk.fog).multiplyScalar(LAMP.dim * (parts.shape && parts.shape.dark ? 0.25 : 1)); scene.fog.color.copy(scene.background);
        scene.fog.density = parts.fog * lk.fogK * LAMP.fog * (parts.shape && parts.shape.dark ? LAMP.numbFog : 1); // numbness: black beyond the circle, not a haze inside it
        if (state.voidHex != null) { scene.background.setHex(state.voidHex); scene.fog.density = 0; } // tests: paint the void outside the stone to find gaps
        var mt = state.mainRoute.tube, chg = false;
        for (var qq = 0; qq < STEP_LOOK.length; qq++) {
          var goal = qq <= revealed ? STEP_LOOK[qq].open : CLOSED, nv = openCur[qq] + (goal - openCur[qq]) * fe;
          if (Math.abs(nv - openCur[qq]) > 0.0004) { openCur[qq] = nv; chg = true; }
        }
        if (chg) mt.dirty = true;
        lamp.position.set(a.x, fl + LAMP.above, a.z); // the light is the figure's own: it walks with them
        carried.forEach(function (c2) { c2.light.visible = c2.obj.visible && !!c2.obj.parent; c2.light.position.copy(c2.obj.getWorldPosition(tmpV)); c2.light.position.y += LAMP.above * 0.6; });
        mt.update(br.k);
        state.stack.forEach(function (fr) { if (fr.child && fr.child.route) fr.child.route.tube.update(br.k); });
        var warm = 1 - br.b, surge = lk.flash * lk.flash;
        baseLamp.copy(lk.light).lerp(tmpC.setHex(0xffffff), 0.3).lerp(tmpC.setHex(c && c.lampHex || 0xffe0b0), 0.15).lerp(WARM, warm * 0.2);
        lamp.color.copy(baseLamp); lamp.intensity = LAMP.power * (parts.shape && parts.shape.dark ? LAMP.numbLamp : 1) + 0.15 * warm + 1.6 * surge; // the same circle of light in every stretch and every cave
        waterCalm = state.calm; (waterSheen || (waterSheen = new THREE.Color())).copy(baseLamp).multiplyScalar(0.25 + 0.2 * lamp.intensity);
        hemi.color.setHex(0xffffff).lerp(lk.light, 0.35); hemi.intensity = (lk.hemi + 0.1 * warm + 0.4 * surge) * LAMP.ambient * (parts.shape && parts.shape.dark ? LAMP.numbFill : 1);
        glow.forEach(function (g) { g.m.emissiveIntensity = g.base * (0.7 + 0.6 * br.b); });
        route.markers.forEach(function (m, i) {
          var on = route.kind === "main" ? i < me().passed : i < wk.target || (wk.arrived && wk.target === i);
          var here = i === wk.target;
          m.material.opacity = on ? 0.95 : here ? 0.8 : 0.35;
          m.scale.setScalar(here && !state.calm ? 1 + 0.15 * Math.sin(nowMs / 300) : 1);
        });
        lanternsOn.forEach(function (l, i) { l.userData.lamp.scale.setScalar(state.calm ? 1 : 1 + 0.08 * Math.sin(nowMs / 400 + i)); });
        if (c) {
          if (c.elObj) {
            var pk = c.pulse ? Math.max(0, 1 - (nowMs - c.pulse) / 700) : 0;
            c.elObj.scale.setScalar(1 + 0.3 * pk + 0.07 * (br.b - 0.5));
            if (!state.calm) c.elObj.children.forEach(function (m) { if (m.userData.flame) m.scale.y = 1 + 0.15 * Math.sin(nowMs / 90 + m.position.x * 9); });
          }
          if (c.daemonT) {
            var dk = ease(Math.min(1, (nowMs - c.daemonT.t0) / 900)), db = c.daemonBase;
            c.daemonFig.position.x = db.x + db.nx * c.daemonT.to * dk; c.daemonFig.position.z = db.z + db.nz * c.daemonT.to * dk;
            if (dk >= 1) c.daemonT = null;
          }
          if (c.daemonFig && c.daemonFig.userData.orb && !state.calm) c.daemonFig.userData.orb.scale.setScalar(1 + 0.2 * Math.sin(nowMs / 250));
          if (c.daemonAura) { // brighter as its charge rises, duller as it is worked through: the reading after, then standing aside
            var dbk = c.daemonBlk, dm = dbk.dm, dl = daemonLevel(dbk), dsz = dm.allowed ? 1 + dm.grow / 10 : 1, dfs = c.daemonFig.scale.x;
            c.daemonFig.scale.setScalar(dfs + (dsz - dfs) * Math.min(1, dt * 2));
            stepAura(c.daemonAura, tmpC.setHex(c.daemonHex), dl, dt, state.calm);
            c.daemonFig.userData.mat.emissiveIntensity = 0.12 + 0.6 * c.daemonAura.userData.level;
          }
        }
        layoutPane();
      }
      renderer.render(scene, camera);
      running = requestAnimationFrame(render);
    }
    size(); window.addEventListener("resize", size);
    if (lv) levelStart(lv); else portal(addSensation(firstSpot));
    render();

    // ---- hooks for the browser test ----------------------------------------------------------
    var api = window.__oagCave;
    api.state = state; api.leave = leave; api.spirits = spirits; api.addSpirit = addSpirit;
    api.breath = function () { return { b: br.b, k: br.k, calm: state.calm, ring: !!ring.parentNode, }; };
    api.avatar = function () {
      var d = avatar.userData, wk = state.walk, a = at(wk.route, wk.s);
      return { x: avatar.position.x, y: avatar.position.y, z: avatar.position.z, scale: [d.body.scale.x, d.body.scale.y], opacity: d.mat.opacity, glow: d.mat.emissiveIntensity,
        offPath: distToRoute(wk.route, avatar.position.x, avatar.position.z), bytes: geometryBytes(avatar), loose: looseNow, s: wk.s, ahead: [a.fx, a.fz], route: wk.route.kind };
    };
    api.joints = function () {
      var J = avatar.userData.J, r = {};
      Object.keys(J).forEach(function (k) { r[k] = J[k].rotation.x; });
      return { names: Object.keys(J), x: r, g: avatar.userData.g, hipsY: J.hips.position.y, spineScale: J.spine.scale.y, shoulderY: J.shoulderL.position.y };
    };
    api.gait = function () {
      var wk = state.walk, d = avatar.userData;
      return { t: wk.t, s: wk.s, s0: wk.s0, D: wk.D, frac: wk.D ? (wk.s - wk.s0) / wk.D : 1, moving: wk.moving, steps: d.stepIdx, time: stretchTime(wk.D),
        inS: BREATH.inS, outS: BREATH.outS, speed: WALK_SPEED, stepsPerS: STEPS_PER_S, arrived: wk.arrived };
    };
    // Free walking: where the figure is on its route and to the side of it, the way the camera takes as ahead, the stop it is at,
    // and whether the stick and a prompt show. stick(x, z) holds the stick as a thumb would (z -1 is up), for the tests.
    api.free = function () {
      var wk = state.walk; if (!wk) return null;
      var lim = walkRange(wk), r = wk.route, hw = (r.w || ch.w) * (r.kind === "main" || r.level ? r.openAt(wk.s) : SIDE_LOOK.open);
      return { s: wk.s, lat: wk.lat, dir: wk.dir, yaw: wk.yaw, camYaw: wk.camYaw, near: wk.near, target: wk.target, arrived: wk.arrived, moving: wk.moving, stop: r.stops[wk.target] ? r.stops[wk.target].s : null,
        range: lim, halfWidth: hw, stick: stickPad.style.display !== "none", prompt: promptBox.style.display !== "none" ? promptBox.textContent : null, sit: sitBtn.style.display !== "none", modal: state.modal };
    };
    api.stick = function (x, z) { stick.x = x; stick.z = z; };
    api.doors = function () { var r = state.walk && state.walk.route; return r && r.doorMeshes ? r.doorMeshes.map(function (g) { return { w: g.userData.w, h: g.userData.h }; }) : []; };
    api.carryLight = carryLight;
    api.sitting = function () { return sit ? { n: sit.n, phase: sit.phase, name: sit.name || sit.gen, hex: sit.g.userData.color.getHex(), scale: sit.g.scale.x, k: sit.k } : null; };
    api.carried = function () { return carried.length; };
    api.look = function () {
      return { idx: lk.idx, light: lk.light.getHex(), fog: lk.fog.getHex(), fogK: lk.fogK, open: openCur.slice(), revealed: revealed, bg: scene.background.getHex(), density: scene.fog.density, lamp: lamp.intensity, reach: lamp.distance };
    };
    // The pane: its words, where it sits on the screen, and where the figure's head is.
    api.stage = function () { return stageProbe(); };
    api.branchStyle = function () { var r = state.walk && state.walk.route; return { shown: styleSel.style.display !== "none", value: styleSel.value, style: r && r.style || null, rock: r && r.kind === "face" ? r.tube.rock.userData.hex : null, light: lk.light.getHex(), motes: !!(r && r.motes) }; };
    api.daemonGlow = function () { var c = ctxOf(); if (!c || !c.daemonAura) return null; var dm = c.daemonBlk.dm; return { level: c.daemonAura.userData.level, want: daemonLevel(c.daemonBlk), scale: c.daemonFig.scale.x, grow: dm.grow, bright: dm.bright, allowed: dm.allowed }; };
    api.sideElement = function () { var wk = state.walk, b = wk && wk.blk, c = b && b.route.ctx; return { shown: !!(c && c.elObj && c.holder.children.length), name: b && b.element, deco: b ? b.deco.length : 0, colony: !!(c && c.colony && c.colony.parent) }; };
    api.pane = function () {
      var r = pane.getBoundingClientRect(), cs = getComputedStyle(pane);
      return { shown: pane.style.display !== "none" && pane.style.visibility !== "hidden" && r.width > 0, title: page.title, text: page.text, at: paneAt, rect: { x: r.left, y: r.top, w: r.width, h: r.height }, font: parseFloat(cs.fontSize), docked: docked };
    };
    api.modal = function () {
      var r = modal.getBoundingClientRect();
      return { open: state.modal, text: modal.textContent, buttons: Array.prototype.map.call(modal.querySelectorAll("button"), function (b) { return b.textContent; }), rect: { x: r.left, y: r.top, w: r.width, h: r.height } };
    };
    api.depth = function () { return state.stack.length; };
    // Whether the camera is inside the tunnel being walked (between its walls, above its floor, under its roof).
    api.camInside = function () {
      var top = state.stack[state.stack.length - 1], a1 = insideOf(state.walk.route);
      if (a1.inside || !top || state.walk.route.kind === "main") return a1;
      var a2 = insideOf(top.route); return a2.inside ? a2 : a1; // on a branch's first steps the camera is still in the tunnel it left
    };
    function insideOf(r) {
      var best = 1e9, bs = 0;
      for (var i = 0; i < r.X.length; i += 2) { var d = Math.hypot(r.X[i] - camera.position.x, r.Z[i] - camera.position.z); if (d < best) { best = d; bs = r.S[i]; } }
      var a = at(r, bs), hw = (r.w || ch.w) * (r.kind === "main" || r.level ? r.openAt(bs) : SIDE_LOOK.open), fl = a.y - ch.h * 0.92;
      return { side: best, halfWidth: hw, above: camera.position.y - fl, roof: ch.h * 1.92, inside: best < hw * 0.95 && camera.position.y > fl && camera.position.y < fl + ch.h * 1.85 };
    };
    // How much room the camera has to the stone, measured against the stone as it stands (positive: inside).
    api.camRoom = function () {
      var top = state.stack[state.stack.length - 1], best = -1e9;
      [state.walk.route, top && top.route].forEach(function (r) { if (r && r.tube) { var c = r.tube.contain(camera.position, true); if (c) best = Math.max(best, c.room); } });
      return best;
    };
    api.clearance = function () {
      var r = state.mainRoute, best = 1e9;
      for (var i = 0; i < r.X.length; i += 2) for (var j = i + 1; j < r.X.length; j += 2) {
        if (r.S[j] - r.S[i] < Math.max(12, Math.PI * r.pitch / 2 * 0.95)) continue; // pairs on one switchback are a bend, not two stretches
        best = Math.min(best, Math.hypot(r.X[i] - r.X[j], r.Z[i] - r.Z[j]));
      }
      return { clearance: best, width: ch.w, maxOpen: OPEN_MAX };
    };
    // The tunnel: one mesh per route, how many faces its openings removed, and the branch that is being walked (where it starts
    // and ends against the spot it left from, and how far below the main path it runs).
    api.tunnel = function () {
      var m = state.mainRoute.tube.mesh;
      return { instanced: state.mainRoute.group.children.filter(function (o) { return o.isInstancedMesh; }).length, mainTris: m.geometry.index.count / 3, rings: state.mainRoute.tube.n, holes: state.mainRoute.tube.holes.length, width: ch.w, len: state.mainRoute.len };
    };
    api.branch = function () {
      var wk = state.walk, r = wk.route; if (r.kind === "main") return null;
      var fr = state.stack[state.stack.length - 1], b = at(fr.route, fr.s), s0 = ptOn(r, 0), s1 = ptOn(r, r.len), lowest = 0;
      for (var i = 0; i < r.Y.length; i++) lowest = Math.min(lowest, r.Y[i] - b.y);
      return { kind: r.kind, len: r.len, startGap: Math.hypot(s0.x - b.x, s0.z - b.z), endGap: Math.hypot(s1.x - b.x, s1.z - b.z), lowest: lowest, stops: r.stops.length,
        holes: r.holes.map(function (H) { return { s0: H.s0, s1: H.s1, side: H.side }; }), opened: fr.route.tube.holes.filter(function (H) { return r.holes.indexOf(H) >= 0; }).length,
        // how far the figure turns from the way it faced on the path to face the way in (2026-10-13: never more than 90°)
        turnIn: Math.acos(clamp((b.fx * (r.cross[0].x - b.x) + b.fz * (r.cross[0].z - b.z)) / Math.max(1e-6, Math.hypot(r.cross[0].x - b.x, r.cross[0].z - b.z)), -1, 1)) * 180 / Math.PI };
    };
    api.meeting = function () { var b = state.walk && state.walk.blk; if (!b) return null; return { met: b.met || null, phase: b.bm ? b.bm.phase : null, n: b.bm ? b.bm.n : null, heard: b.bm ? b.bm.heard : null, waiting: b.bm ? b.bm.waiting.slice() : [], waiters: (b.waiters || []).map(function (f) { return { who: f.userData.who, wait: !!f.userData.wait }; }) }; };
    api.lanterns = function () { return lanternsOn.length; };
    // The level the player is in: the place, the face of the tunnel (or the one the centre wears), the doors walked and the way here.
    api.level = function () {
      var L = state.level, r = state.walk && state.walk.route; if (!L) return null;
      return { place: L.place, face: L.face, visited: L.visited.slice(), trail: L.trail.slice(), kind: r && r.kind, target: state.walk ? state.walk.target : null,
        stops: r ? r.stops.map(function (st) { return st.level + (st.toFace ? ":" + st.toFace : ""); }) : [], look: r && r.look ? r.look.light : null, rock: parts.rock ? parts.rock.userData.hex : null,
        shape: state.cave, spirits: spirits.length, carried: carried.length };
    };
    // Where each opening a branch has cut stands, with views of it from inside the tunnel it opens off (for the gap check).
    // open: also cut the way back that is still waiting, so both seams can be looked at.
    api.openings = function (open) {
      var out = [];
      state.stack.forEach(function (fr) {
        var r = fr.child && fr.child.route; if (!r) return;
        if (open && r.pendingExit) { fr.route.tube.addHole(r.pendingExit); r.pendingExit = null; }
        r.holes.forEach(function (H, wi) {
          if (fr.route.tube.holes.indexOf(H) < 0) return;
          var ms = (H.s0 + H.s1) / 2, a = at(fr.route, ms), nx = -a.fz * H.side, nz = a.fx * H.side, pw = r.pw, h = ch.h;
          var tx = a.x + nx * pw, ty = a.y - h * 0.2, tz = a.z + nz * pw, views = [];
          [-7, -4, 0, 4, 7].forEach(function (d) {
            var c = at(fr.route, clamp(ms + d, 0, fr.route.len));
            [[-0.35, 0.15], [0.1, 0.45], [-0.1, -0.4]].forEach(function (o) {
              var v = [c.x + nx * pw * o[0], c.y + h * o[1], c.z + nz * pw * o[0], tx, ty, tz], ci = fr.route.tube.contain({ x: v[0], y: v[1], z: v[2] });
              if (ci && ci.ratio < 0.85) views.push(v); // only from where a player's camera could stand
            });
          });
          out.push({ kind: r.kind, which: wi, s: ms, views: views });
        });
      });
      return out;
    };
    api.elementScreen = function () {
      var c = ctxOf(), v = c.holder.getWorldPosition(new THREE.Vector3()); v.y += 1.4; v.project(camera);
      var r = dom.getBoundingClientRect();
      return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    };
  }


  // ---- the WAVE room: the cave's home ----------------------------------------------------------------
  // The design: six-faces-council council/callsheets/wave-room.md (Next) and council/passes/6FACE_PASS_wave-room1_2026-10-11.md.
  // Wendell, 11 October 2026: "A player sits in a room with a door. When they welcome a sensation the door opens and a 'charge'
  // shows up." One small scene built from the cave kit: a seat facing a door, the player's faceless figure on the seat, the cave's
  // breath in the walls and the light, Calm, and "Step back". It is reached two ways (board wave-room-cave-link = both): from the
  // body map on its own, and from a daemon's stop in the cave by "Take it home", which leaves a lantern at the spot and comes back
  // to it when the room is done.
  // The flow is a table of steps, as STRETCHES is. wave is the row of WAVE (the game's own words, game.jsx lines 1092-1108);
  // Witness is the room's own step (the pass's table: where it is, and its texture). look is the row of STEP_LOOK the room takes.
  var ROOM_STEPS = [
    { id: "welcome", wave: 0, look: 0 },
    { id: "witness", title: "Witness", words: "Feel into it. Where is it in your body, and what is it like?", look: 0 },
    { id: "acknowledge", wave: 1, look: 1 },
    { id: "allow", wave: 2, look: 2 },
    { id: "accept", wave: 3, look: 3 },
    { id: "appreciate", wave: 4, look: 4, notNow: true },
    { id: "validate", wave: 5, look: 5 },
    { id: "fork", wave: 6, look: 6 },
  ];
  var ROOM_ROUNDS_REST = 3; // board wave-room-stop: after three rounds in a sitting, offer to rest it by the door with a lantern
  var ROOM_TEST_KEY = "oag:wave-room:test"; // the 18 October test: the answer and the round, on this device only
  // Where the player stands at each step of the 3-2-1 in the room (the staged form, board cave-321-form, as in the cave).
  var WHERE_ROOM = { 3: "You are on your seat, looking at it across the room.", 2: "You are face to face with it.", 1: "You are standing where it stood, and it sits in your seat.", check: "You are face to face with it.", after: "You are back on your seat.", paused: "You stepped back behind your seat." };
  var ROOM_CSS = ".oagr{z-index:950}.oagr .oagc-pane{transform:translate(12px,58px)}.oagr .oagc-pane:after{display:none}" +
    ".oagr-field{display:block;width:100%;box-sizing:border-box;min-height:44px;margin:.35rem 0;padding:0 .7rem;border-radius:8px;border:1px solid rgba(255,255,255,.3);background:rgba(20,20,40,.9);color:#f4f4fa;font-size:16px}" +
    ".oagr-note{font-size:.8rem!important;color:#aab0c4}" +
    ".oagr-close{position:absolute;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:6;max-width:420px;margin:0 auto;max-height:40vh;overflow-y:auto;padding:.7rem .9rem;background:rgba(12,12,28,.9);border:1px solid rgba(255,241,176,.5);border-radius:16px;color:#f4f4fa;touch-action:manipulation}" +
    ".oagr-close h2{margin:0 0 .3rem;font-size:1.15rem;color:#fff1b0;display:flex;align-items:center;gap:.5rem}.oagr-close p{margin:.25rem 0;font-size:.95rem;line-height:1.35}.oagr-close .oagc-row{margin-top:.5rem}" +
    ".oagc button.oagr-portalbtn{right:auto;left:10px;border-color:rgba(200,184,255,.7);color:#e8e0ff}" +
    ".oagc button.oagr-sit{position:absolute;right:16px;bottom:calc(40px + env(safe-area-inset-bottom));z-index:5;border-color:rgba(255,241,176,.8);color:#fff1b0;background:rgba(60,30,24,.85)}" +
    ".oagr-dot{display:inline-block;width:14px;height:14px;border-radius:50%;flex:none;box-shadow:0 0 8px currentColor}";

  function readRoomTest() { try { return JSON.parse(localStorage.getItem(ROOM_TEST_KEY) || "[]"); } catch (e) { return []; } }
  function keepRoomTest(entry) { try { var all = readRoomTest(); all.push(entry); localStorage.setItem(ROOM_TEST_KEY, JSON.stringify(all)); } catch (e) { /* storage blocked: the room still plays */ } }

  // opts = { from: "body" | "cave", where (the place's words), texture, element, daemon (its name, from the cave) }. Resolves when
  // the player leaves the room, with { rounds, rested }.
  function openRoom(A, opts) {
    return new Promise(function (resolve) {
      if (!document.getElementById("oagr-css")) document.head.appendChild(el("style", { id: "oagr-css", text: ROOM_CSS }));
      var THREE = A.THREE, G = {};
      Object.keys(A.kit).forEach(function (k) { G[k] = geomOf(THREE, A.kit[k]); });
      var wrap = el("div", { class: "oagc oagr", "data-room": opts.from || "body" });
      var stage = el("div", { class: "oagc-stage" }), fade = el("div", { class: "oagc-fade" });
      var pane = el("div", { class: "oagc-pane", "data-room-pane": "", role: "button", tabindex: "0", style: "display:none" });
      var modal = el("div", { class: "oagc-modal", "data-room-modal": "", "aria-hidden": "true" });
      var stat = el("div", { class: "oagc-sr", "data-room-text": "", "aria-live": "polite" });
      [stage, pane, modal, stat, fade].forEach(function (n) { wrap.appendChild(n); });
      wrap.addEventListener("contextmenu", function (e) { e.preventDefault(); });
      document.body.appendChild(wrap);
      fade.style.opacity = 1; setTimeout(function () { fade.style.opacity = 0; }, 30);

      var renderer = null;
      try { renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); stage.appendChild(renderer.domElement); }
      catch (e) { renderer = null; } // no WebGL: the pages still run, without the scene
      if (renderer) holdArea(renderer.domElement);

      // ---- the room, from the kit ----------------------------------------------------------------------------------------
      var RR = 8, RH = 5.4, DZ = -RR * 0.92, DW = 2.4, DH = 3.4;
      var SEAT = { x: 0, z: 2.4 }, BACK = { x: 1.6, z: 4.2 };
      // Up to three creatures at once (Wendell, 11 October 2026: "One should be able to invite multiple creatures into the space.
      // Up to three and worked through at a time."), each with its own place facing the seat. HERE is the place of the one being
      // worked, and FACE is halfway between it and the seat; both move when the player picks another.
      var SLOTS = [{ x: 0, z: -2.4 }, { x: -2.1, z: -0.9 }, { x: 2.1, z: -0.9 }], SLOT_WORDS = ["in the middle", "on the left", "on the right"], ROOM_MAX = 3;
      var HERE = SLOTS[0], FACE = { x: 0, z: 0 };
      var scene = new THREE.Scene(); scene.background = new THREE.Color(0x120e10); scene.fog = new THREE.FogExp2(0x120e10, 0.03);
      var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
      // The room wears the caves' own stone (Wendell, 13 October 2026: "All of the caves need to use the same assets"): the J1
      // tiles, wet on the walls and dry on the floor, laid at the tunnels' scale. Without the tiles it is a plain colour, as before.
      var rock = stoneOf(THREE, A.tiles, 0x5e4e44);
      var walls = new THREE.Group(); scene.add(walls);
      for (var i = 0; i < 4; i++) { // the cave's wall rings, stood upright and stacked into a round room
        var wr = new THREE.Mesh(G.wall_ring, rock); wr.rotation.x = Math.PI / 2; wr.rotation.z = i * 0.41;
        wr.scale.set(RR * (1 + 0.025 * (i % 2)), RR * (1 + 0.025 * (i % 2)), RH / 4 + 0.05); wr.position.y = i * RH / 4; walls.add(roomUV(THREE, wr, RR, false));
      }
      var dome = new THREE.Mesh(new THREE.SphereGeometry(RR * 1.03, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), rock); dome.scale.y = 0.45; dome.position.y = RH; walls.add(roomUV(THREE, dome, RR, false));
      var floor = new THREE.Mesh(new THREE.CircleGeometry(RR + 0.5, 48), rock.userData.floor);
      floor.rotation.x = -Math.PI / 2; scene.add(roomUV(THREE, floor, RR, true));
      function archShape(x0) { var s = new THREE.Shape(), r = DW / 2; s.moveTo(x0 - r, 0); s.lineTo(x0 + r, 0); s.lineTo(x0 + r, DH - r); s.absarc(x0, DH - r, r, 0, Math.PI, false); s.lineTo(x0 - r, 0); return s; }
      var beyond = new THREE.Mesh(new THREE.ShapeGeometry(archShape(0), 16), new THREE.MeshBasicMaterial({ color: 0xfff1d0 })); // the light beyond the door
      beyond.position.set(0, 0.01, DZ - 0.06); scene.add(beyond);
      // The door slides sideways into the wall (Wendell, 11 October 2026: "Door had to swing through the second part invited ins
      // space. Put it it to the side is desired"), so nothing sweeps the floor a charge comes in on.
      var door = new THREE.Group(); door.position.set(-DW / 2, 0, DZ); scene.add(door);
      door.add(new THREE.Mesh(new THREE.ShapeGeometry(archShape(DW / 2), 16), new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 0.8, side: THREE.DoubleSide })));
      var frameMat = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.7 });
      var arch = new THREE.Mesh(G.portal_arch, frameMat); arch.scale.setScalar(DW / 2 + 0.1); arch.position.set(0, DH - DW / 2, DZ + 0.06); scene.add(arch);
      [-1, 1].forEach(function (k) { var post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, DH - DW / 2, 8), frameMat); post.position.set(k * (DW / 2 + 0.1), (DH - DW / 2) / 2, DZ + 0.06); scene.add(post); });
      // The rug and its cushion (Wendell, 13 October 2026: "We also need to have a rug or a seat players can sit on when they are
      // communing with spirits"). The player sits here to work with what comes in; walking onto the rug offers to sit down.
      var RUG_R = 1.7, rug = new THREE.Mesh(new THREE.CircleGeometry(RUG_R, 48), new THREE.MeshStandardMaterial({ map: rugTexture(THREE), roughness: 0.95 }));
      rug.rotation.x = -Math.PI / 2; rug.position.set(SEAT.x, 0.015, SEAT.z); scene.add(rug);
      var seat = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.46, 24), new THREE.MeshStandardMaterial({ color: 0x8c3b2e, roughness: 0.9 })); // the cushion
      seat.position.set(SEAT.x, 0.23, SEAT.z + 0.15); seat.scale.z = 1.15; scene.add(seat);
      // Home base's portal (LEVELS.md): a second arch in the wall, behind the seat and to its side, glowing faintly. The charge's
      // door stays the charge's door: what comes in comes through the door, and the player goes out through the portal.
      // The Big Mind door (board dp-door; Wendell, 13 October 2026: "The big mind cave need to be accessible from the WAVE room")
      // is the same kind of arch on the other side of the seat, marked with the seven daemons' colours in the order they are met.
      // The portal leads to the six game masters (the hall of the six). The player walks to either one; arriving opens its card.
      var EXITS = {};
      function exitArch(id, ang, hex, glowHex, name) {
        var px = Math.sin(ang) * RR * 0.9, pz = Math.cos(ang) * RR * 0.9, pyaw = Math.atan2(-px, -pz);
        var glow = new THREE.Mesh(new THREE.ShapeGeometry(archShape(0), 16), new THREE.MeshBasicMaterial({ color: glowHex, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
        glow.position.set(px, 0.01, pz); glow.rotation.y = pyaw; scene.add(glow);
        var a2 = new THREE.Mesh(G.portal_arch, new THREE.MeshBasicMaterial({ color: hex })); a2.scale.setScalar(DW / 2 + 0.1);
        a2.position.set(px - Math.sin(pyaw) * 0.06, DH - DW / 2, pz - Math.cos(pyaw) * 0.06); a2.rotation.y = pyaw; scene.add(a2);
        var tag = labelSprite(THREE, name, "#" + new THREE.Color(hex).getHexString(), 2.6); tag.position.set(px * 0.9, DH + 0.45, pz * 0.9); scene.add(tag);
        var k = (RR - 2.2) / (RR * 0.9); // where the figure stands to go through: just in front of it
        EXITS[id] = { id: id, x: px, z: pz, yaw: pyaw, stand: { x: px * k, z: pz * k }, glow: glow, arch: a2 };
        return EXITS[id];
      }
      if (opts.portal) exitArch("portal", 0.8, 0xe0d8ff, 0xc8b8ff, "The six game masters");
      if (opts.bigMind) {
        var bm = exitArch("bigmind", -0.8, 0xfff1b0, 0x9a8ad8, "Big Mind");
        DAEMONS.forEach(function (d, n) { // seven small lights round the arch, the Protector's first on the left
          var t = Math.PI * (1 - n / (DAEMONS.length - 1)), r = DW / 2 + 0.42, lx = Math.cos(t) * r, ly = DH - DW / 2 + Math.sin(t) * r;
          var dot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: d[3] }));
          dot.position.set(bm.x + Math.cos(bm.yaw) * lx + Math.sin(bm.yaw) * 0.12, ly, bm.z - Math.sin(bm.yaw) * lx + Math.cos(bm.yaw) * 0.12); scene.add(dot);
        });
      }
      var hemi = new THREE.HemisphereLight(0xfff4e0, 0x2a2420, 0.4); scene.add(hemi);
      var lamp = new THREE.PointLight(0xffe0b0, 1, 34); lamp.position.set(0, RH * 0.85, 1.4); scene.add(lamp);
      var doorLight = new THREE.PointLight(0xfff1d0, 0, 14); doorLight.position.set(0, 2, DZ + 1.2); scene.add(doorLight);
      var avatar = buildAvatar(THREE, "self"); scene.add(avatar);
      var FIG_K = 0.6; avatar.scale.setScalar(FIG_K); // the cave's figure is 3.6 tall for its long tunnels; in the room it stands about 2.2, under the door
      avatar.position.set(SEAT.x, 0, SEAT.z); avatar.rotation.y = Math.PI;

      // ---- the charge: a grey shape that takes the texture, and then its element's colour -------------------------------------
      var GREY = 0x8a8a92;
      function buildCharge() {
        var g = new THREE.Group(), body = new THREE.Group(), S = new THREE.SphereGeometry(1, 18, 12);
        var mat = new THREE.MeshStandardMaterial({ color: GREY, roughness: 0.6, emissive: GREY, emissiveIntensity: 0.2, transparent: true, opacity: 0.85 });
        [[0, 1.1, 0, 0.62, 0.8, 0.55], [0.15, 1.78, 0.04, 0.38, 0.4, 0.36], [-0.24, 0.72, 0.08, 0.42, 0.45, 0.4]].forEach(function (q) {
          var m = new THREE.Mesh(S, mat); m.position.set(q[0], q[1], q[2]); m.scale.set(q[3], q[4], q[5]); body.add(m);
        });
        var core = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
        core.position.set(0, 1.2, 0.42); body.add(core); g.add(body);
        var aura = buildAura(THREE, 1.25); g.add(aura);
        g.userData = { mat: mat, body: body, core: core, aura: aura, col: new THREE.Color(GREY), want: new THREE.Color(GREY), sx: 1, sy: 1, op: 0.85, steady: false };
        return g;
      }
      function dressCharge(c) {
        var u = c.fig.userData, look = AVATAR_LOOK[c.texture] || null, e = c.element && lookup(ELEMENTS, c.element);
        u.sx = look ? look.sx[0] : 1; u.sy = look ? look.sy[0] : 1; u.op = look ? 0.3 + 0.55 * look.op[0] : 0.85;
        u.want.setHex(e ? e[3] : GREY); u.steady = !!c.steady;
      }
      // A feeling about a feeling (Wendell, 11 October 2026: "being able to have emotions about the emotions and sensations that
      // show up is key ... so they don't spam emotions about emotions as separate creatures"): a ring around the creature it is
      // about, in its own colour, with the name the player writes. It flickers until it is validated with that creature.
      function addLayer(c, name, element) {
        var n = c.layers.length, e = element && lookup(ELEMENTS, element), hex = e ? e[3] : GREY;
        var ring = new THREE.Mesh(new THREE.TorusGeometry(0.95 + 0.14 * n, 0.045, 8, 40), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.8, depthWrite: false }));
        ring.rotation.x = Math.PI / 2 - 0.25; ring.position.y = 0.85 + 0.42 * n;
        var label = labelSprite(THREE, name, "#" + new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.5).getHexString(), 2.2); label.position.set(1.5 + 0.14 * n, ring.position.y + 0.12, 0);
        c.fig.add(ring); c.fig.add(label);
        var l = { name: name, element: element || null, ring: ring, label: label, steady: !!c.steady };
        c.layers.push(l); return l;
      }
      // A light the charge leaves on the threshold, named by the player, for the sitting.
      function buildLight(hex, name, n) {
        var g = new THREE.Group();
        var orb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), new THREE.MeshBasicMaterial({ color: hex })); orb.position.y = 0.32; g.add(orb);
        var halo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.22, depthWrite: false })); halo.position.y = 0.32; g.add(halo);
        var cv = document.createElement("canvas"); cv.width = 512; cv.height = 96;
        var cx = cv.getContext && cv.getContext("2d");
        if (cx) { cx.font = "600 44px -apple-system,Segoe UI,Roboto,sans-serif"; cx.textAlign = "center"; cx.fillStyle = "#fff1d0"; cx.fillText(name.slice(0, 22), 256, 62); }
        var label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false })); label.scale.set(3, 0.56, 1); label.position.y = 1.05; g.add(label);
        g.position.set(-0.9 + 0.6 * (n % 4), 0, DZ + 0.9 + 0.5 * Math.floor(n / 4));
        g.userData = { halo: halo, name: name };
        return g;
      }

      // ---- the sitting -------------------------------------------------------------------------------------------------------
      // R.phase is the step's id from ROOM_STEPS, or opening, stays, kept, goes, leaving, gone, checkin, again, end.
      // R.active holds the creatures in the room being worked (up to three); ch is the one the player is working now. Each keeps
      // its own step in c.phase while another is worked. R.waiting counts the ones that came while three were in.
      var R = { round: 1, phase: "welcome", back: false, close: null, calm: false, speed: 1, lights: [], kept: [], rested: false, sitting: Date.now(), from: opts.from || "body", modal: false, view: "seat", doorOpen: 0, doorWant: 0, wait: null, moves: [], active: [], waiting: 0, prev: null, layer: null, worked: [] };
      function newCharge(first, slot) {
        var c = { where: opts.where || "", texture: first ? opts.texture || null : null, element: first ? opts.element || null : null, known: !!(first && opts.element), name: "", goal: "", push: null, t321: null, move: "", line: "", lightName: "", steady: false, gone: false,
          slot: slot || 0, phase: "welcome", allow: { grow: ALLOW_GROW, bright: ALLOW_BRIGHT }, allowed: false, heat: 6, dull: 1, layers: [] };
        c.fig = buildCharge(); c.fig.visible = false; c.fig.position.set(0, 0, DZ - 2.5); scene.add(c.fig); dressCharge(c);
        return c;
      }
      var ch = newCharge(true); R.active.push(ch);
      function inRoom() { return R.active.filter(function (c) { return !c.gone && R.kept.indexOf(c) < 0; }); }
      function freeSlot() { var used = inRoom().map(function (c) { return c.slot; }); for (var i = 0; i < ROOM_MAX; i++) if (used.indexOf(i) < 0) return i; return -1; }
      function setFocus(c) {
        if (ch !== c && R.active.indexOf(ch) >= 0) ch.phase = R.phase;
        ch = c; HERE = SLOTS[c.slot]; FACE = { x: HERE.x / 2, z: (HERE.z + SEAT.z) / 2 };
        R.phase = c.phase; R.back = false;
      }
      function labelOf(c) { return c.name.trim() || "The one " + SLOT_WORDS[c.slot]; }
      // How brightly a creature glows, 0 to 1: its charge, up to the brightness allowed it, duller as it is worked through.
      function levelOf(c) { return clamp(heatOf(c.t321, c.heat) / 10, 0, 1) * (c.allow.bright / 10) * c.dull; }
      var br = { b: 0.5, t0: performance.now() / 1000, exhaling: false };
      var fig = { x: SEAT.x, z: SEAT.z, sit: 1, yaw: Math.PI, clk: 0 };

      // A close-up (below) keeps the step's page tucked away until the player goes back to the room, and keeps its card current.
      function draw() { drawPage(); if (R.close) { closeModal(); pane.style.display = "none"; closeCard(); } }
      function drawPage() {
        modal.innerHTML = ""; stat.innerHTML = ""; pane.innerHTML = "";
        var pg = page(), kids = pg.kids || [];
        modal.appendChild(el("h2", { text: pg.title }));
        kids.forEach(function (k) { modal.appendChild(k); });
        stat.appendChild(el("h2", { text: pg.title })); kids.forEach(function (k) { if (k.tagName === "P") stat.appendChild(el("p", { text: k.textContent })); });
        stat.setAttribute("data-room-phase", R.phase); stat.setAttribute("data-room-round", String(R.round));
        pane.appendChild(el("strong", { text: pg.title }));
        var first = kids.filter(function (k) { return k.tagName === "P"; })[0]; if (first) pane.appendChild(el("span", { text: first.textContent }));
        if (pg.still) { closeModal(); pane.style.display = ""; return; } // a page with nothing to choose: the pane, so the room is in view
        if (R.active.length > 1 && !R.back && ["else", "layer", "waiting"].indexOf(R.phase) < 0) modal.appendChild(focusRow());
        modal.appendChild(row([btn("Look around", { "data-room-shrink": "" }, closeModal, true)]));
        pane.style.display = ""; openModal();
      }
      function openModal() { stopWalking(); if (stickKnob) stickUp(); R.modal = true; modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); pane.style.visibility = "hidden"; }
      function closeModal() { R.modal = false; modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); pane.style.visibility = ""; }
      pane.addEventListener("click", function () { if (modal.childNodes.length) openModal(); });
      function field(attr, value, hint, onInput) {
        var f = el("input", { type: "text", class: "oagr-field", placeholder: hint, "aria-label": hint }); f.setAttribute(attr, "");
        f.value = value || ""; f.addEventListener("input", function () { onInput(f.value); });
        f.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); f.blur(); } });
        return f;
      }
      function pickRow(attr, opts2, picked, onPick) {
        return el("div", { class: "oagc-row" }, opts2.map(function (o) {
          var b = el("button", { class: "alt", "aria-pressed": String(picked === o[0]), text: o[1], onclick: function () { onPick(o[0]); } }); b.setAttribute(attr, o[0]); return b;
        }));
      }
      function stepBack() { return btn("Step back", { "data-room-step-back": "" }, function () { R.back = true; draw(); }, true); }
      // Which creature is being worked: the player picks, and each keeps its own step.
      function focusRow() {
        return el("div", {}, [el("p", { class: "oagr-note", text: "Working with:" }), el("div", { class: "oagc-row" }, R.active.map(function (c, n) {
          // Each part shows the element chosen for it, in its colour (Wendell, 13 October 2026: "Working on a different part
          // should let me know what elements I've chosen for them").
          var e = c.element && ELEMENTS.filter(function (x) { return x[0] === c.element || x[1] === c.element; })[0];
          var b = el("button", { class: c === ch ? "" : "alt", "aria-pressed": String(c === ch), text: labelOf(c) + (e ? " · " + e[1] : ""), onclick: function () { if (c !== ch) { setFocus(c); draw(); } } });
          if (e) b.style.borderLeft = "6px solid #" + ("00000" + e[3].toString(16)).slice(-6);
          b.setAttribute("data-room-focus", String(n)); if (e) b.setAttribute("data-room-focus-element", e[1].toLowerCase()); return b;
        }))]);
      }
      // "What else is here?" (Wendell: "This will be the greatest use case for 'what else is here'"): first, is it about one of the
      // creatures already here? Then it is a layer on that one. Only something new comes in through the door, as a creature of its own.
      function elseBtn() { return btn("What else is here?", { "data-room-else": "" }, function () { R.prev = R.phase; R.phase = "else"; R.back = false; draw(); }, true); }
      function go(phase) { R.phase = phase; R.back = false; draw(); }
      function stepIndex(id) { for (var i = 0; i < ROOM_STEPS.length; i++) if (ROOM_STEPS[i].id === id) return i; return -1; }
      function nextStep() { var i = stepIndex(R.phase); go(ROOM_STEPS[i + 1].id); }
      function words(st) { return st.wave != null ? WAVE[st.wave] : [st.id, st.title, st.words]; }
      function nm() { return ch.name || "It"; }

      // The pages. Each returns { title, kids, still }. A still page (the door opening, the charge leaving) shows the pane only.
      function page() {
        var ph = R.phase, i = stepIndex(ph), st = i >= 0 ? ROOM_STEPS[i] : null, w = st ? words(st) : null, k = [];
        if (R.back) {
          return { title: "Stepped back", kids: [P("You stepped back behind your seat. " + (ch.fig.visible ? nm() + " is still here, and your" : "Your") + " words are kept.", { "data-room-paused": "" }),
            row([btn("Go back in", { "data-room-resume": "" }, function () { R.back = false; draw(); })])] };
        }
        if (ph === "welcome") {
          k.push(P(w[2], { "data-room-prompt": "" }));
          k.push(P(ch.waited ? "The one that waited at the door is still there." : R.round > 1 ? "Something else is at the door." : ch.known ? "You brought it home from the cave. Its feeling comes with it." : "You are on your seat, facing the door."));
          if (Object.keys(EXITS).length && R.round === 1) k.push(P("Walk round the room with the circle at the bottom left (or the arrow keys), or tap the floor. The rug is where you sit to work with what comes in. " + (EXITS.bigmind && EXITS.portal ? "Behind you are two doors: Big Mind on the left, and the six game masters on the right." : "Behind you is a door."), { "data-room-walk-hint": "" }));
          k.push(row([btn("Welcome it", { "data-room-welcome": "" }, function () { R.phase = "opening"; R.wait = "door-in"; draw(); })]));
          return { title: w[1], kids: k };
        }
        if (ph === "opening") return { title: "The door", kids: [P(R.calm ? "The door opens." : "On your next out-breath, the door opens.")], still: true };
        if (ph === "else") {
          var here = inRoom();
          k.push(P("Something else is here. Is it about " + (here.length > 1 ? "one of the ones" : "the one") + " already in the room?", { "data-room-else-ask": "" }));
          k.push(el("div", { class: "oagc-row" }, here.map(function (c) {
            var b = el("button", { text: "About " + labelOf(c), onclick: function () { R.layer = { c: c, name: "", element: null, unknown: false }; R.phase = "layer"; draw(); } });
            b.setAttribute("data-room-else-about", String(R.active.indexOf(c))); return b;
          })));
          k.push(row([btn("Something new", { "data-room-else-new": "" }, somethingNew, true), btn("Back", { "data-room-else-back": "" }, function () { go(R.prev); }, true)]));
          return { title: "What else is here?", kids: k };
        }
        if (ph === "layer") {
          var L = R.layer, about = labelOf(L.c);
          k.push(P("A feeling about " + about + ". Welcome it as part of " + about + ".", { "data-room-layer-ask": "" }));
          var wl = btn("Welcome it with " + about, { "data-room-layer-welcome": "" }, function () {
            addLayer(L.c, L.name.trim(), L.element); R.layer = null; go(R.prev);
          });
          var lready = function () { wl.disabled = !(L.name.trim() && (L.element || L.unknown)); };
          k.push(field("data-room-layer-name", L.name, "A name for it", function (v) { L.name = v; lready(); }));
          k.push(pickRow("data-room-layer-element", ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }).concat([["unknown", "I don't know"]]),
            L.unknown ? "unknown" : L.element, function (v) { L.unknown = v === "unknown"; L.element = v === "unknown" ? null : v; draw(); }));
          k.push(P(L.c.steady ? about + " is validated already, and this is validated with it." : "It is validated when " + about + " is.", { class: "oagr-note" }));
          lready(); k.push(row([wl, btn("Back", { "data-room-else-back": "" }, function () { R.layer = null; go(R.prev); }, true)]));
          return { title: "A feeling about a feeling", kids: k };
        }
        if (ph === "waiting") {
          k.push(P("Three are in the room already. The new one waits at the door until one of them has been worked through.", { "data-room-waiting": "" }));
          k.push(row([btn("Go on", { "data-room-next": "" }, function () { go(R.prev); })]));
          return { title: "It waits at the door", kids: k };
        }
        if (ph === "witness") {
          k.push(P(w[2], { "data-room-prompt": "" }));
          k.push(P(ch.where ? "Where: " + ch.where + "." : "Where is it?", { "data-room-where": "" }));
          if (window.OAGBody) k.push(row([btn(ch.where ? "It's somewhere else" : "Tap where it is", { "data-room-where-pick": "" }, function () {
            window.OAGBody.pick().then(function (r) { if (r) { ch.where = r.label; draw(); } });
          }, true)]));
          k.push(P("What is it like?"));
          k.push(pickRow("data-room-texture", TEXTURES.map(function (t) { return [t[0], t[1]]; }), ch.texture, function (v) { ch.texture = v; dressCharge(ch); draw(); }));
          var nx = btn("Go on", { "data-room-next": "" }, nextStep); nx.disabled = !ch.texture;
          k.push(row([nx, elseBtn(), stepBack()]));
          return { title: w[1], kids: k };
        }
        if (ph === "acknowledge") {
          k.push(P(w[2], { "data-room-prompt": "" }));
          k.push(P("Give it a name, in your own words. Then its element, if you know it."));
          var go1 = btn("Go on", { "data-room-next": "" }, nextStep);
          var ready = function () { go1.disabled = !(ch.name.trim() && (ch.element || ch.elementUnknown)); };
          k.push(field("data-room-name", ch.name, "A name for it", function (v) { ch.name = v; ready(); }));
          k.push(pickRow("data-room-element", ELEMENTS.map(function (x) { return [x[0], x[0] + " · " + x[1]]; }).concat([["unknown", "I don't know"]]),
            ch.elementUnknown ? "unknown" : ch.element, function (v) { ch.elementUnknown = v === "unknown"; ch.element = v === "unknown" ? null : v; dressCharge(ch); draw(); }));
          ready(); k.push(row([go1, elseBtn(), stepBack()]));
          return { title: w[1], kids: k };
        }
        if (st && ph !== "fork") { // allow, accept, appreciate, validate
          k.push(P(w[2], { "data-room-prompt": "" }));
          if (ph === "allow") { // it grows a little by itself; the player says how large, and how bright its colour can get
            ch.allowed = true;
            k.push(P(nm() + " grows a little as you let it be here.", { "data-room-allow": "" }));
            allowSliders(ch.allow, "data-room-allow-slider").forEach(function (n) { k.push(n); });
          }
          if (ph === "validate" && ch.layers.length) k.push(P("This holds " + ch.layers.map(function (l) { return l.name; }).join(" and ") + " too.", { "data-room-validate-layers": "" }));
          var kk = [btn("Go on", { "data-room-next": "" }, function () {
            if (ph === "validate") { ch.steady = true; ch.dull = 0.6; ch.layers.forEach(function (l) { l.steady = true; }); dressCharge(ch); } // worked through: it dulls
            nextStep();
          })];
          if (st.notNow) kk.push(btn("Not now", { "data-room-notnow": "" }, nextStep, true));
          kk.push(elseBtn()); kk.push(stepBack()); k.push(row(kk));
          return { title: w[1], kids: k };
        }
        if (ph === "fork") {
          k.push(P(w[2], { "data-room-prompt": "" }));
          k.push(P("What do you actually want right now?", { "data-room-goal-ask": "" }));
          var tw = btn("Toward it", { "data-room-push": "toward" }, function () { ch.push = "toward"; startStays(); });
          var aw = btn("Away from it", { "data-room-push": "away" }, function () { ch.push = "away"; go("goes"); }, true);
          var ok = function () { tw.disabled = aw.disabled = !ch.goal.trim(); };
          k.push(field("data-room-goal", ch.goal, "What you want, in your words", function (v) { ch.goal = v; ok(); }));
          k.push(P("Is " + nm() + " pushing your next move toward it, or away from it?"));
          ok(); k.push(row([tw, aw, stepBack()]));
          k.push(P("What you write stays on this page.", { class: "oagr-note" }));
          return { title: w[1], kids: k };
        }
        if (ph === "stays") {
          var title = talk321(ch.t321, { name: nm(), damaged: false, skippable: true, redraw: draw, focus: function () { focusChat(modal); }, where: WHERE_ROOM, aim: "Aimed at what you want: " + ch.goal,
            ask: function (body) {
              body.push(P("What is one next move toward " + ch.goal + "? Write it.", { "data-room-move-ask": "" }));
              var done = btn("That's my move", { "data-room-move-done": "" }, function () { keep(); });
              body.push(field("data-room-move", ch.move, "One next move", function (v) { ch.move = v; done.disabled = !v.trim(); }));
              done.disabled = !ch.move.trim(); body.push(row([done]));
            } }, k);
          return { title: title, kids: k };
        }
        if (ph === "kept") {
          k.push(P(nm() + " has a place in the room now.", { "data-room-kept": "" }));
          k.push(P("Your next move: " + ch.move));
          k.push(row([btn("Go on", { "data-room-next": "" }, function () { go("checkin"); })]));
          return { title: "It stays", kids: k };
        }
        if (ph === "goes") {
          k.push(P("Let the out-breath carry it. It leaves at its own pace, and it can come back."));
          k.push(field("data-room-line", ch.line, "A line to it, if you want", function (v) { ch.line = v; }));
          k.push(field("data-room-light-name", ch.lightName, "A name for the light it leaves", function (v) { ch.lightName = v; }));
          k.push(row([btn("Breathe out", { "data-room-exhale": "" }, function () { R.phase = "leaving"; R.wait = "door-out"; draw(); }), stepBack()]));
          return { title: "Exhale", kids: k };
        }
        if (ph === "leaving") return { title: "Exhale", kids: [P(R.calm ? "The door opens, and it goes when it's ready." : "On your out-breath the door opens, and it goes when it's ready.")], still: true };
        if (ph === "gone") {
          k.push(P("A light in its colour stays on the threshold: " + lightName() + ". The door stays ajar. It can come back.", { "data-room-gone": "" }));
          if (ch.line.trim()) k.push(P("You told it: " + ch.line.trim()));
          k.push(row([btn("Go on", { "data-room-next": "" }, function () { go("checkin"); })]));
          return { title: "It left", kids: k };
        }
        if (ph === "checkin") {
          k.push(P("Did it leave, or did you get rid of it?", { "data-room-checkin-ask": "" }));
          var ans = [["left", "It left"], ["got-rid", "I got rid of it"]];
          if (ch.push === "toward") ans.push(["stayed", "It stayed"]);
          k.push(pickRow("data-room-checkin", ans, null, function (v) { keepRoomTest({ t: Date.now(), sitting: R.sitting, round: R.round, branch: ch.push === "toward" ? "stays" : "goes", answer: v }); workedThrough(); }));
          k.push(P("Your answer and the round number stay on this device. What you wrote stays on this page.", { class: "oagr-note" }));
          return { title: "For the test", kids: k };
        }
        if (ph === "again") {
          k.push(P("Is anything still here that says it belongs?", { "data-room-again-ask": "" }));
          k.push(row([btn("Yes, it comes to the door", { "data-room-again": "yes" }, restart), btn("No, the room is quiet", { "data-room-again": "no" }, function () { go("end"); }, true)]));
          if (R.round >= ROOM_ROUNDS_REST) {
            k.push(P("That's " + R.round + " rounds this sitting. You can rest what's left by the door, with a lantern, and come back to it another time.", { "data-room-rest-offer": "" }));
            k.push(row([btn("Rest it by the door", { "data-room-rest": "" }, rest, true)]));
          }
          return { title: "Round " + R.round + " is done", kids: k };
        }
        // end
        k.push(P(R.rested ? "What's left rests by the door, with a lantern beside it." : "The room is quiet.", { "data-room-end": "" }));
        if (R.lights.length) k.push(P("On the threshold: " + R.lights.map(function (l) { return l.userData.name; }).join(", ") + "."));
        k.push(row([btn(R.from === "cave" ? "Back to the lantern" : "Leave the room", { "data-room-leave": "" }, leave)]));
        return { title: R.rested ? "Resting" : "The room is quiet", kids: k };
      }
      function lightName() { return (ch.lightName || "").trim() || nm(); }
      // Something new while fewer than three are in: the door opens on the out-breath and it comes in to a place of its own, and
      // the player works it now (the others keep their steps). With three in, it waits at the door.
      function somethingNew() {
        var sl = freeSlot();
        if (sl < 0) { R.waiting++; R.phase = "waiting"; draw(); return; }
        R.phase = R.prev;
        var c = newCharge(false, sl); R.active.push(c); setFocus(c);
        R.phase = "opening"; R.wait = "door-in"; draw();
      }
      // One creature is worked through: the next one in the room is worked, or one waiting at the door is welcomed, or the round ends.
      function workedThrough() {
        if (R.worked.indexOf(ch) < 0) R.worked.push(ch); // each W.A.V.E. worked here walks back out with the player as a spirit
        R.active.splice(R.active.indexOf(ch), 1);
        if (R.active.length) { var nx = R.active[0]; ch.phase = "done"; ch = nx; setFocus(nx); draw(); return; }
        if (R.waiting > 0) { R.waiting--; var c = newCharge(false, 0); c.waited = true; R.active.push(c); ch = c; setFocus(c); draw(); return; }
        go("again");
      }
      function startStays() { ch.t321 = { phase: "before", rounds: 1, msgs: [], voice: "you", draft: "", before: 6, after: 3 }; go("stays"); }
      function keep() { // the charge takes a place in the room, beside the wall, for the sitting
        var n = R.kept.length % 4, spot = [[-5.2, 1.4], [5.2, 1.4], [-5.4, -2.4], [5.4, -2.4]][n]; // by the wall, clear of the three places
        R.moves.push({ c: ch, from: { x: ch.fig.position.x, z: ch.fig.position.z }, to: { x: spot[0], z: spot[1] }, t: 0, dur: 3 });
        ch.heat = ch.t321.after; ch.dull *= 0.6; R.kept.push(ch); ch.t321 = null; go("kept");
      }
      function restart() {
        R.round++; if (ch.gone) scene.remove(ch.fig);
        ch = newCharge(false); R.active = [ch]; setFocus(ch); R.doorWant = 0; go("welcome");
      }
      function rest() {
        var lan = buildLantern(THREE); lan.position.set(DW / 2 + 1.1, 0, DZ + 0.8); lan.scale.setScalar(1.3); scene.add(lan); R.lantern = lan;
        if (ch.gone) scene.remove(ch.fig);
        var c = newCharge(false); c.fig.visible = true; c.fig.position.set(DW / 2 + 1.9, 0, DZ + 1.1); c.fig.scale.setScalar(0.45); R.restFig = c.fig;
        R.rested = true; R.doorWant = 0; go("end");
      }
      function leave(portal) {
        fade.style.opacity = 1;
        // Only a charge worked through the whole W.A.V.E. leaves as a spirit (Wendell, 13 October 2026: "It should only emerge once
        // it's been engaged with"), so one still being worked stays in the room, by any door.
        var going = R.worked;
        setTimeout(function () {
          cancelAnimationFrame(running); window.removeEventListener("resize", size); window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp);
          if (renderer) renderer.dispose(); wrap.remove(); api.room = null;
          resolve({ rounds: R.round, rested: R.rested, portal: portal === true, bigmind: portal === "bigmind", spirits: going.map(function (c) {
            return { name: (c.name || "").trim() || "A charge", element: c.element || null, hex: spiritHex(c.element), lighter: c.push === "away" };
          }) });
        }, 520);
      }

      // ---- breath, calm, look ---------------------------------------------------------------------------------------------
      var calmBtn = el("button", { class: "oagc-calm", "data-room-calm": "", "aria-pressed": "false", text: "Calm", onclick: function () { R.calm = !R.calm; calmBtn.setAttribute("aria-pressed", String(R.calm)); if (R.phase === "opening" || R.phase === "leaving") draw(); } });
      stage.appendChild(calmBtn);
      // One finger turns the view. Two fingers pinch it nearer or farther (Wendell, 13 October 2026: "Let's introduce pinch to
      // zoom in the wave room"), and the mouse wheel does the same on a computer. A tap on a creature brings it close (below).
      var lookYaw = 0, lookPitch = 0, drag = null, zoom = 1, ptrs = {}, pinch = null, tap = null, ZOOM_MIN = 0.3, ZOOM_MAX = 1.6;
      function setZoom(z) { zoom = clamp(z, ZOOM_MIN, ZOOM_MAX); }
      function spread() { var k = Object.keys(ptrs); return k.length < 2 ? 0 : Math.hypot(ptrs[k[0]].x - ptrs[k[1]].x, ptrs[k[0]].y - ptrs[k[1]].y); }
      if (renderer) {
        var dom = renderer.domElement;
        dom.addEventListener("pointerdown", function (e) {
          ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
          if (Object.keys(ptrs).length === 1) { drag = { x: e.clientX, y: e.clientY }; tap = { x: e.clientX, y: e.clientY, t: performance.now() }; }
          else { drag = null; tap = null; pinch = { d: spread(), z: zoom }; }
        });
        dom.addEventListener("pointermove", function (e) {
          if (!ptrs[e.pointerId]) return;
          ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
          if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 12) tap = null;
          if (pinch) { var d = spread(); if (pinch.d > 0 && d > 0) setZoom(pinch.z * pinch.d / d); return; }
          if (!drag) return;
          if (R.roam && R.roam.free && R.walkYaw != null) R.walkYaw += (e.clientX - drag.x) * 0.006; // walking, a drag turns the camera round the figure
          else lookYaw = clamp(lookYaw + (e.clientX - drag.x) * 0.005, -0.9, 0.9);
          // up and down tilts the camera (Wendell, 13 October 2026: "you can pan the camera side to side but not up and down")
          lookPitch = clamp(lookPitch + (e.clientY - drag.y) * 0.005, -0.7, 0.8);
          drag.x = e.clientX; drag.y = e.clientY;
        });
        ["pointerup", "pointercancel"].forEach(function (n) { dom.addEventListener(n, function (e) {
          delete ptrs[e.pointerId];
          if (n === "pointerup" && tap && performance.now() - tap.t < 600) tapAt(e.clientX, e.clientY);
          tap = null;
          var left = Object.keys(ptrs);
          if (left.length < 2) pinch = null;
          drag = left.length === 1 ? { x: ptrs[left[0]].x, y: ptrs[left[0]].y } : null; // the finger still down after a pinch turns the view again
        }); });
        dom.addEventListener("wheel", function (e) { e.preventDefault(); setZoom(zoom * Math.exp(e.deltaY * 0.0015)); }, { passive: false });
      }

      // ---- free walking (Wendell, 13 October 2026: "Essentially we need free walking controls in this room") -----------------
      // A stick at the bottom left walks the figure wherever the thumb points, as seen from the camera; on a computer the arrow
      // keys and W A S D do the same. It shows whenever the room is in view (the step's page tucked into the pane). Walking up
      // to a door opens its card; walking onto the rug offers to sit down, which brings the step's page back.
      var stick = { x: 0, z: 0 }, keys = {}, stickPad = el("div", { class: "oagr-stick", "data-room-stick": "", "aria-label": "Walk", role: "slider" });
      var stickKnob = el("div", { class: "oagr-knob" }); stickPad.appendChild(stickKnob); wrap.appendChild(stickPad);
      var sitBtn = el("button", { class: "oagr-sit", "data-room-sit": "", text: "Sit down", style: "display:none", onclick: function () { sitDown(); } }); wrap.appendChild(sitBtn);
      var stickId = null;
      // On an iPhone a thumb held on the stick keeps sending moves after the stick hides for a door's card, and a hidden stick
      // measures 0 wide: dividing by that walked the figure to nowhere and left the room dark (Wendell, 14 October 2026: "Stay in
      // the room gets you stuck in this screen"). A hidden stick lets go instead.
      function stickAt(e) {
        var rc = stickPad.getBoundingClientRect(), r = rc.width / 2;
        if (!(r > 0) || stickPad.style.display === "none") { stickUp(); return; }
        var dx = e.clientX - rc.left - r, dy = e.clientY - rc.top - r, d = Math.hypot(dx, dy), m = Math.min(d, r);
        stick.x = d ? dx / d * m / r : 0; stick.z = d ? dy / d * m / r : 0;
        stickKnob.style.transform = "translate(" + stick.x * r * 0.6 + "px," + stick.z * r * 0.6 + "px)";
      }
      function stickUp() { stickId = null; stick.x = 0; stick.z = 0; stickKnob.style.transform = ""; }
      stickPad.addEventListener("pointerdown", function (e) { e.preventDefault(); stickId = e.pointerId; try { stickPad.setPointerCapture(e.pointerId); } catch (x) { /* old browsers */ } stickAt(e); });
      stickPad.addEventListener("pointermove", function (e) { if (e.pointerId === stickId) stickAt(e); });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (n) { stickPad.addEventListener(n, function (e) { if (e.pointerId === stickId) stickUp(); }); });
      var KEYS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
      function typing() { var a = document.activeElement; return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA"); }
      function keyDown(e) { if (!KEYS[e.code] || typing() || R.modal || R.close) return; keys[e.code] = true; e.preventDefault(); }
      function keyUp(e) { delete keys[e.code]; }
      window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);
      // What the stick and keys ask for, turned to the floor as the camera sees it: up is away from the camera.
      function wantWalk() {
        var x = stick.x, z = stick.z; Object.keys(keys).forEach(function (k) { x += KEYS[k][0]; z += KEYS[k][1]; });
        var m = Math.hypot(x, z); if (!(m >= 0.15)) return null; if (m > 1) { x /= m; z /= m; }
        R.walkFwd = -z / Math.max(m, 1e-6); // how far the thumb points away from the camera, -1 to 1
        var fx = camAim.x - camPos.x, fz = camAim.z - camPos.z, fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
        return { x: -z * fx - x * fz, z: -z * fz + x * fx }; // forward times -z, plus right (-fz, fx) times x
      }
      // In front of door k: within reach of it and not far off its middle.
      function doorZone(k, reach, width) {
        var ex = EXITS[k], r = Math.hypot(ex.x, ex.z), nx = ex.x / r, nz = ex.z / r, dx = ex.x - fig.x, dz = ex.z - fig.z;
        return dx * nx + dz * nz < reach && Math.abs(dx * nz - dz * nx) < width;
      }
      function onRug() { return Math.hypot(fig.x - SEAT.x, fig.z - SEAT.z) < RUG_R; }
      function sitDown() { sitBtn.style.display = "none"; stopWalking(); if (modal.childNodes.length) openModal(); }
      function freeWalk(dt) {
        if (!isFinite(fig.x) || !isFinite(fig.z) || !isFinite(fig.yaw)) { fig.x = SEAT.x; fig.z = SEAT.z; fig.yaw = Math.PI; R.walkYaw = null; R.roam = null; snap = true; } // never lost: back on the rug
        var w = R.modal || R.close ? null : wantWalk();
        if (w) {
          if (!R.roam || !R.roam.free) { R.roam = { free: true, x: fig.x, z: fig.z, exit: null, arrived: true }; R.walkYaw = fig.yaw; }
          fig.sit = Math.max(0, fig.sit - dt * 2.4);
          if (fig.sit <= 0) {
            var sp = dt * 2.6 * Math.min(1, Math.hypot(w.x, w.z)), nx = fig.x + w.x * sp, nz = fig.z + w.z * sp, r = Math.hypot(nx, nz), RW = RR - 1.4;
            if (r > RW) { nx *= RW / r; nz *= RW / r; }
            fig.x = nx; fig.z = nz; fig.clk += dt; fig.yaw = turnTo(fig.yaw, Math.atan2(w.x, w.z), dt * 8);
          }
          R.roam.x = fig.x; R.roam.z = fig.z;
        }
        // The doors work the way doors work in most phone games (Wendell, 14 October 2026: "If you hold this position and try and
        // use the joystick you get stuck in a loop"): standing in front of a door shows a small prompt by the right thumb with
        // its way through, and the stick, the camera and the walk are never taken away. Walking off hides the prompt again. It
        // shows a little before the doorway and hides a little further out, so standing on the edge does not flicker it.
        if (R.roam) {
          var keep = R.atDoor ? doorZone(R.atDoor, 3.4, DW / 2 + 1.0) : false;
          var near = keep ? R.atDoor : Object.keys(EXITS).filter(function (k) { return doorZone(k, 2.6, DW / 2 + 0.4); })[0] || null;
          if (near && near !== R.atDoor) doorCard(near);
          else if (!near && R.atDoor) hideDoor();
        }
        if (!R.roam || !R.roam.free) { sitBtn.style.display = "none"; return !!w; }
        sitBtn.style.display = onRug() && !R.modal ? "" : "none";
        return !!w;
      }

      // ---- a creature close up (Wendell, 13 October 2026: "the ability to click on each of the spirits to have them fill the
      // frame and have more information about it") ----------------------------------------------------------------------------
      // A tap on a creature in the room (one being worked, or one that stays by the wall) swings the camera round to its front,
      // close enough that it fills the frame, and a card below says what is known of it: its name, element, texture, where it
      // is in the body, its step, its charge and glow, the feelings about it, what the player wants and the next move. Back
      // to the room returns the camera and the page where they were; the pinch and the turn work in the close-up too.
      var closeBox = el("div", { class: "oagr-close", "data-room-close": "", style: "display:none" }); wrap.appendChild(closeBox);
      var roomZoom = 1, roomModal = false;
      function seen() { return R.active.concat(R.kept).filter(function (c, i, a) { return a.indexOf(c) === i && !c.gone && c.fig.visible; }); }
      function centreOf(c) { var s = c.fig.scale.x; return new THREE.Vector3(c.fig.position.x, c.fig.position.y + 1.2 * s, c.fig.position.z); }
      // The creature nearest the tap on screen, if the tap lands on or close to it.
      function tapAt(x, y) {
        if (!renderer) return;
        var rc = renderer.domElement.getBoundingClientRect(), best = null, bestK = Infinity;
        var right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        seen().forEach(function (c) {
          var p = centreOf(c), e = p.clone().addScaledVector(right, c.fig.scale.x).project(camera); p.project(camera);
          if (p.z > 1) return; // behind the camera
          var sx = rc.left + (p.x + 1) / 2 * rc.width, sy = rc.top + (1 - p.y) / 2 * rc.height;
          var rad = Math.hypot((e.x - p.x) / 2 * rc.width, (e.y - p.y) / 2 * rc.height), d = Math.hypot(x - sx, y - sy);
          var k = d / (rad * 1.4 + 24); if (k < 1 && k < bestK) { best = c; bestK = k; }
        });
        if (best && best !== R.close) closeUp(best);
        else if (!best && !R.close) walkTap(x, y, rc);
      }
      // ---- walking round the room (Wendell, 13 October 2026: the WAVE room needs "the ability for players to walk around in") --
      // A tap on the floor stands the figure up and walks it there; a tap on a door walks it to the door, and arriving opens the
      // door's card. The step's page tucks into the pane while the player walks, and opening it again walks them back to the seat.
      var ray = new THREE.Raycaster(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), doorBox = null;
      function walkTap(x, y, rc) {
        ray.setFromCamera(new THREE.Vector2((x - rc.left) / rc.width * 2 - 1, -((y - rc.top) / rc.height * 2 - 1)), camera);
        var ids = Object.keys(EXITS), hit = ray.intersectObjects(ids.map(function (k) { return EXITS[k].glow; }))[0], p = new THREE.Vector3();
        if (hit) { walkTo(ids.filter(function (k) { return EXITS[k].glow === hit.object; })[0]); return; }
        if (!ray.ray.intersectPlane(ground, p)) return;
        var near = ids.filter(function (k) { return Math.hypot(p.x - EXITS[k].x, p.z - EXITS[k].z) < 1.8; })[0];
        if (near) walkTo(near); else walkTo({ x: p.x, z: p.z });
      }
      function walkTo(to) {
        var ex = typeof to === "string" ? EXITS[to] : null; if (typeof to === "string" && !ex) return;
        var q = ex ? ex.stand : to, r = Math.hypot(q.x, q.z), RW = RR - 1.6;
        if (r > RW) q = { x: q.x * RW / r, z: q.z * RW / r };
        R.roam = { x: q.x, z: q.z, exit: ex ? ex.id : null, arrived: false };
        hideDoor(); closeModal();
      }
      function stopWalking() { if (R.roam) { R.roam = null; hideDoor(); } R.walkYaw = null; if (sitBtn) sitBtn.style.display = "none"; }
      function hideDoor() { if (doorBox) doorBox.style.display = "none"; R.atDoor = null; }
      // A door's prompt, while the figure stands in front of it. The Big Mind cave and the six game masters are each a door the
      // player goes through by choice; walking away is how they stay.
      var DOOR_WORDS = {
        bigmind: ["Big Mind", "Seven figures, one in each chamber. You can walk back here whenever you like.", "Go in"],
        portal: ["The six game masters", "A hall with a door for each of the six faces.", "Go through"],
      };
      function doorCard(id) {
        if (!doorBox) { doorBox = el("div", { class: "oagr-door", "data-room-door": "", style: "display:none" }); wrap.appendChild(doorBox); }
        var w = DOOR_WORDS[id], go = { "data-room-door-go": id }; if (id === "portal") go["data-room-portal"] = ""; else go["data-room-bigmind"] = "";
        var kids = [el("h2", { text: w[0] }), P(w[1])];
        var going = R.worked.length;
        if (going) kids.push(P(going === 1 ? "The one you worked with comes along as a spirit." : "The " + going + " you worked with come along as spirits.", { class: "oagr-note" }));
        kids.push(btn(w[2], go, function () { leave(id === "portal" ? true : id); }));
        doorBox.innerHTML = ""; kids.forEach(function (n) { doorBox.appendChild(n); }); doorBox.style.display = ""; R.atDoor = id;
      }
      function closeUp(c) {
        if (!R.close) { roomZoom = zoom; roomModal = R.modal; }
        R.close = c; zoom = 1; lookYaw = 0; lookPitch = 0;
        closeModal(); pane.style.display = "none"; closeCard();
      }
      function backToRoom() {
        if (!R.close) return;
        R.close = null; zoom = roomZoom; lookYaw = 0; lookPitch = 0; closeBox.style.display = "none"; draw();
        if (!roomModal) closeModal(); // the page comes back as it was: open, or tucked into the pane
      }
      function stepName(c) {
        var ph = c === ch ? R.phase : c.phase, i = stepIndex(ph);
        if (R.kept.indexOf(c) >= 0) return "It stays, with a place in the room";
        if (i >= 0) return words(ROOM_STEPS[i])[1];
        return { opening: "Coming in through the door", stays: "Talking with you, 3-2-1", goes: "Exhale", leaving: "Leaving on the out-breath", checkin: "Worked through", done: "Worked through" }[ph] || "In the room";
      }
      function closeCard() {
        var c = R.close; if (!c) return;
        var e = c.element && lookup(ELEMENTS, c.element), t = c.texture && lookup(TEXTURES, c.texture);
        var hex = "#" + c.fig.userData.want.getHexString(), k = [];
        k.push(el("h2", {}, [el("span", { class: "oagr-dot", style: "background:" + hex + ";color:" + hex }), el("span", { text: c.name.trim() || "Not named yet", "data-room-close-name": "" })]));
        k.push(P(e ? "Element: " + e[1] + ", " + e[0].toLowerCase() + ". Its clean up move: " + e[2] + "." : "Element: not known yet.", { "data-room-close-element": "" }));
        k.push(P("It feels like " + (t ? t[1] : "nothing named yet") + "." + (c.where ? " Where: " + c.where + "." : ""), { "data-room-close-feel": "" }));
        k.push(P("Step: " + stepName(c) + (c.steady ? ". Validated." : "."), { "data-room-close-step": "" }));
        k.push(P("Charge " + heatOf(c.t321, c.heat) + " of 10, glowing at " + Math.round(levelOf(c) * 100) + "%" + (c.allowed ? ", allowed to grow " + c.allow.grow + " of 10" : "") + ".", { "data-room-close-charge": "" }));
        if (c.layers.length) k.push(P("Feelings about it: " + c.layers.map(function (l) { return l.name + (l.element ? " (" + l.element.toLowerCase() + ")" : ""); }).join(", ") + ".", { "data-room-close-layers": "" }));
        if (c.goal.trim()) k.push(P("What you want: " + c.goal.trim() + (c.push ? ". It pushes " + (c.push === "toward" ? "toward" : "away from") + " it." : "."), { "data-room-close-goal": "" }));
        if (c.move.trim()) k.push(P("Your next move: " + c.move.trim() + "."));
        var bs = [];
        if (c !== ch && R.active.indexOf(c) >= 0 && R.kept.indexOf(c) < 0) bs.push(btn("Work with this one", { "data-room-close-work": "" }, function () { setFocus(c); backToRoom(); }));
        bs.push(btn("Back to the room", { "data-room-close-back": "" }, backToRoom, bs.length > 0));
        k.push(row(bs));
        closeBox.innerHTML = ""; k.forEach(function (n) { closeBox.appendChild(n); }); closeBox.style.display = "";
      }
      function breathStep(nowS) {
        var T = BREATH_S, tm = (((nowS - br.t0) % T) + T) % T, b;
        br.exhaling = tm >= BREATH.inS;
        b = br.exhaling ? 0.5 + 0.5 * Math.cos(Math.PI * (tm - BREATH.inS) / BREATH.outS) : 0.5 - 0.5 * Math.cos(Math.PI * tm / BREATH.inS);
        br.b = R.calm ? 0.5 : b;
      }
      function size() {
        if (!renderer) return;
        var w = stage.clientWidth || 1, h = stage.clientHeight || 1;
        renderer.setSize(w, h, false); camera.aspect = w / h;
        camera.setViewOffset(w, h, 0, -h * 0.08, w, h); // the words sit high, so the room is drawn low on the screen
        camera.updateProjectionMatrix();
      }
      size(); window.addEventListener("resize", size);

      // Where the figure stands, and how the camera sees it, for the step. The 3-2-1 is staged as in the cave: Face it from the seat,
      // Talk to it face to face (the camera swings with the voice), Be it from where the charge stood (the charge sits in the
      // seat), then back to the seat. Step back stands behind the seat.
      function targets() {
        var t = ch.t321, tg = { p: SEAT, sit: true, look: HERE, view: "seat", c: HERE };
        if (R.roam) { var ex = R.roam.exit && EXITS[R.roam.exit]; return { p: R.roam, sit: false, look: ex ? ex : { x: R.roam.x + Math.sin(fig.yaw), z: R.roam.z + Math.cos(fig.yaw) }, view: "roam", c: HERE }; }
        if (R.back || (t && t.paused)) return { p: BACK, sit: false, look: HERE, view: "back", c: HERE };
        if (R.phase === "stays" && t) {
          if (t.phase === 2 || t.phase === "check") return { p: FACE, sit: false, look: HERE, view: t.phase === 2 && t.voice === "it" ? "face-it" : "face-you", c: HERE };
          if (t.phase === 1) return { p: HERE, sit: false, look: SEAT, view: "its", c: SEAT };
        }
        return tg;
      }
      function view(name, ax, az) {
        var V = function (x, y, z) { return new THREE.Vector3(x, y, z); };
        if (name === "face-you") return { pos: V(FACE.x + 2.2, 3.2, FACE.z + 3.4), aim: V(HERE.x, 0.9, HERE.z) };
        if (name === "face-it") return { pos: V(HERE.x - 2.8, 3.6, HERE.z - 2.2), aim: V(FACE.x, 0.9, FACE.z) };
        if (name === "its") return { pos: V(HERE.x + 1.6, 3.6, HERE.z - 4.3), aim: V(SEAT.x, 0.6, SEAT.z) };
        if (name === "back") return { pos: V(BACK.x + 0.8, 4.6, BACK.z + 2.3), aim: V(HERE.x, 0.6, HERE.z) };
        if (name === "roam") { // behind the figure and above it, looking where it faces
          var ry0 = R.roam && R.roam.free && R.walkYaw != null ? R.walkYaw : fig.yaw, sy = Math.sin(ry0), cy = Math.cos(ry0);
          return { pos: V(fig.x - sy * 4.2, 3.4, fig.z - cy * 4.2), aim: V(fig.x + sy * 2.6, 1.0, fig.z + cy * 2.6) };
        }
        if (name === "close") { // in front of the creature, near enough that it fills the frame above the card
          var cc = R.close, s = cc.fig.scale.x, mid = centreOf(cc), ry = cc.fig.rotation.y;
          return { pos: V(mid.x + Math.sin(ry) * 4.4 * s, mid.y + 0.5 * s, mid.z + Math.cos(ry) * 4.4 * s), aim: V(mid.x, mid.y - 0.8 * s, mid.z) };
        }
        if (inRoom().length > 1) return { pos: V(0.4 + 0.3 * HERE.x, 6.6, 6.6), aim: V(0.6 * HERE.x, 0.2, -2) }; // higher, so all of them are in view, turned to the one worked
        return { pos: V(1.0, 5.4, 7.0), aim: V(0, 0.6, -3) };
      }
      var camPos = new THREE.Vector3(), camAim = new THREE.Vector3(), snap = true, last = performance.now(), running = null, tmpC = new THREE.Color();

      // ---- the frame ------------------------------------------------------------------------------------------------------
      function frame() {
        var now = performance.now(), dt = Math.min(0.1, (now - last) / 1000) * R.speed; last = now;
        breathStep(now / 1000);
        // the door: it opens on an out-breath (at once when calm), then the charge comes in, or goes out
        if (R.wait && (R.calm || br.exhaling)) {
          var w0 = R.wait; R.wait = null; R.doorWant = 1;
          if (w0 === "door-in") { var cin = ch; cin.fig.visible = true; cin.fig.position.set(0, 0, DZ - 2.5); R.moves.push({ c: cin, from: { x: 0, z: DZ - 2.5 }, to: SLOTS[cin.slot], t: -1.4, dur: 3.6, then: function () { if (ch === cin) go("witness"); else cin.phase = "witness"; } }); }
          else { var cout = ch; R.moves.push({ c: cout, from: { x: cout.fig.position.x, z: cout.fig.position.z }, to: { x: 0, z: DZ - 3 }, t: -1.2, dur: BREATH.outS + 2, fadeOut: true, then: function () {
            cout.gone = true; cout.fig.visible = false; var l = buildLight(cout.fig.userData.want.getHex(), (cout.lightName || "").trim() || cout.name || "It", R.lights.length); scene.add(l); R.lights.push(l); R.doorWant = 0.3;
            if (ch === cout) go("gone"); else cout.phase = "gone";
          } }); }
        }
        R.doorOpen += (R.doorWant - R.doorOpen) * Math.min(1, dt * 1.6);
        door.position.x = -DW / 2 - (DW + 0.25) * R.doorOpen; doorLight.intensity = 1.8 * R.doorOpen;
        R.moves = R.moves.filter(function (mv) {
          mv.t += dt; var k = clamp(mv.t / mv.dur, 0, 1), e = k * k * (3 - 2 * k);
          mv.c.fig.position.x = mv.from.x + (mv.to.x - mv.from.x) * e; mv.c.fig.position.z = mv.from.z + (mv.to.z - mv.from.z) * e;
          if (mv.fadeOut) mv.c.fig.userData.fade = 1 - clamp((k - 0.75) / 0.25, 0, 1);
          if (k >= 1) { if (mv.fadeOut) R.doorWant = 0.3; if (mv.then) mv.then(); return false; }
          return true;
        });
        var inFlight = R.moves.map(function (mv) { return mv.c; });
        // each creature where the step puts it (unless it is moving): the one being worked at its place, or in the seat while the
        // player is it; the others at their own places
        var tg = targets();
        inRoom().forEach(function (c) {
          if (inFlight.indexOf(c) >= 0 || !c.fig.visible) return;
          var to = c === ch ? tg.c : SLOTS[c.slot], cy = to === SEAT ? 0.55 : 0, fk = Math.min(1, dt * 1.8);
          c.fig.position.x += (to.x - c.fig.position.x) * fk; c.fig.position.z += (to.z - c.fig.position.z) * fk; c.fig.position.y += (cy - c.fig.position.y) * fk;
        });
        // every creature in the room: its colour eases to its element, its shape to its texture; it breathes, and flickers until
        // validated. Allowed, it grows to the size the player set; its aura brightens with its charge and dulls as it is worked.
        var every = R.active.concat(R.kept); if (every.indexOf(ch) < 0) every.push(ch);
        every.forEach(function (c) {
          var u = c.fig.userData, b = br.b, lv = levelOf(c);
          u.col.lerp(u.want, Math.min(1, dt * 1.5)); u.mat.color.copy(u.col); u.mat.emissive.copy(u.col);
          var flick = u.steady || R.calm ? 0 : 0.12 * Math.sin(now / 130) * Math.sin(now / 370);
          u.mat.emissiveIntensity = 0.22 + 0.18 * b + flick + (u.steady ? 0.15 : 0) + 0.6 * u.aura.userData.level;
          var sz = c.allowed ? 1 + c.allow.grow / 10 : 1, fs = c.fig.scale.x; c.fig.scale.setScalar(fs + (sz - fs) * Math.min(1, dt * 1.5));
          stepAura(u.aura, u.col, lv * (u.fade == null ? 1 : u.fade), dt, R.calm);
          c.layers.forEach(function (l, n) {
            if (!R.calm) l.ring.rotation.z += dt * (0.4 + 0.15 * n);
            l.ring.material.opacity = (l.steady || R.calm ? 0.85 : 0.45 + 0.35 * Math.abs(Math.sin(now / 240 + n))) * (u.fade == null ? 1 : u.fade);
            l.label.material.opacity = u.fade == null ? 1 : u.fade;
          });
          u.mat.opacity = u.op * (u.fade == null ? 1 : u.fade);
          u.body.scale.set(u.sx * (1 + 0.05 * (b - 0.5)), u.sy * (1 + 0.04 * (b - 0.5)), u.sx);
          u.core.material.opacity = (u.steady ? 0.85 : 0.4 + 0.3 * b) * (u.fade == null ? 1 : u.fade);
          var faceTo = c.fig.position.z > SEAT.z - 0.5 ? SLOTS[c.slot] : (fig.sit > 0.5 ? SEAT : { x: fig.x, z: fig.z });
          c.fig.rotation.y = Math.atan2(faceTo.x - c.fig.position.x, faceTo.z - c.fig.position.z);
        });
        if (R.restFig) R.restFig.userData.mat.opacity = 0.5;
        // the figure: stands up, walks to its place, sits down again
        var stepping = freeWalk(dt);
        var hideStick = R.modal || R.close;
        if (hideStick && stickId != null) stickUp(); // the thumb lets go when the stick hides
        stickPad.style.display = hideStick ? "none" : "";
        tg = targets();
        var dx = tg.p.x - fig.x, dz = tg.p.z - fig.z, dist = Math.hypot(dx, dz), moving = stepping && fig.sit <= 0;
        if (stepping) { /* the stick has the figure */ }
        else if (dist > 0.04) {
          fig.sit = Math.max(0, fig.sit - dt * 1.6);
          if (fig.sit <= 0) { var stp = Math.min(dist, dt * (R.roam ? 2.4 : 1.5)); fig.x += dx / dist * stp; fig.z += dz / dist * stp; moving = true; fig.clk += dt; fig.yaw = turnTo(fig.yaw, Math.atan2(dx, dz), dt * 5); }
        } else {
          fig.x = tg.p.x; fig.z = tg.p.z;
          if (R.roam && !R.roam.arrived) { R.roam.arrived = true; if (R.roam.exit) doorCard(R.roam.exit); }
          fig.yaw = turnTo(fig.yaw, Math.atan2(tg.look.x - fig.x, tg.look.z - fig.z), dt * 4);
          if (tg.sit && Math.abs(angleDiff(fig.yaw, Math.atan2(tg.look.x - fig.x, tg.look.z - fig.z))) < 0.15) fig.sit = Math.min(1, fig.sit + dt * 1.6);
        }
        avatar.position.set(fig.x, 0, fig.z); avatar.rotation.y = fig.yaw;
        poseAvatar(avatar, fig.clk, moving, dt, br.b, 0.7, R.calm);
        var J = avatar.userData.J, sk = fig.sit * fig.sit * (3 - 2 * fig.sit);
        if (sk > 0) {
          ["L", "R"].forEach(function (n) {
            J["hip" + n].rotation.x = J["hip" + n].rotation.x * (1 - sk) - 1.45 * sk; J["knee" + n].rotation.x = J["knee" + n].rotation.x * (1 - sk) + 1.45 * sk;
            J["ankle" + n].rotation.x *= 1 - sk; J["shoulder" + n].rotation.x = J["shoulder" + n].rotation.x * (1 - sk) - 0.35 * sk; J["elbow" + n].rotation.x = J["elbow" + n].rotation.x * (1 - sk) - 0.5 * sk;
          });
          J.hips.position.y = J.hips.position.y * (1 - sk) + 0.6 * sk;
          avatar.position.z = fig.z - Math.cos(fig.yaw) * 0.25 * FIG_K * sk; avatar.position.x = fig.x - Math.sin(fig.yaw) * 0.25 * FIG_K * sk; // hips back over the seat
        }
        loosenAvatar(avatar, 0, br.b);
        // the room's look follows the step, as the cave's path does; the walls breathe
        var li = stepIndex(R.phase), lg = STEP_LOOK[li >= 0 ? ROOM_STEPS[li].look : R.phase === "welcome" || R.phase === "opening" ? 0 : 6], fe = Math.min(1, dt * 1.2);
        lamp.color.lerp(tmpC.setHex(lg.light).lerp(new THREE.Color(0xffffff), 0.45), fe);
        hemi.intensity += (lg.hemi * 0.8 - hemi.intensity) * fe;
        scene.fog.color.lerp(tmpC.setHex(lg.fog), fe); scene.background.copy(scene.fog.color);
        scene.fog.density += (0.03 * lg.fogK - scene.fog.density) * fe;
        lamp.intensity = 0.9 + 0.35 * (1 - br.b);
        var wk = 1 + 0.015 * (br.b - 0.5); walls.scale.set(wk, 1, wk);
        R.lights.forEach(function (l, n) { l.userData.halo.scale.setScalar(R.calm ? 1 : 1 + 0.12 * Math.sin(now / 500 + n)); });
        // the camera
        if (R.close && (R.close.gone || !R.close.fig.visible)) backToRoom(); // it left the room while close up
        // The camera comes round behind the figure only while it walks away from the camera, so walking back towards the
        // camera or sideways keeps going the way the thumb points instead of circling; a drag turns it by hand.
        if (R.walkYaw != null && moving && R.walkFwd > 0.3) R.walkYaw = turnTo(R.walkYaw, fig.yaw, dt * 0.9);
        var vw = view(R.close ? "close" : tg.view, 0, 0); R.view = R.close ? "close" : tg.view;
        if (lookYaw) { var off = vw.pos.clone().sub(vw.aim), c0 = Math.cos(lookYaw), s0 = Math.sin(lookYaw); vw.pos.set(vw.aim.x + off.x * c0 + off.z * s0, vw.pos.y, vw.aim.z - off.x * s0 + off.z * c0); }
        if (lookPitch) { // the camera swings over or under the point it looks at, keeping its distance: drag down to look down on the room, up to look up
          var po = vw.pos.clone().sub(vw.aim), ph = Math.hypot(po.x, po.z) || 1e-6, pl = po.length(), pe = clamp(Math.atan2(po.y, ph) + lookPitch, -0.25, 1.35);
          vw.pos.set(vw.aim.x + po.x / ph * Math.cos(pe) * pl, vw.aim.y + Math.sin(pe) * pl, vw.aim.z + po.z / ph * Math.cos(pe) * pl);
        }
        // Zooming in brings the camera nearer. Zooming out past the step's own view widens the lens instead, since the walls are
        // close behind the camera: on a phone held upright that is what brings all three creatures into view.
        if (zoom < 1) vw.pos.sub(vw.aim).multiplyScalar(zoom).add(vw.aim);
        var fov = zoom > 1 ? 60 + (zoom - 1) * 70 : 60; if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
        var rr = Math.hypot(vw.pos.x, vw.pos.z), RIN = RR - 0.8; if (rr > RIN) { vw.pos.x *= RIN / rr; vw.pos.z *= RIN / rr; } // zoomed out, it stays inside the walls
        vw.pos.y = clamp(vw.pos.y, 0.4, RH + 1.2);
        if (snap) { camPos.copy(vw.pos); camAim.copy(vw.aim); snap = false; }
        else { var f = 1 - Math.exp(-dt * 2.6); camPos.lerp(vw.pos, f); camAim.lerp(vw.aim, f); }
        camera.position.copy(camPos); camera.lookAt(camAim);
        if (renderer) renderer.render(scene, camera);
        running = requestAnimationFrame(frame);
      }
      function angleDiff(a, b) { var d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
      function turnTo(a, b, k) { return a + angleDiff(a, b) * Math.min(1, k); }

      draw(); frame();

      // ---- hooks for the browser test --------------------------------------------------------------------------------------
      var api = window.__oagCave;
      api.room = {
        state: R,
        charge: function () { var u = ch.fig.userData; return { name: ch.name, element: ch.element, texture: ch.texture, known: ch.known, visible: ch.fig.visible, gone: ch.gone, x: ch.fig.position.x, z: ch.fig.position.z, color: u.mat.color.getHex(), steady: u.steady, goal: ch.goal,
          slot: ch.slot, scale: ch.fig.scale.x, glow: u.aura.userData.level, want: levelOf(ch), allow: { grow: ch.allow.grow, bright: ch.allow.bright }, allowed: ch.allowed, layers: ch.layers.map(function (l) { return { name: l.name, element: l.element, steady: l.steady }; }) }; },
        creatures: function () { return R.active.map(function (c) { return { name: c.name, slot: c.slot, phase: c === ch ? R.phase : c.phase, focus: c === ch, x: c.fig.position.x, z: c.fig.position.z, visible: c.fig.visible, layers: c.layers.length }; }); },
        scene: function () { return { door: R.doorOpen, doorX: door.position.x, doorW: DW, waiting: R.waiting, lights: R.lights.map(function (l) { return { name: l.userData.name, z: l.position.z }; }), kept: R.kept.length, lantern: !!R.lantern, view: R.view, sit: fig.sit, figure: [fig.x, fig.z], doorZ: DZ, seat: [SEAT.x, SEAT.z], here: [HERE.x, HERE.z] }; },
        speed: function (v) { R.speed = v; },
        zoom: function () { return zoom; },
        // walking: walkTo("bigmind" | "portal" | { x, z }) as a tap on that door or that floor would; walking() says where things are
        walkTo: function (to) { walkTo(to); },
        // the walking stick as a thumb would hold it (x right, y down, each -1 to 1), or steer(x, z) to hold it towards that floor point
        stick: function (x, y) { stick.x = x || 0; stick.z = y || 0; },
        steer: function (x, z) {
          var wx = x - fig.x, wz = z - fig.z, m = Math.hypot(wx, wz); if (m < 0.05) { stick.x = 0; stick.z = 0; return m; }
          wx /= m; wz /= m; var fx = camAim.x - camPos.x, fz = camAim.z - camPos.z, fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
          stick.x = wx * -fz + wz * fx; stick.z = -(wx * fx + wz * fz); return m;
        },
        sitShown: function () { return sitBtn.style.display !== "none"; },
        stickShown: function () { return stickPad.style.display !== "none"; },
        walking: function () { return { roam: R.roam ? { x: R.roam.x, z: R.roam.z, exit: R.roam.exit, arrived: R.roam.arrived } : null, figure: [fig.x, fig.z], sit: fig.sit, atDoor: R.atDoor || null, view: R.view, camY: camPos.y, cam: [camPos.x, camPos.y, camPos.z], aim: [camAim.x, camAim.y, camAim.z], pitch: lookPitch,
          exits: Object.keys(EXITS).map(function (k) { return { id: k, x: EXITS[k].x, z: EXITS[k].z }; }) }; },
        floorScreen: function (x, z) { if (!renderer) return null; var rc = renderer.domElement.getBoundingClientRect(), p = new THREE.Vector3(x, 0, z).project(camera); return { x: rc.left + (p.x + 1) / 2 * rc.width, y: rc.top + (1 - p.y) / 2 * rc.height, behind: p.z > 1 }; },
        close: function () { return R.close ? { name: R.close.name, slot: R.close.slot, kept: R.kept.indexOf(R.close) >= 0 } : null; },
        // where a creature is on screen (by its index in creatures(), or the n-th kept one with kept true), for a test to tap it
        screenOf: function (n, kept) {
          var c = kept ? R.kept[n] : R.active[n]; if (!c || !renderer) return null;
          var rc = renderer.domElement.getBoundingClientRect(), p = centreOf(c).project(camera);
          return { x: rc.left + (p.x + 1) / 2 * rc.width, y: rc.top + (1 - p.y) / 2 * rc.height };
        },
      };
    });
  }

  // Three.js alone, for a cave that needs neither the kit nor the spots (the Big Mind cave, bigmind/bigmind.js).
  var threeP = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeP) return threeP;
    threeP = new Promise(function (res, rej) {
      var s = el("script", { src: THREE_URL });
      s.onload = function () { res(window.THREE); };
      s.onerror = function () { threeP = null; rej(new Error("three.js did not load")); };
      document.head.appendChild(s);
    });
    return threeP;
  }
  // The engine pieces a second cave reuses (the Big Mind cave is a fork that shares them, so a fix here reaches both caves):
  // the route, the tunnel, the pebbles, the marker and lantern, the faceless avatar and its walk, the daemon body, the breath
  // and the page guards.
  var kit = {
    el: el, clamp: clamp, hashOf: hashOf, rngOf: rngOf, loadThree: loadThree,
    makeRoute: makeRoute, ptOn: ptOn, at: at, yawFacing: yawFacing, smoothLine: smoothLine,
    buildTube: buildTube, buildPebbles: buildPebbles, buildMarker: buildMarker, buildLantern: buildLantern,
    buildAvatar: buildAvatar, loosenAvatar: loosenAvatar, poseAvatar: poseAvatar, buildDaemon: buildDaemon, DAEMONS: DAEMONS,
    BREATH: BREATH, STEPS_PER_S: STEPS_PER_S, CSS: CSS, guardPage: guardPage, holdArea: holdArea,
    // the WAVE room's own pieces, so a cave that sits down in place runs the room's steps, not a copy (Big Mind cave, bms-in-place)
    ROOM_STEPS: ROOM_STEPS, WAVE: WAVE, ELEMENTS: ELEMENTS, TEXTURES: TEXTURES, talk321: talk321, focusChat: focusChat,
    buildAura: buildAura, stepAura: stepAura, allowSliders: allowSliders, labelSprite: labelSprite, P: P, btn: btn, row: row,
    buildSpirit: buildSpirit, followSpirits: followSpirits, spiritHex: spiritHex, SPIRITS_SHOWN: SPIRITS_SHOWN,
    // the Cave of Lessons' stone and light, so the Big Mind cave wears the same map (Wendell, 2026-10-13: "import the WAVE
    // process into this map")
    loadTiles: loadTiles, stoneOf: stoneOf, tileStone: tileStone, LAMP: LAMP,
  };
  window.__oagCave = { start: start, load: load, dive: function (label) { return dive(label, document.querySelector("[data-cave-home]")); }, layoutMain: layoutMain, WAVE: WAVE,
    crystalBlock: crystalBlock, geomOf: geomOf, stoneOf: stoneOf, CRYSTAL_TINTS: CRYSTAL_TINTS, CRYSTAL_RANGE: CRYSTAL_RANGE,
    openRoom: function (o) { return load().then(function (A) { return openRoom(A, o); }); },
    levels: function (o) { return load().then(function (A) { enter(A, null, document.querySelector("[data-cave-home]"), o || {}); }); }, ROOM_STEPS: ROOM_STEPS, roomTest: readRoomTest, kit: kit, buildElement: buildElement, buildPool: buildPool,
    waterLook: function (calm, sheen) { waterCalm = !!calm; waterSheen = sheen; } };
  // A page that only borrows the engine sets __oagCaveNoStart before loading this file, so the Cave of Lessons' doorway stays shut.
  if (!window.__oagCaveNoStart) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start(); }
})();
