import * as THREE from 'three';
import { createHumanoid, animateHumanoidWalk } from './Humanoid.js';

export class Player {

    constructor(scene, trees) {
        this.trees = trees;
        this.size = { w: 0.5, h: 1.5, d: 0.5 };
        this.animationT = 0;

        this.humanoid = createHumanoid({skinColor : 0xeeccccc, shirtColor : 0xff0000, pantsColor : 0x000099, shoeColor : 0x222222, scale : 0.4});
        this.humanoid.position.set(0,0,0);
        scene.add(this.humanoid);

        this.turnSpeed = 0.1;
        this.target = {kind:'none', position:new THREE.Vector3(0, 0, 0), radius:0};

        const ringGeo = new THREE.RingGeometry(0.25, 0.35, 32);
        ringGeo.rotateX(-Math.PI/2);
        this.ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.65 }));
        this.ring.visible = false;
        this.ring.position.y = 0.02;
        scene.add(this.ring);
    }

    setTargetNone(){
        this.target.kind = 'none';
        this.ring.visible = false;
    }

    setTargetVec3(vec3){
        this.target.kind = 'vec3';
        this.target.position.x = vec3.x;
        this.target.position.z = vec3.z;
        this.ring.visible = true;
        this.target.radius = 0;
    }

    setTargetTree(tree){
        this.target.kind = 'tree';
        this.target.tree = tree;
        this.ring.visible = true;
        this.target.radius = tree.trunkRadius + 1;
    }

    update() {
        animateHumanoidWalk(this.humanoid, this.animationT, 0.5, 0.6);
        if(this.target.kind == 'none') return;
        if(this.target.kind == 'tree'){
            this.target.position.copy(this.target.tree.position);
        } 
        this.ring.position.x = this.target.position.x;
        this.ring.position.z = this.target.position.z;

        const toTarget = this.target.position.clone().sub(this.humanoid.position);
        const dist = toTarget.length();
        this.animationT += dist * 0.1;
        if (dist > this.target.radius) {
            const dir = toTarget.normalize();
            const speed = 0.05 * dist; 
            this.humanoid.position.addScaledVector(dir, speed);
            const desiredYaw = Math.atan2(dir.x, dir.z);
            const currentYaw = this.humanoid.rotation.y;
            const deltaYaw = ((desiredYaw - currentYaw + Math.PI) % (2 * Math.PI)) - Math.PI;
            this.humanoid.rotation.y += deltaYaw * this.turnSpeed;
        }
        else{
            if(this.target.kind == 'tree' && !this.target.tree.falling){
                this.trees.startTreeFall(this, this.target.tree);
                this.target.kind = 'none';
            }
        }
    }
}