
import * as THREE from 'three';

const TREES = [];           // keep references to trees
const TREE_HIT_TARGETS = []; // meshes we raycast against (trunks + crowns)

function createTree(x, z, trunkHeight=4, trunkRadius=0.35, crownRadius=1.3) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // trunk: positioned so its base sits at y=0
    const trunkGeo = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.1, trunkHeight, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.position.y = trunkHeight / 2;

    // crown
    const crownGeo = new THREE.SphereGeometry(crownRadius, 16, 12);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.castShadow = true;
    crown.position.y = trunkHeight + crownRadius * 0.7;

    group.add(trunk, crown);

    // userData for gameplay state
    group.userData = {
        trunkRadius,
        type: 'tree',
        health: 3,           // hits required
        falling: false,
        fall: null,          // { t, duration, fromQuat, toQuat }
        dead: false
    };

    // link child->root for easy lookup after raycast
    trunk.userData.treeRoot = group;
    crown.userData.treeRoot = group;

    TREES.push(group);
    TREE_HIT_TARGETS.push(trunk, crown);
    return group;
}

const raycaster = new THREE.Raycaster();
const aimNDC = new THREE.Vector2(0, 0); // center of screen

function raycast(camera, mousex, mousey) {
    aimNDC.set((mousex/innerWidth)*2-1, -(mousey/innerHeight)*2+1);
    raycaster.setFromCamera(aimNDC, camera);
    const hits = raycaster.intersectObjects(TREE_HIT_TARGETS, false);
    if (!hits.length) return null;
    const hit = hits[0];
    return hit.object.userData.treeRoot || null;
}


const Y_UP = new THREE.Vector3(0,1,0);
const tmpDir = new THREE.Vector3();
const tmpAxis = new THREE.Vector3();

function startTreeFall(player, tree) {
    tmpDir.x = tree.position.x - player.mesh.position.x;
    tmpDir.z = tree.position.z - player.mesh.position.z;
    tmpDir.y = 0;
    if (tmpDir.lengthSq() < 1e-6) tmpDir.set(0,0,-1);
    tmpDir.normalize();

    // rotate toward -tmpDir or +tmpDir; pick whichever you prefer
    const fallDir = tmpDir.clone(); // falls forward relative to camera look

    // rotation axis is up x fallDir
    tmpAxis.crossVectors(Y_UP, fallDir).normalize();

    const fromQuat = tree.quaternion.clone();
    const toQuat = fromQuat.clone().multiply(
        new THREE.Quaternion().setFromAxisAngle(tmpAxis, Math.PI / 2) // 90 degrees
    );

    tree.userData.falling = true;
    tree.userData.fall = {
        t: 0,
        duration: 2, // seconds
        fromQuat,
        toQuat
    };
}

function updateFallingTrees(dt) {
  for (const tree of TREES) {
    if (!tree.userData.falling) continue;
    const f = tree.userData.fall;
    f.t = Math.min(1, f.t + dt / f.duration);
    tree.quaternion.slerpQuaternions(f.fromQuat, f.toQuat, f.t);

    // optional: slight forward slide as it falls
    // tree.position.addScaledVector(new THREE.Vector3().copy(tmpDir).normalize(), dt * 0.25);

    if (f.t >= 1) {
      tree.userData.falling = false;
      tree.userData.dead = true;

      // disable future hits
      tree.children.forEach(child => child.raycast = () => {});
      // or remove from TREE_HIT_TARGETS if you prefer:
      // for (const child of tree.children) {
      //   const i = TREE_HIT_TARGETS.indexOf(child);
      //   if (i >= 0) TREE_HIT_TARGETS.splice(i, 1);
      // }

      // TODO: spawn logs/loot, play sound, schedule despawn, etc.
    }
  }
}

export function addTrees(scene, count = 300, planeSize = 200) {
    const half = planeSize * 0.5 - 3
    for (let i = 0; i < count; i++) {
        const x = THREE.MathUtils.randFloat(-half, half);
        const z = THREE.MathUtils.randFloat(-half, half);

        var tree = createTree(x,z);
        scene.add(tree);
    }
    return {raycast, startTreeFall, updateFallingTrees};
}
