/** Pure geometry for the Progress calorie chart and macro donut (no React). */

export interface BarSlot {
  /** Left edge of the bar. */
  x: number;
  width: number;
  /** Horizontal center of the bar (for labels and the tooltip). */
  center: number;
  /** Left edge and width of the tappable column around the bar (bar + half the gap each side). */
  hitX: number;
  hitWidth: number;
}

/**
 * Splits `width` into `count` equal bars with `gap` between them and `padding` at both ends
 * (CSS grid `repeat(n, 1fr)` with `gap` and side padding, as in Progress.html).
 */
export function barSlots(count: number, width: number, gap: number, padding: number): BarSlot[] {
  if (count <= 0 || width <= 0) return [];
  const inner = Math.max(0, width - padding * 2 - gap * (count - 1));
  const barWidth = inner / count;
  return Array.from({ length: count }, (_, i) => {
    const x = padding + i * (barWidth + gap);
    const hitX = i === 0 ? 0 : x - gap / 2;
    const hitEnd = i === count - 1 ? width : x + barWidth + gap / 2;
    return { x, width: barWidth, center: x + barWidth / 2, hitX, hitWidth: hitEnd - hitX };
  });
}

/** Bar height for `value` on an axis from 0 to `max` drawn `height` high (clamped to the chart). */
export function barHeight(value: number, max: number, height: number): number {
  if (max <= 0 || value <= 0 || !Number.isFinite(value)) return 0;
  return Math.min(height, (value / max) * height);
}

/** Axis values from `max` down to 0 every `step` (e.g. 3000, 2000, 1000, 0). */
export function axisTicks(max: number, step = 1000): number[] {
  if (max <= 0 || step <= 0) return [0];
  const ticks: number[] = [];
  for (let v = Math.floor(max / step) * step; v > 0; v -= step) ticks.push(v);
  ticks.push(0);
  return ticks;
}

/** Short axis label in thousands: 0 → "0", 1000 → "1k", 1500 → "1,5k" (Romanian decimal comma). */
export function axisLabel(value: number): string {
  if (value === 0) return '0';
  const thousands = Math.round((value / 1000) * 10) / 10;
  return `${String(thousands).replace('.', ',')}k`;
}

/**
 * SVG path for a bar rooted at `bottom`, `h` high, with rounded top corners `rTop` and bottom
 * corners `rBottom`. Radii shrink so thin or short bars stay valid shapes. Empty for h ≤ 0.
 */
export function barPath(
  x: number,
  bottom: number,
  w: number,
  h: number,
  rTop: number,
  rBottom: number,
): string {
  if (h <= 0 || w <= 0) return '';
  const top = Math.max(0, Math.min(rTop, w / 2, h / 2));
  const bot = Math.max(0, Math.min(rBottom, w / 2, h / 2));
  const y = bottom - h;
  const r = (n: number) => Math.round(n * 100) / 100;
  return [
    `M${r(x)} ${r(y + top)}`,
    `Q${r(x)} ${r(y)} ${r(x + top)} ${r(y)}`,
    `L${r(x + w - top)} ${r(y)}`,
    `Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + top)}`,
    `L${r(x + w)} ${r(bottom - bot)}`,
    `Q${r(x + w)} ${r(bottom)} ${r(x + w - bot)} ${r(bottom)}`,
    `L${r(x + bot)} ${r(bottom)}`,
    `Q${r(x)} ${r(bottom)} ${r(x)} ${r(bottom - bot)}`,
    'Z',
  ].join(' ');
}

/** Left offset that centers a box of `boxWidth` on `center`, kept within [-overhang, width + overhang]. */
export function clampedLeft(center: number, boxWidth: number, width: number, overhang = 0): number {
  const left = center - boxWidth / 2;
  const min = overhang > 0 ? -overhang : 0;
  const max = width + overhang - boxWidth;
  if (max < min) return min;
  return Math.min(max, Math.max(min, left));
}

/**
 * Month view shows day labels sparsely: day 1 and every 5th day, plus the current day. Sparse
 * labels closer than 3 days to the current day are dropped so they don't overlap it.
 */
export function showDayLabel(day: number, currentDay?: number): boolean {
  if (currentDay !== undefined) {
    if (day === currentDay) return true;
    if (Math.abs(day - currentDay) < 3) return false;
  }
  return day === 1 || day % 5 === 0;
}

export interface DonutArc {
  key: string;
  /** stroke-dasharray: visible length, then the full circumference. */
  dashArray: [number, number];
  /** stroke-dashoffset (negative = starts further clockwise). */
  dashOffset: number;
}

/**
 * Donut segments for a circle of radius `r` drawn with stroke dashes (start at 12 o'clock when the
 * circle is rotated −90°). Each segment's length is its share of the circumference minus `gap`;
 * empty segments are skipped. Shares are whole percents summing to 100 (from `macroShare`).
 */
export function donutArcs(
  shares: readonly { key: string; percent: number }[],
  r: number,
  gap: number,
): DonutArc[] {
  const circumference = 2 * Math.PI * r;
  const visible = shares.filter((s) => s.percent > 0);
  const gapEach = visible.length > 1 ? gap : 0;
  const arcs: DonutArc[] = [];
  let start = 0;
  for (const s of visible) {
    const length = (s.percent / 100) * circumference;
    arcs.push({
      key: s.key,
      dashArray: [Math.max(0, length - gapEach), circumference],
      dashOffset: start === 0 ? 0 : -start,
    });
    start += length;
  }
  return arcs;
}
