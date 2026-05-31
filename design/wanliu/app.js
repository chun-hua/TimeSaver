/* ════════════════════════════════════════════════
   挽留者 — app logic
   ════════════════════════════════════════════════ */

/* ── Background themes ── */
const bgMap = {
  rain:    'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=1600&q=80',
  library: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&q=80',
  forest:  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80',
  cyber:   'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1600&q=80',
};
const themeName = { rain:'雨夜', library:'图书馆', forest:'森林', cyber:'赛博桌面' };
let currentTheme = 'rain';
let selectedDur  = 50;
let selectedStyle = 'glass';
let selectedCompanion = 'none';

/* ════════════════════════════════════════════════
   DEVICE SCALING + ORIENTATION
   ════════════════════════════════════════════════ */
const device  = document.getElementById('device');
const scaler  = document.getElementById('device-scaler');
let landscape = false;

function fitDevice() {
  const w = landscape ? 844 : 390;
  const h = landscape ? 390 : 844;
  const s = Math.min((window.innerWidth * 0.92) / w, (window.innerHeight * 0.86) / h, 1.05);
  scaler.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fitDevice);

function setOrientation(toLandscape) {
  landscape = toLandscape;
  device.classList.toggle('landscape', landscape);
  document.getElementById('rotate-fab').classList.toggle('rotated', landscape);
  document.getElementById('rotate-label').textContent = landscape ? '竖屏' : '横屏';
  fitDevice();
  // each canvas resizes to its new box
  setTimeout(resizeAllCanvases, 560);
  const toast = document.getElementById('orient-toast');
  toast.textContent = landscape ? '横屏 · 沉浸式专注视野' : '竖屏 · 单手专注';
  toast.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => toast.classList.remove('show'), 1700);
}
function toggleOrientation() { setOrientation(!landscape); }

/* React to a real device rotating (mobile / responsive view) */
function syncRealOrientation() {
  const isLand = window.matchMedia('(orientation: landscape)').matches;
  // only auto-sync on small touch screens where it's a real device
  if (window.innerWidth < 1100 && isLand !== landscape) setOrientation(isLand);
}
window.matchMedia('(orientation: landscape)').addEventListener('change', syncRealOrientation);

/* ════════════════════════════════════════════════
   SCREEN SWITCHER
   ════════════════════════════════════════════════ */
function show(id) {
  document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active','entering'); });
  const t = document.getElementById(id);
  if (!t) return;
  t.classList.add('active');
  void t.offsetWidth;
  t.classList.add('entering');
  activeScreen = id;
  // start/stop overlay animation depending on screen
  startOverlayFor(id);
}
let activeScreen = 's-create';

/* ════════════════════════════════════════════════
   CANVAS AMBIENT OVERLAYS  (rain / dust / bokeh / particles)
   ════════════════════════════════════════════════ */
const overlayConfig = {
  rain:    { kind:'rain',  color:'rgba(190,205,255,', count:150 },
  library: { kind:'motes', color:'rgba(255,224,170,', count:55  },
  forest:  { kind:'motes', color:'rgba(190,255,210,', count:50  },
  cyber:   { kind:'spark', color:'rgba(150,200,255,', count:70  },
};
const canvases = []; // {el, ctx, parts, raf}

function registerCanvas(el) {
  const c = { el, ctx: el.getContext('2d'), parts: [], raf: null, w:0, h:0 };
  canvases.push(c);
  return c;
}
function resizeCanvas(c) {
  const r = c.el.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.w = r.width; c.h = r.height;
  c.el.width = r.width * dpr; c.el.height = r.height * dpr;
  c.ctx.setTransform(dpr,0,0,dpr,0,0);
}
function resizeAllCanvases() {
  canvases.forEach(c => { resizeCanvas(c); seedParts(c); });
  if (typeof morphs !== 'undefined') morphs.forEach(m => m.inst.resize());
}

function seedParts(c) {
  const cfg = overlayConfig[currentTheme];
  c.parts = [];
  const n = Math.round(cfg.count * (c.w*c.h)/(390*844));
  for (let i=0;i<Math.max(n,20);i++) c.parts.push(makePart(cfg, c));
}
function makePart(cfg, c) {
  if (cfg.kind === 'rain') {
    return { x:Math.random()*c.w, y:Math.random()*c.h, len:8+Math.random()*16, v:5+Math.random()*7, a:.1+Math.random()*.3 };
  }
  if (cfg.kind === 'spark') {
    return { x:Math.random()*c.w, y:Math.random()*c.h, r:.6+Math.random()*1.8, vx:(Math.random()-.5)*.5, vy:-(.3+Math.random()*.9), a:.2+Math.random()*.6, tw:Math.random()*Math.PI*2 };
  }
  // motes (dust / spores) — slow drift up
  return { x:Math.random()*c.w, y:Math.random()*c.h, r:.8+Math.random()*2.2, vx:(Math.random()-.5)*.25, vy:-(.1+Math.random()*.4), a:.1+Math.random()*.45, tw:Math.random()*Math.PI*2 };
}

