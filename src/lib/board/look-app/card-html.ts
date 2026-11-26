import { EXT_APPS_BUNDLE } from './ext-apps-bundle.generated'

/**
 * The look card's page (ui://council-board/look-card.html), drawn by Claude beside the chat.
 *
 * Mechanic: the board's own look card and its three seals, moved into Claude. dispatch-lever (Claude Takes It: one
 * press is the whole move), steer-helm (Steer: pick the way, add a note, Turn the helm) and compost-hatch (Compost:
 * why it stalled, what to keep, Drop it through), from six-faces-council canon/mechanics/. Spec: council-board-v2.md
 * section 1. Aesthetic contract (council/aesthetic-contract.md):
 *   4 the game's 5:7 dusk card, a rim in its face's colour, brass corners, a corner index with a wax seal;
 *     Put it down at top right is the one way back, and Escape does the same;
 *   5 Marcellus for titles, Atkinson Hyperlegible for reading, Caveat only for his own words;
 *   6 colours from tokens.css (--ui-bg, --ui-brass, the face trims); 7 n/a; 8 three wax seals, Claude Takes It large.
 * 1 to 3 (harbour, boats, ship cards) are n/a: the card is drawn alone in the chat, not in the harbour.
 *
 * The page gets the look from show_look's structuredContent (ontoolresult) and saves a press with answer_look
 * (callServerTool). It reaches no network itself: the host proxies the tool calls, and the CSP lets it load only the
 * board's pictures and the three fonts.
 */

