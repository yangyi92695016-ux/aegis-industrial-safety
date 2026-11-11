/* ============================================================
   AEGIS 风险自评雷达：6 维度滑杆 → 雷达图 + 综合防护力 + 建议
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const DIMS = ['人员培训', '设备完好', '工艺风险', '环境因素', '制度落实', '应急能力'];
  const SUGGESTS = [
    '员工三级安全教育与特种作业持证率待提升，建议开展「班前五分钟」培训。',
    '关键设备点检与预防性维护不足，建议建立设备健康档案与红外测温周期。',
    '工艺与作业风险较高，建议落实风险分级管控，高风险作业升级审批。',
    '环境与季节因素风险突出，建议加强极端天气预警联动与防滑防冻防暑措施。',
    '制度与责任落实需加强，建议推行全员安全生产责任制与履职清单。',
    '应急响应能力是短板，建议每月开展实战化演练，配齐应急物资并定期点检。'
  ];

  const sliders = Array.from(document.querySelectorAll('.as-item input'));
  const values = sliders.map(s => parseInt(s.value, 10));

  function draw() {
    const W = canvas.clientWidth || 420;
    const H = W;
    const D = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * D;
    canvas.height = H * D;
    ctx.setTransform(D, 0, 0, D, 0, 0);

    const cx = W / 2, cy = H / 2 + 8, R = W * 0.36;
    const N = DIMS.length;
    const ang = i => -Math.PI / 2 + (i * Math.PI * 2) / N;

    // 网格环
    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = ang(i % N);
        const r = (R * ring) / 4;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = 'rgba(0,229,255,' + (ring === 4 ? 0.3 : 0.1) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // 轴线
    for (let i = 0; i < N; i++) {
      const a = ang(i);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.strokeStyle = 'rgba(0,229,255,0.14)';
      ctx.stroke();
    }

    // 数值多边形
    const pts = values.map((v, i) => {
      const a = ang(i), r = (R * v) / 100;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, R);
    grad.addColorStop(0, 'rgba(0,255,157,0.28)');
    grad.addColorStop(1, 'rgba(0,229,255,0.06)');
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.4;
    ctx.shadowColor = 'rgba(0,229,255,0.7)';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 顶点
    pts.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff9d';
      ctx.shadowColor = 'rgba(0,255,157,0.8)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 标签
    ctx.font = '13px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < N; i++) {
      const a = ang(i);
      const lx = cx + Math.cos(a) * (R + 34);
      const ly = cy + Math.sin(a) * (R + 34) + 4;
      ctx.fillStyle = '#d7e6f2';
      ctx.fillText(DIMS[i], lx, ly);
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 12px Rajdhani, monospace';
      ctx.fillText(values[i], cx + Math.cos(a) * (R + 34), ly + 16);
      ctx.font = '13px "Noto Sans SC", sans-serif';
    }
  }

  function update() {
    values.forEach((v, i) => {
      sliders[i].value = v;
      sliders[i].parentElement.querySelector('b').textContent = v;
    });
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const min = Math.min(...values);
    const minIdx = values.indexOf(min);
    const grade = avg >= 85 ? 'S' : avg >= 70 ? 'A' : avg >= 55 ? 'B' : avg >= 40 ? 'C' : 'D';
    const gradeColor = { S: '#00ff9d', A: '#00e5ff', B: '#ffe14d', C: '#ff7a1a', D: '#ff2d55' }[grade];
    const verdict = document.getElementById('asVerdict');
    verdict.innerHTML = `■ 综合防护力：<b style="color:${gradeColor}">${avg}</b> / 100 · 等级：<b style="color:${gradeColor}">${grade}</b> · ${avg >= 85 ? '行业标杆水平' : avg >= 70 ? '整体良好，持续改进' : avg >= 55 ? '中等偏上，补齐短板' : avg >= 40 ? '存在明显短板，限期整改' : '高风险，立即开展专项治理'}`;
    const suggest = document.getElementById('asSuggest');
    const top3 = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).slice(0, 3);
    suggest.innerHTML = `<b>🎯 优先改进方向：</b><ul>${top3.map(([v, i]) =>
      `<li>▸ <b>${DIMS[i]}</b>（${v} 分）：${SUGGESTS[i]}</li>`).join('')}</ul>`;
    draw();
  }

  sliders.forEach((s, i) => {
    s.addEventListener('input', () => {
      values[i] = parseInt(s.value, 10);
      update();
      if (navigator.vibrate) navigator.vibrate(8);
    });
  });

  new ResizeObserver(draw).observe(canvas);
  update();
})();
