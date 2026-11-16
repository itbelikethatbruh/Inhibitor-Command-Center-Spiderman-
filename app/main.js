// Inhibitor Command Center - Copyright (C) 2026 Drake. SPDX-License-Identifier: AGPL-3.0-only
'use strict';
/* ============ helpers ============ */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
let seed = 1337;
const srnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/* ============ stage scaling ============ */
const stage = $('#stage');
function fit() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(${(innerWidth - 1920 * s) / 2}px,${(innerHeight - 1080 * s) / 2}px) scale(${s})`;
}
addEventListener('resize', fit); fit();

/* ============ city backdrop ============ */
(function city() {
  const c = $('#bgcanvas'), g = c.getContext('2d');
  seed = 42;
  const sky = g.createLinearGradient(0, 0, 0, 600);
  sky.addColorStop(0, '#b6e4f8'); sky.addColorStop(.5, '#86ccf0'); sky.addColorStop(1, '#4fa6dc');
  g.fillStyle = sky; g.fillRect(0, 0, 1920, 1080);
  // haze dots
  g.fillStyle = 'rgba(255,255,255,.06)';
  for (let y = 40; y < 420; y += 6) for (let x = (y / 6 % 2) * 3; x < 1920; x += 6) g.fillRect(x, y, 2, 2);
  // spire
  g.fillStyle = '#3e7fae';
  g.fillRect(1786, 250, 4, 70); g.fillRect(1780, 300, 16, 30); g.fillRect(1776, 330, 24, 40);
  function layer(y0, y1, col, win, minW, maxW, density) {
    let x = -20;
    while (x < 1940) {
      const w = minW + srnd() * (maxW - minW), top = y0 + srnd() * (y1 - y0);
      g.fillStyle = col; g.fillRect(x, top, w, 1080 - top);
      if (win) {
        const cw = 6 + srnd() * 6, ch = 8 + srnd() * 6, gx = cw + 4 + srnd() * 4, gy = ch + 6;
        for (let yy = top + 10; yy < 1040; yy += gy) for (let xx = x + 6; xx < x + w - cw - 4; xx += gx) {
          if (srnd() < density) { g.fillStyle = win[srnd() < .15 ? 1 : 0]; g.fillRect(xx, yy, cw, ch); }
        }
      }
      if (srnd() < .3) { g.fillStyle = col; g.fillRect(x + w * .3, top - 20 - srnd() * 30, w * .3, 60); }
      x += w + srnd() * 10;
    }
  }
  layer(360, 470, '#4a90c2', ['#6eb2df', '#9fd6f5'], 30, 90, .35);
  layer(430, 560, '#2d6fa4', ['#5aa4d6', '#cfeeff'], 50, 140, .45);
  layer(520, 700, '#1a5287', ['#4d97cd', '#e2f6ff'], 90, 220, .5);
  layer(700, 860, '#123f6b', ['#3e86bd', '#bfe6ff'], 120, 300, .55);
  // rooftop band near bottom
  g.fillStyle = '#0e3459'; g.fillRect(0, 960, 1920, 120);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${90 + srnd() * 80},${160 + srnd() * 60},230,${.15 + srnd() * .35})`; g.fillRect(srnd() * 1920, 960 + srnd() * 80, 4 + srnd() * 60, 2 + srnd() * 10); }
  // grain
  const id = g.getImageData(0, 0, 1920, 1080), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (srnd() - .5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
})();

/* ============ menus / taskbar / workspaces / drag ============ */
let ws = 1, autoCycle = false, autoT = 0;
function setWs(n) {
  ws = n;
  $('#ws1').classList.toggle('hidden', n !== 1);
  $('#ws2').classList.toggle('hidden', n !== 2);
  $$('.tab').forEach(t => t.classList.toggle('act', t.dataset.ws == n));
  glitch(220);
}
function glitch(ms) {
  const f = $('#flick');
  f.animate([{ opacity: .55 }, { opacity: 0 }], { duration: ms, easing: 'ease-out' });
}
function wormhole() {
  stage.animate([
    { filter: 'none', transform: stage.style.transform },
    { filter: 'hue-rotate(160deg) saturate(3) blur(2px)', transform: stage.style.transform + ' skewX(3deg)' },
    { filter: 'contrast(2) brightness(1.6)', transform: stage.style.transform + ' skewX(-2deg)' },
    { filter: 'none', transform: stage.style.transform }], { duration: 900 });
  glitch(900);
}
$$('.menu').forEach(m => m.addEventListener('click', e => {
  const open = m.classList.contains('open');
  $$('.menu').forEach(x => x.classList.remove('open'));
  if (!open) m.classList.add('open');
  e.stopPropagation();
}));
document.addEventListener('click', () => $$('.menu').forEach(x => x.classList.remove('open')));
function act(a) {
  switch (a) {
    case 'ws1': setWs(1); break;
    case 'ws2': setWs(2); break;
    case 'auto': autoCycle = !autoCycle; autoT = 0; break;
    case 'full': if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); break;
    case 'comp': showComp(); break;
    case 'fab': phase = 2; phaseT = 0; enterPhase(); break;
    case 'restart': phase = 0; phaseT = 0; enterPhase(); break;
    case 'crt': $('#crt').classList.toggle('hidden'); break;
    case 'wormhole': wormhole(); break;
    case 'quit': window.close(); break;
  }
}
$$('.dd div[data-act]').forEach(d => d.addEventListener('click', () => act(d.dataset.act)));
$$('.tab').forEach(t => t.addEventListener('click', () => {
  const w = t.dataset.ws;
  if (w === '1' || w === '2') setWs(+w);
  else if (w === 'c') { setWs(1); showComp(); }
  else wormhole();
}));
$('#tbplus').onclick = () => wormhole();
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === '1') act('ws1'); else if (k === '2') act('ws2'); else if (k === 'a') act('auto');
  else if (k === 'c') act('comp'); else if (k === 'f') act('fab'); else if (k === 's') act('crt');
  else if (k === 'w') act('wormhole'); else if (k === 'r') act('restart');
  else if (k === ' ') { togglePause(); e.preventDefault(); }
  else if (k === 'escape') { if (document.fullscreenElement) document.exitFullscreen(); else act('quit'); }
  else if (k === 'f11' && !window.isElectron) { act('full'); e.preventDefault(); }
});
// draggable windows
let zTop = 100;
$$('.win').forEach(w => {
  w.addEventListener('mousedown', () => { w.style.zIndex = ++zTop; });
  const bar = w.querySelector('.tbar');
  bar.addEventListener('mousedown', e => {
    if (e.target.closest('.ctl')) return;
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    const sx = e.clientX, sy = e.clientY, ox = w.offsetLeft, oy = w.offsetTop;
    const mv = ev => { w.style.left = ox + (ev.clientX - sx) / s + 'px'; w.style.top = oy + (ev.clientY - sy) / s + 'px'; };
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); };
    addEventListener('mousemove', mv); addEventListener('mouseup', up);
  });
});

