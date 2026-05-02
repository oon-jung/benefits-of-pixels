// cells 배열을 sine 변위로 출렁이게 그리는 통합 모션.
// 모든 필터(셀 기반)에 같은 모션 적용.

export function setupLatent(cells) {
  for (const c of cells) {
    if (c._anchorX !== undefined) continue;
    if (c.shape === 'circle') {
      c._anchorX = c.cx;
      c._anchorY = c.cy;
    } else if (c.shape === 'polygon') {
      c._anchorPoints = c.points.map(p => [p[0], p[1]]);
      const ax = c.points.reduce((s, p) => s + p[0], 0) / c.points.length;
      const ay = c.points.reduce((s, p) => s + p[1], 0) / c.points.length;
      c._anchorX = ax;
      c._anchorY = ay;
    } else {
      c._anchorX = c.x;
      c._anchorY = c.y;
    }
    c._phase = (c._anchorX * 0.013 + c._anchorY * 0.017) % (Math.PI * 2);
  }
  return cells;
}

export function drawLatent(ctx, cells, t, opts = {}) {
  const dxAmp = opts.dxAmp ?? 6;
  const dyAmp = opts.dyAmp ?? 8;
  const ts = t * 0.001;

  let lastFont = null;
  for (const c of cells) {
    const dx = dxAmp * Math.sin(ts * 1.8 + c._phase + c._anchorY * 0.03);
    const dy = dyAmp * Math.cos(ts * 2.2 + c._phase + c._anchorX * 0.03);

    ctx.fillStyle = c.color;
    switch (c.shape) {
      case 'rect':
        ctx.fillRect(c.x + dx, c.y + dy, c.w, c.h);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(c._anchorX + dx, c._anchorY + dy, c.r, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'char':
        if (c.font !== lastFont) {
          ctx.font = c.font;
          ctx.textBaseline = 'top';
          lastFont = c.font;
        }
        ctx.fillText(c.ch, c.x + dx, c.y + dy);
        break;
      case 'polygon': {
        const pts = c._anchorPoints;
        ctx.beginPath();
        ctx.moveTo(pts[0][0] + dx, pts[0][1] + dy);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + dx, pts[i][1] + dy);
        ctx.closePath();
        ctx.fill();
        break;
      }
    }
  }
}
