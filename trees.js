
import * as THREE from 'three';
import { buildLSystemTree } from './lsystemTree.js';

const TREES = [];
const BRANCH_IDS = [];
const LEAVES_IDS = [];
var branchesInst = undefined;
var leavesInst = undefined;

const raycaster = new THREE.Raycaster();
const aimNDC = new THREE.Vector2(0, 0); // center of screen

function raycast(camera, mousex, mousey) {
    aimNDC.set((mousex/innerWidth)*2-1, -(mousey/innerHeight)*2+1);
    raycaster.setFromCamera(aimNDC, camera);
    var hits = raycaster.intersectObject(branchesInst, false);
    if (!hits.length){
        hits = raycaster.intersectObject(leavesInst, false);
        if(!hits.length) return null;
        return LEAVES_IDS[hits[0].instanceId];
    }
    return BRANCH_IDS[hits[0].instanceId];
}


const Y_UP = new THREE.Vector3(0,1,0);
const tmpDir = new THREE.Vector3();
const tmpAxis = new THREE.Vector3();

function startTreeFall(player, tree) {
    tmpDir.x = tree.x - player.mesh.position.x;
    tmpDir.z = tree.z - player.mesh.position.z;
    tmpDir.y = 0;
    if (tmpDir.lengthSq() < 1e-6) tmpDir.set(0,0,-1);
    tmpDir.normalize();
    const axis = tmpAxis.crossVectors(Y_UP, tmpDir).normalize();

    tree.falling = true;
    tree.fall = {
        t: 0,
        duration: 2, // seconds
        angle:(Math.PI / 2) * 0.7,
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
    var bi = 0;
    var li = 0;
    for (const T of TREES) {
        if (!T.falling || T.dead){
            bi+=T.branches.length;
            li+=T.leaves.length;
            continue;
        } 
        //console.log(T);
        T.fall.t = Math.min(1, T.fall.t + dt / T.fall.duration);

        const theta = easeOutCubic(T.fall.t) * T.fall.angle;
        _Q.setFromAxisAngle(T.fall.axis, theta);

        // W = T(pivot) * R(axis,theta) * T(-pivot)
        _T.makeTranslation(T.x, 0, T.z);
        _Ti.makeTranslation(-T.x, 0, -T.z);
        _R.makeRotationFromQuaternion(_Q);
        _W.multiplyMatrices(_T, _R).multiply(_Ti);

        for(var b of T.branches){
            const Mout = _W.clone().multiply(b);
            branchesInst.setMatrixAt(bi, Mout);
            bi++;
        }
        for(var l of T.leaves){
            const Mout = _W.clone().multiply(l);
            leavesInst.setMatrixAt(li, Mout);
            li++;
        }
        branchesInst.instanceMatrix.needsUpdate = true;
        leavesInst.instanceMatrix.needsUpdate = true;

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
        var trunkRadius = 0.3;
        var {leaves, branches} = buildLSystemTree( new THREE.Vector3(x, 0, z), 'F', rulesLeafy, 4, 28, 1.1, trunkRadius, 0.84, 3);
        TREES.push({x, z, branches, leaves, falling:false, dead:false, trunkRadius});
    }

    var branchesLength = 0;
    var leavesLength = 0;
    for(var t of TREES){
        branchesLength += t.branches.length;
        leavesLength += t.leaves.length;
    }

    const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
    const cylMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    branchesInst = new THREE.InstancedMesh(cylGeo, cylMat, branchesLength);
    branchesInst.castShadow = true;
    branchesInst.receiveShadow = true;
    branchesInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    branchesInst.instanceMatrix.needsUpdate = true;
    scene.add(branchesInst);

    const sphereGeo = new THREE.SphereGeometry(1, 12, 12);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    leavesInst = new THREE.InstancedMesh(sphereGeo, sphereMat, leavesLength);
    leavesInst.castShadow = true;
    leavesInst.receiveShadow = true;
    leavesInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    leavesInst.instanceMatrix.needsUpdate = true;
    scene.add(leavesInst);

    var bi = 0;
    var li = 0;
    for (var t of TREES) {
        for(var b of t.branches){
            branchesInst.setMatrixAt(bi, b);
            BRANCH_IDS.push(t);
            bi++;
        }
        for(var l of t.leaves){
            leavesInst.setMatrixAt(li, l);
            LEAVES_IDS.push(t);
            li++;
        }
    }

    return {raycast, startTreeFall, updateFallingTrees};
}
