import {
  axisLabel,
  axisTicks,
  barHeight,
  barPath,
  barSlots,
  clampedLeft,
  donutArcs,
  showDayLabel,
} from '@/lib/chartGeometry';

describe('barSlots', () => {
  it('splits the width like a CSS grid with gap and side padding', () => {
    // Progress.html: 278 wide chart, padding 8, gap 16, 7 bars
    const slots = barSlots(7, 278, 16, 8);
    expect(slots).toHaveLength(7);
    expect(slots[0].x).toBe(8);
    expect(slots[0].width).toBeCloseTo((278 - 16 - 96) / 7);
    const last = slots[6];
    expect(last.x + last.width).toBeCloseTo(270);
    expect(slots[3].center).toBeCloseTo(139);
  });

  it('makes hit areas cover the whole width without overlap', () => {
    const slots = barSlots(5, 200, 10, 4);
    expect(slots[0].hitX).toBe(0);
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].hitX).toBeCloseTo(slots[i - 1].hitX + slots[i - 1].hitWidth);
    }
    expect(slots[4].hitX + slots[4].hitWidth).toBeCloseTo(200);
  });

  it('returns nothing before layout or without bars', () => {
    expect(barSlots(0, 100, 4, 0)).toEqual([]);
    expect(barSlots(7, 0, 4, 0)).toEqual([]);
  });
});

describe('barHeight', () => {
  it('scales to the axis and clamps', () => {
    expect(barHeight(1500, 3000, 120)).toBe(60);
    expect(barHeight(4000, 3000, 120)).toBe(120);
    expect(barHeight(0, 3000, 120)).toBe(0);
    expect(barHeight(-5, 3000, 120)).toBe(0);
    expect(barHeight(100, 0, 120)).toBe(0);
  });
});

describe('axis', () => {
  it('ticks every 1.000 from the top down to 0', () => {
    expect(axisTicks(3000)).toEqual([3000, 2000, 1000, 0]);
    expect(axisTicks(1000)).toEqual([1000, 0]);
    expect(axisTicks(0)).toEqual([0]);
  });

  it('labels in thousands like the design', () => {
    expect(axisLabel(0)).toBe('0');
    expect(axisLabel(3000)).toBe('3k');
    expect(axisLabel(1500)).toBe('1,5k');
  });
});

describe('barPath', () => {
  it('draws a closed path with rounded corners', () => {
    const d = barPath(0, 120, 24, 60, 8, 4);
    expect(d.startsWith('M0 68')).toBe(true);
    expect(d).toContain('Q0 60 8 60');
    expect(d.endsWith('Z')).toBe(true);
  });

  it('shrinks radii for thin and short bars', () => {
    const d = barPath(0, 10, 4, 2, 8, 4);
    // top radius limited to min(w/2, h/2) = 1
    expect(d.startsWith('M0 9')).toBe(true);
  });

  it('is empty for zero bars', () => {
    expect(barPath(0, 120, 24, 0, 8, 4)).toBe('');
  });
});

describe('clampedLeft', () => {
  it('centers and keeps the box inside the chart', () => {
    expect(clampedLeft(100, 40, 200)).toBe(80);
    expect(clampedLeft(5, 40, 200)).toBe(0);
    expect(clampedLeft(198, 40, 200, 4)).toBe(164);
  });
});

describe('showDayLabel', () => {
  it('labels day 1 and every 5th day', () => {
    const days = Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => showDayLabel(d));
    expect(days).toEqual([1, 5, 10, 15, 20, 25, 30]);
  });

  it('adds the current day and drops sparse labels next to it', () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1).filter((d) => showDayLabel(d, 19));
    expect(days).toEqual([1, 5, 10, 15, 19, 25, 30]);
  });
});

describe('donutArcs', () => {
  it('matches the design dashes (r 46, gap 3)', () => {
    const arcs = donutArcs(
      [
        { key: 'protein', percent: 29 },
        { key: 'carbs', percent: 48 },
        { key: 'fat', percent: 23 },
      ],
      46,
      3,
    );
    const c = 2 * Math.PI * 46;
    expect(arcs[0].dashArray[0]).toBeCloseTo(80.8, 1);
    expect(arcs[0].dashArray[1]).toBeCloseTo(c);
    expect(arcs[0].dashOffset).toBe(0);
    expect(arcs[1].dashArray[0]).toBeCloseTo(135.7, 1);
    expect(arcs[1].dashOffset).toBeCloseTo(-83.8, 1);
    expect(arcs[2].dashOffset).toBeCloseTo(-222.6, 1);
  });

  it('skips empty segments and drops the gap for a single one', () => {
    const arcs = donutArcs(
      [
        { key: 'protein', percent: 0 },
        { key: 'carbs', percent: 100 },
        { key: 'fat', percent: 0 },
      ],
      46,
      3,
    );
    expect(arcs).toHaveLength(1);
    expect(arcs[0].dashArray[0]).toBeCloseTo(2 * Math.PI * 46);
  });

  it('is empty when nothing is logged', () => {
    expect(donutArcs([{ key: 'protein', percent: 0 }], 46, 3)).toEqual([]);
  });
});
