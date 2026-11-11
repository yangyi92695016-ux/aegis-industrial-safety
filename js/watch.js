/* ============================================================
   AEGIS 安全腕表 · watch.js
   表盘切换 / 风险环 / 脉搏线 / 模拟传感器 / 呼吸训练 / 振动反馈
   ============================================================ */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const screens = Array.from(document.querySelectorAll('.w-screen'));
  const pagerDots = Array.from(document.querySelectorAll('.w-pager span'));
  let screen = 0;

  function go(i) {
    screen = (i + screens.length) % screens.length;
    screens.forEach((s, k) => s.classList.toggle('active', k === screen));
    pagerDots.forEach((d, k) => d.classList.toggle('on', k === screen));
    if (navigator.vibrate) navigator.vibrate(12);
  }

  // 滑动切换
  let sx = 0;
  document.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) go(screen + (dx < 0 ? 1 : -1));
  }, { passive: true });
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') go(screen + 1);
    if (e.key === 'ArrowLeft') go(screen - 1);
  });

  /* ---------- 时钟 ---------- */
  const pad = n => String(n).padStart(2, '0');
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  function tickClock() {
    const d = new Date();
    $('#wTime').textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
    $('#wDate').textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + week[d.getDay()];
    const s = d.getSeconds();
    // 秒针（呼吸环）
    document.querySelector('.w-tips').style.opacity = 0.6;
    if (s % 10 === 0) pulseBlip();
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- 风险环（模拟数据） ---------- */
  const RING = 276.5;
  const ring = $('#wRiskRing');
  const riskText = $('#wRiskText');
  const alertDot = $('#wAlertDot');
  const pulseCanvas = $('#wPulse');
  const pctx = pulseCanvas.getContext('2d');
  const pulseData = Array(60).fill(50);

  let risk = 0.22;
  function setRisk(v) {
    risk = Math.min(1, Math.max(0, v));
    ring.style.strokeDashoffset = RING * (1 - risk * 0.8);
    ring.style.stroke = risk > 0.72 ? '#ff2d55' : risk > 0.5 ? '#ff7a1a' : risk > 0.3 ? '#ffe14d' : '#00ff9d';
    riskText.textContent = '风险 ' + (risk > 0.72 ? '高' : risk > 0.5 ? '较高' : risk > 0.3 ? '中' : '低');
    riskText.style.color = ring.style.stroke;
    alertDot.classList.toggle('red', risk > 0.72);
    if (risk > 0.72 && navigator.vibrate) navigator.vibrate([120, 60, 120]);
  }

  function pulseBlip() {
    // 脉搏线上插一个跳动
    pulseData.push(50 + Math.random() * 18);
    pulseData.shift();
  }

  function drawPulse() {
    const W = pulseCanvas.clientWidth || 300;
    const H = pulseCanvas.clientHeight || 52;
    const D = Math.min(window.devicePixelRatio || 1, 2);
    if (pulseCanvas.width !== W * D) {
      pulseCanvas.width = W * D;
      pulseCanvas.height = H * D;
    }
    pctx.setTransform(D, 0, 0, D, 0, 0);
    pctx.clearRect(0, 0, W, H);
    pctx.beginPath();
    pulseData.forEach((v, i) => {
      const x = (W / pulseData.length) * i;
      const y = H / 2 + (v - 50) * (H / 40);
      i ? pctx.lineTo(x, y) : pctx.moveTo(x, y);
    });
    pctx.strokeStyle = 'rgba(0, 255, 157, 0.85)';
    pctx.lineWidth = 1.6;
    pctx.shadowColor = 'rgba(0, 255, 157, 0.6)';
    pctx.shadowBlur = 6;
    pctx.stroke();
    pctx.shadowBlur = 0;
  }
  setInterval(drawPulse, 200);

  /* ---------- 模拟传感器 + 巡检步数 ---------- */
  const sensorDefs = [
    { n: '可燃气体', u: '%LEL', base: 3.2, vol: 0.4, max: 100, f: v => v.toFixed(1) },
    { n: '温度', u: '℃', base: 118, vol: 1.5, max: 200, f: v => v.toFixed(0) },
    { n: '压力', u: 'MPa', base: 0.72, vol: 0.03, max: 2, f: v => v.toFixed(2) },
    { n: 'O₂', u: '%VOL', base: 20.8, vol: 0.1, max: 30, f: v => v.toFixed(1) }
  ];
  const sensorBox = $('#wSensors');
  const rows = sensorDefs.map(def => {
    const row = document.createElement('div');
    row.className = 'w-sensor-row';
    row.innerHTML = `<span>${def.n}</span><b>--</b>`;
    sensorBox.appendChild(row);
    return { def, row, v: def.base, t: def.base };
  });

  let steps = parseInt(localStorage.getItem('aegis_watch_steps') || '0', 10);
  const stepsEl = $('#wSteps');

  const alerts = [
    { lv: 'mid', t: 'C-01 管道压力波动 · 联动调压阀开启' },
    { lv: 'low', t: '动火作业票审批通过 · 监护人就位' },
    { lv: 'mid', t: 'B-03 反应釜温度升高 · 冷却循环已介入' },
    { lv: 'low', t: '特种设备校验提醒 · 已排程' },
    { lv: 'low', t: '防爆区域静电接地检测合格' }
  ];
  const alertList = $('#wAlertList');
  function renderAlerts() {
    alertList.innerHTML = alerts.slice(0, 4).map(a =>
      `<li class="${a.lv === 'low' ? '' : a.lv}">${a.t}</li>`).join('');
  }
  renderAlerts();

  setInterval(() => {
    rows.forEach(r => {
      r.v += (r.t - r.v) * 0.2;
      if (Math.random() < 0.08) {
        r.t = Math.min(r.def.max, Math.max(0, r.def.base + (Math.random() - 0.5) * r.def.vol * 2));
      }
      const norm = r.v / r.def.max;
      r.row.querySelector('b').textContent = r.def.f(r.v) + ' ' + r.def.u;
      r.row.className = 'w-sensor-row' + (norm > 0.5 ? ' warn' : '') + (norm > 0.72 ? ' danger' : '');
    });
    // 步数
    if (Math.random() < 0.5) {
      steps += Math.floor(Math.random() * 4);
      localStorage.setItem('aegis_watch_steps', String(steps));
      stepsEl.textContent = '👣 巡检 ' + steps + ' 步';
    }
    // 风险游走
    setRisk(risk + (Math.random() - 0.48) * 0.06);
    if (Math.random() < 0.1) {
      const a = alerts[Math.floor(Math.random() * alerts.length)];
      alerts.unshift(a);
      renderAlerts();
    }
  }, 1500);

  // 电池
  if (navigator.getBattery) {
    navigator.getBattery().then(b => {
      const el = $('#wBattery');
      const upd = () => { el.textContent = '🔋 ' + Math.round(b.level * 100) + '%' + (b.charging ? ' ⚡' : ''); };
      upd();
      b.addEventListener('levelchange', upd);
      b.addEventListener('chargingchange', upd);
    });
  }

  /* ---------- 呼吸训练 4-7-8 ---------- */
  const circle = $('#wBreathCircle');
  const breathText = $('#wBreathText');
  let breathTimer = null;
  function breathe(on) {
    if (on) {
      $('#wBreathBtn').textContent = '停止训练';
      cycle();
    } else {
      clearTimeout(breathTimer);
      circle.style.transform = 'scale(1)';
      circle.classList.remove('hold', 'out');
      breathText.textContent = '吸气';
      $('#wBreathBtn').textContent = '开始 4-7-8';
    }
  }
  function cycle() {
    circle.classList.remove('hold', 'out');
    breathText.textContent = '吸气';
    circle.style.transform = 'scale(1.25)';
    breathTimer = setTimeout(() => {
      circle.classList.add('hold');
      breathText.textContent = '屏息';
      circle.style.transform = 'scale(1.25)';
      breathTimer = setTimeout(() => {
        circle.classList.remove('hold');
        circle.classList.add('out');
        breathText.textContent = '呼气';
        circle.style.transform = 'scale(0.9)';
        breathTimer = setTimeout(() => {
          if ($('#wBreathBtn').textContent === '停止训练') cycle();
        }, 8000);
      }, 7000);
    }, 4000);
  }
  $('#wBreathBtn').addEventListener('click', () => {
    breathe($('#wBreathBtn').textContent === '开始 4-7-8');
  });

  go(0);
})();
