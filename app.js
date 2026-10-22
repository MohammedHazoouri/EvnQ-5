(() => {
'use strict';
/* ====== CONFIG — change the name here, or open index.html?name=Sara ====== */
const CONFIG = { name: 'Alex' };            // '' = neutral greeting
/* ======================================================================= */
const $ = s => document.querySelector(s);
const NAME = new URLSearchParams(location.search).has('name') ? new URLSearchParams(location.search).get('name') : CONFIG.name;
['forName', 'forName2'].forEach(id => $('#' + id).textContent = NAME ? 'FOR ' + NAME.toUpperCase() : '');
$('#s5 .btn').dataset.d = 5.8;

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth < 700;
const SPEED = reduce ? .35 : 1, PN = reduce ? .4 : (mobile ? .55 : 1);
const hideLoader = () => $('#loader').classList.add('off');
const fail = () => { hideLoader(); $('#ui').style.display = 'none'; $('#gl').style.display = 'none'; $('#fallback').hidden = false; };
setTimeout(hideLoader, 4000);

let renderer;
try {
  if (!window.THREE) throw 0;
  renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: !mobile, powerPreference: 'high-performance' });
} catch (e) { fail(); return; }
$('#gl').addEventListener('webglcontextlost', fail);

try {
/* ---------- renderer / scene ---------- */
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene();
scene.background = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#07111F'; x.fillRect(0,0,512,512);
  [[.25,.2,.55,'123,77,255,.42'],[.8,.75,.5,'232,69,124,.32'],[.7,.15,.4,'46,196,182,.26'],[.15,.85,.4,'255,122,89,.2']].forEach(([a,b,r,k]) => {
    const g = x.createRadialGradient(a*512,b*512,0,a*512,b*512,r*512); g.addColorStop(0,'rgba('+k+')'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0,0,512,512); });
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
scene.fog = new THREE.FogExp2(0x07111F, .017);
const camera = new THREE.PerspectiveCamera(45, 1, .1, 250);

// tiny studio environment so the metals have something to reflect
const envS = new THREE.Scene();
envS.add(new THREE.Mesh(new THREE.SphereGeometry(20, 16, 16), new THREE.MeshBasicMaterial({ color: 0x101E38, side: THREE.BackSide })));
[[0,12,0,10,.5,10,0xfff0d0],[12,2,6,.5,8,8,0xF6D99B],[-12,3,-4,.5,8,8,0x8fb0ff],[0,-3,14,10,4,.5,0xffffff]].forEach(([x,y,z,w,h,d,c]) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(4) }));
  m.position.set(x,y,z); envS.add(m);
});
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envS, .02).texture;

const hemi = new THREE.HemisphereLight(0x8fb0ff, 0x101E38, .35);
const key = new THREE.DirectionalLight(0xF6D99B, 1.6); key.position.set(5, 8, 6);
const rim = new THREE.PointLight(0x4f7bff, 1.2, 40); rim.position.set(-8, 3, -6);
const candleLight = new THREE.PointLight(0xffb454, 0, 12); candleLight.position.set(0, 3.5, 0);
const pink = new THREE.PointLight(0xff4d9d, 1.1, 40); pink.position.set(8,3,-4);
const tealL = new THREE.PointLight(0x2ec4b6, .9, 40); tealL.position.set(-6,-2,6);
scene.add(hemi, key, rim, pink, tealL, candleLight);

/* ---------- helpers ---------- */
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const col = h => new THREE.Color(h);
const rd = () => { const u = Math.random()*2-1, t = Math.random()*6.2832, s = Math.sqrt(1-u*u); return V(s*Math.cos(t), u, s*Math.sin(t)); };
const M = (c, m=0, r=.5) => new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r });
const gold = M(0xD8B56D, 1, .28), navy = M(0x101E38, .35, .35), navyB = M(0x1b2f5c, .3, .35), blush = M(0xFFC2D6, 0, .5), violet = M(0x6D4AE0, .2, .35), rose = M(0xE8457C, .2, .3), teal = M(0x2EC4B6, .2, .3), gbox = M(0x3A1C78, .35, .3), ivory = M(0xFFF5E6, 0, .55);

