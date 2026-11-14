import * as THREE from 'three'
import { buildMaterials } from './materials.js'

const TAU = Math.PI * 2
const D2R = Math.PI / 180

export const ROOM = {
  radius: 6.0,
  woodRadius: 4.72,
  wallTop: 3.22,
  apex: 4.72,
}

/* Doorway: an angular gap cut out of the room shell. */
const DOOR = { deg: 195, halfAngle: 12.5 }

/* Angle 0 faces +Z (where the viewer stands). */
function polar(deg, radius, y) {
  const a = deg * D2R
  return new THREE.Vector3(Math.sin(a) * radius, y, Math.cos(a) * radius)
}

/* Room shell profile: wall rising and curving into a flattened dome. */
const PROFILE = [
  [6.0, 0.0],
  [6.0, 1.5],
  [5.98, 2.2],
  [5.88, 2.8],
  [5.66, 3.22],
  [5.22, 3.72],
  [4.52, 4.14],
  [3.5, 4.44],
  [2.2, 4.62],
  [0.95, 4.7],
  [0.0, 4.72],
]

/* Sample the shell profile: t in 0..1 from floor to apex. */
function shellPoint(t) {
  const seg = t * (PROFILE.length - 1)
  const i = Math.min(PROFILE.length - 2, Math.floor(seg))
  const f = seg - i
  return {
    r: PROFILE[i][0] + (PROFILE[i + 1][0] - PROFILE[i][0]) * f,
    y: PROFILE[i][1] + (PROFILE[i + 1][1] - PROFILE[i][1]) * f,
  }
}

/* Invert the profile: which t sits at a given height. */
function tAtY(y) {
  for (let i = PROFILE.length - 2; i >= 0; i--) {
    const y0 = PROFILE[i][1]
    const y1 = PROFILE[i + 1][1]
    if (y >= y0 - 1e-6 && y <= y1 + 1e-6) {
      const f = y1 > y0 ? (y - y0) / (y1 - y0) : 0
      return (i + f) / (PROFILE.length - 1)
    }
  }
  return y < 0 ? 0 : 1
}

function parametricGrid(cols, rows, fn) {
  const pos = []
  const uv = []
  const idx = []
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const u = i / cols
      const v = j / rows
      const [x, y, z] = fn(u, v)
      pos.push(x, y, z)
      uv.push(u, v)
    }
  }
  const w = cols + 1
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * w + i
      const b = a + 1
      const c = a + w
      const d = c + 1
      idx.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/* Arched opening shape: straight jambs rising to a semicircular head. */
function archShape(w, h) {
  const s = new THREE.Shape()
  const hw = w / 2
  const spring = Math.max(h - hw, 0.1)
  s.moveTo(-hw, 0)
  s.lineTo(-hw, spring)
  s.absarc(0, spring, hw, Math.PI, 0, true)
  s.lineTo(hw, 0)
  s.lineTo(-hw, 0)
  return s
}

function archRing(w, h, thickness) {
  const outer = archShape(w + thickness * 2, h + thickness)
  outer.holes.push(archShape(w, h))
  return new THREE.ExtrudeGeometry(outer, { depth: thickness * 1.1, bevelEnabled: false })
}

/* Walk the outline of an arch (jambs, head, floor) as one closed loop. */
function archOutline(hw, spring, v) {
  const arc = Math.PI * hw
  const floorW = hw * 2
  const total = spring * 2 + arc + floorW
  const f1 = spring / total
  const f2 = (spring + arc) / total
  const f3 = (spring * 2 + arc) / total
  if (v < f1) return [-hw, (v / f1) * spring]
  if (v < f2) {
    const a = Math.PI * (1 - (v - f1) / (f2 - f1))
    return [Math.cos(a) * hw, spring + Math.sin(a) * hw]
  }
  if (v < f3) return [hw, spring * (1 - (v - f2) / (f3 - f2))]
  return [hw - ((v - f3) / (1 - f3)) * hw * 2, 0]
}

