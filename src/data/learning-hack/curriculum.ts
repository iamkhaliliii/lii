import type { LearningLevel, LearningUnit, LearningCard } from "@/types/learning-hack";
import { LEVEL_1_UNITS } from "./units/level-1-foundation";
import { LEVEL_2_UNITS } from "./units/level-2-professional";
import { LEVEL_3_UNITS } from "./units/level-3-advanced";
import { LEVEL_4_UNITS } from "./units/level-4-mastery";

export const LEVELS: LearningLevel[] = [
  {
    level: 1,
    title_en: "Foundation",
    title_fa: "پایه",
    units: LEVEL_1_UNITS,
  },
  {
    level: 2,
    title_en: "Professional Communication",
    title_fa: "ارتباط حرفه‌ای",
    units: LEVEL_2_UNITS,
  },
  {
    level: 3,
    title_en: "Advanced Workplace",
    title_fa: "محیط کار پیشرفته",
    units: LEVEL_3_UNITS,
  },
  {
    level: 4,
    title_en: "Mastery",
    title_fa: "تسلط",
    units: LEVEL_4_UNITS,
  },
];

export function getAllUnits(): LearningUnit[] {
  return LEVELS.flatMap((l) => l.units);
}

export function getAllCards(): LearningCard[] {
  return getAllUnits().flatMap((u) => u.cards);
}

export function getUnitsByLevel(level: 1 | 2 | 3 | 4): LearningUnit[] {
  return LEVELS.find((l) => l.level === level)?.units ?? [];
}

export function getCardsByUnit(unitId: number): LearningCard[] {
  return getAllUnits().find((u) => u.id === unitId)?.cards ?? [];
}

export function getCardsByLevel(level: 1 | 2 | 3 | 4): LearningCard[] {
  return getUnitsByLevel(level).flatMap((u) => u.cards);
}

export const TOTAL_CARDS = 500;
