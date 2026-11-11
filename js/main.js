/* ============================================================
   AEGIS 天穹盾 · 工业安全中枢 —— main.js
   粒子背景 / 实时监测模拟（可暂停可调阈）/ 图表悬停 / 滚动动效 / 应用栏
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rnd = (a, b) => a + Math.random() * (b - a);

  window.aegis = window.aegis || {};
  window.aegis.monitor = { sensorNorm: () => null };

  /* ================= 1. 基础 UI ================= */

  const progress = $('#scrollProgress');
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    $('#backTop').classList.toggle('show', h.scrollTop > 600);
    $('#nav').classList.toggle('scrolled', h.scrollTop > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $('#backTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const glow = $('#cursorGlow');
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', e => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    });
  } else glow.style.display = 'none';

  const pad = n => String(n).padStart(2, '0');
  const tickClock = () => {
    const d = new Date();
    const t = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    const el = $('#navClock');
    if (el) el.textContent = t;
    const ht = $('#hudTime');
    if (ht) ht.textContent = t;
    const hd = $('#hudDate');
    if (hd) hd.textContent = d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
  };
  tickClock();
  setInterval(tickClock, 1000);

  const burger = $('#navBurger');
  const navLinks = $('#navLinks');
  burger.addEventListener('click', () => navLinks.classList.toggle('open'));
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  // 滚动监听导航高亮（桌面导航 + 移动应用栏）
  const sections = $$('section[id]');
  const navAnchors = $$('.nav-links a');
  const tabAnchors = $$('.tabbar a');
  const spy = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = sections[0] && sections[0].id;
    sections.forEach(s => { if (s.offsetTop <= y) current = s.id; });
    navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
    tabAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  };
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  // 打字机
  const phrases = [
    'RISK SENSING · 实时风险感知',
    'DIGITAL TWIN · 3D 数字孪生',
    'HAZARD HUNT · 隐患查找闯关',
    'EMERGENCY DRILL · 应急演练认证',
    'PREVENTION FIRST · 向事前预防转型'
  ];
  const typeEl = $('#typingText');
  let pi = 0, ci = 0, deleting = false;
  const typeLoop = () => {
    const word = phrases[pi];
    typeEl.textContent = word.slice(0, ci);
    if (!deleting) {
      ci++;
      if (ci > word.length) { deleting = true; setTimeout(typeLoop, 1900); return; }
      setTimeout(typeLoop, 75);
    } else {
      ci--;
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(typeLoop, 350); return; }
      setTimeout(typeLoop, 36);
    }
  };
  typeLoop();

  /* ================= 2. 滚动出现动画 ================= */

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        en.target.querySelectorAll('.stat-bar i').forEach(b => {
          requestAnimationFrame(() => (b.style.width = getComputedStyle(b).getPropertyValue('--w')));
        });
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(el => {
    el.style.setProperty('--d', (el.dataset.delay || 0) + 'ms');
    io.observe(el);
  });

  const numIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = parseFloat(el.dataset.target);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const dur = 1800;
      const t0 = performance.now();
      const step = now => {
        const p = clamp((now - t0) / dur, 0, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * ease).toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      numIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('.count').forEach(el => numIO.observe(el));

  /* ================= 3. Hero 粒子网络 ================= */

  const heroCanvas = $('#heroCanvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let W, H, particles = [];
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      W = heroCanvas.clientWidth;
      H = heroCanvas.clientHeight;
      heroCanvas.width = W * DPR;
      heroCanvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const n = Math.min(110, Math.floor((W * H) / 16000));
      particles = Array.from({ length: n }, () => ({
        x: rnd(0, W), y: rnd(0, H),
        vx: rnd(-0.35, 0.35), vy: rnd(-0.35, 0.35),
        r: rnd(0.8, 2.4)
      }));
    };

    const linkDist = 130;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.65)';
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const alpha = (1 - Math.sqrt(d2) / linkDist) * 0.35;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  /* ================= 4. 走势图（2019-2024）含悬停交互 ================= */

  const trendCanvas = $('#trendChart');
  if (trendCanvas) {
    const tctx = trendCanvas.getContext('2d');
    const years = ['2019', '2020', '2021', '2022', '2023', '2024'];
    const accidents = [3.83, 3.80, 3.46, 2.82, 2.45, 2.18];
    const deaths = [2.95, 2.74, 2.63, 2.20, 2.12, 1.96];
    let hoverIdx = -1, lastX = -1, lastY = -1;

    const drawTrend = () => {
      const W = trendCanvas.clientWidth;
      const H = trendCanvas.clientHeight;
      const D = Math.min(window.devicePixelRatio || 1, 2);
      trendCanvas.width = W * D;
      trendCanvas.height = H * D;
      tctx.setTransform(D, 0, 0, D, 0, 0);

      const padL = 46, padR = 18, padT = 22, padB = 36;
      const cw = W - padL - padR, ch = H - padT - padB;
      const maxV = 4.2;
      const x = i => padL + (cw * i) / (years.length - 1);
      const y = v => padT + ch - (ch * v) / maxV;

      tctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
      tctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const gy = y((maxV / 4) * g);
        tctx.beginPath(); tctx.moveTo(padL, gy); tctx.lineTo(W - padR, gy); tctx.stroke();
        tctx.fillStyle = 'rgba(125, 147, 168, 0.75)';
        tctx.font = '11px Rajdhani, monospace';
        tctx.textAlign = 'right';
        tctx.fillText((maxV / 4 * g).toFixed(1), padL - 8, gy + 4);
      }

      // 悬停高亮列
      if (hoverIdx >= 0) {
        const hx = x(hoverIdx);
        tctx.fillStyle = 'rgba(0, 229, 255, 0.06)';
        tctx.fillRect(hx - cw / (years.length - 1) / 2, padT, cw / (years.length - 1), ch);
        tctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        tctx.setLineDash([4, 4]);
        tctx.beginPath(); tctx.moveTo(hx, padT); tctx.lineTo(hx, padT + ch); tctx.stroke();
        tctx.setLineDash([]);
      }

      // 面积
      tctx.beginPath();
      tctx.moveTo(x(0), y(accidents[0]));
      accidents.forEach((v, i) => tctx.lineTo(x(i), y(v)));
      tctx.lineTo(x(accidents.length - 1), y(0));
      tctx.lineTo(x(0), y(0));
      tctx.closePath();
      const grad = tctx.createLinearGradient(0, padT, 0, padT + ch);
      grad.addColorStop(0, 'rgba(0, 229, 255, 0.30)');
      grad.addColorStop(1, 'rgba(0, 229, 255, 0.02)');
      tctx.fillStyle = grad;
      tctx.fill();

      // 死亡人数虚线
      tctx.beginPath();
      deaths.forEach((v, i) => (i ? tctx.lineTo(x(i), y(v)) : tctx.moveTo(x(i), y(v))));
      tctx.strokeStyle = 'rgba(255, 122, 26, 0.9)';
      tctx.lineWidth = 2;
      tctx.setLineDash([6, 5]);
      tctx.stroke();
      tctx.setLineDash([]);

      // 事故起数实线
      tctx.beginPath();
      accidents.forEach((v, i) => (i ? tctx.lineTo(x(i), y(v)) : tctx.moveTo(x(i), y(v))));
      tctx.strokeStyle = '#00e5ff';
      tctx.lineWidth = 2.4;
      tctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
      tctx.shadowBlur = 10;
      tctx.stroke();
      tctx.shadowBlur = 0;

      // 数据点
      accidents.forEach((v, i) => {
        const r = i === hoverIdx ? 7 : 4.5;
        tctx.beginPath();
        tctx.arc(x(i), y(v), r, 0, Math.PI * 2);
        tctx.fillStyle = '#00e5ff';
        tctx.shadowColor = 'rgba(0, 229, 255, 0.8)';
        tctx.shadowBlur = 8;
        tctx.fill();
        tctx.shadowBlur = 0;
      });
      deaths.forEach((v, i) => {
        const r = i === hoverIdx ? 7 : 4.5;
        tctx.beginPath();
        tctx.arc(x(i), y(v), r, 0, Math.PI * 2);
        tctx.fillStyle = '#ff7a1a';
        tctx.fill();
      });

      years.forEach((yr, i) => {
        tctx.fillStyle = i === hoverIdx ? '#00e5ff' : 'rgba(125, 147, 168, 0.85)';
        tctx.font = (i === hoverIdx ? 'bold ' : '') + '12px Rajdhani, monospace';
        tctx.textAlign = 'center';
        tctx.fillText(yr, x(i), H - 12);
      });

      // 悬停 Tooltip
      if (hoverIdx >= 0) {
        const tx = clamp(x(hoverIdx), 120, W - 150);
        const ty = Math.max(padT + 8, Math.min(y(accidents[hoverIdx]), y(deaths[hoverIdx])) - 74);
        const bw = 168, bh = 62;
        tctx.fillStyle = 'rgba(5, 12, 22, 0.94)';
        tctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
        tctx.lineWidth = 1;
        roundRect(tctx, tx - bw / 2, ty, bw, bh, 8);
        tctx.fill();
        tctx.stroke();
        tctx.textAlign = 'left';
        tctx.fillStyle = '#00e5ff';
        tctx.font = 'bold 12px Rajdhani, monospace';
        tctx.fillText('起数 ' + accidents[hoverIdx].toFixed(2) + ' 万起', tx - bw / 2 + 12, ty + 24);
        tctx.fillStyle = '#ff7a1a';
        tctx.fillText('死亡 ' + deaths[hoverIdx].toFixed(2) + ' 万人', tx - bw / 2 + 12, ty + 46);
      }
    };

    function roundRect(g, x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }

    trendCanvas.addEventListener('mousemove', e => {
      const r = trendCanvas.getBoundingClientRect();
      lastX = e.clientX - r.left;
      lastY = e.clientY - r.top;
      const W = trendCanvas.clientWidth;
      const padL = 46, padR = 18;
      const cw = W - padL - padR;
      const rel = (lastX - padL) / cw;
      let idx = Math.round(rel * (years.length - 1));
      idx = clamp(idx, 0, years.length - 1);
      const near = Math.abs(rel * (years.length - 1) - idx) < 0.28;
      hoverIdx = near ? idx : -1;
      drawTrend();
    });
    trendCanvas.addEventListener('mouseleave', () => { hoverIdx = -1; drawTrend(); });
    trendCanvas.addEventListener('touchstart', e => {
      const r = trendCanvas.getBoundingClientRect();
      lastX = e.touches[0].clientX - r.left;
      const W = trendCanvas.clientWidth;
      const padL = 46, padR = 18;
      const cw = W - padL - padR;
      hoverIdx = clamp(Math.round(((lastX - padL) / cw) * (years.length - 1)), 0, years.length - 1);
      drawTrend();
    }, { passive: true });

    drawTrend();
    window.addEventListener('resize', drawTrend);
  }

  /* ================= 5. 实时监测大屏模拟 ================= */

  const sensorDefs = [
    { name: 'A-01', unit: '%LEL', base: 3.2, vol: 0.5, min: 0, max: 100, fmt: v => v.toFixed(1) },
    { name: 'A-02', unit: 'ppm', base: 2.4, vol: 0.8, min: 0, max: 10, fmt: v => v.toFixed(1) },
    { name: 'B-03', unit: '℃', base: 118, vol: 2.2, min: 0, max: 200, fmt: v => v.toFixed(0) },
    { name: 'C-01', unit: 'MPa', base: 0.72, vol: 0.04, min: 0, max: 2, fmt: v => v.toFixed(2) },
    { name: 'D-02', unit: 'mg/m³', base: 1.8, vol: 0.3, min: 0, max: 15, fmt: v => v.toFixed(1) },
    { name: 'E-05', unit: '%VOL', base: 20.8, vol: 0.15, min: 0, max: 30, fmt: v => v.toFixed(1) }
  ];

  const sensorEls = $$('.sensor');
  const sensorState = sensorEls.map((el, i) => {
    const def = sensorDefs[i];
    return { el, def, value: def.base, target: def.base };
  });

  const alertList = $('#alertList');
  const alertCountEl = $('#alertCount');
  const alertPool = [
    { lv: 'lv-low', txt: '日常巡检完成 · 3#车间无异常' },
    { lv: 'lv-low', txt: '班前会安全交底已确认 · 全员在岗' },
    { lv: 'lv-low', txt: '动火作业票审批通过 · 监护人就位' },
    { lv: 'lv-mid', txt: 'B-03 反应釜温度波动 · 已自动调节' },
    { lv: 'lv-low', txt: '消防通道视频巡检正常 · 无占用' },
    { lv: 'lv-low', txt: '危化品仓库温湿度在控范围' },
    { lv: 'lv-mid', txt: 'C-01 管道压力短时波动 · 关注中' },
    { lv: 'lv-low', txt: '特种设备到期校验提醒 · 已排程' },
    { lv: 'lv-low', txt: '受限空间作业 2 小时 · 气体持续监测' },
    { lv: 'lv-low', txt: '防爆区域静电接地检测合格' },
    { lv: 'lv-mid', txt: 'D-02 粉尘浓度接近预警线 · 风机已联动' },
    { lv: 'lv-low', txt: '员工培训合格证即将到期 · 5 人待复训' }
  ];
  let alertSeq = 0;
  const nowStr = () => {
    const d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  };
  const pushAlert = (lv, txt) => {
    const li = document.createElement('li');
    li.className = 'alert-item ' + lv;
    li.innerHTML = `<span class="alert-time">${nowStr()}</span><span class="alert-msg">${txt}</span><span class="alert-lv">${lv.replace('lv-', '').toUpperCase()}</span>`;
    li.addEventListener('click', () => li.classList.toggle('acked'));
    alertList.prepend(li);
    while (alertList.children.length > 7) alertList.lastChild.remove();
    alertCountEl.textContent = alertList.children.length + ' 条';
  };

  pushAlert('lv-low', '监测系统自检完成 · 所有通道在线');
  pushAlert('lv-low', '应急广播测试正常 · 声压达标');
  pushAlert('lv-mid', 'E-05 有限空间作业气体实时监护中');

  const liveCanvas = $('#liveChart');
  let liveCtx = null;
  const liveData = sensorEls.map(() => Array(90).fill(0.5));
  const lineColors = ['#00e5ff', '#00ff9d', '#ffe14d', '#ff7a1a', '#b967ff', '#4da6ff'];

  let playing = true;
  let channelsOn = [true, true, true, true, true, true];
  let globalThr = 0.75;
  let normCache = [0.2, 0.25, 0.5, 0.4, 0.3, 0.3];

  const drawLive = () => {
    const W = liveCanvas.clientWidth;
    const H = liveCanvas.clientHeight;
    const D = Math.min(window.devicePixelRatio || 1, 2);
    if (liveCanvas.width !== W * D || liveCanvas.height !== H * D) {
      liveCanvas.width = W * D;
      liveCanvas.height = H * D;
    }
    liveCtx.setTransform(D, 0, 0, D, 0, 0);
    liveCtx.clearRect(0, 0, W, H);

    const padL = 40, padR = 12, padT = 14, padB = 26;
    const cw = W - padL - padR, ch = H - padT - padB;
    const n = liveData[0].length;

    liveCtx.strokeStyle = 'rgba(0, 229, 255, 0.07)';
    liveCtx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const gy = padT + (ch * g) / 4;
      liveCtx.beginPath(); liveCtx.moveTo(padL, gy); liveCtx.lineTo(W - padR, gy); liveCtx.stroke();
    }
    liveCtx.fillStyle = 'rgba(125, 147, 168, 0.7)';
    liveCtx.font = '10px Rajdhani, monospace';
    liveCtx.textAlign = 'right';
    [1, 0.75, 0.5, 0.25, 0].forEach((v, g) => {
      liveCtx.fillText((v * 100).toFixed(0) + '%', padL - 6, padT + (ch * g) / 4 + 3);
    });
    // 阈值虚线
    const thY = padT + ch - ch * globalThr;
    liveCtx.strokeStyle = 'rgba(255, 45, 85, 0.45)';
    liveCtx.setLineDash([5, 5]);
    liveCtx.beginPath(); liveCtx.moveTo(padL, thY); liveCtx.lineTo(W - padR, thY); liveCtx.stroke();
    liveCtx.setLineDash([]);
    liveCtx.fillStyle = 'rgba(255, 45, 85, 0.7)';
    liveCtx.textAlign = 'left';
    liveCtx.fillText('THR', W - padR - 26, thY - 5);

    liveData.forEach((arr, si) => {
      if (!channelsOn[si]) return;
      liveCtx.beginPath();
      arr.forEach((v, i) => {
        const px = padL + (cw * i) / (n - 1);
        const py = padT + ch - ch * clamp(v, 0, 1);
        i ? liveCtx.lineTo(px, py) : liveCtx.moveTo(px, py);
      });
      liveCtx.strokeStyle = lineColors[si % lineColors.length];
      liveCtx.lineWidth = 1.6;
      liveCtx.globalAlpha = 0.85;
      liveCtx.stroke();
      liveCtx.globalAlpha = 1;
      const lx = padL + cw, ly = padT + ch - ch * clamp(arr[arr.length - 1], 0, 1);
      liveCtx.beginPath();
      liveCtx.arc(lx, ly, 3, 0, Math.PI * 2);
      liveCtx.fillStyle = lineColors[si % lineColors.length];
      liveCtx.fill();
    });
    liveCtx.fillStyle = 'rgba(125, 147, 168, 0.75)';
    liveCtx.font = '10px Rajdhani, monospace';
    liveCtx.textAlign = 'center';
    liveCtx.fillText('-90s', padL, H - 8);
    liveCtx.fillText('NOW', W - padR - 14, H - 8);
  };

  const gaugeArc = $('#gaugeArc');
  const gaugeNum = $('#gaugeNum');
  const riskState = $('#riskState');
  const GAUGE_LEN = 251.33;

  const setGauge = v => {
    const p = clamp(v, 0, 1);
    gaugeArc.style.strokeDashoffset = GAUGE_LEN * (1 - p);
    gaugeNum.textContent = Math.round(p * 100);
    if (p < 0.35) {
      riskState.innerHTML = '■ 风险状态：低 · 可控';
      riskState.style.cssText = 'color:var(--green);border-color:rgba(0,255,157,.3);background:rgba(0,255,157,.05)';
    } else if (p < 0.65) {
      riskState.innerHTML = '■ 风险状态：中 · 关注';
      riskState.style.cssText = 'color:var(--yellow);border-color:rgba(255,225,77,.3);background:rgba(255,225,77,.05)';
    } else if (p < 0.85) {
      riskState.innerHTML = '■ 风险状态：较高 · 预警';
      riskState.style.cssText = 'color:var(--orange);border-color:rgba(255,122,26,.3);background:rgba(255,122,26,.05)';
    } else {
      riskState.innerHTML = '■ 风险状态：高 · 立即处置';
      riskState.style.cssText = 'color:var(--red);border-color:rgba(255,45,85,.3);background:rgba(255,45,85,.05)';
    }
  };

  let alertTimer = 0;
  const simTick = () => {
    if (!playing) return;
    sensorState.forEach((s, i) => {
      s.value += (s.target - s.value) * 0.18;
      if (Math.random() < 0.06) {
        s.target = clamp(s.def.base + rnd(-s.def.vol, s.def.vol) * (Math.random() < 0.06 ? 2.6 : 1), s.def.min, s.def.max);
      }
      const norm = clamp(s.value / s.def.max, 0, 1);
      normCache[i] = norm;
      const warn = globalThr * 0.72;
      const valEl = s.el.querySelector('.sensor-val');
      const fillEl = s.el.querySelector('.bar-fill');
      valEl.textContent = s.def.fmt(s.value);
      fillEl.style.width = clamp(norm * 100, 2, 100) + '%';
      s.el.classList.toggle('warn', norm > warn && norm <= globalThr);
      s.el.classList.toggle('danger', norm > globalThr);
      const arr = liveData[i];
      arr.push(norm);
      arr.shift();
    });
    drawLive();

    const maxNorm = Math.max(...normCache);
    const avgNorm = normCache.reduce((a, b) => a + b, 0) / normCache.length;
    setGauge(maxNorm * 0.72 + avgNorm * 0.28);

    alertTimer++;
    if (alertTimer % 14 === 0) {
      const a = alertPool[Math.floor(Math.random() * alertPool.length)];
      pushAlert(a.lv, a.txt);
      alertSeq++;
    }
    if (alertTimer % 47 === 0) {
      sensorState[3].target = clamp(sensorState[3].def.base + 0.55, 0, sensorState[3].def.max);
      pushAlert('lv-mid', 'C-01 管道压力波动 · 联动调压阀开启');
    }
    if (alertTimer % 61 === 0) {
      sensorState[2].target = clamp(sensorState[2].def.base + 46, 0, sensorState[2].def.max);
      pushAlert('lv-high', 'B-03 反应釜温度升高 · 冷却循环已介入');
    }
  };

  if (liveCanvas) {
    liveCtx = liveCanvas.getContext('2d');
    drawLive();
    setGauge(0.2);
    setInterval(simTick, 1000);

    window.aegis.monitor.sensorNorm = i => {
      if (i < 0 || i >= normCache.length) return null;
      return normCache[i];
    };

    // 控制：暂停/播放
    const playBtn = $('#mcPlay');
    playBtn.addEventListener('click', () => {
      playing = !playing;
      playBtn.textContent = playing ? '⏸ 暂停' : '▶ 继续';
      $('#sysStatus').textContent = playing ? '● 系统正常' : '● 已暂停';
    });

    // 控制：通道开关
    $$('.mt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const ch = parseInt(chip.dataset.ch, 10);
        channelsOn[ch] = !channelsOn[ch];
        chip.classList.toggle('on', channelsOn[ch]);
        drawLive();
      });
    });

    // 控制：报警阈值
    const thrRange = $('#thrRange');
    thrRange.addEventListener('input', () => {
      globalThr = parseFloat(thrRange.value);
      $('#thrVal').textContent = globalThr.toFixed(2);
      drawLive();
    });

    // 控制：全屏
    $('#mcFull').addEventListener('click', () => {
      const shell = $('#monitor .monitor-shell');
      if (!document.fullscreenElement) shell.requestFullscreen().catch(() => {});
      else document.exitFullscreen();
    });
  }

  /* ================= 6. Tilt 卡片 ================= */

  if (window.matchMedia('(pointer: fine)').matches) {
    $$('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ================= 7. 时间线进度 ================= */

  const tlProgress = $('#tlProgress');
  const timeline = $('.timeline');
  if (tlProgress && timeline) {
    const tlIO = new IntersectionObserver(() => {
      const r = timeline.getBoundingClientRect();
      const total = r.height;
      const passed = clamp(window.innerHeight * 0.6 - r.top, 0, total);
      tlProgress.style.height = clamp((passed / total) * 100, 0, 100) + '%';
    }, { threshold: Array.from({ length: 20 }, (_, i) => i / 20) });
    tlIO.observe(timeline);
  }

  /* ================= 8. Ticker 无缝循环 ================= */

  const tickerTrack = $('#tickerTrack');
  if (tickerTrack) tickerTrack.innerHTML += tickerTrack.innerHTML;
})();
