/* P's Pizza, in 3D.
   Everything is built in code (no model files): a wooden peel like the ones in
   our photos, a pizza cut into eight real slices, toppings off our own topping
   list, and one slice you can pull out with the cheese still attached, the same
   way the slice sits in the P's logo. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';


/* ------------------------------------------------------------ helpers */
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function blob(ctx, x, y, r, inner, outer) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

/* Sauce, melted mozzarella, browned bubbles, oregano, chilli flakes. */
function cheeseTexture(size) {
  const rand = rng(11);
  const [c, ctx] = canvas(size, size);
  const cx = size / 2, cy = size / 2, R = size * 0.465;
  ctx.fillStyle = '#7d2410';
  ctx.fillRect(0, 0, size, size);
  // sauce, a touch darker towards the rim where it caramelises
  const sg = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
  sg.addColorStop(0, '#c43d1d'); sg.addColorStop(0.85, '#b3341a'); sg.addColorStop(1, '#8a2512');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  // cheese: lots of overlapping soft pools, leaving sauce peeking through
  for (let i = 0; i < 420; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * R * 0.93;
    const r = size * (0.02 + rand() * 0.05);
    blob(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, 'rgba(252,226,150,0.95)', 'rgba(246,206,110,0)');
  }
  for (let i = 0; i < 160; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * R * 0.9;
    blob(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, size * (0.012 + rand() * 0.03), 'rgba(255,240,196,0.9)', 'rgba(255,236,180,0)');
  }
  // browned bubbles
  for (let i = 0; i < 120; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * R * 0.92;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, r = size * (0.004 + rand() * 0.014);
    blob(ctx, x, y, r, 'rgba(176,104,38,0.75)', 'rgba(196,128,52,0)');
  }
  // oregano + chilli flakes
  for (let i = 0; i < 900; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * R * 0.95;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    const herb = rand() > 0.18;
    ctx.fillStyle = herb ? `rgba(${50 + rand() * 30 | 0},${70 + rand() * 30 | 0},28,${0.55 + rand() * 0.4})` : `rgba(${190 + rand() * 50 | 0},${50 + rand() * 40 | 0},20,0.85)`;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rand() * Math.PI);
    const w = size * (herb ? 0.0016 + rand() * 0.003 : 0.002 + rand() * 0.003);
    ctx.fillRect(-w, -w * 0.6, w * 2, w * 1.2);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* Golden crust with flour dust and the odd charred blister. */
function crustTexture() {
  const rand = rng(23);
  const [c, ctx] = canvas(512, 256);
  ctx.fillStyle = '#e3ad66'; ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 260; i++) {
    const x = rand() * 512, y = rand() * 256, r = 6 + rand() * 26;
    const dark = rand() > 0.5;
    blob(ctx, x, y, r, dark ? 'rgba(186,116,48,0.45)' : 'rgba(246,206,140,0.5)', 'rgba(0,0,0,0)');
  }
  for (let i = 0; i < 40; i++) blob(ctx, rand() * 512, rand() * 256, 3 + rand() * 7, 'rgba(70,38,18,0.85)', 'rgba(90,52,24,0)');
  for (let i = 0; i < 700; i++) { ctx.fillStyle = `rgba(255,248,232,${0.25 + rand() * 0.4})`; ctx.fillRect(rand() * 512, rand() * 256, 1.4, 1.4); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1);
  return tex;
}