const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'#fff'); g.addColorStop(.3,'rgba(255,255,255,.6)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
const pmat = (size, op=1) => new THREE.PointsMaterial({ size, map: tex, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true });
const mkPoints = (p, c, size, op) => { const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, pmat(size, op)); };
function field(n, r0, r1, size, cols) {
  const p = new Float32Array(n*3), c = new Float32Array(n*3);
  for (let i = 0; i < n; i++) { const v = rd().multiplyScalar(r0 + Math.random()*(r1-r0)), k = col(cols[i % cols.length]);
    p.set([v.x,v.y,v.z], i*3); c.set([k.r,k.g,k.b], i*3); }
  return mkPoints(p, c, size, 1);
}
const stars = field(900*PN|0, 40, 90, .55, [0xffffff, 0xbcd0ff, 0xF6D99B, 0xffb3d9, 0x9ff3e6]);
const dust = field(160*PN|0, 3, 16, .12, [0xF6D99B, 0xD8B56D, 0xff7ab0, 0x5eead4, 0xa78bfa]);
scene.add(stars, dust);

/* particle bursts */
const bursts = [];
function burst(pos, n, speed, cols = [0xD8B56D, 0xF6D99B, 0xFFF5E6, 0xff7ab0, 0x5eead4, 0xa78bfa], o = {}) {
  const { up = 0, g = 0, life = 2.2, size = .14 } = o;
  n = Math.round(n * PN); const p = new Float32Array(n*3), c = new Float32Array(n*3), v = [];
  for (let i = 0; i < n; i++) { const d = rd(); d.y += up; v.push(d.multiplyScalar(speed * (.4 + Math.random()*.8)));
    p.set([pos.x,pos.y,pos.z], i*3); const k = col(cols[i % cols.length]); c.set([k.r,k.g,k.b], i*3); }
  const pts = mkPoints(p, c, size, 1); scene.add(pts); bursts.push({ pts, v, t: 0, life, g });
}

/* tweens */
const tw = [];
const e3 = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2, eo = t => 1-Math.pow(1-t,3), eb = t => 1+2.70158*Math.pow(t-1,3)+1.70158*Math.pow(t-1,2);
const T = (d, fn, ease = e3) => new Promise(res => tw.push({ t: 0, d: Math.max(d*SPEED, .001), fn, ease, res }));
const sleep = ms => new Promise(r => setTimeout(r, ms*SPEED));

/* camera */
const camBase = V(), look = V(), ptr = { x:0, y:0, sx:0, sy:0 };
const F = () => { const a = innerWidth/innerHeight; return a < .75 ? 1.55 : a < 1 ? 1.25 : 1; };
function cam(x,y,z,lx,ly,lz,d=2.5) {
  const p0 = camBase.clone(), l0 = look.clone(), p1 = V(x,y,z*F()), l1 = V(lx,ly,lz);
  return T(d, t => { camBase.lerpVectors(p0,p1,t); look.lerpVectors(l0,l1,t); });
}
const lightsTo = (k,h,r,d=1.5) => { const a = [key.intensity, hemi.intensity, rim.intensity];
  return T(d, t => { key.intensity = a[0]+(k-a[0])*t; hemi.intensity = a[1]+(h-a[1])*t; rim.intensity = a[2]+(r-a[2])*t; }); };
const expTo = (v,d=1.5) => { const a = renderer.toneMappingExposure; return T(d, t => renderer.toneMappingExposure = a+(v-a)*t); };
addEventListener('pointermove', e => { ptr.x = e.clientX/innerWidth-.5; ptr.y = e.clientY/innerHeight-.5; });
const resize = () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); };
addEventListener('resize', resize); resize();

