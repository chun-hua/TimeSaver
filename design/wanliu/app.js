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

/* ── Feynman 8-Stage Narrative ── */
const FEYNMAN_STAGES = [
  { name:'初心', chinese:'好奇心是最好的老师\n不需要理由的探索', english:'The pleasure of finding things out.', context:'1918年生 · 皇后区 — 父亲教他观察自然而非背名字', tint:[185,215,225] },
  { name:'质疑', chinese:'第一原则是不要欺骗自己\n而你是最容易上自己当的人', english:'The first principle is that you must not fool yourself.', context:'1974 · Cargo Cult Science — 有形式无实质的「科学」飞机不会降落', tint:[100,195,215] },
  { name:'理解', chinese:'如果你不能向大一新生解释\n说明你自己还没真正理解', english:"If you can't explain it to a freshman, you don't really understand it.", context:'1961–63 · 费曼物理学讲义 — 拒绝术语堆砌，坚持用类比建立直觉', tint:[110,200,220] },
  { name:'发现', chinese:'世界是一个动态的\n不断颤动的混乱之美', english:'The world is a dynamic mess of jiggling things.', context:'1948 · 量子电动力学 — 费曼图让粒子相互作用的抽象数学变成直观线条', tint:[80,185,210] },
  { name:'教学', chinese:'知道名字\n不等于理解', english:'You can know the name of a bird in all languages and know nothing about the bird.', context:'巴西教学经历 — 学生能背公式但换个问法就不会。命名不是理解', tint:[90,195,215] },
  { name:'挑战', chinese:'现实必须优先于公关\n因为自然不会被愚弄', english:'Reality must take precedence over public relations, for nature cannot be fooled.', context:'1986 · 挑战者号 — O型环冰水实验，30秒演示替代数百页报告', tint:[70,180,200] },
  { name:'嬉戏', chinese:'不重要的事往往引向\n最重要的发现', english:"Physics is like sex: it may give practical results, but that's not why we do it.", context:'餐厅旋转盘子→诺贝尔奖。深度游戏不是散漫，是最高强度的投入', tint:[120,210,225] },
  { name:'传承', chinese:'别在乎别人怎么想\n做最真实的自己', english:'What do you care what other people think?', context:'1918–1988 · Arline教会他的最后一课。命名≠理解，质疑≠否定', tint:[140,220,235] },
];

/* ── Taleb 8-Stage Narrative ── */
const TALEB_STAGES = [
  { name:'初心', chinese:'别跨过平均深度四英尺的河\n你会淹死', english:"Don't cross a river if it is four feet deep on average.", context:'黎巴嫩内战长大 — 战争教会他：你以为不会发生的事，一定会发生', tint:[210,180,120] },
  { name:'黑天鹅', chinese:'历史不是爬行\n而是跳跃', english:'History does not crawl; it jumps.', context:'1987 · 黑色星期一 — 用深度虚值期权赚3500万，尾部风险才是唯一重要的风险', tint:[215,165,95] },
  { name:'反脆弱', chinese:'风会熄灭蜡烛\n却能让火越烧越旺', english:'Wind extinguishes a candle and energizes a fire.', context:'2012 · 《反脆弱》— 不是抵抗混乱，是从混乱中获益。脆弱→鲁棒→反脆弱', tint:[200,155,85] },
  { name:'杠铃', chinese:'极端保守加极端冒险\n中间地带最危险', english:'The middle is where you get crushed.', context:'90%极度安全+10%极端冒险。避开中等风险——那是隐性尾部风险的温床', tint:[220,170,100] },
  { name:'皮肤', chinese:'别告诉我你怎么想\n告诉我你的投资组合', english:"Don't tell me what you think, tell me what's in your portfolio.", context:'汉谟拉比法典：建筑塌了处死建筑师。没有skin in the game的人天然制造脆弱性', tint:[195,150,90] },
  { name:'知识', chinese:'专家预测了10次衰退\n0次是对的', english:'The calamity of the expert is that he predicts outside his pay grade.', context:'火鸡问题：被喂1000天的火鸡，每天强化世界很安全的信念。直到感恩节', tint:[185,145,80] },
  { name:'减法', chinese:'改进不来自增加更多\n而来自去除有害的', english:'The solution is to reduce, not to add.', context:'Via Negativa — 停止吃有害的>增加超级食物。删掉弱句子>增加更多论证', tint:[200,160,95] },
  { name:'传承', chinese:'活得久比说得对更重要\n活下来的人才有资格写历史', english:'My only measure of success is how much time you have to kill.', context:'1960– · 林迪效应：存在越久越可能继续存在。Just read Seneca.', tint:[210,175,110] },
];

