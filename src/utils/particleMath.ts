/**
 * Mathematical utilities for sampling heart contours, text bitmaps, and matrix drops.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Returns points along the mathematical heart curve.
 * Parametric equation:
 * x = 16 * sin^3(t)
 * y = -(13*cos(t) - 5*cos(2t) - 2*cos(3t) - cos(4t))
 */
export function getHeartOutlinePoints(
  count: number,
  centerX: number,
  centerY: number,
  scale: number
): Point[] {
  const points: Point[] = [];
  const step = (Math.PI * 2) / count;

  for (let i = 0; i < count; i++) {
    const t = i * step;
    const sinT = Math.sin(t);
    const x = 16 * Math.pow(sinT, 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

    points.push({
      x: centerX + x * scale,
      y: centerY + y * scale,
    });
  }

  return points;
}

/**
 * Generates points inside and along the heart for a rich glowing particle volume
 */
export function getHeartVolumePoints(
  totalCount: number,
  centerX: number,
  centerY: number,
  scale: number
): Point[] {
  const points: Point[] = [];
  // 60% of particles on outer boundary for crisp silhouette
  const outlineCount = Math.floor(totalCount * 0.65);
  points.push(...getHeartOutlinePoints(outlineCount, centerX, centerY, scale));

  // 35% particles scattered inside the heart interior for magical starry glow
  const interiorCount = totalCount - outlineCount;
  for (let i = 0; i < interiorCount; i++) {
    const t = Math.random() * Math.PI * 2;
    const innerFactor = Math.pow(Math.random(), 0.6) * 0.95; // bias toward edge
    const sinT = Math.sin(t);
    const x = 16 * Math.pow(sinT, 3) * innerFactor;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * innerFactor;

    points.push({
      x: centerX + x * scale,
      y: centerY + y * scale,
    });
  }

  return points;
}

/**
 * Normal vector at heart curve point (pointing outward from heart for ripples)
 */
export function getHeartNormal(t: number): { nx: number; ny: number } {
  // Tangent derivatives
  // dx/dt = 48 * sin^2(t) * cos(t)
  // dy/dt = -(-13*sin(t) + 10*sin(2t) + 6*sin(3t) + 4*sin(4t))
  const sinT = Math.sin(t);
  const cosT = Math.cos(t);
  const dx = 48 * Math.pow(sinT, 2) * cosT;
  const dy = (13 * sinT - 10 * Math.sin(2 * t) - 6 * Math.sin(3 * t) - 4 * Math.sin(4 * t));

  // Normal is perpendicular (-dy, dx) normalized
  const length = Math.hypot(-dy, dx) || 1;
  // Point outwards: check sign
  const nx = -dy / length;
  const ny = dx / length;

  return { nx, ny };
}

/**
 * Samples pixel points from rendered text on an offscreen canvas
 */
export function sampleTextPoints(
  text: string,
  width: number,
  height: number,
  fontSize: number,
  centerY?: number,
  densityStep: number = 3
): Point[] {
  const offscreen = document.createElement('canvas');
  // Use compact dimension around target area
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  const cy = centerY !== undefined ? centerY : height / 2;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Use rock-solid cross-platform sans-serif font stack
  ctx.font = `900 ${fontSize}px sans-serif, -apple-system, system-ui`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, cy);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const points: Point[] = [];

  // Bounding box optimization: only scan around the text vertical region
  const minY = Math.max(0, Math.floor(cy - fontSize * 1.1));
  const maxY = Math.min(height, Math.ceil(cy + fontSize * 1.1));

  for (let y = minY; y < maxY; y += densityStep) {
    for (let x = 0; x < width; x += densityStep) {
      const idx = (y * width + x) * 4;
      // Check brightness of RGB or alpha channel with lower threshold (covers anti-aliasing)
      const brightness = Math.max(data[idx], data[idx + 1], data[idx + 2]);
      if (brightness > 60 || data[idx + 3] > 60) {
        points.push({
          x: x + (Math.random() - 0.5) * 1.5,
          y: y + (Math.random() - 0.5) * 1.5,
        });
      }
    }
  }

  // Shuffle points to ensure particles don't all travel to identical orderly rows
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }

  return points;
}