/* Well-used wooden peel: grain, a couple of knots, burnt edges. */
function woodTexture(size) {
  const rand = rng(5);
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = '#8a5b38'; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) {
    const y0 = rand() * size, amp = 2 + rand() * 9, freq = 0.004 + rand() * 0.01, ph = rand() * 6;
    ctx.strokeStyle = rand() > 0.5 ? `rgba(60,34,18,${0.08 + rand() * 0.22})` : `rgba(196,140,92,${0.06 + rand() * 0.16})`;
    ctx.lineWidth = 0.6 + rand() * 2.6;
    ctx.beginPath();
    for (let x = 0; x <= size; x += 8) {
      const y = y0 + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 3.1) * amp * 0.25;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  for (let k = 0; k < 3; k++) {
    const x = rand() * size, y = rand() * size;
    for (let r = 26; r > 2; r -= 4) { ctx.strokeStyle = `rgba(70,40,20,${0.25})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r * 0.7, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
  // knife marks from years of cutting
  for (let i = 0; i < 40; i++) {
    const x = rand() * size, y = rand() * size, l = 30 + rand() * 120, a = rand() * Math.PI;
    ctx.strokeStyle = `rgba(230,190,150,${0.08 + rand() * 0.1})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.5);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.85, 'rgba(40,20,8,0.25)'); g.addColorStop(1, 'rgba(25,12,4,0.75)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function softDot(size, inner, outer) {
  const [c, ctx] = canvas(size, size);
  blob(ctx, size / 2, size / 2, size / 2, inner, outer);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------ geometry */
const R = 1.55;          // crust centre-line radius
const D = 0.07;          // base thickness
const TUBE = 0.2;        // crust thickness
const N = 8;             // slices
const STEP = (Math.PI * 2) / N;
const GAP = 0.006;       // the knife line between slices
const UVS = R * 2.16;    // texture covers a little more than the pie

// world angle a  <->  (cos a, -sin a) on the XZ plane (matches rotateX(-PI/2))
const polar = (r, a, y) => new THREE.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r);

/* One wedge of base. Top faces get the cheese material, everything else is
   dough; vertex colours on the cut faces show the cheese layer over bread. */
function wedgeGeometry(a0, a1) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(Math.cos(a0) * R, Math.sin(a0) * R);
  s.absarc(0, 0, R, a0, a1, false);
  s.lineTo(0, 0);
  let g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 30 });
  g.rotateX(-Math.PI / 2);
  if (g.index) g = g.toNonIndexed();
  const pos = g.attributes.position, nor = g.attributes.normal;
  const tris = pos.count / 3;
  const top = [], rest = [];
  for (let t = 0; t < tris; t++) {
    let up = true;
    for (let k = 0; k < 3; k++) if (nor.getY(t * 3 + k) < 0.7 || pos.getY(t * 3 + k) < D * 0.75) up = false;
    (up ? top : rest).push(t);
  }
  const order = top.concat(rest);
  const P = new Float32Array(pos.count * 3), Nn = new Float32Array(pos.count * 3), U = new Float32Array(pos.count * 2), C = new Float32Array(pos.count * 3);
  order.forEach((t, i) => {
    for (let k = 0; k < 3; k++) {
      const src = t * 3 + k, dst = i * 3 + k;
      const x = pos.getX(src), y = pos.getY(src), z = pos.getZ(src);
      P.set([x, y, z], dst * 3);
      Nn.set([nor.getX(src), nor.getY(src), nor.getZ(src)], dst * 3);
      U.set([x / UVS + 0.5, -z / UVS + 0.5], dst * 2);
      const h = clamp((y - D * 0.35) / (D * 0.5), 0, 1);
      C.set([lerp(0.93, 0.99, h), lerp(0.78, 0.82, h), lerp(0.56, 0.42, h)], dst * 3);
    }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  out.setAttribute('color', new THREE.BufferAttribute(C, 3));
  out.addGroup(0, top.length * 3, 0);
  out.addGroup(top.length * 3, rest.length * 3, 1);
  g.dispose();
  return out;
}

function crustNoise(x, y, z) {
  return Math.sin(x * 7.1 + z * 3.3) * 0.5 + Math.sin(z * 9.7 - x * 2.1 + y * 5.0) * 0.3 + Math.sin((x + z) * 15.3) * 0.2;
}

/* The rim of one slice: a bent, slightly squashed tube with lumps, toasted on
   top. Displacement is a function of world position so seams line up. */
function crustGeometry(a0, a1) {
  const g = new THREE.TorusGeometry(R, TUBE, 16, 44, a1 - a0);
  g.rotateX(-Math.PI / 2);
  g.rotateY(a0);
  g.scale(1, 0.74, 1);
  g.translate(0, D * 0.55, 0);
  const pos = g.attributes.position, nor = g.attributes.normal;
  const col = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = crustNoise(v.x, v.y, v.z);
    pos.setXYZ(i, v.x + nor.getX(i) * n * 0.022, v.y + nor.getY(i) * n * 0.018, v.z + nor.getZ(i) * n * 0.022);
    const up = clamp(nor.getY(i), -1, 1);
    const toast = smooth(clamp(up * 0.9 + 0.25, 0, 1));
    const char = n > 0.78 ? 0.72 : 1;
    col[i * 3] = lerp(1.0, 0.86, toast) * char;
    col[i * 3 + 1] = lerp(0.93, 0.62, toast) * char;
    col[i * 3 + 2] = lerp(0.8, 0.36, toast) * char;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/* ------------------------------------------------------------ toppings */
function toppingKit() {
  const std = (color, rough, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: 0, envMapIntensity: 0.6 }, extra || {}));
  const flatRing = (r, t, arc) => { const g = new THREE.TorusGeometry(r, t, 8, 22, arc || Math.PI * 2); g.rotateX(Math.PI / 2); g.scale(1, 0.75, 1); return g; };

  const mushShape = new THREE.Shape();
  mushShape.moveTo(-0.024, -0.07); mushShape.lineTo(0.024, -0.07); mushShape.lineTo(0.026, 0);
  mushShape.lineTo(0.08, 0); mushShape.quadraticCurveTo(0.082, 0.09, 0, 0.088);
  mushShape.quadraticCurveTo(-0.082, 0.09, -0.08, 0); mushShape.lineTo(-0.026, 0); mushShape.closePath();
  const mushGeo = new THREE.ExtrudeGeometry(mushShape, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 10 });
  mushGeo.rotateX(-Math.PI / 2);

  const paneerGeo = new RoundedBoxGeometry(0.09, 0.055, 0.09, 2, 0.014);
  const pc = new Float32Array(paneerGeo.attributes.position.count * 3);
  for (let i = 0; i < paneerGeo.attributes.position.count; i++) {
    const top = paneerGeo.attributes.position.getY(i) > 0.02;
    pc.set(top ? [0.93, 0.76, 0.5] : [1, 0.98, 0.93], i * 3);
  }
  paneerGeo.setAttribute('color', new THREE.BufferAttribute(pc, 3));

  const kernel = new THREE.SphereGeometry(0.027, 10, 8); kernel.scale(1, 0.72, 0.9);
  const seedDisc = new THREE.CylinderGeometry(0.054, 0.054, 0.014, 18);
  const strip = flatRing(0.15, 0.021, Math.PI * 0.55);

  const M = {
    olive: std('#1b1815', 0.28),
    jalapeno: std('#3f7d27', 0.42),
    seeds: std('#cdd896', 0.6),
    green: std('#2d7b2e', 0.38),
    red: std('#c9271d', 0.36),
    yellow: std('#f2b31b', 0.38),
    corn: std('#f6c232', 0.42),
    mush: std('#dcc4a3', 0.7),
    paneer: std('#ffffff', 0.72, { vertexColors: true }),
    onion: std('#9a5788', 0.4)
  };
  const G = { olive: flatRing(0.06, 0.025), jal: flatRing(0.074, 0.021), seedDisc, strip, kernel, mush: mushGeo, paneer: paneerGeo, onion: flatRing(0.11, 0.011, Math.PI * 0.8) };

  function make(type, rand) {
    const grp = new THREE.Group();
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; grp.add(m); return m; };
    switch (type) {
      case 'olive': add(G.olive, M.olive, 0, 0.012); break;
      case 'jalapeno': add(G.jal, M.jalapeno, 0, 0.012); add(G.seedDisc, M.seeds, 0, 0.006); break;
      case 'green': add(G.strip, M.green, 0, 0.012); break;
      case 'red': add(G.strip, M.red, 0, 0.012); break;
      case 'yellow': add(G.strip, M.yellow, 0, 0.012); break;
      case 'corn': for (let k = 0; k < 3; k++) add(G.kernel, M.corn, (rand() - 0.5) * 0.09, 0.014, (rand() - 0.5) * 0.09); break;
      case 'mush': add(G.mush, M.mush, 0, 0.004); break;
      case 'paneer': add(G.paneer, M.paneer, 0, 0.024); break;
      case 'onion': add(G.onion, M.onion, 0, 0.01); break;
    }
    return grp;
  }
  return { make };
}

