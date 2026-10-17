/**
 * The Council Board page needs three things at serve time that the claude.ai artifact got from its runtime.
 * Its Send button fires a Claude Code Remote routine through `mcp.callTool`, which bars-engine does not offer: a save
 * here starts its own board-pull (src/lib/board/dispatch.ts), so Send has nothing left to ask for. The same
 * substitutions as six-faces-council board/nonprofit/build.py make the bar say so. Each replacement is optional, so a
 * template change in six-faces-council degrades to the shim's "sending is turned off" message instead of a 503;
 * `missingCouncilPatches` names what no longer matched so a test (and a log line) can say so.
 */
const PATCHES: [string, string][] = [
  ['btn.hidden = !mcp || !n;', 'btn.hidden = true;'],
  ['else msg.textContent = mcp ? `', 'else msg.textContent = false ? `'],
  ['`${what} saved. This view cannot reach Claude, so tell Claude in chat that you saved.`',
   "`${what} saved and waiting for the board pull, which records ${n === 1 ? 'it' : 'them'} on main within a few "
   + "minutes. Nobody needs telling.`"],
  ["const PICKUP_TRIGGER = 'trig_01L138vKTaN9MSJoFKRmaBNx'", "const PICKUP_TRIGGER = ''"],
]

export function patchCouncilPage(html: string): string {
  let out = html
  for (const [from, to] of PATCHES) out = out.includes(from) ? out.replace(from, () => to) : out
  return out
}

export function missingCouncilPatches(html: string): string[] {
  return PATCHES.map(([from]) => from).filter(from => !html.includes(from))
}
