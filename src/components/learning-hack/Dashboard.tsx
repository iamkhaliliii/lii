"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Trophy,
  BookOpen,
  Clock,
  Zap,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyLog, UserProgress } from "@/types/learning-hack";
import {
  getProgress,
  getDailyLogs,
  getDueCount,
  getTodayLog,
} from "@/lib/learning-hack-srs";
import { LEVELS, TOTAL_CARDS } from "@/data/learning-hack";

type Props = {
  onStartFlashcards: () => void;
  onStartQuiz: () => void;
};

export default function Dashboard({ onStartFlashcards, onStartQuiz }: Props) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);

  const loadData = useCallback(async () => {
    const [p, d, l, t] = await Promise.all([
      getProgress(TOTAL_CARDS),
      getDueCount(),
      getDailyLogs(30),
      getTodayLog(),
    ]);
    setProgress(p);
    setDueCount(d);
    setLogs(l);
    setTodayLog(t);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!progress) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const masteryPct =
    progress.totalItems > 0
      ? Math.round((progress.masteredCount / progress.totalItems) * 100)
      : 0;

  const todayAccuracy =
    todayLog && todayLog.cardsReviewed > 0
      ? Math.round((todayLog.correctCount / todayLog.cardsReviewed) * 100)
      : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5 md:gap-3">
        <button
          type="button"
          onClick={onStartFlashcards}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm press md:flex-row md:items-center md:gap-4 md:p-5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 transition-colors group-hover:bg-primary/15 md:h-11 md:w-11">
            <Zap size={18} className="text-primary/70" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground md:text-sm">Flashcards</p>
            <p className="mt-0.5 text-[11px] text-muted md:text-xs">
              {dueCount > 0 ? (
                <>
                  <span className="font-semibold text-warning">{dueCount}</span> due
                </>
              ) : (
                "Practice cards"
              )}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onStartQuiz}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm press md:flex-row md:items-center md:gap-4 md:p-5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 transition-colors group-hover:bg-success/20 md:h-11 md:w-11">
            <Sparkles size={18} className="text-success" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground md:text-sm">Quiz</p>
            <p className="mt-0.5 text-[11px] text-muted md:text-xs">
              Test your knowledge
            </p>
          </div>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        <StatCard
          icon={<Flame size={16} className="text-warning" />}
          label="Streak"
          value={`${progress.currentStreak}d`}
          sub={progress.longestStreak > 0 ? `Best: ${progress.longestStreak}d` : undefined}
        />
        <StatCard
          icon={<Trophy size={16} className="text-success" />}
          label="Mastered"
          value={`${masteryPct}%`}
          sub={`${progress.masteredCount}/${progress.totalItems}`}
        />
        <StatCard
          icon={<BookOpen size={16} className="text-primary/70" />}
          label="Learning"
          value={String(progress.learningCount)}
          sub={`${progress.newCount} new`}
        />
        <StatCard
          icon={<Clock size={16} className="text-muted" />}
          label="Today"
          value={String(todayLog?.cardsReviewed ?? 0)}
          sub={todayLog && todayLog.cardsReviewed > 0 ? `${todayAccuracy}% acc` : undefined}
        />
      </div>

      {/* Level progress */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 md:p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-foreground md:mb-4 md:text-sm">Level Progress</h3>
        <div className="space-y-3.5 md:space-y-4">
          {LEVELS.map((lvl) => {
            const levelCards = lvl.units.reduce((acc, u) => acc + u.cards.length, 0);
            const bd = progress.levelBreakdown[lvl.level];
            const masteredInLevel = bd?.mastered ?? 0;
            const learningInLevel = bd?.learning ?? 0;
            const pct = levelCards > 0 ? Math.round((masteredInLevel / levelCards) * 100) : 0;

            return (
              <div key={lvl.level}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className={cn(
                      "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                      lvl.level === 1 && "bg-blue-500/10 text-blue-500",
                      lvl.level === 2 && "bg-emerald-500/10 text-emerald-500",
                      lvl.level === 3 && "bg-amber-500/10 text-amber-500",
                      lvl.level === 4 && "bg-purple-500/10 text-purple-500",
                    )}>
                      {lvl.level}
                    </span>
                    <span className="text-xs font-medium text-foreground/80">{lvl.title_en}</span>
                    <span className="hidden text-[10px] text-muted/50 md:inline" dir="rtl">{lvl.title_fa}</span>
                  </div>
                  <span className="text-[10px] tabular-nums text-muted">
                    {masteredInLevel}/{levelCards}
                    {learningInLevel > 0 && <span className="hidden text-primary/50 md:inline"> · {learningInLevel} learning</span>}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-accent">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      lvl.level === 1 && "bg-blue-500",
                      lvl.level === 2 && "bg-emerald-500",
                      lvl.level === 3 && "bg-amber-500",
                      lvl.level === 4 && "bg-purple-500",
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 * lvl.level }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 md:p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-foreground md:mb-4 md:text-sm">
          Last 30 Days
        </h3>
        <HeatmapGrid logs={logs} />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border/60 bg-card p-3 md:p-4"
    >
      <div className="mb-1.5 flex items-center gap-1.5 md:mb-2 md:gap-2">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted md:text-[11px]">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold tabular-nums text-foreground md:text-xl">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted/60">{sub}</p>}
    </motion.div>
  );
}

function HeatmapGrid({ logs }: { logs: DailyLog[] }) {
  const logMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of logs) m.set(l.date, l.cardsReviewed);
    return m;
  }, [logs]);

  const days = useMemo(() => {
    const arr: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const ds = d.toISOString().slice(0, 10);
      arr.push({ date: ds, count: logMap.get(ds) ?? 0 });
    }
    return arr;
  }, [logMap]);

  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="flex flex-wrap gap-[3px] md:gap-1">
      {days.map((d) => {
        const intensity = d.count / maxCount;
        return (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} cards`}
            className={cn(
              "h-3.5 w-3.5 rounded-[3px] transition-colors md:h-4 md:w-4",
              d.count === 0 ? "bg-accent" : ""
            )}
            style={
              d.count > 0
                ? {
                    backgroundColor: `color-mix(in srgb, var(--success) ${Math.round(
                      20 + intensity * 80
                    )}%, var(--accent))`,
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
