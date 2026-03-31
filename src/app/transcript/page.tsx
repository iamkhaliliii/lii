"use client";
import { useState, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  FileText,
  Upload,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Target,
  ListChecks,
  MessageSquare,
  ArrowRight,
  Trash2,
  Languages,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { analyzeTranscriptDirect } from "@/lib/ai/client-direct";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";

// ─── Copy button ────────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted/40 transition-all hover:bg-accent hover:text-foreground active:scale-95"
    >
      {copied ? (
        <Check size={10} className="text-green-500" />
      ) : (
        <Copy size={10} />
      )}
      {label || (copied ? "Copied" : "Copy")}
    </button>
  );
}

// ─── Collapsible section ────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  badge,
  accent,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="group rounded-2xl border border-border/60 bg-card overflow-hidden transition-shadow hover:shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-accent/20"
      >
        {open ? (
          <ChevronDown size={13} className="text-muted/30 transition-transform" />
        ) : (
          <ChevronRight size={13} className="text-muted/30 transition-transform" />
        )}
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", accent || "bg-primary/8")}>
          <Icon size={13} className={accent ? "text-white/80" : "text-primary/60"} />
        </div>
        <span className="text-[13px] font-semibold text-foreground/90">{title}</span>
        {badge !== undefined && (
          <span className="ml-auto rounded-full bg-accent/80 px-2.5 py-0.5 text-[10px] font-semibold text-muted/50 tabular-nums">
            {badge}
          </span>
        )}
      </button>
      <div
        className={cn(
          "grid transition-all duration-200",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/40 px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Severity badge ─────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { bg: string; dot: string }> = {
    high: { bg: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400", dot: "bg-red-500" },
    medium: { bg: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400", dot: "bg-amber-500" },
    low: { bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400", dot: "bg-emerald-500" },
  };
  const c = config[severity] || config.medium;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", c.bg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {severity}
    </span>
  );
}

// ─── Sentiment indicator ────────────────────────────────────

function SentimentChip({ sentiment }: { sentiment: string }) {
  const map: Record<string, { emoji: string; color: string }> = {
    positive: { emoji: "😊", color: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
    negative: { emoji: "😟", color: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
    neutral: { emoji: "😐", color: "bg-gray-50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400" },
    mixed: { emoji: "🤔", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  };
  const s = map[sentiment] || map.neutral;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium", s.color)}>
      {s.emoji} {sentiment}
    </span>
  );
}

// ─── Progress bar ───────────────────────────────────────────

function ProgressBar({
  step,
  current,
  total,
}: {
  step: string;
  current: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-full border-4 border-accent flex items-center justify-center">
          <span className="text-sm font-bold text-primary tabular-nums">{pct}%</span>
        </div>
        <Loader2
          size={72}
          className="absolute inset-0 -m-0.5 animate-spin text-primary/40"
          style={{ animationDuration: "2s" }}
        />
      </div>
      <p className="text-sm font-medium text-foreground/70">{step}</p>
      <div className="mt-4 w-64">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
          <div
            className="h-full rounded-full bg-primary/60 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted/40 tabular-nums">
        Step {current + 1} of {total}
      </p>
    </div>
  );
}

// ─── Rich text renderer (bold markers) ──────────────────────

function RichText({ text, className, dir }: { text: string; className?: string; dir?: string }) {
  // Parse **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span dir={dir} className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ─── Main page ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalysisResult = any;

export default function TranscriptPage() {
  const { settings } = useSettings();
  const toast = useToast();

  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult>(null);
  const [dragging, setDragging] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const text = await file.text();
      setTranscript(text);
      toast.success("File loaded");
    },
    [toast]
  );

  const handleAnalyze = useCallback(async () => {
    if (!transcript.trim()) return;
    setError("");
    setAnalyzing(true);
    setResult(null);

    try {
      const provider = settings.activeProvider;
      const apiKey = settings.providers[provider]?.apiKey;
      if (!apiKey) throw new Error("No API key configured. Go to Settings.");

      const parsed = await analyzeTranscriptDirect({
        provider,
        apiKey,
        modelId: settings.activeModel,
        transcript: transcript.trim(),
        rules: settings.rules,
        onProgress: (step, current, total) => {
          setProgressStep(step);
          setProgressCurrent(current);
          setProgressTotal(total);
        },
      });

      setResult(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [transcript, settings]);

  const handleClear = useCallback(() => {
    setTranscript("");
    setResult(null);
    setError("");
  }, []);

  // Drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current++;
    setDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current--;
    if (dragCountRef.current === 0) setDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current = 0;
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.type.startsWith("text/") ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".vtt") ||
        file.name.endsWith(".srt"))
    ) {
      await handleFileUpload(file);
    }
  };

  const wordCount = transcript.trim()
    ? transcript.trim().split(/\s+/).length
    : 0;

  return (
    <div className="flex h-full flex-col bg-background">
      <Navbar />

      <div className="flex-1 overflow-y-auto chat-scroll page-scroll">
        <div className="mx-auto max-w-3xl px-3 py-4 md:px-4 md:py-5">
          {/* ─── Input section ─── */}
          {!result && !analyzing && (
            <div className="animate-fade-in space-y-4">
              {/* Header */}
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
                  <FileText size={28} className="text-primary/60" />
                </div>
                <h2 className="text-xl font-bold text-foreground/85 mb-1.5">
                  Transcript Analysis
                </h2>
                <p className="text-[13px] text-muted/50 max-w-sm mx-auto leading-relaxed">
                  Upload or paste a meeting transcript for complete Farsi translation and detailed analysis
                </p>
              </div>

              {/* Upload area */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  "relative rounded-2xl border-2 border-dashed transition-all duration-200",
                  dragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border/60 hover:border-primary/30",
                  transcript ? "py-3 px-4" : "py-10 px-6"
                )}
              >
                {!transcript ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/80">
                      <Upload size={20} className="text-muted/40" />
                    </div>
                    <p className="text-sm font-medium text-foreground/70 mb-1">
                      Drop a text file here
                    </p>
                    <p className="text-[11px] text-muted/40 mb-4">
                      .txt, .md, .vtt, .srt supported
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl bg-accent px-5 py-2 text-[12px] font-medium text-foreground/60 transition-all hover:bg-accent/70 active:scale-95"
                    >
                      Browse files
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8">
                        <FileText size={14} className="text-primary/60" />
                      </div>
                      <div>
                        <span className="text-[12px] font-medium text-foreground/70">
                          {wordCount.toLocaleString()} words
                        </span>
                        <span className="text-[11px] text-muted/40 ml-2">
                          · ~{Math.ceil(wordCount / 200)} min read
                          {wordCount > 1500 && ` · ${Math.ceil(wordCount / 1500)} chunks`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleClear}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted/40 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.vtt,.srt,text/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await handleFileUpload(file);
                  e.target.value = "";
                }}
                className="hidden"
              />

              {/* Textarea */}
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Or paste the transcript here..."
                rows={transcript ? 12 : 4}
                className="w-full resize-y rounded-2xl border border-border/60 bg-card px-4 py-3.5 text-[13px] leading-relaxed placeholder-muted/30 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/30 p-4 text-[13px] text-red-600 dark:text-red-400">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={!transcript.trim() || analyzing}
                className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-background transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-40"
              >
                <span className="flex items-center justify-center gap-2">
                  <Zap size={16} />
                  Analyze & Translate
                </span>
              </button>
            </div>
          )}

          {/* ─── Loading with progress ─── */}
          {analyzing && (
            <ProgressBar
              step={progressStep}
              current={progressCurrent}
              total={progressTotal}
            />
          )}

          {/* ─── Results ─── */}
          {result && (
            <div className="animate-fade-in space-y-3.5">
              {/* Back button */}
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-medium text-muted/50 transition-all hover:bg-accent hover:text-foreground active:scale-95"
                >
                  <ArrowRight size={12} className="rotate-180" />
                  New transcript
                </button>
                <div className="flex items-center gap-2 text-[10px] text-muted/30">
                  {result.wordCount && <span>{result.wordCount.toLocaleString()} words</span>}
                  {result.chunkCount > 1 && <span>· {result.chunkCount} chunks</span>}
                </div>
              </div>

              {/* ── Hero title card ── */}
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-accent/20 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1
                      dir="rtl"
                      className="text-xl font-bold text-foreground leading-relaxed"
                    >
                      {result.title || "تحلیل جلسه"}
                    </h1>
                    {result.titleEn && (
                      <p className="text-[13px] text-muted/50 mt-1.5">
                        {result.titleEn}
                      </p>
                    )}
                  </div>
                  {result.sentiment && (
                    <SentimentChip sentiment={result.sentiment} />
                  )}
                </div>

                {/* Meta info pills */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {result.date && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-background/60 px-2.5 py-1 text-[11px] text-muted/50">
                      <Clock size={10} /> {result.date}
                    </span>
                  )}
                  {result.duration && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-background/60 px-2.5 py-1 text-[11px] text-muted/50">
                      <Clock size={10} /> {result.duration}
                    </span>
                  )}
                  {result.participants?.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-background/60 px-2.5 py-1 text-[11px] text-muted/50">
                      <Users size={10} /> {result.participants.length} participants
                    </span>
                  )}
                </div>
              </div>

              {/* ── Participants ── */}
              {result.participants?.length > 0 && (
                <Section
                  title="Participants"
                  icon={Users}
                  badge={result.participants.length}
                  defaultOpen={false}
                  accent="bg-blue-500/80"
                >
                  <div className="flex flex-wrap gap-2">
                    {result.participants.map(
                      (
                        p: { name: string; role?: string },
                        i: number
                      ) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-xl bg-accent/50 px-3 py-2"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[12px] font-medium text-foreground/80">
                              {p.name}
                            </p>
                            {p.role && (
                              <p className="text-[10px] text-muted/40">{p.role}</p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </Section>
              )}

              {/* ── Executive Summary ── */}
              {result.summary && (
                <Section title="Executive Summary" icon={MessageSquare} accent="bg-violet-500/80">
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <CopyBtn text={result.summary} />
                    </div>
                    <div
                      dir="rtl"
                      className="rounded-xl bg-accent/30 p-4 text-[13px] leading-[2] text-foreground/80"
                    >
                      <RichText text={result.summary} />
                    </div>
                    {result.summaryEn && (
                      <div className="rounded-xl bg-accent/20 p-4 text-[12px] leading-[1.8] text-muted/50">
                        <RichText text={result.summaryEn} />
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* ── Discussion Topics ── */}
              {result.topics?.length > 0 && (
                <Section
                  title="Discussion Topics"
                  icon={Target}
                  badge={result.topics.length}
                  accent="bg-indigo-500/80"
                >
                  <div className="space-y-3">
                    {result.topics.map(
                      (
                        t: {
                          title: string;
                          titleEn?: string;
                          summary: string;
                          summaryEn?: string;
                          keyPoints?: string[];
                        },
                        i: number
                      ) => (
                        <div
                          key={i}
                          className="rounded-xl border border-border/40 bg-accent/20 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-[11px] font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4
                                dir="rtl"
                                className="text-[13px] font-semibold text-foreground/90"
                              >
                                {t.title}
                              </h4>
                              {t.titleEn && (
                                <p className="text-[10px] text-muted/40 mt-0.5">
                                  {t.titleEn}
                                </p>
                              )}
                            </div>
                          </div>
                          <p
                            dir="rtl"
                            className="mt-2.5 text-[12px] leading-[1.9] text-foreground/65 pr-9"
                          >
                            <RichText text={t.summary} />
                          </p>
                          {t.keyPoints && t.keyPoints.length > 0 && (
                            <ul dir="rtl" className="mt-2.5 space-y-1.5 pr-9">
                              {t.keyPoints.map((p: string, j: number) => (
                                <li
                                  key={j}
                                  className="flex items-start gap-2 text-[11px] text-foreground/55"
                                >
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400/50" />
                                  <RichText text={p} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </Section>
              )}

              {/* ── Key Decisions ── */}
              {result.keyDecisions?.length > 0 && (
                <Section
                  title="Key Decisions"
                  icon={CheckCircle2}
                  badge={result.keyDecisions.length}
                  accent="bg-emerald-500/80"
                >
                  <div className="space-y-2.5">
                    {result.keyDecisions.map(
                      (
                        d: {
                          decision: string;
                          decisionEn?: string;
                          owner?: string;
                        },
                        i: number
                      ) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5"
                        >
                          <CheckCircle2
                            size={15}
                            className="mt-0.5 shrink-0 text-emerald-500/60"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              dir="rtl"
                              className="text-[12px] font-medium text-foreground/80 leading-[1.7]"
                            >
                              <RichText text={d.decision} />
                            </p>
                            {d.decisionEn && (
                              <p className="text-[11px] text-muted/45 mt-1">
                                {d.decisionEn}
                              </p>
                            )}
                            {d.owner && (
                              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
                                <Users size={8} />
                                {d.owner}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </Section>
              )}

              {/* ── Action Items ── */}
              {result.actionItems?.length > 0 && (
                <Section
                  title="Action Items"
                  icon={ListChecks}
                  badge={result.actionItems.length}
                  accent="bg-orange-500/80"
                >
                  <div className="space-y-2.5">
                    {result.actionItems.map(
                      (
                        a: {
                          task: string;
                          taskEn?: string;
                          assignee?: string;
                          deadline?: string;
                        },
                        i: number
                      ) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-border/40 bg-accent/30 p-3.5"
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-orange-400/50 text-[9px] font-bold text-orange-500/70">
                            {i + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              dir="rtl"
                              className="text-[12px] font-medium text-foreground/80 leading-[1.7]"
                            >
                              <RichText text={a.task} />
                            </p>
                            {a.taskEn && (
                              <p className="text-[11px] text-muted/45 mt-1">
                                {a.taskEn}
                              </p>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              {a.assignee && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[9px] font-medium text-primary">
                                  <Users size={8} />
                                  {a.assignee}
                                </span>
                              )}
                              {a.deadline && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[9px] text-muted/50">
                                  <Clock size={8} />
                                  {a.deadline}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </Section>
              )}

              {/* ── Risks ── */}
              {result.risks?.length > 0 && (
                <Section
                  title="Risks & Concerns"
                  icon={AlertTriangle}
                  badge={result.risks.length}
                  defaultOpen={false}
                  accent="bg-red-500/80"
                >
                  <div className="space-y-2.5">
                    {result.risks.map(
                      (
                        r: {
                          risk: string;
                          riskEn?: string;
                          severity: string;
                        },
                        i: number
                      ) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-border/40 bg-accent/20 p-3.5"
                        >
                          <AlertTriangle
                            size={15}
                            className="mt-0.5 shrink-0 text-amber-500/60"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5">
                              <SeverityBadge severity={r.severity} />
                            </div>
                            <p
                              dir="rtl"
                              className="text-[12px] text-foreground/75 leading-[1.7]"
                            >
                              <RichText text={r.risk} />
                            </p>
                            {r.riskEn && (
                              <p className="text-[11px] text-muted/45 mt-1">
                                {r.riskEn}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </Section>
              )}

              {/* ── Next Steps ── */}
              {result.nextSteps?.length > 0 && (
                <Section
                  title="Next Steps"
                  icon={TrendingUp}
                  defaultOpen={false}
                  accent="bg-cyan-500/80"
                >
                  <ol dir="rtl" className="space-y-2">
                    {result.nextSteps.map((s: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-[12px] text-foreground/70"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                          {i + 1}
                        </span>
                        <RichText text={s} className="leading-[1.7]" />
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {/* ── Full Translation ── */}
              {result.fullTranslation && (
                <Section
                  title="Full Translation"
                  icon={Languages}
                  defaultOpen={false}
                  accent="bg-purple-500/80"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted/30">
                        Complete Farsi translation
                        {result.chunkCount > 1 &&
                          ` (${result.chunkCount} chunks merged)`}
                      </span>
                      <CopyBtn text={result.fullTranslation} />
                    </div>
                    <div
                      dir="rtl"
                      className="max-h-[600px] overflow-y-auto rounded-xl bg-accent/30 p-5 text-[12.5px] leading-[2.2] text-foreground/75 whitespace-pre-wrap chat-scroll"
                    >
                      {result.fullTranslation}
                    </div>
                  </div>
                </Section>
              )}

              {/* Bottom spacer */}
              <div className="h-10" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
