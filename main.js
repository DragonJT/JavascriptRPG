
import * as THREE from 'three';

import { createRenderer, createScene, createCamera, addLights, addGround } from './world.js';
import { Player } from './player.js';
import { orbitControls } from './orbitControls.js';
import { addTrees } from './trees.js';
import { createOverlay } from './overlay.js';

const renderer = createRenderer();
const scene = createScene();
const camera = createCamera();
const lights = addLights(scene);
const { plane, size: planeSize } = addGround(scene);
const trees = addTrees(scene, 300, planeSize);

const player = new Player(scene, trees);
const controls = orbitControls(camera, renderer.domElement, player);
const overlay = createOverlay();

var keys = {};
addEventListener('keydown', e=>{
    keys[e.key] = true;
});
addEventListener('keyup', e=>{
    keys[e.key] = false;
});

addEventListener('contextmenu', e=>{
    const tree = trees.raycast(camera, e.clientX, e.clientY);
    if(tree!=null){
        overlay.createMenu(e, e.clientX-100,e.clientY-50,200,200, ["chop", "go"], v => {
            if(v == 'chop') player.setTargetTree(tree);
            if(v == 'go') console.log("go");
        });
    }

});

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

addEventListener('mousemove', e=>{
    overlay.onevent(e);
});

addEventListener('pointerdown', e=>{
    overlay.onevent(e);
    if (e.button !== 0 || e.used) return;
    ndc.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(plane, false)[0];
    if (!hit) return;
    player.setTargetVec3(hit.point);
});

// resize
addEventListener('resize', ()=>{
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  overlay.resize();
});

// main loop
function animate(){
    const dt = 0.16;
    requestAnimationFrame(animate);
    player.update(trees);
    lights.updateShadowRegion(camera);
    controls.update(keys, dt); 
    trees.updateFallingTrees(dt);
    renderer.clear(true, true, true);
    renderer.render(scene, camera);
    overlay.render(renderer);
}
animate();