const STYLE = String.raw`
:root{--ui-bg:#140e0b;--ui-panel:#2b1e16;--ui-ink:#f6ecdc;--ui-muted:#c9b49a;--ui-brass:#b8914a;--ui-brass-hi:#e6c98a;--ui-brass-lo:#5e4520;
  --ui-display:"Marcellus",Georgia,serif;--ui-body:"Atkinson Hyperlegible","Segoe UI",system-ui,sans-serif;--ui-hand:"Caveat","Segoe Print","Bradley Hand",cursive;
  --ui-ease:cubic-bezier(.2,.8,.2,1);--fc:#2f9e9e;--cap:#f6ecdc;--cap2:#c9b49a;color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0;background:transparent}
body{font:400 16px/1.45 var(--ui-body);color:var(--cap);padding:14px 10px 18px;display:flex;justify-content:center}
.wait{font:400 18px/1.3 var(--ui-display);color:var(--ui-muted);margin:40px 0}
.card{position:relative;width:min(400px,100%);min-height:calc(min(400px,100vw - 20px) * 1.4);border-radius:14px;padding:22px 20px 20px;
  background:radial-gradient(120% 70% at 50% 0%,#2a1d15 0%,var(--ui-bg) 62%),var(--ui-bg);
  box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--fc) 70%,transparent),inset 0 0 0 3px var(--fc),inset 0 0 0 6px var(--ui-bg),
    inset 0 0 0 7px color-mix(in oklab,var(--ui-brass) 55%,transparent),0 0 26px color-mix(in oklab,var(--fc) 40%,transparent),0 16px 30px rgba(0,0,0,.5);
  display:flex;flex-direction:column}
.card.turn{animation:turn .45s var(--ui-ease)}
@keyframes turn{from{transform:rotateY(80deg) scale(.92);opacity:.2}}
/* brass corners */
.br{position:absolute;width:22px;height:22px;border:2px solid var(--ui-brass);pointer-events:none}
.br.tl{top:10px;left:10px;border-right:0;border-bottom:0;border-top-left-radius:8px}
.br.tr{top:10px;right:10px;border-left:0;border-bottom:0;border-top-right-radius:8px}
.br.bl{bottom:10px;left:10px;border-right:0;border-top:0;border-bottom-left-radius:8px}
.br.bb{bottom:10px;right:10px;border-left:0;border-top:0;border-bottom-right-radius:8px}
/* corner index: the face's letter over its wax seal */
.idx{position:absolute;top:18px;left:20px;display:flex;flex-direction:column;align-items:center;gap:3px;font:400 18px/1 var(--ui-display);color:var(--ui-brass-hi)}
.idx i{width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 36% 30%,color-mix(in oklab,var(--fc) 55%,#fff),var(--fc) 40%,color-mix(in oklab,var(--fc) 45%,#000));box-shadow:0 1px 2px rgba(0,0,0,.6)}
.deck{margin:0 0 12px 34px;min-height:36px;display:flex;align-items:center;font-size:14px;line-height:1.3;color:var(--cap2)}
.down{all:unset;box-sizing:border-box;cursor:pointer;position:absolute;top:10px;right:12px;min-height:44px;display:flex;align-items:center;gap:6px;
  padding:0 12px 0 10px;border-radius:22px;background:rgba(10,6,4,.6);font:700 14px/1 var(--ui-body);color:var(--cap)}
.down svg{width:20px;height:20px}
.pic{margin:0;border-radius:8px;overflow:hidden;background:#0b0806;box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--ui-brass) 45%,transparent)}
.pic button{all:unset;display:block;width:100%;cursor:zoom-in}
.pic img{display:block;width:100%;height:auto;max-height:62vh;object-fit:contain}
.pic.whole img{max-height:none}
.pic figcaption{padding:8px 10px;font-size:13px;line-height:1.35;color:var(--cap2)}
.nopic{padding:18px 12px;font-size:14px;color:var(--cap2)}
h1{margin:16px 0 0;font:400 23px/1.2 var(--ui-display);text-wrap:balance;overflow-wrap:break-word}
h1.long{font-size:20px;line-height:1.26}
.ask{margin:12px 0 0;font-size:16px;line-height:1.45}
.miss{display:flex;gap:10px;align-items:flex-start;margin:14px 0 0;font-size:15px;line-height:1.42;color:var(--cap)}
.miss svg{flex:none;width:20px;height:20px;margin-top:2px;color:var(--ui-brass-hi)}
.miss span{overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:5}
.miss.whole span{display:block}
.more,.open{all:unset;cursor:pointer;min-height:44px;display:inline-flex;align-items:center;font-size:15px;font-weight:700;color:var(--cap);text-decoration:underline;text-underline-offset:3px}
.links{display:flex;gap:18px;flex-wrap:wrap}
.moves{margin-top:22px;display:flex;flex-direction:column;gap:12px}
.mv{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:56px 1fr;column-gap:14px;align-items:center;min-height:56px;padding:6px 8px 6px 0;border-radius:30px;color:var(--cap)}
.mv i{justify-self:center;width:40px;height:40px;border-radius:50%;
  background:radial-gradient(circle at 36% 30%,color-mix(in oklab,var(--fc) 55%,#fff) 0%,var(--fc) 32%,color-mix(in oklab,var(--fc) 60%,#000) 72%,color-mix(in oklab,var(--fc) 35%,#000) 100%);
  box-shadow:0 2px 3px rgba(0,0,0,.5),inset 0 -3px 5px rgba(0,0,0,.35),0 0 0 2px color-mix(in oklab,var(--fc) 60%,#000),0 0 0 5px color-mix(in oklab,var(--fc) 45%,transparent),0 0 14px color-mix(in oklab,var(--fc) 50%,transparent)}
.mv.big i{width:52px;height:52px}
.mv span{display:block;font:700 16px/1.2 var(--ui-body)}
.mv.big span{font:400 21px/1.15 var(--ui-display)}
.mv small{display:block;margin-top:4px;font:400 14px/1.35 var(--ui-body);color:var(--cap2)}
.mv[aria-expanded="true"] i,.mv:hover i,.mv:focus-visible i{box-shadow:0 2px 3px rgba(0,0,0,.5),inset 0 -3px 5px rgba(0,0,0,.35),0 0 0 3px var(--fc),0 0 0 7px color-mix(in oklab,var(--fc) 60%,transparent),0 0 22px var(--fc)}
.mv:focus-visible,.tag:focus-visible,.go:focus-visible,.down:focus-visible,.more:focus-visible,.open:focus-visible,.pic button:focus-visible,.eli5:focus-visible{outline:3px solid #ffd76a;outline-offset:2px}
.mv:disabled{cursor:progress;opacity:.6}
.tray{display:flex;flex-direction:column;gap:10px;margin-top:18px;padding-top:14px;border-top:1px solid color-mix(in oklab,var(--fc) 45%,transparent);font-size:15px}
.tray b{font:400 19px/1.2 var(--ui-display);font-weight:400}
.tags{display:flex;flex-wrap:wrap;gap:8px}
.tag{font:inherit;font-size:14px;min-height:44px;padding:6px 12px;border:1px solid color-mix(in oklab,var(--cap) 40%,transparent);border-radius:10px;background:rgba(255,236,210,.06);color:var(--cap);cursor:pointer;text-align:left}
.tag small{display:block;margin-top:2px;font-size:13px;color:var(--cap2)}
.tag[aria-pressed="true"]{background:var(--fc);border-color:var(--fc);color:#fff}
.tag[aria-pressed="true"] small{color:#fff}
textarea{width:100%;min-height:72px;font:400 22px/1.25 var(--ui-hand);border:1px solid color-mix(in oklab,var(--cap) 40%,transparent);border-radius:10px;padding:8px 10px;background:rgba(255,236,210,.06);color:var(--cap)}
textarea::placeholder{font:400 15px/1.4 var(--ui-body);color:var(--cap2)}
.go{align-self:flex-start;font:700 15px/1 var(--ui-body);min-height:44px;padding:0 18px;border:0;border-radius:22px;color:#fff;cursor:pointer;
  background:radial-gradient(circle at 30% 20%,color-mix(in oklab,var(--fc) 80%,#000),color-mix(in oklab,var(--fc) 55%,#000));box-shadow:0 0 0 4px color-mix(in oklab,var(--fc) 40%,transparent)}
.say{min-height:22px;margin:12px 0 0;font-size:15px;font-weight:700}
.say.bad{color:#ffb38a}
.eli5{all:unset;cursor:pointer;margin-top:auto;padding-top:14px;min-height:44px;display:inline-flex;align-items:center;align-self:flex-start;font-size:14px;color:var(--cap2);text-decoration:underline;text-underline-offset:3px}
.sent{margin-top:22px;display:grid;grid-template-columns:56px 1fr;column-gap:14px;align-items:center}
.sent i{justify-self:center;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;
  background:radial-gradient(circle at 36% 30%,#fff3cf 0%,#e9c46a 38%,#a9801f 100%);box-shadow:0 2px 3px rgba(0,0,0,.5),inset 0 -3px 5px rgba(0,0,0,.35),0 0 0 3px var(--fc)}
.sent i svg{width:26px;height:26px}
.sent span{font:400 20px/1.2 var(--ui-display)}
.sent small{display:block;margin-top:6px;font:400 15px/1.4 var(--ui-body);color:var(--cap2)}
.sent q{font:400 21px/1.25 var(--ui-hand);color:var(--cap);quotes:none}
@media (prefers-reduced-motion:reduce){.card.turn{animation:none}}
`

