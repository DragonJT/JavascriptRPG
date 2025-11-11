import * as THREE from 'three';

export class Player {
  constructor(scene) {
    this.size = { w: 0.5, h: 1.5, d: 0.5 };
    const geo = new THREE.BoxGeometry(this.size.w, this.size.h, this.size.d);
    const mat = new THREE.MeshStandardMaterial({ color: 0x7fb0ff });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.position.set(0, this.size.h / 2, 0);
    scene.add(this.mesh);

    this.target = this.mesh.position.clone();
    this.turnSpeed = 0.1;
  }

  setTarget(vec3) {
    this.target.copy(vec3);
    this.target.y = this.size.h / 2; // rest on ground
  }

  update() {
    const toTarget = this.target.clone().sub(this.mesh.position);
    const dist = toTarget.length();
    if (dist > 0.01) {
      const dir = toTarget.normalize();
      const speed = 0.05 * dist; // ease
      this.mesh.position.addScaledVector(dir, speed);

      const desiredYaw = Math.atan2(dir.x, dir.z);
      const currentYaw = this.mesh.rotation.y;
      const deltaYaw = ((desiredYaw - currentYaw + Math.PI) % (2 * Math.PI)) - Math.PI;
      this.mesh.rotation.y += deltaYaw * this.turnSpeed;
    }
  }
}