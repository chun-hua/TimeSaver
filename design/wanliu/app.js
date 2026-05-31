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
   归一化坐标 (0..1 居中正方形) 的程序化大师标志点云，
   在三种「演变形态」之间持续 morph 轮播：
     画面① = 标志性符号（苹果/时空曲率/书堆/飞行器）
     画面② = 核心理念符号
     画面③ = 象征图形
   无外部图片依赖，纯粒子渲染 + 多层光晕 + 呼吸脉动。
   ════════════════════════════════════════════════ */
const COMPANIONS = {
  jobs:       { name:'乔布斯',   quote:'求知若饥，虚心若愚',     tint:[125,211,252] },
  munger:     { name:'芒格',     quote:'反过来想，总是反过来想', tint:[167,139,250] },
  feynman:    { name:'费曼',     quote:'命名不等于理解',         tint:[100,195,215] },
  taleb:      { name:'塔勒布',   quote:'Skin in the Game',       tint:[215,165,95] },
  musk:       { name:'马斯克',   quote:'从第一性原理出发',       tint:[210,65,45] },
  naval:      { name:'纳瓦尔',   quote:'追求特定知识',           tint:[185,165,120] },
  pg:         { name:'Paul Graham', quote:'做不可规模化的事',    tint:[140,165,185] },
  einstein:   { name:'爱因斯坦', quote:'想象力比知识更重要',     tint:[140,210,255] },
  davinci:    { name:'达·芬奇',  quote:'简约，是终极的精致',     tint:[240,206,150] },
  zhangyiming:{ name:'张一鸣',   quote:'延迟满足感',             tint:[80,140,200] },
  sunyuchen:  { name:'孙宇晨',   quote:'注意力即财富',           tint:[255,175,30] },
};

/* ── Jobs 8-Stage Narrative ── */
const JOB_STAGES = [
  { name:'初心', chinese:'求知若饥\n虚心若愚', english:'Stay Hungry. Stay Foolish.', context:'1972 · Reed College 辍学 — 跟随好奇心，不问用处', tint:[220,210,180] },
  { name:'连线', chinese:'你无法前瞻连接人生的点\n只能回溯地理解', english:'You can\'t connect the dots looking forward.', context:'1984 · Macintosh 诞生 — 书法课→字体，看似无用的点在此交汇', tint:[180,200,230] },
  { name:'聚焦', chinese:'聚焦不是对想做之事说Yes\n而是对其他好主意说No', english:'Focus is saying no to the hundred other good ideas.', context:'1997 · 回归Apple — 350个产品砍到10个。创新就是对一千件事说不。', tint:[230,180,170] },
  { name:'交汇', chinese:'技术必须与人文结合\n才能让心灵歌唱', english:'Technology alone is not enough.', context:'2007 · iPhone — 技术与人文的交汇处，能产生改变世界的东西', tint:[170,210,220] },
  { name:'力场', chinese:'那些疯狂到想改变世界的人\n才是真正改变世界的人', english:'The people who are crazy enough to think they can change the world, are the ones who do.', context:'Think Different · 用现实扭曲力场让不可能成为可能。', tint:[200,170,230] },
  { name:'涅槃', chinese:'被Apple开除\n是我一生最好的事', english:'Getting fired from Apple was the best thing that could have ever happened to me.', context:'1985 被逐 → NeXT → Pixar → 1997 王者归来。毁灭是重生的入口。', tint:[240,190,130] },
  { name:'死亡', chinese:'把每一天当作最后一天来过\n总有一天你会是对的', english:'If you live each day as if it was your last, someday you\'ll most certainly be right.', context:'2005 · Stanford — 死亡是生命最好的发明。用它做决策工具。', tint:[210,200,240] },
  { name:'前行', chinese:'你的时间有限\n不要活成别人的样子', english:'Your time is limited. Don\'t waste it living someone else\'s life.', context:'1955–2011 · 「Oh wow. Oh wow. Oh wow.」— 故事未完，路在前方。', tint:[240,225,195] },
];

/* ── Munger 8-Stage Narrative ── */
const MUNGER_STAGES = [
  { name:'初心', chinese:'我这辈子遇到的聪明人\n没有一个不每天阅读的', english:'In my whole life, I have known no wise people who didn\'t read all the time.', context:'1924年生 · 从小酷爱阅读 — \"我手里只要有一本书，就不会觉得在浪费时间\"', tint:[190,175,230] },
  { name:'格栅', chinese:'你必须拥有多元思维模型\n用不同学科看同一个问题', english:'You must know the big ideas in all the important disciplines.', context:'核心方法论 — 物理学、生物学、心理学、经济学…80-90个模型构成思维格栅', tint:[167,139,250] },
  { name:'逆向', chinese:'反过来想\n总是反过来想', english:'Invert, always invert.', context:'二战飞行员阿尔·门罗的智慧 — 不问如何成功，先问怎么保证失败', tint:[180,155,240] },
  { name:'误判', chinese:'如果我知道会死在哪里\n我就永远不去那个地方', english:'If I know where I\'ll die, I\'ll never go there.', context:'人类误判心理学 — 25种认知偏误，Lollapalooza效应是最危险的那个', tint:[200,150,220] },
  { name:'能力圈', chinese:'知道自己不知道什么\n比聪明更重要', english:'Knowing what you don\'t know is more useful than being brilliant.', context:'三筐法则 — Yes / No / Too Hard。大部分问题属于第三筐', tint:[190,160,200] },
  { name:'等待', chinese:'大钱不在买卖里\n在等待里', english:'The big money is not in the buying and selling, but in the waiting.', context:'Costco · 1997年买入，27年一股没卖。坐在屁股上不动是最高智慧', tint:[210,180,200] },
  { name:'简单', chinese:'把问题简化到最基本的元素\n然后诚实面对', english:'Take a simple idea and take it seriously.', context:'葡萄干与粪便法则 — 好的元素无法中和坏的。简单但致命的有效', tint:[220,190,210] },
  { name:'传承', chinese:'获取智慧是一种道德责任\n不传下去就是浪费', english:'Acquiring wisdom is a moral duty.', context:'1924–2023 · 99岁离世，一生践行终身学习。智慧必须传给下一代', tint:[230,210,220] },
];

/* primitive helper — p(type, {...}) */
function p(type, o) { return Object.assign({ type, n: 30, a: 0.7, c: [225,233,246] }, o); }

