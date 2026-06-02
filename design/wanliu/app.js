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
  // History: track interruption when entering exit flow from focus
  if (id === 's-exit-1' && currentSession && !activeInterruption) {
    activeInterruption = { reason: '', outcome: 'pending' };
  }
  // Render history/stats when entering those screens
  if (id === 's-history') renderHistory();
  if (id === 's-stats') renderStats();
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
  // Initialize session tracking
  currentSession = {
    id: Date.now(),
    date: new Date().toISOString(),
    task: name,
    plannedMin: selectedDur,
    companion: selectedCompanion,
    theme: currentTheme,
    style: selectedStyle,
    interruptions: [],
  };
  activeInterruption = null;
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
    if (focusSecs === 0) onFocusComplete();
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
  document.getElementById('reason-echo').textContent = reason ? `"${reason}"` : '';
  document.getElementById('reason-echo').style.display = reason ? 'block' : 'none';
  // Record interruption reason
  if (activeInterruption && reason) activeInterruption.reason = reason;
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

function backToFocus() {
  if (activeInterruption) { activeInterruption.outcome = 'returned'; activeInterruption = null; }
  startOverlayFor(); show('s-focus');
}
function emergencyExit() {
  clearInterval(focusTick); clearInterval(coolTick); coolRunning=false;
  if (activeInterruption) { activeInterruption.outcome = 'emergency_exit'; activeInterruption = null; }
  saveSession('abandoned');
  show('s-emergency');
}
function resetToCreate() {
  clearInterval(focusTick); clearInterval(coolTick); coolRunning=false;
  if (currentSession) {
    const status = currentSession.interruptions.length > 0 ? 'interrupted' : 'completed';
    saveSession(status);
  }
  show('s-create');
}

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
  if (e.key.toLowerCase() === 'h' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
    if (activeScreen === 's-history') show('s-stats');
    else if (activeScreen === 's-stats') show('s-create');
    else show('s-history');
  }
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

/* Each companion → 8-stage narrative builders.
   9 masters: Jobs, Munger, Feynman, Taleb, Musk, Naval, Paul Graham,
   Einstein, Da Vinci, Zhang Yiming, Sun Yuchen */
const C_FORMS = {
  jobs: buildJobsStages(),
  munger: buildMungerStages(),
  feynman: buildFeynmanStages(),
  taleb: buildTalebStages(),
  musk: buildMuskStages(),
  naval: buildNavalStages(),
  pg: buildPGStages(),
  einstein: buildEinsteinStages(),
  davinci: buildDaVinciStages(),
  zhangyiming: buildZYMsStages(),
  sunyuchen: buildSunStages(),
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
    const stageTables = { jobs: JOB_STAGES, munger: MUNGER_STAGES, feynman: FEYNMAN_STAGES,
      taleb: TALEB_STAGES, musk: MUSK_STAGES, naval: NAVAL_STAGES,
      pg: PG_STAGES, einstein: EINSTEIN_STAGES, davinci: DAVINCI_STAGES,
      zhangyiming: ZYM_STAGES, sunyuchen: SUN_STAGES };
    const table = stageTables[this.key];
    return (table && table[idx]) ? table[idx].tint : null;
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
      const stageTables = { jobs: JOB_STAGES, munger: MUNGER_STAGES, feynman: FEYNMAN_STAGES,
        taleb: TALEB_STAGES, musk: MUSK_STAGES, naval: NAVAL_STAGES,
        pg: PG_STAGES, einstein: EINSTEIN_STAGES, davinci: DAVINCI_STAGES,
        zhangyiming: ZYM_STAGES, sunyuchen: SUN_STAGES };
      const table = stageTables[this.key];
      const stageMeta = table ? table[next] : null;
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

/* ── Stage indicator dots (dynamic per companion) ── */
function updateStageDots(idx) {
  const el = document.getElementById('stage-dots');
  if (!el) return;
  const stageTables = { jobs: JOB_STAGES, munger: MUNGER_STAGES, feynman: FEYNMAN_STAGES,
    taleb: TALEB_STAGES, musk: MUSK_STAGES, naval: NAVAL_STAGES,
    pg: PG_STAGES, einstein: EINSTEIN_STAGES, davinci: DAVINCI_STAGES,
    zhangyiming: ZYM_STAGES, sunyuchen: SUN_STAGES };
  const table = stageTables[selectedCompanion];
  const total = table ? table.length : 3;
  let html = '';
  for (let i = 0; i < total; i++) {
    if (i < idx) html += '<span class="sdot past"></span>';
    else if (i === idx) html += '<span class="sdot current"></span>';
    else html += '<span class="sdot"></span>';
  }
  el.innerHTML = html;
}

/* ════════════════════════════════════════════════
   HISTORY — session recording & rendering
   ════════════════════════════════════════════════ */
const HISTORY_KEY = 'wanliu_history_v1';
let currentSession = null;
let activeInterruption = null;
let allSessions = [];
let histFilter = 'all';
let histPage = 0;
const HIST_PAGE_SIZE = 10;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    allSessions = raw ? JSON.parse(raw) : [];
  } catch (e) { allSessions = []; }
}

