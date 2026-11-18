export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Sex = 'female' | 'male';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'intense';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface UserProfile {
  isAdult: boolean;
  age: number;
  heightCm: number;
  weightKg: number;
  sex: Sex;
  activity: Activity;
  goal: Goal;
  dailyTargetKcal: number;
  weightTracking: boolean;
  mealReminders: boolean;
  paused: boolean;
}

export interface Nutrients {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Food {
  id: string; // uuid, or `off:<barcode>`
  name: string;
  brand?: string;
  barcode?: string;
  per100g: Nutrients;
  servingName?: string; // "bol", "porție", "cană"
  servingGrams?: number;
  source: 'off' | 'custom' | 'common';
}

export interface LogEntry {
  id: string;
  date: string; // YYYY-MM-DD local
  meal: Meal;
  foodId: string;
  grams: number;
  createdAt: string;
}