/* ============ status readouts ============ */
function tickStatus() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  $('#tb-left').textContent = `HDR ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  $('#cpu').textContent = `▮ CPU: ${ri(78, 91)}%`;
  $('#temp').textContent = `TEMP: ${(42 + Math.random() * 1.6).toFixed(1)}°C`;
}
setInterval(tickStatus, 1000); tickStatus();

/* ============ hormone meters ============ */
function buildMeter(el, n) {
  // segment heights shrink toward bottom like the prop
  const hs = []; let tot = 0;
  for (let i = 0; i < n; i++) { const h = 30 * Math.pow(.93, i) + 2; hs.push(h); tot += h; }
  const avail = 650 - n * 3, k = avail / tot;
  const segs = hs.map(h => { const d = document.createElement('div'); d.style.height = (h * k).toFixed(1) + 'px'; el.appendChild(d); return d; });
  return segs;
}
const humSegs = buildMeter($('#mHum'), 34), araSegs = buildMeter($('#mAra'), 34);
['#ticksL'].forEach(s => { const t = $(s); [4, 160, 400, 560, 640].forEach(y => { const i = document.createElement('i'); i.style.top = y + 'px'; t.appendChild(i); }); });
function setMeter(segs, frac) {
  const n = segs.length, on = Math.round(frac * n);
  segs.forEach((s, i) => s.classList.toggle('on', i >= n - on));
}
let humLv = .5, araLv = .8, humT = .5, araT = .8;
setInterval(() => {
  if (Math.random() < .2) humT = rnd(.44, .56);
  if (Math.random() < .2) araT = rnd(.74, .9);
  humLv += (humT - humLv) * .25; araLv += (araT - araLv) * .25;
  setMeter(humSegs, humLv); setMeter(araSegs, araLv + (Math.random() < .1 ? -.03 : 0));
}, 160);

/* ============ wireframe human (raymarched SDF, three.js) ============ */
const humanScene = (function () {
  const cv = $('#humanCv'), W = 420, H = 760, PR = 1.5;
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, premultipliedAlpha: false });
  r.setPixelRatio(PR); r.setSize(W, H, false); r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uni = { uT: { value: 0 }, uA: { value: .6 }, uRes: { value: new THREE.Vector2(W * PR, H * PR) } };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni, transparent: true,
    vertexShader: `void main(){ gl_Position = vec4(position.xy,0.,1.); }`,
    fragmentShader: `precision highp float;
uniform float uT, uA; uniform vec2 uRes;
float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float sdE(vec3 p, vec3 r){ float k0=length(p/r); float k1=length(p/(r*r)); return k0*(k0-1.)/k1; }
float sdRC(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba=b-a; float l2=dot(ba,ba); float rr=r1-r2; float a2=l2-rr*rr; float il2=1./l2;
  vec3 pa=p-a; float y=dot(pa,ba); float z=y-l2; vec3 xv=pa*l2-ba*y; float x2=dot(xv,xv); float y2=y*y*l2; float z2=z*z*l2;
  float k=sign(rr)*rr*rr*x2;
  if(sign(z)*a2*z2>k) return sqrt(x2+z2)*il2-r2;
  if(sign(y)*a2*y2<k) return sqrt(x2+y2)*il2-r1;
  return (sqrt(x2*a2*il2)+y*rr)*il2-r1; }
