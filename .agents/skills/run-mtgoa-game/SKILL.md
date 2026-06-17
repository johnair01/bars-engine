---
name: run-mtgoa-game
description: Launch and screenshot the mtgoa-game app (the standalone Vite + React card game in mtgoa-game/). Use when asked to run, start, or screenshot mtgoa-game — especially the trust/attune encounter prototype (Level-1/L2/Boss Priya). Captures the browser-download egress block and the pre-installed Chromium workaround so the next session doesn't rediscover them.
---

# Skill: Run mtgoa-game (Vite app + screenshots)

`mtgoa-game/` is a standalone Vite + React + TypeScript app (separate from the
main Next.js bars-engine). "Running" it means starting the dev server and driving
a headless Chromium against it to produce screenshots.

## Dev server

```bash
cd /home/user/bars-engine/mtgoa-game
(npm run dev > /tmp/vite.log 2>&1 &)
timeout 40 bash -c 'until curl -sf http://localhost:5173 >/dev/null 2>&1; do sleep 1; done' && echo "DEV UP"
```

Vite serves on **http://localhost:5173**. Stop with `pkill -f vite` (or
`pkill -f 'npm run dev'`) before relaunching, or the next run hits `EADDRINUSE`.

## Browser: use the pre-installed Chromium (downloads are blocked)

`npx playwright install` **fails** — `cdn.playwright.dev` is not in the network
egress allowlist (403 "Host not in allowlist"). Do not retry it. A Playwright
Chromium is already on the box:

```
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
executablePath: /opt/pw-browsers/chromium-1194/chrome-linux/chrome   # launch with args: ['--no-sandbox']
```

There is **no `chromium-cli`** here, so write a tiny Playwright driver. The driver
must live in `/tmp` and import Playwright by **absolute file URL** (ESM can't
resolve a bare `playwright` from outside the package tree, and `NODE_PATH` doesn't
apply to ESM). Playwright is CommonJS, so import the default and destructure:

```js
import pw from 'file:///home/user/bars-engine/mtgoa-game/node_modules/playwright/index.js';
const { chromium } = pw;
```

## Reaching the trust prototype

The trust/attune encounter screen is reached two ways:
- **URL hash**: `http://localhost:5173/#l1-priya` opens Level-1; `#boss-priya` opens Boss.
- **Toggle buttons**: bottom-right "▶ Play Level-1 Priya / Boss Priya".

In-screen, a header **rung switcher** has `L1` / `L2` / `Boss` buttons
(`getByRole('button', { name: 'L2', exact: true })`). Cards are `<button>`s
labelled by name (`page.locator('button', { hasText: 'Bear Witness' })`). The
L1 happy path to a win: Attune → align (Bear Witness) → Dissolve → align (Check In)
→ Dissolve (converts) → engage all four domains → "Capstone — solve it".

## Representative driver (run to a win + screenshots)

```bash
cat > /tmp/shoot.mjs <<'EOF'
import pw from 'file:///home/user/bars-engine/mtgoa-game/node_modules/playwright/index.js';
const { chromium } = pw;
const OUT = '/tmp/shots'; const shot = (p,n)=>p.screenshot({path:`${OUT}/${n}.png`});
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
const p = await b.newPage({ viewport:{width:1300,height:1250} });
await p.goto('http://localhost:5173/#l1-priya', { waitUntil:'networkidle' });
await p.getByText('Her live need').waitFor({ timeout:15000 });
await shot(p,'1-L1');
await p.getByRole('button',{name:'L2',exact:true}).click(); await p.getByText('she moves').waitFor(); await shot(p,'2-L2');
await p.getByRole('button',{name:'Boss',exact:true}).click(); await p.waitForTimeout(400); await shot(p,'3-Boss');
await p.getByRole('button',{name:'L1',exact:true}).click(); await p.getByText('Her live need').waitFor();
await p.getByRole('button',{name:'Attune',exact:true}).click();
await p.locator('button',{hasText:'Bear Witness'}).first().click();
await p.locator('button:has-text("Dissolve"):not([disabled])').first().click();
await p.locator('button',{hasText:'Check In'}).first().click();
await p.locator('button:has-text("Dissolve"):not([disabled])').first().click();
for (const d of ['Reach the People Still Inside','See What the Rollback Protects','Build the Container','Communicate It Honestly']) { await p.locator('button',{hasText:d}).first().click(); await p.waitForTimeout(120); }
await p.getByRole('button',{name:/Capstone/}).click();
await p.getByText('You found').waitFor({ timeout:5000 }); await shot(p,'4-win');
await b.close();
EOF
mkdir -p /tmp/shots
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node /tmp/shoot.mjs
```

Screenshots land in `/tmp/shots/`. **Look at them** with the Read tool — a blank
frame is a launch failure, not a pass.

## Gotchas

- **`npx playwright install` is blocked** (egress). Always use the pre-installed
  binary at `/opt/pw-browsers` — never wait on a download.
- **No `chromium-cli`** — hand-write the small driver above.
- **ESM import** — bare `'playwright'` won't resolve from `/tmp`; use the absolute
  `file://` path and destructure the CJS default export.
- **React inputs** — there are none in this screen; it's all buttons. Click by role/text.
- **First paint** — Vite compiles on demand; `waitFor` the "Her live need" text
  rather than `sleep`.
- A benign **favicon 404** shows in `console --errors`; ignore it.
- The pre-installed browser is v1194 while `mtgoa-game`'s playwright expects a
  newer build — launching by explicit `executablePath` works regardless.