/* ── Jobs 8-stage shape builder ── */
function buildJobsStages() {
  // Each stage returns a shape-building function (or primitives array) that
  // accepts the stage's tint. Called per-morph with the current stage's tint.
  return JOB_STAGES.map((stage, idx) => {
    return (n, tint) => buildJobsForm(idx, n, tint || stage.tint);
  });
}
function buildJobsForm(idx, count, tint) {
  const [R,G,B] = tint;
  const prims = JOBS_FORMS[idx];
  if (!prims) return sampleForm([p('s',{x:.5,y:.5,rx:.30,ry:.28,n:count,c:tint,a:.5})], count);
  // Recolor prims with the current stage's tint while keeping shape geometry
  const recolored = prims.map(pr => {
    const c = pr._tc || pr.c || [220,220,220];
    return Object.assign({}, pr, { c });
  });
  return sampleForm(recolored, count);
}

const JOBS_FORMS = [
  // [0] 初心 — 散点云团
  [
    p('s',{x:.5,y:.5,rx:.32,ry:.30,n:280,c:[220,210,180],a:.38,_tc:[220,210,180]}),
    p('s',{x:.5,y:.5,rx:.18,ry:.16,n:120,c:[220,210,180],a:.55,_tc:[220,210,180]}),
    p('s',{x:.5,y:.5,rx:.08,ry:.07,n:60,c:[240,230,200],a:.7,_tc:[240,230,200]}),
  ],
  // [1] 连线 — 散点+连线网络
  [
    p('s',{x:.28,y:.32,rx:.08,ry:.07,n:40,c:[180,200,230],a:.65,_tc:[180,200,230]}),
    p('s',{x:.62,y:.24,rx:.07,ry:.06,n:35,c:[180,200,230],a:.6,_tc:[180,200,230]}),
    p('s',{x:.44,y:.58,rx:.09,ry:.08,n:45,c:[180,200,230],a:.65,_tc:[180,200,230]}),
    p('s',{x:.72,y:.55,rx:.06,ry:.05,n:30,c:[180,200,230],a:.55,_tc:[180,200,230]}),
    p('s',{x:.20,y:.65,rx:.07,ry:.06,n:35,c:[180,200,230],a:.55,_tc:[180,200,230]}),
    p('s',{x:.55,y:.38,rx:.06,ry:.05,n:30,c:[180,200,230],a:.6,_tc:[180,200,230]}),
    p('l',{x1:.28,y1:.32,x2:.55,y2:.38,w:.004,n:30,c:[210,230,255],a:.5,_tc:[210,230,255]}),
    p('l',{x1:.55,y1:.38,x2:.62,y2:.24,w:.004,n:25,c:[210,230,255],a:.45,_tc:[210,230,255]}),
    p('l',{x1:.55,y1:.38,x2:.44,y2:.58,w:.004,n:30,c:[210,230,255],a:.5,_tc:[210,230,255]}),
    p('l',{x1:.44,y1:.58,x2:.72,y2:.55,w:.004,n:25,c:[210,230,255],a:.45,_tc:[210,230,255]}),
    p('l',{x1:.44,y1:.58,x2:.20,y2:.65,w:.004,n:30,c:[210,230,255],a:.45,_tc:[210,230,255]}),
    p('l',{x1:.28,y1:.32,x2:.62,y2:.24,w:.003,n:20,c:[200,220,250],a:.35,_tc:[200,220,250]}),
  ],
  // [2] 苹果 — 被咬一口的苹果
  [
    p('arc',{x:.495,y:.55,rx:.23,ry:.27,a0:4.7,a1:9.5,t:.06,n:180,c:[230,180,170],a:.7,_tc:[230,180,170]}),
    p('arc',{x:.505,y:.55,rx:.14,ry:.27,a0:9.3,a1:4.9,t:.05,n:120,c:[230,180,170],a:.6,_tc:[230,180,170]}),
    p('l',{x1:.5,y1:.305,x2:.5,y2:.22,w:.005,n:28,c:[230,180,170],a:.7,_tc:[230,180,170]}),
    p('arc',{x:.5,y:.24,rx:.06,ry:.03,a0:1.2,a1:5.0,t:.015,n:40,c:[255,205,185],a:.65,_tc:[255,205,185]}),
    p('e',{x:.5,y:.52,rx:.10,ry:.12,n:80,c:[255,210,200],a:.25,_tc:[255,210,200]}),
  ],
  // [3] 交汇 — 科技×人文 双环
  [
    p('r',{x:.40,y:.50,rx:.20,ry:.20,t:.025,n:140,c:[170,210,230],a:.6,_tc:[170,210,230]}),
    p('r',{x:.60,y:.50,rx:.20,ry:.20,t:.025,n:140,c:[230,200,170],a:.6,_tc:[230,200,170]}),
    p('e',{x:.50,y:.50,rx:.08,ry:.14,n:80,c:[240,225,195],a:.5,_tc:[240,225,195]}),
    p('s',{x:.50,y:.50,rx:.06,ry:.06,n:80,c:[255,240,210],a:.4,_tc:[255,240,210]}),
  ],
  // [4] 力场 — 同心环+放射线
  [
    p('r',{x:.5,y:.5,rx:.10,ry:.10,t:.012,n:50,c:[200,170,230],a:.7,_tc:[200,170,230]}),
    p('r',{x:.5,y:.5,rx:.18,ry:.18,t:.014,n:70,c:[200,170,230],a:.55,_tc:[200,170,230]}),
    p('r',{x:.5,y:.5,rx:.27,ry:.27,t:.014,n:90,c:[200,170,230],a:.35,_tc:[200,170,230]}),
    p('r',{x:.5,y:.5,rx:.36,ry:.36,t:.012,n:100,c:[200,170,230],a:.18,_tc:[200,170,230]}),
    ...[['.5','.5','.5','.08'],['.5','.5','.72','.18'],['.5','.5','.88','.50'],['.5','.5','.72','.82'],
       ['.5','.5','.5','.92'],['.5','.5','.28','.82'],['.5','.5','.12','.50'],['.5','.5','.28','.18']]
      .map(([x1,y1,x2,y2]) => p('l',{x1:parseFloat(x1),y1:parseFloat(y1),x2:parseFloat(x2),y2:parseFloat(y2),w:.004,n:22,c:[200,170,230],a:.5,_tc:[200,170,230]})),
  ],
  // [5] 涅槃 — 凤凰展翅
  [
    p('arc',{x:.5,y:.55,rx:.30,ry:.20,a0:3.2,a1:6.1,t:.05,n:130,c:[240,190,130],a:.6,_tc:[240,190,130]}),
    p('arc',{x:.5,y:.55,rx:.30,ry:.20,a0:0.0,a1:3.1,t:.05,n:130,c:[240,190,130],a:.6,_tc:[240,190,130]}),
    p('arc',{x:.5,y:.55,rx:.17,ry:.11,a0:3.3,a1:6.0,t:.04,n:80,c:[255,220,160],a:.65,_tc:[255,220,160]}),
    p('arc',{x:.5,y:.55,rx:.17,ry:.11,a0:0.0,a1:3.0,t:.04,n:80,c:[255,220,160],a:.65,_tc:[255,220,160]}),
    p('e',{x:.5,y:.52,rx:.04,ry:.16,n:70,c:[255,230,170],a:.7,_tc:[255,230,170]}),
    p('s',{x:.5,y:.35,rx:.10,ry:.08,n:50,c:[240,190,130],a:.3,_tc:[240,190,130]}),
  ],
  // [6] 死亡 — 沙漏
  [
    p('e',{x:.5,y:.38,rx:.14,ry:.16,n:90,c:[210,200,240],a:.5,_tc:[210,200,240]}),
    p('arc',{x:.5,y:.38,rx:.14,ry:.16,a0:0,a1:6.283,t:.02,n:70,c:[210,200,240],a:.6,_tc:[210,200,240]}),
    p('e',{x:.5,y:.64,rx:.14,ry:.16,n:90,c:[210,200,240],a:.5,_tc:[210,200,240]}),
    p('arc',{x:.5,y:.64,rx:.14,ry:.16,a0:0,a1:6.283,t:.02,n:70,c:[210,200,240],a:.6,_tc:[210,200,240]}),
    p('l',{x1:.44,y1:.48,x2:.44,y2:.56,w:.003,n:15,c:[210,200,240],a:.5,_tc:[210,200,240]}),
    p('l',{x1:.56,y1:.48,x2:.56,y2:.56,w:.003,n:15,c:[210,200,240],a:.5,_tc:[210,200,240]}),
    p('e',{x:.5,y:.52,rx:.03,ry:.04,n:40,c:[255,240,255],a:.7,_tc:[255,240,255]}),
    p('e',{x:.5,y:.68,rx:.10,ry:.04,n:60,c:[210,200,240],a:.55,_tc:[210,200,240]}),
    p('r',{x:.5,y:.26,rx:.16,ry:.02,t:.008,n:40,c:[210,200,240],a:.5,_tc:[210,200,240]}),
    p('r',{x:.5,y:.78,rx:.16,ry:.02,t:.008,n:40,c:[210,200,240],a:.5,_tc:[210,200,240]}),
  ],
  // [7] 前行 — 分岔路
  [
    p('l',{x1:.5,y1:.78,x2:.5,y2:.45,w:.015,n:60,c:[240,225,195],a:.65,_tc:[240,225,195]}),
    p('l',{x1:.5,y1:.45,x2:.28,y2:.18,w:.012,n:50,c:[240,225,195],a:.55,_tc:[240,225,195]}),
    p('l',{x1:.5,y1:.45,x2:.68,y2:.14,w:.012,n:50,c:[240,225,195],a:.55,_tc:[240,225,195]}),
    p('l',{x1:.5,y1:.45,x2:.5,y2:.08,w:.008,n:35,c:[255,245,220],a:.45,_tc:[255,245,220]}),
    p('e',{x:.5,y:.45,rx:.05,ry:.05,n:60,c:[255,245,220],a:.6,_tc:[255,245,220]}),
    p('s',{x:.30,y:.22,rx:.04,ry:.04,n:25,c:[240,225,195],a:.4,_tc:[240,225,195]}),
    p('s',{x:.66,y:.18,rx:.04,ry:.04,n:25,c:[240,225,195],a:.4,_tc:[240,225,195]}),
    p('s',{x:.5,y:.12,rx:.03,ry:.03,n:20,c:[255,245,220],a:.35,_tc:[255,245,220]}),
    p('s',{x:.5,y:.80,rx:.30,ry:.04,n:60,c:[240,225,195],a:.2,_tc:[240,225,195]}),
  ],
];

