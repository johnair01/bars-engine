// Reusable Calrunian jian family. No sword is activated in gameplay by this module.
// Pass a Three.js GLTFLoader from the caller's own Three.js version.
const MANIFEST_URL = "/calrunia/weapons/jian/manifest.json";
let catalogPromise;

export function jianCatalog() {
  if (!catalogPromise) catalogPromise = fetch(MANIFEST_URL).then(async response => {
    if (!response.ok) throw new Error(`jian catalog: HTTP ${response.status}`);
    const catalog = await response.json();
    if (catalog.schema !== "calrunia.jian_assets.v1") throw new Error("jian catalog schema mismatch");
    return catalog;
  }).catch(error => { catalogPromise = null; throw error; });
  return catalogPromise;
}

export async function loadJian(loader, nation) {
  if (!loader || typeof loader.loadAsync !== "function") throw new TypeError("pass a GLTFLoader");
  const catalog = await jianCatalog();
  const entry = catalog.variants[String(nation).toLowerCase()];
  if (!entry) throw new RangeError(`unknown jian nation: ${nation}`);
  const gltf = await loader.loadAsync(entry.model);
  const gripSocket = gltf.scene.getObjectByName("GripSocket");
  if (!gripSocket) throw new Error(`jian ${nation} is missing GripSocket`);
  return { scene: gltf.scene, gripSocket, inventoryIcon: entry.inventory_icon, metadata: entry };
}