/* ── Musk 8-Stage Narrative ── */
const MUSK_STAGES = [
  { name:'初心', chinese:'唯一需要遵守的规则\n是物理定律', english:'The only rules are the laws of physics. Everything else is a recommendation.', context:'南非长大，12岁卖第一个游戏。自学编程和物理，如饥似渴地阅读', tint:[220,90,60] },
  { name:'原理', chinese:'先算渐近极限\n再问现实为什么差这么远', english:'Boil things down to the most fundamental truths and reason up from there.', context:'火箭原材料成本=售价2%→白痴指数50→SpaceX降成本10倍。从物理事实重建', tint:[210,65,45] },
  { name:'冒险', chinese:'前三枚火箭全炸了\n第四次成功了', english:'Failure is an option here. If things are not failing, you are not innovating enough.', context:'2006–2008 · 三次发射全败几乎破产。第四次成功获NASA合同', tint:[200,60,40] },
  { name:'垂直', chinese:'制造比设计难十倍\n所以必须自己做', english:'Manufacturing is 10x harder than designing.', context:'SpaceX自制85%零件，Tesla自建电池工厂。垂直整合不是策略偏好是物理必然', tint:[215,70,48] },
  { name:'算法', chinese:'先质疑需求是否该存在\n再删除，最后才加速', english:"If you're not adding back at least 10%, you're not deleting enough.", context:'五步算法：1质疑→2删除→3简化→4加速→5自动化。顺序不可颠倒', tint:[190,55,38] },
  { name:'地狱', chinese:'产能地狱里我睡工厂\n亲自解决最关键瓶颈', english:'I slept on the factory floor to show the team I was in the trenches with them.', context:'2018 · Model 3产能地狱。拆掉自动化产线重来。CEO到场制造信号', tint:[205,62,42] },
  { name:'火星', chinese:'成为多行星物种\n是对人类文明的责任', english:'You want to wake up and think the future is going to be great.', context:'Starship完全可复用火箭。不是「想不想去火星」，是「不去火星人类会灭绝」', tint:[225,85,55] },
  { name:'前行', chinese:'我说的一些事情会是错的\n但这不应该是你不行动的理由', english:'Some things I say will be incorrect and should be corrected.', context:'1971– · SpaceX+Tesla+xAI+X。物理定律是唯一硬约束，其他都是建议', tint:[210,65,45] },
];

/* ── Naval 8-Stage Narrative ── */
const NAVAL_STAGES = [
  { name:'初心', chinese:'贫穷不是缺少钱\n而是缺少选择的自由', english:"Poverty is not the lack of money; it's the lack of freedom.", context:'印度移民之子→达特茅斯→硅谷。从小就知道：自由比钱重要', tint:[190,170,130] },
  { name:'杠杆', chinese:'代码和媒体\n是新时代的劳动力', english:'Code and media are permissionless leverage.', context:'劳动力需要许可，资本需要钱。代码和内容——你只需一台电脑和创造力', tint:[185,165,120] },
  { name:'知识', chinese:'追求特定知识\n它会像玩一样自然', english:'Specific knowledge is found by pursuing your genuine curiosity.', context:'学校不教的、你做起来像玩的事。一旦找到，复利效应会改变一切', tint:[180,160,115] },
  { name:'复利', chinese:'长期游戏里\n财富是耐心的函数', english:'Play long-term games with long-term people.', context:'一切复利：知识、关系、财富。短期不起眼的，长期是指数级的', tint:[195,170,125] },
  { name:'判断', chinese:'智慧比勤奋稀缺\n方向比速度重要', english:'In an age of infinite leverage, judgment is the most important skill.', context:'有了杠杆之后，判断力就是一切。做对一件事>做一百件平庸的事', tint:[175,155,110] },
  { name:'自由', chinese:'财富不是目的\n是拥有时间的自由', english:'Money is not the goal. The goal is to be free.', context:'真正的财富不是存款余额，而是你可以在任何时间做任何事的自由', tint:[190,168,122] },
  { name:'幸福', chinese:'欲望是与自己签下的\n不快乐合同', english:'Desire is a contract you make with yourself to be unhappy until you get what you want.', context:'幸福不是拥有更多，而是欲望更少。内在状态的平静是最高级奢侈品', tint:[185,162,118] },
  { name:'传承', chinese:'用特定知识加杠杆\n加上复利和判断力', english:'Seek wealth, not money or status. Wealth is assets that earn while you sleep.', context:'「如何不靠运气致富」— 38条推文凝聚一生智慧。找到你像玩一样的事', tint:[190,165,120] },
];

