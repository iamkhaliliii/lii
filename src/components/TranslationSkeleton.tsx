"use client";

export default function TranslationSkeleton() {
  return (
    <div className="animate-fade-in space-y-4">
      {/* Translation result skeleton */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="space-y-3">
          <div className="shimmer h-4 w-3/4 rounded-lg" />
          <div className="shimmer h-4 w-full rounded-lg" />
          <div className="shimmer h-4 w-2/3 rounded-lg" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="shimmer h-8 w-16 rounded-lg" />
          <div className="shimmer h-8 w-16 rounded-lg" />
        </div>
      </div>

      {/* Tone indicator skeleton */}
      <div className="flex gap-2">
        <div className="shimmer h-7 w-20 rounded-full" />
        <div className="shimmer h-7 w-24 rounded-full" />
        <div className="shimmer h-7 w-28 rounded-full" />
      </div>

      {/* Suggestions skeleton */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="shimmer mb-3 h-4 w-36 rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-accent p-3">
              <div className="shimmer h-4 w-full rounded-lg" />
              <div className="shimmer mt-2 h-3 w-2/3 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
