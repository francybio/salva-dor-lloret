/* ==========================================================
   SALVA D'OR — anillo en 3D (three.js)
   Un solo renderer que se muda entre la portada y el configurador
   según cuál se ve. La banda es un torneado (LatheGeometry) de
   sección redondeada; la piedra, un brillante facetado con
   transmisión e índice de refracción real; las garras, cilindros;
   el pavé y la media alianza, brillantes pequeños a lo largo del
   aro. Unos destellos (sprites) parpadean sobre la corona.
   Configuración: evento «ring:config» lanzado por app.js.
   ========================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const STATIC = /[?&]static\b/.test(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || STATIC;
const stages = [...document.querySelectorAll('.stage')];
const mounts = { hero: document.getElementById('heroMount'), cfg: document.getElementById('cfgMount') };

const METAL = { amarillo: 0xE6B95E, blanco: 0xE4E5E8, rosa: 0xE9A78C };
const GEM = {
  diamante: { color: 0xFFFFFF, ior: 2.42, att: Infinity },
  esmeralda: { color: 0x2FBF78, ior: 1.58, att: 1.1 },
  zafiro: { color: 0x2F5BDA, ior: 1.77, att: .9 },
  rubi: { color: 0xE0203F, ior: 1.77, att: .9 }
};
const R_IN = 1, MM = 8.5;                 // 1 unidad = 8,5 mm (radio interior de una talla ~13)
const ctToD = (ct) => 1.2 * 6.5 * Math.cbrt(ct) / MM; // diámetro de un brillante según sus quilates

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  stages.forEach((s) => s.classList.add('is-fallback'));
  throw e;
}
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, .1, 100);
camera.position.set(0, .55, 6.4);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, .38, 0);
controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = .08;
controls.autoRotate = !reduced; controls.autoRotateSpeed = 1.5;
controls.minPolarAngle = .55; controls.maxPolarAngle = 2.1;
let idleT = 0;
controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(idleT); });
controls.addEventListener('end', () => { clearTimeout(idleT); if (!reduced) idleT = setTimeout(() => { controls.autoRotate = true; }, 2600); });

/* --- entorno de estudio: cajas de luz sobre fondo oscuro --- */
(() => {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x0d0f14, side: THREE.BackSide })));
  const panel = (w, h, pos, c) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...c), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(8, 2.4, [0, 9, 2], [6, 6, 6]);
  panel(2.2, 7, [-9, 1, 3], [3.2, 3.2, 3.4]);
  panel(2.2, 7, [9, 1, 3], [3.2, 3.2, 3.4]);
  panel(5, 1.2, [0, -4, 9], [2.4, 2.4, 2.4]);
  panel(1.3, 1.3, [3, 6, 7], [12, 12, 12]);
  panel(1.1, 1.1, [-5, 4, -7], [9, 9, 9]);
  panel(6, 3, [-6, -3, -6], [2.6, 1.9, 1.1]);
  panel(4, 2, [6, -2, -7], [1.4, 1.6, 2.2]);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(s, .02).texture;
  pm.dispose();
})();

/* --- sombra suave bajo el anillo --- */
const shadow = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = -1.32;
  scene.add(m);
  return m;
})();