/* ------------------------------------------------------------ the scene */
function boot(host) {
  const fallback = host.querySelector('.pizza3d__fallback');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 3.05, 5.1);
  camera.lookAt(0, 0.1, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;

  /* lights: warm oven light from the left, a red rim like the ceiling grid */
  const key = new THREE.DirectionalLight(0xfff0d8, 2.5);
  key.position.set(-3.1, 5.4, 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 14;
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.bias = -0.0015;
  key.shadow.radius = 3;
  scene.add(key);
  const rim = new THREE.PointLight(0xe8312f, 34, 14, 2);
  rim.position.set(2.9, 1.5, -3.2);
  scene.add(rim);
  const warm = new THREE.PointLight(0xffb15c, 12, 10, 2);
  warm.position.set(-1.4, 1.1, 2.4);
  scene.add(warm);
  scene.add(new THREE.AmbientLight(0xfff2e2, 0.5));

  /* ---------------------------------------------------------- materials */
  const texSize = dpr > 1.4 ? 1024 : 768;
  const cheeseMat = new THREE.MeshPhysicalMaterial({
    map: cheeseTexture(texSize), roughness: 0.4, metalness: 0,
    clearcoat: 0.45, clearcoatRoughness: 0.42, envMapIntensity: 0.8
  });
  const doughMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.88, metalness: 0 });
  const crustMat = new THREE.MeshStandardMaterial({ map: crustTexture(), vertexColors: true, roughness: 0.82, metalness: 0, envMapIntensity: 0.5 });
  const stringMat = new THREE.MeshStandardMaterial({ color: 0xf6d278, roughness: 0.35, metalness: 0, transparent: true, opacity: 0, envMapIntensity: 0.9 });

  /* -------------------------------------------------------------- peel */
  const peel = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(texSize), roughness: 0.72, metalness: 0, envMapIntensity: 0.35 });
  const board = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.42, R + 0.42, 0.1, 64), woodMat);
  board.position.y = -0.055;
  board.receiveShadow = true;
  peel.add(board);
  const handle = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.085, 1.5, 2, 0.04), woodMat);
  handle.position.set(0, -0.055, R + 1.08);
  handle.receiveShadow = true; handle.castShadow = true;
  peel.add(handle);
  scene.add(peel);

  /* -------------------------------------------------------- the pizza */
  const pizza = new THREE.Group();
  scene.add(pizza);
  const kit = toppingKit();
  const rand = rng(97);
  const TOPPINGS = ['olive', 'jalapeno', 'green', 'red', 'yellow', 'corn', 'mush', 'paneer', 'onion'];
  const slices = [];

  for (let i = 0; i < N; i++) {
    const a0 = i * STEP + GAP, a1 = (i + 1) * STEP - GAP;
    const g = new THREE.Group();
    const base = new THREE.Mesh(wedgeGeometry(a0, a1), [cheeseMat, doughMat]);
    base.castShadow = true; base.receiveShadow = true;
    g.add(base);
    const crust = new THREE.Mesh(crustGeometry(a0, a1), crustMat);
    crust.castShadow = true; crust.receiveShadow = true;
    g.add(crust);
    // toppings, kept inside the rim and off the knife lines
    for (let k = 0; k < 7; k++) {
      const type = TOPPINGS[(i * 3 + k) % TOPPINGS.length];
      const a = lerp(a0 + 0.1, a1 - 0.1, (k + 0.25 + rand() * 0.5) / 7);
      const r = (0.3 + Math.sqrt(rand()) * 0.78) * (R - TUBE - 0.06);
      const m = kit.make(type, rand);
      m.position.copy(polar(r, a, D));
      m.rotation.y = rand() * Math.PI * 2;
      m.rotation.z = (rand() - 0.5) * 0.18;
      g.add(m);
    }
    g.userData = { a0: a0, a1: a1, mid: (a0 + a1) / 2 };
    pizza.add(g);
    slices.push(g);
  }

  /* ------------------------------------------------- the slice that lifts */
  const PULL = slices[0];                        // bisector points right and away
  const dir = polar(1, PULL.userData.mid, 0).normalize();
  const tangent = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
  const tiltQ = new THREE.Quaternion();
  pizza.remove(PULL);
  const pullHolder = new THREE.Group();          // spins with the pie, moves on its own
  pullHolder.add(PULL);
  scene.add(pullHolder);

  /* cheese strings: three per cut face, sagging between pie and slice */
  const STRINGS = [];
  const stringGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  const strands = new THREE.Group();
  pizza.add(strands);                            // so they turn with the pie
  [PULL.userData.a0, PULL.userData.a1].forEach(function (ang) {
    [0.52, 0.95, 1.32].forEach(function (r, k) {
      const segs = [];
      for (let s = 0; s < 3; s++) {
        const m = new THREE.Mesh(stringGeo, stringMat);
        m.visible = false;
        strands.add(m);
        segs.push(m);
      }
      STRINGS.push({ segs: segs, anchor: polar(r, ang, D * 0.85), thick: 0.026 - k * 0.004, sag: 0.1 + k * 0.05 });
    });
  });

  const A = new THREE.Vector3(), B = new THREE.Vector3(), Mid = new THREE.Vector3();
  const P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), Dv = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  function segment(mesh, from, to, thick) {
    Mid.copy(from).add(to).multiplyScalar(0.5);
    mesh.position.copy(Mid);
    const len = from.distanceTo(to);
    mesh.scale.set(thick, Math.max(len, 0.0001), thick);
    mesh.quaternion.setFromUnitVectors(UP, Dv.copy(to).sub(from).normalize());
  }
  // anchors and the slice both live in the pie's own space, so the strings
  // can be built in local coordinates and still follow the spin.
  function drawStrings(e) {
    const on = e > 0.015 && e < 0.995;
    stringMat.opacity = on ? Math.min(1, e * 4) * (1 - Math.max(0, (e - 0.76) / 0.24)) : 0;
    for (let i = 0; i < STRINGS.length; i++) {
      const st = STRINGS[i];
      if (!on) { st.segs[0].visible = st.segs[1].visible = st.segs[2].visible = false; continue; }
      A.copy(st.anchor);
      B.copy(st.anchor).applyQuaternion(PULL.quaternion).add(PULL.position);
      const stretch = A.distanceTo(B);
      const droop = st.sag * Math.min(1.4, stretch * 1.1);
      for (let s = 0; s < 3; s++) {
        const t0 = s / 3, t1 = (s + 1) / 3;
        P0.lerpVectors(A, B, t0); P0.y -= Math.sin(t0 * Math.PI) * droop;
        P1.lerpVectors(A, B, t1); P1.y -= Math.sin(t1 * Math.PI) * droop;
        st.segs[s].visible = true;
        segment(st.segs[s], P0, P1, Math.max(0.006, st.thick * (1 - stretch * 0.2)));
      }
    }
  }

  /* ------------------------------------------------------------- steam */
  const steam = new THREE.Group();
  const puffTex = softDot(128, 'rgba(255,248,236,0.5)', 'rgba(255,248,236,0)');
  const puffs = [];
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 }));
    s.userData = { t: i / 16, x: (rand() - 0.5) * 1.9, z: (rand() - 0.5) * 1.9, sp: 0.1 + rand() * 0.09, sc: 0.5 + rand() * 0.7 };
    steam.add(s);
    puffs.push(s);
  }
  scene.add(steam);

  /* ------------------------------------------------------------ resize */
  function size() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.95 ? 40 : 32;
    camera.updateProjectionMatrix();
  }
  size();
  if (window.ResizeObserver) new ResizeObserver(size).observe(host);
  else window.addEventListener('resize', size);

  /* -------------------------------------------------------------- drag */
  let spin = -0.25, vel = 0, drag = null;
  host.addEventListener('pointerdown', function (e) {
    drag = { x: e.clientX, id: e.pointerId };
    if (host.setPointerCapture) host.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    drag.x = e.clientX;
    vel += dx * 0.00042;
    spin += dx * 0.006;
  });
  function endDrag(e) { if (drag && (!e || e.pointerId === drag.id)) drag = null; }
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', endDrag);

  /* -------------------------------------------------------------- lift */
  let lift = 0, shown = 0;
  function setLift(v) { lift = clamp(v, 0, 1); }

  let visible = true;
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (ents) { visible = ents[0].isIntersecting; }, { rootMargin: '150px' }).observe(host);
  }

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    if (visible) {
      shown += (lift - shown) * (reduce ? 1 : 0.12);
      const e = smooth(shown);

      if (!drag) { spin += (reduce ? 0 : 0.055) * dt + vel; vel *= 0.94; }
      pizza.rotation.y = spin;
      pullHolder.rotation.y = spin;
      peel.rotation.y = spin * 0.35;

      // the pie breathes a little; the pulled slice rides up and out
      const bob = Math.sin(t * 0.7) * 0.012;
      pizza.position.y = bob;
      PULL.position.copy(dir).multiplyScalar(0.62 * e);
      PULL.position.y = 1.02 * e + bob;
      tiltQ.setFromAxisAngle(tangent, -0.42 * e);
      PULL.quaternion.copy(tiltQ);
      drawStrings(e);

      camera.position.y = 3.05 + e * 0.5;
      camera.lookAt(0, 0.1 + e * 0.24, 0);
      rim.intensity = 34 + e * 22;

      for (let i = 0; i < puffs.length; i++) {
        const s = puffs[i], u = s.userData;
        u.t += dt * u.sp;
        if (u.t > 1) { u.t -= 1; u.x = (rand() - 0.5) * 1.9; u.z = (rand() - 0.5) * 1.9; }
        s.position.set(u.x + Math.sin(u.t * 5 + u.z) * 0.2, 0.18 + u.t * 1.9, u.z);
        s.scale.setScalar(u.sc * (0.5 + u.t * 1.5));
        s.material.opacity = Math.sin(u.t * Math.PI) * 0.4 * (reduce ? 0.5 : 1);
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }

  // one frame up front so nothing pops in a moment later
  renderer.render(scene, camera);
  host.classList.add('is-live');
  if (fallback) fallback.setAttribute('aria-hidden', 'true');
  requestAnimationFrame(frame);

  const PS = window.PS = window.PS || {};
  PS.pizza = { setLift: setLift, renderer: renderer, scene: scene, camera: camera };
  if (typeof PS.lift === 'number') setLift(PS.lift);
}

/* boot last, so every const above is initialised */
const host = document.querySelector('[data-pizza3d]');
if (host) {
  try { boot(host); } catch (err) { console.warn('[pizza3d] falling back to the photo:', err); }
}