/* ---------- scene builders ---------- */
function buildSphere() {
  const g = new THREE.Group();
  const gm = () => new THREE.MeshStandardMaterial({ color: 0xD8B56D, metalness: 1, roughness: .22, side: THREE.DoubleSide, transparent: true, emissive: 0xD8B56D, emissiveIntensity: .05 });
  const top = new THREE.Mesh(new THREE.SphereGeometry(1.5,48,24,0,6.2832,0,1.5708), gm());
  const bot = new THREE.Mesh(new THREE.SphereGeometry(1.5,48,24,0,6.2832,1.5708,1.5708), gm());
  const core = new THREE.Mesh(new THREE.SphereGeometry(.8,32,24), new THREE.MeshBasicMaterial({ color: 0xF6D99B, transparent: true })); core.scale.setScalar(.01);
  const light = new THREE.PointLight(0xF6D99B, 0, 12);
  const rings = [0,1,2].map(i => { const r = new THREE.Mesh(new THREE.TorusGeometry(2.1+i*.45,.025,12,128), new THREE.MeshStandardMaterial({ color: [0xD8B56D,0xff8fb1,0x5eead4][i], metalness: 1, roughness: .3, transparent: true, emissive: [0x6b5420,0x7a2040,0x0d5c52][i], emissiveIntensity: .6 }));
    r.rotation.set(1.1*i+.4, .6*i, 0); g.add(r); return r; });
  g.add(top, bot, core, light); scene.add(g);
  return { g, top, bot, core, light, rings, spd: 1, spin: 1 };
}
function buildGift() {
  const g = new THREE.Group();
  const b = (w,h,d,m,x,y,z,p = g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m); o.position.set(x,y,z); p.add(o); return o; };
  const rm = new THREE.MeshStandardMaterial({ color: 0xD8B56D, metalness: .7, roughness: .3, transparent: true });
  b(2.4,1.7,2.4,gbox,0,-.3,0);
  const lid = new THREE.Group(); lid.position.set(0,.55,-1.3); g.add(lid);
  b(2.6,.42,2.6,gbox,0,.21,1.3,lid);
  for (const sx of [-1,1]) for (const sz of [-1,1]) { b(.12,1.72,.12,gold,sx*1.2,-.3,sz*1.2); b(.14,.44,.14,gold,sx*1.3,.21,1.3+sz*1.3,lid); }
  const rib = [];
  [[0,0,1],[0,0,-1],[1,0,0],[-1,0,0]].forEach(([dx,,dz]) => {
    const m = dz ? b(.5,1.72,1.22,rm,0,-.3,dz*.61) : b(1.22,1.72,.5,rm,dx*.61,-.3,0);
    rib.push({ m, dx, dz, x0: m.position.x, z0: m.position.z }); });
  b(.5,.44,2.64,rm,0,.21,1.3,lid); b(2.64,.44,.5,rm,0,.21,1.3,lid);
  const bow = new THREE.Group(); bow.position.set(0,.42,1.3); lid.add(bow);
  [-1,1].forEach(s => { const l = new THREE.Mesh(new THREE.TorusGeometry(.32,.075,12,32), rm); l.position.set(s*.34,.2,0); l.rotation.z = -s*.5; l.scale.y = 1.2; bow.add(l); });
  bow.add(new THREE.Mesh(new THREE.SphereGeometry(.17,16,12), rm));
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1.15,40), new THREE.MeshBasicMaterial({ color: 0xF6D99B, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI/2; glow.position.y = .5; g.add(glow);
  const light = new THREE.PointLight(0xF6D99B, 0, 12); light.position.y = .8; g.add(light);
  g.visible = false; g.scale.setScalar(.01); scene.add(g);
  return { g, lid, rib, rm, bow, glow, light };
}
function buildWorld() {
  const g = new THREE.Group(), W = { g, balloons: [], gifts: [], candles: [], lanterns: [], stars: [], click: [] };
  const mesh = (geo, m, x=0, y=0, z=0, p = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x,y,z); p.add(o); return o; };
  const cyl = (a,b,h,s=48) => new THREE.CylinderGeometry(a,b,h,s);
  const tor = (R,r,arc = 6.2832) => new THREE.TorusGeometry(R,r,12,64,arc);
  const dark = M(0x0b1730, .4, .4);
  // platform
  mesh(cyl(4.4,4.6,.5,64), navy, 0,-.25,0); mesh(cyl(3.6,4.4,.6,64), dark, 0,-.8,0); mesh(cyl(3.6,.5,2.4,48), dark, 0,-2.3,0);
  mesh(tor(4.4,.07), gold, 0,0,0).rotation.x = Math.PI/2; mesh(tor(2.3,.03), gold, 0,.01,0).rotation.x = Math.PI/2;
  // cake
  const cake = new THREE.Group(); g.add(cake); W.cake = cake;
  [[1.6,1,blush,0],[1.15,.9,violet,1],[.7,.8,ivory,1.9]].forEach(([r,h,m,y]) => {
    mesh(cyl(r,r,h), m, 0,y+h/2,0, cake);
    mesh(tor(r+.01,.05), gold, 0,y+.12,0, cake).rotation.x = Math.PI/2;
    mesh(tor(r-.02,.1), ivory, 0,y+h,0, cake).rotation.x = Math.PI/2; });
  const pearl = new THREE.SphereGeometry(.07,12,8);
  for (let i = 0; i < 24; i++) { const a = i/24*6.2832; mesh(pearl, gold, Math.cos(a)*1.63,.08,Math.sin(a)*1.63, cake); }
  for (let i = 0; i < 5; i++) { const a = i/5*6.2832, x = Math.cos(a)*.4, z = Math.sin(a)*.4;
    mesh(cyl(.05,.05,.55,12), i%2 ? gold : ivory, x,2.975,z, cake);
    const f = mesh(new THREE.SphereGeometry(.075,12,10), new THREE.MeshBasicMaterial({ color: 0xffd27a }), x,3.36,z, cake); f.scale.setScalar(.001);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffb454, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    s.position.set(x,3.38,z); s.scale.setScalar(.001); cake.add(s); W.candles.push({ f, s, on: false }); }
  // balloons
  [0xE8457C,0x2EC4B6,0xD8B56D,0x7B4DFF,0xFF7A59,0x3B82F6].forEach((c,i) => {
    const a = i/6*6.2832+.4, R = 3.5+(i%2)*.3, y = 2.6+(i%3)*.7, b = new THREE.Group();
    b.position.set(Math.cos(a)*R, y, Math.sin(a)*R);
    const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: .18, metalness: c === 0xD8B56D ? .8 : .1, clearcoat: 1, clearcoatRoughness: .1 });
    mesh(new THREE.SphereGeometry(.55,24,20), m, 0,0,0, b).scale.y = 1.18;
    mesh(new THREE.ConeGeometry(.1,.14,10), m, 0,-.68,0, b).rotation.x = Math.PI;
    b.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0,-.75,0), V(0,-y,0)]), new THREE.LineBasicMaterial({ color: 0xD8B56D, transparent: true, opacity: .5 })));
    b.userData = { type: 'balloon', base: y, ph: i*1.3, k: 0, c }; g.add(b); W.balloons.push(b); W.click.push(b); });
  // floating gifts
  [[-3.9,3.2,1.5],[3.9,1.6,2],[1.2,4.4,-3.6]].forEach(([x,y,z],i) => {
    const o = new THREE.Group(); o.position.set(x,y,z);
    mesh(new THREE.BoxGeometry(.8,.8,.8), [rose,teal,violet][i], 0,0,0, o);
    mesh(new THREE.BoxGeometry(.84,.84,.14), gold, 0,0,0, o); mesh(new THREE.BoxGeometry(.14,.84,.84), gold, 0,0,0, o);
    mesh(new THREE.SphereGeometry(.12,12,10), gold, 0,.45,0, o);
    o.userData = { type: 'gift', base: y, ph: i*2, spin: 0 }; g.add(o); W.gifts.push(o); W.click.push(o); });
  // stars
  const og = new THREE.OctahedronGeometry(.14);
  for (let i = 0; i < 14; i++) { const v = rd().multiplyScalar(5.5+Math.random()*2.5); const s = mesh(og, gold, v.x, v.y*.7+3, v.z); s.userData.sp = .4+Math.random(); W.stars.push(s); }
  // arches with lanterns
  [-1,1].forEach(s => { const a = new THREE.Group(); a.position.set(s*3.1,0,-1.9); a.rotation.y = -s*.7; g.add(a);
    mesh(cyl(.08,.1,1.3,12), ivory, -1,.65,0, a); mesh(cyl(.08,.1,1.3,12), ivory, 1,.65,0, a); mesh(tor(1,.07,Math.PI), gold, 0,1.3,0, a);
    const lc = s < 0 ? 0xff7ab0 : 0x5eead4, lm = new THREE.MeshStandardMaterial({ color: lc, emissive: lc, emissiveIntensity: 1 });
    mesh(new THREE.SphereGeometry(.12,16,12), lm, 0,1.9,0, a); mesh(new THREE.SphereGeometry(.08,12,10), lm, -1,1.35,0, a); mesh(new THREE.SphereGeometry(.08,12,10), lm, 1,1.35,0, a);
    W.lanterns.push(lm); });
  const warm = new THREE.PointLight(0xF6D99B, 1.2, 18); warm.position.set(0,5,3); g.add(warm);
  W.cakeStars = field(70*PN|0, 1, 2.6, .16, [0xF6D99B, 0xffffff]); W.cakeStars.position.set(0,2.6,0); W.cakeStars.material.opacity = 0; g.add(W.cakeStars);
  g.visible = false; g.scale.setScalar(.01); scene.add(g);
  return W;
}
let S, G, W, gp = null, step = 's1', rise = false, rt = 0, busy = false;
const build = () => { S = buildSphere(); G = buildGift(); W = buildWorld(); };
build(); camBase.set(0, .3, 9*F());

