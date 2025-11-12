import * as THREE from 'three';
import { createHumanoid, animateHumanoidWalk } from './humanoid.js';

export class Player {

    constructor(scene, terrain, trees) {
        this.terrain = terrain;
        this.trees = trees;
        this.size = { w: 0.5, h: 1.5, d: 0.5 };
        this.animationT = 0;

        this.humanoid = createHumanoid({skinColor : 0xeeccccc, shirtColor : 0xff0000, pantsColor : 0x000099, shoeColor : 0x222222, scale : 0.4});
        this.humanoid.position.set(0,terrain.heightFn(0,0),0);
        scene.add(this.humanoid);

        this.turnSpeed = 0.1;
        this.target = {kind:'none', position:new THREE.Vector3(0, 0, 0), radius:0};
    }

    setTargetNone(){
        this.target.kind = 'none';
        this.terrain.setMarker();
    }

    setTargetVec3(vec3){
        this.target.kind = 'vec3';
        this.target.position.x = vec3.x;
        this.target.position.z = vec3.z;
        this.target.radius = 0;
        this.terrain.setMarker(this.target.position);
    }

    setTargetTree(tree){
        this.target.kind = 'tree';
        this.target.tree = tree;
        this.target.radius = tree.trunkRadius + 1;
        this.terrain.setMarker(this.target.position);
    }

    update() {
        animateHumanoidWalk(this.humanoid, this.animationT, 0.5, 0.6);
        if(this.target.kind == 'none') return;
        if(this.target.kind == 'tree'){
            this.target.position.copy(this.target.tree.position);
        } 
        
        var toTarget = this.target.position.clone().sub(this.humanoid.position);
        toTarget.y = 0;
        const dist = toTarget.length();
        this.animationT += dist * 0.1;
        if (dist > this.target.radius) {
            const dir = toTarget.normalize();
            const speed = 0.05 * dist; 
            this.humanoid.position.addScaledVector(dir, speed);
            this.humanoid.position.y = this.terrain.heightFn(this.humanoid.position.x, this.humanoid.position.z);
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