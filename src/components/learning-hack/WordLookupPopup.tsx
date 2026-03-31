"use client";

import {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Volume2, Loader2, GripHorizontal } from "lucide-react";
import { getAllCards } from "@/data/learning-hack";
import { cn, haptic } from "@/lib/utils";
import {
  lookupWord,
  cleanWord,
  type WordLookupResult,
} from "@/lib/word-lookup";
import TtsButton from "./TtsButton";

type Props = {
  word: string;
  language: "en" | "fa";
  anchor: { x: number; y: number };
  onClose: () => void;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripPunctuation(s: string): string {
  return s.replace(/^[^\w\u0600-\u06FF]+|[^\w\u0600-\u06FF]+$/g, "");
}

function highlightInText(text: string, word: string): ReactNode {
  if (!word) return text;
  const escaped = escapeRegex(word);
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <mark
        key={i}
        className="rounded bg-warning/30 px-0.5 font-medium text-foreground"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

export default function WordLookupPopup({
  word,
  language,
  anchor,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const clean = stripPunctuation(word).toLowerCase();
  const isMobile = useIsMobile();

  const [apiData, setApiData] = useState<WordLookupResult | null>(null);
  const [loading, setLoading] = useState(language === "en");

  useEffect(() => {
    if (language !== "en" || !clean) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    lookupWord(clean).then((result) => {
      if (!cancelled) {
        setApiData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clean, language]);

  const { keyTermCards, exampleCards } = useMemo(() => {
    if (!clean) return { keyTermCards: [], exampleCards: [] };
    const all = getAllCards();

    if (language === "en") {
      const regex = new RegExp(`\\b${escapeRegex(clean)}\\b`, "i");
      const keyTerm = all.filter(
        (c) =>
          c.highlight_en &&
          stripPunctuation(c.highlight_en).toLowerCase() === clean
      );
      const keyIds = new Set(keyTerm.map((c) => c.id));
      const examples = all
        .filter((c) => !keyIds.has(c.id) && regex.test(c.en))
        .slice(0, 4);
      return { keyTermCards: keyTerm.slice(0, 2), exampleCards: examples };
    }

    const matches = all.filter((c) => c.fa.includes(clean)).slice(0, 5);
    return { keyTermCards: [], exampleCards: matches };
  }, [clean, language]);

  const playAudio = useCallback(() => {
    if (apiData?.dictionary?.audioUrl) {
      new Audio(apiData.dictionary.audioUrl).play().catch(() => {});
    }
  }, [apiData?.dictionary?.audioUrl]);

  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onClose, isMobile]);

  if (!clean) return null;

  const dict = apiData?.dictionary;
  const farsi = apiData?.farsiTranslation;
  const totalExamples = keyTermCards.length + exampleCards.length;

  const body = (
    <LookupBody
      loading={loading}
      dict={dict}
      farsi={farsi}
      keyTermCards={keyTermCards}
      exampleCards={exampleCards}
      totalExamples={totalExamples}
      clean={clean}
      language={language}
      word={word}
    />
  );

  if (isMobile) {
    return (
      <BottomSheet
        word={word}
        dict={dict}
        farsi={farsi}
        language={language}
        playAudio={playAudio}
        onClose={onClose}
      >
        {body}
      </BottomSheet>
    );
  }

  const POPUP_W = 320;
  const POPUP_MAX_H = 420;
  let left = anchor.x - POPUP_W / 2;
  let top = anchor.y + 10;

  if (typeof window !== "undefined") {
    if (left < 8) left = 8;
    if (left + POPUP_W > window.innerWidth - 8)
      left = window.innerWidth - POPUP_W - 8;
    if (top + POPUP_MAX_H > window.innerHeight - 8) {
      top = anchor.y - POPUP_MAX_H - 10;
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[100] overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl"
      style={{ left, top, width: POPUP_W, maxHeight: POPUP_MAX_H }}
      onClick={(e) => e.stopPropagation()}
    >
      <PopoverHeader
        word={word}
        dict={dict}
        farsi={farsi}
        language={language}
        playAudio={playAudio}
        onClose={onClose}
      />
      <div
        className="overflow-y-auto p-3 space-y-3"
        style={{ maxHeight: POPUP_MAX_H - 60 }}
      >
        {body}
      </div>
    </motion.div>
  );
}

/* ── Bottom sheet for mobile ── */

function BottomSheet({
  word,
  dict,
  farsi,
  language,
  playAudio,
  onClose,
  children,
}: {
  word: string;
  dict: WordLookupResult["dictionary"] | undefined;
  farsi: string | undefined;
  language: "en" | "fa";
  playAudio: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[99] bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        ref={sheetRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
          }
        }}
        className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border/60 bg-card shadow-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center py-2.5">
          <div className="h-1 w-10 rounded-full bg-muted/30" />
        </div>

        {/* Header */}
        <div className="shrink-0 border-b border-border/40 px-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-foreground">
                {stripPunctuation(word)}
              </span>
              {dict?.phonetic && (
                <span className="text-xs text-muted/60">
                  {dict.phonetic}
                </span>
              )}
              {dict?.audioUrl ? (
                <button
                  type="button"
                  onClick={playAudio}
                  className="rounded-md p-1 text-primary/60 transition-colors active:text-primary"
                >
                  <Volume2 size={16} />
                </button>
              ) : language === "en" ? (
                <TtsButton text={stripPunctuation(word)} size={15} />
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => { haptic(); onClose(); }}
              className="rounded-lg p-1.5 text-muted/50 transition-colors active:bg-accent active:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          {farsi && (
            <p className="mt-1.5 text-sm font-semibold text-foreground" dir="rtl">
              {farsi}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
          {children}
        </div>
      </motion.div>
    </>
  );
}

/* ── Popover header (desktop) ── */

function PopoverHeader({
  word,
  dict,
  farsi,
  language,
  playAudio,
  onClose,
}: {
  word: string;
  dict: WordLookupResult["dictionary"] | undefined;
  farsi: string | undefined;
  language: "en" | "fa";
  playAudio: () => void;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-border/40 bg-card px-3.5 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {stripPunctuation(word)}
          </span>
          {dict?.phonetic && (
            <span className="text-[11px] text-muted/60">
              {dict.phonetic}
            </span>
          )}
          {dict?.audioUrl ? (
            <button
              type="button"
              onClick={playAudio}
              className="rounded-md p-0.5 text-primary/60 transition-colors hover:text-primary"
            >
              <Volume2 size={13} />
            </button>
          ) : language === "en" ? (
            <TtsButton text={stripPunctuation(word)} size={12} />
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted/50 transition-colors hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      {farsi && (
        <p className="mt-1 text-sm font-semibold text-foreground" dir="rtl">
          {farsi}
        </p>
      )}
    </div>
  );
}

/* ── Shared lookup body content ── */

function LookupBody({
  loading,
  dict,
  farsi,
  keyTermCards,
  exampleCards,
  totalExamples,
  clean,
  language,
  word,
}: {
  loading: boolean;
  dict: WordLookupResult["dictionary"] | undefined;
  farsi: string | undefined;
  keyTermCards: ReturnType<typeof getAllCards>;
  exampleCards: ReturnType<typeof getAllCards>;
  totalExamples: number;
  clean: string;
  language: "en" | "fa";
  word: string;
}) {
  return (
    <>
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 size={16} className="animate-spin text-muted/40" />
          <span className="text-xs text-muted/40">Loading...</span>
        </div>
      )}

      {!loading && dict && dict.meanings.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/60">
            Definitions
          </p>
          {dict.meanings.map((m, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-start gap-1.5">
                <span className="mt-px shrink-0 rounded bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-muted/70">
                  {m.partOfSpeech}
                </span>
                <p className="text-[12px] leading-relaxed text-foreground md:text-[11px]">
                  {m.definition}
                </p>
              </div>
              {m.example && (
                <p className="ml-7 text-[12px] italic leading-relaxed text-muted/60 md:text-[11px]">
                  &ldquo;{m.example}&rdquo;
                </p>
              )}
              {m.synonyms.length > 0 && (
                <p className="ml-7 text-[10px] text-muted/50">
                  <span className="font-medium">≈</span>{" "}
                  {m.synonyms.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {totalExamples > 0 && (
        <div className="space-y-2.5">
          {keyTermCards.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/60">
                Key Term
              </p>
              {keyTermCards.map((card) => (
                <CardRow
                  key={card.id}
                  en={card.en}
                  fa={card.fa}
                  context={card.context}
                  level={card.level}
                  unit={card.unit}
                  highlightWord={language === "en" ? clean : ""}
                  highlightFa={language === "fa" ? clean : ""}
                />
              ))}
            </>
          )}

          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted/50">
            {keyTermCards.length > 0
              ? `More from curriculum (${exampleCards.length})`
              : `Curriculum examples (${totalExamples})`}
          </p>
          {exampleCards.map((card) => (
            <CardRow
              key={card.id}
              en={card.en}
              fa={card.fa}
              context={card.context}
              level={card.level}
              unit={card.unit}
              highlightWord={language === "en" ? clean : ""}
              highlightFa={language === "fa" ? clean : ""}
            />
          ))}
        </div>
      )}

      {!loading && !dict && !farsi && totalExamples === 0 && (
        <p className="py-6 text-center text-xs text-muted/50">
          No results found for &ldquo;{stripPunctuation(word)}&rdquo;
        </p>
      )}
    </>
  );
}

/* ── Card example row ── */

function CardRow({
  en,
  fa,
  context,
  level,
  unit,
  highlightWord,
  highlightFa,
}: {
  en: string;
  fa: string;
  context: string;
  level: number;
  unit: number;
  highlightWord: string;
  highlightFa: string;
}) {
  return (
    <div className="rounded-lg bg-accent/30 p-3 space-y-1">
      <p className="text-[12px] leading-relaxed text-foreground md:text-[11px]">
        {highlightWord ? highlightInText(en, highlightWord) : en}
      </p>
      <p className="text-[12px] leading-relaxed text-muted md:text-[11px]" dir="rtl">
        {highlightFa ? highlightInText(fa, highlightFa) : fa}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-muted/40">{context}</span>
        <span className="text-[9px] text-muted/25">·</span>
        <span className="text-[9px] text-muted/40">
          L{level} U{unit}
        </span>
      </div>
    </div>
  );
}
