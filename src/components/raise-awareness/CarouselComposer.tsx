'use client'

import { useRef, useState } from 'react'

type Channel = 'fire' | 'water' | 'wood' | 'metal' | 'earth'
type SlideKind = 'hook' | 'body' | 'steps' | 'cta'
type TextColor = 'ink' | 'accent' | 'ember' | 'teal' | 'jade' | 'silver' | 'ochre' | 'liminal'
type TextRun = { text: string; bold?: boolean; italic?: boolean; color?: TextColor }
type Slide = {
  kind: SlideKind
  runs: TextRun[]
  ground: string
  alignment: 'left' | 'center'
  fontRole: 'display' | 'body' | 'mono'
  scale: 'compact' | 'standard' | 'large'
}
type Post = { series: string; from: Channel; to: Channel; caption: string; slides: Slide[] }

const channels: Channel[] = ['metal', 'fire', 'water', 'wood', 'earth']
const palette: Record<Channel, { frame: number[]; glow: number[]; gem: number[] }> = {
  fire: { frame: [193, 57, 43], glow: [232, 103, 26], gem: [231, 76, 60] },
  water: { frame: [26, 58, 92], glow: [26, 122, 138], gem: [41, 128, 185] },
  wood: { frame: [74, 124, 89], glow: [39, 174, 96], gem: [46, 204, 113] },
  metal: { frame: [142, 154, 171], glow: [189, 195, 199], gem: [176, 184, 196] },
  earth: { frame: [181, 101, 29], glow: [212, 160, 23], gem: [212, 160, 23] },
}
const railColors = ['#c1392b', '#1a7a8a', '#4a7c59', '#8e9aab', '#d4a017', '#2980b9', '#7c3aed']
const colorLabels: Record<TextColor, string> = { ink: 'Ink', accent: 'Alchemy accent', ember: 'Ember', teal: 'Teal', jade: 'Jade', silver: 'Silver', ochre: 'Ochre', liminal: 'Liminal' }
const fixedColors: Partial<Record<TextColor, string>> = { ember: '#e8671a', teal: '#2980b9', jade: '#2ecc71', silver: '#bdc3c7', ochre: '#d4a017', liminal: '#7c3aed' }
const rainRest = [3.5, 6, 8.5, 13.5, 16, 21, 23.5, 31, 38.5, 48.5, 53.5, 56, 58.5, 63.5, 71, 73.5, 78.5, 81, 86, 91, 93.5, 96, 98.5]

function seededRandom(seed: number) { let state = seed; return () => { state = (state * 9301 + 49297) % 233280; return state / 233280 } }
const rain = (() => {
  const random = seededRandom(7)
  return rainRest.map((rest) => ({ rest, restHeight: 300 + random() * 720, restTop: -80 + random() * 200, width: 2 + random() * 2, restOpacity: 0.1 + random() * 0.09, color: railColors[Math.floor(random() * railColors.length)], chaosX: random() * 100, chaosHeight: 70 + random() * 700, chaosTop: -120 + random() * 1200, chaosTilt: random() * 46 - 23, chaosOpacity: 0.06 + random() * 0.28 }))
})()

function makeSlide(kind: SlideKind, text: string, ground: string, extras: Partial<Slide> = {}): Slide {
  return { kind, runs: [{ text }], ground, alignment: kind === 'cta' ? 'center' : 'left', fontRole: kind === 'body' ? 'body' : 'display', scale: 'standard', ...extras }
}
const starter: Post = {
  series: 'PRACTICE', from: 'metal', to: 'earth', caption: 'A field note from Mastering the Game of Allyship. One practice, one next move.',
  slides: [
    makeSlide('hook', 'When the work starts feeling like a performance.', '◇ You are allowed to notice the cost.'),
    makeSlide('body', 'You keep saying yes, but something in you is tightening.', '◇ Recognition is already a change in direction.'),
    makeSlide('body', 'The question is not whether you care. It is what your care needs to become sustainable.', '◇ Care needs a shape that can last.'),
    makeSlide('steps', 'Notice what is happening.\nLet it land without rushing past it.\nChoose one honest next move.', '◇ Small, specific practice makes room for more.'),
    makeSlide('body', 'Bring that move to one real room, relationship, or decision this week.', '◇ Practice becomes real in company.'),
    makeSlide('cta', 'Read the book.\nTake the next move with you.', '◇ Mastering the Game of Allyship'),
  ],
}

