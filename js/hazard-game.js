/* ============================================================
   AEGIS 火眼金睛 · 隐患查找闯关
   60 秒内点击找出 8 处安全隐患（canvas 手绘工业场景）
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const LW = 1200, LH = 640; // 逻辑分辨率
  const scoreEl = document.getElementById('gameScore');
  const foundEl = document.getElementById('gameFound');
  const timeEl = document.getElementById('gameTime');
  const bestEl = document.getElementById('gameBest');
  const foundList = document.getElementById('gameFoundList');
  const overlay = document.getElementById('gameOverlay');
  const stage = canvas.parentElement;

  // 隐患定义（逻辑坐标区域）
  const HAZARDS = [
    { id: 'panel', name: '配电箱带电敞开作业', x: 96, y: 250, w: 150, h: 220, hint: '左侧墙上蓝色的箱子' },
    { id: 'helmet', name: '工人未佩戴安全帽', x: 300, y: 330, w: 90, h: 150, hint: '在机床旁作业的工人' },
    { id: 'smoke', name: '油桶旁吸烟', x: 660, y: 300, w: 90, h: 150, hint: '油桶附近的工人' },
    { id: 'leak', name: '油桶泄漏未处理', x: 720, y: 430, w: 150, h: 110, hint: '地面有液体反光' },
    { id: 'boxes', name: '货物堆码不稳', x: 890, y: 260, w: 200, h: 230, hint: '右边摇摇欲坠的箱子' },
    { id: 'machine', name: '传动部件无防护罩', x: 430, y: 380, w: 170, h: 110, hint: '运转中的皮带轮' },
    { id: 'extinguisher', name: '灭火器缺失', x: 980, y: 150, w: 90, h: 110, hint: '墙上空着的红色挂钩' },
    { id: 'exit', name: '安全出口堵塞 + 指示灯不亮', x: 1060, y: 300, w: 130, h: 260, hint: '画面右侧的门' }
  ];

  let found = new Set();
  let score = 0, timeLeft = 60, hintsLeft = 2, running = false, timer = null;
  let best = parseInt(localStorage.getItem('aegis_hazard_best') || '0', 10);
  bestEl.textContent = best > 0 ? best : '—';

  /* ---------- 场景绘制 ---------- */
  function drawScene(hintFlash) {
    ctx.clearRect(0, 0, LW, LH);

    // 背景：厂房内墙
    const wall = ctx.createLinearGradient(0, 0, 0, LH);
    wall.addColorStop(0, '#0d1a2a');
    wall.addColorStop(0.62, '#0a1420');
    wall.addColorStop(0.63, '#131f2c');
    wall.addColorStop(1, '#0b1520');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, LW, LH);

    // 墙缝线
    ctx.strokeStyle = 'rgba(0,229,255,0.07)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const y = 80 + i * 60;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LW, y); ctx.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const x = i * 80;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 440); ctx.stroke();
    }

    // 地面
    ctx.fillStyle = '#0e1824';
    ctx.fillRect(0, 440, LW, LH - 440);
    ctx.strokeStyle = 'rgba(0,229,255,0.1)';
    for (let i = 0; i < 14; i++) {
      const x = i * 90;
      ctx.beginPath(); ctx.moveTo(x, 440); ctx.lineTo(x - 60, LH); ctx.stroke();
    }

    // 窗户（左侧上方）
    for (let i = 0; i < 3; i++) {
      const wx = 150 + i * 200, wy = 60;
      ctx.fillStyle = 'rgba(0,229,255,0.12)';
      ctx.fillRect(wx, wy, 130, 110);
      ctx.strokeStyle = 'rgba(0,229,255,0.35)';
      ctx.strokeRect(wx, wy, 130, 110);
      ctx.beginPath(); ctx.moveTo(wx + 65, wy); ctx.lineTo(wx + 65, wy + 110); ctx.stroke();
    }

    drawPanel();       // 配电箱
    drawMachine();     // 机床
    drawWorker(345, 340, { helmet: false });
    drawDrum();        // 油桶
    drawWorker(705, 310, { smoking: true });
    drawBoxes();       // 堆码
    drawExtinguisherHook();
    drawExit();        // 出口
    drawWarningTape();
    drawCables();

    // 已发现标记
    found.forEach(id => {
      const h = HAZARDS.find(x => x.id === id);
      if (!h) return;
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(h.x - 8, h.y - 8, h.w + 16, h.h + 16);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(0,255,157,0.15)';
      ctx.fillRect(h.x - 8, h.y - 8, h.w + 16, h.h + 16);
      ctx.fillStyle = '#00ff9d';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('✓', h.x - 8, h.y - 20);
    });

    // 提示闪烁
    if (hintFlash) {
      ctx.strokeStyle = '#ffe14d';
      ctx.lineWidth = 5;
      ctx.setLineDash([14, 10]);
      ctx.strokeRect(hintFlash.x - 10, hintFlash.y - 10, hintFlash.w + 20, hintFlash.h + 20);
      ctx.setLineDash([]);
    }
  }

  function drawPanel() {
    const x = 96, y = 250;
    ctx.fillStyle = '#1b3a4d';
    ctx.fillRect(x, y, 150, 220);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, 150, 220);
    ctx.fillStyle = '#0a2530';
    ctx.fillRect(x + 8, y + 8, 134, 204);
    // 内部元器件
    ctx.fillStyle = '#335';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + 20, y + 24 + i * 60, 110, 30);
      ctx.fillRect(x + 20, y + 40 + i * 60, 110, 14);
    }
    // 打开的门
    ctx.fillStyle = '#1b3a4d';
    ctx.beginPath();
    ctx.moveTo(x + 150, y); ctx.lineTo(x + 230, y + 30); ctx.lineTo(x + 230, y + 250); ctx.lineTo(x + 150, y + 220);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#00e5ff'; ctx.stroke();
    // 火花
    const t = Date.now() / 120;
    for (let i = 0; i < 5; i++) {
      const sx = x + 190 + Math.sin(t + i * 2) * 22;
      const sy = y + 110 + Math.cos(t * 1.3 + i) * 30;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9);
      g.addColorStop(0, '#fff');
      g.addColorStop(0.4, '#ffe14d');
      g.addColorStop(1, 'rgba(255,122,26,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
    }
    // 警示牌
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('⚠', x + 12, y - 10);
  }

  function drawMachine() {
    const x = 430, y = 380;
    ctx.fillStyle = '#2c3d4d';
    ctx.fillRect(x, y, 170, 100);
    ctx.fillStyle = '#3d5060';
    ctx.fillRect(x + 10, y + 10, 150, 80);
    // 皮带轮（无防护罩）
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(x + 85, y + 60, 40, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(x + 85, y + 60, 40, 0, Math.PI * 2); ctx.stroke();
    // 转动的标记
    const a = Date.now() / 150;
    ctx.strokeStyle = '#8899aa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 85, y + 60);
    ctx.lineTo(x + 85 + Math.cos(a) * 36, y + 60 + Math.sin(a) * 36);
    ctx.stroke();
    // 皮带
    ctx.strokeStyle = '#223';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x + 45, y + 58); ctx.lineTo(x + 85, y + 58); ctx.stroke();
    // 操作台
    ctx.fillStyle = '#22303c';
    ctx.fillRect(x - 20, y + 60, 30, 40);
  }

  function drawWorker(cx, cy, opts) {
    const { helmet = true, smoking = false } = opts;
    // 腿
    ctx.fillStyle = '#2b3d4d';
    ctx.fillRect(cx - 22, cy + 78, 16, 60);
    ctx.fillRect(cx + 6, cy + 78, 16, 60);
    // 身体
    ctx.fillStyle = '#e8a33d';
    ctx.fillRect(cx - 28, cy + 30, 56, 52);
    // 手臂
    ctx.fillStyle = '#d18f2c';
    ctx.fillRect(cx - 38, cy + 34, 14, 40);
    ctx.fillRect(cx + 24, cy + 34, 14, 40);
    // 头
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath(); ctx.arc(cx, cy + 16, 20, 0, Math.PI * 2); ctx.fill();
    if (helmet) {
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(cx, cy + 10, 23, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 23, cy + 8, 46, 6);
    } else {
      ctx.fillStyle = '#3a2a1a';
      ctx.beginPath(); ctx.arc(cx, cy + 4, 21, Math.PI * 0.95, Math.PI * 0.05); ctx.fill();
    }
    if (smoking) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 30, cy + 8, 4, 14);
      const t = Date.now() / 200;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = 'rgba(200,200,200,' + (0.5 - i * 0.1) + ')';
        ctx.beginPath();
        ctx.arc(cx - 40 - i * 7 + Math.sin(t + i) * 4, cy + 2 - i * 10, 6 - i, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawDrum() {
    const x = 700, y = 420;
    ctx.fillStyle = '#8a2a2a';
    ctx.fillRect(x, y, 60, 90);
    ctx.fillStyle = '#6e1f1f';
    ctx.fillRect(x - 4, y + 14, 68, 14);
    ctx.fillRect(x - 4, y + 58, 68, 14);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('甲苯', x + 10, y + 52);
    // 泄漏液体
    const g = ctx.createRadialGradient(x + 30, y + 96, 2, x + 30, y + 96, 80);
    g.addColorStop(0, 'rgba(120,200,255,0.55)');
    g.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x + 30, y + 96, 80, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(160,220,255,0.4)';
    ctx.beginPath(); ctx.ellipse(x + 10, y + 104, 55, 12, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawBoxes() {
    const x = 900, y = 380;
    // 倾斜的箱子
    ctx.save();
    ctx.translate(x + 60, y + 90);
    ctx.rotate(-0.16 + Math.sin(Date.now() / 900) * 0.02);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ['#8a6a3a', '#6a5030', '#a07a44'][i];
      ctx.fillRect(-60 + i * 6, -60 - i * 34 + i * 4, 110, 32);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.strokeRect(-60 + i * 6, -60 - i * 34 + i * 4, 110, 32);
    }
    ctx.restore();
    // 底部散箱
    ctx.fillStyle = '#6a5030';
    ctx.fillRect(x + 30, y + 110, 100, 30);
    // 警示
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('!', x + 130, y + 84);
  }

  function drawExtinguisherHook() {
    const x = 980, y = 130;
    ctx.strokeStyle = '#7a1a1a';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 30, y + 4, 22, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(255,45,85,0.6)';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('✕', x + 22, y + 48);
    ctx.fillStyle = '#ff2d55';
    ctx.font = '15px sans-serif';
    ctx.fillText('灭火器缺失', x - 6, y + 76);
  }

  function drawExit() {
    const x = 1060, y = 300;
    // 门
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(x, y, 90, 210);
    ctx.strokeStyle = '#446';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, 90, 210);
    ctx.beginPath(); ctx.moveTo(x + 45, y + 60); ctx.lineTo(x + 45, y + 200); ctx.stroke();
    // 堵塞的箱子
    ctx.fillStyle = '#7a5a30';
    ctx.fillRect(x + 100, y + 90, 80, 44);
    ctx.fillRect(x + 104, y + 46, 76, 44);
    // 出口指示灯（不亮）
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x - 8, y - 46, 106, 34);
    ctx.fillStyle = '#3a3a3a';
    ctx.font = '18px sans-serif';
    ctx.fillText('安全出口', x + 8, y - 22);
  }

  function drawWarningTape() {
    ctx.save();
    ctx.translate(560, 440);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#1a1a1a' : '#ffd23f';
      ctx.save();
      ctx.translate(i * 40, 0);
      ctx.transform(1, 0.12, 0, 1, 0, 0);
      ctx.fillRect(0, 0, 40, 16);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawCables() {
    ctx.strokeStyle = '#334';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(246, 470);
    ctx.quadraticCurveTo(320, 560, 430, 470);
    ctx.quadraticCurveTo(520, 560, 660, 500);
    ctx.stroke();
  }

  /* ---------- 游戏逻辑 ---------- */
  function resize() {
    const w = canvas.parentElement.clientWidth;
    canvas.width = LW;
    canvas.height = LH;
    canvas.style.height = (w * LH / LW) + 'px';
  }

  function getLogical(e) {
    const r = canvas.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width * LW;
    const cy = (e.clientY - r.top) / r.height * LH;
    return { x: cx, y: cy };
  }

  function flashFx(type, x, y) {
    stage.classList.remove('flash-wrong', 'flash-found');
    stage.style.setProperty('--fx', (x / LW * 100) + '%');
    stage.style.setProperty('--fy', (y / LH * 100) + '%');
    void stage.offsetWidth;
    stage.classList.add(type);
    setTimeout(() => stage.classList.remove(type), 650);
  }

  function onClick(e) {
    if (!running) return;
    const { x, y } = getLogical(e);
    const hit = HAZARDS.find(h =>
      !found.has(h.id) && x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h
    );
    if (hit) {
      found.add(hit.id);
      score += 100;
      updateHud();
      flashFx('flash-found', x, y);
      const tag = document.createElement('span');
      tag.className = 'gf-tag';
      tag.textContent = '✓ ' + hit.name;
      foundList.appendChild(tag);
      if (navigator.vibrate) navigator.vibrate(30);
      if (found.size === HAZARDS.length) end(true);
    } else {
      score = Math.max(0, score - 20);
      updateHud();
      flashFx('flash-wrong', x, y);
      stage.classList.remove('shake');
      void stage.offsetWidth;
      stage.classList.add('shake');
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    }
  }

  function updateHud() {
    scoreEl.textContent = score;
    foundEl.textContent = found.size + '/8';
  }

  function tick() {
    timeLeft--;
    timeEl.textContent = timeLeft;
    timeEl.className = timeLeft <= 10 ? 'time-low' : 'time-ok';
    if (timeLeft <= 0) end(false);
  }

  function start() {
    clearInterval(timer);
    found.clear();
    score = 0;
    timeLeft = 60;
    hintsLeft = 2;
    running = true;
    overlay.hidden = true;
    foundList.innerHTML = '';
    updateHud();
    timeEl.className = 'time-ok';
    timeEl.textContent = '60';
    drawScene();
    timer = setInterval(tick, 1000);
  }

  function end(win) {
    running = false;
    clearInterval(timer);
    const n = found.size;
    if (score > best) {
      best = score;
      localStorage.setItem('aegis_hazard_best', String(best));
      bestEl.textContent = best;
    }
    const stars = n >= 8 ? 3 : n >= 6 ? 2 : n >= 4 ? 1 : 0;
    document.getElementById('goTitle').textContent = win ? '🎉 全部隐患清除！' : '⏱ 时间到！';
    document.getElementById('goStars').innerHTML =
      Array.from({ length: 3 }, (_, i) => i < stars ? '⭐' : '<span class="off">⭐</span>').join('');
    document.getElementById('goMsg').textContent =
      `得分 ${score} · 发现 ${n}/8 处隐患 · 历史最佳 ${best}${n === 8 ? ' · 完美通关！' : ''}`;
    document.getElementById('goList').innerHTML = HAZARDS.map(h =>
      `<div class="${found.has(h.id) ? 'hit' : 'miss'}">${h.name}</div>`
    ).join('');
    overlay.hidden = false;
  }

  function hint() {
    if (!running || hintsLeft <= 0) return;
    const remaining = HAZARDS.filter(h => !found.has(h.id));
    if (!remaining.length) return;
    hintsLeft--;
    document.getElementById('gameHint').textContent = `💡 提示 (×${hintsLeft})`;
    const h = remaining[Math.floor(Math.random() * remaining.length)];
    drawScene(h);
    setTimeout(() => drawScene(), 1500);
  }

  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    onClick(e.touches[0]);
  }, { passive: false });
  document.getElementById('gameHint').addEventListener('click', hint);
  document.getElementById('gameRestart').addEventListener('click', start);
  document.getElementById('goAgain').addEventListener('click', start);

  window.addEventListener('resize', resize);
  resize();

  // 动画重绘（火花/烟雾/箱子晃动）
  let visible = false;
  new IntersectionObserver(en => {
    visible = en[0].isIntersecting;
    if (visible && !running && overlay.hidden) start();
  }, { threshold: 0.1 }).observe(stage);
  setInterval(() => { if (running && visible) drawScene(); }, 60);
})();
