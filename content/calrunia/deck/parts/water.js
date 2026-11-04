// Part: the sea and its fog banks. From money gate round 3 (Six-faces-council council/callsheets/stills/2026-10-31-money-gate-3/make/deck.js, the water section), the version his note asked for
// (mb-gate-look-2: "smoother and more natural"): one plane, one small shader, soft fog sprites. New here: a time uniform
// so the swells drift, and fog banks that thin or gather with the fog meter (FR-004).
PART("water", "The sea and the fog", "Round 3's water, with drift and the fog meter added", () => {
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { uNear: { value: 14 }, uFar: { value: 95 }, uFog: { value: new THREE.Color(0xd9a9b8) }, uT: { value: 0 },
      uDeep: { value: new THREE.Color(0x6a4676) }, uShallow: { value: new THREE.Color(0xc492b2) }, uSky: { value: new THREE.Color(0xf4dcd6) },
      uGlint: { value: new THREE.Color(0xfff0d8) }, uCam: { value: camera.position } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      uniform float uNear, uFar, uT; uniform vec3 uFog, uDeep, uShallow, uSky, uGlint, uCam; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec2 p = vW.xz + vec2(uT * 0.25, uT * 0.6);
        float sw = n(p * vec2(0.035, 0.09)) * 0.65 + n(p * vec2(0.11, 0.26) + 7.0 + uT * 0.05) * 0.35;
        float d = length(vW - uCam);
        float far = smoothstep(8.0, 160.0, d);
        vec3 col = mix(uDeep, uShallow, 0.35 + 0.65 * far);
        col = mix(col, uSky, smoothstep(60.0, 260.0, d) * 0.7);
        col += (sw - 0.5) * 0.22 * (1.0 - far * 0.6);
        col += smoothstep(0.55, 0.95, n(p * vec2(0.05, 0.7) + sw * 2.0)) * 0.07 * (1.0 - far);
        float lane = exp(-pow((vW.x + 6.0 + vW.z * 0.04) / (6.0 + d * 0.12), 2.0));
        float spark = smoothstep(0.62, 0.9, n(p * vec2(0.5, 1.4) + sw * 3.0));
        col = mix(col, uGlint, lane * (0.3 + 0.6 * spark) * smoothstep(6.0, 30.0, d));
        float hull = smoothstep(9.5, 7.6, abs(vW.x)) * smoothstep(18.0, 10.0, abs(vW.z + 1.0));
        col = mix(col, vec3(1.0, 0.94, 0.95), hull * 0.25 * smoothstep(0.35, 0.7, sw));
        float f = smoothstep(uNear, uFar, d);
        gl_FragColor = vec4(mix(col, uFog, f * 0.6), 1.0);
      }`,
  });
  const water = add(new THREE.PlaneGeometry(3000, 3000), waterMat, 0, -3.2, -300, { rx: -Math.PI / 2, noShadow: true });
  water.receiveShadow = false;
  const banks = [];
  for (let i = 0; i < 34; i++) {
    const x = R(-90, 90), z = R(-150, -40), s = R(10, 26);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: i % 3 ? 0xf2d6da : 0xf8e4d8, transparent: true, opacity: 0.4, depthWrite: false }));
    sp.position.set(x, -2.4 + s * 0.04, z); sp.scale.set(s * 1.6, s * 0.32, 1); into.add(sp); banks.push({ sp, lane: x < -4 && x > -28 && z > -70, k: i / 34 });
  }
  return { update(st) {
    waterMat.uniforms.uT.value = st.t;
    const f = st.fog / TH.FOG_MAX; // 0 clear .. 1 thick
    scene.fog.near = 14 + (1 - f) * 30; scene.fog.far = 95 + (1 - f) * 320;
    waterMat.uniforms.uNear.value = scene.fog.near; waterMat.uniforms.uFar.value = scene.fog.far;
    banks.forEach((b) => { b.sp.visible = b.k < 0.15 + f * 0.85 && !(st.sending != null && b.lane); b.sp.position.x += Math.sin(st.t * 0.05 + b.k * 9) * 0.004; });
  } };
});
