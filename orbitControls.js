import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js';

export function orbitControls(camera, rendererDom, player) {
    let yaw=0.7, pitch=2; 
    const rotateSpeed = 0.5;
    const controls = new OrbitControls(camera, rendererDom);
    controls.enableDamping = true;
    controls.enablePan = false; 
    controls.enableZoom = true;
    controls.enableRotate = false; 

    function update(keys, dt) {
        if (keys['ArrowLeft'])  yaw -= rotateSpeed * dt;
        if (keys['ArrowRight']) yaw += rotateSpeed * dt;
        if (keys['ArrowUp'])    pitch += rotateSpeed * dt;
        if (keys['ArrowDown'])  pitch -= rotateSpeed * dt;
        // clamp pitch so camera can’t flip upside down
        const maxPitch = Math.PI / 2.2;
        const minPitch = 0.05;
        pitch = Math.max(minPitch, Math.min(maxPitch, pitch));

        // compute new camera position in spherical coords
        const radius = 12; // distance from cube
        const offset = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch) * radius,
        Math.sin(pitch) * radius,
        Math.cos(yaw) * Math.cos(pitch) * radius
        );

        // follow the cube
        const targetPos = player.mesh.position;
        camera.position.copy(targetPos).add(offset);
        camera.lookAt(targetPos);
        controls.target.copy(targetPos);
        controls.update();
    }

    return { update };
}