function mix(a: number[], b: number[], t: number) { return a.map((value, index) => Math.round(value + (b[index] - value) * t)) }
function rgb(color: number[]) { return `rgb(${color.join(' ')})` }
function plainText(runs: TextRun[]) { return runs.map((run) => run.text).join('') }
function wrapRuns(runs: TextRun[], limit: number): TextRun[][] {
  const lines: TextRun[][] = []; let current: TextRun[] = []; let length = 0
  const finish = () => { lines.push(current); current = []; length = 0 }
  runs.forEach((run) => {
    run.text.split(/(\n)/).forEach((part) => {
      if (part === '\n') { finish(); return }
      part.split(/(\s+)/).filter(Boolean).forEach((token) => {
        const isSpace = /^\s+$/.test(token)
        if (!isSpace && length > 0 && length + token.length > limit) finish()
        if (isSpace && length === 0) return
        current.push({ ...run, text: token }); length += token.length
      })
    })
  })
  if (current.length || lines.length === 0) finish()
  return lines
}
function runFill(run: TextRun, gem: string) { return run.color === 'accent' ? gem : fixedColors[run.color ?? 'ink'] ?? '#f7f2e8' }
function fontFamily(role: Slide['fontRole']) { return role === 'body' ? "'Nunito', sans-serif" : role === 'mono' ? "'Space Mono', monospace" : "'Jost', sans-serif" }
function updateAt<T>(list: T[], index: number, value: T) { return list.map((item, itemIndex) => itemIndex === index ? value : item) }

