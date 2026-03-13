"use client";
import { ToneAnalysis } from "@/types";

const formalityColors: Record<string, string> = {
  formal: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
  "semi-formal":
    "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200",
  informal:
    "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200",
  casual:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
};

const sentimentColors: Record<string, string> = {
  positive:
    "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  negative: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200",
  urgent:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200",
};

interface ToneIndicatorProps {
  tone: ToneAnalysis;
}

export default function ToneIndicator({ tone }: ToneIndicatorProps) {
  return (
    <div className="animate-fade-in stagger-2 flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${formalityColors[tone.formality] || ""}`}
      >
        {tone.formality}
      </span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${sentimentColors[tone.sentiment] || ""}`}
      >
        {tone.sentiment}
      </span>
      {tone.likelySender && (
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
          {tone.likelySender}
        </span>
      )}
      {tone.context && (
        <span className="text-xs text-muted">&middot; {tone.context}</span>
      )}
    </div>
  );
}