/* ── Paul Graham 8-Stage Narrative ── */
const PG_STAGES = [
  { name:'初心', chinese:'画家转码农\n发现编程也是艺术', english:"Hackers are makers. They're not scientists.", context:'康奈尔→哈佛CS博士→画家→Viaweb→Yahoo收购。画画和写代码是同一种冲动', tint:[150,170,190] },
  { name:'写作', chinese:'随笔不是表达已有的想法\n而是发现真正的想法', english:'Essays are not a way to convey ideas, but to generate them.', context:'2001 · 开始写essays。写作不是输出是思考。一篇好essay来自一个你还没想通的问题', tint:[140,165,185] },
  { name:'创业', chinese:'做不可规模化的事\n是早期创业核心', english:'The most common unscalable thing founders have to do is recruit users manually.', context:'YC诞生 — 一个一个手动拉用户不是笨办法，是不可或缺的学习阶段', tint:[135,160,180] },
  { name:'品味', chinese:'好品味不是天赋\n是见过足够多好作品后的判断力', english:'Good taste can be cultivated and must be cultivated.', context:'审美疲劳是最好的老师。见过足够多好东西之后，差的东西会让你本能不适', tint:[145,170,188] },
  { name:'坚持', chinese:'固执的正确\n看起来像是错误的错误', english:'The most successful founders are often the ones who seem most wrong at the time.', context:'市场不认可≠你错了。YC投资Airbnb时所有人都觉得疯了。反直觉是创新的入场券', tint:[130,155,175] },
  { name:'创始人', chinese:'做人们想要的东西\n其他一切都会跟上', english:'Make something people want.', context:'YC的核心哲学浓缩为一句话。不是「做出完美产品」，是「做出人们抢着用的东西」', tint:[140,162,182] },
  { name:'黑客', chinese:'黑客与画家\n本质上是同一类人', english:"What hackers and painters have in common is that they're both makers.", context:'编程不是科学是工艺。正如画家画布上的笔触，代码也是逐渐变好的草图', tint:[125,150,170] },
  { name:'传承', chinese:'找你自己真正遇到的问题\n而不是努力想创业点子', english:'The way to get startup ideas is to look for problems, not startup ideas.', context:'1964– · YC从8家公司到3000+。给下一代创始人的礼物是勇气，不是蓝图', tint:[140,165,185] },
];

/* ── Einstein 8-Stage Narrative ── */
const EINSTEIN_STAGES = [
  { name:'初心', chinese:'五岁时指南针让我颤抖\n看不见的力推动可见的世界', english:'The most beautiful experience we can have is the mysterious.', context:'1879年生 · 乌尔姆 — 父亲送他指南针，母亲教他小提琴。两种激情：物理与音乐', tint:[160,220,255] },
  { name:'追光', chinese:'如果追着一束光跑\n会看到什么', english:'What would I see if I rode on a beam of light?', context:'16岁思想实验 — 这个看似天真的问题，最终导向狭义相对论', tint:[140,210,255] },
  { name:'奇迹', chinese:'想象力比知识更重要\n知识有限，想象包容整个世界', english:'Imagination is more important than knowledge. Knowledge is limited.', context:'1905 · 奇迹年 — 四篇论文颠覆物理学：光电效应、布朗运动、狭义相对论、E=mc²', tint:[130,200,250] },
  { name:'弯曲', chinese:'时空告诉物质如何运动\n物质告诉时空如何弯曲', english:'Spacetime tells matter how to move; matter tells spacetime how to curve.', context:'1915 · 广义相对论 — 引力不是力，是时空的几何。优美到必须是正确的', tint:[120,195,245] },
  { name:'上帝', chinese:'上帝不掷骰子\n但也许祂更神秘', english:'God does not play dice with the universe.', context:'1927 · 索尔维会议 — 与玻尔争论量子力学。不是不信，是不信它是终极答案', tint:[145,215,255] },
  { name:'孤独', chinese:'我从未真正属于\n任何地方任何人', english:'I am truly a lone traveler and have never belonged anywhere with all my heart.', context:'1933 · 逃离纳粹→普林斯顿。后半生独自追寻统一场论，30年未果。孤独是清醒的代价', tint:[110,190,240] },
  { name:'和平', chinese:'第三次世界大战用什么我不知道\n但第四次会用棍棒和石头', english:'I know not with what weapons WWIII will be fought, but WWIV will be fought with sticks and stones.', context:'1939 · 致罗斯福的信推动原子弹研发，余生为和平奔走。知识是力量也是责任', tint:[130,205,250] },
  { name:'前行', chinese:'重要的是不要停止提问\n好奇心自有其存在的理由', english:'The important thing is not to stop questioning.', context:'1879–1955 · 相对论、E=mc²、光子假说。我们皆因好奇而生，因惊奇而活', tint:[140,210,255] },
];

