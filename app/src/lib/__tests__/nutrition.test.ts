import {
  bmr,
  calcTarget,
  macroGoals,
  nutrientsFor,
  progress,
  remaining,
  stepTarget,
  sumNutrients,
  type TargetInput,
} from '@/lib/nutrition';

const woman: TargetInput = {
  sex: 'female',
  age: 30,
  heightCm: 165,
  weightKg: 65,
  activity: 'light',
  goal: 'maintain',
};

describe('bmr (Mifflin–St Jeor)', () => {
  it('computes female and male BMR', () => {
    // 10*65 + 6.25*165 - 5*30 - 161 = 1370.25
    expect(bmr(woman)).toBeCloseTo(1370.25);
    expect(bmr({ ...woman, sex: 'male' })).toBeCloseTo(1536.25);
  });
});

describe('calcTarget', () => {
  it('applies activity and rounds to 50', () => {
    // 1370.25 * 1.375 = 1884.1 → 1900
    expect(calcTarget(woman)).toBe(1900);
  });
  it('applies goal adjustments', () => {
    // 1884.1 * 0.85 = 1601.5 → 1600
    expect(calcTarget({ ...woman, goal: 'lose' })).toBe(1600);
    // 1884.1 * 1.1 = 2072.5 → 2050
    expect(calcTarget({ ...woman, goal: 'gain' })).toBe(2050);
  });
  it('uses every activity factor', () => {
    expect(calcTarget({ ...woman, activity: 'sedentary' })).toBe(1650); // 1644.3
    expect(calcTarget({ ...woman, activity: 'moderate' })).toBe(2100); // 2123.9
    expect(calcTarget({ ...woman, activity: 'intense' })).toBe(2350); // 2363.7
  });
  it('never goes below 1.200 kcal', () => {
    expect(
      calcTarget({ ...woman, age: 80, heightCm: 145, weightKg: 40, activity: 'sedentary', goal: 'lose' }),
    ).toBe(1200);
  });
  it('never goes above 4.000 kcal', () => {
    expect(
      calcTarget({ sex: 'male', age: 18, heightCm: 210, weightKg: 150, activity: 'intense', goal: 'gain' }),
    ).toBe(4000);
  });
});

describe('stepTarget', () => {
  it('moves by 50 within bounds', () => {
    expect(stepTarget(1900, 1)).toBe(1950);
    expect(stepTarget(1900, -1)).toBe(1850);
    expect(stepTarget(1200, -1)).toBe(1200);
    expect(stepTarget(4000, 1)).toBe(4000);
  });
});

describe('macroGoals', () => {
  it('splits 30/45/25 into whole grams', () => {
    expect(macroGoals(2000)).toEqual({ protein: 150, carbs: 225, fat: 56 });
    expect(macroGoals(1850)).toEqual({ protein: 139, carbs: 208, fat: 51 });
  });
});

describe('remaining and progress', () => {
  it('is target − food + exercise', () => {
    expect(remaining(2000, 1250)).toBe(750);
    expect(remaining(2000, 1250, 300)).toBe(1050);
    expect(remaining(2000, 2300)).toBe(-300);
  });
  it('caps progress at 100 %', () => {
    expect(progress(2000, 500)).toBe(0.25);
    expect(progress(2000, 2600)).toBe(1);
    expect(progress(0, 100)).toBe(0);
  });
});

describe('portion math', () => {
  it('scales per-100 g values by grams', () => {
    expect(nutrientsFor({ kcal: 200, protein: 10, carbs: 20, fat: 5 }, 150)).toEqual({
      kcal: 300,
      protein: 15,
      carbs: 30,
      fat: 7.5,
    });
  });
  it('sums nutrients', () => {
    expect(
      sumNutrients([
        { kcal: 100, protein: 1, carbs: 2, fat: 3 },
        { kcal: 50, protein: 1, carbs: 1, fat: 1 },
      ]),
    ).toEqual({ kcal: 150, protein: 2, carbs: 3, fat: 4 });
  });
});
