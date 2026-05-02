// 큰 정사각형 픽셀화. cells 반환 → animated 단계에서 출렁임에 사용.
export function apply(srcCanvas, opts = {}) {
  const cellSize = opts.cellSize || 8;
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const sctx = srcCanvas.getContext('2d');
  const octx = out.getContext('2d');
  const { data } = sctx.getImageData(0, 0, W, H);
  const cells = [];

  for (let y = 0; y < H; y += cellSize) {
    for (let x = 0; x < W; x += cellSize) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = 0; dy < cellSize; dy++) {
        for (let dx = 0; dx < cellSize; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= W || yy >= H) continue;
          const i = (yy * W + xx) * 4;
          const rr = data[i], gg = data[i + 1], bb = data[i + 2];
          if (rr > 240 && gg > 240 && bb > 240) continue;
          r += rr; g += gg; b += bb; n++;
        }
      }
      if (n === 0) continue;
      r = (r / n) | 0;
      g = (g / n) | 0;
      b = (b / n) | 0;
      const color = `rgb(${r},${g},${b})`;
      octx.fillStyle = color;
      octx.fillRect(x, y, cellSize, cellSize);
      cells.push({ shape: 'rect', x, y, w: cellSize, h: cellSize, color });
    }
  }
  return { canvas: out, cells };
}

// 수평 행 슬라이드 — 같은 y의 셀이 한 덩어리로 좌우 흐름. 행마다 방향 반대.
export function animate(ctx, cells, t) {
  const ts = t * 0.001;
  for (const c of cells) {
    // y 좌표로 행 인덱스 계산 → 행마다 위상/방향 다르게
    const row = (c.y / Math.max(1, c.h)) | 0;
    const rowDir = row % 2 === 0 ? 1 : -1;
    const dx = rowDir * 8 * Math.sin(ts * 1.4 + row * 0.6);
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x + dx, c.y, c.w, c.h);
  }
}