float body(vec3 p){
  vec3 q=vec3(abs(p.x),p.y,p.z);
  float d=sdE(p-vec3(0.,1.685,.005),vec3(.088,.118,.105));
  d=smin(d,sdE(p-vec3(0.,1.62,.03),vec3(.066,.055,.072)),.04);
  d=smin(d,sdE(q-vec3(.088,1.675,0.),vec3(.012,.03,.02)),.01);
  d=smin(d,sdRC(p,vec3(0.,1.49,-.005),vec3(0.,1.61,.0),.058,.048),.035);
  d=smin(d,sdE(p-vec3(0.,1.33,0.),vec3(.168,.15,.1)),.06);
  d=smin(d,sdE(p-vec3(0.,1.15,.0),vec3(.142,.15,.088)),.07);
  d=smin(d,sdE(p-vec3(0.,.97,-.005),vec3(.158,.105,.1)),.06);
  d=smin(d,sdE(q-vec3(.07,1.33,.06),vec3(.08,.06,.05)),.04);
  d=smin(d,sdE(p-vec3(0.,1.36,-.05),vec3(.15,.14,.07)),.05);
  d=smin(d,sdRC(q,vec3(.03,1.47,-.015),vec3(.175,1.415,-.005),.05,.058),.05);
  d=smin(d,sdE(q-vec3(.19,1.385,0.),vec3(.062,.078,.064)),.04);
  d=smin(d,sdRC(q,vec3(.205,1.37,-.005),vec3(.24,1.115,-.035),.05,.04),.03);
  d=smin(d,sdRC(q,vec3(.24,1.115,-.035),vec3(.262,.875,.02),.042,.028),.02);
  d=smin(d,sdE(q-vec3(.268,.81,.028),vec3(.024,.072,.042)),.025);
  d=smin(d,sdRC(q,vec3(.262,.82,.06),vec3(.255,.79,.075),.013,.011),.01);
  d=smin(d,sdE(q-vec3(.072,.9,-.05),vec3(.084,.09,.075)),.04);
  d=smin(d,sdRC(q,vec3(.088,.9,0.),vec3(.104,.52,.015),.088,.055),.05);
  d=smin(d,sdE(q-vec3(.104,.5,.04),vec3(.04,.045,.03)),.03);
  d=smin(d,sdRC(q,vec3(.104,.52,.012),vec3(.108,.35,-.02),.052,.056),.03);
  d=smin(d,sdRC(q,vec3(.108,.35,-.02),vec3(.11,.095,-.01),.056,.032),.03);
  d=smin(d,sdE(q-vec3(.112,.042,.045),vec3(.045,.036,.118)),.035);
  return d; }
vec3 rot(vec3 p){ float c=cos(uA), s=sin(uA); return vec3(c*p.x+s*p.z, p.y, -s*p.x+c*p.z); }
float map(vec3 p){ return body(rot(p)); }
vec3 nrm(vec3 p){ const vec2 e=vec2(.0015,-.0015);
  return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx)); }