/* ── Da Vinci 8-Stage Narrative ── */
const DAVINCI_STAGES = [
  { name:'初心', chinese:'我们的一切知识\n都始于感官', english:'All our knowledge has its origins in our perceptions.', context:'1452年生 · 芬奇小镇 — 私生子无正规教育。「野孩子」的观察力是他最宝贵的财富', tint:[235,210,160] },
  { name:'观察', chinese:'描述啄木鸟舌头的结构\n是理解自然的钥匙', english:'Describe the tongue of the woodpecker.', context:'一切从观察开始：水的漩涡、鸟的飞行、人体肌肉。不描述就无法理解', tint:[240,206,150] },
  { name:'跨界', chinese:'艺术与科学不是两个世界\n是同一世界的两种语言', english:'Study the science of art. Study the art of science.', context:'蒙娜丽莎+解剖学+飞行器+水利工程。不是多才多艺，是他从未看到学科之间的边界', tint:[245,200,145] },
  { name:'好奇', chinese:'我没有任何特殊才能\n只是无比好奇', english:'I have no special talents. I am only passionately curious.', context:'7200页手稿记录他问过的每一个问题。不为发表，纯粹为满足自己的好奇心', tint:[235,210,155] },
  { name:'未竟', chinese:'完成的画作极少\n但每一件都改变了艺术史', english:'Art is never finished, only abandoned.', context:'拖延不是懒惰，是对完美的执念。《蒙娜丽莎》画了16年。未完成本身是一种宣言', tint:[230,195,140] },
  { name:'解剖', chinese:'了解人体内部\n才能画出真正的生命', english:'The human foot is a masterpiece of engineering and a work of art.', context:'解剖30+具尸体，绘制200+幅解剖图。要画活人，必须先理解死者的结构', tint:[245,202,148] },
  { name:'飞行', chinese:'一旦尝过飞行的滋味\n你将永远仰望天空', english:'Once you have tasted flight, you will forever walk the earth with your eyes turned skyward.', context:'飞行器设计超前400年。不是科幻幻想，是基于鸟类飞行严密观察画出的工程图', tint:[238,208,152] },
  { name:'传承', chinese:'简约\n是终极的精致', english:'Simplicity is the ultimate sophistication.', context:'1452–1519 · 人类历史上好奇心最广的人。好奇心没有边界', tint:[240,206,150] },
];