function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(allSessions)); } catch (e) {}
}

function saveSession(status) {
  if (!currentSession) return;
  // Push any pending interruption
  if (activeInterruption && activeInterruption.reason) {
    if (activeInterruption.outcome === 'pending') activeInterruption.outcome = 'left_after_cooldown';
    currentSession.interruptions.push({ ...activeInterruption });
  }
  activeInterruption = null;
  // Calculate actual focus time
  const elapsed = focusTotal - focusSecs;
  currentSession.actualMin = Math.round(elapsed / 60);
  currentSession.status = status;
  currentSession.id = Date.now();
  currentSession.date = new Date().toISOString();
  // Prepend to history
  allSessions.unshift(currentSession);
  // Keep max 200 entries
  if (allSessions.length > 200) allSessions = allSessions.slice(0, 200);
  saveHistory();
  currentSession = null;
}

function onFocusComplete() {
  clearInterval(focusTick);
  if (activeInterruption) { activeInterruption.outcome = 'returned'; activeInterruption = null; }
  saveSession('completed');
  // Show a gentle completion message then return to create
  setTimeout(() => {
    const clock = document.getElementById('focus-clock');
    if (clock) clock.textContent = '完成!';
    const msg = document.querySelector('.tb-msg');
    if (msg) msg.textContent = '你做到了。每一分钟的专注，\n都是对自己的温柔承诺。';
  }, 200);
  setTimeout(() => show('s-create'), 3000);
}

/* ── Companion display names ── */
const COMPANION_NAMES = {
  none:'独自专注', jobs:'乔布斯', munger:'芒格', feynman:'费曼', taleb:'塔勒布',
  musk:'马斯克', naval:'纳瓦尔', pg:'Paul Graham', einstein:'爱因斯坦',
  davinci:'达·芬奇', zhangyiming:'张一鸣', sunyuchen:'孙宇晨'
};

/* ── Render history list ── */
function renderHistory() {
  histPage = 0;
  _renderHistoryList();
  _renderSummary();
}

