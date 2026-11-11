/* ============================================================
   AEGIS 3D 数字孪生工厂（three.js ESM）
   拖拽旋转 / 缩放 / 点击设备热点 / 模拟报警 / 视角切换
   ============================================================ */
(async function () {
  'use strict';

  const stage = document.getElementById('twinStage');
  if (!stage) return;
  const fallback = document.getElementById('twinFallback');
  const popup = document.getElementById('twinPopup');

  let THREE, OrbitControls;
  try {
    THREE = await import('three');
    OrbitControls = (await import('three/addons/controls/OrbitControls.js')).OrbitControls;
  } catch (e) {
    fallback.hidden = false;
    return;
  }

  // ---------- 渲染器 ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050b14, 0.0085);

  const camera = new THREE.PerspectiveCamera(50, stage.clientWidth / stage.clientHeight, 0.1, 400);
  camera.position.set(26, 20, 30);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 7, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 10;
  controls.maxDistance = 90;
  controls.maxPolarAngle = 1.45;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;

  // ---------- 灯光 ----------
  scene.add(new THREE.HemisphereLight(0x1e3a4d, 0x04070d, 1.15));
  const sun = new THREE.DirectionalLight(0xbfe9ff, 1.6);
  sun.position.set(30, 42, 18);
  scene.add(sun);
  const ambRed = new THREE.PointLight(0xff2d55, 0, 60, 1.8);
  ambRed.position.set(0, 12, 0);
  scene.add(ambRed);

  // ---------- 地面 ----------
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(70, 48),
    new THREE.MeshStandardMaterial({ color: 0x0a1420, roughness: 0.95, metalness: 0.1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  const grid = new THREE.GridHelper(120, 48, 0x00e5ff, 0x0e2a38);
  grid.position.y = 0;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);

  // ---------- 材质 ----------
  const matSteel = new THREE.MeshStandardMaterial({ color: 0x9fb4c4, roughness: 0.4, metalness: 0.85 });
  const matSteelDark = new THREE.MeshStandardMaterial({ color: 0x54687a, roughness: 0.45, metalness: 0.8 });
  const matTank = new THREE.MeshStandardMaterial({ color: 0xc9d6de, roughness: 0.38, metalness: 0.75 });
  const matWarning = new THREE.MeshStandardMaterial({ color: 0x2b1206, roughness: 0.6, metalness: 0.4 });

  const ringMats = [];
  ['#00ff9d', '#00e5ff', '#ffe14d', '#ff7a1a'].forEach(c => {
    ringMats.push(new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.6, roughness: 0.3 }));
  });

  const hot = [];          // 可点击热点
  const beacons = [];      // 报警灯
  const rings = [];        // 状态环
  let flare, flareLight, flareMat;
  const smokes = [];
  let alarmOn = false, alarmT = 0;

  // ---------- 工具：圆柱 ----------
  const cyl = (rTop, rBot, h, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 28), mat);
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  };
  const tube = (pts, r, mat) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, r, 12), mat);
    scene.add(m);
    return m;
  };
  const register = (mesh, id, name, ringIdx) => {
    hot.push({ mesh, id, name, ringIdx });
    return mesh;
  };

  // ---------- 储罐区 ----------
  const tankA = cyl(4.6, 4.6, 13, matTank, -10, 6.5, 2);
  cyl(4.0, 4.6, 0.8, matSteelDark, -10, 13.3, 2);
  register(tankA, 'tankA', '储罐 A · 甲苯', 0);

  const tankB = cyl(3.2, 3.2, 9, matTank, -3.5, 4.5, 5);
  register(tankB, 'tankB', '储罐 B · 液氨', 1);

  // 状态环
  [-10, -3.5].forEach((x, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(i === 0 ? 4.7 : 3.3, 0.16, 10, 40), ringMats[i]);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, i === 0 ? 13.5 : 9.2, i === 0 ? 2 : 5);
    scene.add(ring);
    rings.push(ring);
  });

  // ---------- 精馏塔 ----------
  const colBase = cyl(2.6, 2.6, 3.5, matSteelDark, 6, 1.75, 1);
  const colMid = cyl(1.7, 2.2, 14, matSteel, 6, 10.5, 1);
  const colTop = cyl(1.1, 1.7, 5, matSteel, 6, 20, 1);
  const colCap = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 16), matSteel);
  colCap.position.set(6, 22.9, 1);
  scene.add(colCap);
  register(colMid, 'column', '精馏塔 T-301', 2);
  const colRing = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.14, 10, 40), ringMats[2]);
  colRing.rotation.x = Math.PI / 2;
  colRing.position.set(6, 18.4, 1);
  scene.add(colRing);
  rings.push(colRing);

  // 塔顶扫描光束
  const scanBeam = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 4.5, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  scanBeam.position.set(6, 25.5, 1);
  scanBeam.rotation.x = Math.PI;
  scene.add(scanBeam);

  // ---------- 反应釜区 ----------
  const reactor = cyl(2.4, 2.4, 6, matSteelDark, 12, 3, 6);
  const reactorTop = cyl(1.0, 1.0, 2.2, matSteel, 12, 7.1, 6);
  const reactorCap = new THREE.Mesh(new THREE.SphereGeometry(1.15, 20, 14), matSteel);
  reactorCap.position.set(12, 8.4, 6);
  scene.add(reactorCap);
  register(reactor, 'reactor', '反应釜 R-102', 3);
  const reaRing = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.13, 10, 40), ringMats[3]);
  reaRing.rotation.x = Math.PI / 2;
  reaRing.position.set(12, 6.3, 6);
  scene.add(reaRing);
  rings.push(reaRing);

  // ---------- 控制楼 ----------
  const building = box(9, 6, 6, matSteelDark, 8, 3, -9);
  const winMat = new THREE.MeshStandardMaterial({ color: 0x0a2a3a, emissive: 0x1f6d8a, emissiveIntensity: 0.9 });
  for (let i = 0; i < 5; i++) {
    const w = box(0.7, 1.2, 0.1, winMat, 4.6 + i * 1.7, 3.6, -5.96);
  }
  register(building, 'control', '中央控制楼', -1);
  const beacon1 = beacon(8, 9.2, -9);
  beacons.push(beacon1);

  // ---------- 火炬系统 ----------
  const flareStack = cyl(0.5, 0.7, 16, matSteelDark, -14, 8, -6);
  flareMat = new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 2.2, roughness: 0.4 });
  flare = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.6, 12), flareMat);
  flare.position.set(-14, 17.6, -6);
  scene.add(flare);
  flareLight = new THREE.PointLight(0xff7a1a, 6, 26, 1.8);
  flareLight.position.set(-14, 18.5, -6);
  scene.add(flareLight);
  register(flareStack, 'flare', '火炬系统 F-01', -1);

  // ---------- 管道 ----------
  tube([new THREE.Vector3(-10, 11, 2), new THREE.Vector3(-10, 11, -2), new THREE.Vector3(6, 12, -2), new THREE.Vector3(6, 12, 1)], 0.32, matSteel);
  tube([new THREE.Vector3(-3.5, 7, 5), new THREE.Vector3(1, 7, 5), new THREE.Vector3(1, 5.5, 5), new THREE.Vector3(12, 5.5, 6)], 0.26, matSteelDark);
  tube([new THREE.Vector3(6, 4, 1), new THREE.Vector3(6, 4, -6), new THREE.Vector3(8, 4, -6)], 0.24, matSteelDark);

  // ---------- 报警灯 ----------
  function beacon(x, y, z) {
    const pole = cyl(0.08, 0.08, 2.4, matSteelDark, x, y - 1.2, z);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10),
      new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff7a1a, emissiveIntensity: 2 }));
    lamp.position.set(x, y, z);
    scene.add(lamp);
    return lamp;
  }
  const beacon2 = beacon(6, 6.2, 7);
  const beacon3 = beacon(-14, 10.6, 2);
  beacons.push(beacon2, beacon3);

  // ---------- 烟雾粒子 ----------
  const smokeTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(200, 210, 220, 0.85)');
    grad.addColorStop(1, 'rgba(200, 210, 220, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  for (let i = 0; i < 26; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: smokeTex, transparent: true, opacity: 0.25, depthWrite: false, color: 0x9fb4c4
    }));
    sp.userData = { y: rnd(10, 30), speed: rnd(0.5, 1.4), drift: rnd(-0.2, 0.2) };
    sp.position.set(-10 + rnd(-1, 1), sp.userData.y, 2 + rnd(-1, 1));
    sp.scale.set(rnd(1.6, 3.4), rnd(1.6, 3.4), 1);
    scene.add(sp);
    smokes.push(sp);
  }

  // ---------- 热点射线 ----------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selected = null;

  function onPointerDown(e) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hot.map(h => h.mesh), false);
    if (hits.length) {
      const h = hot.find(x => x.mesh === hits[0].object);
      if (h) { selected = h; showPopup(e.clientX - r.left, e.clientY - r.top, h); }
    } else if (popup && !popup.contains(e.target)) {
      popup.hidden = true;
    }
  }
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('touchstart', e => onPointerDown(e.touches[0]), { passive: true });

  // ---------- 弹窗 ----------
  function showPopup(x, y, h) {
    popup.hidden = false;
    const idx = h.ringIdx;
    const state = alarmOn ? 2 : ringState(idx);
    const stTxt = state === 0 ? '运行正常' : state === 1 ? '关注中' : '报警';
    const stCls = state === 0 ? 'ok' : 'warn';
    popup.innerHTML = `
      <button class="tp-close">✕</button>
      <h4>${h.name}</h4>
      <div class="tp-status ${stCls}">● ${stTxt} ${h.id === 'control' ? '' : '· ID: ' + h.id}</div>
      <div class="tp-row"><span>温度</span><b>${h.id === 'control' ? '22' : (38 + Math.round(((idx + 1) * 37) % 89))} ℃</b></div>
      <div class="tp-row"><span>压力</span><b>${(0.3 + ((idx + 2) * 0.17) % 1.1).toFixed(2)} MPa</b></div>
      <div class="tp-row"><span>运行时长</span><b>${(idx + 2) * 347}h</b></div>
      <div class="tp-row"><span>下次巡检</span><b>${alarmOn ? '立即' : '2h 后'}</b></div>`;
    popup.querySelector('.tp-close').onclick = () => { popup.hidden = true; };

    const pw = popup.offsetWidth, ph = popup.offsetHeight;
    const cw = stage.clientWidth, chh = stage.clientHeight;
    popup.style.left = Math.min(x + 18, cw - pw - 10) + 'px';
    popup.style.top = Math.min(y - ph / 2, chh - ph - 10) + 'px';
  }

  function ringState(i) {
    const s = window.aegis && window.aegis.monitor && window.aegis.monitor.sensorNorm(i);
    const v = s == null ? 0.25 + ((i * 13) % 30) / 100 : s;
    return v > 0.72 ? 2 : v > 0.5 ? 1 : 0;
  }

  // ---------- 视角 ----------
  const views = {
    overview: { pos: [26, 20, 30], tgt: [0, 7, 0] },
    tank: { pos: [-18, 12, 10], tgt: [-7, 8, 3] },
    column: { pos: [14, 18, 12], tgt: [6, 13, 1] },
    flare: { pos: [-24, 12, -2], tgt: [-14, 12, -6] }
  };
  let viewTarget = null, viewPos = null;
  function flyTo(view) {
    const v = views[view];
    viewTarget = new THREE.Vector3(...v.tgt);
    viewPos = new THREE.Vector3(...v.pos);
  }
  document.querySelectorAll('.tc-btn[data-view]').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.tc-btn[data-view]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      flyTo(b.dataset.view);
    });
  });

  // ---------- 控制按钮 ----------
  const rotBtn = document.getElementById('tcRotate');
  rotBtn.addEventListener('click', () => {
    controls.autoRotate = !controls.autoRotate;
    rotBtn.textContent = controls.autoRotate ? '⏸ 暂停旋转' : '▶ 自动旋转';
    rotBtn.classList.toggle('active', controls.autoRotate);
  });
  document.getElementById('tcAlarm').addEventListener('click', function () {
    alarmOn = !alarmOn;
    alarmT = 0;
    this.classList.toggle('on', alarmOn);
    this.textContent = alarmOn ? '🚨 解除报警' : '🚨 模拟报警';
    if (!alarmOn) rings.forEach((r, i) => { r.material = ringMats[i]; r.material.emissiveIntensity = 1.6; });
    if (popup) popup.hidden = true;
  });
  document.getElementById('tcFullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) stage.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  });

  // ---------- 动画循环 ----------
  const clock = new THREE.Clock();
  let visible = true;
  const visIO = new IntersectionObserver(en => { visible = en[0].isIntersecting; }, { threshold: 0.02 });
  visIO.observe(stage);

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();

    // 火焰
    if (flare) {
      const flick = alarmOn ? 1.6 : 1;
      flare.scale.set(1 + Math.sin(t * 21) * 0.12, 1 + Math.sin(t * 17 + 1) * 0.25 * flick, 1 + Math.sin(t * 19) * 0.12);
      flareMat.emissiveIntensity = (alarmOn ? 3.4 : 2.2) + Math.sin(t * 13) * 0.6;
      flareLight.intensity = (alarmOn ? 11 : 6) + Math.sin(t * 13) * 1.5;
    }

    // 烟雾
    smokes.forEach(sp => {
      sp.userData.y += sp.userData.speed * 0.02 * (alarmOn ? 1.8 : 1);
      sp.position.x += sp.userData.drift * 0.02;
      if (sp.userData.y > 34) { sp.userData.y = 10; sp.position.x = -10 + rnd(-1, 1); }
      sp.position.y = sp.userData.y;
      sp.material.opacity = alarmOn ? 0.5 : 0.25;
    });

    // 报警灯
    beacons.forEach((b, i) => {
      const s = alarmOn ? 1 + Math.sin(t * 8 + i) * 0.5 : 1;
      b.scale.setScalar(Math.max(0.4, s));
      b.material.color.set(alarmOn ? 0xff2d55 : 0xff7a1a);
      b.material.emissive.set(alarmOn ? 0xff2d55 : 0xff7a1a);
      b.material.emissiveIntensity = alarmOn ? 3 : 1.4 + Math.sin(t * 5 + i) * 0.7;
    });

    // 状态环
    if (alarmOn) {
      rings.forEach((r, i) => {
        r.material = new THREE.MeshStandardMaterial({ color: 0xff2d55, emissive: 0xff2d55, emissiveIntensity: 2 + Math.sin(t * 10 + i) * 1 });
      });
    } else {
      rings.forEach((r, i) => {
        const st = ringState(i);
        const cols = [0x00ff9d, 0xffe14d, 0xff2d55];
        if (r.material.color.getHex() !== cols[st]) {
          r.material = new THREE.MeshStandardMaterial({ color: cols[st], emissive: cols[st], emissiveIntensity: 1.4 + st * 0.7, roughness: 0.3 });
        }
      });
    }

    // 扫描光束
    scanBeam.rotation.y = t * 0.8;
    scanBeam.material.opacity = 0.18 + Math.sin(t * 2) * 0.1;

    // 报警环境光
    ambRed.intensity = alarmOn ? 2.5 + Math.sin(t * 9) * 1.5 : 0;

    // 视角过渡
    if (viewPos && viewTarget) {
      camera.position.lerp(viewPos, 0.06);
      controls.target.lerp(viewTarget, 0.06);
      if (camera.position.distanceTo(viewPos) < 0.4) { viewPos = viewTarget = null; }
    }

    controls.update();
    renderer.render(scene, camera);

    // 弹窗跟随
    if (selected && !popup.hidden) {
      const sp = selected.mesh.position.clone();
      sp.y += selected.mesh.geometry.parameters.height ? selected.mesh.geometry.parameters.height / 2 + 2 : 5;
      sp.project(camera);
      const x = (sp.x * 0.5 + 0.5) * stage.clientWidth;
      const y = (-sp.y * 0.5 + 0.5) * stage.clientHeight;
      if (sp.z < 1) {
        popup.style.left = Math.min(x + 16, stage.clientWidth - popup.offsetWidth - 10) + 'px';
        popup.style.top = Math.max(8, Math.min(y - popup.offsetHeight / 2, stage.clientHeight - popup.offsetHeight - 10)) + 'px';
      }
    }
  }
  animate();

  // ---------- 尺寸自适应 ----------
  new ResizeObserver(() => {
    camera.aspect = stage.clientWidth / stage.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(stage.clientWidth, stage.clientHeight);
  }).observe(stage);

  // ---------- 对外接口 ----------
  window.aegisTwin = {
    setAlarm(on) {
      if (on === alarmOn) return;
      document.getElementById('tcAlarm').click();
    },
    flyTo
  };
  console.log('AEGIS 3D Twin ready ✓');

  function rnd(a, b) { return a + Math.random() * (b - a); }
})();
