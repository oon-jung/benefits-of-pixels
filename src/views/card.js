// 풀스크린 카드. 필터 패널로 7종 선택 + animated 단계 latent 출렁임.
import { navigate } from '../router.js';
import { getState, setCardState, setSelectedFilter, subscribe } from '../state.js';
import works from '../../data/works.json';
import { applyFilter, animateFilter, FILTER_NAMES, CELL_BASED, TIME_BASED } from '../filters/index.js';
import { setupLatent, drawLatent } from '../animations/latent.js';

const NEXT_BY_STATE = {
  idle: 'detecting',
  detecting: 'detected',
  detected: 'filtered',
  filtered: 'animated',
  animated: 'message',
  message: 'idle'
};

const FILTER_GLYPH = {
  mosaic: '▦',
  halftone: '●',
  stipple: '⋯',
  spike: '▲',
  wave: '∿',
  ascii: '@',
  glitch: '⌇'
};

const PROCESS_MAX_DIM = 480;

export function mount(root, { workId } = {}) {
  const work = works.find(w => w.id === workId);

  root.innerHTML = `
    <section class="view view-card">
      <header class="card-header">
        <button class="btn-back" type="button">← BACK</button>
        <span class="card-state-label">IDLE</span>
      </header>
      <div class="card-body">
        ${
          work
            ? `<aside class="card-text">
                 <span class="card-num">${(work.id || '').replace(/^work/, '')}</span>
                 <span class="card-quote-title">&lt;픽셀의 효능&gt;</span>
                 <p class="card-quote">${work.quote || ''}</p>
               </aside>
               <div class="card-stage">
                 <canvas class="card-canvas"></canvas>
                 <div class="card-meta">
                   <strong>${work.name}</strong>${work.team ? ` · ${work.team}` : ''}${work.loc ? ` · ${work.loc}` : ''}
                   · <span class="card-filter-label">${work.defaultFilter}</span>
                 </div>
                 <div class="filter-panel" hidden>
                   ${FILTER_NAMES.map(
                     name => `<button class="filter-btn" type="button" data-filter="${name}" title="${name}">${FILTER_GLYPH[name] || '?'}</button>`
                   ).join('')}
                 </div>
                 <div class="card-message" hidden>
                   <p class="card-message-text">${work.message || ''}</p>
                 </div>
               </div>`
            : `<div class="card-error">unknown workId: ${workId}</div>`
        }
      </div>
    </section>
  `;

  const cleanups = [];
  const back = root.querySelector('.btn-back');
  const onBack = () => navigate('/works');
  back.addEventListener('click', onBack);
  cleanups.push(() => back.removeEventListener('click', onBack));

  if (!work) return () => cleanups.forEach(fn => fn());

  setSelectedFilter(work.defaultFilter);

  const body = root.querySelector('.card-body');
  const stateLabel = root.querySelector('.card-state-label');
  const filterLabel = root.querySelector('.card-filter-label');
  const canvas = root.querySelector('.card-canvas');
  const ctx = canvas.getContext('2d');
  const filterPanel = root.querySelector('.filter-panel');
  const filterButtons = root.querySelectorAll('.filter-btn');
  const messageOverlay = root.querySelector('.card-message');

  let srcCanvas = null;
  let imageReady = false;
  let cachedFilter = null; // { name, canvas, cells }
  let raf = 0;

  const img = new Image();
  img.onload = () => {
    let W = img.naturalWidth;
    let H = img.naturalHeight;
    if (W > PROCESS_MAX_DIM || H > PROCESS_MAX_DIM) {
      const scale = PROCESS_MAX_DIM / Math.max(W, H);
      W = Math.round(W * scale);
      H = Math.round(H * scale);
    }
    canvas.width = W;
    canvas.height = H;
    srcCanvas = document.createElement('canvas');
    srcCanvas.width = W;
    srcCanvas.height = H;
    srcCanvas.getContext('2d').drawImage(img, 0, 0, W, H);
    imageReady = true;
    render(getState());
  };
  img.onerror = () => console.warn('[card] image load failed', img.src);
  img.src = `/${work.selected || work.photo}`;

  function ensureFilterCache(name) {
    if (cachedFilter && cachedFilter.name === name) return cachedFilter;
    const r = applyFilter(name, srcCanvas);
    if (r.cells.length) setupLatent(r.cells);
    cachedFilter = { name, canvas: r.canvas, cells: r.cells };
    return cachedFilter;
  }

  function clearFrame() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
  }

  function render(s) {
    if (!imageReady) return;
    const filterName = s.selectedFilter || work.defaultFilter;
    cancelAnimationFrame(raf);
    raf = 0;

    if (s.cardState === 'filtered') {
      clearFrame();
      const fc = ensureFilterCache(filterName);
      ctx.drawImage(fc.canvas, 0, 0);
      return;
    }

    if (s.cardState === 'animated' || s.cardState === 'message') {
      // cells 미리 셋업 (cell 기반 필터인 경우)
      let cells = [];
      if (CELL_BASED.has(filterName)) {
        cells = ensureFilterCache(filterName).cells;
      }
      const tick = () => {
        const t = performance.now();
        clearFrame();
        // 필터별 고유 모션 사용 (없으면 fallback)
        const handled = animateFilter(filterName, ctx, cells, t, srcCanvas);
        if (!handled) {
          if (CELL_BASED.has(filterName)) {
            drawLatent(ctx, cells, t);
          } else {
            const r = applyFilter(filterName, srcCanvas, { t });
            ctx.drawImage(r.canvas, 0, 0);
          }
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
      return;
    }

    // idle / detecting / detected: 원본 + 오버레이
    if (s.cardState === 'detecting') {
      const tick = () => {
        clearFrame();
        ctx.drawImage(srcCanvas, 0, 0);
        drawScanLine();
        raf = requestAnimationFrame(tick);
      };
      tick();
      return;
    }

    clearFrame();
    ctx.drawImage(srcCanvas, 0, 0);
    if (s.cardState === 'detected') drawBracket();
  }

  function drawScanLine() {
    const W = canvas.width, H = canvas.height;
    const t = (Date.now() % 1200) / 1200;
    const y = t * H;
    const grad = ctx.createLinearGradient(0, y - 14, 0, y + 14);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.22)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - 14, W, 28);
  }

  function drawBracket() {
    const W = canvas.width, H = canvas.height;
    const pad = Math.min(W, H) * 0.08;
    const len = Math.min(W, H) * 0.12;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const corners = [
      [pad, pad, 1, 1],
      [W - pad, pad, -1, 1],
      [pad, H - pad, 1, -1],
      [W - pad, H - pad, -1, -1]
    ];
    for (const [x, y, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * len);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * len, y);
      ctx.stroke();
    }
  }

  function updateFilterUI(s) {
    const filterName = s.selectedFilter || work.defaultFilter;
    filterLabel.textContent = filterName;
    filterButtons.forEach(b => {
      b.classList.toggle('is-active', b.dataset.filter === filterName);
    });
    const showPanel = ['detected', 'filtered', 'animated'].includes(s.cardState);
    filterPanel.hidden = !showPanel;
    if (messageOverlay) messageOverlay.hidden = s.cardState !== 'message';
  }

  // 카드 본문 탭 → 다음 상태
  const onTap = e => {
    if (e.target.closest('.filter-panel')) return; // 필터 패널 클릭은 별도 처리
    const cur = getState().cardState;
    const next = NEXT_BY_STATE[cur];
    if (next) setCardState(next);
  };
  body.addEventListener('click', onTap);
  cleanups.push(() => body.removeEventListener('click', onTap));

  // 필터 버튼 → 필터 변경. detected이면 filtered로 진행. (subscribe가 재렌더 처리)
  filterButtons.forEach(btn => {
    const handler = e => {
      e.stopPropagation();
      const name = btn.dataset.filter;
      cachedFilter = null;
      setSelectedFilter(name);
      if (getState().cardState === 'detected') {
        setCardState('filtered');
      }
    };
    btn.addEventListener('click', handler);
    cleanups.push(() => btn.removeEventListener('click', handler));
  });

  const unsub = subscribe(s => {
    stateLabel.textContent = s.cardState.toUpperCase();
    updateFilterUI(s);
    render(s);
  });
  cleanups.push(unsub);
  cleanups.push(() => cancelAnimationFrame(raf));

  // 초기 렌더
  stateLabel.textContent = getState().cardState.toUpperCase();
  updateFilterUI(getState());

  return () => cleanups.forEach(fn => fn());
}
