// 명도→반지름 컬러 도트.
export function apply(srcCanvas, opts = {}) {
  const cellSize = opts.cellSize || 6;
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const sctx = srcCanvas.getContext('2d');
  const octx = out.getContext('2d');
  const { data } = sctx.getImageData(0, 0, W, H);
  const cells = [];

  const half = cellSize / 2;
  for (let y = 0; y < H; y += cellSize) {
    for (let x = 0; x < W; x += cellSize) {
      const cx = Math.min((x + half) | 0, W - 1);
      const cy = Math.min((y + half) | 0, H - 1);
      const i = (cy * W + cx) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 240 && g > 240 && b > 240) continue;
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const radius = (1 - lum) * half * 1.05;
      if (radius < 0.4) continue;
      const color = `rgb(${r},${g},${b})`;
      octx.fillStyle = color;
      octx.beginPath();
      octx.arc(x + half, y + half, radius, 0, Math.PI * 2);
      octx.fill();
      cells.push({ shape: 'circle', cx: x + half, cy: y + half, r: radius, color });
    }
  }
  return { canvas: out, cells };
}

// 싱크로 호흡 — 모든 도트가 동시에 같은 박자로 inhale/exhale.
export function animate(ctx, cells, t) {
  const ts = t * 0.001;
  // 모든 셀이 동일 위상 → 통합된 호흡감
  const scale = 1 + 0.55 * Math.sin(ts * 2.0);
  for (const c of cells) {
    const r = Math.max(0.3, c.r * scale);
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(c._anchorX || c.cx, c._anchorY || c.cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
