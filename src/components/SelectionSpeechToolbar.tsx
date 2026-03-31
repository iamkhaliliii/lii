"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Volume2,
  Square,
  Loader2,
  AlertCircle,
  Sparkles,
  Monitor,
  ChevronDown,
  ChevronUp,
  Gauge,
  UnfoldVertical,
  Settings2,
  Type,
  Mic2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { looksMostlyEnglish } from "@/lib/looks-mostly-english";
import {
  computeSentenceExpansion,
  applyExpandedSelection,
  type SentenceExpandResult,
} from "@/lib/expand-selection-to-sentences";
import { useSettings } from "@/hooks/useSettings";
import {
  fetchElevenLabsSpeech,
  fetchElevenLabsVoices,
  resolveElevenLabsVoiceId,
  clampTtsSpeed,
  ttsCacheSignature,
  TTS_SPEED_MIN,
  TTS_SPEED_MAX,
  TTS_SPEED_DEFAULT,
  type ElevenLabsVoiceRow,
} from "@/lib/elevenlabs-tts";
import type { TtsAccent, TtsEngine } from "@/types";

type ToolbarState = {
  text: string;
  left: number;
  top: number;
  placeAbove: boolean;
};

/** Max CSS width of panel — keep in sync with `w-[min(...)]` below */
const PANEL_MAX_WIDTH_PX = 276;
/** Approximate height for flip / viewport clamp */
const PANEL_EST_HEIGHT = 340;
const VIEW_GUTTER = 6;

