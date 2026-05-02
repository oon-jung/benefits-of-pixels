import * as mosaic from './mosaic.js';
import * as halftone from './halftone.js';
import * as stipple from './stipple.js';
import * as spike from './spike.js';
import * as wave from './wave.js';
import * as ascii from './ascii.js';
import * as glitch from './glitch.js';

const FILTERS = { mosaic, halftone, stipple, spike, wave, ascii, glitch };

export const FILTER_NAMES = Object.keys(FILTERS);

// cells 기반 출렁임 가능 — animated 단계에서 latent.drawCells 사용
export const CELL_BASED = new Set(['mosaic', 'halftone', 'stipple', 'spike', 'ascii']);

// 매 프레임 t로 재생성하는 필터 (cells 없음)
export const TIME_BASED = new Set(['wave', 'glitch']);

export function applyFilter(name, srcCanvas, opts) {
  const f = FILTERS[name];
  if (!f) {
    console.warn(`[filters] unknown filter: ${name}`);
    return { canvas: srcCanvas, cells: [] };
  }
  const r = f.apply(srcCanvas, opts);
  if (r instanceof HTMLCanvasElement) return { canvas: r, cells: [] };
  return r;
}

// animated 단계: 필터별 고유 모션. 정의 안 됐으면 false 반환 → 호출자가 fallback 처리.
export function animateFilter(name, ctx, cells, t, srcCanvas, opts) {
  const f = FILTERS[name];
  if (!f || typeof f.animate !== 'function') return false;
  f.animate(ctx, cells, t, srcCanvas, opts);
  return true;
}
