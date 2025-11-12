
import * as THREE from 'three';

export function createRenderer(){
    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);
    return renderer;
}

export function createScene(){
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x13151a);
    return scene;
}

export function addLights(scene){
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(5,10,3);
    const size = 60;
    light.castShadow = true;
    light.shadow.mapSize.set(2048,2048);
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 40;
    light.shadow.camera.left = -size;
    light.shadow.camera.right = size;
    light.shadow.camera.top = size;
    light.shadow.camera.bottom = -size;
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    function updateShadowRegion(camera) {
        const s = 50; // half-size of the shadow box around the camera
        const cam = light.shadow.camera;

        // position light relative to camera (sun offset)
        const sunOffset = new THREE.Vector3(60, 90, 40);
        light.position.copy(camera.position).add(sunOffset);

        // aim at where you want best quality (camera or player)
        light.target.position.copy(camera.position);
        light.target.updateMatrixWorld();

        cam.left = -s; cam.right = s; cam.top = s; cam.bottom = -s;
        cam.near = 1; cam.far = 220;
        cam.updateProjectionMatrix();
    }
    return {updateShadowRegion};
}

    
