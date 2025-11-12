import * as THREE from 'three';

/** Make a power-of-two CanvasTexture filled with a solid color (or a subtle grid). */
export function makeColorCanvasTexture({
  color = '#00ff00',
  size = 512,
  withGrid = false
} = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');

  // base fill
  g.fillStyle = color;
  g.fillRect(0, 0, size, size);

  if (withGrid) {
    g.globalAlpha = 0.08;
    g.strokeStyle = '#000';
    g.lineWidth = 1;
    const step = size / 16;
    for (let i = 0; i <= size; i += step) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, size); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(size, i); g.stroke();
    }
    g.globalAlpha = 1.0;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Make a very simple RGBA splat map on a canvas.
 *  Here: a checker of 4 channels (R,G,B,A) so you can see all layers right away.
 */
export function makeSplatCanvas({ size = 512, cell = 64 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      data[i + 0] = 255; // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 0; // A
    }
  }
  g.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace; // typical authoring space
  tex.needsUpdate = true;
  return tex;
}