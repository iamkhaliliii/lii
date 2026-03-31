"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Dices,
  BookType,
  PenLine,
} from "lucide-react";
import { cn, haptic } from "@/lib/utils";
import type { QuizQuestion } from "@/types/learning-hack";
import {
  generateMultipleChoice,
  generateVerbMatchQuiz,
  generateFillBlankQuiz,
  getAllFlashcardItems,
} from "@/lib/learning-hack-adapter";
import { rateCard } from "@/lib/learning-hack-srs";
import { getAllCards } from "@/data/learning-hack";

type QuizType = "multiple_choice" | "verb_match" | "fill_blank" | "mixed";
type Answer = { questionId: string; selected: string; correct: boolean };

const QUIZ_TYPES: { id: QuizType; label: string; icon: React.ReactNode }[] = [
  { id: "mixed", label: "Mixed", icon: <Dices size={14} /> },
  { id: "multiple_choice", label: "Translate", icon: <BookType size={14} /> },
  { id: "verb_match", label: "Power Verbs", icon: <ArrowRight size={14} /> },
  { id: "fill_blank", label: "Fill Blank", icon: <PenLine size={14} /> },
];

function buildQuestions(type: QuizType): QuizQuestion[] {
  const items = getAllFlashcardItems();
  if (type === "multiple_choice") return generateMultipleChoice(items, "en_to_fa", 10);
  if (type === "verb_match") return generateVerbMatchQuiz(10);
  if (type === "fill_blank") return generateFillBlankQuiz(10);
  const mc = generateMultipleChoice(items, "en_to_fa", 4);
  const vm = generateVerbMatchQuiz(3);
  const fb = generateFillBlankQuiz(3);
  return [...mc, ...vm, ...fb].sort(() => Math.random() - 0.5);
}

export default function QuizMode() {
  const [quizType, setQuizType] = useState<QuizType>("mixed");
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    buildQuestions("mixed")
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [quizDone, setQuizDone] = useState(false);

  const current = questions[currentIdx] ?? null;

  const handleSelect = useCallback(
    async (option: string) => {
      if (selected) return;
      if (!current) return;
      haptic();
      const correct = option === current.correctAnswer;
      setSelected(option);
      setShowResult(true);
      setAnswers((prev) => [
        ...prev,
        { questionId: current.id, selected: option, correct },
      ]);

      const card = getAllCards().find((c) => c.id === current.sourceItemId);
      if (card) {
        await rateCard(card.id, card.type, correct ? "good" : "again");
      }
    },
    [selected, current]
  );

  const handleNext = useCallback(() => {
    setSelected(null);
    setShowResult(false);
    if (currentIdx + 1 >= questions.length) {
      setQuizDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, questions.length]);

  const handleNewQuiz = useCallback((type: QuizType) => {
    setQuizType(type);
    setQuestions(buildQuestions(type));
    setCurrentIdx(0);
    setSelected(null);
    setShowResult(false);
    setAnswers([]);
    setQuizDone(false);
  }, []);

  const correctCount = answers.filter((a) => a.correct).length;
  const accuracy =
    answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  if (quizDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="flex flex-col items-center py-10 text-center">
          <div
            className={cn(
              "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
              accuracy >= 70 ? "bg-success/10" : "bg-warning/10"
            )}
          >
            <span className="text-2xl">{accuracy >= 70 ? "\u{1F389}" : "\u{1F4AA}"}</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">Quiz Complete!</h3>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
            {accuracy}%
          </p>
          <p className="mt-1 text-sm text-muted">
            {correctCount}/{answers.length} correct
          </p>
          <button
            type="button"
            onClick={() => handleNewQuiz(quizType)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <RotateCcw size={14} />
            New Quiz
          </button>
        </div>

        {answers.some((a) => !a.correct) && (
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Review Mistakes
            </h4>
            <div className="space-y-3">
              {answers
                .filter((a) => !a.correct)
                .map((a) => {
                  const q = questions.find((qq) => qq.id === a.questionId);
                  if (!q) return null;
                  return (
                    <div
                      key={a.questionId}
                      className="rounded-xl border border-danger/20 bg-danger-light p-3"
                    >
                      <p className="text-xs text-muted">{q.prompt}</p>
                      <p className="mt-1 text-xs">
                        <span className="text-danger line-through">
                          {a.selected}
                        </span>{" "}
                        <span className="font-medium text-success">
                          → {q.correctAnswer}
                        </span>
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {QUIZ_TYPES.map((qt) => (
          <button
            key={qt.id}
            type="button"
            onClick={() => handleNewQuiz(qt.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              quizType === qt.id
                ? "bg-primary text-background"
                : "bg-accent text-muted hover:text-foreground"
            )}
          >
            {qt.icon}
            {qt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{
              width: `${((currentIdx + 1) / questions.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted">
          {currentIdx + 1}/{questions.length}
        </span>
        {answers.length > 0 && (
          <span className="shrink-0 text-xs tabular-nums text-success">
            {accuracy}%
          </span>
        )}
      </div>

      {current && (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <span className="mb-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                {current.type.replace(/_/g, " ")}
              </span>
              <p
                className="mt-3 text-base font-medium leading-relaxed text-foreground"
                dir={current.promptLang === "fa" ? "rtl" : "ltr"}
              >
                {current.prompt}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {current.options.map((opt, i) => {
                const isSelected = selected === opt;
                const isCorrect = opt === current.correctAnswer;
                let optCls = "border-border/60 bg-card hover:border-primary/30";
                if (showResult) {
                  if (isCorrect)
                    optCls = "border-success/50 bg-success-light";
                  else if (isSelected && !isCorrect)
                    optCls = "border-danger/50 bg-danger-light";
                  else optCls = "border-border/40 bg-card opacity-50";
                }

                return (
                  <button
                    key={`${opt}-${i}`}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    disabled={!!selected}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3.5 text-left text-[13px] transition-all press md:p-4 md:text-sm",
                      optCls
                    )}
                    dir={current.promptLang === "en" ? "rtl" : "ltr"}
                  >
                    {showResult && isCorrect && (
                      <CheckCircle2 size={16} className="shrink-0 text-success" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle size={16} className="shrink-0 text-danger" />
                    )}
                    <span className="min-w-0 flex-1 leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  {currentIdx + 1 >= questions.length ? "See Results" : "Next"}
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {questions.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted">
            Not enough items for this quiz type.
          </p>
          <button
            type="button"
            onClick={() => handleNewQuiz("mixed")}
            className="mt-3 text-xs font-medium text-primary hover:underline"
          >
            Try mixed quiz
          </button>
        </div>
      )}
    </div>
  );
}