function SlideArt({ post, slide, index, svgRef }: { post: Post; slide: Slide; index: number; svgRef?: (node: SVGSVGElement | null) => void }) {
  const order = post.slides.length === 1 ? 1 : index / (post.slides.length - 1)
  const chaos = 1 - order
  const from = palette[post.from]; const to = palette[post.to]
  const frame = mix(from.frame, to.frame, order); const glow = mix(from.glow, to.glow, order); const gem = rgb(mix(from.gem, to.gem, order))
  const limit = slide.kind === 'hook' ? 22 : slide.kind === 'cta' ? 24 : 34
  const lines = wrapRuns(slide.runs, limit).slice(0, 8)
  const baseSize = slide.kind === 'hook' ? 64 : slide.kind === 'cta' ? 54 : slide.fontRole === 'mono' ? 35 : 47
  const scale = slide.scale === 'compact' ? 0.82 : slide.scale === 'large' ? 1.18 : 1
  const size = baseSize * scale
  const textY = slide.kind === 'hook' ? 372 : 368
  const textX = slide.alignment === 'center' ? 540 : 80
  return <svg ref={svgRef} viewBox="0 0 1080 1080" role="img" aria-label={`Slide ${index + 1} of ${post.slides.length}: ${plainText(slide.runs)}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block', background: '#0a0810' }}>
    <defs>
      <radialGradient id={`glow-${index}`} cx="50%" cy="32%" r="72%"><stop offset="0" stopColor={rgb(glow)} stopOpacity={0.15 + order * 0.16} /><stop offset="1" stopColor="#0a0810" stopOpacity="0" /></radialGradient>
      <linearGradient id={`ground-${index}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={rgb(mix(frame, [12, 11, 20], 0.2 + order * 0.05))} /><stop offset="0.58" stopColor="#0a0810" /><stop offset="1" stopColor="#070609" /></linearGradient>
      <filter id={`grain-${index}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" /></filter>
    </defs>
    <rect width="1080" height="1080" fill={`url(#ground-${index})`} /><rect width="1080" height="1080" fill={`url(#glow-${index})`} />
    <g>{rain.map((rail) => { const x = rail.chaosX + (rail.rest - rail.chaosX) * order; const y = rail.chaosTop + (rail.restTop - rail.chaosTop) * order; const height = rail.chaosHeight + (rail.restHeight - rail.chaosHeight) * order; const opacity = rail.chaosOpacity + (rail.restOpacity - rail.chaosOpacity) * order; return <rect key={rail.rest} x={x * 10.8} y={y} width={rail.width} height={height} rx="2" fill={rail.color} opacity={opacity} transform={`rotate(${rail.chaosTilt * chaos} ${x * 10.8} ${y})`} /> })}</g>
    <g opacity={chaos * 0.22} strokeWidth="2">{Array.from({ length: 14 }, (_, scratchIndex) => <path key={scratchIndex} stroke={railColors[scratchIndex % railColors.length]} d={`M ${80 + ((scratchIndex * 71) % 900)} ${150 + ((scratchIndex * 97) % 700)} l ${20 + (scratchIndex % 4) * 14} ${-8 + (scratchIndex % 3) * 9}`} />)}</g>
    <rect x="38" y="38" width="1004" height="1004" fill="none" stroke={rgb(frame)} strokeOpacity="0.42" strokeWidth="2" />
    <g fill="none" stroke={rgb(frame)} strokeWidth="5" strokeLinecap="square"><path d="M82 128V82h46M998 128V82h-46M82 952v46h46M998 952v46h-46" /><g opacity={chaos * 0.5} transform={`translate(${7 * chaos} ${5 * chaos}) rotate(${2.2 * chaos} 540 540)`}><path d="M82 128V82h46M998 128V82h-46M82 952v46h46M998 952v46h-46" /></g></g>
    <g fill="#f4f0e6"><line x1="80" x2="308" y1="102" y2="102" stroke={rgb(frame)} strokeOpacity="0.56" /><text x="540" y="108" textAnchor="middle" fontFamily="'Space Mono', monospace" fontSize="17" letterSpacing="4">MASTERING THE GAME OF ALLYSHIP</text><line x1="772" x2="1000" y1="102" y2="102" stroke={rgb(frame)} strokeOpacity="0.56" /><text x="540" y="164" textAnchor="middle" fontFamily="'Space Mono', monospace" fontSize="19" letterSpacing="5" fill={gem}>{post.series.slice(0, 26).toUpperCase()}</text></g>
    <g fontFamily={fontFamily(slide.fontRole)} fontSize={size} fontWeight={slide.fontRole === 'body' ? 600 : 700} letterSpacing={slide.fontRole === 'display' ? '-1.2' : '0'} textAnchor={slide.alignment === 'center' ? 'middle' : 'start'}>{lines.map((line, lineIndex) => <text key={lineIndex} x={textX} y={textY + lineIndex * (size * 1.22)}>{slide.kind === 'steps' && <tspan fill={gem}>{`${lineIndex + 1}. `}</tspan>}{line.map((run, runIndex) => <tspan key={runIndex} fill={runFill(run, gem)} fontWeight={run.bold ? 800 : undefined} fontStyle={run.italic ? 'italic' : undefined}>{run.text}</tspan>)}</text>)}</g>
    {slide.ground && <text x={slide.alignment === 'center' ? 540 : 80} y="858" textAnchor={slide.alignment === 'center' ? 'middle' : 'start'} fill="#e8e1d3" fontFamily="'Space Mono', monospace" fontSize="21" opacity="0.92">{slide.ground}</text>}
    <image href="/allyship-deck/mtgoa-logo-transparent.png" x="220" y="220" width="640" height="640" opacity={0.05 + order * 0.06} style={{ filter: `blur(${chaos * 3}px)` }} preserveAspectRatio="xMidYMid meet" />
    <rect width="1080" height="1080" filter={`url(#grain-${index})`} opacity={chaos * 0.14} style={{ mixBlendMode: 'overlay' }} />
  </svg>
}

export function CarouselComposer() {
  const [post, setPost] = useState<Post>(starter); const [active, setActive] = useState(0); const [notice, setNotice] = useState('')
  const svgRefs = useRef<(SVGSVGElement | null)[]>([])
  const editSlide = (index: number, patch: Partial<Slide>) => setPost((value) => ({ ...value, slides: updateAt(value.slides, index, { ...value.slides[index], ...patch }) }))
  const editRun = (slideIndex: number, runIndex: number, patch: Partial<TextRun>) => editSlide(slideIndex, { runs: updateAt(post.slides[slideIndex].runs, runIndex, { ...post.slides[slideIndex].runs[runIndex], ...patch }) })
  const download = async (index: number) => {
    const svg = svgRefs.current[index]; if (!svg) return
    try {
      const source = new XMLSerializer().serializeToString(svg); const image = new Image(); const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }))
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('image could not render')); image.src = url })
      const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1080; const context = canvas.getContext('2d'); if (!context) throw new Error('canvas unavailable'); context.drawImage(image, 0, 0); URL.revokeObjectURL(url)
      const link = document.createElement('a'); link.download = `mtgoa-${post.series.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'practice'}-${String(index + 1).padStart(2, '0')}.png`; link.href = canvas.toDataURL('image/png'); link.click()
    } catch { setNotice('This browser could not compile the slide. Try the selected-slide download again after the preview finishes loading.') }
  }
  const downloadAll = async () => { setNotice('Preparing individual PNG slides…'); for (let index = 0; index < post.slides.length; index += 1) await download(index); setNotice(`${post.slides.length} PNG downloads started.`) }
  const addSlide = () => { if (post.slides.length >= 8) return; setPost((value) => ({ ...value, slides: [...value.slides, makeSlide('body', 'Add the next part of the practice here.', '◇ Keep the invitation specific.')] })); setActive(post.slides.length) }
  const removeSlide = (index: number) => { if (post.slides.length <= 5) return; setPost((value) => ({ ...value, slides: value.slides.filter((_, slideIndex) => slideIndex !== index) })); setActive((value) => Math.min(value, post.slides.length - 2)) }
  const activeSlide = post.slides[active]
  return <main className="min-h-screen bg-[#09080d] px-4 py-10 text-[#f4f0e6] sm:px-8"><div className="mx-auto max-w-7xl"><header className="mb-9 max-w-3xl"><p className="font-mono text-xs tracking-[0.24em] text-[#d4a017]">RAISE AWARENESS · STEWARD TOOL</p><h1 className="mt-2 font-[family-name:var(--bars-font-display)] text-4xl font-bold tracking-tight">Instagram practice frame</h1><p className="mt-3 text-base leading-7 text-zinc-400">Paste approved teaching copy, shape the emotional transition, and compile a shareable carousel. Nothing is generated, saved, or published here.</p></header><div className="grid gap-8 xl:grid-cols-[440px_minmax(0,1fr)]"><section className="space-y-5 rounded-2xl border border-zinc-800 bg-[#111018] p-5"><label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">Series label<input value={post.series} maxLength={26} onChange={(event) => setPost({ ...post, series: event.target.value })} className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#09080d] px-3 py-2 text-sm text-white outline-none focus:border-[#d4a017]" /></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold uppercase tracking-widest text-zinc-400">From<select value={post.from} onChange={(event) => setPost({ ...post, from: event.target.value as Channel })} className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#09080d] px-3 py-2 text-sm text-white">{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label><label className="text-xs font-bold uppercase tracking-widest text-zinc-400">To<select value={post.to} onChange={(event) => setPost({ ...post, to: event.target.value as Channel })} className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#09080d] px-3 py-2 text-sm text-white">{channels.map((channel) => <option key={channel}>{channel}</option>)}</select></label></div><label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">Caption<textarea value={post.caption} onChange={(event) => setPost({ ...post, caption: event.target.value })} rows={3} className="mt-2 w-full resize-y rounded-lg border border-zinc-700 bg-[#09080d] px-3 py-2 text-sm leading-5 text-white outline-none focus:border-[#d4a017]" /></label><div className="flex items-center justify-between border-t border-zinc-800 pt-5"><h2 className="text-sm font-bold">Slides <span className="font-normal text-zinc-500">{post.slides.length}/8</span></h2><button type="button" disabled={post.slides.length >= 8} onClick={addSlide} className="rounded-lg border border-[#d4a017]/60 px-3 py-1.5 text-xs font-bold text-[#e7c98a] disabled:opacity-35">Add slide</button></div><div className="space-y-4">{post.slides.map((slide, index) => <fieldset key={index} className={`rounded-xl border p-3 ${active === index ? 'border-[#d4a017]/80 bg-[#17141b]' : 'border-zinc-800 bg-[#0c0b11]'}`}><div className="mb-3 flex items-center justify-between gap-2"><button type="button" onClick={() => setActive(index)} className="text-left text-xs font-bold uppercase tracking-widest text-[#e7c98a]">Slide {index + 1}</button><div className="flex items-center gap-2"><select value={slide.kind} onChange={(event) => editSlide(index, { kind: event.target.value as SlideKind })} className="rounded bg-[#09080d] px-1.5 py-1 text-xs text-zinc-300"><option value="hook">Hook</option><option value="body">Body</option><option value="steps">Steps</option><option value="cta">CTA</option></select><button type="button" aria-label={`Remove slide ${index + 1}`} disabled={post.slides.length <= 5} onClick={() => removeSlide(index)} className="text-xs text-zinc-500 hover:text-red-300 disabled:opacity-30">Remove</button></div></div><div className="mb-3 grid grid-cols-3 gap-2 text-xs"><label className="text-zinc-500">Type<select value={slide.fontRole} onChange={(event) => editSlide(index, { fontRole: event.target.value as Slide['fontRole'] })} className="mt-1 w-full rounded border border-zinc-800 bg-[#09080d] p-1.5 text-zinc-200"><option value="display">Display</option><option value="body">Body</option><option value="mono">Mono</option></select></label><label className="text-zinc-500">Scale<select value={slide.scale} onChange={(event) => editSlide(index, { scale: event.target.value as Slide['scale'] })} className="mt-1 w-full rounded border border-zinc-800 bg-[#09080d] p-1.5 text-zinc-200"><option value="compact">Compact</option><option value="standard">Standard</option><option value="large">Large</option></select></label><div className="text-zinc-500">Align<div className="mt-1 flex overflow-hidden rounded border border-zinc-800"><button type="button" onClick={() => editSlide(index, { alignment: 'left' })} className={`flex-1 p-1.5 ${slide.alignment === 'left' ? 'bg-[#d4a017] text-[#160f05]' : 'bg-[#09080d] text-zinc-300'}`}>Left</button><button type="button" onClick={() => editSlide(index, { alignment: 'center' })} className={`flex-1 border-l border-zinc-800 p-1.5 ${slide.alignment === 'center' ? 'bg-[#d4a017] text-[#160f05]' : 'bg-[#09080d] text-zinc-300'}`}>Center</button></div></div></div><div className="space-y-2">{slide.runs.map((run, runIndex) => <div key={runIndex} className="rounded-md border border-zinc-800 bg-[#09080d] p-2"><textarea aria-label={`Text run ${runIndex + 1}`} value={run.text} onFocus={() => setActive(index)} onChange={(event) => editRun(index, runIndex, { text: event.target.value })} rows={2} className="w-full resize-y bg-transparent text-sm leading-5 text-white outline-none" /><div className="mt-2 flex flex-wrap items-center gap-1"><button type="button" aria-pressed={run.bold} onClick={() => editRun(index, runIndex, { bold: !run.bold })} className={`rounded px-2 py-1 text-xs font-bold ${run.bold ? 'bg-[#d4a017] text-[#160f05]' : 'bg-zinc-800 text-zinc-300'}`}>B</button><button type="button" aria-pressed={run.italic} onClick={() => editRun(index, runIndex, { italic: !run.italic })} className={`rounded px-2 py-1 text-xs italic ${run.italic ? 'bg-[#d4a017] text-[#160f05]' : 'bg-zinc-800 text-zinc-300'}`}>I</button><select aria-label={`Color for text run ${runIndex + 1}`} value={run.color ?? 'ink'} onChange={(event) => editRun(index, runIndex, { color: event.target.value as TextColor })} className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200">{(Object.keys(colorLabels) as TextColor[]).map((color) => <option key={color} value={color}>{colorLabels[color]}</option>)}</select><button type="button" disabled={slide.runs.length <= 1} onClick={() => editSlide(index, { runs: slide.runs.filter((_, itemIndex) => itemIndex !== runIndex) })} className="ml-auto text-xs text-zinc-500 hover:text-red-300 disabled:opacity-30">Remove run</button></div></div>)}</div><button type="button" onClick={() => editSlide(index, { runs: [...slide.runs, { text: 'New phrase', color: 'accent' }] })} className="mt-2 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300">+ Add text run</button><input value={slide.ground} onFocus={() => setActive(index)} onChange={(event) => editSlide(index, { ground: event.target.value })} placeholder="◇ Grounding line" className="mt-3 w-full rounded-md border border-zinc-800 bg-[#09080d] p-2 text-xs text-zinc-300 outline-none focus:border-[#d4a017]" /></fieldset>)}</div></section><section className="min-w-0"><div className="mx-auto max-w-[680px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#111018] shadow-2xl"><div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 text-xs text-zinc-400"><span className="font-bold text-zinc-200">@masteringallyship</span><span>{active + 1} / {post.slides.length}</span></div><SlideArt post={post} slide={activeSlide} index={active} svgRef={(node) => { svgRefs.current[active] = node }} /><div className="flex items-center justify-between gap-3 p-4"><button type="button" onClick={() => setActive((active - 1 + post.slides.length) % post.slides.length)} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm">← Previous</button><div className="flex gap-1.5">{post.slides.map((_, index) => <button type="button" key={index} aria-label={`Preview slide ${index + 1}`} onClick={() => setActive(index)} className={`h-1.5 w-1.5 rounded-full ${active === index ? 'bg-[#4d8cff]' : 'bg-zinc-700'}`} />)}</div><button type="button" onClick={() => setActive((active + 1) % post.slides.length)} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm">Next →</button></div><p className="border-t border-zinc-800 px-4 py-3 text-sm leading-6 text-zinc-400">{post.caption}</p></div><div className="mx-auto mt-5 flex max-w-[680px] flex-wrap items-center gap-3"><button type="button" onClick={() => download(active)} className="rounded-lg bg-[#d4a017] px-4 py-2.5 text-sm font-bold text-[#160f05]">Download slide {active + 1} PNG</button><button type="button" onClick={downloadAll} className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-200">Download all PNGs</button>{notice && <p className="text-sm text-zinc-400">{notice}</p>}</div><div className="hidden" aria-hidden="true">{post.slides.map((slide, index) => <SlideArt key={index} post={post} slide={slide} index={index} svgRef={(node) => { svgRefs.current[index] = node }} />)}</div></section></div></div></main>
}
