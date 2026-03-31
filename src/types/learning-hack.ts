/* ─── Curriculum types ─── */

export type CardType = "sentence" | "idiom" | "vocab" | "verb_upgrade" | "pattern";

export type LearningCard = {
  id: string;
  en: string;
  fa: string;
  highlight_en?: string;
  context: string;
  unit: number;
  level: 1 | 2 | 3 | 4;
  type: CardType;
  grammar_note?: string;
  tip_fa?: string;
};

export type LearningUnit = {
  id: number;
  level: 1 | 2 | 3 | 4;
  title_en: string;
  title_fa: string;
  description: string;
  cards: LearningCard[];
};

export type LearningLevel = {
  level: 1 | 2 | 3 | 4;
  title_en: string;
  title_fa: string;
  units: LearningUnit[];
};

/* ─── SRS types ─── */

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export type SRSRecord = {
  itemId: string;
  cardType: CardType;
  box: LeitnerBox;
  lastReviewed: number;
  nextReview: number;
  correctCount: number;
  incorrectCount: number;
  bookmarked: boolean;
};

export type SRSRating = "again" | "hard" | "good" | "easy";

export type DailyLog = {
  date: string;
  cardsReviewed: number;
  correctCount: number;
  incorrectCount: number;
};

export type QuizQuestionType = "multiple_choice" | "fill_blank" | "verb_match";

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  promptLang: "en" | "fa";
  correctAnswer: string;
  options: string[];
  sourceItemId: string;
};

export type UserProgress = {
  totalItems: number;
  masteredCount: number;
  learningCount: number;
  newCount: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  levelBreakdown: Record<number, { total: number; mastered: number; learning: number }>;
};
