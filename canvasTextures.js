import * as THREE from 'three';

/** Make a power-of-two CanvasTexture filled with a solid color (or a subtle grid). */
export function makeColorTexture(r,g,b,size) {
  const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            
            data[i + 0] = r * Math.random(); data[i + 1] = g * Math.random(); data[i + 2] = b * Math.random(); data[i + 3] = 0;
        }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = true;
    tex.wrapT = true;
    tex.needsUpdate = true;
    return tex;
}

/** Make a very simple RGBA splat map on a canvas.
 *  Here: a checker of 4 channels (R,G,B,A) so you can see all layers right away.
 */
export function makeSplatCanvas(size, terrain) {
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const xpos = (x - size/2) / size * terrain.size;
            const ypos = (y - size/2) / size * terrain.size;
            const h = terrain.heightFn(xpos, ypos);
            if(h > 10){
                data[i + 0] = 255; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0;
            } 
            else if(h > 3){
                data[i + 0] = 0; data[i + 1] = 255; data[i + 2] = 0; data[i + 3] = 0;
            }
            else if(h>-4){
                data[i + 0] = 0; data[i + 1] = 0; data[i + 2] = 255; data[i + 3] =0;
            }
            else{
                data[i + 0] = 0; data[i + 1] = 0; data[i + 2] = 255; data[i + 3] =255;
            }
        }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
}