const SCRIPT = String.raw`
(() => {
const {App, applyHostFonts} = window.McpExtApps || {};
const root = document.getElementById('table');
const KEY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/></svg>';
const DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 9c3 5 11 5 14 0"/><path d="M12 14v6"/><path d="M8.5 17.5 12 21l3.5-3.5"/></svg>';
const CHECK = '<svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M-9 1l6 6 12-13" fill="none" stroke="rgba(20,10,4,.6)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let look = null, open = '', pick = {choice: '', choices: [], note: '', stall: '', keep: []}, say = '', bad = false, busy = false, sent = null, whole = {pic: false, miss: false}, fresh = true;
let app = null;

function moves(v){
  const rec = v.options.find(o => o.recommended) || v.options[0];
  const others = v.options.filter(o => o !== rec && o.v !== v.compost);
  const seal = (m, name, sub, big) => '<button type="button" class="mv' + (big ? ' big' : '') + '" data-move="' + m + '" aria-expanded="' + (open === m) + '"' + (busy ? ' disabled' : '') + '><i aria-hidden="true"></i><span>' + name + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></button>';
  let tray = '';
  if (open === 'steer') {
    const many = v.max > 1;
    tray = '<div class="tray"><b>Steer: pick the way' + (many ? ' (up to ' + v.max + ')' : '') + '.</b>'
      + (others.length ? '<div class="tags">' + others.map(o => '<button type="button" class="tag" data-opt="' + esc(o.v) + '" aria-pressed="' + (many ? pick.choices.includes(o.v) : pick.choice === o.v) + '">' + esc(o.label) + (o.detail ? '<small>' + esc(o.detail) + '</small>' : '') + '</button>').join('') + '</div>' : '')
      + '<textarea data-note placeholder="Add a note in your words (optional)" aria-label="Your note">' + esc(pick.note) + '</textarea>'
      + '<button type="button" class="go" data-go="steer"' + (busy ? ' disabled' : '') + '>Turn the helm</button></div>';
  } else if (open === 'compost') {
    tray = '<div class="tray"><b>Compost: nothing is deleted. Why did it stall?</b><div class="tags">'
      + v.stalls.map(s => '<button type="button" class="tag" data-stall="' + s.v + '" aria-pressed="' + (pick.stall === s.v) + '">' + esc(s.label) + '</button>').join('') + '</div>'
      + '<b>What is worth keeping?</b><div class="tags">'
      + v.keep.map(k => '<button type="button" class="tag" data-keep="' + k.v + '" aria-pressed="' + pick.keep.includes(k.v) + '">' + esc(k.label) + '</button>').join('') + '</div>'
      + '<textarea data-note placeholder="Add a note in your words (optional)" aria-label="Your note">' + esc(pick.note) + '</textarea>'
      + '<button type="button" class="go" data-go="compost"' + (busy ? ' disabled' : '') + '>Drop it through</button></div>';
  }
  return '<div class="moves">'
    + seal('claude_takes_it', 'Claude Takes It', rec ? rec.label : '', true)
    + seal('steer', 'Steer', others.length ? 'Pick another way, or add a note' : 'Add a note in your words', false)
    + seal('compost', 'Compost', 'Nothing is deleted', false)
    + '</div>' + tray;
}

function sentBlock(line, note){
  return '<div class="sent" role="status"><i>' + CHECK + '</i><span>Sent. Claude has it.<small>' + esc(line) + '</small>'
    + (note ? '<small><q>' + esc(note) + '</q></small>' : '') + '</span></div>';
}

function render(){
  if (!look) { root.innerHTML = '<p class="wait" role="status">' + esc(say || 'Drawing the card…') + '</p>'; return; }
  const v = look;
  document.documentElement.style.setProperty('--fc', v.trim);
  const head = v.why || v.ask;
  const pic = v.still
    ? '<figure class="pic' + (whole.pic ? ' whole' : '') + '"><button type="button" data-whole="pic" aria-label="' + (whole.pic ? 'Fit the picture' : 'See the picture whole') + '"><img src="' + esc(v.still) + '" alt="' + esc(v.title || 'The look') + '"></button>' + (v.title ? '<figcaption>' + esc(v.title) + '</figcaption>' : '') + '</figure>'
    : '<div class="pic nopic">This look carries no picture.</div>';
  let foot;
  if (sent) foot = sentBlock(sent.line, sent.note);
  else if (v.answered) foot = sentBlock('Answered' + (v.answered.label ? ': ' + v.answered.label : '') + '. Its card on the board is settled.', v.answered.steer && !/^Steer: |^Compost\./.test(v.answered.steer) ? v.answered.steer : '');
  else foot = moves(v);
  root.innerHTML = '<article class="card' + (fresh ? ' turn' : '') + '" aria-label="Look card: ' + esc(v.title || v.ask) + '">'
    + '<span class="br tl"></span><span class="br tr"></span><span class="br bl"></span><span class="br bb"></span>'
    + '<span class="idx" aria-hidden="true">' + esc(v.faceName[0]) + '<i></i></span>'
    + (open ? '<button type="button" class="down" data-down>' + DOWN + 'Put it down</button>' : '')
    + '<p class="deck">' + esc(v.deck) + ', held by the ' + esc(v.faceName) + '</p>'
    + pic
    + '<h1' + (head.length > 140 ? ' class="long"' : '') + '>' + esc(head) + '</h1>'
    + (v.why && v.ask ? '<p class="ask">' + esc(v.ask) + '</p>' : '')
    + (v.whyYou ? '<p class="miss' + (whole.miss ? ' whole' : '') + '">' + KEY + '<span>' + esc(v.whyYou) + '</span></p>' + (v.whyYou.length > 260 ? '<button type="button" class="more" data-whole="miss">' + (whole.miss ? 'Fold it back' : 'Read it whole') + '</button>' : '') : '')
    + (v.href ? '<div class="links"><button type="button" class="open" data-open>Open it and look</button></div>' : '')
    + foot
    + '<p class="say' + (bad ? ' bad' : '') + '" role="status" aria-live="polite">' + esc(sent || v.answered ? '' : say) + '</p>'
    + (!sent && !v.answered ? '<button type="button" class="eli5" data-eli5>This makes no sense, explain it like I’m 5</button>' : '')
    + '</article>';
  fresh = false;
}

async function press(move){
  if (!look || busy) return;
  const v = look, args = {id: v.id, move};
  if (move === 'steer') {
    if (!pick.choice && !pick.choices.length && !pick.note.trim()) { bad = true; say = 'Tap a way, or write a note, first.'; return render(); }
    if (v.max > 1 && pick.choices.length) args.choices = pick.choices; else if (pick.choice) args.choice = pick.choice;
    if (pick.note.trim()) args.note = pick.note.trim();
  }
  if (move === 'compost') {
    if (!pick.stall) { bad = true; say = 'Tap why it stalled first.'; return render(); }
    args.stall = pick.stall; args.keep = pick.keep; if (pick.note.trim()) args.note = pick.note.trim();
  }
  busy = true; bad = false; say = 'Saving…'; render();
  try {
    const r = await app.callServerTool({name: 'answer_look', arguments: args});
    const t = (r && r.content || []).map(c => c.text || '').join(' ');
    if (r && r.isError) { bad = true; say = t || 'That move did not save. Try again.'; }
    else {
      sent = {line: (r.structuredContent && r.structuredContent.line) || t, note: args.note || ''};
      open = ''; say = '';
      try { await app.updateModelContext({content: [{type: 'text', text: sent.line}]}); } catch (e) {}
    }
  } catch (e) { bad = true; say = 'That move did not save (' + (e && e.message || 'no answer') + '). Try again.'; }
  busy = false; render();
}

root.addEventListener('click', async e => {
  const t = e.target.closest('button'); if (!t || !look) return;
  const d = t.dataset;
  if (d.move === 'claude_takes_it') return press('claude_takes_it');
  if (d.move) { open = open === d.move ? '' : d.move; bad = false; say = ''; }
  else if (d.down !== undefined) { open = ''; say = ''; }
  else if (d.go) return press(d.go);
  else if (d.opt) {
    if (look.max > 1) { const i = pick.choices.indexOf(d.opt); if (i >= 0) pick.choices.splice(i, 1); else if (pick.choices.length < look.max) pick.choices.push(d.opt); }
    else pick.choice = pick.choice === d.opt ? '' : d.opt;
  }
  else if (d.stall) pick.stall = d.stall;
  else if (d.keep) {
    const k = pick.keep, i = k.indexOf(d.keep);
    if (d.keep === 'nothing') pick.keep = i < 0 ? ['nothing'] : [];
    else { pick.keep = k.filter(x => x !== 'nothing'); if (i < 0) pick.keep.push(d.keep); else pick.keep = pick.keep.filter(x => x !== d.keep); }
  }
  else if (d.whole) whole[d.whole] = !whole[d.whole];
  else if (d.open !== undefined) { try { await app.openLink({url: look.href}); } catch (e) { bad = true; say = 'Claude did not open the link. It is ' + look.href; } }
  else if (d.eli5 !== undefined) {
    try { await app.sendMessage({role: 'user', content: [{type: 'text', text: 'The look "' + (look.title || look.id) + '" (' + look.id + ') makes no sense to me. Explain it like I’m 5, then show me the card again.'}]}); say = 'Asked Claude to explain it plainly.'; bad = false; }
    catch (e) { bad = true; say = 'That did not reach Claude. Ask in the chat instead.'; }
  }
  render();
});
root.addEventListener('input', e => { if (e.target.matches('textarea[data-note]')) pick.note = e.target.value; });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) { open = ''; say = ''; render(); } });

function take(sc){
  if (!sc || typeof sc !== 'object' || !sc.id || !Array.isArray(sc.options)) return false;
  look = sc; open = ''; sent = null; say = ''; bad = false; fresh = true; pick = {choice: '', choices: [], note: '', stall: '', keep: []};
  render(); return true;
}

render();
if (!App) { say = 'The card could not start: its client did not load.'; render(); return; }
app = new App({name: 'Council Board look card', version: '1.0.0'}, {}, {autoResize: true});
app.ontoolresult = p => {
  if (!take(p && p.structuredContent)) { const t = ((p && p.content) || []).map(c => c.text || '').join(' '); look = null; say = t || 'No look came back.'; render(); }
};
app.onhostcontextchanged = c => { try { if (c && c.styles && c.styles.css && c.styles.css.fonts) applyHostFonts(c.styles.css.fonts); } catch (e) {} };
app.connect().catch(e => { say = 'The card could not reach Claude (' + (e && e.message || 'no answer') + ').'; render(); });
// A preview outside Claude: ?demo=<json> draws a card with no host, so a look can be checked in a plain browser.
try { const q = new URLSearchParams(location.search).get('demo'); if (q) take(JSON.parse(q)); } catch (e) {}
window.__lookCard = {take, state: () => ({look, open, pick, sent, say})};
})();
`

let cached: string | null = null

export function lookCardHtml(): string {
  if (cached) return cached
  cached = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>Look card</title>'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Caveat:wght@500&family=Marcellus&display=swap">'
    + `<style>${STYLE}</style></head><body><main id="table"></main>`
    + `<script>${EXT_APPS_BUNDLE}</script><script>${SCRIPT}</script></body></html>`
  return cached
}
