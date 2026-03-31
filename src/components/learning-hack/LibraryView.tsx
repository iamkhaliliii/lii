"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronRight,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVELS } from "@/data/learning-hack";
import type { LearningCard, CardType } from "@/types/learning-hack";
import { toggleBookmark, getBookmarkedIds } from "@/lib/learning-hack-srs";
import TtsButton from "./TtsButton";

function CopyMini({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted/40 transition-all hover:bg-accent hover:text-foreground active:scale-[0.98]"
    >
      {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function BookmarkBtn({
  itemId,
  cardType,
  bookmarked,
  onToggle,
}: {
  itemId: string;
  cardType: CardType;
  bookmarked: boolean;
  onToggle: (id: string, next: boolean) => void;
}) {
  const handleClick = useCallback(async () => {
    const next = await toggleBookmark(itemId, cardType);
    onToggle(itemId, next);
  }, [itemId, cardType, onToggle]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "rounded-md p-1 transition-all hover:bg-accent active:scale-90",
        bookmarked ? "text-warning" : "text-muted/30 hover:text-muted/60"
      )}
      title={bookmarked ? "Remove bookmark" : "Bookmark"}
    >
      <Bookmark size={12} fill={bookmarked ? "currentColor" : "none"} />
    </button>
  );
}

const LEVEL_COLORS: Record<number, string> = {
  1: "border-blue-500/30 bg-blue-500/5",
  2: "border-emerald-500/30 bg-emerald-500/5",
  3: "border-amber-500/30 bg-amber-500/5",
  4: "border-purple-500/30 bg-purple-500/5",
};

const LEVEL_BADGE: Record<number, string> = {
  1: "bg-blue-500/10 text-blue-600",
  2: "bg-emerald-500/10 text-emerald-600",
  3: "bg-amber-500/10 text-amber-600",
  4: "bg-purple-500/10 text-purple-600",
};

function HighlightText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-warning/25 px-0.5 text-foreground">
        {text.slice(idx, idx + highlight.length)}
      </mark>
      {text.slice(idx + highlight.length)}
    </>
  );
}

export default function LibraryView() {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(1);
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const query = q.trim().toLowerCase();

  useEffect(() => {
    getBookmarkedIds().then(setBookmarks);
  }, []);

  const handleToggleBookmark = useCallback((id: string, next: boolean) => {
    setBookmarks((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
  }, []);

  const filteredLevels = useMemo(() => {
    if (!query) return LEVELS;

    return LEVELS.map((lvl) => ({
      ...lvl,
      units: lvl.units.map((u) => ({
        ...u,
        cards: u.cards.filter(
          (c) =>
            c.en.toLowerCase().includes(query) ||
            c.fa.includes(query) ||
            c.context.toLowerCase().includes(query) ||
            (c.highlight_en?.toLowerCase().includes(query) ?? false)
        ),
      })).filter((u) => u.cards.length > 0),
    })).filter((lvl) => lvl.units.length > 0);
  }, [query]);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/50"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search cards..."
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
          aria-label="Search"
        />
      </div>

      {/* Levels */}
      <div className="space-y-4">
        {filteredLevels.map((lvl) => {
          const isLevelOpen = expandedLevel === lvl.level || !!query;
          const totalCards = lvl.units.reduce((acc, u) => acc + u.cards.length, 0);

          return (
            <div key={lvl.level} className={cn("rounded-2xl border", LEVEL_COLORS[lvl.level] ?? "border-border/60 bg-card")}>
              {/* Level header */}
              <button
                type="button"
                onClick={() => setExpandedLevel(isLevelOpen && !query ? null : lvl.level)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-accent/10"
              >
                {isLevelOpen ? (
                  <ChevronDown size={14} className="shrink-0 text-muted/40" />
                ) : (
                  <ChevronRight size={14} className="shrink-0 text-muted/40" />
                )}
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold", LEVEL_BADGE[lvl.level] ?? "bg-accent text-muted")}>
                  {lvl.level}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{lvl.title_en}</p>
                  <p className="text-[11px] text-muted/60" dir="rtl">{lvl.title_fa}</p>
                </div>
                <span className="shrink-0 rounded-full bg-accent/80 px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted/50">
                  {totalCards} cards
                </span>
              </button>

              {/* Units */}
              {isLevelOpen && (
                <div className="border-t border-border/30 px-3 pb-3">
                  {lvl.units.map((unit) => {
                    const isUnitOpen = expandedUnit === unit.id || !!query;

                    return (
                      <div key={unit.id} className="mt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedUnit(isUnitOpen && !query ? null : unit.id)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent/30"
                        >
                          {isUnitOpen ? (
                            <ChevronDown size={12} className="shrink-0 text-muted/30" />
                          ) : (
                            <ChevronRight size={12} className="shrink-0 text-muted/30" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-foreground/85">
                              Unit {unit.id}: {unit.title_en}
                            </span>
                            <span className="ml-2 text-[10px] text-muted/50" dir="rtl">
                              {unit.title_fa}
                            </span>
                          </div>
                          <span className="text-[10px] tabular-nums text-muted/40">
                            {unit.cards.length}
                          </span>
                        </button>

                        {isUnitOpen && (
                          <div className="ml-6 mt-1 space-y-0 divide-y divide-border/20">
                            {unit.cards.map((card) => (
                              <CardRow
                                key={card.id}
                                card={card}
                                bookmarked={bookmarks.has(card.id)}
                                onToggleBookmark={handleToggleBookmark}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredLevels.length === 0 && (
          <p className="py-10 text-center text-sm text-muted/60">
            No cards match your search.
          </p>
        )}
      </div>
    </div>
  );
}

function CardRow({
  card,
  bookmarked,
  onToggleBookmark,
}: {
  card: LearningCard;
  bookmarked: boolean;
  onToggleBookmark: (id: string, next: boolean) => void;
}) {
  return (
    <div className="py-3 first:pt-2 last:pb-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <BookmarkBtn
            itemId={card.id}
            cardType={card.type}
            bookmarked={bookmarked}
            onToggle={onToggleBookmark}
          />
          <TtsButton text={card.en} size={12} />
          <span className="rounded bg-accent/60 px-1.5 py-0.5 text-[9px] text-muted/50 capitalize">
            {card.type.replace(/_/g, " ")}
          </span>
          <span className="rounded bg-accent/40 px-1.5 py-0.5 text-[9px] text-muted/40">
            {card.context}
          </span>
        </div>
        <CopyMini text={`${card.en}\n\n${card.fa}`} />
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground">
        <HighlightText text={card.en} highlight={card.highlight_en} />
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted/70" dir="rtl">
        {card.fa}
      </p>
      {card.grammar_note && (
        <p className="mt-1 text-[10px] italic text-muted/45">{card.grammar_note}</p>
      )}
      {card.tip_fa && (
        <p className="mt-1 text-[10px] text-muted/45" dir="rtl">💡 {card.tip_fa}</p>
      )}
    </div>
  );
}
