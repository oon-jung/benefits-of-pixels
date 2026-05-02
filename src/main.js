import './styles.css';
import { start as startRouter } from './router.js';
import * as intro from './views/intro.js';
import * as grid from './views/grid.js';
import * as card from './views/card.js';
import { setView } from './state.js';
import { DEMO_MODE } from './config.js';

// 모드 결정 — URL ?mode=kiosk 면 Pi 320×240 강제
const params = new URLSearchParams(location.search);
if (params.get('mode') === 'kiosk') {
  document.body.classList.add('kiosk');
}

// 서비스워커 등록 (PWA 오프라인 지원)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('[sw] register failed', err);
    });
  });
}

const root = document.getElementById('app');
let unmount = null;

const VIEWS = { intro, grid, card };

function render({ name, params }) {
  if (typeof unmount === 'function') {
    try { unmount(); } catch (e) { console.warn('unmount error', e); }
    unmount = null;
  }
  root.innerHTML = '';

  const view = VIEWS[name];
  const opts = name === 'card' ? { workId: params[0] } : {};
  setView(name, opts);
  unmount = view.mount(root, opts);
}

console.info(`[showcase] DEMO_MODE=${DEMO_MODE}`);
startRouter(render);