function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-1 flex items-start gap-1.5">
      {Icon ? (
        <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent ring-1 ring-border/40">
          <Icon size={11} className="text-muted" strokeWidth={2} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="text-[11px] font-semibold leading-tight text-foreground">{title}</h3>
          {action}
        </div>
        {description ? (
          <p className="mt-0.5 text-[9px] leading-snug text-muted line-clamp-2">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function StatPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center truncate rounded-full bg-accent px-1.5 py-px text-[9px] font-medium tabular-nums text-muted">
      {children}
    </span>
  );
}

function voiceOptionSubtitle(v: ElevenLabsVoiceRow): string {
  const L = v.labels;
  if (!L) return v.category || "";
  const parts = [
    L.accent,
    L.age,
    L.gender,
    L["use case"] ?? L["use_case"],
  ].filter(Boolean);
  return parts.join(" · ") || v.category || "";
}

function isInsideExcludedTree(node: Node | null): boolean {
  let el: HTMLElement | null =
    node?.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : (node?.parentElement ?? null);
  while (el) {
    if (el.closest("[data-no-selection-tts]")) return true;
    el = el.parentElement;
  }
  return false;
}

function readSelection(): { text: string; rect: DOMRect } | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

  const text = sel.toString().replace(/\s+/g, " ").trim();
  if (!looksMostlyEnglish(text)) return null;

  const range = sel.getRangeAt(0);
  if (isInsideExcludedTree(range.commonAncestorContainer)) return null;

  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;

  return { text, rect };
}

function SegmentedRow<T extends string>({
  label,
  options,
  value,
  onChange,
  disabledOption,
}: {
  label: string;
  options: { id: T; label: string; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  disabledOption?: (id: T) => boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted/80">{label}</p>
      <div
        className="flex gap-px rounded-lg bg-accent/90 p-px ring-1 ring-border/40"
        role="group"
        aria-label={label}
      >
        {options.map((opt) => {
          const active = value === opt.id;
          const disabled = disabledOption?.(opt.id) ?? false;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              title={opt.title}
              aria-pressed={active}
              onClick={() => onChange(opt.id)}
              className={cn(
                "relative min-h-[32px] min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-[11px] font-semibold transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
                disabled && "cursor-not-allowed opacity-40",
                active
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                  : "text-muted hover:bg-card/50 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SelectionSpeechToolbar() {
  const { settings, updateSettings } = useSettings();
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const ttsCancelledRef = useRef(false);
  const ttsAudioCacheRef = useRef<{ signature: string; buffer: ArrayBuffer } | null>(null);
  const voicesFetchKeyRef = useRef<string | null>(null);

  const [elevenOptsOpen, setElevenOptsOpen] = useState(false);
  const [voices, setVoices] = useState<ElevenLabsVoiceRow[]>([]);
  const [voicesStatus, setVoicesStatus] = useState<"idle" | "loading" | "error">("idle");
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [lastPlayedFromCache, setLastPlayedFromCache] = useState(false);
  const [sentenceExpand, setSentenceExpand] = useState<SentenceExpandResult | null>(null);

  const reduceMotion = useReducedMotion();
  const previewRegionId = useId();
  const voiceSelectId = useId();

  const elevenKey = (settings.elevenLabsApiKey || "").trim();
  const accent: TtsAccent = settings.ttsAccent === "gb" ? "gb" : "us";
  const enginePref: TtsEngine =
    settings.ttsEngine === "browser" ? "browser" : "elevenlabs";
  const canUseEleven = Boolean(elevenKey);
  const effectiveEngine: TtsEngine =
    enginePref === "elevenlabs" && canUseEleven ? "elevenlabs" : "browser";

  const ttsSpeed = clampTtsSpeed(
    settings.ttsElevenLabsSpeed ?? TTS_SPEED_DEFAULT
  );

  const resolvedVoiceId = resolveElevenLabsVoiceId(
    accent,
    settings.ttsElevenLabsVoiceUs,
    settings.ttsElevenLabsVoiceGb
  );

  const voiceSelectValue =
    accent === "gb"
      ? (settings.ttsElevenLabsVoiceGb ?? "")
      : (settings.ttsElevenLabsVoiceUs ?? "");

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    ttsCancelledRef.current = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    cleanupAudio();
    setSpeaking(false);
    setLoading(false);
  }, [cleanupAudio]);

  const updateFromSelection = useCallback(() => {
    const data = readSelection();
    if (!data) {
      setToolbar(null);
      setError(null);
      setSentenceExpand(null);
      return;
    }

    const { text, rect } = data;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 6;
    const panelW = Math.min(PANEL_MAX_WIDTH_PX, vw - 2 * VIEW_GUTTER);
    const halfW = panelW / 2;
    const anchorX = rect.left + rect.width / 2;
    const left = Math.min(
      Math.max(anchorX, VIEW_GUTTER + halfW),
      vw - VIEW_GUTTER - halfW
    );

    const estH = Math.min(PANEL_EST_HEIGHT, vh - 2 * VIEW_GUTTER);
    let placeAbove = rect.top >= estH + margin + 20;
    let top = placeAbove ? rect.top - margin : rect.bottom + margin;

    if (placeAbove && top - estH < VIEW_GUTTER) {
      placeAbove = false;
      top = rect.bottom + margin;
    }
    if (!placeAbove) {
      top = Math.min(top, vh - VIEW_GUTTER - estH);
      top = Math.max(top, VIEW_GUTTER);
    }
    if (placeAbove) {
      top = Math.max(top, estH + VIEW_GUTTER);
    }

    setToolbar({ text, left, top, placeAbove });
    setError(null);
    setLastPlayedFromCache(false);

    let expand: SentenceExpandResult | null = null;
    try {
      const sel = window.getSelection();
      if (sel?.rangeCount && !sel.isCollapsed) {
        const candidate = computeSentenceExpansion(sel.getRangeAt(0));
        if (candidate && looksMostlyEnglish(candidate.expandedText)) {
          expand = candidate;
        }
      }
    } catch {
      expand = null;
    }
    setSentenceExpand(expand);
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateFromSelection();
    });
  }, [updateFromSelection]);

  useEffect(() => {
    const onMouseUp = () => scheduleUpdate();
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        scheduleUpdate();
      }
    };

    const onSelectionChange = () => {
      if (debounceRef.current != null) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        scheduleUpdate();
      }, 80);
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("selectionchange", onSelectionChange);

    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("selectionchange", onSelectionChange);
      if (debounceRef.current != null) clearTimeout(debounceRef.current);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleUpdate]);

  useEffect(() => {
    const onScroll = () => {
      if (toolbar) scheduleUpdate();
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [toolbar, scheduleUpdate]);

  const toolbarOpen = Boolean(toolbar);

  useEffect(() => {
    if (!toolbarOpen || !elevenKey) return;
    if (voicesFetchKeyRef.current === elevenKey) return;

    voicesFetchKeyRef.current = elevenKey;
    let cancelled = false;
    setVoices([]);
    setVoicesStatus("loading");
    setVoicesError(null);
    fetchElevenLabsVoices(elevenKey)
      .then((list) => {
        if (cancelled) return;
        setVoices(list);
        setVoicesStatus("idle");
      })
      .catch((e) => {
        if (cancelled) return;
        voicesFetchKeyRef.current = null;
        const msg = e instanceof Error ? e.message : "Could not load voices.";
        setVoicesError(msg);
        setVoicesStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [toolbarOpen, elevenKey]);

  useEffect(() => {
    ttsAudioCacheRef.current = null;
  }, [elevenKey]);

  const playMp3Buffer = useCallback(
    async (buf: ArrayBuffer) => {
      cleanupAudio();
      const blob = new Blob([buf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      let playbackEndedNormally = false;
      audio.onended = () => {
        playbackEndedNormally = true;
        audio.onerror = null;
        setSpeaking(false);
        cleanupAudio();
      };
      audio.onerror = () => {
        if (playbackEndedNormally || ttsCancelledRef.current) return;
        audio.onerror = null;
        setSpeaking(false);
        setError("Could not play audio. Try again or switch to Browser.");
        cleanupAudio();
      };
      await audio.play();
      if (!ttsCancelledRef.current) setSpeaking(true);
    },
    [cleanupAudio]
  );

  const speakBrowser = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setError("Text-to-speech is not supported in this browser.");
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = accent === "gb" ? "en-GB" : "en-US";
      u.rate = Math.min(2, Math.max(0.5, ttsSpeed));
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [accent, ttsSpeed]
  );

  const speak = useCallback(async () => {
    if (!toolbar?.text) return;
    setError(null);

    if (speaking || loading) {
      cancelSpeech();
      return;
    }

    if (effectiveEngine === "elevenlabs") {
      ttsCancelledRef.current = false;
      try {
        const sig = ttsCacheSignature({
          voiceId: resolvedVoiceId,
          speed: ttsSpeed,
          text: toolbar.text,
        });

        let buf: ArrayBuffer;
        const cached = ttsAudioCacheRef.current;
        if (cached?.signature === sig) {
          buf = cached.buffer;
          setLastPlayedFromCache(true);
        } else {
          setLastPlayedFromCache(false);
          setLoading(true);
          buf = await fetchElevenLabsSpeech({
            apiKey: elevenKey,
            text: toolbar.text,
            accent,
            voiceId: resolvedVoiceId,
            speed: ttsSpeed,
          });
          if (ttsCancelledRef.current) return;
          ttsAudioCacheRef.current = {
            signature: sig,
            buffer: buf.slice(0),
          };
        }

        if (ttsCancelledRef.current) return;
        await playMp3Buffer(buf);
      } catch (e) {
        if (!ttsCancelledRef.current) {
          const msg = e instanceof Error ? e.message : "ElevenLabs request failed.";
          setError(msg.length > 120 ? `${msg.slice(0, 120)}…` : msg);
        }
      } finally {
        if (!ttsCancelledRef.current) setLoading(false);
      }
      return;
    }

    speakBrowser(toolbar.text);
  }, [
    toolbar?.text,
    speaking,
    loading,
    effectiveEngine,
    elevenKey,
    accent,
    resolvedVoiceId,
    ttsSpeed,
    cancelSpeech,
    playMp3Buffer,
    speakBrowser,
  ]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const setAccent = (a: TtsAccent) => {
    updateSettings({ ttsAccent: a });
  };

  const setEngine = (e: TtsEngine) => {
    updateSettings({ ttsEngine: e });
  };

  if (!toolbar) return null;

  const browserOk =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const charCount = toolbar.text.length;
  const wordCount = toolbar.text.split(/\s+/).filter(Boolean).length;

  const engineValue: TtsEngine =
    enginePref === "elevenlabs" && !canUseEleven ? "browser" : enginePref;

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-labelledby="lii-tts-title"
      aria-describedby={previewRegionId}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 400, damping: 30, mass: 0.8 }
      }
      className={cn(
        "fixed z-[10000] w-[min(calc(100vw-12px),276px)] max-w-[calc(100vw-12px)]",
        "max-h-[min(72vh,420px)] overflow-x-hidden overflow-y-hidden rounded-xl border border-border bg-card-elevated",
        "shadow-[var(--shadow-md)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        "flex flex-col",
        toolbar.placeAbove ? "-translate-x-1/2 -translate-y-full" : "-translate-x-1/2"
      )}
      style={{ left: toolbar.left, top: toolbar.top }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Header */}
      <header className="shrink-0 border-b border-border-subtle bg-primary-muted/30 px-2.5 py-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card ring-1 ring-border/50",
              (speaking || loading) && "ring-primary/25"
            )}
          >
            <Volume2
              size={14}
              className={cn(
                "text-primary",
                speaking && "scale-105",
                loading && "animate-pulse"
              )}
              strokeWidth={2}
            />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2 id="lii-tts-title" className="truncate text-[13px] font-semibold leading-tight text-foreground">
              Read aloud
            </h2>
            <p className="truncate text-[10px] leading-tight text-muted">
              English selection · set voice · Listen
            </p>
          </div>
        </div>
      </header>

      <div
        id={previewRegionId}
        className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-2.5 py-2"
      >
        <div className="space-y-2.5">
          <section aria-label="Selected text preview" className="min-w-0">
            <SectionHeader
              icon={Type}
              title="Preview"
              description="Text to speak. Scroll if long."
              action={
                <div className="flex max-w-[48%] shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:flex-wrap sm:justify-end">
                  <StatPill>
                    {wordCount}w · {charCount}c
                  </StatPill>
                </div>
              }
            />
            <div
              dir="ltr"
              className={cn(
                "max-h-[3.75rem] overflow-y-auto overflow-x-hidden rounded-lg border border-border/70 bg-background/90 px-2 py-1.5",
                "text-left text-[11px] leading-snug text-foreground break-words [scrollbar-width:thin]"
              )}
            >
              <p className="whitespace-pre-wrap break-words">{toolbar.text}</p>
            </div>
          </section>

          {sentenceExpand ? (
            <section
              aria-label="Expand to full sentences"
              className="min-w-0 rounded-lg border border-warning/25 bg-warning-light/70 p-2 dark:bg-warning-light/12"
            >
              <SectionHeader
                icon={UnfoldVertical}
                title="Full sentences"
                description="Selection is mid-sentence. Expand to full sentences."
              />
              <div
                dir="ltr"
                className="mb-1.5 max-h-[3.25rem] overflow-y-auto overflow-x-hidden rounded-md border border-border-subtle bg-card/90 px-2 py-1 text-[10px] leading-snug text-foreground break-words"
              >
                <p className="whitespace-pre-wrap break-words">{sentenceExpand.expandedText}</p>
              </div>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!sentenceExpand) return;
                  applyExpandedSelection(sentenceExpand.expandedRange.cloneRange());
                  requestAnimationFrame(() => scheduleUpdate());
                }}
                className={cn(
                  "flex h-8 w-full min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold",
                  "bg-primary/10 text-foreground ring-1 ring-primary/18 transition-colors",
                  "hover:bg-primary/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                )}
              >
                <UnfoldVertical size={13} strokeWidth={2} />
                <span className="truncate">Expand selection</span>
              </button>
            </section>
          ) : null}

          <div className="h-px w-full min-w-0 bg-border-subtle" />

          <section aria-label="Accent" className="min-w-0">
            <SegmentedRow<TtsAccent>
              label="Accent"
              value={accent}
              onChange={setAccent}
              options={[
                { id: "us", label: "US", title: "American English (en-US)" },
                { id: "gb", label: "UK", title: "British English (en-GB)" },
              ]}
            />
          </section>

          <section aria-label="Voice source" className="min-w-0">
            <SectionHeader
              icon={Mic2}
              title="Engine"
              description={
                canUseEleven
                  ? "ElevenLabs or Browser."
                  : "Browser only — add API key in Settings."
              }
            />
            <div
              className="flex gap-px rounded-lg bg-accent/90 p-px ring-1 ring-border/40"
              role="group"
              aria-label="Voice engine"
            >
              <button
                type="button"
                disabled={!canUseEleven}
                aria-pressed={engineValue === "elevenlabs" && canUseEleven}
                title={
                  canUseEleven
                    ? "Cloud voices via ElevenLabs"
                    : "Add your ElevenLabs API key in Settings"
                }
                onClick={() => setEngine("elevenlabs")}
                className={cn(
                  "flex min-h-[32px] min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1 py-1 text-[10px] font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
                  !canUseEleven && "cursor-not-allowed opacity-45",
                  engineValue === "elevenlabs" && canUseEleven
                    ? "bg-card text-foreground ring-1 ring-border/60"
                    : "text-muted hover:bg-card/50 hover:text-foreground"
                )}
              >
                <Sparkles size={12} className="shrink-0 opacity-80" />
                <span className="truncate">11Labs</span>
              </button>
              <button
                type="button"
                disabled={!browserOk}
                aria-pressed={engineValue === "browser" || !canUseEleven}
                title={browserOk ? "Uses Web Speech in this browser" : "Not available in this browser"}
                onClick={() => setEngine("browser")}
                className={cn(
                  "flex min-h-[32px] min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1 py-1 text-[10px] font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
                  !browserOk && "cursor-not-allowed opacity-45",
                  engineValue === "browser" || !canUseEleven
                    ? "bg-card text-foreground ring-1 ring-border/60"
                    : "text-muted hover:bg-card/50 hover:text-foreground"
                )}
              >
                <Monitor size={12} className="shrink-0 opacity-80" />
                <span className="truncate">Browser</span>
              </button>
            </div>
          </section>

          {engineValue === "elevenlabs" && canUseEleven ? (
            <section aria-label="ElevenLabs advanced options" className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-accent/25">
              <button
                type="button"
                aria-expanded={elevenOptsOpen}
                onClick={() => setElevenOptsOpen((o) => !o)}
                className={cn(
                  "flex w-full min-w-0 items-center gap-2 px-2 py-2 text-left transition-colors",
                  "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/25"
                )}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-card ring-1 ring-border/50">
                  <Settings2 size={13} className="text-muted" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 overflow-hidden">
                  <span className="flex flex-wrap items-center gap-1">
                    <span className="truncate text-[11px] font-semibold text-foreground">11Labs options</span>
                    <span className="shrink-0 rounded bg-card px-1 py-px text-[8px] font-bold uppercase text-muted ring-1 ring-border/50">
                      opt
                    </span>
                  </span>
                  <span className="block truncate text-[9px] text-muted">Voice · speed · cache</span>
                </span>
                {elevenOptsOpen ? (
                  <ChevronUp size={15} className="shrink-0 text-muted" />
                ) : (
                  <ChevronDown size={15} className="shrink-0 text-muted" />
                )}
              </button>
              <AnimatePresence initial={false}>
                {elevenOptsOpen ? (
                  <motion.div
                    key="el-opts"
                    initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="border-t border-border-subtle"
                  >
                    <div className="min-w-0 space-y-2 px-2 pb-2 pt-2">
                  <p className="text-[9px] leading-snug text-muted line-clamp-3">
                    Same <strong className="text-foreground/85">text + voice + speed</strong> replays from{" "}
                    <strong className="text-foreground/85">cache</strong> (no extra API).
                  </p>
                  <div className="min-w-0 space-y-1">
                    <label
                      htmlFor={voiceSelectId}
                      className="block truncate text-[9px] font-semibold uppercase tracking-wide text-muted/90"
                    >
                      Voice ({accent === "us" ? "US" : "UK"})
                    </label>
                    {voicesStatus === "loading" ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <Loader2 size={12} className="animate-spin shrink-0" />
                        <span className="truncate">Loading voices…</span>
                      </div>
                    ) : null}
                    {voicesError ? (
                      <p className="break-words text-[10px] leading-snug text-danger">{voicesError}</p>
                    ) : null}
                    <select
                      id={voiceSelectId}
                      value={voiceSelectValue}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (accent === "gb") {
                          updateSettings({ ttsElevenLabsVoiceGb: v });
                        } else {
                          updateSettings({ ttsElevenLabsVoiceUs: v });
                        }
                      }}
                      className={cn(
                        "h-8 min-w-0 w-full max-w-full rounded-md border border-border bg-card py-1 pl-2 pr-1 text-left text-[11px] text-foreground",
                        "focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                      )}
                    >
                      <option value="">Built-in default (Rachel / George)</option>
                      {voices.map((v) => (
                        <option key={v.voice_id} value={v.voice_id}>
                          {v.name}
                          {voiceOptionSubtitle(v) ? ` — ${voiceOptionSubtitle(v)}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex min-w-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-muted/90">
                        <Gauge size={11} className="shrink-0 text-muted" />
                        <span className="truncate">Speed</span>
                      </span>
                      <span className="shrink-0 rounded bg-card px-1.5 py-px font-mono text-[10px] font-semibold tabular-nums text-foreground ring-1 ring-border/50">
                        {ttsSpeed.toFixed(2)}×
                      </span>
                    </div>
                    <div className="rounded-md bg-card/80 px-2 py-1.5 ring-1 ring-border/40">
                      <input
                        type="range"
                        min={TTS_SPEED_MIN}
                        max={TTS_SPEED_MAX}
                        step={0.05}
                        value={ttsSpeed}
                        aria-valuetext={`${ttsSpeed.toFixed(2)} times normal speed`}
                        onChange={(e) =>
                          updateSettings({
                            ttsElevenLabsSpeed: clampTtsSpeed(parseFloat(e.target.value)),
                          })
                        }
                        className="h-1.5 w-full min-w-0 cursor-pointer accent-primary"
                      />
                      <div className="mt-1 flex justify-between gap-1 text-[8px] font-medium text-muted/80">
                        <span className="truncate">Slow</span>
                        <span className="shrink-0">1×</span>
                        <span className="truncate text-right">Fast</span>
                      </div>
                    </div>
                  </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>
          ) : null}

          {lastPlayedFromCache && !error ? (
            <div
              className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-success/20 bg-success-light px-2 py-1.5 text-center"
              role="status"
            >
              <span className="h-1 w-1 shrink-0 animate-pulse rounded-full bg-success" />
              <p className="min-w-0 text-[10px] font-medium leading-tight text-success">Cached — no API</p>
            </div>
          ) : null}

          {error ? (
            <div
              className="flex min-w-0 gap-2 rounded-lg border border-danger/25 bg-danger-light px-2 py-2 text-left"
              role="alert"
            >
              <AlertCircle size={14} className="mt-px shrink-0 text-danger" strokeWidth={2} />
              <p className="min-w-0 break-words text-[10px] font-medium leading-snug text-danger">{error}</p>
            </div>
          ) : null}

          <p className="px-0.5 text-center text-[9px] leading-tight text-muted/75">
            Prefs saved in <span className="font-medium text-muted">Settings</span>.
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-border-subtle bg-card-elevated px-2.5 pb-2 pt-2">
        <button
          type="button"
          onClick={speak}
          disabled={!browserOk && effectiveEngine === "browser"}
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-45",
            speaking || loading
              ? "bg-foreground/[0.08] text-foreground hover:bg-foreground/[0.11]"
              : "bg-primary text-white shadow-sm hover:bg-primary-hover dark:text-zinc-950"
          )}
          title={speaking ? "Stop" : loading ? "Loading…" : "Listen"}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="shrink-0 animate-spin" />
              <span className="truncate">Wait…</span>
            </>
          ) : speaking ? (
            <>
              <Square size={13} className="shrink-0 fill-current" strokeWidth={0} />
              Stop
            </>
          ) : (
            <>
              <Volume2 size={16} className="shrink-0" strokeWidth={2} />
              Listen
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
