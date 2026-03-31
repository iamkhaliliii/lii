"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { LearningCard } from "@/types/learning-hack";
import { cn } from "@/lib/utils";
import TtsButton from "./TtsButton";
import WordLookupPopup from "./WordLookupPopup";

type Props = {
  card: LearningCard;
  direction: "en_to_fa" | "fa_to_en";
  flipped: boolean;
  onFlip: () => void;
};

type WordLookup = {
  word: string;
  lang: "en" | "fa";
  x: number;
  y: number;
};

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-blue-500/10 text-blue-600",
  2: "bg-emerald-500/10 text-emerald-600",
  3: "bg-amber-500/10 text-amber-600",
  4: "bg-purple-500/10 text-purple-600",
};

export default function FlashcardCard({
  card,
  direction,
  flipped,
  onFlip,
}: Props) {
  const isEnToFa = direction === "en_to_fa";
  const [lookup, setLookup] = useState<WordLookup | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setLookup(null);
  }, [card.id, flipped]);

  const handleWordClick = useCallback(
    (word: string, lang: "en" | "fa", x: number, y: number) => {
      setLookup({ word, lang, x, y });
    },
    []
  );

  const handleCardClick = useCallback(() => {
    if (lookup) {
      setLookup(null);
    } else {
      onFlip();
    }
  }, [lookup, onFlip]);

  const frontText = isEnToFa ? card.en : card.fa;
  const frontLang: "en" | "fa" = isEnToFa ? "en" : "fa";
  const frontHighlight = isEnToFa ? card.highlight_en : undefined;
  const frontDir = isEnToFa ? "ltr" : "rtl";

  const backText = isEnToFa ? card.fa : card.en;
  const backLang: "en" | "fa" = isEnToFa ? "fa" : "en";
  const backDir = isEnToFa ? "rtl" : "ltr";

  return (
    <>
      <div
        className="perspective-[1200px] w-full cursor-pointer select-none"
        style={{ minHeight: 300 }}
        onClick={handleCardClick}
      >
        <motion.div
          className="relative w-full"
          style={{ minHeight: 300, transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Front ── */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card px-8 py-10 shadow-sm backface-hidden"
            dir={frontDir}
          >
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  LEVEL_COLORS[card.level] ?? "bg-accent text-muted"
                )}
              >
                L{card.level}
              </span>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-medium text-muted">
                {card.context}
              </span>
              <span className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px] text-muted/60 capitalize">
                {card.type.replace(/_/g, " ")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <TtsButton text={card.en} size={14} />
            </div>

            <p className="mt-3 text-center text-lg font-medium leading-relaxed text-foreground">
              <InteractiveText
                text={frontText}
                highlight={frontHighlight}
                lang={frontLang}
                onWordClick={handleWordClick}
              />
            </p>

            {card.grammar_note && !flipped && (
              <p className="mt-3 text-center text-[11px] italic text-muted/50">
                {card.grammar_note}
              </p>
            )}
            <p className="mt-6 text-[11px] text-muted/40">Tap to flip</p>
          </div>

          {/* ── Back ── */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card-elevated px-8 py-8 shadow-sm backface-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                {isEnToFa ? "فارسی" : "English"}
              </span>
              <TtsButton text={card.en} size={14} />
            </div>

            <p
              className={cn(
                "text-center text-lg font-medium leading-relaxed text-foreground",
                isEnToFa && "font-sans"
              )}
              dir={backDir}
            >
              <InteractiveText
                text={backText}
                lang={backLang}
                onWordClick={handleWordClick}
              />
            </p>

            {card.tip_fa && (
              <p className="mt-3 text-center text-xs text-muted/60" dir="rtl">
                💡 {card.tip_fa}
              </p>
            )}

            {card.grammar_note && (
              <p className="mt-2 text-center text-[11px] italic text-muted/50">
                {card.grammar_note}
              </p>
            )}

            <p className="mt-4 text-center text-[10px] text-muted/40">
              Unit {card.unit} · {card.context}
            </p>
          </div>
        </motion.div>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {lookup && (
              <WordLookupPopup
                word={lookup.word}
                language={lookup.lang}
                anchor={{ x: lookup.x, y: lookup.y }}
                onClose={() => setLookup(null)}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

/* ── Interactive word-by-word text ── */

function InteractiveText({
  text,
  highlight,
  lang,
  onWordClick,
}: {
  text: string;
  highlight?: string;
  lang: "en" | "fa";
  onWordClick: (word: string, lang: "en" | "fa", x: number, y: number) => void;
}) {
  const tokens: string[] = [];
  const regex = /(\S+|\s+)/g;
  let m;
  while ((m = regex.exec(text)) !== null) tokens.push(m[0]);

  const hlLower = highlight?.toLowerCase();
  const textLower = text.toLowerCase();
  const hlStart = hlLower ? textLower.indexOf(hlLower) : -1;
  const hlEnd =
    hlStart >= 0 && highlight ? hlStart + highlight.length : -1;

  let charPos = 0;

  return (
    <>
      {tokens.map((token, i) => {
        const tokenStart = charPos;
        charPos += token.length;

        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;

        const tokenEnd = tokenStart + token.length;
        const isHighlighted =
          hlStart >= 0 && tokenStart >= hlStart && tokenEnd <= hlEnd;

        return (
          <span
            key={i}
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              onWordClick(
                token,
                lang,
                rect.left + rect.width / 2,
                rect.bottom
              );
            }}
            className={cn(
              "cursor-pointer rounded-sm px-px transition-colors",
              "hover:bg-primary/10 active:bg-primary/15",
              isHighlighted && "bg-warning/25"
            )}
          >
            {token}
          </span>
        );
      })}
    </>
  );
}
