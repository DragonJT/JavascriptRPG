import * as THREE from 'three';
import {makeColorTexture, makeSplatCanvas } from './canvasTextures.js';

function makeStandaloneSplatTerrainMat() {
  const uniforms = {
    // textures
    uSplatMap:   { value: null },   // RGBA weights
    uTex0: { value: null }, // R
    uTex1: { value: null }, // G
    uTex2: { value: null }, // B
    uTex3: { value: null }, // A

    uMarkerPos:   { value: new THREE.Vector3(0,0,0) },
    uMarkerRadius:   { value: 0 },
  };

  const vertexShader = /* glsl */`
    precision highp float;
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;

    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormalWS;

    void main() {
      vUv = uv;
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorldPos = world.xyz;
      vNormalWS = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `;

  const fragmentShader = /* glsl */`
    precision highp float;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormalWS;

    uniform sampler2D uSplatMap;

    uniform sampler2D uTex0;
    uniform sampler2D uTex1;
    uniform sampler2D uTex2;
    uniform sampler2D uTex3;

    uniform vec3 uMarkerPos;
    uniform float uMarkerRadius;

    void main() {
        float scale = 10.0;
        vec4 splat = texture2D(uSplatMap, vUv);
        vec3 c0 = texture2D(uTex0, vUv * scale).rgb;
        vec3 c1 = texture2D(uTex1, vUv * scale).rgb;
        vec3 c2 = texture2D(uTex2, vUv * scale).rgb;
        vec3 c3 = texture2D(uTex3, vUv * scale).rgb;
        vec3 col = c0*splat.r + c1*splat.g + c2*splat.b + c3*splat.a;
        if(length(vWorldPos.xz - uMarkerPos.xz) < uMarkerRadius){
            col = vec3(1,1,1);
        }
        gl_FragColor = vec4(col.r, col.g, col.b, 1.0);
    }
  `;

  return new THREE.RawShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    // no lights/fog/includes needed
    dithering: true,
  });
}

export class SplatTerrain
{
    constructor(scene, size, segments){
        this.size = size;
        // Slight grid so you can see tiling; set withGrid:false for pure solid.
        const tex1 = makeColorTexture(255,0,0,512);
        const tex2 = makeColorTexture(0,255,0,512);
        const tex3 = makeColorTexture(0,0,255,512);
        const tex4 = makeColorTexture(0,255,128,512);

        // The control (splat) map:
        const splat = makeSplatCanvas(512, this);
        this.mat = makeStandaloneSplatTerrainMat();

        this.mat.uniforms.uSplatMap.value = splat;
        this.mat.uniforms.uTex0.value = tex1;
        this.mat.uniforms.uTex1.value = tex2;
        this.mat.uniforms.uTex2.value = tex3;
        this.mat.uniforms.uTex3.value = tex4;
        
        const geom = new THREE.PlaneGeometry(size, size, segments, segments);
        geom.rotateX(-Math.PI / 2);

        // Displace vertices
        const pos = geom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            pos.setY(i, this.heightFn(x, z));
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();

        this.terrain = new THREE.Mesh(geom, this.mat);
        scene.add(this.terrain);
    }

    heightFn(x, z) {
        const amp = 20, freq = 1 / 60;
        const amp2 = 8,  freq2 = 1 / 18;
        const amp3 = 4,  freq3 = 1 / 9;

        // Mix 3 cheap waves for some variation
        return (
            amp  * (Math.sin(x * freq) * Math.cos(z * freq)) +
            amp2 * (Math.sin((x + z) * freq2) * 0.5) +
            amp3 * (Math.cos((x - z) * freq3) * 0.5)
        );
    }

    setMarker(pos){
        if(!pos){
            this.mat.uniforms.uMarkerRadius = 0;
        }
        else{
            this.mat.uniforms.uMarkerRadius.value = 0.2;
            this.mat.uniforms.uMarkerPos.value.copy(pos);
        }
    }
}

