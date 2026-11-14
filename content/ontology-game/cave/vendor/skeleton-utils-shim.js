// `import { clone } from "three/addons/utils/SkeletonUtils.js"` for the wardrobe: r128's SkeletonUtils (a plain script that
// puts itself on window.THREE) read as a module.
export const clone = (src) => window.THREE.SkeletonUtils.clone(src);
