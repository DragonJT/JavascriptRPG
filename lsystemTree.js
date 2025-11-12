import * as THREE from 'three';

// ---------- L-system expansion ----------
function expandLSystem(axiom, rules, iterations) {
  // rules: { [symbol]: [ { p:0.6, out:'...' }, { p:0.4, out:'...' } ] }
  let s = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (let ch of s) {
      const alts = rules[ch];
      if (!alts) { next += ch; continue; }
      next += pickByProbability(alts).out;
    }
    s = next;
  }
  return s;
}

function pickByProbability(alts) {
  if (!Array.isArray(alts)) return { out: alts };
  let r = Math.random();
  let acc = 0;
  for (const a of alts) {
    acc += a.p;
    if (r <= acc) return a;
  }
  return alts[alts.length - 1]; // fallback
}

// ---------- Tree geometry helpers ----------


function cylinderBetween(a, b, radius) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();

    // Orientation: Y-axis to the direction
    const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
    );

    // Position: midpoint
    const pos = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);

    // Scale: only stretch Y to length
    const scale = new THREE.Vector3(radius, len, radius);

    const m = new THREE.Matrix4();
    m.compose(pos, quat, scale);
    return m;
}

function makeLeaf(pos, size = 0.6) {
    const m = new THREE.Matrix4();
    m.compose(pos, new THREE.Quaternion(), new THREE.Vector3(size, size, size));
    return m;
}

// ---------- Turtle interpreter ----------
/*
Symbols (classic):
  F : draw forward a branch segment
  f : move forward (no draw)
  + : yaw +angle
  - : yaw -angle
  & : pitch +angle
  ^ : pitch -angle
  \ : roll +angle
  / : roll -angle
  | : yaw 180°
  [ : push turtle state (position+orientation+thickness)
  ] : pop turtle state
  L : place leaf
  R : reduce radius (thinner as we go)
*/
export function buildLSystemTree(
    position,
    axiom,
    rules,
    iterations = 3,
    angleDeg = 25,
    segmentLength = 1.2,
    baseRadius = 0.22,
    radiusDecay = 0.86,
    leafDistFromRoot = 2, 
) {
  const str = expandLSystem(axiom, rules, iterations);

  const turtle = new THREE.Object3D();
  turtle.position.copy(position);
  turtle.up.set(0, 1, 0);
  const stack = [];

  let radius = baseRadius;
  const step = segmentLength;
  const ang = THREE.MathUtils.degToRad(angleDeg);

  const tmp = new THREE.Vector3();
  const end = new THREE.Vector3();

  const branches = [];
  const leaves = [];

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    switch (c) {
      case 'F': {
        // draw forward
        turtle.getWorldPosition(tmp);
        turtle.translateY(step);
        turtle.getWorldPosition(end);

        branches.push(cylinderBetween(tmp, end, radius));
        
        if (end.distanceTo(position) > leafDistFromRoot) {
            leaves.push(makeLeaf(end, THREE.MathUtils.randFloat(0.4, 0.8)));
        }
        break;
      }
      case 'f': {
        turtle.translateY(step);
        break;
      }
      case '+': 
        turtle.rotateY(Math.random()* Math.PI * 2);
        turtle.rotateZ( ang); 
        break; // yaw+ (around Z with our “up on Y” turtle)
      case '-': 
        turtle.rotateY(Math.random()* Math.PI * 2);
        turtle.rotateZ(-ang);
        break;
      /*case '&': turtle.rotateX( ang); break; // pitch+
      case '^': turtle.rotateX(-ang); break;
      case '\\': turtle.rotateY( ang); break; // roll+
      case '/':  turtle.rotateY(-ang); break;
      case '|':  turtle.rotateZ(Math.PI); break;*/

      case '[': {
        stack.push({
          pos: turtle.position.clone(),
          quat: turtle.quaternion.clone(),
          rad: radius
        });
        break;
      }
      case ']': {
        const s = stack.pop();
        if (s) {
          turtle.position.copy(s.pos);
          turtle.quaternion.copy(s.quat);
          radius = s.rad;
        }
        break;
      }
      case 'R': {
        radius *= radiusDecay;
        radius = Math.max(0.03, radius);
        break;
      }
      case 'L': {
        turtle.getWorldPosition(end);
        leaves.push(makeLeaf(end, THREE.MathUtils.randFloat(0.5, 1.1)));
        break;
      }
      default:
        // ignore unknown symbols
        break;
    }
  }
  return {leaves, branches};
}