/* ── 张一鸣 8-Stage Narrative ── */
const ZHANGYIMING_STAGES = [
  { name:'初心', chinese:'四次创业三次失败\n但每一次都在积累算法', english:'创业就像做算法题，多做几次你就知道最优解长什么样。', context:'南开大学→酷讯→饭否→九九房→字节跳动。前三次失败是训练数据', tint:[90,150,210] },
  { name:'算法', chinese:'推荐引擎不是替代你思考\n而是比你更懂你要什么', english:'信息分发的本质，是把正确的内容在正确的时间推给正确的人。', context:'2012 · 今日头条 — 不是人找信息，是信息找人。机器学习替代人工编辑', tint:[80,140,200] },
  { name:'延迟', chinese:'延迟满足感\n是人生最重要的能力', english:'很多人人生中一半的问题，都是因为没有延迟满足感造成的。', context:'字节跳动的核心文化。不做短期见效的事，做有长期复利的事', tint:[75,135,195] },
  { name:'大力', chinese:'大力出奇迹\n不是蛮力，是压强', english:'在重要的点上，投入远超过对手的资源。不需要在所有地方赢，关键地方必须赢。', context:'2016 · 抖音上线 — 在短视频赛道投入全部资源，用极致压强撕开市场', tint:[85,145,205] },
  { name:'全球', chinese:'全球化不是翻译\n是原生生长', english:'A product can be born global. You don\'t have to start local and expand.', context:'2017 · TikTok出海 — 不是把抖音翻译成英文，是在每个市场从零生长。去中国化', tint:[70,130,190] },
  { name:'危机', chinese:'风暴来的时候\n平常心是唯一的锚', english:'面对巨大的不确定性，最重要的不是战术调整，而是保持内心的平静。', context:'2020 · 地缘博弈 — TikTok面临封禁。在不可控面前，控制可控的', tint:[65,125,185] },
  { name:'退隐', chinese:'急流勇退\n把舞台交给下一代', english:'我相信比我年轻的人能做更好。一个组织不能永远依赖创始人。', context:'2021 · 卸任CEO — 不恋栈不退缩。把公司交给更年轻的管理层', tint:[80,140,200] },
  { name:'前行', chinese:'平常心\n做非常事', english:'Stay calm, stay focused, and always look beyond the immediate horizon.', context:'1983– · 从推荐算法到全球最大AI驱动内容平台。延迟满足是这个时代最稀缺的品质', tint:[90,145,210] },
];

/* ── 孙宇晨 8-Stage Narrative ── */
const SUNYUCHEN_STAGES = [
  { name:'初心', chinese:'北大→宾大\n读书是改变命运的第一杠杆', english:'教育是唯一不需要任何资本的杠杆。', context:'惠州→北大历史系→宾大法学硕士。每一步都在积累叙事资本', tint:[250,185,50] },
  { name:'入场', chinese:'注意力即财富\n没有人注意你，你就不存在', english:'In crypto, silence is not golden. Silence is invisible.', context:'2017 · 波场TRON创立 — 用营销颠覆技术叙事。最会讲故事的创始人', tint:[255,175,30] },
  { name:'争议', chinese:'不争议\n不传奇', english:'如果你做的事没有人骂，说明你做的东西不够有趣。', context:'巴菲特午餐456万$、收购Steemit、Mars Protocol。每次争议都是免费全球曝光', tint:[250,170,25] },
  { name:'扩张', chinese:'收购不是目的\n叙事收购才是', english:'Every acquisition is about the story, not just the tech.', context:'BitTorrent、Poloniex、HTX。把去中心化的故事不断延续', tint:[255,180,35] },
  { name:'风暴', chinese:'每一次SEC警告\n都是一次压力测试', english:'当监管来找你时，他们其实在帮你验证你的影响力。', context:'SEC起诉、HTX黑客事件、USDD脱锚。每次死不了，每次活过来都更强', tint:[245,165,20] },
  { name:'反弹', chinese:'跌倒了就再站起来\n最差的结果不过是重生', english:'I don\'t lose. I either win or learn.', context:'波场市值从低谷到新高，HTX从被黑到重生。反脆弱不是理论是实践', tint:[255,172,28] },
  { name:'帝国', chinese:'去中心化的金融帝国\n不需要地理边界', english:'The future of finance doesn\'t have an address. It has a protocol.', context:'波场生态：TRX、USDD、HTX、BitTorrent。构建无国界金融网络', tint:[250,178,32] },
  { name:'前行', chinese:'所有伟大故事的主角\n都曾被低估', english:"If they're not laughing at you, you're not aiming high enough.", context:'1990– · 从「巴菲特午餐男孩」到加密帝国。注意力是新时代的货币', tint:[255,175,30] },
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
      zhangyiming: ZHANGYIMING_STAGES, sunyuchen: SUNYUCHEN_STAGES };
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
        zhangyiming: ZHANGYIMING_STAGES, sunyuchen: SUNYUCHEN_STAGES };
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
    zhangyiming: ZHANGYIMING_STAGES, sunyuchen: SUNYUCHEN_STAGES };
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
