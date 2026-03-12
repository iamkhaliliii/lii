"use client";
import { ToneAnalysis } from "@/types";

const formalityLabels: Record<string, string> = {
  formal: "Formal",
  "semi-formal": "Semi-formal",
  informal: "Informal",
  casual: "Casual",
};

const sentimentLabels: Record<string, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  urgent: "Urgent",
};

const formalityColors: Record<string, string> = {
  formal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "semi-formal": "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  informal: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  casual: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  urgent: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

interface ToneIndicatorProps {
  tone: ToneAnalysis;
}

export default function ToneIndicator({ tone }: ToneIndicatorProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium text-muted">Tone Analysis</h3>
      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${formalityColors[tone.formality] || ""}`}
        >
          {formalityLabels[tone.formality] || tone.formality}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${sentimentColors[tone.sentiment] || ""}`}
        >
          {sentimentLabels[tone.sentiment] || tone.sentiment}
        </span>
        {tone.likelySender && (
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Sender: {tone.likelySender}
          </span>
        )}
      </div>
      {tone.context && (
        <p className="mt-2 text-sm text-muted">{tone.context}</p>
      )}
      {tone.suggestedResponseTone && (
        <p className="mt-1 text-sm text-muted">
          Suggested response tone: <span className="font-medium text-foreground">{tone.suggestedResponseTone}</span>
        </p>
      )}
    </div>
  );
}
