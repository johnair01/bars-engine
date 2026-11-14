import * as THREE from 'three'

/* Deterministic noise so the room renders identically every time. */
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20261027)

function surface(size, draw) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  draw(ctx, size)
  return c
}

function tex(canvas, repeat = 1, aniso = 8) {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  t.anisotropy = aniso
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* Shade a hex colour by a factor. Components must be split out of a hex
   string: rgb() clamps any value above 255, so passing a whole six-digit
   number as one component silently yields pure white. */
const shade = (hexColor, factor = 1) => {
  const n = parseInt(hexColor.slice(1), 16)
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  return `rgb(${clamp(((n >> 16) & 255) * factor)},${clamp(((n >> 8) & 255) * factor)},${clamp((n & 255) * factor)})`
}

/* ---------------------------------------------------------------- floor ---
   Circular plank floor: curved planks in concentric bands, a lighter
   inlaid cross, and dark banding where the rings meet. */
export function floorCanvas(size = 1400) {
  return surface(size, (ctx, s) => {
    const cx = s / 2
    const cy = s / 2
    const R = s / 2
    ctx.fillStyle = '#5a3a1c'
    ctx.fillRect(0, 0, s, s)

    const bands = [0.2, 0.36, 0.53, 0.7, 0.86, 1.0]
    for (let b = 0; b < bands.length; b++) {
      const rOut = bands[b] * R
      const rIn = (b === 0 ? 0 : bands[b - 1]) * R
      const arc = 2 * Math.PI * ((rIn + rOut) / 2)
      const segs = Math.max(8, Math.round(arc / (s * 0.16)))
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2
        const a1 = ((i + 1) / segs) * Math.PI * 2 - 0.006
        const tone = 0.85 + rnd() * 0.3
        ctx.beginPath()
        ctx.arc(cx, cy, Math.max(rOut - 1.5, 0), a0, a1)
        ctx.arc(cx, cy, Math.max(rIn, 0.5), a1, a0, true)
        ctx.closePath()
        ctx.fillStyle = shade('#6b4526', tone)
        ctx.fill()
        // grain inside each plank
        ctx.save()
        ctx.clip()
        ctx.strokeStyle = 'rgba(46,25,9,0.22)'
        ctx.lineWidth = 1.2
        for (let g = 0; g < 5; g++) {
          const rx = cx + Math.cos(a0) * (rIn + (rOut - rIn) * ((g + 0.5) / 5))
          const ry = cy + Math.sin(a0) * (rIn + (rOut - rIn) * ((g + 0.5) / 5))
          ctx.beginPath()
          ctx.moveTo(rx, ry)
          ctx.arc(cx, cy, rIn + (rOut - rIn) * ((g + 0.5) / 5), a0, a1)
          ctx.stroke()
        }
        ctx.restore()
      }
      // ring seam
      ctx.beginPath()
      ctx.arc(cx, cy, rOut, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(20,10,3,0.45)'
      ctx.lineWidth = s * 0.005
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, rOut - s * 0.006, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(120,82,44,0.2)'
      ctx.lineWidth = s * 0.004
      ctx.stroke()
    }

    // lighter inlaid cross + diagonals radiating from the centre
    ctx.strokeStyle = 'rgba(118,80,42,0.3)'
    ctx.lineCap = 'round'
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88)
      ctx.lineWidth = s * (i % 2 === 0 ? 0.012 : 0.007)
      ctx.stroke()
    }
    // centre medallion
    ctx.beginPath()
    ctx.arc(cx, cy, R * 0.135, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(76,50,26,0.45)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(38,20,6,0.6)'
    ctx.lineWidth = s * 0.006
    ctx.stroke()
  })
}

/* ---------------------------------------------------------------- walls ---
   Earth plaster with faint mottling and vertical tool streaks. */
export function plasterCanvas(size = 900) {
  return surface(size, (ctx, s) => {
    ctx.fillStyle = '#e4d1ad'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 5200; i++) {
      const x = rnd() * s
      const y = rnd() * s
      const r = 6 + rnd() * 46
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      const warm = rnd() > 0.42
      g.addColorStop(0, warm ? 'rgba(198,162,118,0.07)' : 'rgba(152,124,92,0.06)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = 'rgba(140,112,80,0.07)'
    for (let i = 0; i < 220; i++) {
      const x = rnd() * s
      ctx.lineWidth = 1 + rnd() * 3
      ctx.beginPath()
      ctx.moveTo(x, rnd() * s)
      ctx.lineTo(x + (rnd() - 0.5) * 14, rnd() * s)
      ctx.stroke()
    }
  })
}

/* --------------------------------------------------------------- timber --- */
export function timberCanvas(size = 700) {
  return surface(size, (ctx, s) => {
    ctx.fillStyle = '#8a5c2e'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 2000; i++) {
      const y = rnd() * s
      const tone = 0.8 + rnd() * 0.42
      ctx.strokeStyle = `rgba(${(0x8c * tone) | 0},${(0x60 * tone) | 0},${(0x32 * tone) | 0},0.45)`
      ctx.lineWidth = 0.6 + rnd() * 2.4
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x <= s; x += 26) {
        ctx.lineTo(x, y + Math.sin(x * 0.012 + i) * (1 + rnd() * 2.5))
      }
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(25,12,4,0.25)'
    ctx.fillRect(0, 0, s * 0.01, s)
  })
}

