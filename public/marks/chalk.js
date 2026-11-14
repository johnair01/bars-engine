/*
 * The chalk ring (Wendell's pick on the look pm-mark-look-1, option A).
 *
 * On a preview he holds a finger still on the trouble spot. A chalk ring circles it, a paper slip slides up for one
 * line, and Send folds the slip away while he keeps playing. Nothing leaves the page until he sends it.
 *
 * Trigger: a pointer held still (moved under 10 px) for 650 ms, on touch or mouse; on a desktop also Alt+click. A
 * hold that moves is ignored, and nothing is cancelled on a normal tap or drag. After a hold fires, that pointer's
 * next click and context menu are swallowed.
 *
 * Send posts to /api/council/preview-shots: the page, his line, the picture (the game's canvas when it can be read,
 * or one he adds), where he held, the look under his finger and the errors the page caught.
 *
 * Opt-out: a hold that starts inside an element marked data-chalk-off belongs to that element, never to the ring. The
 * Council Board's Projects tab marks its full-screen harbour this way (his A on cargo-look-1), because a still finger
 * there is the start of a drag or a swipe through the hand.
 *
 * One file, no dependencies. Loaded on previews by src/app/layout.tsx and src/lib/marks/chalk.ts.
 */
(function () {
  'use strict';
  if (window.__chalkMarks) return;
  window.__chalkMarks = true;

  var HOLD_MS = 650, SLOP = 10, RADIUS = 70, MAX_EDGE = 1280, ENDPOINT = '/api/council/preview-shots';
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* old browser */ }

  /* ---------- the errors the page caught since load ---------- */
  var errLog = [];
  function note(msg) {
    try {
      var s = String(msg == null ? '' : msg).slice(0, 500);
      if (!s) return;
      errLog.push(s);
      if (errLog.length > 20) errLog.shift();
    } catch (e) { /* never break the page */ }
  }
  function describe(v) {
    if (v && v.stack) return String(v.stack);
    if (v && v.message) return String(v.message);
    if (typeof v === 'object') { try { return JSON.stringify(v); } catch (e) { return String(v); } }
    return String(v);
  }
  var origError = console.error;
  console.error = function () {
    try { note(Array.prototype.map.call(arguments, describe).join(' ')); } catch (e) { /* ignore */ }
    return origError.apply(console, arguments);
  };
  window.addEventListener('error', function (e) {
    note((e.message || 'error') + (e.filename ? ' at ' + e.filename + ':' + e.lineno : ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) { note('Unhandled rejection: ' + describe(e.reason)); });

  /* ---------- the layer: one shadow root, so the page's styles and ours never meet ---------- */
  var host = null, root = null, ui = null;
  var CSS = [
    ':host{all:initial}',
    '.layer{position:fixed;inset:0;z-index:2147483647;pointer-events:none;-webkit-tap-highlight-color:transparent}',
    '.catch{position:absolute;inset:0;pointer-events:auto;background:transparent;touch-action:none}',
    'svg.ring{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;transition:opacity .25s ease-out}',
    'svg.ring.gone{opacity:0}',
    '.chalk{fill:none;stroke:#f4f0e6;stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round;transition:stroke-dashoffset .35s cubic-bezier(.2,.7,.3,1)}',
    '.chalk.ghost{stroke-width:2;opacity:.55;transition-delay:.04s}',
    '.under{fill:none;stroke:rgba(10,9,8,.38);stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .35s cubic-bezier(.2,.7,.3,1)}',
    '.slip{position:absolute;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));margin:0 auto;max-width:440px;box-sizing:border-box;',
    '  pointer-events:auto;padding:14px 14px 12px;border-radius:3px 4px 3px 5px;color:#211c16;',
    '  background:#f2ead8 linear-gradient(176deg,rgba(255,255,255,.35),rgba(255,255,255,0) 40%,rgba(120,96,60,.06));',
    '  box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 10px 28px rgba(10,9,8,.45),0 2px 6px rgba(10,9,8,.3);',
    '  font:16px/1.35 ui-rounded,"Nunito","SF Pro Rounded",system-ui,-apple-system,sans-serif;',
    '  transform:rotate(-.5deg);transform-origin:50% 100%;transition:transform .25s cubic-bezier(.2,.8,.3,1),opacity .25s ease-out}',
    '.slip::before{content:"";position:absolute;left:0;right:0;top:0;height:6px;border-radius:3px 4px 0 0;',
    '  background:repeating-linear-gradient(90deg,rgba(33,28,22,.07) 0 7px,transparent 7px 13px)}',
    '.slip.in{transform:translateY(calc(100% + 40px)) rotate(-.5deg)}',
    '.slip.fold{transform:scaleY(.02) rotate(-.5deg);opacity:0}',
    '.top{display:flex;align-items:center;gap:8px;margin:0 0 8px}',
    '.top p{flex:1;margin:0;font-size:14px;color:#5a4e3f;letter-spacing:.01em}',
    'button{font:inherit;color:inherit;cursor:pointer;-webkit-appearance:none;appearance:none;margin:0}',
    'button:focus-visible,input:focus-visible{outline:2px solid #1a7a8a;outline-offset:2px}',
    '.x{width:44px;height:44px;margin:-10px -8px -10px 0;border:0;background:transparent;font-size:24px;line-height:1;color:#5a4e3f;border-radius:22px}',
    '.line{display:block;width:100%;box-sizing:border-box;min-height:44px;padding:10px 2px 8px;border:0;border-bottom:2px solid rgba(33,28,22,.35);',
    '  background:transparent;color:#211c16;font:inherit;font-size:17px;border-radius:0;-webkit-user-select:text;user-select:text}',
    '.line::placeholder{color:#7a6c59}',
    '.line:focus{outline:none;border-bottom-color:#211c16}',
    '.row{display:flex;align-items:center;gap:10px;margin-top:10px}',
    '.pic{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 2px;border:0;background:transparent;color:#4d4234;font-size:15px;text-decoration:underline;text-decoration-color:rgba(33,28,22,.3);text-underline-offset:3px}',
    '.thumb{width:34px;height:34px;object-fit:cover;border-radius:2px;box-shadow:0 0 0 1px rgba(33,28,22,.25);display:none}',
    '.thumb.on{display:block}',
    '.send{margin-left:auto;min-width:96px;min-height:44px;padding:0 18px;border:0;border-radius:4px 5px 4px 6px;background:#211c16;color:#f4f0e6;font-weight:700;letter-spacing:.02em;',
    '  box-shadow:0 2px 0 rgba(10,9,8,.35)}',
    '.send:active{transform:translateY(1px);box-shadow:none}',
    '.send[disabled]{opacity:.6;cursor:default}',
    '.say{min-height:0;margin:8px 0 0;font-size:14px;color:#8a2b1f}',
    '.say:empty{display:none}',
    '.file{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}',
    '@media (prefers-reduced-motion: reduce){.slip,.chalk,.under,svg.ring{transition:none !important}}'
  ].join('\n');

  function el(tag, attrs, parent, ns) {
    var n = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function optedOut(t) {
    try { return !!(t && t.closest && t.closest('[data-chalk-off]')); } catch (e) { return false; }
  }
  function inLayer(e) {
    if (!host) return false;
    var path = e.composedPath ? e.composedPath() : [];
    return path.indexOf(host) >= 0 || e.target === host;
  }

  /* ---------- quiet the long-press callout while a hold runs and the ring is up ---------- */
  var quietStyle = null;
  function quiet(on) {
    if (on && !quietStyle) {
      quietStyle = el('style', { 'data-chalk': '' }, document.head || document.documentElement);
      quietStyle.textContent = 'html,html *{-webkit-touch-callout:none !important;-webkit-user-select:none !important;user-select:none !important}';
    } else if (!on && quietStyle) {
      quietStyle.remove(); quietStyle = null;
    }
  }

  /* ---------- the hold ---------- */
  var hold = null; // { id, x, y, t, touch }
  var swallowUntil = 0;

  function start(id, x, y, touch, target) {
    if (ui) return; // a mark is already up: the slip is his until he sends or drops it
    clearHold();
    hold = { id: id, x: x, y: y, touch: touch, target: target };
    if (touch) quiet(true);
    hold.t = setTimeout(function () { var h = hold; hold = null; fire(h.x, h.y, h.touch); }, HOLD_MS);
  }
  function moved(id, x, y) {
    if (!hold || hold.id !== id) return;
    var dx = x - hold.x, dy = y - hold.y;
    if (dx * dx + dy * dy >= SLOP * SLOP) clearHold();
  }
  function clearHold() {
    if (!hold) return;
    clearTimeout(hold.t);
    if (hold.touch && !ui) quiet(false);
    hold = null;
  }

  // Touch: touch events, which keep coming on iOS while the page scrolls, so a walking finger is always seen.
  document.addEventListener('touchstart', function (e) {
    if (inLayer(e)) return;
    if (e.touches.length !== 1 || optedOut(e.target)) { clearHold(); return; }
    var t = e.touches[0];
    start('t' + t.identifier, t.clientX, t.clientY, true, e.target);
  }, { capture: true, passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!hold) return;
    if (e.touches.length !== 1) { clearHold(); return; }
    var t = e.touches[0];
    moved('t' + t.identifier, t.clientX, t.clientY);
  }, { capture: true, passive: true });
  document.addEventListener('touchend', function (e) {
    if (hold) clearHold();
    else if (ui && Date.now() < swallowUntil) focusLine(); // a lifted finger may bring up the iOS keyboard
    if (Date.now() < swallowUntil && !inLayer(e) && e.cancelable) e.preventDefault(); // no click from the hold
  }, { capture: true, passive: false });
  document.addEventListener('touchcancel', function () { clearHold(); }, { capture: true, passive: true });

  // Mouse and pen: pointer events. Touch pointers are left to the touch events above.
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch' || inLayer(e) || e.button !== 0 || e.altKey || optedOut(e.target)) return;
    start('p' + e.pointerId, e.clientX, e.clientY, false, e.target);
  }, true);
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'touch') moved('p' + e.pointerId, e.clientX, e.clientY);
  }, true);
  document.addEventListener('pointerup', function (e) { if (e.pointerType !== 'touch') clearHold(); }, true);
  document.addEventListener('pointercancel', function (e) { if (e.pointerType !== 'touch') clearHold(); }, true);
  window.addEventListener('blur', clearHold);

  // After a hold, that pointer's click and context menu belong to the mark, not the page.
  document.addEventListener('click', function (e) {
    if (inLayer(e)) return;
    if (e.altKey && !ui && e.button === 0 && !optedOut(e.target)) { // Alt+click marks at once on a desktop
      e.preventDefault(); e.stopImmediatePropagation();
      fire(e.clientX, e.clientY, false);
      return;
    }
    if (Date.now() < swallowUntil) { e.preventDefault(); e.stopImmediatePropagation(); swallowUntil = 0; }
  }, true);
  document.addEventListener('contextmenu', function (e) {
    if (inLayer(e)) return;
    // A held touch is ours from the start: Android opens its menu before 650 ms.
    if (Date.now() < swallowUntil || (hold && hold.touch)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  /* ---------- the picture ---------- */
  function largestCanvas() {
    var best = null, area = 0, vw = window.innerWidth, vh = window.innerHeight;
    var all = document.getElementsByTagName('canvas');
    for (var i = 0; i < all.length; i++) {
      var r = all[i].getBoundingClientRect();
      var w = Math.min(r.right, vw) - Math.max(r.left, 0), h = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (w <= 0 || h <= 0 || !all[i].width || !all[i].height) continue;
      var cs = getComputedStyle(all[i]);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      if (w * h > area) { area = w * h; best = all[i]; }
    }
    return best;
  }
  function fitted(w, h) {
    var k = Math.min(1, MAX_EDGE / Math.max(w, h));
    return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
  }
  // A WebGL canvas without preserveDrawingBuffer reads back blank outside its frame: every sample clear or black.
  function blank(src) {
    try {
      var s = document.createElement('canvas'); s.width = 16; s.height = 16;
      var c = s.getContext('2d'); c.drawImage(src, 0, 0, 16, 16);
      var d = c.getImageData(0, 0, 16, 16).data, clear = true, black = true;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] !== 0) clear = false;
        if (d[i] !== 0 || d[i + 1] !== 0 || d[i + 2] !== 0) black = false;
        if (!clear && !black) return false;
      }
      return true;
    } catch (e) { return true; } // tainted: no picture
  }
  function jpegOf(src, w, h) {
    var f = fitted(w, h), c = document.createElement('canvas');
    c.width = f.w; c.height = f.h;
    var g = c.getContext('2d');
    g.fillStyle = '#0a0908'; g.fillRect(0, 0, f.w, f.h);
    g.drawImage(src, 0, 0, f.w, f.h);
    return c.toDataURL('image/jpeg', 0.8);
  }
  function grabCanvas(cb) {
    var cv = largestCanvas();
    if (!cv) { cb(null); return; }
    function tryNow() {
      try { if (!blank(cv)) return jpegOf(cv, cv.width, cv.height); } catch (e) { /* tainted or lost */ }
      return null;
    }
    var now = tryNow();
    if (now) { cb(now); return; }
    // One more frame: inside rAF, after the game has drawn, the drawing buffer is still whole.
    requestAnimationFrame(function () { cb(tryNow()); });
  }
  function jpegFromFile(file, cb) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      try { cb(jpegOf(img, img.naturalWidth, img.naturalHeight)); } catch (e) { cb(null); }
      URL.revokeObjectURL(url);
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }

  /* ---------- the ring ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  // A hand-drawn loop: a little more than one turn, its radius wandering, smoothed through Catmull-Rom.
  function ringPath(cx, cy, r) {
    var n = 22, turn = 1.1, start = Math.random() * Math.PI * 2, pts = [];
    var a1 = Math.random() * 0.07, a2 = Math.random() * 0.05, p1 = Math.random() * 6, p2 = Math.random() * 6;
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = start + t * turn * Math.PI * 2;
      var rr = r * (1 + a1 * Math.sin(a * 2 + p1) + a2 * Math.sin(a * 3 + p2) + (t - 0.5) * 0.08);
      pts.push([cx + rr * Math.cos(a) * 1.04, cy + rr * Math.sin(a) * 0.97]);
    }
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var j = 0; j < pts.length - 1; j++) {
      var p0 = pts[j - 1] || pts[j], q1 = pts[j], q2 = pts[j + 1], p3 = pts[j + 2] || q2;
      d += ' C' + (q1[0] + (q2[0] - p0[0]) / 6).toFixed(1) + ' ' + (q1[1] + (q2[1] - p0[1]) / 6).toFixed(1)
        + ' ' + (q2[0] - (p3[0] - q1[0]) / 6).toFixed(1) + ' ' + (q2[1] - (p3[1] - q1[1]) / 6).toFixed(1)
        + ' ' + q2[0].toFixed(1) + ' ' + q2[1].toFixed(1);
    }
    return d;
  }
  function drawRing(svg, x, y) {
    var defs = el('defs', null, svg, SVGNS);
    var f = el('filter', { id: 'chalk-rough', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs, SVGNS);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.8', numOctaves: '2', seed: String(Math.floor(Math.random() * 99)), result: 'n' }, f, SVGNS);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '3.5', xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, f, SVGNS);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '1.9', numOctaves: '1', seed: '7', result: 'g' }, f, SVGNS);
    el('feColorMatrix', { in: 'g', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9', result: 'gaps' }, f, SVGNS);
    el('feComposite', { in: 'd', in2: 'gaps', operator: 'in' }, f, SVGNS);
    var d1 = ringPath(x, y, RADIUS), d2 = ringPath(x + 1.5, y - 1, RADIUS - 3);
    var g = el('g', { filter: 'url(#chalk-rough)' }, svg, SVGNS);
    var paths = [
      el('path', { d: d1, class: 'under', pathLength: '1' }, svg, SVGNS),
      el('path', { d: d1, class: 'chalk', pathLength: '1' }, g, SVGNS),
      el('path', { d: d2, class: 'chalk ghost', pathLength: '1' }, g, SVGNS)
    ];
    svg.insertBefore(paths[0], g);
    paths.forEach(function (p) {
      p.style.strokeDasharray = '1 1';
      p.style.strokeDashoffset = reduced ? '0' : '1';
    });
    if (!reduced) {
      paths[0].getBoundingClientRect(); // commit the start before the transition
      requestAnimationFrame(function () { paths.forEach(function (p) { p.style.strokeDashoffset = '0'; }); });
    }
  }

  /* ---------- the mark ---------- */
  function lookAt(x, y) {
    try {
      var n = document.elementFromPoint(x, y);
      var hit = n && n.closest ? n.closest('[data-look-id],[data-look]') : null;
      var v = hit ? (hit.getAttribute('data-look-id') || hit.getAttribute('data-look') || '') : '';
      return /^[a-z0-9-]{1,80}$/i.test(v) ? v : null;
    } catch (e) { return null; }
  }

  function fire(x, y, touch) {
    if (ui) return;
    swallowUntil = Date.now() + 1500;
    quiet(true);
    var mark = { x: Math.round(x), y: Math.round(y), w: window.innerWidth, h: window.innerHeight };
    var look = lookAt(x, y);
    if (navigator.vibrate && touch) { try { navigator.vibrate(8); } catch (e) { /* ignore */ } }
    open(mark, look);
    grabCanvas(function (img) { if (ui && !ui.picked) setPicture(img, false); });
  }

  function open(mark, look) {
    host = el('div', { 'data-chalk-marks': '' }, document.body || document.documentElement);
    root = host.attachShadow ? host.attachShadow({ mode: 'closed' }) : host;
    var style = el('style', null, root); style.textContent = CSS;
    var layer = el('div', { class: 'layer' }, root);
    var catcher = el('div', { class: 'catch', 'aria-hidden': 'true' }, layer);
    // What he does on the slip stays on the slip: no key he types reaches the game, no tap reaches the page.
    ['keydown', 'keyup', 'keypress', 'input', 'click', 'dblclick', 'pointerdown', 'pointerup', 'pointermove', 'mousedown',
     'mouseup', 'touchstart', 'touchmove', 'touchend', 'wheel', 'contextmenu'].forEach(function (t) {
      layer.addEventListener(t, function (e) { e.stopPropagation(); });
    });
    var svg = el('svg', { class: 'ring', 'aria-hidden': 'true' }, layer, SVGNS);
    drawRing(svg, mark.x, mark.y);

    var slip = el('form', { class: 'slip' + (reduced ? '' : ' in'), role: 'dialog', 'aria-label': 'Mark this spot', novalidate: '' }, layer);
    var top = el('div', { class: 'top' }, slip);
    el('p', null, top).textContent = 'Mark this spot';
    var x = el('button', { type: 'button', class: 'x', 'aria-label': 'Drop this mark' }, top); x.textContent = '×';
    var line = el('input', { class: 'line', type: 'text', placeholder: "What's wrong here?", maxlength: '500',
      autocomplete: 'off', autocapitalize: 'sentences', enterkeyhint: 'send', 'aria-label': "What's wrong here?" }, slip);
    var row = el('div', { class: 'row' }, slip);
    var pic = el('button', { type: 'button', class: 'pic' }, row);
    var thumb = el('img', { class: 'thumb', alt: '' }, pic);
    var picText = el('span', null, pic); picText.textContent = 'Add a picture';
    var file = el('input', { class: 'file', type: 'file', accept: 'image/*', tabindex: '-1', 'aria-hidden': 'true' }, row);
    var send = el('button', { type: 'submit', class: 'send' }, row); send.textContent = 'Send';
    var say = el('p', { class: 'say', role: 'status', 'aria-live': 'polite' }, slip);

    ui = { mark: mark, look: look, image: null, picked: false, svg: svg, slip: slip, line: line, send: send, say: say,
           thumb: thumb, picText: picText, busy: false };

    if (!reduced) requestAnimationFrame(function () { requestAnimationFrame(function () { slip.classList.remove('in'); }); });
    catcher.addEventListener('click', function (e) { e.preventDefault(); drop(); });
    catcher.addEventListener('touchstart', function (e) { if (e.cancelable) e.preventDefault(); drop(); }, { passive: false });
    x.addEventListener('click', drop);
    pic.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      picText.textContent = 'Adding…';
      jpegFromFile(f, function (img) {
        if (!ui) return;
        if (img) { ui.picked = true; setPicture(img, true); }
        else { picText.textContent = ui.image ? 'Change picture' : 'Add a picture'; say.textContent = "That picture didn't open. Try another."; }
      });
    });
    slip.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    slip.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); drop(); } });
    focusLine();
  }

  function focusLine() { if (ui) { try { ui.line.focus({ preventScroll: true }); } catch (e) { ui.line.focus(); } } }

  function setPicture(img, chosen) {
    if (!ui) return;
    ui.image = img || null;
    ui.thumb.classList.toggle('on', !!img);
    if (img) ui.thumb.src = img;
    ui.picText.textContent = img ? 'Change picture' : 'Add a picture';
    if (chosen) ui.say.textContent = '';
  }

  function onKey(e) { if (ui && e.key === 'Escape') { e.preventDefault(); drop(); } }
  document.addEventListener('keydown', onKey, true);

  function submit() {
    if (!ui || ui.busy) return;
    var u = ui;
    u.busy = true; u.send.disabled = true; u.send.textContent = 'Sending…'; u.say.textContent = '';
    var body = { page: location.href, note: u.line.value.trim(), mark: u.mark, errLog: errLog.slice(-20) };
    if (u.image) body.image = u.image;
    if (u.look) body.look = u.look;
    fetch(ENDPOINT, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        if (r.ok) { close(true); return; }
        fail(r.status === 401 ? 'Sign in to bars-engine, then send again.' : "Didn't send. Try again.");
      })
      .catch(function () { fail("Didn't send. Try again."); });
    function fail(msg) {
      if (ui !== u) return;
      u.busy = false; u.send.disabled = false; u.send.textContent = 'Send'; u.say.textContent = msg;
    }
  }

  function drop() { close(false); }

  function close(sent) {
    if (!ui) return;
    var u = ui, h = host;
    ui = null; host = null; root = null;
    quiet(false);
    try { if (document.activeElement === h) h.blur(); } catch (e) { /* ignore */ }
    if (reduced) { h.remove(); return; }
    u.slip.classList.add(sent ? 'fold' : 'in');
    u.svg.classList.add('gone');
    setTimeout(function () { h.remove(); }, 280);
  }
})();