float h3(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float ln(float v, float w){ float d=abs(fract(v)-.5); return smoothstep(.5-w,.5,d); }
vec3 shade(vec3 p, vec3 rd, out float fr){
  vec3 n=nrm(p); vec3 P=rot(p);
  float hz=ln(P.y*85.,.16);
  float vt=max(ln(P.x*48.,.12), ln(P.z*48.,.12));
  float grid=max(hz, vt*.7);
  float nz=n3(P*7.+vec3(0.,uT*.12,0.))*.65+n3(P*21.)*.35;
  float blue=smoothstep(.5,.64,nz);
  fr=pow(1.-abs(dot(n,-rd)),2.4);
  vec3 org=vec3(1.,.32,.17), bl=vec3(.2,.45,1.);
  vec3 c=org*(grid*1.05+.13)*(1.-blue*.8)+bl*blue*(.3+grid*.7);
  c+=vec3(1.,.42,.26)*fr*1.3;
  float sc=smoothstep(.47,.5,abs(fract(P.y*.7-uT*.22)-.5)); c+=org*sc*.5;
  return c; }
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec3 ro=vec3(0.,.9,4.1);
  vec3 rd=normalize(vec3(uv*2.*tan(radians(13.5)),-1.));
  float t=3.2, md=1e3; bool hit=false;
  for(int i=0;i<110;i++){ vec3 p=ro+rd*t; float d=map(p); md=min(md,d); if(d<.0008){hit=true;break;} t+=d*.9; if(t>5.2)break; }
  vec4 col=vec4(0.);
  if(hit){
    float fr; vec3 p=ro+rd*t; vec3 c=shade(p,rd,fr);
    // faint back-face ghost: exit point of the body
    float t2=t+.02; for(int i=0;i<40;i++){ float d=-map(ro+rd*t2); if(d<.001)break; t2+=max(d,.004); }
    float fr2; vec3 back=shade(ro+rd*t2,-rd,fr2)*.12;
    c+=back;
    col=vec4(c, clamp(.55+max(c.r,c.b),0.,1.));
  } else {
    float g=exp(-md*55.)*.55; col=vec4(vec3(1.,.3,.15)*g, g);
  }
  gl_FragColor=col;
}`
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  return { render(t, dt) { uni.uT.value = t; uni.uA.value += dt * .55; r.render(scene, cam); } };
})();

/* ============ firmware compiler hex dump ============ */
const STREAM = 'URES: X86_64 AES-NI..LIBUV/NS..L...ICRO-TTPD/NS..PRE|PCR..|...GHT-LIGHT.....OPEN %........S: %S..RB.%S:%D:...7Y.AC....W4VC........?......$0.....N.IC..EH......AV.BCKG.......INHIB/FW.2.1-MOD.2.0-UPD0.1..SPDR.SENS..LOAD.KRNL..CHK=0x7F3A..BOOT/SEQ..PWM.DRV..IMU.CAL...HORMONE.SYNC..ARACHNID.SUPPR..';
const hexEl = $('#hex'); const ROWS = 11; let hexRows = [], addr = 0x000EBC80, sp = 0, compPaused = false, rowAcc = 0;
for (let i = 0; i < ROWS; i++) { const d = document.createElement('div'); hexEl.appendChild(d); hexRows.push(d); }
let curRow = 0;
function hexLine() {
  const chars = []; for (let i = 0; i < 16; i++) { chars.push(STREAM[sp % STREAM.length]); sp++; }
  if (Math.random() < .2) sp += ri(1, 9);
  const bytes = chars.slice(0, 11).map(c => Math.random() < .08 ? '--' : c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));
  const a = addr.toString(16).toUpperCase().padStart(8, '0'); addr += 0x10;
  const asc = chars.join('').replace(/[^\x20-\x7e]/g, '.');
  return `<span class="a">${a}</span>   ${bytes.slice(0, 8).join(' ')}   ${bytes.slice(8).join(' ')}   |${asc}|`;
}
function hexStep() {
  if (curRow === 0) hexRows.forEach(r => r.innerHTML = '');
  hexRows.forEach(r => r.classList.remove('new'));
  const r = hexRows[curRow]; r.innerHTML = hexLine(); r.classList.add('new');
  curRow++;
  if (curRow >= ROWS) { curRow = 0; }
}
function togglePause() { compPaused = !compPaused; $('#bPause').classList.toggle('on', compPaused); $('#bPause').textContent = compPaused ? 'RESUME' : 'PAUSE'; }
$('#bPause').onclick = togglePause;
function hideComp() { $('#wComp').classList.add('hidden'); setTimeout(showComp, 7000); }
function showComp() { const w = $('#wComp'); w.classList.remove('hidden'); w.style.zIndex = ++zTop; }
$('#bEnd').onclick = hideComp; $('#compX').onclick = hideComp;
for (let i = 0; i < 7; i++) hexStep();
setInterval(() => { if (ws === 1 && !compPaused && !$('#wComp').classList.contains('hidden')) hexStep(); }, 75);

/* ============ PCB blueprint generator ============ */
function drawPCB(svg, sd) {
  seed = sd;
  const NS = 'http://www.w3.org/2000/svg';
  let s = `<defs><filter id="gl${sd}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <linearGradient id="fg${sd}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ec8ff" stop-opacity=".22"/><stop offset="1" stop-color="#5ec8ff" stop-opacity=".05"/></linearGradient></defs>
  <g filter="url(#gl${sd})" stroke="#64c4ff" fill="none" stroke-width="2.2" stroke-linejoin="round">`;
  const shell = 'M120 22 L300 22 Q332 22 347 48 L386 112 Q396 128 396 148 L396 330 Q396 346 386 354 L386 468 Q386 522 334 530 L132 536 Q72 536 62 482 L46 332 Q36 322 36 302 L36 148 Q36 128 46 112 L86 48 Q100 22 120 22Z';
  s += `<path d="${shell}" fill="url(#fg${sd})"/>`;
  s += `<path d="${shell}" transform="translate(21,27) scale(.9)" stroke-width="1.5" opacity=".8"/>`;
  s += `<path d="M330 470 h26 q8 0 8 8 v10 q-12 0 -12 12 t12 12 v10 h-34" stroke-width="1.6"/>`;
  // sensor ring
  s += `<path d="M90 150 Q95 60 210 55 Q325 60 330 150 Q330 235 210 245 Q95 235 90 150Z" stroke-width="2"/>`;
  s += `<path d="M118 150 Q122 82 210 78 Q298 82 302 150 Q300 220 210 226 Q122 220 118 150Z" stroke-width="1.4" opacity=".8"/>`;
  s += `<rect x="146" y="94" width="128" height="108" rx="20" stroke-width="2.4"/>`;
  for (let i = 0; i < 8; i++) s += `<rect x="156" y="${106 + i * 11.5}" width="108" height="6" fill="#7fd4ff" fill-opacity="${.35 + srnd() * .4}" stroke-width=".8"/>`;
  s += `<line x1="210" y1="55" x2="210" y2="94" stroke-width="1.2"/><line x1="90" y1="150" x2="146" y2="150" stroke-width="1.2" opacity=".6"/>`;
  // screws
  for (const [x, y] of [[110, 96], [310, 96], [74, 192], [346, 192]]) s += `<circle cx="${x}" cy="${y}" r="21" stroke-width="2.6"/><circle cx="${x}" cy="${y}" r="12"/><circle cx="${x}" cy="${y}" r="4" fill="#9fe0ff"/>`;
  // small ring holes
  for (let i = 0; i < 6; i++) { const a = Math.PI * (.2 + i * .12); s += `<circle cx="${210 + Math.cos(a) * 100}" cy="${150 + Math.sin(a) * 80}" r="4" stroke-width="1.2" opacity=".7"/>`; }
  // batteries / left rail
  s += `<rect x="58" y="252" width="26" height="196" rx="10" stroke-width="2"/><rect x="64" y="262" width="14" height="176" rx="6" stroke-width="1.2"/>`;
  s += `<rect x="90" y="262" width="14" height="170" rx="4" stroke-width="1.6"/>`;
  for (let i = 0; i < 7; i++) s += `<line x1="${96 + i * 5}" y1="${270 + i * 3}" x2="${128 + i * 5}" y2="${318 + i * 3}" stroke-width="1.6"/>`;
  // right slot
  s += `<rect x="338" y="262" width="20" height="180" rx="3" stroke-width="2"/><rect x="343" y="270" width="10" height="164" stroke-width="1"/>`;
  s += `<path d="M300 260 L300 470 M318 262 L318 470" stroke-width="1.4" opacity=".6"/>`;
  // board
  s += `<path d="M112 252 L298 252 L298 486 L246 486 L246 500 L124 500 Q112 500 112 488Z" stroke-width="2" fill="#5ec8ff" fill-opacity=".05"/>`;
  // chips cluster
  s += '</g><g stroke="#7fd4ff" stroke-width="1.2" fill="#5ec8ff" fill-opacity=".18">';
  for (let i = 0; i < 130; i++) {
    const x = 122 + srnd() * 160, y = 262 + srnd() * 210;
    if (x > 168 && x < 232 && y > 372 && y < 430) continue;
    if (x > 236 && x < 288 && y > 382 && y < 450) continue;
    const w = 4 + srnd() * 10, h = 4 + srnd() * 8;
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill-opacity="${(.1 + srnd() * .5).toFixed(2)}"/>`;
  }
  s += '</g><g filter="url(#gl' + sd + ')" stroke="#7fd4ff" fill="none" stroke-width="2">';
  s += `<rect x="170" y="374" width="58" height="54" fill="#5ec8ff" fill-opacity=".15"/><rect x="178" y="382" width="42" height="38" stroke-width="1"/>`;
  s += `<rect x="238" y="384" width="48" height="64" rx="4"/><ellipse cx="262" cy="416" rx="13" ry="20" stroke-width="2.4"/>`;
  s += `<path d="M150 420 a9 9 0 1 1 10 0 l3 32 h-16z" stroke-width="1.8"/><circle cx="155" cy="412" r="3"/>`;
  s += `<rect x="186" y="300" width="26" height="22" fill="#7fd4ff" fill-opacity=".35"/><rect x="230" y="296" width="44" height="30"/>`;
  s += `<rect x="70" y="456" width="40" height="34" stroke-width="1.4"/>`;
  for (let i = 0; i < 6; i++) s += `<line x1="76" y1="${462 + i * 5}" x2="104" y2="${462 + i * 5}" stroke-width="1"/>`;
  s += `<rect x="258" y="470" width="18" height="18"/><rect x="210" y="470" width="12" height="12"/><rect x="226" y="488" width="12" height="12"/>`;
  s += '</g>';
  svg.innerHTML = s;
}
drawPCB($('#pcb'), 7); drawPCB($('#pcbBig'), 11);
// tool-palette dots
(function () { let s = ''; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += `<rect x="${7 + j * 6}" y="${7 + i * 6}" width="4" height="4"/>`; $('#dots').innerHTML = s; })();
$('#tools2').innerHTML = $('#tools').innerHTML.replace(/top:(\d+)px/g, (m, v) => `top:${Math.round(v * 1.4)}px`).replace(/width:50px;height:54px/g, '');
$$('#tools2 .tb').forEach(t => { t.style.cssText += ';position:absolute;left:12px;width:84px;height:80px;background:#1c4f80;display:flex;align-items:center;justify-content:center'; });
$$('#tools2 svg').forEach(s => s.style.cssText = 'width:40px;height:40px;stroke:#bfe8ff;fill:none;stroke-width:2.5');
$('#tools2 .t1').style.cssText = 'position:absolute;top:-2px;left:0;right:0;text-align:center;font-family:Plex;font-weight:700;font-size:16px;color:#8fd6ff;background:#0a1628';
// exploded view
(function () {
  let s = '<g stroke="#5ab8f2" fill="none" stroke-width="1.4" opacity=".9">';
  s += '<line x1="175" y1="10" x2="175" y2="330" stroke-dasharray="4 4" opacity=".5"/><line x1="30" y1="150" x2="320" y2="150" stroke-dasharray="4 4" opacity=".4"/>';
  for (let k = 0; k < 3; k++) s += `<ellipse cx="175" cy="${70 + k * 8}" rx="${118 - k * 4}" ry="${48 - k}"/>`;
  s += '<path d="M60 75 L72 160 Q80 190 175 196 Q270 190 278 160 L290 75"/><path d="M75 90 L84 158 Q92 180 175 184 Q258 180 266 158 L275 90" opacity=".6"/>';
  s += '<ellipse cx="175" cy="112" rx="62" ry="32" fill="#04101f" stroke-width="2"/><ellipse cx="175" cy="112" rx="50" ry="25"/>';
  for (const [x, y] of [[92, 66], [258, 66], [72, 112], [278, 112], [128, 50], [222, 50]]) s += `<ellipse cx="${x}" cy="${y}" rx="11" ry="7"/><ellipse cx="${x}" cy="${y}" rx="4" ry="3"/>`;
  s += '<path d="M120 196 L128 232 M230 196 L222 232"/><circle cx="262" cy="196" r="6"/><path d="M256 200 Q250 230 262 238"/><circle cx="264" cy="246" r="10"/>';
  s += '<path d="M90 252 Q90 240 110 238 L240 238 Q260 240 260 252 L262 292 L232 300 L230 268 L120 268 L118 300 L88 292Z"/>';
  for (let i = 0; i < 6; i++) s += `<rect x="${136 + i * 13}" y="${244 + (i % 2) * 4}" width="9" height="${46 - (i % 2) * 6}" rx="2"/>`;
  s += '<path d="M88 292 L92 306 L118 310 L118 300 M262 292 L258 306 L232 310 L232 300"/></g>';
  s += '<g fill="#5ab8f2" font-size="8" font-family="STM"><text x="20" y="300">SUB.MODEL</text><text x="20" y="310">+ ROOT.MODULES</text><text x="270" y="318">BASE.SEC</text></g>';
  $('#explode').innerHTML = s;
})();

