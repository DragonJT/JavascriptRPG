
import * as THREE from 'three';
import { buildLSystemTree } from './lsystemTree.js';

const raycaster = new THREE.Raycaster();
const aimNDC = new THREE.Vector2(0, 0);

class InstancedObject
{
    constructor(){
        this.matrices = [];
        this.ids = [];
    }

    add(matrix, obj){
        this.matrices.push(matrix);
        this.ids.push(obj);
    }

    create(scene, geo, mat, castShadow, receiveShadow){
        this.inst = new THREE.InstancedMesh(geo, mat, this.matrices.length);
        this.inst.castShadow = castShadow;
        this.inst.receiveShadow = receiveShadow;
        this.inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.inst.instanceMatrix.needsUpdate = true;
        scene.add(this.inst);
        for(var i = 0; i < this.matrices.length; i++){
            this.inst.setMatrixAt(i, this.matrices[i]);
        }
    }

    raycast(camera, mousex, mousey){
        aimNDC.set((mousex/innerWidth)*2-1, -(mousey/innerHeight)*2+1);
        raycaster.setFromCamera(aimNDC, camera);
        var hits = raycaster.intersectObject(this.inst, false);
        if (hits.length > 0){
            return this.ids[hits[0].instanceId];
        }
        return undefined;
    }
}

const TREES = [];
const leaves = new InstancedObject();
const branches = new InstancedObject();

function raycast(camera, mousex, mousey) {
    var leaf = leaves.raycast(camera, mousex, mousey);
    if(leaf!=undefined) return leaf;
    return branches.raycast(camera, mousex, mousey);
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
    const axis = tmpAxis.crossVectors(Y_UP, tmpDir).normalize();

    tree.falling = true;
    tree.fall = {
        t: 0,
        duration: 2, // seconds
        angle:(Math.PI / 2) * 0.85,
        axis:axis.clone(),
    };
}

const _W = new THREE.Matrix4(); 
const _R = new THREE.Matrix4();
const _T  = new THREE.Matrix4();
const _Ti = new THREE.Matrix4();
const _Q  = new THREE.Quaternion();

function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }

function updateFallingTrees(dt) {
    for (const T of TREES) {
        if(!T.falling || T.dead) continue;
        T.fall.t = Math.min(1, T.fall.t + dt / T.fall.duration);

        const theta = easeOutCubic(T.fall.t) * T.fall.angle;
        _Q.setFromAxisAngle(T.fall.axis, theta);
        // W = T(pivot) * R(axis,theta) * T(-pivot)
        _T.makeTranslation(T.position.x, 0, T.position.z);
        _Ti.makeTranslation(-T.position.x, 0, -T.position.z);
        _R.makeRotationFromQuaternion(_Q);
        _W.multiplyMatrices(_T, _R).multiply(_Ti);

        for(var i=0;i<branches.matrices.length;i++){
            if(branches.ids[i] == T){
                const Mout = _W.clone().multiply(branches.matrices[i]);
                branches.inst.setMatrixAt(i, Mout);
            }
        }
        for(var i=0;i<leaves.matrices.length;i++){
            if(leaves.ids[i] == T){
                const Mout = _W.clone().multiply(leaves.matrices[i]);
                leaves.inst.setMatrixAt(i, Mout);
            }
        }
        
        branches.inst.instanceMatrix.needsUpdate = true;
        leaves.inst.instanceMatrix.needsUpdate = true;

        if (T.fall.t >= 1) {
            T.dead = true;
            T.fall = null;
        }
    }
}

export function addTrees(scene, count = 300, planeSize = 200) {
    const half = planeSize * 0.5 - 3;
    const rulesClassic = {
        'F': [
            { p: 0.6, out: 'F[+F]F[-F]F R' },
            { p: 0.4, out: 'F[+F]F R F[-F]F' }
        ],
        'R': [{ p: 1, out: 'R' }], 
    };

    const rulesLeafy = {
        'F': [
            { p: 0.5, out: 'F[+F]R' },
            { p: 0.5, out: 'F[-F]R' }
        ]
    };

    for (let i = 0; i < count; i++) {
        const x = THREE.MathUtils.randFloat(-half, half);
        const z = THREE.MathUtils.randFloat(-half, half);
        TREES.push(buildLSystemTree(new THREE.Vector3(x, 0, z), leaves, branches, 'F', rulesLeafy, 4, 28, 1.1, 0.3, 0.84, 3));
    }

    const branchGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    branches.create(scene, branchGeo, branchMat, true, true);

    const leavesGeo = new THREE.SphereGeometry(1, 12, 12);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    leaves.create(scene, leavesGeo, leavesMat, true, true);

    //const fruitGeo = new THREE.SphereGeometry(1, 16, 16); // base radius=1, scale per instance
    //const fruitMat = new THREE.MeshStandardMaterial({ color: 0xd44a2a, metalness: 0, roughness: 0.9 });

    return {raycast, startTreeFall, updateFallingTrees};
}
