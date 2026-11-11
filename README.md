# AEGIS 天穹盾 · 工业安全中枢（交互版）

可交互的工业安全态势感知平台 —— 3D 数字孪生 + 实时监测大屏 + 游戏化训练 + 应急演练认证，**手机 / 电脑 / 手表三端一体**。

## 运行方式

- 方式一：直接双击 `index.html` 用浏览器打开
- 方式二：本地服务（推荐，PWA 安装需要）

  ```bash
  node serve.js
  # 访问 http://127.0.0.1:8000
  ```

## 📱 手机 App 安装（PWA）

| 平台 | 步骤 |
| --- | --- |
| Android / Chrome | 打开站点 → 右上角菜单 ⋮ → **安装应用**（或点页面「安装手机 App」按钮） |
| iOS / Safari | Safari 打开站点 → 分享 📤 → **添加到主屏幕** |
| 电脑 Chrome/Edge | 地址栏右侧安装图标 → 安装为独立应用 |

安装后：全屏启动、桌面图标、离线可用（Service Worker 已缓存全部本地资源）。

## ⌚ 手表模式

直接访问 **`/watch.html`**，四大表盘左右滑动切换：

1. **表盘**：时间 + 风险指数环 + 巡检步数 + 实时脉搏线
2. **感知数据**：可燃气体 / 温度 / 压力 / O₂ 模拟读数
3. **预警中心**：滚动预警列表
4. **呼吸训练**：4-7-8 减压呼吸引导（带振动反馈）

- Galaxy Watch / Wear OS：用 **Samsung Internet 浏览器**打开 `http://<电脑IP>:8000/watch.html` 即可
- 手机浏览器直接打开同样可用（模拟表盘演示）

## 🎮 交互模块

1. **3D 数字孪生工厂**（three.js / WebGL）：拖拽旋转、滚轮缩放、点击设备热点查看实时状态、四视角切换、模拟报警联动、全屏
2. **实时监测大屏**：6 路传感器随机游走，可暂停 / 通道开关 / 拖动报警阈值 / 点击预警确认 / 全屏
3. **火眼金睛 · 隐患查找**：60 秒找出 8 处安全隐患，点错扣分 + 震动反馈，星级评价，本地最佳纪录
4. **临危不乱 · 应急演练**：危化品泄漏 / 初起火灾 / 受限空间昏迷三大场景 × 5 步决策链，S/A/B/C 评级，**下载 PNG 认证证书**
5. **风险自评雷达**：6 维滑杆实时生成雷达图 + 综合防护力等级 + 优先改进建议
6. 数据总览（含图表悬停 Tooltip）、时间线、应急响应等原有板块全部保留

## 技术栈

- 原生 HTML/CSS/JS，零构建；three.js 0.160 通过 importmap CDN 引入（离线自动降级 2D 拓扑图）
- PWA：`manifest.webmanifest` + `sw.js` + `pwa.js`；图标由 `gen-icons.js` 无依赖生成
- 图表全部手写 Canvas；游戏场景 Canvas 绘制；证书 Canvas 生成下载

## 数据来源

- 应急管理部例行新闻发布会（2025-01-15）：
  https://www.mem.gov.cn/xw/xwfbh/2025n01y15xwfbh_6337/wzsl_4260/202501/t20250115_517107.shtml
- 《安全生产治本攻坚三年行动方案（2024—2026 年）》
- 监测大屏 / 3D 孪生 / 手表数据均为前端模拟演示流

## 目录结构

```
industrial-safety/
├── index.html          主站（10 大板块）
├── watch.html          手表模式
├── manifest.webmanifest PWA 清单
├── sw.js               离线 Service Worker
├── serve.js            零依赖静态服务器
├── gen-icons.js        图标生成器
├── css/  style.css · upgrade.css · watch.css
├── js/   main.js · three-twin.js · hazard-game.js · drill.js · radar.js · watch.js · pwa.js
└── icons/ 192/512/maskable PNG
```
