// Round 11: the anchor's air. Wendell called the round 4 courtyard painting "perfect"; round 10's flat sky, flat sand
// and white noon light were the farthest thing from it (council/tools/ref_distance.py scores the gap). This module
// gives the world the painting's low warm sun, a sky that runs peach at the horizon to cool blue overhead, ranges of
// mountains fading into haze, and a sea of cloud below the summit.
import * as THREE from 'three';
import { ridge, cloudTex } from './kit.js';

// The sun sits low over the far ranges, behind and to the left of the founder's hall as the great court faces it.
// Round 13b: swung about 18 degrees left of the court's axis and raised to about 15 degrees, so from the anchor view the
// sun stands in the sky left of the crag over the ranges, where the painting has it (before, it hid behind the crag).
export const SUN_DIR = new THREE.Vector3(-0.877, 0.268, -0.478).normalize();

export function atmosphere(S, R, { sun, hemi, fog }) {
  R.toneMappingExposure = 1.12;
  sun.color.set('#ffc98a'); sun.intensity = 3.1;
  hemi.color.set('#ffe6c4'); hemi.groundColor.set('#5a4a3c'); hemi.intensity = 1.5;
  fog.color.set('#e9cfae'); fog.near = 90; fog.far = 1300;
  S.background = null;

  // sky dome: a gradient with a glow round the sun
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sunDir: { value: SUN_DIR } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position + cameraPosition, 1.0); }',
    fragmentShader: `uniform vec3 sunDir; varying vec3 vD;
      void main(){ float h = clamp(vD.y, -0.2, 1.0);
        vec3 hor = vec3(0.98, 0.80, 0.60), mid = vec3(0.86, 0.80, 0.74), top = vec3(0.50, 0.62, 0.76);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.75, h));
        float s = max(dot(normalize(vD), sunDir), 0.0);
        c += vec3(1.0, 0.78, 0.45) * (pow(s, 12.0) * 0.16 + pow(s, 90.0) * 0.35) + vec3(1.0, 0.95, 0.85) * smoothstep(0.9985, 0.9995, s);
        if (h < 0.0) c = mix(c, vec3(0.93, 0.86, 0.78), smoothstep(0.0, -0.1, h));
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false; S.add(sky);

  // the ranges: rings of ridge cards, nearer rings darker and bluer, farther ones paler into the haze
  const ranges = new THREE.Group(); S.add(ranges);
  // Round 13b: about twice as tall, so from the great court they rise over the ring's green shoulders into the sky as the
  // painting's do (at round 13 their tops sat at eye height behind the ring and barely showed).
  const layers = [[1100, 520, '#5d6e7c', 0.95, 0.42], [1500, 640, '#7d8c98', 0.85, 0.34], [1950, 760, '#a7b0b6', 0.75, 0.28], [2350, 880, '#c9c4bd', 0.6, 0.22]];
  layers.forEach(([r, h, col, a, rough], li) => {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const th = (i + li * 0.37) / n * Math.PI * 2, w = 2 * Math.PI * r / n * 1.18;
      const card = ridge(w, h, 101 + li * 31 + i * 7, col, a, rough);
      card.material.fog = false; card.renderOrder = -9 + li * -1;
      card.position.set(24 + Math.sin(th) * r, -120 + h / 2, -9 + Math.cos(th) * r);
      card.lookAt(24, card.position.y, -9);
      ranges.add(card);
    }
  });

  // the sea of cloud below, lit warm on its sunward side
  const cloud = cloudTex(7, 160, 0.6, 1024, 1024); cloud.wrapS = cloud.wrapT = THREE.RepeatWrapping; cloud.repeat.set(6, 6);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(5200, 5200), new THREE.MeshBasicMaterial({ color: '#f4e2c8', map: cloud, transparent: true, opacity: 0.95, fog: false, depthWrite: false }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -96; S.add(sea);
  return { sky, ranges, sea };
}

// Keep the sun low and the shadow box on whoever the camera follows.
export function placeSun(sun, at) {
  sun.position.set(at.x + SUN_DIR.x * 220, at.y + SUN_DIR.y * 220, at.z + SUN_DIR.z * 220);
  sun.target.position.copy(at);
}