/* =============================================================== the room == */
export function buildDojo(scene) {
  const M = buildMaterials()
  const group = new THREE.Group()
  scene.add(group)

  let meshCount = 0
  const add = (mesh, cast = false, receive = false, name = '') => {
    mesh.castShadow = cast
    mesh.receiveShadow = receive
    if (name) mesh.name = name
    group.add(mesh)
    meshCount += 1
    return mesh
  }

  /* ------------------------------------------------------------- shell --- */
  const shellPoints = PROFILE.map(([r, y]) => new THREE.Vector2(r, y))
  const shell = new THREE.Mesh(
    new THREE.LatheGeometry(
      shellPoints,
      144,
      (DOOR.deg + DOOR.halfAngle) * D2R,
      (360 - DOOR.halfAngle * 2) * D2R
    ),
    M.wall
  )
  add(shell, false, true, 'shell')

  /* Terracotta apron around the wood floor. */
  const apron = new THREE.Mesh(
    new THREE.RingGeometry(ROOM.woodRadius, ROOM.radius + 0.6, 128, 1),
    M.apron
  )
  apron.rotation.x = -Math.PI / 2
  apron.position.y = 0.002
  add(apron, false, true, 'apron')

  /* ------------------------------------------------------------ floor --- */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(ROOM.woodRadius, 128), M.floor)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0.012
  add(floor, false, true, 'floor')

  /* ----------------------------------------------------- moss at base --- */
  const mossRing = new THREE.Mesh(new THREE.TorusGeometry(5.72, 0.3, 8, 100), M.moss)
  mossRing.rotation.x = -Math.PI / 2
  mossRing.scale.set(1, 1, 0.5)
  mossRing.position.y = 0.12
  add(mossRing, false, true, 'moss-ring')

  for (let i = 0; i < 14; i++) {
    const a = i * 25.7 + 6
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.28 + (i % 3) * 0.08, 12), M.moss)
    patch.rotation.x = -Math.PI / 2
    patch.position.copy(polar(a, 5.62, 0.02))
    patch.rotation.z = a
    add(patch, false, true, 'moss-patch')
  }

  /* ------------------------------------------------- root lattice shell --- */
  // Ribs sit between the niches and the doorway so nothing crosses an opening.
  const ribAngles = [30, 75, 120, 165, 210, 255, 300, 345]

  for (const deg of ribAngles) {
    const pts = []
    const steps = 24
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const { r, y } = shellPoint(t)
      const flare = t < 0.12 ? 1 + (0.12 - t) * 1.1 : 1
      const sway = Math.sin(t * 3.1 + deg * D2R) * 0.14
      pts.push(polar(deg + sway * 11, Math.max(r - 0.3, 0.02) * flare + sway, y))
    }
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.2, 10, false),
      M.root
    )
    add(tube, true, false, 'root-rib')

    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), M.rootDark)
    knot.position.copy(polar(deg, 5.88, 0.16))
    knot.scale.set(1, 0.7, 1)
    add(knot, true, false, 'root-knot')
  }

  // Heavy root beam at the wall/ceiling junction.
  const beam = new THREE.Mesh(new THREE.TorusGeometry(5.66, 0.2, 10, 128), M.rootDark)
  beam.rotation.x = -Math.PI / 2
  beam.position.y = 3.22
  add(beam, true, false, 'root-beam')

  // Glowing cove where the wall turns upward.
  const cove = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.055, 8, 128), M.coveLight)
  cove.rotation.x = -Math.PI / 2
  cove.position.y = 3.34
  add(cove, false, false, 'cove-light')

  // Concentric cross-rings of root in the dome.
  for (const [r, y, tube] of [
    [4.32, 4.2, 0.13],
    [2.85, 4.5, 0.1],
  ]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 96), M.root)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = y
    add(ring, true, false, 'dome-ring')
  }

  // Warm translucent panels set between the dome roots.
  for (let i = 0; i < ribAngles.length; i++) {
    const a0 = (ribAngles[i] + 5) * D2R
    let a1 = (ribAngles[(i + 1) % ribAngles.length] + 5) * D2R
    if (a1 <= a0) a1 += TAU
    const geo = parametricGrid(10, 12, (u, v) => {
      const t = 0.44 + v * 0.5
      const { r, y } = shellPoint(t)
      const rr = Math.max(r - 0.24, 0.05)
      const a = a0 + (a1 - a0) * u
      return [Math.sin(a) * rr, y, Math.cos(a) * rr]
    })
    add(new THREE.Mesh(geo, M.ceilingGlow), false, false, 'dome-panel')
  }

  /* ------------------------------------------------------------ niches --- */
  const lanternLights = []
  const nicheAngles = [60, 150, 240, 330]
  const propKinds = ['vase', 'stone', 'bowl', 'stone']

  nicheAngles.forEach((deg, idx) => {
    const n = new THREE.Group()
    n.position.copy(polar(deg, 5.86, 0))
    n.rotation.y = deg * D2R + Math.PI

    const w = 1.72
    const h = 2.12

    // dark rim behind, lit inner face in front of it, then the root surround
    const rim = new THREE.Mesh(new THREE.ShapeGeometry(archShape(w + 0.5, h + 0.34)), M.recess)
    rim.position.z = -0.115
    n.add(rim)

    const inner = new THREE.Mesh(new THREE.ShapeGeometry(archShape(w, h)), M.recessLit)
    inner.position.z = -0.08
    n.add(inner)

    const frame = new THREE.Mesh(archRing(w + 0.34, h + 0.24, 0.16), M.timber)
    frame.position.z = 0.1
    n.add(frame)

    const shelf = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.09, 0.34), M.timber)
    shelf.position.set(0, 0.86, -0.02)
    shelf.castShadow = true
    n.add(shelf)

    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 6), M.rootDark)
    chain.position.set(0, h - 0.2, 0.04)
    n.add(chain)

    const ly = h - 0.62
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.2, 6), M.rootDark)
    cap.position.set(0, ly + 0.28, 0.04)
    n.add(cap)

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.3), M.shade)
    body.position.set(0, ly, 0.04)
    n.add(body)

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.07, 6), M.timber)
    base.position.set(0, ly - 0.24, 0.04)
    n.add(base)

    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), M.lampGlow)
    halo.position.set(0, ly, 0.34)
    n.add(halo)

    const kind = propKinds[idx]
    if (kind === 'vase') {
      const profile = [
        new THREE.Vector2(0.02, 0),
        new THREE.Vector2(0.16, 0.03),
        new THREE.Vector2(0.22, 0.16),
        new THREE.Vector2(0.2, 0.3),
        new THREE.Vector2(0.12, 0.38),
        new THREE.Vector2(0.14, 0.44),
      ]
      const vase = new THREE.Mesh(new THREE.LatheGeometry(profile, 20), M.clay)
      vase.position.set(-0.32, 0.9, 0.02)
      vase.castShadow = true
      n.add(vase)
    } else if (kind === 'stone') {
      const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), M.stone)
      stone.position.set(0.3, 0.98, 0.02)
      stone.rotation.set(0.4, 0.7, 0.2)
      n.add(stone)
    } else {
      const bowl = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 16, 10, 0, TAU, 0, Math.PI / 2),
        M.stone
      )
      bowl.rotation.x = Math.PI
      bowl.position.set(-0.22, 1.04, 0.03)
      n.add(bowl)
    }

    const light = new THREE.PointLight(0xffb063, 4.6, 7.5, 2)
    light.position.set(0, ly, 0.5)
    n.add(light)
    lanternLights.push(light)

    group.add(n)
  })

  /* ----------------------------------------------------------- doorway --- */
  {
    const d = DOOR.deg * D2R
    const half = DOOR.halfAngle * D2R
    const hw = 1.275 // arch head radius
    const spring = 1.665 // where the arch begins to curve
    const archTop = (dx) => {
      const c = Math.min(Math.abs(dx), hw)
      return spring + Math.sqrt(Math.max(0, hw * hw - c * c))
    }

    // wall piece filling the slot above the arch head, following the shell curve
    const filler = new THREE.Mesh(
      parametricGrid(12, 12, (u, v) => {
        const phi = d - half + u * half * 2
        const dx = ROOM.radius * Math.sin(phi - d)
        const t0 = tAtY(archTop(dx))
        const t = t0 + (1 - t0) * v
        const { r, y } = shellPoint(t)
        return [Math.sin(phi) * r, y, Math.cos(phi) * r]
      }),
      M.wallTwoSided
    )
    add(filler, false, true, 'door-head-wall')

    // corridor: the arch cross-section swept straight back through the wall
    const tHW = 1.35
    const tSpring = 1.6
    const tunnelGeo = parametricGrid(12, 84, (u, v) => {
      const scale = 1 - 0.06 * u
      const [x, y] = archOutline(tHW, tSpring, v)
      return [x * scale, y * scale, -0.1 - u * 5.0]
    })

    // fade the corridor dark at the mouth and bright toward the far end, so the
    // opening reads as depth rather than a flat panel
    {
      const pos = tunnelGeo.attributes.position
      const colors = []
      for (let i = 0; i < pos.count; i++) {
        const depth = Math.min(1, Math.max(0, -pos.getZ(i) / 5.0))
        const c = 0.34 + depth * 0.85
        colors.push(c, c * 0.93, c * 0.82)
      }
      tunnelGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    }

    const tunnel = new THREE.Mesh(tunnelGeo, M.tunnel)
    tunnel.position.copy(polar(DOOR.deg, 5.9, 0))
    tunnel.rotation.y = d + Math.PI
    add(tunnel, false, false, 'corridor')

    const farGlow = new THREE.Mesh(
      new THREE.ShapeGeometry(archShape(2.4, 2.7)),
      M.corridorGlow
    )
    farGlow.position.set(0, 0, -0.1)
    const farGroup = new THREE.Group()
    farGroup.position.copy(polar(DOOR.deg, 5.9, 0))
    farGroup.rotation.y = d + Math.PI
    farGlow.position.z = -5.0
    farGroup.add(farGlow)
    group.add(farGroup)

    // root arch frame standing just inside the opening
    const framePts = []
    for (let i = 0; i <= 46; i++) {
      const f = i / 46
      let dx
      let y
      if (f < 0.24) {
        dx = -hw
        y = (f / 0.24) * spring
      } else if (f < 0.76) {
        const a = Math.PI * (1 - (f - 0.24) / 0.52)
        dx = Math.cos(a) * hw
        y = spring + Math.sin(a) * hw
      } else {
        dx = hw
        y = spring * (1 - (f - 0.76) / 0.24)
      }
      const phi = d + Math.asin(Math.max(-1, Math.min(1, dx / ROOM.radius)))
      framePts.push(polar((phi / D2R) * 1, 5.66, y))
    }
    const frameCurve = new THREE.CatmullRomCurve3(framePts)
    add(new THREE.Mesh(new THREE.TubeGeometry(frameCurve, 90, 0.16, 10, false), M.root), true)

    // stone threshold
    const sill = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.16, 0.62), M.stone)
    sill.position.copy(polar(DOOR.deg, 5.92, 0.08))
    sill.rotation.y = d + Math.PI
    add(sill, false, true, 'threshold')

    const corridorLight = new THREE.PointLight(0xffa04a, 3.5, 9, 2)
    corridorLight.position.copy(polar(DOOR.deg, 8.4, 1.35))
    scene.add(corridorLight)
  }

  /* ---------------------------------------------------- banner + bench --- */
  {
    const deg = 100
    const b = new THREE.Group()
    b.position.copy(polar(deg, 5.5, 0))
    b.rotation.y = deg * D2R + Math.PI

    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.5, 10), M.timber)
    rail.rotation.z = Math.PI / 2
    rail.position.set(0, 3.02, 0.06)
    b.add(rail)
    for (const x of [-1.22, 1.22]) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.3), M.rootDark)
      bracket.position.set(x, 3.02, 0.02)
      b.add(bracket)
    }

    const bw = 1.42
    const bh = 2.16
    const bannerGeo = parametricGrid(14, 20, (u, v) => {
      const bottom = Math.max(0, (v - 0.66) / 0.34)
      const taper = 1 - bottom * 0.9
      return [
        (u - 0.5) * bw * taper,
        -v * bh,
        0.16 + Math.sin(u * Math.PI * 2.4 + v * 1.2) * 0.055 * (0.4 + v) + v * 0.02,
      ]
    })
    const banner = new THREE.Mesh(bannerGeo, M.banner)
    banner.position.set(0, 3.0, 0)
    banner.castShadow = true
    b.add(banner)

    const bench = new THREE.Group()
    bench.position.set(-1.05, 0, 0.9)
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 0.52), M.timber)
    seat.position.y = 0.5
    seat.castShadow = true
    seat.receiveShadow = true
    bench.add(seat)
    for (const x of [-1.02, 1.02]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.44), M.timber)
      leg.position.set(x, 0.25, 0)
      leg.castShadow = true
      bench.add(leg)
    }
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.11, 0.42), M.banner)
    blanket.position.set(-0.62, 0.6, 0)
    blanket.rotation.z = 0.05
    blanket.castShadow = true
    bench.add(blanket)
    b.add(bench)

    group.add(b)
  }

  /* --------------------------------------------------- centre furniture --- */
  function stool(radius = 0.42, height = 0.52) {
    const s = new THREE.Group()
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.97, 0.1, 20), M.timber)
    seat.position.y = height
    seat.castShadow = true
    seat.receiveShadow = true
    s.add(seat)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.4
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, height, 8), M.timber)
      leg.position.set(Math.cos(a) * radius * 0.6, height / 2, Math.sin(a) * radius * 0.6)
      leg.rotation.z = Math.cos(a) * 0.12
      leg.rotation.x = -Math.sin(a) * 0.12
      leg.castShadow = true
      s.add(leg)
    }
    return s
  }

  for (let i = 0; i < 3; i++) {
    const st = stool(0.44, 0.52)
    st.position.copy(polar(i * 120 + 30, 1.08, 0))
    group.add(st)
  }

  const bowlProfile = [
    new THREE.Vector2(0.0, 0),
    new THREE.Vector2(0.3, 0.0),
    new THREE.Vector2(0.4, 0.06),
    new THREE.Vector2(0.46, 0.16),
    new THREE.Vector2(0.45, 0.24),
    new THREE.Vector2(0.4, 0.26),
    new THREE.Vector2(0.34, 0.22),
    new THREE.Vector2(0.34, 0.2),
  ]
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 40), M.paleStone)
  bowl.position.y = 0.02
  add(bowl, true, true, 'centre-bowl')

  const water = new THREE.Mesh(new THREE.CircleGeometry(0.33, 32), M.water)
  water.rotation.x = -Math.PI / 2
  water.position.y = 0.21
  add(water, false, false, 'bowl-water')

  /* ------------------------------------------------ foreground trunks --- */
  for (const deg of [-72, 72]) {
    const pts = []
    const steps = 18
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      // climb the shell and merge into the dome instead of stopping mid-air
      const { r, y } = shellPoint(t * 0.34)
      const flare = t < 0.18 ? 1 + (0.18 - t) * 0.9 : 1
      const rr = Math.max(r - 0.3, 0.05) * flare
      pts.push(polar(deg + Math.sin(t * 2.2) * 3, rr, y - 0.35 * (1 - t)))
    }
    const trunk = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.3, 20, false),
      M.root
    )
    add(trunk, true, false, 'foreground-trunk')

    const root = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.5, 10), M.root)
    root.position.copy(polar(deg, 5.5, 0.1))
    add(root, true, false, 'trunk-root')
  }

  /* ------------------------------------------------------------ lights --- */
  // hemisphere is weighted toward up-facing surfaces, which blows out the floor,
  // so keep it low and carry the general fill with a uniform ambient instead
  scene.add(new THREE.HemisphereLight(0xfff0d6, 0x33251a, 0.4))
  scene.add(new THREE.AmbientLight(0xffe9cf, 0.62))

  const key = new THREE.SpotLight(0xffc78a, 6, 20, 0.98, 0.7, 1.4)
  key.position.set(0.4, 4.5, 1.0)
  key.target.position.set(0, 0, -0.4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.bias = -0.0016
  scene.add(key)
  scene.add(key.target)

  const bannerAccent = new THREE.PointLight(0x63d0d8, 2.2, 8, 2)
  bannerAccent.position.copy(polar(100, 4.4, 2.9))
  scene.add(bannerAccent)

  scene.fog = new THREE.FogExp2(0x241809, 0.01)

  /* ------------------------------------------------------------- views --- */
  const views = [
    { label: 'View 1 — Threshold', pos: [0.0, 1.72, 7.6], target: [0, 1.2, -0.5], fov: 44 },
    { label: 'View 2 — Left quarter', pos: [-4.1, 1.42, 4.3], target: [0.6, 1.15, -1.1], fov: 48 },
    { label: 'View 3 — Right quarter', pos: [4.3, 1.52, 3.7], target: [-0.7, 1.15, -1.0], fov: 48 },
    { label: 'View 4 — Above the floor', pos: [3.0, 4.5, 6.6], target: [-0.2, 0.75, -0.5], fov: 52 },
  ]

  let triangles = 0
  group.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry
      triangles += g.index ? g.index.count / 3 : (g.attributes.position?.count || 0) / 3
    }
  })

  /* Walker bounds: where a first-person camera may stand. The doorway is the
     only way in or out, so the corridor is its own navigable strip. */
  const spawn = polar(DOOR.deg, 7.6, 0)
  const nav = {
    eyeHeight: 1.62,
    roomRadius: 5.35,
    // the stools ring at 1.08 m with a 0.44 m seat, so this clears the bowl
    centreRadius: 1.58,
    doorDeg: DOOR.deg,
    doorHalfAngleDeg: DOOR.halfAngle - 1.6,
    corridorEnd: 10.6,
    corridorHalfWidth: 1.12,
    spawn: [spawn.x, spawn.z],
    spawnYaw: DOOR.deg * D2R,
  }

  return {
    group,
    views,
    nav,
    stats: { meshes: meshCount, triangles: Math.round(triangles) },
    update(t) {
      for (let i = 0; i < lanternLights.length; i++) {
        lanternLights[i].intensity =
          4.6 + Math.sin(t * 2.1 + i * 1.9) * 0.5 + Math.sin(t * 5.3 + i) * 0.2
      }
      key.intensity = 6 + Math.sin(t * 1.3) * 0.3
      bannerAccent.intensity = 2.2 + Math.sin(t * 0.9 + 1) * 0.2
    },
  }
}