/* ---------- UI ---------- */
function show(id) {
  document.querySelectorAll('.s').forEach(s => s.classList.remove('on'));
  if (!id) return;
  const el = $('#' + id);
  [...el.children].forEach((c,i) => c.style.setProperty('--d', (c.dataset.d || i*.45) + 's'));
  el.classList.add('on');
}

/* ---------- interaction on the diorama ---------- */
const ray = new THREE.Raycaster(), mv = new THREE.Vector2();
$('#gl').addEventListener('pointerdown', e => {
  if (step !== 's3' && step !== 's6') return;
  mv.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1); ray.setFromCamera(mv, camera);
  const hit = ray.intersectObjects(W.click, true)[0]; if (!hit) return;
  let o = hit.object; while (!o.userData.type) o = o.parent;
  const p = V(); o.getWorldPosition(p);
  if (o.userData.type === 'balloon') { o.userData.k = 1.2; burst(p, 26, 2, [o.userData.c, 0xD8B56D], { life: 1.6 }); }
  else if (!o.userData.spin) { o.userData.spin = 1; const r0 = o.rotation.y; T(1.2, t => o.rotation.y = r0 + t*6.2832).then(() => o.userData.spin = 0); burst(p, 30, 2.4, undefined, { life: 1.8 }); }
});

