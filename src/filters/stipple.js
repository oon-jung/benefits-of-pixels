// 점묘 — 어두운 영역일수록 밀도 ↑. 위치를 cells로 저장 → 일관된 출렁임.
export function apply(srcCanvas, opts = {}) {
  const stride = opts.stride || 3;
  const intensity = opts.intensity ?? 0.9;
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const sctx = srcCanvas.getContext('2d');
  const octx = out.getContext('2d');
  const { data } = sctx.getImageData(0, 0, W, H);
  const cells = [];

  for (let y = 0; y < H; y += stride) {
    for (let x = 0; x < W; x += stride) {
      const i = (y * W + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 240 && g > 240 && b > 240) continue;
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const p = (1 - lum) * intensity + 0.1;
      if (Math.random() > p) continue;
      const rad = 0.5 + Math.random() * 0.9;
      const jx = Math.random() * stride;
      const jy = Math.random() * stride;
      const color = `rgb(${r},${g},${b})`;
      octx.fillStyle = color;
      octx.beginPath();
      octx.arc(x + jx, y + jy, rad, 0, Math.PI * 2);
      octx.fill();
      cells.push({ shape: 'circle', cx: x + jx, cy: y + jy, r: rad, color });
    }
  }
  return { canvas: out, cells };
}

// 랜덤 정전기 — 매 프레임 무작위로 60% 점만 ON. 위치는 고정. 화이트 노이즈 느낌.
export function animate(ctx, cells, _t) {
  for (const c of cells) {
    if (Math.random() > 0.6) continue;
    const ax = c._anchorX || c.cx;
    const ay = c._anchorY || c.cy;
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(ax, ay, c.r, 0, Math.PI * 2);
    ctx.fill();
  }
}