function drawCanvas(c) {
  const cfg = overlayConfig[currentTheme];
  const { ctx } = c;
  ctx.clearRect(0,0,c.w,c.h);
  for (const p of c.parts) {
    if (cfg.kind === 'rain') {
      p.y += p.v; p.x += p.v*0.28;
      if (p.y > c.h) { p.y = -p.len; p.x = Math.random()*c.w; }
      ctx.strokeStyle = cfg.color + p.a + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x - p.len*0.28, p.y - p.len); ctx.stroke();
    } else {
      p.x += p.vx; p.y += p.vy; p.tw += 0.04;
      const flick = cfg.kind==='spark' ? (0.5+0.5*Math.sin(p.tw)) : 1;
      if (p.y < -5) { p.y = c.h+5; p.x = Math.random()*c.w; }
      if (p.x < -5) p.x = c.w+5; if (p.x > c.w+5) p.x = -5;
      ctx.fillStyle = cfg.color + (p.a*flick) + ')';
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      if (cfg.kind==='spark') { ctx.fillStyle = cfg.color + (p.a*flick*0.15) + ')'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*3,0,Math.PI*2); ctx.fill(); }
    }
  }
}

let overlayRAF = null;
function overlayLoop() {
  canvases.forEach(c => { if (isVisible(c.el)) drawCanvas(c); });
  overlayRAF = requestAnimationFrame(overlayLoop);
}
function isVisible(el) {
  const sc = el.closest('.screen');
  return sc && sc.classList.contains('active');
}
function startOverlayFor() {
  if (!overlayRAF) overlayLoop();
}

/* ════════════════════════════════════════════════
   CREATE SCREEN INTERACTIONS
   ════════════════════════════════════════════════ */
function pickDur(el, mins) {
  document.querySelectorAll('#dur-row .dur-pill').forEach(p => p.classList.remove('sel'));
  el.classList.add('sel');
  const wrap = document.getElementById('custom-dur-wrap');
  if (mins === 0) {
    wrap.classList.add('show');
    selectedDur = parseInt(document.getElementById('custom-dur').value) || 30;
    setTimeout(()=>document.getElementById('custom-dur').focus(), 120);
  } else {
    wrap.classList.remove('show');
    selectedDur = mins;
  }
}
function onCustomDur(v) {
  let n = parseInt(v); if (isNaN(n)) return;
  n = Math.max(1, Math.min(180, n));
  selectedDur = n;
}

function pickTheme(name) {
  currentTheme = name;
  document.querySelectorAll('.theme-card').forEach(el => el.classList.remove('sel'));
  document.getElementById('tc-' + name).classList.add('sel');
  const url = bgMap[name];
  document.querySelectorAll('.bg-layer').forEach(el => { el.style.backgroundImage = `url('${url}')`; });
  document.getElementById('ambient-name').textContent = themeName[name] + ' 氛围 · 循环播放';
  resizeAllCanvases();
}

function pickStyle(el, style) {
  document.querySelectorAll('.style-card').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  selectedStyle = style;
  applyTimeStyle();
}
function applyTimeStyle() {
  const tb = document.getElementById('time-block');
  tb.classList.remove('style-minimal','style-glass','style-note');
  tb.classList.add('style-' + selectedStyle);
}

/* ── Enter focus ── */
function goFocus() {
  const input = document.getElementById('task-name');
  const name = input.value.trim();
  if (!name) {
    input.classList.add('input-invalid');
    document.getElementById('task-hint').classList.add('show');
    setTimeout(()=>input.classList.remove('input-invalid'), 500);
    input.focus();
    return;
  }
  document.getElementById('task-hint').classList.remove('show');
  document.getElementById('disp-task').textContent = name;
  applyTimeStyle();
  applyCompanionToFocus();
  focusTotal = selectedDur * 60;
  focusSecs  = focusTotal;
  startFocusTick();
  show('s-focus');
}
document.getElementById('task-name')?.addEventListener('input', e => {
  if (e.target.value.trim()) { e.target.classList.remove('input-invalid'); document.getElementById('task-hint').classList.remove('show'); }
});

/* ════════════════════════════════════════════════
   FOCUS TIMER
   ════════════════════════════════════════════════ */
