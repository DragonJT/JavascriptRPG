import * as THREE from 'three';

export function createHumanoid({
  skinColor = 0xffcc99,
  shirtColor = 0x2277ff,
  pantsColor = 0x333355,
  shoeColor = 0x222222,
  scale = 1
}) {
  const humanoid = new THREE.Group();
  humanoid.name = 'Humanoid';

  const makeBox = (w, h, d, color) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Basic proportions (units are arbitrary)
  const TORSO_H = 1.3, TORSO_W = 1.0, TORSO_D = 0.5;
  const HEAD_H = 0.6, HEAD_W = 0.6, HEAD_D = 0.6;
  const NECK_H = 0.4, NECK_W = 0.4, NECK_D = 0.4;
  const ARM_H  = 1.4, ARM_W  = 0.35, ARM_D  = 0.35;
  const LEG_H  = 1.4, LEG_W  = 0.4, LEG_D  = 0.4;
  const FOOT_H = 0.2, FOOT_W = 0.5, FOOT_D = 0.7;

  // Torso (root visual)
  const torso = makeBox(TORSO_W, TORSO_H, TORSO_D, shirtColor);
  torso.position.y = LEG_H + FOOT_H + TORSO_H / 2;
  torso.name = 'Torso';
  humanoid.add(torso);

  // Head (pivot at base of skull)
  const neckPivot = new THREE.Object3D();
  neckPivot.position.set(0, torso.position.y + TORSO_H / 2, 0);
  neckPivot.name = 'NeckPivot';
  humanoid.add(neckPivot);

  const neck = makeBox(NECK_W, NECK_H, NECK_D, skinColor);
  neck.position.y = NECK_H / 2; // from neck pivot upward
  neck.name = 'Neck';
  neckPivot.add(neck);

  const neckTopPivot = new THREE.Object3D();
  neckTopPivot.position.set(0, NECK_H / 2, 0);
  neckTopPivot.name = 'NeckPivot';
  neckPivot.add(neckTopPivot);

  const head = makeBox(HEAD_W, HEAD_H, HEAD_D, skinColor);
  head.position.y = HEAD_H / 2; // from neck pivot upward
  head.name = 'Head';
  neckTopPivot.add(head);

  // Shoulders (pivots at shoulder centers)
  const shoulderOffsetY = torso.position.y + TORSO_H / 2 - ARM_W * 0.2;
  const shoulderOffsetX = TORSO_W / 2 + ARM_W / 2;

  const lShoulder = new THREE.Object3D();
  lShoulder.position.set(+shoulderOffsetX, shoulderOffsetY, 0);
  lShoulder.name = 'LeftShoulder';
  humanoid.add(lShoulder);

  const rShoulder = new THREE.Object3D();
  rShoulder.position.set(-shoulderOffsetX, shoulderOffsetY, 0);
  rShoulder.name = 'RightShoulder';
  humanoid.add(rShoulder);

  const leftArm  = makeBox(ARM_W, ARM_H, ARM_D, shirtColor);
  leftArm.position.y = -ARM_H / 2; // hang down from pivot
  leftArm.name = 'LeftArm';
  lShoulder.add(leftArm);

  const rightArm = makeBox(ARM_W, ARM_H, ARM_D, shirtColor);
  rightArm.position.y = -ARM_H / 2;
  rightArm.name = 'RightArm';
  rShoulder.add(rightArm);

  // Hips (pivots at top of legs)
  const hipOffsetY = LEG_H + FOOT_H;
  const hipOffsetX = LEG_W * 0.6;

  const lHip = new THREE.Object3D();
  lHip.position.set(+hipOffsetX, hipOffsetY, 0);
  lHip.name = 'LeftHip';
  humanoid.add(lHip);

  const rHip = new THREE.Object3D();
  rHip.position.set(-hipOffsetX, hipOffsetY, 0);
  rHip.name = 'RightHip';
  humanoid.add(rHip);

  const leftLeg = makeBox(LEG_W, LEG_H, LEG_D, pantsColor);
  leftLeg.position.y = -LEG_H / 2;
  leftLeg.name = 'LeftLeg';
  lHip.add(leftLeg);

  const rightLeg = makeBox(LEG_W, LEG_H, LEG_D, pantsColor);
  rightLeg.position.y = -LEG_H / 2;
  rightLeg.name = 'RightLeg';
  rHip.add(rightLeg);

  // Feet (simple blocks)
  const lFoot = makeBox(FOOT_W, FOOT_H, FOOT_D, shoeColor);
  lFoot.position.set(0, -LEG_H / 2 - FOOT_H / 2, FOOT_D * 0.1);
  lFoot.name = 'LeftFoot';
  leftLeg.add(lFoot);

  const rFoot = makeBox(FOOT_W, FOOT_H, FOOT_D, shoeColor);
  rFoot.position.set(0, -LEG_H / 2 - FOOT_H / 2, FOOT_D * 0.1);
  rFoot.name = 'RightFoot';
  rightLeg.add(rFoot);

  // Scale whole rig if desired
  humanoid.scale.setScalar(scale);

  return humanoid;
}

export function animateHumanoidWalk(humanoid, t, speed, stride) {
  const L = humanoid.getObjectByName('LeftHip');
  const R = humanoid.getObjectByName('RightHip');
  const LS = humanoid.getObjectByName('LeftShoulder');
  const RS = humanoid.getObjectByName('RightShoulder');

  if (!L || !R || !LS || !RS) return;

  const phase = t * speed;

  // Forward/back swing (± in radians)
  const legSwing  = Math.sin(phase) * stride;
  const armSwing  = -legSwing * 0.8; // counter-swing

  L.rotation.x  =  legSwing;   // left leg forward as right arm forward
  R.rotation.x  = -legSwing;

  LS.rotation.x =  armSwing;
  RS.rotation.x = -armSwing;

  // Tiny side sway for life
  const sway = Math.sin(phase * 2) * 0.05;
  humanoid.position.x += sway * 0.05;
  humanoid.rotation.y += sway * 0.2;
}
