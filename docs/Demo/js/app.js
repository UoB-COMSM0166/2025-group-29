// js/app.js
import { initRouter } from './router.js';
import { initBackground } from './background.js';

function startApp() {
  initRouter();
  initBackground(document.getElementById('canvas-container'));
}

document.addEventListener('DOMContentLoaded', () => {
  // 立即初始化路由与背景，让它始终在 #introOverlay 下面渲染
  startApp();

  // （可选）如果需要在引导结束后做些额外逻辑，再监听它：
  window.addEventListener('introFinished', () => {
    // 这里放「引导结束后」才想做的事
  }, { once: true });
});