let focusTotal = 50*60, focusSecs = 50*60, focusTick = null;
function fmt(s){ return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
function startFocusTick() {
  clearInterval(focusTick);
  renderFocus();
  focusTick = setInterval(() => {
    if (focusSecs > 0) focusSecs--;
    renderFocus();
  }, 1000);
}
function renderFocus() {
  const cl = document.getElementById('focus-clock'); if (cl) cl.textContent = fmt(focusSecs);
  const elapsed = focusTotal - focusSecs;
  const pct = focusTotal ? Math.min(100, Math.round(elapsed/focusTotal*100)) : 0;
  const bar = document.getElementById('focus-bar'); if (bar) bar.style.width = pct + '%';
  const pe = document.getElementById('focus-pct'); if (pe) pe.textContent = pct + '%';
}

/* ════════════════════════════════════════════════
   COOLDOWN TIMER
   ════════════════════════════════════════════════ */
const COOL_TOTAL = 10*60;
let coolSecs = COOL_TOTAL, coolTick = null, coolRunning = false;
const circum = 2 * Math.PI * 60;

function startCooldown() {
  // capture the written reason (kept gentle, just echo)
  const reason = document.getElementById('reason-input').value.trim();
  document.getElementById('reason-echo').textContent = reason ? `“${reason}”` : '';
  document.getElementById('reason-echo').style.display = reason ? 'block' : 'none';
  show('s-exit-3');
  coolRunning = true;
  coolSecs = COOL_TOTAL;
  renderCool();
  clearInterval(coolTick);
  coolTick = setInterval(() => {
    if (coolSecs > 0) coolSecs--;
    renderCool();
    if (coolSecs === 0) { clearInterval(coolTick); coolRunning = false; setTimeout(()=>show('s-exit-4'), 1300); }
  }, 1000);
}
function renderCool() {
  const cl = document.getElementById('cool-clock'); if (cl) cl.textContent = fmt(coolSecs);
  const ring = document.getElementById('cool-ring'); if (ring) ring.style.strokeDashoffset = circum * (coolSecs/COOL_TOTAL);
}
/* demo fast-forward — tap the ring */
function skipCooldown() {
  if (!coolRunning) return;
  coolSecs = 3; renderCool();
}

function backToFocus() { startOverlayFor(); show('s-focus'); }
function emergencyExit() { clearInterval(focusTick); clearInterval(coolTick); coolRunning=false; show('s-emergency'); }
function resetToCreate() { clearInterval(focusTick); clearInterval(coolTick); coolRunning=false; show('s-create'); }

/* ════════════════════════════════════════════════
   GENTLE ROTATING MESSAGES (cooldown)
   ════════════════════════════════════════════════ */
const gentleMessages = [
  "你不需要完成所有事，<br>只是继续待着，就已经很好了。",
  "冲动像浪潮，会升起，也会退去，<br>你现在只需要等它过去。",
  "写下那些念头，是为了看清它，<br>不是为了评判你自己。",
  "十分钟很短，<br>也足够深呼吸几次。",
  "任何时候回来都不算晚，<br>你一直都有选择权。",
];
let msgIdx = 0;
setInterval(() => {
  const el = document.getElementById('cool-msg');
  if (!el || !document.getElementById('s-exit-3').classList.contains('active')) return;
  el.style.opacity = '0';
  setTimeout(() => { msgIdx = (msgIdx+1)%gentleMessages.length; el.innerHTML = gentleMessages[msgIdx]; el.style.opacity = '1'; }, 420);
}, 5200);

/* ════════════════════════════════════════════════
   LIVE STATUS BAR CLOCK
   ════════════════════════════════════════════════ */
function tickClock() {
  const d = new Date();
  const t = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  document.querySelectorAll('.sb-time').forEach(e => e.textContent = t);
}
setInterval(tickClock, 1000); tickClock();

/* ════════════════════════════════════════════════
   KEYBOARD
   ════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && activeScreen === 's-create' && document.activeElement.id !== 'reason-input') {
    if (document.activeElement.tagName !== 'TEXTAREA') { e.preventDefault(); goFocus(); }
  }
  if (e.key === 'Escape') {
    if (activeScreen === 's-focus') show('s-exit-1');
    else if (activeScreen === 's-exit-2') show('s-exit-1');
    else if (activeScreen === 's-exit-1') backToFocus();
  }
  if (e.key.toLowerCase() === 'r' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) toggleOrientation();
});

/* ════════════════════════════════════════════════
   COMPANION — 陪伴者 particle-morph engine
   ────────────────────────────────────────────────
   归一化坐标 (0..1 居中正方形) 的程序化大师肖像点云，
   在两种「演变形态」之间持续 morph 轮播，参照 xianbian/preview.html
   的 lerp + easeInOutCubic + 加性辉光做法，但无需任何外部图片。
   ════════════════════════════════════════════════ */
const COMPANIONS = {
  jobs:     { name:'乔布斯',   quote:'求知若饥，虚心若愚',     tint:[125,211,252] },
  munger:   { name:'芒格',     quote:'反过来想，总是反过来想', tint:[167,139,250] },
  einstein: { name:'爱因斯坦', quote:'想象力比知识更重要',     tint:[140,210,255] },
  davinci:  { name:'达·芬奇',  quote:'简约，是终极的精致',     tint:[240,206,150] },
};

/* primitive helper — p(type, {...}) */
function p(type, o) { return Object.assign({ type, n: 30, a: 0.7, c: [225,233,246] }, o); }

/* ── iconic SYMBOL forms (each companion morphs 肖像 → 符号A → 符号B, then loops) ── */
const SYM_LIGHTBULB = [ // Jobs · idea
  p('r',{x:.5,y:.40,rx:.13,ry:.145,t:.12,n:96,c:[150,222,255],a:.92}),   // glass bulb
  p('e',{x:.5,y:.40,rx:.10,ry:.11,n:34,c:[120,200,250],a:.30}),          // inner glow
  p('l',{x1:.46,y1:.42,x2:.50,y2:.34,w:.006,n:14,c:[255,255,255],a:.95}),// filament
  p('l',{x1:.50,y1:.34,x2:.54,y2:.42,w:.006,n:14,c:[255,255,255],a:.95}),
  p('l',{x1:.43,y1:.55,x2:.57,y2:.55,w:.004,n:22,c:[205,222,242],a:.85}),// screw threads
  p('l',{x1:.44,y1:.59,x2:.56,y2:.59,w:.004,n:20,c:[205,222,242],a:.85}),
  p('l',{x1:.45,y1:.63,x2:.55,y2:.63,w:.004,n:18,c:[205,222,242],a:.8}),
  p('l',{x1:.46,y1:.67,x2:.54,y2:.71,w:.004,n:14,c:[205,222,242],a:.7}),
  p('l',{x1:.5,y1:.17,x2:.5,y2:.09,w:.004,n:9,c:[125,211,252],a:.7}),    // rays
  p('l',{x1:.30,y1:.29,x2:.24,y2:.23,w:.004,n:9,c:[125,211,252],a:.7}),
  p('l',{x1:.70,y1:.29,x2:.76,y2:.23,w:.004,n:9,c:[125,211,252],a:.7}),
  p('l',{x1:.25,y1:.44,x2:.17,y2:.44,w:.004,n:9,c:[125,211,252],a:.6}),
  p('l',{x1:.75,y1:.44,x2:.83,y2:.44,w:.004,n:9,c:[125,211,252],a:.6}),
];
const SYM_ATOM = [ // Einstein · relativity / atom
  p('e',{x:.5,y:.5,rx:.03,ry:.03,n:34,c:[255,255,255],a:1}),             // nucleus
  p('r',{x:.5,y:.5,rx:.30,ry:.10,t:.04,n:74,c:[140,210,255],a:.8,rot:0}),
  p('r',{x:.5,y:.5,rx:.30,ry:.10,t:.04,n:74,c:[140,210,255],a:.8,rot:1.05}),
  p('r',{x:.5,y:.5,rx:.30,ry:.10,t:.04,n:74,c:[140,210,255],a:.8,rot:-1.05}),
  p('e',{x:.80,y:.50,rx:.02,ry:.02,n:16,c:[125,211,252],a:1}),           // electrons
  p('e',{x:.355,y:.31,rx:.018,ry:.018,n:14,c:[125,211,252],a:1}),
  p('e',{x:.355,y:.69,rx:.018,ry:.018,n:14,c:[125,211,252],a:1}),
];
const SYM_LATTICE = [ // Munger · 多元思维模型 lattice grid
  ...[.32,.44,.56,.68].map(x=>p('l',{x1:x,y1:.30,x2:x,y2:.70,w:.004,n:26,c:[167,139,250],a:.65})),
  ...[.30,.42,.54,.66].map(y=>p('l',{x1:.30,y1:y,x2:.70,y2:y,w:.004,n:26,c:[167,139,250],a:.65})),
  ...[.32,.44,.56,.68].flatMap(x=>[.30,.42,.54,.66].map(y=>p('e',{x,y,rx:.011,ry:.011,n:6,c:[214,202,255],a:.95}))),
];
const SYM_VITRUVIAN = [ // Da Vinci · 维特鲁威人
  p('r',{x:.5,y:.52,rx:.32,ry:.32,t:.03,n:130,c:[240,206,150],a:.7}),    // circle
  p('l',{x1:.20,y1:.22,x2:.80,y2:.22,w:.004,n:22,c:[224,196,150],a:.5}), // square
  p('l',{x1:.20,y1:.82,x2:.80,y2:.82,w:.004,n:22,c:[224,196,150],a:.5}),
  p('l',{x1:.20,y1:.22,x2:.20,y2:.82,w:.004,n:22,c:[224,196,150],a:.5}),
  p('l',{x1:.80,y1:.22,x2:.80,y2:.82,w:.004,n:22,c:[224,196,150],a:.5}),
  p('e',{x:.5,y:.30,rx:.045,ry:.05,n:32,c:[244,222,180],a:.72}),         // head
  p('l',{x1:.5,y1:.35,x2:.5,y2:.62,w:.006,n:26,c:[242,220,180],a:.7}),   // torso
  p('l',{x1:.5,y1:.42,x2:.24,y2:.35,w:.005,n:18,c:[242,220,180],a:.6}),  // arms (spread + raised)
  p('l',{x1:.5,y1:.42,x2:.76,y2:.35,w:.005,n:18,c:[242,220,180],a:.6}),
  p('l',{x1:.5,y1:.42,x2:.26,y2:.47,w:.005,n:14,c:[242,220,180],a:.5}),
  p('l',{x1:.5,y1:.42,x2:.74,y2:.47,w:.005,n:14,c:[242,220,180],a:.5}),
  p('l',{x1:.5,y1:.62,x2:.40,y2:.81,w:.006,n:18,c:[242,220,180],a:.6}),  // legs
  p('l',{x1:.5,y1:.62,x2:.60,y2:.81,w:.006,n:18,c:[242,220,180],a:.6}),
];

/* Each companion → array of "forms" (演变形态). Coords normalized 0..1, y down.
   Form 0 = 基础肖像；Form 1 = 轻微演变（神态/光点变化），循环 morph 制造「演变」。 */
const C_FORMS = {
  jobs: [
    [ // turtleneck + bald head + round rimless glasses
      p('e',{x:.50,y:.93,rx:.34,ry:.15,n:130,c:[96,118,164],a:.42}),     // turtleneck
      p('e',{x:.50,y:.70,rx:.10,ry:.09,n:26, c:[206,214,228],a:.42}),     // neck
      p('e',{x:.50,y:.42,rx:.155,ry:.205,n:150,c:[227,235,247],a:.62}),   // face
      p('arc',{x:.50,y:.42,rx:.16,ry:.21,a0:-2.5,a1:2.5,t:.10,n:46,c:[180,205,235],a:.5}), // jaw rim
      p('e',{x:.345,y:.43,rx:.024,ry:.05,n:14,c:[210,220,236],a:.4}),     // L ear
      p('e',{x:.655,y:.43,rx:.024,ry:.05,n:14,c:[210,220,236],a:.4}),     // R ear
      p('r',{x:.435,y:.40,rx:.056,ry:.056,t:.2,n:64,c:[125,211,252],a:.95}), // L glass
      p('r',{x:.565,y:.40,rx:.056,ry:.056,t:.2,n:64,c:[125,211,252],a:.95}), // R glass
      p('l',{x1:.491,y1:.40,x2:.509,y2:.40,w:.012,n:10,c:[125,211,252],a:.85}), // bridge
      p('e',{x:.435,y:.40,rx:.012,ry:.012,n:8,c:[245,251,255],a:.95}),    // L glint
      p('e',{x:.565,y:.40,rx:.012,ry:.012,n:8,c:[245,251,255],a:.95}),    // R glint
      p('e',{x:.50,y:.585,rx:.072,ry:.044,n:48,c:[168,180,198],a:.5}),    // goatee/stubble
    ],
    (n) => fromCandidates(textPoints('Stay\nHungry', { fs:56, weight:800 }), n, [150,222,255], .92), // 名言
    SYM_LIGHTBULB, // 灵感
  ],
  munger: [
    [ // fuller older face, side-parted hair, heavy SQUARE glasses, suit collar
      p('e',{x:.50,y:.94,rx:.36,ry:.15,n:120,c:[120,110,150],a:.4}),      // suit shoulders
      p('l',{x1:.42,y1:.80,x2:.50,y2:.92,w:.01,n:18,c:[210,216,232],a:.45}), // collar L
      p('l',{x1:.58,y1:.80,x2:.50,y2:.92,w:.01,n:18,c:[210,216,232],a:.45}), // collar R
      p('e',{x:.50,y:.44,rx:.165,ry:.20,n:150,c:[228,232,244],a:.6}),     // face (rounder)
      p('arc',{x:.50,y:.27,rx:.17,ry:.13,a0:3.4,a1:6.0,t:.16,n:46,c:[206,212,228],a:.5}), // side-parted hair
      p('e',{x:.35,y:.45,rx:.022,ry:.045,n:12,c:[214,220,236],a:.4}),     // L ear
      p('e',{x:.65,y:.45,rx:.022,ry:.045,n:12,c:[214,220,236],a:.4}),     // R ear
      // square glasses — 4 sides each lens
      p('l',{x1:.375,y1:.375,x2:.475,y2:.375,w:.006,n:18,c:[167,139,250],a:.95}),
      p('l',{x1:.375,y1:.455,x2:.475,y2:.455,w:.006,n:18,c:[167,139,250],a:.95}),
      p('l',{x1:.375,y1:.375,x2:.375,y2:.455,w:.006,n:14,c:[167,139,250],a:.95}),
      p('l',{x1:.475,y1:.375,x2:.475,y2:.455,w:.006,n:14,c:[167,139,250],a:.95}),
      p('l',{x1:.525,y1:.375,x2:.625,y2:.375,w:.006,n:18,c:[167,139,250],a:.95}),
      p('l',{x1:.525,y1:.455,x2:.625,y2:.455,w:.006,n:18,c:[167,139,250],a:.95}),
      p('l',{x1:.525,y1:.375,x2:.525,y2:.455,w:.006,n:14,c:[167,139,250],a:.95}),
      p('l',{x1:.625,y1:.375,x2:.625,y2:.455,w:.006,n:14,c:[167,139,250],a:.95}),
      p('l',{x1:.475,y1:.415,x2:.525,y2:.415,w:.006,n:8,c:[167,139,250],a:.9}), // bridge
    ],
    SYM_LATTICE, // 多元思维模型 · 格栅
    (n) => compoundForm(n, [167,139,250]), // 复利曲线
  ],
  einstein: [
    [ // wild hair halo + bushy mustache
      p('s',{x:.50,y:.26,rx:.30,ry:.20,n:150,c:[224,232,244],a:.5}),      // wild hair cloud
      p('e',{x:.50,y:.46,rx:.15,ry:.19,n:130,c:[228,234,246],a:.6}),      // face
      p('arc',{x:.50,y:.42,rx:.155,ry:.20,a0:-2.4,a1:2.4,t:.1,n:40,c:[185,205,232],a:.45}),
      p('e',{x:.42,y:.43,rx:.03,ry:.012,n:14,c:[150,200,250],a:.55}),     // L brow
      p('e',{x:.58,y:.43,rx:.03,ry:.012,n:14,c:[150,200,250],a:.55}),     // R brow
      p('e',{x:.43,y:.47,rx:.012,ry:.012,n:9,c:[245,251,255],a:.9}),      // L eye
      p('e',{x:.57,y:.47,rx:.012,ry:.012,n:9,c:[245,251,255],a:.9}),      // R eye
      p('e',{x:.50,y:.585,rx:.10,ry:.038,n:64,c:[206,214,228],a:.62}),    // big mustache
      p('e',{x:.50,y:.78,rx:.22,ry:.10,n:60,c:[110,128,166],a:.4}),       // collar/coat
    ],
    (n) => fromCandidates(textPoints('E=mc²', { fs:80, weight:800 }), n, [140,210,255], .95), // 质能方程
    SYM_ATOM, // 原子
  ],
  davinci: [
    [ // long flowing hair + full beard (Renaissance), warm gold tint
      p('s',{x:.50,y:.30,rx:.26,ry:.24,n:120,c:[236,210,168],a:.5}),      // long hair top/sides
      p('e',{x:.36,y:.55,rx:.05,ry:.18,n:40,c:[230,206,166],a:.45}),      // hair L drape
      p('e',{x:.64,y:.55,rx:.05,ry:.18,n:40,c:[230,206,166],a:.45}),      // hair R drape
      p('e',{x:.50,y:.44,rx:.14,ry:.18,n:118,c:[242,226,200],a:.6}),      // face
      p('e',{x:.435,y:.43,rx:.013,ry:.013,n:9,c:[120,200,250],a:.8}),     // L eye (cool spark)
      p('e',{x:.565,y:.43,rx:.013,ry:.013,n:9,c:[120,200,250],a:.8}),     // R eye
      p('e',{x:.50,y:.49,rx:.018,ry:.03,n:14,c:[228,206,170],a:.5}),      // nose
      p('e',{x:.50,y:.66,rx:.115,ry:.13,n:96,c:[230,208,170],a:.55}),     // full beard
      p('arc',{x:.50,y:.55,rx:.045,ry:.03,a0:.5,a1:2.64,t:.1,n:16,c:[210,180,140],a:.45}), // mustache curve
    ],
    SYM_VITRUVIAN, // 维特鲁威人
    (n) => spiralForm(n, [244,214,160]), // 黄金螺旋
  ],
};

function easeIO(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

function samplePrim(pr){
  const R = Math.random;
  let ox, oy;
  if (pr.type === 'l'){ const t=R(); return [pr.x1+(pr.x2-pr.x1)*t+(R()-.5)*(pr.w||.01), pr.y1+(pr.y2-pr.y1)*t+(R()-.5)*(pr.w||.01)]; }
  if (pr.type === 'e'){ const u=Math.sqrt(R()), a=R()*6.2832; ox=Math.cos(a)*pr.rx*u; oy=Math.sin(a)*pr.ry*u; }
  else if (pr.type === 'r'){ const a=R()*6.2832, rr=1+(R()-.5)*(pr.t||.16); ox=Math.cos(a)*pr.rx*rr; oy=Math.sin(a)*pr.ry*rr; }
  else if (pr.type === 'arc'){ const t=R(), ang=pr.a0+(pr.a1-pr.a0)*t, rr=1+(R()-.5)*(pr.t||.12); ox=Math.cos(ang)*pr.rx*rr; oy=Math.sin(ang)*pr.ry*rr; }
  else { const u=.5+R()*.55, a=R()*6.2832; ox=Math.cos(a)*pr.rx*u; oy=Math.sin(a)*pr.ry*u; } // scatter — rim-biased
  if (pr.rot){ const c=Math.cos(pr.rot), s=Math.sin(pr.rot); const rx=ox*c-oy*s, ry=ox*s+oy*c; ox=rx; oy=ry; }
  return [pr.x+ox, pr.y+oy];
}

/* ── text → normalized point candidates (for iconic word-forms like "E=mc²") ── */
let _offc, _offx;
function textPoints(text, opt={}){
  const S = 240;
  if (!_offc){ _offc = document.createElement('canvas'); _offc.width = S; _offc.height = S; _offx = _offc.getContext('2d', { willReadFrequently:true }); }
  const ctx = _offx; ctx.clearRect(0,0,S,S);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = text.split('\n');
  const fs = opt.fs || (lines.length>1 ? 64 : 88);
  ctx.font = `${opt.weight||800} ${fs}px ${opt.font||'"Inter","Noto Sans SC",sans-serif'}`;
  const lh = fs*1.04;
  lines.forEach((ln,i)=> ctx.fillText(ln, S/2, S/2 + (i-(lines.length-1)/2)*lh));
  let data; try { data = ctx.getImageData(0,0,S,S).data; } catch(e){ return [[.5,.5]]; }
  const cand = [];
  for (let y=0;y<S;y+=2){ for (let x=0;x<S;x+=2){ if (data[(y*S+x)*4+3] > 90) cand.push([x/S, y/S]); } }
  return cand.length ? cand : [[.5,.5]];
}
function fromCandidates(cand, count, color, alpha){
  const pts = [];
  for (let i=0;i<count;i++){
    const c = cand[(Math.random()*cand.length)|0];
    const j = () => (Math.random()-.5)*0.01;
    pts.push({ nx:c[0]+j(), ny:c[1]+j(), r:color[0], g:color[1], b:color[2], a:alpha*(0.7+Math.random()*0.4) });
  }
  return pts;
}
/* parametric generators (return exactly `count` normalized points) */
function spiralForm(count, color){
  const pts = [];
  for (let i=0;i<count;i++){ const t=i/count; const ang=t*6.2832*3.0; const rad=0.02+0.32*t;
    pts.push({ nx:.5+Math.cos(ang)*rad, ny:.5+Math.sin(ang)*rad, r:color[0],g:color[1],b:color[2], a:.45+Math.random()*.45 }); }
  return pts;
}
function compoundForm(count, color){
  const pts = [];
  for (let i=0;i<count;i++){
    if (i % 9 === 0){ const t=Math.random(); pts.push({ nx:.20+t*.60, ny:.74, r:color[0],g:color[1],b:color[2], a:.3 }); continue; } // baseline axis
    const t=Math.random(); const x=.20+t*.60; const y=.74-Math.pow(t,2.3)*.52; const j=(Math.random()-.5)*.012;
    pts.push({ nx:x+j, ny:y+j, r:color[0],g:color[1],b:color[2], a:.55+Math.random()*.4 });
  }
  return pts;
}

/* build target points from a form — array(primitives) | function(generator) */
function buildForm(form, count){
  return (typeof form === 'function') ? form(count) : sampleForm(form, count);
}

/* build `count` normalized target points from one form (array of primitives) */
function sampleForm(prims, count){
  let total = 0; for (const pr of prims) total += pr.n;
  const pts = [];
  for (let i=0;i<count;i++){
    let r = Math.random()*total, pr = prims[0];
    for (const q of prims){ r -= q.n; if (r<=0){ pr=q; break; } }
    const [nx,ny] = samplePrim(pr);
    const j = () => (Math.random()-.5)*0.012;
    pts.push({ nx:nx+j(), ny:ny+j(), r:pr.c[0], g:pr.c[1], b:pr.c[2], a:pr.a*(0.7+Math.random()*0.45) });
  }
  return pts;
}

class ParticleMorph {
  constructor(canvas, key, opt={}){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.count = opt.count || 460;
    this.morphMs = opt.morphMs || 2600;
    this.holdMs  = opt.holdMs  || 2100;
    this.loopForms = opt.loopForms !== false;
    this.box = {x:0,y:0,s:0};
    this.parts = [];
    this.formIdx = 0;
    this.t0 = performance.now();
    this.phase = 'morph';
    this.setCompanion(key, true);
    this.resize();
  }
  resize(){
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    this.canvas.width = Math.max(1, rect.width*dpr);
    this.canvas.height = Math.max(1, rect.height*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=rect.width, h=rect.height, s=Math.min(w,h);
    this.box = { x:(w-s)/2, y:(h-s)/2, s, w, h };
  }
  setCompanion(key, instant=false){
    this.key = key;
    this.forms = C_FORMS[key] || C_FORMS.jobs;
    const target = buildForm(this.forms[0], this.count);
    if (instant || !this.parts.length){
      this.parts = target.map(t => ({ nx:t.nx, ny:t.ny, fnx:t.nx, fny:t.ny, tnx:t.nx, tny:t.ny, r:t.r,g:t.g,b:t.b,a:t.a, seed:Math.random()*6.2832 }));
      this.formIdx = 0;
    } else {
      this.retargetTo(target, 0);
    }
    this.t0 = performance.now(); this.phase='morph';
  }
  retargetTo(target, formIdx){
    for (let i=0;i<this.parts.length;i++){
      const p2 = this.parts[i], t = target[i];
      p2.fnx=p2.nx; p2.fny=p2.ny; p2.tnx=t.nx; p2.tny=t.ny;
      p2.tr=t.r; p2.tg=t.g; p2.tb=t.b; p2.ta=t.a;
      p2.sr=p2.r; p2.sg=p2.g; p2.sb=p2.b; p2.sa=p2.a;
    }
    this.formIdx = formIdx;
    this.t0 = performance.now(); this.phase='morph';
  }
  nextForm(){
    // card orbs stay on the portrait (just re-breathe); focus stage cycles through all images
    const next = this.loopForms ? (this.formIdx + 1) % this.forms.length : 0;
    this.retargetTo(buildForm(this.forms[next], this.count), next);
  }
  update(now){
    if (this.phase === 'morph'){
      const k = Math.min(1, (now - this.t0)/this.morphMs);
      const e = easeIO(k);
      for (const p2 of this.parts){
        p2.nx = p2.fnx + (p2.tnx - p2.fnx)*e;
        p2.ny = p2.fny + (p2.tny - p2.fny)*e;
        if (p2.tr!=null){ p2.r=p2.sr+(p2.tr-p2.sr)*e; p2.g=p2.sg+(p2.tg-p2.sg)*e; p2.b=p2.sb+(p2.tb-p2.sb)*e; p2.a=p2.sa+(p2.ta-p2.sa)*e; }
      }
      if (k >= 1){ this.phase='hold'; this.t0=now; }
    } else if (now - this.t0 > this.holdMs){
      this.nextForm();
    }
  }
  draw(now){
    const { ctx, box } = this;
    ctx.clearRect(0,0,box.w,box.h);
    ctx.globalCompositeOperation = 'lighter';
    const t = now*0.001;
    for (const p2 of this.parts){
      const dx = Math.sin(t*1.1 + p2.seed)*1.1;
      const dy = Math.cos(t*0.9 + p2.seed*1.3)*1.1;
      const px = box.x + p2.nx*box.s + dx;
      const py = box.y + p2.ny*box.s + dy;
      const col = `${p2.r|0},${p2.g|0},${p2.b|0}`;
      ctx.fillStyle = `rgba(${col},${p2.a*0.16})`;
      ctx.beginPath(); ctx.arc(px,py, 2.6, 0, 6.2832); ctx.fill();        // halo
      ctx.fillStyle = `rgba(${col},${Math.min(1,p2.a)})`;
      ctx.beginPath(); ctx.arc(px,py, 0.9, 0, 6.2832); ctx.fill();        // core
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

const morphs = []; // {inst, canvas}
let morphRAF = null;
function morphLoop(){
  const now = performance.now();
  for (const m of morphs){
    if (!isVisible(m.canvas)) continue;
    m.inst.update(now);
    m.inst.draw(now);
  }
  morphRAF = requestAnimationFrame(morphLoop);
}
function startMorphLoop(){ if (!morphRAF) morphLoop(); }

let focusMorph = null;
function buildCardPreviews(){
  document.querySelectorAll('canvas.cc-orb[data-comp]').forEach(cv => {
    const key = cv.dataset.comp;
    const inst = new ParticleMorph(cv, key, { count:150, morphMs:2400, holdMs:1900, loopForms:false });
    morphs.push({ inst, canvas: cv });
  });
}
function pickCompanion(key){
  selectedCompanion = key;
  document.querySelectorAll('.companion-card').forEach(c => c.classList.toggle('sel', c.dataset.comp === key));
}
function applyCompanionToFocus(){
  const fc = document.getElementById('focus-center');
  const stage = document.getElementById('companion-stage');
  const cv = document.getElementById('companion-canvas');
  if (selectedCompanion === 'none'){
    fc.classList.remove('has-companion');
    if (focusMorph){ const i = morphs.findIndex(m => m.canvas === cv); if (i>=0) morphs.splice(i,1); focusMorph=null; }
    return;
  }
  const meta = COMPANIONS[selectedCompanion];
  document.getElementById('companion-cap-name').textContent = meta.name;
  document.getElementById('companion-cap-quote').textContent = meta.quote;
  fc.classList.add('has-companion');
  // (re)build the large focus morph for the chosen companion
  if (!focusMorph){
    focusMorph = new ParticleMorph(cv, selectedCompanion, { count:560, morphMs:2600, holdMs:2700 });
    morphs.push({ inst: focusMorph, canvas: cv });
  } else {
    focusMorph.setCompanion(selectedCompanion, true);
  }
  requestAnimationFrame(() => focusMorph.resize());
}

/* ════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════ */
function init() {
  // register all bg canvases
  document.querySelectorAll('.bg-canvas').forEach(el => registerCanvas(el));
  resizeAllCanvases();
  pickTheme('rain');
  applyTimeStyle();
  fitDevice();
  show('s-create');
  // build card particle previews after the create screen is visible (display:block → measurable size)
  buildCardPreviews();
  startMorphLoop();
  overlayLoop();
}
window.addEventListener('load', init);