/* --- textura de destello --- */
const starTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.12, 'rgba(255,255,255,.8)'); gr.addColorStop(.35, 'rgba(255,255,255,.08)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(32, 2); g.lineTo(32, 62); g.moveTo(2, 32); g.lineTo(62, 32); g.stroke();
  g.lineWidth = .7; g.beginPath(); g.moveTo(12, 12); g.lineTo(52, 52); g.moveTo(52, 12); g.lineTo(12, 52); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

/* --- geometrías --- */
const bandGeo = (rIn, thick, width, y0 = 0) => {
  const pts = []; const a = thick / 2, b = width / 2, cx = rIn + a, n = 56, e = 3.2;
  for (let i = n; i >= 0; i--) {
    const t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    pts.push(new THREE.Vector2(cx + a * Math.sign(c) * Math.abs(c) ** (2 / e), y0 + b * Math.sign(s) * Math.abs(s) ** (2 / e)));
  }
  const g = new THREE.LatheGeometry(pts, 220);
  g.rotateX(Math.PI / 2);
  return g;
};
const brilliant = (segs = 16) => {
  const p = [[.001, -.43], [.5, -.012], [.5, .012], [.38, .1], [.27, .155], [.001, .155]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(p, segs).toNonIndexed();
  g.computeVertexNormals();
  return g;
};
const GEO_BIG = brilliant(16), GEO_SMALL = brilliant(8);
const sphere = new THREE.SphereGeometry(1, 12, 10);
const rod = (a, b, r, mat) => {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * .8, r, len, 10), mat);
  m.position.copy(a).addScaledVector(d, .5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  const tip = new THREE.Mesh(sphere, mat); tip.scale.setScalar(r * .95); tip.position.copy(b);
  const g = new THREE.Group(); g.add(m, tip); return g;
};

/* --- materiales --- */
const metalMat = (k) => new THREE.MeshPhysicalMaterial({ color: METAL[k], metalness: 1, roughness: .14, envMapIntensity: 1.35 });
const gemMat = (k) => {
  const g = GEM[k];
  return new THREE.MeshPhysicalMaterial({
    color: g.color, metalness: 0, roughness: 0, transmission: 1, thickness: .7, ior: g.ior,
    attenuationColor: g.color, attenuationDistance: g.att, specularIntensity: 1, specularColor: 0xffffff,
    envMapIntensity: k === 'diamante' ? 3.2 : 2.2, flatShading: true, transparent: false
  });
};
const smallMat = (k) => new THREE.MeshStandardMaterial({ color: k === 'diamante' ? 0xffffff : GEM[k].color, metalness: .25, roughness: .02, envMapIntensity: 4, flatShading: true });

/* --- construcción del anillo --- */
let ring = null, glints = [];
const cfg = Object.assign({ model: 'solitario', metal: 'amarillo', gem: 'diamante', shape: 'redonda', ct: .5 }, window.__ringConfig || {});

const disposeGroup = (g) => g.traverse((o) => { if (o.geometry && o.geometry !== GEO_BIG && o.geometry !== GEO_SMALL && o.geometry !== sphere) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });

const build = () => {
  if (ring) { scene.remove(ring); disposeGroup(ring); }
  ring = new THREE.Group(); glints = [];
  const bi = cfg.metal === 'bicolor';
  const mBand = metalMat(bi ? 'amarillo' : cfg.metal);
  const mHead = metalMat(bi ? 'blanco' : cfg.metal);
  const thick = .15;
  let rOut = R_IN + thick;

  if (cfg.model === 'alianza') {
    if (bi) {
      ring.add(new THREE.Mesh(bandGeo(R_IN, thick + .01, .2, 0), mBand));
      ring.add(new THREE.Mesh(bandGeo(R_IN, thick, .12, -.16), mHead));
      ring.add(new THREE.Mesh(bandGeo(R_IN, thick, .12, .16), mHead.clone()));
    } else ring.add(new THREE.Mesh(bandGeo(R_IN, thick, .42), mBand));
    rOut = R_IN + thick;
  } else {
    ring.add(new THREE.Mesh(bandGeo(R_IN, thick, cfg.model === 'media' ? .34 : .27), mBand));
  }

  const addGlints = (parent, n, radius, y) => {
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      const a = Math.random() * Math.PI * 2, r = Math.random() * radius;
      sp.position.set(Math.cos(a) * r, y + Math.random() * .02, Math.sin(a) * r);
      sp.userData = { ph: Math.random() * 10, sp: 1.2 + Math.random() * 2.4, s: .1 + Math.random() * .14 };
      sp.scale.setScalar(0);
      parent.add(sp); glints.push(sp);
    }
  };

  if (cfg.model === 'solitario' || cfg.model === 'pave') {
    const d = ctToD(cfg.ct);
    const ov = cfg.shape === 'oval';
    const sx = ov ? 1.32 : 1, sz = ov ? .9 : 1;
    const girdleY = rOut + .06 + .43 * d;
    // piedra
    const stone = new THREE.Group();
    const gem = new THREE.Mesh(GEO_BIG, gemMat(cfg.gem));
    gem.scale.set(d * sx, d, d * sz);
    stone.add(gem);
    stone.position.y = girdleY;
    // destellos sobre la corona
    addGlints(stone, cfg.gem === 'diamante' ? 9 : 5, d * .42 * sx, d * .14);
    ring.add(stone);
    // cesta: dos aros bajo la piedra
    const basket1 = new THREE.Mesh(new THREE.TorusGeometry(d * .36, .022, 8, 40), mHead); basket1.rotation.x = Math.PI / 2; basket1.scale.set(sx, sz, 1); basket1.position.y = girdleY - d * .2;
    const basket2 = new THREE.Mesh(new THREE.TorusGeometry(d * .2, .02, 8, 32), mHead); basket2.rotation.x = Math.PI / 2; basket2.position.y = rOut + .04;
    ring.add(basket1, basket2);
    // garras
    const n = ov ? 4 : (d > .6 ? 6 : 4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (n === 4 ? Math.PI / 4 : 0);
      const ca = Math.cos(a), sa = Math.sin(a);
      const bottom = new THREE.Vector3(ca * d * .16, rOut - .01, sa * d * .16 * .7);
      const top = new THREE.Vector3(ca * d * .5 * sx * 1.02, girdleY + d * .07, sa * d * .5 * sz * 1.02);
      ring.add(rod(bottom, top, .028 + d * .012, mHead));
    }
    // pavé en los hombros
    if (cfg.model === 'pave') {
      const ds = .095, sm = smallMat('diamante');
      const start = 90 + 16 + d * 12;
      for (const side of [-1, 1]) {
        for (let k = 0; k < 9; k++) {
          const th = THREE.MathUtils.degToRad(90 + side * (start - 90 + k * 7.2));
          const rad = new THREE.Vector3(Math.cos(th), Math.sin(th), 0);
          const st = new THREE.Mesh(GEO_SMALL, sm);
          st.scale.setScalar(ds);
          st.position.copy(rad).multiplyScalar(rOut + .004);
          st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rad);
          ring.add(st);
          for (const z of [-1, 1]) {
            const bead = new THREE.Mesh(sphere, mHead); bead.scale.setScalar(.017);
            const th2 = th + side * THREE.MathUtils.degToRad(3.6);
            bead.position.set(Math.cos(th2) * (rOut + .02), Math.sin(th2) * (rOut + .02), z * .075);
            ring.add(bead);
          }
        }
      }
    }
  }

  if (cfg.model === 'media') {
    const N = 13, ds = Math.min(.25, ctToD(cfg.ct / N) * 1.05);
    const sm = smallMat(cfg.gem);
    for (let k = 0; k < N; k++) {
      const th = THREE.MathUtils.degToRad(18 + k * (144 / (N - 1)));
      const rad = new THREE.Vector3(Math.cos(th), Math.sin(th), 0);
      const st = new THREE.Mesh(GEO_SMALL, sm);
      st.scale.setScalar(ds);
      st.position.copy(rad).multiplyScalar(rOut + .002);
      st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rad);
      ring.add(st);
      if (k % 3 === 1) addGlints(st, 1, .3, .16);
    }
    for (const z of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.TorusGeometry(rOut + .025, .028, 10, 90, THREE.MathUtils.degToRad(160)), mHead);
      rail.rotation.z = THREE.MathUtils.degToRad(10);
      rail.position.z = z * (ds / 2 + .022);
      ring.add(rail);
    }
  }
  if (cfg.model === 'alianza') addGlints(ring, 3, .01, rOut + .02);

  ring.rotation.set(-.12, .5, 0);
  scene.add(ring);
  // encuadre: que quepa la piedra más alta
  let topY = rOut + .05;
  if (cfg.model === 'solitario' || cfg.model === 'pave') { const d = ctToD(cfg.ct); topY = rOut + .06 + .43 * d + .2 * d; }
  frame.top = topY; frame.bottom = -(R_IN + .15);
  fit();
  render();
};
const frame = { top: 1.4, bottom: -1.15 };
function fit() {
  const h = frame.top - frame.bottom, cy = (frame.top + frame.bottom) / 2;
  const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const vDist = (h / 2 * 1.28) / half;
  const hDist = (1.35 * 1.25) / (half * Math.max(.5, camera.aspect));
  const dist = Math.min(11, Math.max(5.6, vDist, hDist));
  controls.target.set(0, cy, 0);
  const dir = camera.position.clone().sub(controls.target);
  if (dir.lengthSq() < 1e-6) dir.set(0, .1, 1);
  camera.position.copy(controls.target).add(dir.setLength(dist));
  shadow.position.y = frame.bottom - .12;
}

