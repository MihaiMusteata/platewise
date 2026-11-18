import { daySummary, greetingFor } from '@/lib/home';

const at = (hour: number, minute = 0) => new Date(2026, 10, 19, hour, minute);

describe('greetingFor', () => {
  it('follows the time of day', () => {
    expect(greetingFor(at(6))).toBe('morning');
    expect(greetingFor(at(11, 59))).toBe('morning');
    expect(greetingFor(at(12))).toBe('day');
    expect(greetingFor(at(17, 59))).toBe('day');
    expect(greetingFor(at(18))).toBe('evening');
    expect(greetingFor(at(0, 30))).toBe('evening');
    expect(greetingFor(at(5))).toBe('morning');
  });
});

describe('daySummary', () => {
  it('computes remaining and percent under the target', () => {
    expect(daySummary(2000, 842.4)).toEqual({
      food: 842,
      remaining: 1158,
      over: false,
      progress: 0.421,
      percent: 42,
    });
  });

  it('reports kcal above the target and caps progress at 100 %', () => {
    expect(daySummary(2000, 2150)).toMatchObject({ remaining: 150, over: true, progress: 1, percent: 100 });
  });

  it('is exactly on target without being over', () => {
    expect(daySummary(2000, 2000)).toMatchObject({ remaining: 0, over: false, percent: 100 });
  });
});
