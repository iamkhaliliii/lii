import type { LearningCard, QuizQuestion } from "@/types/learning-hack";
import { getAllCards, getCardsByLevel, getCardsByUnit } from "@/data/learning-hack";

/* ── Card access ── */

export function getAllFlashcardItems(): LearningCard[] {
  return getAllCards();
}

export function getItemsByLevel(level: 1 | 2 | 3 | 4): LearningCard[] {
  return getCardsByLevel(level);
}

export function getItemsByUnit(unitId: number): LearningCard[] {
  return getCardsByUnit(unitId);
}

/* ── Quiz generators ── */

export function generateMultipleChoice(
  cards: LearningCard[],
  direction: "en_to_fa" | "fa_to_en" = "en_to_fa",
  count: number = 10
): QuizQuestion[] {
  if (cards.length < 4) return [];
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, cards.length));

  return selected.map((card) => {
    const isEnToFa = direction === "en_to_fa";
    const correct = isEnToFa ? card.fa : card.en;
    const prompt = isEnToFa ? card.en : card.fa;

    const distractors = cards
      .filter((c) => c.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => (isEnToFa ? c.fa : c.en));

    const options = [correct, ...distractors].sort(() => Math.random() - 0.5);

    return {
      id: `q-${card.id}`,
      type: "multiple_choice" as const,
      prompt,
      promptLang: isEnToFa ? ("en" as const) : ("fa" as const),
      correctAnswer: correct,
      options,
      sourceItemId: card.id,
    };
  });
}

export function generateVerbMatchQuiz(count: number = 10): QuizQuestion[] {
  const verbCards = getAllCards().filter((c) => c.type === "verb_upgrade");
  if (verbCards.length < 4) return [];
  const shuffled = [...verbCards].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, verbCards.length));

  return selected.map((card) => {
    const distractors = verbCards
      .filter((d) => d.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((d) => d.en);

    const options = [card.en, ...distractors].sort(() => Math.random() - 0.5);

    return {
      id: `vq-${card.id}`,
      type: "verb_match" as const,
      prompt: card.fa,
      promptLang: "fa" as const,
      correctAnswer: card.en,
      options,
      sourceItemId: card.id,
    };
  });
}

export function generateFillBlankQuiz(count: number = 10): QuizQuestion[] {
  const candidates = getAllCards().filter((c) => c.highlight_en);
  if (candidates.length < 4) return [];

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, candidates.length));

  return selected.map((card) => {
    const blank = card.highlight_en!;
    const prompt = card.en.replace(blank, "______");

    const distractors = candidates
      .filter((c) => c.id !== card.id && c.highlight_en !== blank)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.highlight_en!);

    while (distractors.length < 3) distractors.push("______");

    const options = [blank, ...distractors].sort(() => Math.random() - 0.5);

    return {
      id: `fb-${card.id}`,
      type: "fill_blank" as const,
      prompt,
      promptLang: "en" as const,
      correctAnswer: blank,
      options,
      sourceItemId: card.id,
    };
  });
}