/* ── Munger 8-stage shape builder ── */
function buildMungerStages() {
  return MUNGER_STAGES.map((stage, idx) => {
    return (n, tint) => buildMungerForm(idx, n, tint || stage.tint);
  });
}
function buildMungerForm(idx, count, tint) {
  const prims = MUNGER_FORMS[idx];
  if (!prims) return sampleForm([p('s',{x:.5,y:.5,rx:.30,ry:.28,n:count,c:tint,a:.5})], count);
  const recolored = prims.map(pr => {
    const c = pr._tc || pr.c || [220,220,220];
    return Object.assign({}, pr, { c });
  });
  return sampleForm(recolored, count);
}
const MUNGER_FORMS = [
  // [0] 初心 — 散点云团
  [
    p('s',{x:.5,y:.5,rx:.32,ry:.30,n:280,c:[190,175,230],a:.38,_tc:[190,175,230]}),
    p('s',{x:.5,y:.5,rx:.18,ry:.16,n:120,c:[190,175,230],a:.55,_tc:[190,175,230]}),
    p('s',{x:.5,y:.5,rx:.08,ry:.07,n:60,c:[210,200,245],a:.7,_tc:[210,200,245]}),
  ],
  // [1] 格栅 — 多元思维模型网络
  [
    ...[.32,.44,.56,.68].map(x=>p('l',{x1:x,y1:.30,x2:x,y2:.70,w:.004,n:30,c:[167,139,250],a:.65,_tc:[167,139,250]})),
    ...[.30,.42,.54,.66].map(y=>p('l',{x1:.30,y1:y,x2:.70,y2:y,w:.004,n:30,c:[167,139,250],a:.65,_tc:[167,139,250]})),
    ...[.32,.44,.56,.68].flatMap(x=>[.30,.42,.54,.66].map(y=>p('e',{x,y,rx:.012,ry:.012,n:7,c:[214,202,255],a:.9,_tc:[214,202,255]}))),
    p('e',{x:.50,y:.50,rx:.04,ry:.04,n:20,c:[230,220,255],a:.85,_tc:[230,220,255]}),
  ],
  // [2] 逆向 — 镜像反转
  [
    p('arc',{x:.38,y:.50,rx:.18,ry:.16,a0:4.2,a1:5.5,t:.04,n:70,c:[180,155,240],a:.7,_tc:[180,155,240]}),
    p('arc',{x:.38,y:.50,rx:.10,ry:.09,a0:4.0,a1:5.7,t:.03,n:40,c:[200,180,250],a:.65,_tc:[200,180,250]}),
    p('arc',{x:.62,y:.50,rx:.18,ry:.16,a0:0.8,a1:2.1,t:.04,n:70,c:[180,155,240],a:.7,_tc:[180,155,240]}),
    p('arc',{x:.62,y:.50,rx:.10,ry:.09,a0:0.5,a1:2.3,t:.03,n:40,c:[200,180,250],a:.65,_tc:[200,180,250]}),
    p('l',{x1:.50,y1:.26,x2:.50,y2:.74,w:.003,n:20,c:[180,155,240],a:.4,_tc:[180,155,240]}),
  ],
  // [3] 误判 — 大脑/神经元
  [
    p('e',{x:.50,y:.44,rx:.20,ry:.18,n:90,c:[200,150,220],a:.55,_tc:[200,150,220]}),
    p('arc',{x:.50,y:.44,rx:.20,ry:.18,a0:0,a1:6.283,t:.02,n:60,c:[200,150,220],a:.6,_tc:[200,150,220]}),
    p('l',{x1:.38,y1:.36,x2:.30,y2:.26,w:.003,n:16,c:[200,150,220],a:.5,_tc:[200,150,220]}),
    p('l',{x1:.62,y1:.36,x2:.70,y2:.26,w:.003,n:16,c:[200,150,220],a:.5,_tc:[200,150,220]}),
    p('l',{x1:.42,y1:.52,x2:.34,y2:.62,w:.003,n:14,c:[200,150,220],a:.45,_tc:[200,150,220]}),
    p('l',{x1:.58,y1:.52,x2:.66,y2:.62,w:.003,n:14,c:[200,150,220],a:.45,_tc:[200,150,220]}),
    p('e',{x:.50,y:.44,rx:.04,ry:.04,n:22,c:[240,210,255],a:.75,_tc:[240,210,255]}),
  ],
  // [4] 能力圈 — 圆圈+清晰边界
  [
    p('r',{x:.50,y:.50,rx:.30,ry:.30,t:.025,n:130,c:[190,160,200],a:.6,_tc:[190,160,200]}),
    p('r',{x:.50,y:.50,rx:.20,ry:.20,t:.02,n:90,c:[190,160,200],a:.5,_tc:[190,160,200]}),
    p('r',{x:.50,y:.50,rx:.10,ry:.10,t:.015,n:50,c:[190,160,200],a:.7,_tc:[190,160,200]}),
    p('e',{x:.50,y:.50,rx:.03,ry:.03,n:20,c:[255,255,255],a:.85,_tc:[255,255,255]}),
    p('e',{x:.70,y:.80,rx:.015,ry:.015,n:12,c:[190,160,200],a:.5,_tc:[190,160,200]}),
    p('e',{x:.25,y:.35,rx:.015,ry:.015,n:12,c:[190,160,200],a:.5,_tc:[190,160,200]}),
  ],
  // [5] 等待 — 沙漏/时钟
  [
    p('e',{x:.50,y:.38,rx:.14,ry:.16,n:90,c:[210,180,200],a:.5,_tc:[210,180,200]}),
    p('arc',{x:.50,y:.38,rx:.14,ry:.16,a0:0,a1:6.283,t:.02,n:70,c:[210,180,200],a:.6,_tc:[210,180,200]}),
    p('e',{x:.50,y:.64,rx:.14,ry:.16,n:90,c:[210,180,200],a:.5,_tc:[210,180,200]}),
    p('arc',{x:.50,y:.64,rx:.14,ry:.16,a0:0,a1:6.283,t:.02,n:70,c:[210,180,200],a:.6,_tc:[210,180,200]}),
    p('l',{x1:.44,y1:.48,x2:.44,y2:.56,w:.003,n:15,c:[210,180,200],a:.5,_tc:[210,180,200]}),
    p('l',{x1:.56,y1:.48,x2:.56,y2:.56,w:.003,n:15,c:[210,180,200],a:.5,_tc:[210,180,200]}),
    p('e',{x:.50,y:.68,rx:.10,ry:.04,n:60,c:[210,180,200],a:.55,_tc:[210,180,200]}),
  ],
  // [6] 简单 — 一个强几何形
  [
    p('e',{x:.50,y:.50,rx:.26,ry:.26,n:160,c:[220,190,210],a:.5,_tc:[220,190,210]}),
    p('r',{x:.50,y:.50,rx:.26,ry:.26,t:.03,n:100,c:[220,190,210],a:.7,_tc:[220,190,210]}),
    p('e',{x:.50,y:.50,rx:.06,ry:.06,n:40,c:[255,235,250],a:.8,_tc:[255,235,250]}),
    p('l',{x1:.50,y1:.24,x2:.50,y2:.18,w:.004,n:18,c:[220,190,210],a:.55,_tc:[220,190,210]}),
  ],
  // [7] 传承 — 桥梁/路径
  [
    p('l',{x1:.18,y1:.55,x2:.50,y2:.55,w:.015,n:50,c:[230,210,220],a:.6,_tc:[230,210,220]}),
    p('l',{x1:.50,y1:.55,x2:.82,y2:.55,w:.015,n:50,c:[230,210,220],a:.6,_tc:[230,210,220]}),
    p('l',{x1:.24,y1:.45,x2:.24,y2:.65,w:.008,n:24,c:[230,210,220],a:.55,_tc:[230,210,220]}),
    p('l',{x1:.76,y1:.45,x2:.76,y2:.65,w:.008,n:24,c:[230,210,220],a:.55,_tc:[230,210,220]}),
    p('e',{x:.50,y:.55,rx:.04,ry:.04,n:24,c:[255,245,255],a:.75,_tc:[255,245,255]}),
    p('s',{x:.50,y:.40,rx:.12,ry:.10,n:40,c:[230,210,220],a:.35,_tc:[230,210,220]}),
  ],
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
   Jobs: 8-stage narrative arc (初心→连线→聚焦→交汇→力场→涅槃→死亡→前行) */
const C_FORMS = {
  jobs: buildJobsStages(),
  munger: buildMungerStages(),
  einstein: [
    [ // 🌌 时空曲率 — 引力透镜同心环 + 中心质量点
      ...[0.06,0.12,0.18,0.24,0.30].map(r =>
        p('r',{x:.50,y:.50,rx:r,ry:r,t:.018,n:Math.floor(30+r*140),c:[110,185,235],a:.38+r*.5})
      ),
      p('e',{x:.50,y:.50,rx:.028,ry:.028,n:40,c:[200,235,255],a:.96}),     // 中心奇点
      p('e',{x:.50,y:.50,rx:.06,ry:.06,n:22,c:[140,210,255],a:.55}),        // 内层辉光
      // 引力透镜弧 — 四段弯曲射线
      p('arc',{x:.50,y:.50,rx:.35,ry:.35,a0:5.6,a1:0.7,t:.025,n:40,c:[120,200,250],a:.55}),
      p('arc',{x:.50,y:.50,rx:.35,ry:.35,a0:2.4,a1:3.8,t:.025,n:40,c:[120,200,250],a:.50}),
    ],
    (n) => fromCandidates(textPoints('E=mc²', { fs:80, weight:800 }), n, [140,210,255], .95), // 质能方程
    SYM_ATOM, // 原子
  ],
  davinci: [
    [ // ✈️ 飞行器机翼 — 双弧翼展 + 中心机身
      p('arc',{x:.50,y:.48,rx:.30,ry:.18,a0:3.3,a1:6.0,t:.06,n:100,c:[235,205,155],a:.68}),  // 左上翼弧
      p('arc',{x:.50,y:.48,rx:.30,ry:.18,a0:0.0,a1:3.0,t:.06,n:100,c:[235,205,155],a:.68}),  // 右上翼弧
      p('arc',{x:.50,y:.48,rx:.16,ry:.10,a0:3.2,a1:6.1,t:.04,n:50,c:[245,218,170],a:.55}),   // 内层翼骨
      p('arc',{x:.50,y:.48,rx:.16,ry:.10,a0:0.0,a1:3.1,t:.04,n:50,c:[245,218,170],a:.55}),   // 内层翼骨
      p('e',{x:.50,y:.54,rx:.05,ry:.09,n:36,c:[225,195,148],a:.74}),                          // 机身
      p('l',{x1:.50,y1:.60,x2:.50,y2:.82,w:.008,n:20,c:[210,180,132],a:.65}),                  // 尾舵
      p('e',{x:.50,y:.42,rx:.048,ry:.04,n:28,c:[245,225,178],a:.80}),                          // 机首
      p('e',{x:.50,y:.48,rx:.025,ry:.025,n:14,c:[255,240,200],a:.88}),                         // 中心轴
    ],
    SYM_VITRUVIAN, // 维特鲁威人
    (n) => spiralForm(n, [244,214,160]), // 黄金螺旋
  ],
  /* ── 费曼 · Feynman diagrams + question mark ── */
  feynman: [
    [ // 原子轨道 — 交叉椭圆环
      p('e',{x:.5,y:.5,rx:.03,ry:.03,n:34,c:[100,195,215],a:1}),
      p('r',{x:.5,y:.5,rx:.30,ry:.10,t:.035,n:70,c:[100,195,215],a:.7,rot:0.6}),
      p('r',{x:.5,y:.5,rx:.25,ry:.10,t:.035,n:60,c:[100,195,215],a:.65,rot:-1.0}),
      p('r',{x:.5,y:.5,rx:.20,ry:.10,t:.03,n:50,c:[100,195,215],a:.55,rot:2.2}),
      p('e',{x:.72,y:.45,rx:.015,ry:.015,n:12,c:[130,220,240],a:.9}),
      p('e',{x:.40,y:.30,rx:.015,ry:.015,n:12,c:[130,220,240],a:.9}),
    ],
    [ // 费曼图 — 波浪线交叉
      p('l',{x1:.20,y1:.55,x2:.80,y2:.55,w:.004,n:26,c:[130,210,230],a:.6}),
      p('l',{x1:.50,y1:.20,x2:.50,y2:.80,w:.004,n:26,c:[130,210,230],a:.6}),
      p('arc',{x:.50,y:.55,rx:.12,ry:.08,a0:4.0,a1:5.6,t:.018,n:50,c:[100,195,215],a:.7}),
      p('arc',{x:.50,y:.55,rx:.12,ry:.08,a0:0.8,a1:2.4,t:.018,n:50,c:[100,195,215],a:.7}),
      p('e',{x:.50,y:.55,rx:.025,ry:.025,n:24,c:[255,255,255],a:.9}),
    ],
    [ // 问号 — cargo cult检测
      p('arc',{x:.50,y:.38,rx:.14,ry:.12,a0:1.5,a1:5.8,t:.04,n:90,c:[100,195,215],a:.7}),
      p('e',{x:.50,y:.68,rx:.02,ry:.02,n:16,c:[100,195,215],a:.85}),
      p('l',{x1:.50,y1:.62,x2:.50,y2:.74,w:.004,n:16,c:[100,195,215],a:.8}),
      p('s',{x:.50,y:.42,rx:.04,ry:.04,n:40,c:[130,220,240],a:.5}),
    ],
  ],
  /* ── 塔勒布 · Black Swan + Barbell ── */
  taleb: [
    [ // 黑天鹅 — 优雅弧线+翅膀
      p('arc',{x:.50,y:.52,rx:.24,ry:.14,a0:4.0,a1:5.5,t:.04,n:80,c:[215,165,95],a:.75}),
      p('arc',{x:.50,y:.52,rx:.24,ry:.14,a0:0.8,a1:2.3,t:.04,n:80,c:[215,165,95],a:.75}),
      p('arc',{x:.50,y:.52,rx:.16,ry:.09,a0:3.8,a1:5.7,t:.03,n:50,c:[235,190,120],a:.65}),
      p('arc',{x:.50,y:.52,rx:.16,ry:.09,a0:0.5,a1:2.5,t:.03,n:50,c:[235,190,120],a:.65}),
      p('e',{x:.50,y:.56,rx:.04,ry:.10,n:36,c:[225,180,110],a:.75}),
    ],
    [ // 杠铃策略 — 两极+连接杆
      p('e',{x:.20,y:.50,rx:.06,ry:.06,n:40,c:[215,165,95],a:.85}),
      p('e',{x:.80,y:.50,rx:.06,ry:.06,n:40,c:[215,165,95],a:.85}),
      p('l',{x1:.26,y1:.50,x2:.74,y2:.50,w:.006,n:50,c:[215,165,95],a:.65}),
      p('e',{x:.20,y:.50,rx:.10,ry:.10,n:24,c:[240,200,140],a:.3}),
      p('e',{x:.80,y:.50,rx:.10,ry:.10,n:24,c:[240,200,140],a:.3}),
    ],
    [ // 反脆弱九头蛇 — 多头再生
      p('e',{x:.50,y:.48,rx:.06,ry:.10,n:40,c:[215,165,95],a:.7}),
      p('arc',{x:.50,y:.34,rx:.05,ry:.15,a0:3.8,a1:5.6,t:.025,n:30,c:[215,165,95],a:.55}),
      p('arc',{x:.50,y:.34,rx:.05,ry:.15,a0:0.5,a1:2.5,t:.025,n:30,c:[215,165,95],a:.55}),
      p('arc',{x:.50,y:.34,rx:.04,ry:.12,a0:3.9,a1:5.5,t:.02,n:25,c:[240,200,140],a:.45}),
      p('arc',{x:.50,y:.34,rx:.04,ry:.12,a0:0.6,a1:2.4,t:.02,n:25,c:[240,200,140],a:.45}),
    ],
  ],
  /* ── 马斯克 · Rocket + First Principles ── */
  musk: [
    [ // 火箭 — 椭圆机身+翼片
      p('e',{x:.50,y:.45,rx:.05,ry:.22,n:80,c:[210,65,45],a:.75}),
      p('e',{x:.50,y:.24,rx:.04,ry:.06,n:30,c:[240,100,80],a:.65}),
      p('l',{x1:.50,y1:.58,x2:.32,y2:.74,w:.005,n:22,c:[210,65,45],a:.6}),
      p('l',{x1:.50,y1:.58,x2:.68,y2:.74,w:.005,n:22,c:[210,65,45],a:.6}),
      p('l',{x1:.50,y1:.68,x2:.50,y2:.85,w:.005,n:18,c:[240,100,80],a:.5}),
      p('s',{x:.50,y:.78,rx:.06,ry:.04,n:40,c:[255,140,100],a:.4}),
    ],
    [ // 第一性原理 — 原子分解
      p('e',{x:.50,y:.50,rx:.04,ry:.04,n:28,c:[255,255,255],a:.9}),
      p('r',{x:.50,y:.50,rx:.12,ry:.12,t:.03,n:40,c:[210,65,45],a:.7}),
      p('r',{x:.50,y:.50,rx:.22,ry:.22,t:.025,n:50,c:[210,65,45],a:.55}),
      p('r',{x:.50,y:.50,rx:.32,ry:.32,t:.02,n:60,c:[210,65,45],a:.35}),
      p('l',{x1:.50,y1:.50,x2:.65,y2:.20,w:.003,n:16,c:[240,100,80],a:.5}),
      p('l',{x1:.50,y1:.50,x2:.28,y2:.72,w:.003,n:16,c:[240,100,80],a:.5}),
    ],
    [ // X — 颠覆
      p('l',{x1:.22,y1:.26,x2:.78,y2:.74,w:.012,n:60,c:[210,65,45],a:.7}),
      p('l',{x1:.78,y1:.26,x2:.22,y2:.74,w:.012,n:60,c:[210,65,45],a:.7}),
      p('e',{x:.50,y:.50,rx:.03,ry:.03,n:20,c:[255,160,120],a:.85}),
    ],
  ],
  /* ── 纳瓦尔 · Leverage + Specific Knowledge ── */
  naval: [
    [ // 杠杆天平
      p('l',{x1:.50,y1:.20,x2:.50,y2:.50,w:.006,n:26,c:[185,165,120],a:.7}),
      p('l',{x1:.28,y1:.62,x2:.72,y2:.62,w:.006,n:40,c:[185,165,120],a:.65}),
      p('e',{x:.28,y:.62,rx:.04,ry:.04,n:24,c:[210,190,145],a:.7}),
      p('e',{x:.72,y:.62,rx:.04,ry:.04,n:24,c:[210,190,145],a:.7}),
      p('e',{x:.50,y:.50,rx:.02,ry:.02,n:10,c:[255,235,200],a:.85}),
    ],
    [ // 知识之脑
      p('e',{x:.50,y:.44,rx:.22,ry:.20,n:100,c:[185,165,120],a:.5}),
      p('arc',{x:.50,y:.44,rx:.22,ry:.20,a0:0,a1:6.283,t:.02,n:60,c:[185,165,120],a:.6}),
      p('arc',{x:.38,y:.36,rx:.05,ry:.08,a0:0.5,a1:2.6,t:.015,n:28,c:[210,190,145],a:.55}),
      p('arc',{x:.62,y:.36,rx:.05,ry:.08,a0:0.5,a1:2.6,t:.015,n:28,c:[210,190,145],a:.55}),
      p('e',{x:.50,y:.44,rx:.05,ry:.05,n:28,c:[255,235,200],a:.55}),
    ],
    [ // 上升箭头 — compounding
      p('l',{x1:.50,y1:.74,x2:.50,y2:.26,w:.012,n:40,c:[185,165,120],a:.7}),
      p('l',{x1:.50,y1:.26,x2:.34,y2:.40,w:.010,n:30,c:[185,165,120],a:.65}),
      p('l',{x1:.50,y1:.26,x2:.66,y2:.40,w:.010,n:30,c:[185,165,120],a:.65}),
      p('s',{x:.50,y:.50,rx:.20,ry:.22,n:60,c:[210,190,145],a:.3}),
    ],
  ],
  /* ── Paul Graham · Do Things That Don't Scale ── */
  pg: [
    [ // 笔/键盘 — 写作
      p('l',{x1:.46,y1:.22,x2:.46,y2:.78,w:.008,n:40,c:[140,165,185],a:.7}),
      p('l',{x1:.46,y1:.22,x2:.56,y2:.26,w:.008,n:20,c:[140,165,185],a:.65}),
      p('l',{x1:.46,y1:.78,x2:.54,y2:.74,w:.008,n:20,c:[140,165,185],a:.65}),
      p('e',{x:.51,y:.22,rx:.025,ry:.025,n:14,c:[170,190,210],a:.8}),
      p('l',{x1:.34,y1:.32,x2:.58,y2:.32,w:.004,n:16,c:[170,190,210],a:.5}),
      p('l',{x1:.34,y1:.38,x2:.58,y2:.38,w:.004,n:16,c:[170,190,210],a:.5}),
    ],
    [ // 阶梯 — YC成长
      p('l',{x1:.24,y1:.66,x2:.40,y2:.66,w:.008,n:24,c:[140,165,185],a:.65}),
      p('l',{x1:.40,y1:.66,x2:.40,y2:.50,w:.008,n:18,c:[140,165,185],a:.65}),
      p('l',{x1:.40,y1:.50,x2:.56,y2:.50,w:.008,n:24,c:[140,165,185],a:.7}),
      p('l',{x1:.56,y1:.50,x2:.56,y2:.34,w:.008,n:18,c:[140,165,185],a:.7}),
      p('l',{x1:.56,y1:.34,x2:.72,y2:.34,w:.008,n:24,c:[140,165,185],a:.75}),
      p('e',{x:.72,y:.34,rx:.02,ry:.02,n:12,c:[255,255,255],a:.8}),
    ],
    [ // 二叉树 — Lisp/递归
      p('l',{x1:.50,y1:.28,x2:.30,y2:.50,w:.006,n:26,c:[140,165,185],a:.6}),
      p('l',{x1:.50,y1:.28,x2:.70,y2:.50,w:.006,n:26,c:[140,165,185],a:.6}),
      p('l',{x1:.30,y1:.50,x2:.18,y2:.70,w:.005,n:20,c:[140,165,185],a:.5}),
      p('l',{x1:.30,y1:.50,x2:.42,y2:.70,w:.005,n:20,c:[140,165,185],a:.5}),
      p('l',{x1:.70,y1:.50,x2:.58,y2:.70,w:.005,n:20,c:[140,165,185],a:.5}),
      p('l',{x1:.70,y1:.50,x2:.82,y2:.70,w:.005,n:20,c:[140,165,185],a:.5}),
      p('e',{x:.50,y:.28,rx:.02,ry:.02,n:12,c:[255,255,255],a:.8}),
    ],
  ],
  /* ── 张一鸣 · Algorithm + Delay Gratification ── */
  zhangyiming: [
    [ // 数据流网络 — 节点+连线
      p('e',{x:.50,y:.30,rx:.02,ry:.02,n:12,c:[80,140,200],a:.85}),
      p('e',{x:.32,y:.50,rx:.02,ry:.02,n:12,c:[80,140,200],a:.85}),
      p('e',{x:.68,y:.50,rx:.02,ry:.02,n:12,c:[80,140,200],a:.85}),
      p('e',{x:.38,y:.68,rx:.02,ry:.02,n:12,c:[80,140,200],a:.85}),
      p('e',{x:.62,y:.68,rx:.02,ry:.02,n:12,c:[80,140,200],a:.85}),
      p('l',{x1:.50,y1:.30,x2:.32,y2:.50,w:.003,n:18,c:[80,140,200],a:.45}),
      p('l',{x1:.50,y1:.30,x2:.68,y2:.50,w:.003,n:18,c:[80,140,200],a:.45}),
      p('l',{x1:.32,y1:.50,x2:.38,y2:.68,w:.003,n:18,c:[80,140,200],a:.45}),
      p('l',{x1:.68,y1:.50,x2:.62,y2:.68,w:.003,n:18,c:[80,140,200],a:.45}),
      p('l',{x1:.32,y1:.50,x2:.68,y2:.50,w:.003,n:18,c:[80,140,200],a:.4}),
      p('l',{x1:.38,y1:.68,x2:.62,y2:.68,w:.003,n:18,c:[80,140,200],a:.4}),
      p('r',{x:.50,y:.50,rx:.28,ry:.28,t:.02,n:60,c:[80,140,200],a:.25}),
    ],
    [ // 时钟/延迟满足
      p('r',{x:.50,y:.50,rx:.24,ry:.24,t:.025,n:90,c:[80,140,200],a:.55}),
      p('l',{x1:.50,y1:.50,x2:.50,y2:.32,w:.005,n:22,c:[80,140,200],a:.75}),
      p('l',{x1:.50,y1:.50,x2:.61,y2:.44,w:.003,n:16,c:[80,140,200],a:.55}),
      p('e',{x:.50,y:.50,rx:.015,ry:.015,n:10,c:[255,255,255],a:.85}),
    ],
    [ // 地球/全球化
      p('r',{x:.50,y:.50,rx:.26,ry:.26,t:.02,n:100,c:[80,140,200],a:.5}),
      p('arc',{x:.50,y:.50,rx:.26,ry:.26,a0:0.8,a1:2.3,t:.015,n:40,c:[80,140,200],a:.45}),
      p('arc',{x:.50,y:.50,rx:.26,ry:.26,a0:3.9,a1:5.5,t:.015,n:40,c:[80,140,200],a:.45}),
      p('l',{x1:.30,y1:.50,x2:.70,y2:.50,w:.003,n:20,c:[80,140,200],a:.5}),
      p('l',{x1:.50,y1:.30,x2:.50,y2:.70,w:.003,n:20,c:[80,140,200],a:.5}),
    ],
  ],
  /* ── 孙宇晨 · 注意力喇叭 + 金色圈 ── */
  sunyuchen: [
    [ // 扩音器/喇叭 — 注意力营销
      p('l',{x1:.44,y1:.40,x2:.34,y2:.28,w:.010,n:30,c:[255,175,30],a:.7}),
      p('l',{x1:.56,y1:.40,x2:.66,y2:.28,w:.010,n:30,c:[255,175,30],a:.7}),
      p('l',{x1:.44,y1:.40,x2:.44,y2:.68,w:.008,n:30,c:[255,175,30],a:.65}),
      p('l',{x1:.56,y1:.40,x2:.56,y2:.68,w:.008,n:30,c:[255,175,30],a:.65}),
      p('r',{x:.50,y:.68,rx:.12,ry:.04,t:.015,n:40,c:[255,175,30],a:.55}),
      p('s',{x:.40,y:.26,rx:.08,ry:.06,n:50,c:[255,200,80],a:.5}),
    ],
    [ // 金色圆圈 — 财富
      p('r',{x:.50,y:.50,rx:.30,ry:.30,t:.04,n:110,c:[255,175,30],a:.65}),
      p('r',{x:.50,y:.50,rx:.18,ry:.18,t:.03,n:70,c:[255,200,80],a:.5}),
      p('e',{x:.50,y:.50,rx:.04,ry:.04,n:24,c:[255,255,200],a:.8}),
      p('e',{x:.50,y:.50,rx:.12,ry:.12,n:36,c:[255,220,120],a:.25}),
    ],
    [ // 火焰/爆炸 — 争议
      p('l',{x1:.50,y1:.72,x2:.50,y2:.30,w:.010,n:30,c:[255,175,30],a:.7}),
      p('l',{x1:.50,y1:.44,x2:.34,y2:.28,w:.008,n:24,c:[255,200,80],a:.6}),
      p('l',{x1:.50,y1:.44,x2:.66,y2:.28,w:.008,n:24,c:[255,200,80],a:.6}),
      p('l',{x1:.50,y1:.36,x2:.40,y2:.18,w:.006,n:20,c:[255,220,120],a:.5}),
      p('l',{x1:.50,y1:.36,x2:.60,y2:.18,w:.006,n:20,c:[255,220,120],a:.5}),
      p('s',{x:.50,y:.30,rx:.12,ry:.10,n:60,c:[255,200,80],a:.4}),
    ],
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
function buildForm(form, count, tint){
  if (typeof form === 'function') {
    // Support both 1-arg (old) and 2-arg (new, with tint) generators
    return form.length > 1 ? form(count, tint) : form(count);
  }
  return sampleForm(form, count);
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
    this.onStageChange = opt.onStageChange || null;  // (stageIdx, stageMeta) => void
    this._tintStr = '130,180,230';
    this.box = {x:0,y:0,s:0};
    this.parts = [];
    this.formIdx = 0;
    this.t0 = performance.now();
    this.phase = 'morph';
    const meta = COMPANIONS[key];
    this._tintStr = meta ? meta.tint.join(',') : '130,180,230';
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
    const stageTint = this._getStageTint(0);
    const target = buildForm(this.forms[0], this.count, stageTint);
    if (instant || !this.parts.length){
      this.parts = target.map(t => ({ nx:t.nx, ny:t.ny, fnx:t.nx, fny:t.ny, tnx:t.nx, tny:t.ny, r:t.r,g:t.g,b:t.b,a:t.a, seed:Math.random()*6.2832 }));
      this.formIdx = 0;
    } else {
      this.retargetTo(target, 0);
    }
    this.t0 = performance.now(); this.phase='morph';
  }
  _getStageTint(idx) {
    if (this.key === 'jobs' && JOB_STAGES[idx]) {
      return JOB_STAGES[idx].tint;
    }
    if (this.key === 'munger' && MUNGER_STAGES[idx]) {
      return MUNGER_STAGES[idx].tint;
    }
    return null;  // use form's default colors
  }
  _getStageTintStr(idx) {
    const t = this._getStageTint(idx);
    return t ? t.join(',') : this._tintStr;
  }
  retargetTo(target, formIdx){
    for (let i=0;i<this.parts.length;i++){
      const p2 = this.parts[i], t = target[i];
      p2.fnx=p2.nx; p2.fny=p2.ny; p2.tnx=t.nx; p2.tny=t.ny;
      p2.tr=t.r; p2.tg=t.g; p2.tb=t.b; p2.ta=t.a;
      p2.sr=p2.r; p2.sg=p2.g; p2.sb=p2.b; p2.sa=p2.a;
    }
    this.formIdx = formIdx;
    this._tintStr = this._getStageTintStr(formIdx);
    this.t0 = performance.now(); this.phase='morph';
  }
  nextForm(){
    const next = this.loopForms ? (this.formIdx + 1) % this.forms.length : 0;
    const stageTint = this._getStageTint(next);
    this.retargetTo(buildForm(this.forms[next], this.count, stageTint), next);
    // Notify stage change
    if (this.onStageChange) {
      const stageMeta = this.key === 'jobs' ? JOB_STAGES[next]
                      : this.key === 'munger' ? MUNGER_STAGES[next]
                      : null;
      this.onStageChange(next, stageMeta);
    }
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

    // 全局呼吸脉动
    const t = now*0.001;
    const pulse = 1 + Math.sin(t*0.55)*0.07;

    // 背景环境光 — 柔和的径向辉光
    const cx = box.x + box.s*0.5, cy = box.y + box.s*0.5;
    const bgGrad = ctx.createRadialGradient(cx, cy, box.s*0.06, cx, cy, box.s*0.48);
    bgGrad.addColorStop(0, `rgba(${this._tintStr||'130,180,230'},${0.06*pulse})`);
    bgGrad.addColorStop(0.5, `rgba(${this._tintStr||'100,140,200'},${0.02*pulse})`);
    bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, box.w, box.h);

    ctx.globalCompositeOperation = 'lighter';

    for (const p2 of this.parts){
      const dx = Math.sin(t*1.2 + p2.seed)*1.6;
      const dy = Math.cos(t*0.85 + p2.seed*1.4)*1.6;
      const px = box.x + p2.nx*box.s + dx;
      const py = box.y + p2.ny*box.s + dy;
      const col = `${p2.r|0},${p2.g|0},${p2.b|0}`;
      const sz = 0.75 + (p2.seed % 1) * 0.55; // 每颗粒子大小略有差异

      // 第一层 — 大气柔光晕 (r≈5.5)
      ctx.fillStyle = `rgba(${col},${p2.a*0.055*pulse})`;
      ctx.beginPath(); ctx.arc(px, py, 5.5*sz, 0, 6.2832); ctx.fill();

      // 第二层 — 中等辉光 (r≈2.8)
      ctx.fillStyle = `rgba(${col},${p2.a*0.14*pulse})`;
      ctx.beginPath(); ctx.arc(px, py, 2.8*sz, 0, 6.2832); ctx.fill();

      // 第三层 — 明亮核心 (r≈0.95)
      ctx.fillStyle = `rgba(${col},${Math.min(1, p2.a*0.88*pulse)})`;
      ctx.beginPath(); ctx.arc(px, py, 0.95*sz, 0, 6.2832); ctx.fill();
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
    focusMorph = new ParticleMorph(cv, selectedCompanion, {
      count: 560, morphMs: 2800, holdMs: 3800,
      onStageChange: (stageIdx, stageMeta) => {
        const capName = document.getElementById('companion-cap-name');
        const capQuote = document.getElementById('companion-cap-quote');
        if (stageMeta) {
          // 8-stage narrative: show "名字 · 阶段名 正在陪你专注"
          if (capName) capName.textContent = meta.name + ' · ' + stageMeta.name;
          if (capQuote) capQuote.textContent = stageMeta.chinese;
          updateStageDots(stageIdx);
        } else {
          // 3-form cycle: show static "名字 正在陪你专注"
          if (capName) capName.textContent = meta.name;
          if (capQuote) capQuote.textContent = meta.quote;
        }
      }
    });
    morphs.push({ inst: focusMorph, canvas: cv });
  } else {
    focusMorph.setCompanion(selectedCompanion, true);
  }
  requestAnimationFrame(() => focusMorph.resize());
}

/* ── Stage indicator dots for Jobs narrative ── */
function updateStageDots(idx) {
  const el = document.getElementById('stage-dots');
  if (!el) return;
  let html = '';
  for (let i = 0; i < JOB_STAGES.length; i++) {
    if (i < idx) html += '<span class="sdot past"></span>';
    else if (i === idx) html += '<span class="sdot current"></span>';
    else html += '<span class="sdot"></span>';
  }
  el.innerHTML = html;
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
