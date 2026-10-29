/* Caption mode (council pass between-ari1, ba-round4-comfort; Ari's note 3: "captions and scrolling text that moves at
   the speed of comprehension and can be sped through").
   Every line of copy on the page reads in through readIn(): the words come in one visual line at a time, at a pace
   each player sets (slow, middle, fast), a tap shows the rest, and still shows it all at once. Buttons and fields are
   never held back, so nothing waits on the reading. Text already read once shows at once when it comes back.
   scout: rung 2, a known pattern (typewriter text with a skip, as in Stardew and visual novels); the repo's only
   one (public/inner-garden-game/js/ui/DialogBox.js) draws on a canvas, so this small DOM reader was written by hand. */

export const PACES = { slow: ["Slow", 2.2], middle: ["Middle", 3.6], fast: ["Fast", 6.5], still: ["Still", 0] };
const KEY = "between.captions";
const BLOCKS = "h1, h2, h3, p, li, label, .t, .small, .hint, .toastText, .sub";
const seen = new Set();
let pace = (() => {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (PACES[v]) return v; } catch {}
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? "still" : "middle";
})();

export const getPace = () => pace;
export function setPace(p) {
  if (!PACES[p]) return;
  pace = p;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  document.querySelectorAll("[data-reading]").forEach(showAll);
}
/** Words per second for the current pace, 0 for still. */
export const wordsPerSecond = () => PACES[pace][1];
/** How long a line of `n` words needs on screen at this pace, for toasts. */
export const readMs = n => pace === "still" ? 0 : Math.round(n / PACES[pace][1] * 1000);

function wrapWords(block) {
  const walk = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, { acceptNode: n =>
    n.parentElement.closest("button, select, option, textarea, input, .cw") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
  const words = [];
  for (const n of nodes) {
    if (!n.data.trim()) continue;
    const frag = document.createDocumentFragment();
    for (const part of n.data.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
      const s = document.createElement("span"); s.className = "cw"; s.textContent = part; frag.appendChild(s); words.push(s);
    }
    n.replaceWith(frag);
  }
  return words;
}

function showAll(root) {
  clearTimeout(root._readT); root._readT = null;
  root.querySelectorAll(".cw").forEach(s => s.classList.add("on"));
  if (root._readText) for (const t of root._readText) seen.add(t);
  root.removeAttribute("data-reading");
}

/** Read the copy inside `root` in at the player's pace. Safe to call again after root's HTML changes. */
export function readIn(root) {
  if (!root) return;
  clearTimeout(root._readT);
  // the innermost blocks only, so a line is never counted twice
  const blocks = [...root.querySelectorAll(BLOCKS)].filter(b => !b.querySelector(BLOCKS) && !b.closest("button") && b.textContent.trim());
  if (!blocks.length && root.textContent.trim()) blocks.push(root);
  const fresh = blocks.filter(b => !seen.has(b.textContent.trim()));
  root._readText = fresh.map(b => b.textContent.trim());
  const lines = [];
  for (const b of fresh) {
    const words = wrapWords(b);
    let top = null, line = null;
    for (const w of words) { const y = Math.round(w.offsetTop); if (y !== top) { top = y; line = []; lines.push(line); } line.push(w); }
  }
  if (!root._readTap) {
    root._readTap = true;
    root.addEventListener("pointerdown", e => { if (root.hasAttribute("data-reading") && !e.target.closest("button, input, textarea, select, a")) showAll(root); });
  }
  if (pace === "still" || !lines.length) { showAll(root); return; }
  root.setAttribute("data-reading", "");
  let i = 0;
  const next = () => {
    if (i >= lines.length) { showAll(root); return; }
    const line = lines[i++];
    line.forEach(s => s.classList.add("on"));
    root._readT = setTimeout(next, 180 + line.length / wordsPerSecond() * 1000);
  };
  next();
}
