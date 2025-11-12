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

/*function makeLeaf(pos, size = 0.6) {
  const leaf = new THREE.Mesh(LEAF_GEOM, LEAF_MAT);
  leaf.position.copy(pos);
  leaf.scale.setScalar(size);
  leaf.lookAt(pos.x + (Math.random() - 0.5), pos.y + 0.5, pos.z + (Math.random() - 0.5));
  leaf.castShadow = true;
  return leaf;
}*/

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
    x,
    z,
    axiom,
    rules,
    iterations = 3,
    angleDeg = 25,
    segmentLength = 1.2,
    baseRadius = 0.22,
    radiusDecay = 0.86,
    leafEveryF = false, 
) {
  const str = expandLSystem(axiom, rules, iterations);

  const group = new THREE.Group();
  // origin is at ground/base so your fall rotation looks natural
  group.position.set(0, 0, 0);
  group.userData = {
    type: 'tree',
    health: 4,
    falling: false,
    fall: null,
    dead: false,
  };

  const turtle = new THREE.Object3D();
  turtle.position.set(x, 0, z);
  turtle.up.set(0, 1, 0);
  const stack = [];

  let radius = baseRadius;
  const step = segmentLength;
  const ang = THREE.MathUtils.degToRad(angleDeg);

  const tmp = new THREE.Vector3();
  const end = new THREE.Vector3();

  const branches = [];
  const leafMeshes = [];

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    switch (c) {
      case 'F': {
        // draw forward
        turtle.getWorldPosition(tmp);
        turtle.translateY(step);
        turtle.getWorldPosition(end);

        branches.push(cylinderBetween(tmp, end, radius));
        
        // optional leaf
        if (leafEveryF && Math.random() < 0.2) {
          //const lf = makeLeaf(end, THREE.MathUtils.randFloat(0.4, 0.8));
          //lf.userData.treeRoot = group;
          //leafMeshes.push(lf);
          //group.add(lf);
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
        /*const lf = makeLeaf(end, THREE.MathUtils.randFloat(0.5, 1.1));
        lf.userData.treeRoot = group;
        leafMeshes.push(lf);
        group.add(lf);*/
        break;
      }
      default:
        // ignore unknown symbols
        break;
    }
  }

  // register for raycasting
  //for (const m of branchMeshes) TREE_HIT_TARGETS.push(m);
  //for (const l of leafMeshes)   TREE_HIT_TARGETS.push(l);
  //TREES.push(group);
  return branches;
}