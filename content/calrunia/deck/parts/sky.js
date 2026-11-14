// Part: the dusk-to-dawn sky dome, its stars and the lights. Taken whole from the living ship Still B (Six-faces-council/council/callsheets/stills/2026-10-25-ship-v1/make/still-b-scene.js, lines 37-62).
PART("sky", "The sky and the light", "Still B, reused whole", () => {

// ---- sky dome with dusk gradient ----
{
  const g = new THREE.SphereGeometry(1500, 32, 16);
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {}, vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vp; void main(){ float h = vp.y;
      vec3 top = vec3(0.16,0.13,0.33), mid = vec3(0.55,0.36,0.58), low = vec3(0.98,0.68,0.50), hor = vec3(1.0,0.82,0.62);
      vec3 c = h > 0.25 ? mix(mid, top, smoothstep(0.25, 0.7, h)) : (h > 0.04 ? mix(low, mid, smoothstep(0.04, 0.25, h)) : mix(vec3(0.78,0.58,0.68), hor, smoothstep(-0.2, 0.04, h)));
      float sun = pow(max(dot(vp, normalize(vec3(-0.35,0.06,-1.0))),0.), 60.); c += vec3(1.,0.8,0.55)*sun*0.9;
      gl_FragColor = vec4(c,1.); }` });
  into.add(new THREE.Mesh(g, m));
  // stars
  const sg = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 400; i++) { const th = R(0, Math.PI * 2), ph = R(0.35, 1.4); sp.push(1400 * Math.cos(ph) * Math.cos(th), 1400 * Math.sin(ph), 1400 * Math.cos(ph) * Math.sin(th)); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  into.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff4e0, size: 2.5, sizeAttenuation: false, fog: false })));
}

// ---- lights ----
into.add(new THREE.HemisphereLight(0xb9a0d8, 0x3a2848, 0.9));
const sun = new THREE.DirectionalLight(0xffc48a, 2.6);
sun.position.set(-60, 30, -120); sun.target.position.set(0, 0, -18);
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 400 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005;
into.add(sun, sun.target);
});
