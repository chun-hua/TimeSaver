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
function resizeAllCanvases() { canvases.forEach(c => { resizeCanvas(c); seedParts(c); }); }

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
  overlayLoop();
}
window.addEventListener('load', init);
