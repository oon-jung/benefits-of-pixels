// sine 디스플레이스먼트. animated 단계는 t로 위상을 흘려서 진행감.
export function apply(srcCanvas, opts = {}) {
  const amp = opts.amp || 10;
  const freq = opts.freq || 0.06;
  const phase = (opts.t || 0) * 0.003;
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const octx = out.getContext('2d');
  octx.fillStyle = '#fff';
  octx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x++) {
    const dy = Math.sin(x * freq + phase) * amp;
    octx.drawImage(srcCanvas, x, 0, 1, H, x, dy, 1, H);
  }
  return { canvas: out, cells: [] };
}

// 거센 흐름 — 큰 진폭 + 빠른 위상 이동, 좌→우 흐름이 분명히 보임.
export function animate(ctx, _cells, t, srcCanvas) {
  const r = apply(srcCanvas, { t: t * 3.2, amp: 16, freq: 0.05 });
  ctx.drawImage(r.canvas, 0, 0);
}