/* ----------------------------------------------------------------- moss --- */
export function mossCanvas(size = 600) {
  return surface(size, (ctx, s) => {
    ctx.fillStyle = '#33421f'
    ctx.fillRect(0, 0, s, s)
    const greens = ['#41582a', '#4c6430', '#2b3a1a', '#59703a', '#36471f']
    for (let i = 0; i < 5200; i++) {
      ctx.fillStyle = greens[(rnd() * greens.length) | 0]
      ctx.globalAlpha = 0.3 + rnd() * 0.4
      const r = 1.5 + rnd() * 7
      ctx.beginPath()
      ctx.arc(rnd() * s, rnd() * s, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  })
}

/* ------------------------------------------------------ terracotta tiles --- */
export function paverCanvas(size = 800) {
  return surface(size, (ctx, s) => {
    const n = 6
    const cell = s / n
    ctx.fillStyle = '#4a3527'
    ctx.fillRect(0, 0, s, s)
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const tone = 0.86 + rnd() * 0.3
        ctx.fillStyle = shade('#7a5340', tone)
        ctx.fillRect(i * cell + 2, j * cell + 2, cell - 4, cell - 4)
        ctx.strokeStyle = 'rgba(40,24,16,0.18)'
        ctx.lineWidth = 1
        for (let k = 0; k < 6; k++) {
          ctx.beginPath()
          ctx.moveTo(i * cell + 4, j * cell + rnd() * cell)
          ctx.lineTo(i * cell + cell - 4, j * cell + rnd() * cell)
          ctx.stroke()
        }
      }
    }
  })
}

/* ------------------------------------------------------------ glow mask --- */
export function glowCanvas(size = 256) {
  return surface(size, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0, 'rgba(255,226,182,0.85)')
    g.addColorStop(0.45, 'rgba(255,180,100,0.42)')
    g.addColorStop(1, 'rgba(255,150,60,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  })
}

export function buildMaterials() {
  const floorMap = tex(floorCanvas(), 1, 16)
  const plasterMap = tex(plasterCanvas(), 3, 8)
  const timberMap = tex(timberCanvas(), 2, 8)
  const rootMap = tex(timberCanvas(512), 3, 8)
  const mossMap = tex(mossCanvas(), 6, 8)
  const paverMap = tex(paverCanvas(), 8, 16)

  return {
    maps: { floorMap, plasterMap, timberMap, rootMap, mossMap, paverMap },
    floor: new THREE.MeshStandardMaterial({ map: floorMap, roughness: 0.62, metalness: 0.02 }),
    apron: new THREE.MeshStandardMaterial({ map: paverMap, roughness: 0.9 }),
    wall: new THREE.MeshStandardMaterial({
      map: plasterMap,
      color: 0xefe0c2,
      roughness: 0.96,
      side: THREE.BackSide,
    }),
    wallTwoSided: new THREE.MeshStandardMaterial({
      map: plasterMap,
      color: 0xefe0c2,
      roughness: 0.96,
      side: THREE.DoubleSide,
    }),
    tunnel: new THREE.MeshStandardMaterial({
      map: plasterMap,
      color: 0x9a7c58,
      roughness: 0.95,
      side: THREE.DoubleSide,
      vertexColors: true,
    }),
    recess: new THREE.MeshStandardMaterial({ map: plasterMap, color: 0xbfa27c, roughness: 0.97 }),
    recessLit: new THREE.MeshStandardMaterial({
      map: plasterMap,
      color: 0xe9cda6,
      roughness: 0.9,
      emissive: 0x1a0c03,
      emissiveIntensity: 1,
    }),
    timber: new THREE.MeshStandardMaterial({ map: timberMap, color: 0xd3a468, roughness: 0.78 }),
    root: new THREE.MeshStandardMaterial({ map: rootMap, color: 0xbb8a52, roughness: 0.82 }),
    rootDark: new THREE.MeshStandardMaterial({ map: rootMap, color: 0x8c6238, roughness: 0.85 }),
    moss: new THREE.MeshStandardMaterial({ map: mossMap, color: 0x9aa87e, roughness: 0.95 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xb8ae9c, roughness: 0.72 }),
    paleStone: new THREE.MeshStandardMaterial({ color: 0xd6cebc, roughness: 0.55 }),
    clay: new THREE.MeshStandardMaterial({ color: 0x9d8365, roughness: 0.8 }),
    shade: new THREE.MeshStandardMaterial({
      color: 0xffd79a,
      emissive: 0xffb257,
      emissiveIntensity: 1.5,
      roughness: 1,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    }),
    lampGlow: new THREE.MeshBasicMaterial({
      map: tex(glowCanvas(), 1, 2),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    ceilingGlow: new THREE.MeshBasicMaterial({
      color: 0xff8c3a,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    coveLight: new THREE.MeshBasicMaterial({ color: 0xffb877 }),
    banner: new THREE.MeshStandardMaterial({
      color: 0x2f8b90,
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
    water: new THREE.MeshStandardMaterial({
      color: 0xbfe6e4,
      emissive: 0x6fd2d8,
      emissiveIntensity: 0.9,
      roughness: 0.22,
      metalness: 0.1,
    }),
    corridorGlow: new THREE.MeshBasicMaterial({
      color: 0xff9a3c,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  }
}