/* ============ inspector / fabrication cycle ============ */
let phase = 0, phaseT = 0; const PH = [9, 8, 11];
function enterPhase() {
  const dl = phase === 0;
  $('#loadLbl').classList.toggle('hidden', !dl); $('#vbar').classList.toggle('hidden', !dl);
  $('#hbar').classList.toggle('hidden', dl);
  $('#wFab').classList.toggle('hidden', phase !== 2);
  if (phase === 2) $('#wFab').style.zIndex = ++zTop;
  $('#stTxt').style.top = dl ? '500px' : '494px';
  glitch(160);
}
function updPhase(dt, t) {
  phaseT += dt; let p = Math.min(1, phaseT / PH[phase]);
  // stepped, stuttery progress
  p = Math.min(1, Math.floor(p * 40 + Math.sin(t * 7) * .3) / 40);
  const blink = (t * 2.2 % 1) < .55;
  if (phase === 0) { $('#vbar div').style.height = (p * 490).toFixed(0) + 'px'; $('#stTxt').textContent = 'DOWNLOADING FRAMEWARE' + (blink ? '_' : ' '); }
  else if (phase === 1) { $('#hbar div').style.width = (p * 100) + '%'; $('#stTxt').textContent = 'PRINTING PROGRESS' + (blink ? '-' : ' '); }
  else { $('#hbar div').style.width = (p * 100) + '%'; $('#fbar div').style.width = (p * 100) + '%'; $('#stTxt').textContent = 'FABRICATION PROGRESS' + (blink ? '-' : ' '); $('#fabTxt').textContent = 'FABRICATION PROGRESS' + (blink ? '-' : ' ');
    $('#mgauge div').style.height = (20 + 60 * p + Math.sin(t * 9) * 4) + '%'; }
  if (phaseT > PH[phase] + 1.2) { phase = (phase + 1) % 3; phaseT = 0; enterPhase(); }
}
enterPhase();

