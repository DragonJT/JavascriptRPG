
import * as THREE from 'three';

import { createRenderer, createScene, addLights } from './world.js';
import { Player } from './player.js';
import { OrbitCamera } from './orbitCamera.js';
import { addTrees } from './trees.js';
import { createOverlay } from './overlay.js';
import { SplatTerrain } from './splatTerrain.js';

const PLANE_SIZE = 200;
const renderer = createRenderer();
const scene = createScene();
const lights = addLights(scene);
const camera = new OrbitCamera(scene);
const terrain = new SplatTerrain(scene, renderer, PLANE_SIZE, PLANE_SIZE, 200);
const trees = addTrees(scene, terrain, 300, PLANE_SIZE);

const player = new Player(scene, terrain, trees);
const overlay = createOverlay();

var keys = {};
addEventListener('keydown', e=>{
    keys[e.key] = true;
});
addEventListener('keyup', e=>{
    keys[e.key] = false;
});

addEventListener('contextmenu', e=>{
    e.preventDefault();
    const tree = trees.raycast(camera.camera, e.clientX, e.clientY);
    if(tree){
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
    raycaster.setFromCamera(ndc, camera.camera);
    const hit = raycaster.intersectObject(terrain.terrain, false)[0];
    if (!hit) return;
    player.setTargetVec3(hit.point);
});

// resize
addEventListener('resize', ()=>{
  renderer.setSize(innerWidth, innerHeight);
  camera.resize();
  overlay.resize();
});

// main loop
function animate(){
    const dt = 0.16;
    requestAnimationFrame(animate);
    player.update(trees);
    lights.updateShadowRegion(camera.camera);
    camera.update(player.humanoid.position, keys, dt); 
    trees.updateFallingTrees(dt);
    renderer.clear(true, true, true);
    renderer.render(scene, camera.camera);
    overlay.render(renderer);
}
animate();