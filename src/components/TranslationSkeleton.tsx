"use client";

export default function TranslationSkeleton() {
  return (
    <div className="animate-fade-in space-y-3">
      {/* Result skeleton */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 border-l-2 border-border pl-4">
          <div className="shimmer mb-2 h-4 w-4/5 rounded" />
          <div className="shimmer mb-2 h-4 w-3/5 rounded" />
          <div className="shimmer h-4 w-2/5 rounded" />
        </div>
        <div className="flex gap-2 border-t border-border-subtle pt-3">
          <div className="shimmer h-7 w-7 rounded-lg" />
          <div className="shimmer h-7 w-7 rounded-lg" />
          <div className="flex-1" />
          <div className="shimmer h-5 w-14 rounded-full" />
        </div>
      </div>

      {/* Tone skeleton */}
      <div className="flex gap-1.5">
        <div className="shimmer h-6 w-16 rounded-full" />
        <div className="shimmer h-6 w-20 rounded-full" />
      </div>

      {/* Suggestions skeleton */}
      <div className="space-y-2">
        <div className="shimmer h-3 w-24 rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="shimmer mb-1.5 h-3.5 w-4/5 rounded" />
            <div className="shimmer h-3 w-3/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