/* ============ voxel DNA ============ */
const voxelDNA = (function () {
  const cv = $('#dnaCv'), W = 640, H = 370, DOWN = 2.2;
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false });
  r.setPixelRatio(1); r.setSize(Math.round(W / DOWN), Math.round(H / DOWN), false);
  r.setClearColor(0x06101e);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(38, W / H, .1, 100); cam.position.set(0, .2, 7.2); cam.lookAt(0, -.1, 0);
  scene.add(new THREE.AmbientLight(0xffffff, .55));
  const dl = new THREE.DirectionalLight(0xffffff, .9); dl.position.set(2, 4, 5); scene.add(dl);
  const items = [];
  seed = 99;
  const R = 1.15, L = 5.2, F = 1.05;
  const white = new THREE.Color('#d6f2ff'), cyan = new THREE.Color('#79c9f2'), blue = new THREE.Color('#2f86c8'), org = new THREE.Color('#ff7a48'), red = new THREE.Color('#ff4a34');
  function pick(x, strand) {
    const warm = x < -2.6 && strand === 0 && srnd() < .7;
    if (warm) return srnd() < .5 ? org : red;
    const q = srnd(); return q < .55 ? white : q < .85 ? cyan : blue;
  }
  for (let x = -L; x <= L; x += .055) {
    for (let st = 0; st < 2; st++) {
      const a = x * F + st * Math.PI * .82;
      for (let k = 0; k < 2; k++) items.push({ p: [x + (srnd() - .5) * .08, Math.cos(a) * R + (srnd() - .5) * .14, Math.sin(a) * R + (srnd() - .5) * .14], s: .13 + srnd() * .07, c: pick(x, st) });
    }
  }
  for (let x = -L; x <= L; x += .32) {
    const a1 = x * F, a2 = a1 + Math.PI * .82;
    for (let u = .15; u < .9; u += .14) {
      if (srnd() < .25) continue;
      items.push({ p: [x, Math.cos(a1) * R * (1 - u) + Math.cos(a2) * R * u, Math.sin(a1) * R * (1 - u) + Math.sin(a2) * R * u], s: .09, c: srnd() < .1 ? org : (srnd() < .5 ? cyan : blue) });
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), items.length);
  const m = new THREE.Matrix4();
  items.forEach((it, i) => { m.compose(new THREE.Vector3(...it.p), new THREE.Quaternion(), new THREE.Vector3(it.s, it.s, it.s)); mesh.setMatrixAt(i, m); mesh.setColorAt(i, it.c); });
  const grp = new THREE.Group(); grp.add(mesh); grp.rotation.z = -.18; scene.add(grp);
  // top pixel row + bar panel
  const top = $('#dnaTop'); for (let i = 0; i < 26; i++) { const e = document.createElement('i'); e.style.left = rnd(0, 620) + 'px'; e.style.top = ri(4, 22) + 'px'; e.style.width = ri(8, 26) + 'px'; top.appendChild(e); }
  const bp = $('#barPanel'), bars = [];
  for (let row = 0; row < 4; row++) for (let i = 0; i < 34; i++) {
    const e = document.createElement('i'); e.style.left = 30 + rnd(0, 580) + 'px'; e.style.top = 18 + row * 38 + 'px'; e.style.width = ri(3, 12) + 'px'; e.style.height = ri(10, 22) + 'px';
    bp.appendChild(e); bars.push(e);
  }
  for (let i = 0; i < 3; i++) { const e = document.createElement('i'); e.style.cssText = `left:10px;top:${16 + i * 40}px;width:3px;height:22px;opacity:.6`; bp.appendChild(e); }
  setInterval(() => { for (let k = 0; k < 10; k++) { const b = bars[ri(0, bars.length - 1)]; b.style.opacity = Math.random() < .3 ? .15 : rnd(.5, 1); } }, 120);
  return { render(t, dt) { grp.rotation.x += dt * .9; r.render(scene, cam); } };
})();