function _renderHistoryList() {
  const list = document.getElementById('hist-list');
  const empty = document.getElementById('hist-empty');
  const more = document.getElementById('hist-more');
  if (!list) return;

  let filtered = allSessions;
  if (histFilter === 'completed') filtered = allSessions.filter(s => s.status === 'completed');
  else if (histFilter === 'interrupted') filtered = allSessions.filter(s => s.interruptions && s.interruptions.length > 0);

  const page = filtered.slice(0, (histPage + 1) * HIST_PAGE_SIZE);

  if (filtered.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    if (more) more.style.display = 'none';
    return;
  }
  if (empty) empty.style.display = 'none';

  list.innerHTML = page.map(s => {
    const d = new Date(s.date);
    const dateStr = isToday(d) ? '今天' : isYesterday(d) ? '昨天' : fmtDate(d);
    const timeStr = fmtTime(d);
    const dur = s.actualMin || 0;
    const statusCls = s.status === 'completed' ? 'done' : s.status === 'interrupted' ? 'partial' : 'gaveup';
    const statusLabel = s.status === 'completed' ? '已完成' : s.status === 'interrupted' ? '提前结束' : '已放弃';
    const cardCls = s.status === 'completed' ? 'completed' : s.status === 'interrupted' ? 'interrupted' : 'abandoned';
    const compName = COMPANION_NAMES[s.companion] || '独自专注';
    const themeNames = { rain:'雨夜', library:'图书馆', forest:'森林', cyber:'赛博桌面' };
    const themeName = themeNames[s.theme] || s.theme || '';
    const durColor = s.status === 'completed' ? '#f0f0f5' : s.status === 'interrupted' ? '#f59e0b' : '#6b7280';

    const ints = s.interruptions || [];
    const intsHTML = ints.length > 0 ? `
      <div class="hcard-ints">
        <div class="int-label">⚠️ 打断记录 · ${ints.length} 次</div>
        ${ints.map(ir => {
          const outcomeCls = ir.outcome === 'returned' ? 'returned' : 'left';
          const outcomeLabel = ir.outcome === 'returned' ? '→ 返回继续'
            : ir.outcome === 'left_after_cooldown' ? '→ 冷静后离开'
            : ir.outcome === 'emergency_exit' ? '→ 紧急退出'
            : '→ 离开';
          return `<div class="int-row">
            <span class="int-dot"></span>
            <span class="int-reason">${escHtml(ir.reason || '未记录原因')}</span>
            <span class="int-outcome ${outcomeCls}">${outcomeLabel}</span>
          </div>`;
        }).join('')}
      </div>` : '';

    return `<div class="hcard ${cardCls}">
      <div class="hcard-top">
        <span class="hcard-date">${dateStr} · ${timeStr}</span>
        <span class="hcard-status ${statusCls}">${statusLabel}</span>
      </div>
      <div class="hcard-body">
        <div class="hcard-icon">${taskIcon(s.task)}</div>
        <div class="hcard-info">
          <div class="hcard-task">${escHtml(s.task)}</div>
          <div class="hcard-meta">
            ${compName !== '独自专注' ? `<span><span class="mdot comp"></span>${compName}</span>` : `<span>独自专注</span>`}
            <span>${themeName}</span>
          </div>
        </div>
        <div class="hcard-dur" style="color:${durColor};">
          ${dur}<small>分钟</small>
        </div>
      </div>${intsHTML}
    </div>`;
  }).join('');

  if (more) more.style.display = filtered.length > page.length ? 'block' : 'none';
}

function loadMoreHistory() {
  histPage++;
  _renderHistoryList();
}

