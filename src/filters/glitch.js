// 가로 슬라이스 + RGB shift. animated는 t 시드로 매 프레임 슬라이스 변경.
export function apply(srcCanvas, opts = {}) {
  const sliceH = opts.sliceH || 5;
  const rgbShift = opts.rgbShift || 4;
  const t = opts.t || 0;
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const octx = out.getContext('2d');

  octx.fillStyle = '#fff';
  octx.fillRect(0, 0, W, H);
  octx.drawImage(srcCanvas, 0, 0);

  // PRNG seeded by t로 깜빡임 (animated 단계에서 자연스러운 변화)
  let seed = (t / 80) | 0;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let y = 0; y < H; y += sliceH) {
    if (rand() < 0.35) {
      const dx = ((rand() - 0.5) * 28) | 0;
      const slice = document.createElement('canvas');
      slice.width = W;
      slice.height = sliceH;
      slice.getContext('2d').drawImage(srcCanvas, 0, y, W, sliceH, 0, 0, W, sliceH);
      octx.fillStyle = '#fff';
      octx.fillRect(0, y, W, sliceH);
      octx.drawImage(slice, dx, y);
    }
  }

  octx.globalCompositeOperation = 'lighten';
  octx.globalAlpha = 0.45;
  octx.drawImage(srcCanvas, -rgbShift, 0);
  octx.globalCompositeOperation = 'source-over';
  octx.globalAlpha = 1;

  return { canvas: out, cells: [] };
}

// 점프 글리치 — 매 프레임 슬라이스 빈도/오프셋 크게, 깜빡임 강도 ↑.
export function animate(ctx, _cells, t, srcCanvas) {
  const r = apply(srcCanvas, { t: t * 4.5, sliceH: 3, rgbShift: 8 });
  ctx.drawImage(r.canvas, 0, 0);
}