/* ============ ANALYSIS workspace ============ */
$('#tree').innerHTML = (function () {
  const L = [];
  const box = (t, k) => `<span style="color:#3f8fc8">[${k}]</span>──── ${t}`;
  [['1.1+/', 'SLICE.MODL.XLR'], ['1.2+/', 'LOAD.MODL(Y).XLR'], ['1.3+/', 'GLOBALS.CSS'], ['1.4+/', 'PAGE.JS']].forEach(([a, b]) => L.push(box(`${a} ${b}`, '+')));
  L.push(`  └─<span style="color:#3f8fc8">[−]</span>── 1.5+/ PUBLIC Y SRC/APP`);
  L.push(`       ├──── 1.5.0/-.CHN`, '       │', '       │', '       │', `       ├──── 1.5.B/JS MODL.XLR`, `       └──── 1.5.C/JS UTILS.XLR`, '', '');
  [['2.0+/', 'NODE_MODULES Y1'], ['2.1+/', 'NODE_MODULES Y2'], ['2.2+/', 'NODE_MODULES Y3'], ['2.3+/', 'FABRCATE.XLR'], ['2.4+/', 'PACKAGE-SLICE.MDL'], ['2.5+/', 'LOAD.MDL-OPT'], ['2.6+/', 'PRINT.(Y)MDL'], ['2.7+/', 'CURE Y.MDL']].forEach(([a, b]) => L.push(box(`${a} ${b}`, '+')));
  L.push(`  └─<span style="color:#3f8fc8">[−]</span>── 3.5+/ CHECK Y.MDL`);
  for (let i = 0; i < 5; i++) L.push(`       ${i < 4 ? '├' : '└'}──── 3.5.A/-.SCR`);
  return L.map(l => `<div class="trl">${l}</div>`).join('');
})();
$('#tree').style.lineHeight = '19px';
const CODE = `UUD-Crossbeam
Nuss=150x

# 101-200: CONSENSUS
SIMULATION (SIMPLIFIED)

DEF
RESOLVE_CONFLICTS(OVERLAP,LYS):
  :
    COL LAYERS
      LONGEST_MDL(SEE) +
    GRID/LYS(X).FOOP
      FOR USER_PERM(ALLOW):
        IF LEN(USER) >UI Y`;
let codeN = 0; const codeEl = $('#code');
function tickCode() { codeN = (codeN + 3) % (CODE.length + 160); codeEl.textContent = CODE.slice(0, Math.min(codeN, CODE.length)) + ((Date.now() / 400 | 0) % 2 ? '█' : ' '); }
setInterval(tickCode, 40);
setInterval(() => {
  $('#v28').textContent = `<${ri(24, 31)}V/`; $('#v3000').textContent = `x${ri(2990, 3010)}`;
  $('#xyz').innerHTML = `TERMINAL 01.-DRV/CODE  |  DISPLAY.SAMPLE.SIZE.1:1<br>          X/${rnd(0, 1).toFixed(6)}  |<br>          Y/${(1 + rnd(0, .001)).toFixed(6)}  |<br>          Y/${(1 + rnd(0, .001)).toFixed(6)}  |`;
}, 500);

