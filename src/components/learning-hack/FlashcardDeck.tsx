"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RotateCcw,
  ArrowRight,
  ArrowLeftRight,
  Layers,
} from "lucide-react";
import { cn, haptic, hapticSuccess } from "@/lib/utils";
import type { SRSRating, LearningCard } from "@/types/learning-hack";
import FlashcardCard from "./FlashcardCard";
import { rateCard, getDueCards } from "@/lib/learning-hack-srs";
import { LEVELS, getAllCards } from "@/data/learning-hack";

type DeckMode = "due" | "all";

const RATING_BTNS: { id: SRSRating; label: string; cls: string }[] = [
  { id: "again", label: "Again", cls: "bg-danger/10 text-danger hover:bg-danger/20" },
  { id: "hard", label: "Hard", cls: "bg-warning/10 text-warning hover:bg-warning/20" },
  { id: "good", label: "Good", cls: "bg-success/10 text-success hover:bg-success/20" },
  { id: "easy", label: "Easy", cls: "bg-primary/10 text-primary hover:bg-primary/20" },
];

const LEVEL_FILTERS = [
  { id: 0 as const, label: "All" },
  { id: 1 as const, label: "L1" },
  { id: 2 as const, label: "L2" },
  { id: 3 as const, label: "L3" },
  { id: 4 as const, label: "L4" },
];

export default function FlashcardDeck() {
  const allItems = useMemo(() => getAllCards(), []);
  const [direction, setDirection] = useState<"en_to_fa" | "fa_to_en">("en_to_fa");
  const [levelFilter, setLevelFilter] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [unitFilter, setUnitFilter] = useState<number>(0);
  const [flipped, setFlipped] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [deckMode, setDeckMode] = useState<DeckMode>("all");
  const [dueIds, setDueIds] = useState<Set<string>>(new Set());
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const availableUnits = useMemo(() => {
    if (levelFilter === 0) return LEVELS.flatMap((l) => l.units);
    return LEVELS.find((l) => l.level === levelFilter)?.units ?? [];
  }, [levelFilter]);

  const deck = useMemo(() => {
    let items: LearningCard[] = allItems;
    if (levelFilter !== 0) {
      items = items.filter((c) => c.level === levelFilter);
    }
    if (unitFilter !== 0) {
      items = items.filter((c) => c.unit === unitFilter);
    }
    if (deckMode === "due" && dueIds.size > 0) {
      items = items.filter((c) => dueIds.has(c.id));
    }
    return items.sort(() => Math.random() - 0.5);
  }, [allItems, levelFilter, unitFilter, deckMode, dueIds]);

  useEffect(() => {
    getDueCards().then((due) => {
      setDueIds(new Set(due.map((d) => d.itemId)));
    });
  }, []);

  const currentCard = deck[currentIdx] ?? null;

  const handleRate = useCallback(
    async (rating: SRSRating) => {
      if (!currentCard) return;
      haptic();
      try {
        await rateCard(currentCard.id, currentCard.type, rating);
      } catch (err) {
        console.error("[SRS] rateCard failed:", err);
      }
      setFlipped(false);
      setSessionCount((c) => c + 1);

      if (currentIdx + 1 >= deck.length) {
        hapticSuccess();
        setSessionDone(true);
      } else {
        setTimeout(() => setCurrentIdx((i) => i + 1), 150);
      }
    },
    [currentCard, currentIdx, deck.length]
  );

  const handleRestart = useCallback(() => {
    setCurrentIdx(0);
    setFlipped(false);
    setSessionDone(false);
    setSessionCount(0);
  }, []);

  if (deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Layers size={32} className="mb-3 text-muted/30" />
        <p className="text-sm text-muted">No cards available for this filter.</p>
        <button
          type="button"
          onClick={() => {
            setLevelFilter(0);
            setUnitFilter(0);
          }}
          className="mt-3 text-xs font-medium text-primary hover:underline"
        >
          Show all cards
        </button>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <span className="text-2xl">&#10003;</span>
        </div>
        <h3 className="text-lg font-bold text-foreground">Session Complete!</h3>
        <p className="mt-1 text-sm text-muted">
          You reviewed <span className="font-semibold text-foreground">{sessionCount}</span> cards
        </p>
        <button
          type="button"
          onClick={handleRestart}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <RotateCcw size={14} />
          Start Again
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          {LEVEL_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setLevelFilter(f.id);
                setUnitFilter(0);
                setCurrentIdx(0);
                setFlipped(false);
                setSessionDone(false);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors press",
                levelFilter === f.id
                  ? "bg-primary text-background"
                  : "bg-accent text-muted hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}

          {availableUnits.length > 0 && levelFilter !== 0 && (
            <select
              value={unitFilter}
              onChange={(e) => {
                setUnitFilter(Number(e.target.value));
                setCurrentIdx(0);
                setFlipped(false);
                setSessionDone(false);
              }}
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground"
            >
              <option value={0}>All units</option>
              {availableUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  U{u.id}: {u.title_en}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={() => setDirection((d) => (d === "en_to_fa" ? "fa_to_en" : "en_to_fa"))}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground press"
        >
          <ArrowLeftRight size={12} />
          {direction === "en_to_fa" ? "EN → FA" : "FA → EN"}
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / deck.length) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted">
          {currentIdx + 1}/{deck.length}
        </span>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        {currentCard && (
          <motion.div
            key={currentCard.id + currentIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <FlashcardCard
              card={currentCard}
              direction={direction}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="flex justify-center gap-2 md:gap-2"
          >
            {RATING_BTNS.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate(btn.id);
                }}
                className={cn(
                  "relative z-10 rounded-xl px-4 py-3 text-[13px] font-semibold transition-all press md:rounded-lg md:px-4 md:py-2 md:text-sm md:font-medium",
                  btn.cls
                )}
              >
                {btn.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip */}
      {!flipped && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              if (currentIdx + 1 >= deck.length) {
                setSessionDone(true);
              } else {
                setCurrentIdx((i) => i + 1);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs text-muted/60 transition-colors hover:text-foreground press"
          >
            Skip <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