function filterHistory(filter, el) {
  histFilter = filter;
  histPage = 0;
  document.querySelectorAll('.fpill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  _renderHistoryList();
}

function _renderSummary() {
  const el = document.getElementById('hist-summary');
  if (!el) return;
  const todaySessions = allSessions.filter(s => isToday(new Date(s.date)));
  const todayMin = todaySessions.reduce((a, s) => a + (s.actualMin || 0), 0);
  const todayCount = todaySessions.length;
  const completedCount = todaySessions.filter(s => s.status === 'completed').length;
  const compRate = todayCount > 0 ? Math.round(completedCount / todayCount * 100) : 0;
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-value accent">${todayMin}<span style="font-size:12px;font-weight:400;">分</span></div>
      <div class="stat-label">今日专注</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${todayCount}<span style="font-size:12px;font-weight:400;">次</span></div>
      <div class="stat-label">今日会话</div>
    </div>
    <div class="stat-card">
      <div class="stat-value good">${compRate}<span style="font-size:12px;font-weight:400;">%</span></div>
      <div class="stat-label">完成率</div>
    </div>`;
}

/* ── Render weekly stats ── */
function renderStats() {
  _renderWeekLabel();
  _renderWeekChart();
  _renderStatsSummary();
  _renderInterruptReasons();
  _renderBestSlot();
}

function _renderWeekLabel() {
  const el = document.getElementById('stats-week-label');
  if (!el) return;
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now); monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  el.textContent = `${monday.getMonth()+1}/${monday.getDate()}-${sunday.getMonth()+1}/${sunday.getDate()}`;
}

function _getWeekData() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now); monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0,0,0,0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const sessions = allSessions.filter(s => {
      const sd = new Date(s.date);
      return sd >= d && sd < next;
    });
    const focusMin = sessions.reduce((a, s) => a + (s.actualMin || 0), 0);
    const intCount = sessions.reduce((a, s) => a + (s.interruptions || []).length, 0);
    days.push({ date: d, focusMin, intCount, sessions });
  }
  return days;
}

function _renderWeekChart() {
  const el = document.getElementById('week-chart');
  if (!el) return;
  const week = _getWeekData();
  const dayNames = ['一','二','三','四','五','六','日'];
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7; // Mon=0
  const totalMin = week.reduce((a, d) => a + d.focusMin, 0);
  const totalH = (totalMin / 60).toFixed(1);
  const maxMin = Math.max(1, ...week.map(d => d.focusMin + d.intCount * 5));

  el.innerHTML = `
    <div class="wc-head">
      <h4>每日专注时长</h4>
      <span class="wc-total">总计 ${totalH}h</span>
    </div>
    <div class="bar-row">
      ${week.map((d, i) => {
        const fh = Math.max(4, (d.focusMin / maxMin) * 90);
        const ih = Math.max(0, (d.intCount * 5 / maxMin) * 90);
        const isToday = i === todayIdx;
        return `<div class="bar-col">
          <div class="bar-stack">
            ${d.intCount > 0 ? `<div class="bar-seg interrupt" style="height:${ih}px;"></div>` : ''}
            <div class="bar-seg focus" style="height:${fh}px;"></div>
          </div>
          <span class="bar-label${isToday ? ' today' : ''}">${dayNames[i]}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="bar-legend">
      <span><span class="swatch" style="background:rgba(124,58,237,.55);"></span> 专注</span>
      <span><span class="swatch" style="background:rgba(245,158,11,.38);"></span> 打断</span>
    </div>`;
}

function _renderStatsSummary() {
  const el = document.getElementById('stats-summary');
  if (!el) return;
  const week = _getWeekData();
  const thisWeek = week.reduce((a, d) => a + d.focusMin, 0);
  // Compare with last week
  const lastWeekStart = new Date(week[0].date); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(week[6].date); lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
  const lastWeekSessions = allSessions.filter(s => {
    const sd = new Date(s.date);
    return sd >= lastWeekStart && sd <= new Date(lastWeekEnd.getTime() + 86400000);
  });
  const lastWeekMin = lastWeekSessions.reduce((a, s) => a + (s.actualMin || 0), 0);
  const change = lastWeekMin > 0 ? Math.round((thisWeek - lastWeekMin) / lastWeekMin * 100) : 0;

  // Streak
  let streak = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const hasSession = allSessions.some(s => {
      const sd = new Date(s.date);
      return sd >= d && sd < next;
    });
    if (hasSession) streak++;
    else break;
  }

  // Average
  const totalSessions = allSessions.length;
  const avgMin = totalSessions > 0 ? Math.round(allSessions.reduce((a,s) => a+(s.actualMin||0), 0) / totalSessions) : 0;

  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-value${change >= 0 ? ' good' : ''}" style="font-size:16px;">${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}%</div>
      <div class="stat-label">vs 上周</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="font-size:16px;">${streak}<span style="font-size:10px;">天</span></div>
      <div class="stat-label">连续专注</div>
    </div>
    <div class="stat-card">
      <div class="stat-value accent" style="font-size:16px;">${avgMin}<span style="font-size:10px;">分</span></div>
      <div class="stat-label">平均时长</div>
    </div>`;
}

function _renderInterruptReasons() {
  const el = document.getElementById('stats-interrupts');
  if (!el) return;
  const allInts = allSessions.flatMap(s => (s.interruptions || []).filter(ir => ir.reason));
  const reasonMap = {};
  allInts.forEach(ir => { const r = ir.reason; reasonMap[r] = (reasonMap[r] || 0) + 1; });
  const sorted = Object.entries(reasonMap).sort((a,b) => b[1] - a[1]).slice(0, 4);

  if (sorted.length === 0) {
    el.innerHTML = '';
    return;
  }

  const emojiMap = { '回': '📱', '消息': '📱', '刷': '📱', '微信': '📱', '微博': '📱', '视频': '📱',
    '困': '😴', '睡': '😴', '休息': '😴', '累': '😴',
    '查': '🔍', '资料': '🔍', '走神': '🔍',
    '紧急': '🚨', '会议': '🚨', '电话': '📞' };
  function pickEmoji(text) {
    for (const [k, v] of Object.entries(emojiMap)) { if (text.includes(k)) return v; }
    return '💭';
  }

  el.innerHTML = `
    <div class="wc-head"><h4>打断原因 Top ${sorted.length}</h4></div>
    ${sorted.map(([reason, count]) => `
      <div class="int-reason-row">
        <span class="ir-emoji">${pickEmoji(reason)}</span>
        <span class="ir-text">${escHtml(reason)}</span>
        <span class="ir-count">${count}次</span>
      </div>`).join('')}`;
}

function _renderBestSlot() {
  const el = document.getElementById('stats-best-slot');
  if (!el) return;
  // Find best hour block from completed sessions
  const slots = {};
  const completed = allSessions.filter(s => s.status === 'completed' && s.interruptions.length === 0);
  completed.forEach(s => {
    const d = new Date(s.date);
    const hour = d.getHours();
    const slot = hour < 12 ? '上午 ' + hour + ':00–' + (hour+1) + ':00'
      : hour < 18 ? '下午 ' + (hour-12) + ':00–' + (hour-11) + ':00'
      : '晚上 ' + (hour-12) + ':00–' + (hour-11) + ':00';
    slots[slot] = (slots[slot] || 0) + 1;
  });
  const best = Object.entries(slots).sort((a,b) => b[1] - a[1])[0];

  if (!best) {
    el.innerHTML = '';
    return;
  }

  const hourEmoji = best[0].includes('上午') ? '🌅' : best[0].includes('下午') ? '☀️' : '🌙';

  el.innerHTML = `
    <span class="bs-emoji">${hourEmoji}</span>
    <div>
      <div class="bs-title">最佳专注时段</div>
      <div class="bs-time">${best[0]}</div>
      <div class="bs-detail">${best[1]} 次完美专注 · 无中断记录</div>
    </div>`;
}

/* ── Helpers ── */
function isToday(d) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
function isYesterday(d) {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
}
function fmtDate(d) { return `${d.getMonth()+1}月${d.getDate()}日`; }
function fmtTime(d) {
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  return `${h}:${m}`;
}
function escHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
function taskIcon(task) {
  const t = (task || '').toLowerCase();
  if (/写|论文|paper|write|introduction/i.test(t)) return '📝';
  if (/代码|code|重构|refactor|debug|程序/i.test(t)) return '💻';
  if (/读|read|书|book|文献/i.test(t)) return '📖';
  if (/ppt|汇报|slide|presentation/i.test(t)) return '📊';
  if (/学|study|learn|课程/i.test(t)) return '📚';
  if (/设计|design|画|draw/i.test(t)) return '🎨';
  return '🎯';
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
  // Load history from storage
  loadHistory();
}
window.addEventListener('load', init);
