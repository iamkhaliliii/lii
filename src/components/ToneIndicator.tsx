"use client";
import { ToneAnalysis } from "@/types";
import { Gauge, Smile, User } from "lucide-react";

interface ToneIndicatorProps {
  tone: ToneAnalysis;
}

export default function ToneIndicator({ tone }: ToneIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Formality */}
      <span className="flex items-center gap-1 rounded-full bg-primary-muted px-2 py-0.5 text-[11px] font-medium text-primary">
        <Gauge size={10} />
        {tone.formality}
      </span>

      {/* Sentiment */}
      <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <Smile size={10} />
        {tone.sentiment}
      </span>

      {/* Likely sender */}
      {tone.likelySender && (
        <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <User size={10} />
          {tone.likelySender}
        </span>
      )}

      {/* Context */}
      {tone.context && (
        <>
          <span className="text-border">·</span>
          <span className="text-[11px] text-muted">{tone.context}</span>
        </>
      )}
    </div>
  );
}