// chromosome band grid
const chromo = (function () {
  const cv = $('#chromo'), W = 1370, H = 480; cv.width = W; cv.height = H; const g = cv.getContext('2d');
  seed = 5;
  const rows = []; const gx0 = 90, gx1 = W - 6, gy0 = 66, rowH = 34;
  for (let r = 0; r < 11; r++) {
    const bands = []; let x = gx0 + 10 + srnd() * 30;
    while (x < gx1 - 10) { const w = 4 + srnd() * 22; const b = srnd(); if (b > .35) bands.push({ x, w, b: .25 + b * .75 }); x += w + 2 + srnd() * 10; }
    const caps = []; for (let k = 0; k < 2; k++) caps.push(gx0 + 20 + srnd() * (gx1 - gx0 - 60));
    rows.push({ bands, caps });
  }
  const marks = []; for (let i = 0; i < 9; i++) marks.push({ x: gx0 + 30 + srnd() * (gx1 - gx0 - 60), lab: ['MA2', 'SU3', 'KI4', 'NG1', 'MO7', 'R2B', 'X-0'][i % 7] });
  return {
    render(t) {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = '#3b94d6'; g.lineWidth = 2; g.strokeRect(gx0 - 60, gy0 - 14, gx1 - gx0 + 58, 11 * rowH + 30);
      g.beginPath(); g.moveTo(gx0, gy0 - 14); g.lineTo(gx0, gy0 + 11 * rowH + 16); g.stroke();
      g.font = '10px STM'; g.fillStyle = '#5aa9dc';
      // top ruler + markers
      for (let x = gx0; x < gx1; x += 120) { g.fillRect(x, gy0 - 50, 1, 6); }
      g.fillRect(gx0, gy0 - 44, gx1 - gx0, 1);
      marks.forEach((m, i) => { g.fillText(m.lab, m.x - 8, gy0 - 34 + (i % 2) * 10); g.beginPath(); g.moveTo(m.x, gy0 - 20 + (i % 2) * 6); g.lineTo(m.x - 4, gy0 - 26 + (i % 2) * 6); g.lineTo(m.x + 4, gy0 - 26 + (i % 2) * 6); g.closePath(); g.fill(); });
      const scan = gx0 + ((t * 120) % (gx1 - gx0 + 200)) - 100;
      rows.forEach((row, r) => {
        const y = gy0 + r * rowH + 8;
        g.fillStyle = '#5aa9dc'; g.fillText('SH' + (r + 1), gx0 - 52, y + 13); g.fillRect(gx0 - 22, y + 9, 10, 1);
        g.fillStyle = 'rgba(40,110,170,.25)'; g.fillRect(gx0 + 6, y, gx1 - gx0 - 12, 22);
        row.bands.forEach(b => {
          const near = Math.max(0, 1 - Math.abs(b.x - scan) / 90);
          const flick = .85 + .15 * Math.sin(t * 3 + b.x * .05 + r);
          const v = Math.min(1, b.b * flick + near * .6);
          g.shadowColor = '#7fd4ff'; g.shadowBlur = v > .7 ? 14 : 4;
          g.fillStyle = `rgba(${120 + 135 * v | 0},${200 + 55 * v | 0},255,${.25 + v * .75})`;
          g.fillRect(b.x, y, b.w, 22);
        });
        g.shadowBlur = 0;
        g.strokeStyle = '#cfeeff'; g.lineWidth = 1.5;
        row.caps.forEach(cx => { g.beginPath(); g.moveTo(cx, y - 2); g.lineTo(cx, y + 24); g.moveTo(cx - 8, y + 11); g.lineTo(cx, y + 11); g.stroke(); });
        g.strokeStyle = '#3b94d6';
      });
      g.fillStyle = '#9fe0ff'; g.font = '10px STM';
      g.fillText('ANOMALY DETECTION', gx0 + 250, gy0 - 4); g.fillText('SUSPECTED REGION', gx0 + 256, gy0 + 6);
      if ((t * 1.5 | 0) % 2) { g.fillText('ANOMALY DETECTION', gx0 + 210, gy0 + 7 * rowH + 4); g.fillText('SUSPECTED REGION', gx0 + 216, gy0 + 7 * rowH + 14); }
      g.fillText('ANOMALY D', gx0 + 120, gy0 + 9 * rowH + 4);
      g.fillText('8/Y1', gx0 + 100, gy0 + 11 * rowH + 28);
      g.fillStyle = 'rgba(160,230,255,.12)'; g.fillRect(scan - 2, gy0 - 14, 4, 11 * rowH + 30);
    }
  };
})();
const wave = (function () {
  const cv = $('#wave'), W = 1290, H = 50; cv.width = W; cv.height = H; const g = cv.getContext('2d');
  return {
    render(t) {
      g.clearRect(0, 0, W, H); g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 3) {
        const u = x * .02 + t * 1.5;
        const y = H - (18 + 12 * Math.sin(u) * Math.sin(u * .37 + 1) + 8 * Math.sin(u * 2.7) + 6 * Math.sin(x * .3 + t * 4) * (Math.sin(x * .013) > .6 ? 1.6 : .4));
        g.lineTo(x, Math.max(2, y));
      }
      g.lineTo(W, H); g.closePath(); g.fillStyle = 'rgba(70,150,215,.55)'; g.fill(); g.strokeStyle = '#7fd4ff'; g.stroke();
    }
  };
})();
// wireframe DNA (SIMULATION 4.0)
const wireDNA = (function () {
  const cv = $('#wireCv'), W = 250, H = 200;
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); r.setPixelRatio(1.6); r.setSize(W, H, false);
  const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(35, W / H, .1, 50); cam.position.set(0, 0, 5.6);
  seed = 21; const pts = [], segs = [];
  const R = .9, Hh = 3.3, F = 2.0;
  const back = [[], []];
  for (let y = -Hh / 2; y <= Hh / 2; y += .07) {
    for (let s = 0; s < 2; s++) {
      const a = y * F + s * Math.PI * .8, rr = R * (1 - .25 * Math.abs(y) / Hh * 2);
      const p = [Math.cos(a) * rr, y, Math.sin(a) * rr]; pts.push(...p); back[s].push(p);
      for (let k = 0; k < 2; k++) { const q = [p[0] + (srnd() - .5) * .3, p[1] + (srnd() - .5) * .2, p[2] + (srnd() - .5) * .3]; pts.push(...q); segs.push(...p, ...q); }
    }
  }
  for (let s = 0; s < 2; s++) for (let i = 1; i < back[s].length; i++) segs.push(...back[s][i - 1], ...back[s][i]);
  for (let i = 0; i < back[0].length; i += 3) segs.push(...back[0][i], ...back[1][i]);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
  const grp = new THREE.Group();
  grp.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xbfeaff, size: 3.2, sizeAttenuation: false })));
  grp.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x5ab8f2, transparent: true, opacity: .8 })));
  grp.rotation.z = .12; scene.add(grp);
  return { render(t, dt) { grp.rotation.y += dt * .8; r.render(scene, cam); } };
})();

/* ============ multi-monitor + screensaver ============ */
const QS = new URLSearchParams(location.search);
const SCREEN = +(QS.get('screen') || 1), SAVER = QS.get('ss') === '1';
if (SCREEN >= 2) {
  // secondary display: analysis terminal + voxel helix, staggered per extra screen
  const dna = $('#wDna'); $('#ws2').appendChild(dna);
  dna.style.cssText += ';left:1236px;top:626px;width:640px;height:394px;z-index:30';
  $('#barPanel').style.display = 'none';
  $('#title').classList.add('hidden');
  if (SCREEN % 2 === 1) { // 3rd, 5th screen: mirror the analysis window layout
    $('#wAna').style.left = '40px'; dna.style.left = '40px';
  }
  setWs(2);
}
if (SAVER) {
  document.body.style.cursor = 'none';
  $('#menubar').style.pointerEvents = 'none'; $('#taskbar').style.pointerEvents = 'none';
  const armAt = performance.now() + 1500; let mx = null, my = null;
  const quit = () => { if (performance.now() < armAt) return; if (window.icc) window.icc.quit(); else window.close(); };
  addEventListener('mousemove', e => {
    if (mx === null) { mx = e.screenX; my = e.screenY; return; }
    if (Math.abs(e.screenX - mx) + Math.abs(e.screenY - my) > 12) quit();
  }, true);
  ['keydown', 'mousedown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, e => { e.stopImmediatePropagation(); quit(); }, true));
  autoCycle = false;
}

/* ============ main loop ============ */
let last = performance.now(), T = 0;
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
  if ($('#wDna').offsetParent) voxelDNA.render(T, dt);
  if (ws === 1) {
    humanScene.render(T, dt);
  } else {
    chromo.render(T); wave.render(T); wireDNA.render(T, dt);
  }
  updPhase(dt, T);
  if (autoCycle) { autoT += dt; if (autoT > 25) { autoT = 0; setWs(ws === 1 ? 2 : 1); } }
  if (Math.random() < .004) glitch(90);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
