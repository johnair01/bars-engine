// The cave page's three.js (r128, window.THREE) as an ES module, for the Between's wardrobe.js, which does `import * as THREE
// from "three"`. dusk-figure.js maps "three" here with an import map before it imports the wardrobe.
const T = window.THREE;
export const { Bone, Box3, BufferAttribute, BufferGeometry, Color, ConeGeometry, DoubleSide, Group, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Skeleton, SkinnedMesh, SphereGeometry, Vector3, AnimationMixer, Euler } = T;
