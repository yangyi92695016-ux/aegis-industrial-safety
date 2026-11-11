/* ============================================================
   AEGIS 临危不乱 · 应急处置演练
   三场景决策闯关 + Canvas 认证证书生成下载
   ============================================================ */
(function () {
  'use strict';

  const intro = document.getElementById('drillIntro');
  const run = document.getElementById('drillRun');
  const result = document.getElementById('drillResult');
  const nameInput = document.getElementById('drillName');
  if (!intro) return;

  const SCENES = [
    {
      name: '危化品泄漏',
      icon: '🧪',
      steps: [
        {
          sit: '你在储罐区巡检时，发现 B-03 法兰处有液体滴漏，空气中弥漫刺鼻气味，地面已形成约 0.5㎡ 液渍。风向东南，下风向 20 米处有 4 名员工正在作业。',
          warn: '⚠ 甲苯 · 易燃易爆 · 吸入有害',
          opts: [
            { t: '立即用手去拧紧法兰螺栓止漏', s: 0, fb: '错误！带压泄漏点严禁直接处置，拧动螺栓可能扩大泄漏，且未佩戴防护用品直接接触危险。', good: false },
            { t: '上报控制室并启动现场应急处置，组织下风向人员向上风侧疏散', s: 2, fb: '正确！先报警疏散、再处置，上风侧集结是化学品泄漏处置的铁律。', good: true },
            { t: '先去找防爆对讲机，再回来观察泄漏是否扩大', s: 1, fb: '部分正确。观察没错，但应第一时间撤离人员并报警，而不是离开现场找设备。', good: false }
          ]
        },
        {
          sit: '你已上报。现场处置组需要进入泄漏区进行初期处置（关闭阀门、设置围堰）。此时应如何做好个人防护？',
          opts: [
            { t: '佩戴过滤式防毒面具 + 防化服 + 防化手套，两人一组进入', s: 1, fb: '基本正确。甲苯可用过滤式面罩，但浓度不明时应升级为隔绝式呼吸防护更稳妥。', good: false },
            { t: '佩戴正压式空气呼吸器 + 全封闭防化服，两人一组，一人监护', s: 2, fb: '正确！浓度不明区域进入必须使用隔绝式呼吸防护，双人作业 + 专人监护是标准配置。', good: true },
            { t: '普通工装 + 湿毛巾捂住口鼻，快速进入快速撤出', s: 0, fb: '错误！湿毛巾对甲苯蒸气几乎没有防护作用，这是最危险的做法。', good: false }
          ]
        },
        {
          sit: '处置中，泄漏点附近检测仪显示可燃气体浓度达到 25%LEL 且持续上升。此时应如何处置？',
          opts: [
            { t: '继续作业，加快关阀速度，尽快完成任务', s: 0, fb: '错误！浓度持续上升随时可能达到爆炸极限，继续作业是在拿生命冒险。', good: false },
            { t: '立即撤出全部人员至安全区，扩大警戒范围，禁止一切火源和车辆进入', s: 2, fb: '正确！达到爆炸下限的 25% 必须立即撤离，扩大警戒、切断火源，等待专业力量。', good: true },
            { t: '开启现场排风扇对泄漏区进行通风稀释', s: 1, fb: '部分正确。通风是好措施，但普通排风扇可能产生火花，需使用防爆风机，且人员应先撤离。', good: false }
          ]
        },
        {
          sit: '人员已撤离至安全区。现场指挥请你协助清点人员，此时发现下风向作业的 4 人中少了 1 人，疑似被困泄漏区。你应该？',
          opts: [
            { t: '立刻冲进泄漏区把他背出来', s: 0, fb: '错误！无防护进入毒气区域救人，极大概率救人者和被困者双双遇险，这是中毒事故中死亡人数扩大的主因。', good: false },
            { t: '立即报告现场指挥，提供被困人员最后位置信息，等待专业救援队携带防护装备搜救', s: 2, fb: '正确！信息上报 + 精确定位，让专业救援力量处置，严禁无防护盲目施救。', good: true },
            { t: '组织 3 名员工戴普通口罩一起进去搜救，人多力量大', s: 0, fb: '错误！人海战术在毒气环境中只会造成群死群伤。', good: false }
          ]
        },
        {
          sit: '专业救援队成功救出被困人员，伤员呼吸微弱。应急响应接近尾声，接下来最重要的工作是？',
          opts: [
            { t: '立即对伤员进行心肺复苏并转移至上风向医疗点，同时隔离泄漏源、清理回收泄漏物', s: 2, fb: '完美！伤员救治与现场洗消同步进行，防止二次事故与环境污染，处置链条完整。', good: true },
            { t: '全员集合拍合影，记录这次成功处置', s: 0, fb: '错误！应急还没有结束，伤员救治、现场恢复和事故调查才是重点。', good: false },
            { t: '让大家回岗位继续生产，不能耽误工期', s: 0, fb: '错误！未经检测评估擅自复工，可能引发二次事故。', good: false }
          ]
        }
      ]
    },
    {
      name: '车间初起火灾',
      icon: '🔥',
      steps: [
        {
          sit: '3# 车间配电箱突然打火，引燃旁边堆放的纸箱，火苗蹿起约半米高，浓烟开始弥漫。你距离火点约 5 米，墙上挂有灭火器。',
          warn: '⚠ 电气火灾 · 带电设备 · 浓烟',
          opts: [
            { t: '立即拉下配电箱总闸断电，大喊示警，取用干粉/二氧化碳灭火器灭火，同时呼叫增援', s: 2, fb: '正确！电气火灾先断电再灭火，使用适用于带电火灾的灭火器，第一时间示警。', good: true },
            { t: '端起旁边水桶泼水灭火', s: 0, fb: '严重错误！带电设备泼水会导致触电，且水流会扩大火势。', good: false },
            { t: '先拍照发工作群，等领导指示', s: 0, fb: '错误！火灾初期 1-3 分钟是灭火黄金时间，等指示就是等大火。', good: false }
          ]
        },
        {
          sit: '你按下报警按钮后开始灭火，但火势变大，灭火器即将用尽，浓烟迅速下沉。此时应如何决策？',
          opts: [
            { t: '坚持灭火，再坚持一下就能扑灭', s: 0, fb: '错误！浓烟下沉意味着烟气层已威胁呼吸，继续滞留极易吸入有毒烟气昏迷。', good: false },
            { t: '果断放弃灭火，低姿弯腰用湿布捂口鼻，沿疏散指示撤离，并随手关闭防火门', s: 2, fb: '正确！火势失控必须立即撤离，低姿避烟、关闭防火门阻隔蔓延，专业救援交给消防队。', good: true },
            { t: '躲进旁边办公室，关上门等待救援', s: 1, fb: '部分正确。若通道被火封堵，固守待援是正确选择；但若通道尚可通行，应优先撤离。', good: false }
          ]
        },
        {
          sit: '你撤到车间门口，发现一名同事还在往火场方向跑，说是要去抢救自己的笔记本电脑。你应该？',
          opts: [
            { t: '大声喝止并拉住他：财物不重要，人先撤出去！', s: 2, fb: '正确！火灾中最危险的行为就是折返火场，必须坚决阻止。', good: true },
            { t: '让他快去快回，帮他看着门', s: 0, fb: '错误！折返火场是火灾死亡事故的头号原因，任何理由都不值得。', good: false },
            { t: '跟他说里面有浓烟，给他一个灭火器防身', s: 0, fb: '错误！灭火器不是防烟面具，这是在把人推向危险。', good: false }
          ]
        },
        {
          sit: '全员撤至室外集合点。消防队到达后，指挥员问你车间内有无危险化学品、被困人员和电源总闸位置。你应该？',
          opts: [
            { t: '凭记忆大致描述一下，让消防员自己进去看', s: 0, fb: '错误！信息不准会误导救援，可能让消防员置身险境。', good: false },
            { t: '拿出车间的危险源分布图和人员清单，准确告知：油漆库存放位置、配电房位置、今日在岗人数', s: 2, fb: '正确！危险源信息 + 人员信息是消防指挥决策的关键依据，平时就要建立档案。', good: true },
            { t: '说不知道，让他问领导', s: 0, fb: '错误！应急状态下信息传递链越短越好，现场人员是第一信息源。', good: false }
          ]
        },
        {
          sit: '火被扑灭。事故调查启动，公司要求总结教训。以下哪项是最应写入整改报告的核心措施？',
          opts: [
            { t: '配电箱周边 1.5 米内严禁堆放可燃物，电气线路定期红外测温，全员火灾应急演练每月一次', s: 2, fb: '完美！消除点火源 + 控制可燃物 + 提升应急能力，三位一体的本质安全措施。', good: true },
            { t: '给每名员工配发更好的口罩', s: 0, fb: '错误！口罩解决不了电气火灾隐患，治标不治本。', good: false },
            { t: '把纸箱换成塑料箱堆放', s: 0, fb: '错误！塑料箱同样是可燃物，且燃烧会产生更多有毒烟气。', good: false }
          ]
        }
      ]
    },
    {
      name: '受限空间昏迷',
      icon: '🚧',
      steps: [
        {
          sit: '一名工人在污水井（深 3 米）内作业时突然倒下，井口的气体检测仪发出报警：H₂S 超标。同伴在井口大声呼喊，你就在附近。',
          warn: '⚠ 硫化氢 · 剧毒 · 盲目施救致死率高',
          opts: [
            { t: '立刻下井救人，时间就是生命', s: 0, fb: '严重错误！受限空间事故中，盲目施救导致的死亡人数常超过事故本身，你没有呼吸防护下井等于送死。', good: false },
            { t: '严禁任何人无防护下井；立即报警 119/120，持续向井内强制送风，取用救援三脚架和空气呼吸器待命', s: 2, fb: '正确！先送风稀释有毒气体，专业装备到位后由训练有素的人员佩戴呼吸器下井救援。', good: true },
            { t: '先下去把井盖完全打开，看看情况再决定', s: 1, fb: '部分正确。全开井盖增加通风是对的，但人不要下井，保持在井口外操作。', good: false }
          ]
        },
        {
          sit: '井内 H₂S 浓度极高，风送了一会儿后检测仪仍报警。专业救援队到场，需要确定下井救援方案。正确的是？',
          opts: [
            { t: '救援队员佩戴正压式空气呼吸器、系安全绳，地面两人监护，持续强制通风', s: 2, fb: '正确！隔绝式呼吸防护 + 安全绳 + 地面监护 + 持续通风，缺一不可。', good: true },
            { t: '队员深吸一口气，快速下井把人拽上来', s: 0, fb: '错误！憋气救人极度危险，井内瞬间中毒昏迷的案例屡见不鲜。', good: false },
            { t: '用绳子放下一个钩子，让同伴用钩子把人钩上来', s: 0, fb: '错误！用钩子拖拉会加重伤情，且昏迷人员无法配合。', good: false }
          ]
        },
        {
          sit: '被困人员被救出至地面，已昏迷，呼吸微弱。你接受过急救培训。第一时间应？',
          opts: [
            { t: '立即实施心肺复苏（CPR），同时让人取 AED，120 已在路上', s: 2, fb: '正确！昏迷且呼吸微弱必须立即 CPR，取用 AED，持续到专业医护人员接手。', good: true },
            { t: '给他喂水，帮助他恢复意识', s: 0, fb: '错误！昏迷人员喂水会造成窒息。', good: false },
            { t: '背着他跑步送往医院', s: 0, fb: '错误！不恰当的搬动可能加重伤害，原地急救 + 等待专业急救更有效。', good: false }
          ]
        },
        {
          sit: '伤员被救护车接走。现场指挥要求查明事故原因，防止二次事故。调查发现作业前未办理受限空间作业票，未进行气体检测。正确的整改是？',
          opts: [
            { t: '严格执行「先通风、再检测、后作业」审批流程，作业全程持续监测并设监护人', s: 2, fb: '正确！受限空间作业三条铁律：通风、检测、监护，任何一条缺失都不得作业。', good: true },
            { t: '以后派两个人一起下井，互相有个照应', s: 0, fb: '错误！增加人数不解决有毒气体问题，只会增加伤亡。', good: false },
            { t: '下井前烧纸测试氧气是否充足', s: 0, fb: '严重错误！在可能有可燃气体的井内点火是自杀行为。', good: false }
          ]
        },
        {
          sit: '事故善后阶段，公司开展受限空间专项培训。以下哪句话最能概括本次教训？',
          opts: [
            { t: '程序保命：不审批不作业、不检测不进入、无监护不下井、无防护不施救', s: 2, fb: '完美！把程序刻进肌肉记忆，是受限空间作业安全的终极防线。', good: true },
            { t: '年轻人身体好，下井前多做俯卧撑', s: 0, fb: '错误！身体好扛不住硫化氢。', good: false },
            { t: '井里其实没那么危险，这次是意外', s: 0, fb: '错误！麻木大意正是绝大多数受限空间事故的思想根源。', good: false }
          ]
        }
      ]
    }
  ];

  let sceneIdx = 0, stepIdx = 0, totalScore = 0, playerName = '';
  const maxScore = 5 * 2;

  const scoreEl = document.getElementById('drillScore');
  const stepEl = document.getElementById('drillStep');
  const barEl = document.getElementById('drillBar');
  const sitEl = document.getElementById('drillSituation');
  const optEl = document.getElementById('drillOptions');
  const fbEl = document.getElementById('drillFeedback');

  document.querySelectorAll('.scene-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.scene-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      sceneIdx = parseInt(card.dataset.scene, 10);
      playerName = nameInput.value.trim() || '安全卫士';
      stepIdx = 0; totalScore = 0;
      intro.hidden = true;
      run.hidden = false;
      result.hidden = true;
      renderStep();
    });
  });

  function renderStep() {
    const scene = SCENES[sceneIdx];
    const step = scene.steps[stepIdx];
    document.getElementById('drillSceneName').textContent = `${scene.icon} ${scene.name}`;
    scoreEl.textContent = totalScore;
    stepEl.textContent = (stepIdx + 1) + '/5';
    barEl.style.width = ((stepIdx + 1) / 5 * 100) + '%';
    sitEl.innerHTML = `
      <span class="ds-scene">SITUATION ${stepIdx + 1} / 5</span>
      <h4>${scene.name} · 现场处置</h4>
      <p>${step.sit}</p>
      <span class="ds-warn">${step.warn}</span>`;
    fbEl.hidden = true;
    optEl.innerHTML = '';
    step.opts.forEach((o, i) => {
      const btn = document.createElement('button');
      btn.className = 'drill-opt';
      btn.innerHTML = `<span class="opt-key">${String.fromCharCode(65 + i)}</span><span>${o.t}</span>`;
      btn.addEventListener('click', () => choose(btn, o, i));
      optEl.appendChild(btn);
    });
    sitEl.style.animation = 'none';
    void sitEl.offsetWidth;
    sitEl.style.animation = 'popIn .3s ease';
  }

  function choose(btn, o) {
    totalScore += o.s;
    scoreEl.textContent = totalScore;
    optEl.querySelectorAll('.drill-opt').forEach(b => b.disabled = true);
    btn.classList.add(o.good ? 'correct' : 'wrong');
    if (!o.good) {
      // 找出正确项高亮
      const scene = SCENES[sceneIdx];
      const step = scene.steps[stepIdx];
      step.opts.forEach((x, i) => {
        if (x.s === 2) optEl.children[i].classList.add('correct');
      });
    }
    if (navigator.vibrate) navigator.vibrate(o.good ? 30 : [80, 50, 80]);
    fbEl.hidden = false;
    fbEl.className = 'drill-feedback ' + (o.good ? 'good' : 'bad');
    fbEl.innerHTML = `<b>${o.good ? '✅ 处置正确' : '❌ 处置不当'}（+${o.s} 分）</b>${o.fb}` +
      `<button class="next-btn">${stepIdx === 4 ? '查看演练成绩 →' : '下一步 →'}</button>`;
    fbEl.querySelector('.next-btn').addEventListener('click', () => {
      stepIdx++;
      if (stepIdx >= 5) showResult();
      else renderStep();
    });
  }

  function showResult() {
    run.hidden = true;
    result.hidden = false;
    const rank = totalScore >= maxScore * 0.9 ? 'S' : totalScore >= maxScore * 0.75 ? 'A'
      : totalScore >= maxScore * 0.55 ? 'B' : 'C';
    const rankTxt = { S: '卓越指挥员', A: '优秀处置员', B: '合格响应者', C: '需要加强训练' }[rank];
    document.getElementById('resultTitle').textContent = `🎖 演练完成 · ${SCENES[sceneIdx].name}`;
    document.getElementById('resultRank').textContent = rank;
    document.getElementById('resultMsg').textContent =
      `${playerName} · 总分 ${totalScore}/${maxScore} · 评级 ${rank} · ${rankTxt}${rank === 'S' ? ' · 教科书级处置！' : ''}`;
    drawCert();
    if (navigator.vibrate) navigator.vibrate([60, 60, 120]);
  }

  function drawCert() {
    const c = document.getElementById('certCanvas');
    const g = c.getContext('2d');
    const W = 900, H = 600;
    g.clearRect(0, 0, W, H);
    // 背景
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#071019');
    bg.addColorStop(1, '#04101d');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    // 网格
    g.strokeStyle = 'rgba(0,229,255,0.06)';
    for (let x = 0; x < W; x += 45) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 45) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // 边框
    g.strokeStyle = '#00e5ff';
    g.lineWidth = 4;
    g.strokeRect(26, 26, W - 52, H - 52);
    g.strokeStyle = 'rgba(0,229,255,0.35)';
    g.lineWidth = 1;
    g.strokeRect(40, 40, W - 80, H - 80);
    // 角标
    g.fillStyle = '#00e5ff';
    [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]].forEach(([x, y]) => {
      g.fillRect(x - 10, y - 10, 20, 20);
    });
    // 盾牌 logo
    g.save();
    g.translate(W / 2, 118);
    g.strokeStyle = '#00e5ff';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(0, -42);
    g.lineTo(34, -28);
    g.lineTo(34, -6);
    g.quadraticCurveTo(34, 22, 0, 34);
    g.quadraticCurveTo(-34, 22, -34, -6);
    g.lineTo(-34, -28);
    g.closePath();
    g.stroke();
    g.strokeStyle = '#00ff9d';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-14, 2); g.lineTo(-3, 13); g.lineTo(16, -10);
    g.stroke();
    g.restore();
    // 标题
    g.textAlign = 'center';
    g.fillStyle = '#ffffff';
    g.font = 'bold 46px "Noto Sans SC", sans-serif';
    g.fillText('应急处置演练认证证书', W / 2, 210);
    g.fillStyle = 'rgba(125,147,168,0.9)';
    g.font = '20px Rajdhani, monospace';
    g.fillText('AEGIS EMERGENCY DRILL CERTIFICATE', W / 2, 246);
    // 分隔线
    g.strokeStyle = 'rgba(0,229,255,0.5)';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(W / 2 - 180, 270); g.lineTo(W / 2 + 180, 270); g.stroke();
    // 姓名
    g.fillStyle = '#ffffff';
    g.font = 'bold 52px "Noto Sans SC", sans-serif';
    g.fillText(playerName, W / 2, 350);
    g.fillStyle = 'rgba(125,147,168,0.85)';
    g.font = '19px "Noto Sans SC", sans-serif';
    g.fillText('于「' + SCENES[sceneIdx].name + '」演练中取得 ' + (totalScore * 10) + ' 分（满分 100 分）', W / 2, 395);
    // 评级章
    const rank = totalScore >= maxScore * 0.9 ? 'S' : totalScore >= maxScore * 0.75 ? 'A' : totalScore >= maxScore * 0.55 ? 'B' : 'C';
    g.save();
    g.translate(W - 190, 480);
    g.strokeStyle = '#00ff9d';
    g.lineWidth = 4;
    g.beginPath(); g.arc(0, 0, 52, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#00ff9d';
    g.font = 'bold 52px Orbitron, monospace';
    g.fillText(rank, 0, 18);
    g.font = '15px "Noto Sans SC", sans-serif';
    g.fillText('综合评级', 0, 80);
    g.restore();
    // 底部
    g.fillStyle = 'rgba(125,147,168,0.7)';
    g.font = '16px "Noto Sans SC", sans-serif';
    g.fillText('签发：AEGIS 天穹盾 · 工业安全中枢训练系统', W / 2, 500);
    const d = new Date();
    g.font = '16px Rajdhani, monospace';
    g.fillText('DATE: ' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), W / 2, 528);
    g.font = '13px "Noto Sans SC", sans-serif';
    g.fillStyle = 'rgba(255,122,26,0.8)';
    g.fillText('本证书为交互训练项目生成，用于安全教育培训演示', W / 2, 560);
  }

  document.getElementById('certDownload').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'AEGIS演练证书_' + playerName + '.png';
    a.href = document.getElementById('certCanvas').toDataURL('image/png');
    a.click();
  });
  document.getElementById('drillAgain').addEventListener('click', () => {
    intro.hidden = false;
    result.hidden = true;
  });
})();