/* --- montaje: el canvas vive donde se ve --- */
let current = null, ratios = { hero: 0, cfg: 0 }, running = false;
const resize = () => {
  if (!current) return;
  const el = mounts[current], w = el.clientWidth, h = el.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < .9 ? 34 : 28;
  camera.updateProjectionMatrix();
  fit();
};
const mountTo = (key) => {
  if (current === key) return;
  current = key;
  mounts[key].appendChild(renderer.domElement);
  resize(); render();
};
const io = new IntersectionObserver((ens) => {
  ens.forEach((en) => { ratios[en.target.dataset.k] = en.isIntersecting ? en.intersectionRatio : 0; });
  const best = ratios.cfg > ratios.hero ? 'cfg' : (ratios.hero > 0 ? 'hero' : (ratios.cfg > 0 ? 'cfg' : null));
  if (best) { mountTo(best); start(); } else running = false;
}, { threshold: [0, .1, .25, .5, .75, 1] });
mounts.hero.dataset.k = 'hero'; mounts.cfg.dataset.k = 'cfg';
io.observe(mounts.hero); io.observe(mounts.cfg);

/* --- bucle --- */
const clock = new THREE.Clock();
function render() {
  const t = clock.getElapsedTime();
  glints.forEach((g) => { const u = g.userData; const v = Math.max(0, Math.sin(t * u.sp + u.ph)); g.scale.setScalar(u.s * v ** 10); });
  controls.update();
  renderer.render(scene, camera);
}
function loop() { if (!running) return; render(); requestAnimationFrame(loop); }
function start() { if (running || STATIC) { render(); return; } running = true; requestAnimationFrame(loop); }

window.addEventListener('resize', () => { resize(); render(); });
document.addEventListener('ring:config', (e) => { Object.assign(cfg, e.detail || {}); build(); });
build();
if (!current) mountTo('hero');
if (STATIC) { clock.elapsedTime = 2.3; render(); }
document.documentElement.classList.add('has-3d');
