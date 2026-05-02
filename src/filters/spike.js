// 수직 슬라이스 + 톱니 가장자리. polygon cells.
export function apply(srcCanvas, opts = {}) {
  const stripW = opts.stripW || 6;
  const sawAmp = opts.sawAmp || 4;
  const W = srcCanvas.width;
  const H = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const sctx = srcCanvas.getContext('2d');
  const octx = out.getContext('2d');
  const { data } = sctx.getImageData(0, 0, W, H);
  const cells = [];

  for (let x = 0; x < W; x += stripW) {
    let r = 0, g = 0, b = 0, n = 0;
    let topY = H, botY = -1;
    for (let y = 0; y < H; y++) {
      let hasContent = false;
      for (let dx = 0; dx < stripW; dx++) {
        const xx = x + dx;
        if (xx >= W) break;
        const i = (y * W + xx) * 4;
        const rr = data[i], gg = data[i + 1], bb = data[i + 2];
        if (rr > 240 && gg > 240 && bb > 240) continue;
        r += rr; g += gg; b += bb; n++;
        hasContent = true;
      }
      if (hasContent) {
        if (y < topY) topY = y;
        if (y > botY) botY = y;
      }
    }
    if (n === 0 || botY < 0) continue;
    r = (r / n) | 0;
    g = (g / n) | 0;
    b = (b / n) | 0;
    const color = `rgb(${r},${g},${b})`;
    const midX = x + stripW / 2;
    const points = [
      [x, topY],
      [midX, topY - sawAmp],
      [x + stripW, topY],
      [x + stripW, botY],
      [midX, botY + sawAmp],
      [x, botY]
    ];
    octx.fillStyle = color;
    octx.beginPath();
    octx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) octx.lineTo(points[i][0], points[i][1]);
    octx.closePath();
    octx.fill();
    cells.push({ shape: 'polygon', points, color });
  }
  return { canvas: out, cells };
}

// EQ 사운드바 — 컬럼별 절대값 sine으로 위/아래 동시에 늘어남. 옆 컬럼끼리 위상 다르게.
export function animate(ctx, cells, t) {
  const ts = t * 0.001;
  for (const c of cells) {
    const pts = c._anchorPoints || c.points;
    // x 좌표로 컬럼 위상 결정 → 옆 컬럼이 한 박자씩 어긋남
    const colPhase = (pts[0][0]) * 0.05;
    // |sin| → 0~1, 항상 양수로 자람만 함
    const grow = 12 * Math.abs(Math.sin(ts * 3.2 + colPhase));
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1] - grow);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.lineTo(pts[3][0], pts[3][1]);
    ctx.lineTo(pts[4][0], pts[4][1] + grow);
    ctx.lineTo(pts[5][0], pts[5][1]);
    ctx.closePath();
    ctx.fill();
  }
}
