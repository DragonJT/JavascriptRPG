import * as THREE from 'three';

export function addTrees(scene, count = 300, planeSize = 200) {
  const half = planeSize * 0.5 - 3;
  const MIN_H = 1.2, MAX_H = 3.5;
  const MIN_R = 0.12, MAX_R = 0.28;

  const trunkGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4f2a, roughness: 0.9 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  trunks.castShadow = true; trunks.receiveShadow = true;

  const leavesGeo = new THREE.SphereGeometry(1, 10, 10);
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.8, metalness: 0.1 });
  const leaves = new THREE.InstancedMesh(leavesGeo, leavesMat, count);
  leaves.castShadow = true; leaves.receiveShadow = true;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const x = THREE.MathUtils.randFloat(-half, half);
    const z = THREE.MathUtils.randFloat(-half, half);
    const h = THREE.MathUtils.randFloat(MIN_H, MAX_H);
    const r = THREE.MathUtils.randFloat(MIN_R, MAX_R);

    // trunk
    p.set(x, h * 0.5, z);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
    s.set(r, h, r);
    m.compose(p, q, s);
    trunks.setMatrixAt(i, m);

    // leaves
    const leafSize = THREE.MathUtils.randFloat(1.8, 2.6) * r * 2.0;
    p.set(x, h + r * 2.5, z);
    q.identity();
    s.setScalar(leafSize);
    m.compose(p, q, s);
    leaves.setMatrixAt(i, m);
  }

  trunks.instanceMatrix.needsUpdate = true;
  leaves.instanceMatrix.needsUpdate = true;

  scene.add(trunks);
  scene.add(leaves);
}
