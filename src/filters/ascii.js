// 명도→문자 매핑. char cells.
const DEFAULT_RAMP = ' .:;+=xX$&#@';

export function apply(srcCanvas, opts = {}) {
  const cellW = opts.cellW || 6;
  const cellH = opts.cellH || 8;
  const ramp = opts.ramp || DEFAULT_RAMP;
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const sctx = srcCanvas.getContext('2d');
  const octx = out.getContext('2d');
  const font = `${cellH}px monospace`;
  octx.font = font;
  octx.textBaseline = 'top';
  const { data } = sctx.getImageData(0, 0, W, H);
  const cells = [];

  for (let y = 0; y < H; y += cellH) {
    for (let x = 0; x < W; x += cellW) {
      const cx = Math.min((x + cellW / 2) | 0, W - 1);
      const cy = Math.min((y + cellH / 2) | 0, H - 1);
      const i = (cy * W + cx) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 240 && g > 240 && b > 240) continue;
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const idx = Math.min(ramp.length - 1, Math.floor((1 - lum) * ramp.length));
      const ch = ramp[idx];
      const color = `rgb(${r},${g},${b})`;
      octx.fillStyle = color;
      octx.fillText(ch, x, y);
      cells.push({ shape: 'char', x, y, ch, color, font, _baseIdx: idx });
    }
  }
  return { canvas: out, cells };
}

// 타이핑 스크롤 — 모든 문자가 빠르게 ramp 위에서 cycle, 가끔 무작위 변형.
export function animate(ctx, cells, t, _src, opts = {}) {
  const ramp = opts.ramp || DEFAULT_RAMP;
  const ts = t * 0.001;
  // 전역 타이핑 위상 — 한 박자에 ramp가 우르르 한 칸씩 이동
  const globalShift = Math.floor(ts * 6) % ramp.length;
  let lastFont = null;
  for (const c of cells) {
    if (c.font !== lastFont) {
      ctx.font = c.font;
      ctx.textBaseline = 'top';
      lastFont = c.font;
    }
    const baseIdx = c._baseIdx ?? ramp.indexOf(c.ch);
    let idx;
    // 5% 확률로 무작위 변형 (글리치)
    if (Math.random() < 0.05) {
      idx = Math.floor(Math.random() * ramp.length);
    } else {
      idx = (baseIdx + globalShift) % ramp.length;
    }
    ctx.fillStyle = c.color;
    ctx.fillText(ramp[idx], c.x, c.y);
  }
}
