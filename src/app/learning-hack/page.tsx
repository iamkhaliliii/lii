"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import {
  Lightbulb,
  LayoutDashboard,
  Layers,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Dashboard from "@/components/learning-hack/Dashboard";
import FlashcardDeck from "@/components/learning-hack/FlashcardDeck";
import LibraryView from "@/components/learning-hack/LibraryView";
import QuizMode from "@/components/learning-hack/QuizMode";

type Mode = "dashboard" | "flashcards" | "library" | "quiz";

const MODES: { id: Mode; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "quiz", label: "Quiz", icon: GraduationCap },
];

export default function LearningHackPage() {
  const [mode, setMode] = useState<Mode>("dashboard");

  const goFlashcards = useCallback(() => setMode("flashcards"), []);
  const goQuiz = useCallback(() => setMode("quiz"), []);

  return (
    <div className="flex h-full flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8">
              <Lightbulb size={15} className="text-primary/60" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-foreground">Learning Hack</h1>
              <p className="mt-0.5 text-sm text-muted">
                500 cards across 4 levels — master professional English for meetings, reviews, and async work.
              </p>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="mb-6 flex gap-1 rounded-xl bg-accent/60 p-1">
            {MODES.map(({ id, label, icon: Icon }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm",
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {mode === "dashboard" && (
                <Dashboard
                  onStartFlashcards={goFlashcards}
                  onStartQuiz={goQuiz}
                />
              )}
              {mode === "flashcards" && <FlashcardDeck />}
              {mode === "library" && <LibraryView />}
              {mode === "quiz" && <QuizMode />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