/* ---------- the story ---------- */
const acts = {
  async enter() {
    show(null);
    await T(1.8, t => { S.spd = 1+t*12; S.spin = 1+t*6; [S.top,S.bot].forEach(m => m.material.emissiveIntensity = .05+t*.9); S.light.intensity = t*8; });
    burst(V(), 160, 5, undefined, { life: 3 }); S.core.scale.setScalar(.8);
    await T(1.6, t => { S.top.position.y = t*2.4; S.top.rotation.z = t*.7; S.bot.position.y = -t*2.4; S.bot.rotation.z = -t*.5;
      S.core.scale.setScalar(.8+t*1.2); S.rings.forEach(r => { r.scale.setScalar(1+t*2.5); r.material.opacity = 1-t; }); }, eo);
    G.g.visible = true;
    await Promise.all([cam(0,1.6,8.5,0,0,0,2.2), T(1.8, t => G.g.scale.setScalar(Math.max(.001, t)), eb),
      T(2, t => { S.g.scale.setScalar(1+t*2); [S.top,S.bot].forEach(m => m.material.opacity = 1-t); S.core.material.opacity = 1-t; S.light.intensity = 8*(1-t); })]);
    S.g.visible = false; step = 's2'; show('s2');
  },
  async unwrap() {
    show(null);
    await Promise.all([
      T(1.4, t => { G.lid.rotation.x = -t*1.95; G.lid.position.y = .55+t*.5; G.light.intensity = t*9; G.glow.material.opacity = t*.9; G.bow.position.y = .42+t*1.5; G.bow.scale.setScalar(Math.max(.001, 1-t*.9)); }),
      T(1.6, t => { G.rib.forEach(r => r.m.position.set(r.x0 + r.dx*t*1.5, -.3-t*.4, r.z0 + r.dz*t*1.5)); G.rm.opacity = 1-t*.9; })]);
    burst(V(0,.8,0), 90, 3.5, undefined, { up: 2, life: 3 });
    await sleep(1100);
    W.g.visible = true;
    await Promise.all([cam(7,3.2,11,0,1.2,0,3.2), T(2.2, t => W.g.scale.setScalar(Math.max(.001, t)), eb),
      T(2, t => { G.g.scale.setScalar(Math.max(.001, 1-t)); G.light.intensity = 9+t*10; })]);
    G.g.visible = false; G.light.intensity = 0; step = 's3'; show('s3');
  },
  async closer() {
    show(null); step = 's4';
    await Promise.all([cam(.5,2.5,6.4,0,1.9,0,2.6), expTo(.62, 2)]);
    show('s4');
  },
  async light() {
    $('#s4 [data-act=light]').hidden = true; rise = true;
    for (const c of W.candles) {
      const I0 = candleLight.intensity, p = V(); c.f.getWorldPosition(p); burst(p, 12, 1, [0xffd27a, 0xF6D99B], { up: 2, life: 2 });
      await T(.7, t => { c.f.scale.set(t, t*1.7, t); c.s.scale.setScalar(t*.8); candleLight.intensity = I0 + .7*t; }, eo); c.on = true;
    }
    await Promise.all([expTo(1, 1.4), T(1.6, t => W.cakeStars.material.opacity = t)]);
    await sleep(700); $('#more').hidden = false;
  },
  async wish() {
    $('#more .btn').hidden = true;
    const p = V(0,3.6,0); burst(p, 200, 5, undefined, { life: 2.8, size: .16 }); await sleep(350);
    burst(p, 120, 3.2, [0xFFF5E6, 0xF6D99B], { life: 3 });
    await sleep(2200);
    show('s5'); step = 's5';
    await Promise.all([cam(0,3.4,15,0,2.2,0,2.6), expTo(.9, 2)]);
  },
  async celebrate() {
    show(null); step = 's6';
    const camP = cam(0,6.5,21,0,2.4,0,4.5);
    W.balloons.forEach(b => { const y0 = b.userData.base; T(7, t => b.userData.base = y0 + t*3.2); });
    T(2, t => W.lanterns.forEach(m => m.emissiveIntensity = 1+t*2.5)); lightsTo(1.8, .5, 1.5, 2); expTo(1.15, 2);
    await sleep(500); show('s6');
    for (let i = 0; i < 6; i++) { burst(V((Math.random()-.5)*8, 7, (Math.random()-.5)*6), 45, 2.2, [0xD8B56D,0xFF5C93,0x2EC4B6,0x8B5CF6,0xFF7A59,0xFFF5E6,0x3B82F6], { up: -.2, g: 1.6, life: 4, size: .13 }); await sleep(900); }
    await camP; await sleep(1500);
    rise = false;
    const n = Math.round(800*PN), st = new Float32Array(n*3), p = new Float32Array(n*3), c = new Float32Array(n*3), cs = [0xD8B56D,0xF6D99B,0xFF7AB0,0x5EEAD4,0xA78BFA];
    for (let i = 0; i < n; i++) { const v = rd().multiplyScalar(2+Math.random()*7); v.y = v.y*.7+2; st.set([v.x,v.y,v.z], i*3); const k = col(cs[i%5]); c.set([k.r,k.g,k.b], i*3); }
    gp = mkPoints(p, c, .16, 0); scene.add(gp); show(null);
    await Promise.all([cam(0,1.5,11,0,1.5,0,3.4), T(3.4, t => {
      for (let j = 0; j < n; j++) { p[3*j] = st[3*j]*(1-t); p[3*j+1] = 1.5+(st[3*j+1]-1.5)*(1-t); p[3*j+2] = st[3*j+2]*(1-t); }
      gp.geometry.attributes.position.needsUpdate = true; gp.material.opacity = Math.min(1, t*3); W.g.scale.setScalar(Math.max(.001, 1-t)); })]);
    W.g.visible = false; candleLight.intensity = 0; burst(V(0,1.5,0), 140, 3.5, undefined, { life: 3 });
    step = 's7'; show('s7');
  },
  async again() {
    show(null); step = ''; rise = false;
    if (gp) { scene.remove(gp); gp = null; }
    [S.g, G.g, W.g].forEach(o => scene.remove(o)); build();
    key.intensity = 1.6; hemi.intensity = .35; rim.intensity = 1.2; candleLight.intensity = 0; renderer.toneMappingExposure = 1.1;
    $('#more').hidden = true; $('#more .btn').hidden = false; $('#s4 [data-act=light]').hidden = false;
    await cam(0,.3,9,0,0,0,1.8); step = 's1'; show('s1');
  }
};
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b || busy || !acts[b.dataset.act]) return;
  busy = true; try { await acts[b.dataset.act](); } catch (err) { console.error(err); } busy = false;
});
document.addEventListener('keydown', e => {
  if ((e.key !== 'Enter' && e.key !== ' ') || document.activeElement !== document.body) return;
  const b = [...document.querySelectorAll('.s.on .btn')].find(x => x.offsetParent && !x.hidden); if (b) { e.preventDefault(); b.click(); }
});

