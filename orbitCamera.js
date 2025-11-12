import * as THREE from 'three';

export class OrbitCamera{
    constructor(scene){
        this.zoom = 8; 
        this.yaw = 0.7;
        this.pitch = 0.4;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); 
        scene.add(this.camera);
    }
    
    resize(){
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
    }

    update(target, keys, dt){
        const rotateSpeed = 1;
        if (keys['ArrowLeft'])  this.yaw -= rotateSpeed * dt;
        if (keys['ArrowRight']) this.yaw += rotateSpeed * dt;
        if (keys['ArrowUp'])    this.pitch += rotateSpeed * dt;
        if (keys['ArrowDown'])  this.pitch -= rotateSpeed * dt;
        const limit = Math.PI / 2 - 0.01; 
        this.pitch = Math.max(0, Math.min(limit, this.pitch));

        const zoomFactor = 0.98; 
        if (keys['='])  this.zoom*=zoomFactor;
        if (keys['-'])  this.zoom/=zoomFactor;

        const x = target.x + Math.sin(this.yaw) * Math.cos(this.pitch) * this.zoom;
        const y = target.y + Math.sin(this.pitch) * this.zoom;
        const z = target.z + Math.cos(this.yaw) * Math.cos(this.pitch) * this.zoom;

        this.camera.position.set(x, y, z);
        this.camera.lookAt(target);
    }
}
