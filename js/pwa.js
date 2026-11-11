// PWA：Service Worker 注册 + 安装引导
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    // 相对路径注册：子路径（GitHub Pages /repo/）与根路径均兼容
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });

  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    document.querySelectorAll('.install-btn').forEach(b => {
      b.classList.add('ready');
      b.querySelector('.btn-label').textContent = '一键安装 App';
    });
  });

  window.aegisInstall = () => {
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(() => { deferred = null; });
    } else {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isIOS) {
        alert('iOS 安装方法：\n① 用 Safari 打开本页\n② 点击分享按钮 📤\n③ 选择「添加到主屏幕」\n即可像 App 一样全屏使用');
      } else {
        alert('安装方法：\n① 浏览器右上角菜单 ⋮\n② 选择「安装应用 / 添加到主屏幕」\n即可像 App 一样全屏使用');
      }
    }
  };
})();