/* ---------- render loop ---------- */
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .05), time = clock.elapsedTime;
  for (let i = tw.length; i--;) { const o = tw[i]; o.t += dt; const p = Math.min(o.t/o.d, 1); o.fn(o.ease(p)); if (p >= 1) { tw.splice(i,1); o.res(); } }
  for (let i = bursts.length; i--;) { const b = bursts[i]; b.t += dt; const a = b.pts.geometry.attributes.position.array;
    for (let j = 0; j < b.v.length; j++) { const v = b.v[j]; v.y -= b.g*dt; v.multiplyScalar(1-1.2*dt); a[3*j] += v.x*dt; a[3*j+1] += v.y*dt; a[3*j+2] += v.z*dt; }
    b.pts.geometry.attributes.position.needsUpdate = true; b.pts.material.opacity = Math.max(0, 1-b.t/b.life);
    if (b.t >= b.life) { scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); bursts.splice(i,1); } }
  const fl = reduce ? 0 : 1;
  dust.rotation.y += dt*.02; stars.rotation.y += dt*.004;
  if (S.g.visible) { S.g.rotation.y += dt*.35*S.spin; S.g.position.y = Math.sin(time*.9)*.1*fl; S.rings.forEach((r,i) => { r.rotation.x += dt*(.35+.2*i)*S.spd; r.rotation.y += dt*.25*S.spd*(i%2 ? -1 : 1); }); }
  if (G.g.visible) { G.g.position.y = Math.sin(time*.9)*.12*fl; G.g.rotation.y = Math.sin(time*.4)*.45; }
  if (W.g.visible) {
    W.cake.rotation.y += dt*.12*fl;
    W.balloons.forEach(b => { const u = b.userData; u.k *= 1-3*dt; b.position.y = u.base + Math.sin(time*.9+u.ph)*.18*fl + u.k*.5; b.rotation.y += dt*.2; });
    W.gifts.forEach(o => { const u = o.userData; o.position.y = u.base + Math.sin(time*.8+u.ph)*.2*fl; if (!u.spin) o.rotation.y += dt*.5*fl; o.rotation.x = Math.sin(time*.5+u.ph)*.15; });
    W.stars.forEach(s => { s.rotation.y += dt*s.userData.sp; s.rotation.x += dt*.3; });
    W.candles.forEach((c,i) => { if (c.on) { c.f.scale.y = 1.7*(1+Math.sin(time*18+i*2)*.08); c.s.scale.setScalar(.8*(1+Math.sin(time*12+i)*.06)); } });
  }
  if (rise && (rt += dt) > .22) { rt = 0; burst(V((Math.random()-.5)*1.2, 3.2, (Math.random()-.5)*1.2), 4, 1.2, [0xF6D99B, 0xFFF5E6], { up: 2.5, life: 3.2, size: .1 }); }
  if (gp) { gp.rotation.y += dt*.2; if (step === 's7') gp.material.size = .16+Math.sin(time*2)*.03; }
  ptr.sx += (ptr.x-ptr.sx)*.04; ptr.sy += (ptr.y-ptr.sy)*.04;
  camera.position.set(camBase.x + ptr.sx*.9*fl, camBase.y - ptr.sy*.4*fl + Math.sin(time*.4)*.08*fl, camBase.z);
  camera.lookAt(look);
  renderer.render(scene, camera);
}
frame();
requestAnimationFrame(() => setTimeout(hideLoader, 600));
show('s1');
} catch (err) { console.error(err); fail(); }
})();
