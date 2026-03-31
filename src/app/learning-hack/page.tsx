"use client";

import { useCallback, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Lightbulb,
  Copy,
  Check,
  Shuffle,
  Search,
  ChevronDown,
  ChevronRight,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import {
  DESIGN_REVIEW_SECTIONS,
  DESIGN_REVIEW_PHRASES,
  FLUENT_FLOW_CATEGORIES,
  TENSION_PHRASES,
  TRANSITION_PHRASES,
  EMERGENCY_PHRASES,
  ACCOUNTABILITY_PHRASES,
  SELF_ADVOCACY_PHRASES,
  TIMEZONE_PHRASES,
  POWER_VERB_ROWS,
  GLOSSARY_ENTRIES,
  GLOSSARY_PACK_LABELS,
} from "@/data/learning-hack";
import type { HackTemplate, TemplateTone } from "@/types/learning-hack";
import {
  applyVariables,
  randomFillVariables,
  variableKeysFromPattern,
} from "@/lib/learning-hack-utils";

type MainTab = "design" | "fluent" | "playbooks" | "power" | "glossary";

const TONE_OPTIONS: { id: TemplateTone | "all"; label: string }[] = [
  { id: "all", label: "All tones" },
  { id: "formal", label: "Formal" },
  { id: "collaborative", label: "Collaborative" },
  { id: "assertive", label: "Assertive" },
  { id: "casual", label: "Casual" },
  { id: "strategic", label: "Strategic" },
];

function tonesMatch(
  meta: { tone?: TemplateTone | TemplateTone[] } | undefined,
  filter: TemplateTone | "all"
): boolean {
  if (!meta?.tone || filter === "all") return true;
  const t = meta.tone;
  return Array.isArray(t) ? t.includes(filter) : t === filter;
}

/** Matches Transcript / main app copy control */
function CopyMini({ text, label }: { text: string; label?: string }) {
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
      {label || (copied ? "Copied" : "Copy")}
    </button>
  );
}

/** Same collapsible pattern as Transcript `Section` */
function HackSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-accent/20"
      >
        {open ? (
          <ChevronDown size={13} className="shrink-0 text-muted/30" />
        ) : (
          <ChevronRight size={13} className="shrink-0 text-muted/30" />
        )}
        <div className="min-w-0 flex-1">
          <span className="text-[13px] font-semibold text-foreground/90">{title}</span>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-snug text-muted/70">{subtitle}</p>
          ) : null}
        </div>
        {badge !== undefined ? (
          <span className="shrink-0 rounded-full bg-accent/80 px-2.5 py-0.5 text-[10px] font-semibold text-muted/50 tabular-nums">
            {badge}
          </span>
        ) : null}
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
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

function TemplateBlock({ template }: { template: HackTemplate }) {
  const keys = useMemo(
    () => variableKeysFromPattern(template.pattern_en),
    [template.pattern_en]
  );
  const [values, setValues] = useState<Record<string, string>>(() =>
    randomFillVariables(template.variables)
  );
  const builtEn = applyVariables(template.pattern_en, values);
  const builtFa = applyVariables(template.pattern_fa, values);

  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[9px] text-muted/50">{template.id}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setValues(randomFillVariables(template.variables))}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-muted/50 transition-colors hover:text-foreground"
          >
            <Shuffle size={11} />
            Randomize
          </button>
          <span className="text-muted/20">·</span>
          <CopyMini text={builtEn} label="EN" />
          <CopyMini text={`${builtEn}\n\n${builtFa}`} label="Both" />
        </div>
      </div>
      {keys.length > 0 ? (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {keys.map((k) => {
            const opts = template.variables[k] || [];
            return (
              <label key={k} className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted/50">
                  {k.replace(/_/g, " ")}
                </span>
                <Select
                  size="sm"
                  value={values[k] ?? opts[0] ?? ""}
                  onValueChange={(v) => setValues((prev) => ({ ...prev, [k]: v }))}
                  options={opts.map((o) => ({ value: o, label: o }))}
                  className="w-full"
                  aria-label={k.replace(/_/g, " ")}
                />
              </label>
            );
          })}
        </div>
      ) : null}
      <p className="text-sm leading-relaxed text-foreground">{builtEn}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted/75" dir="rtl">
        {builtFa}
      </p>
      {template.metadata?.tone ? (
        <p className="mt-2 text-[10px] text-muted/45">
          {Array.isArray(template.metadata.tone)
            ? template.metadata.tone.join(" · ")
            : template.metadata.tone}
          {template.metadata.use_case
            ? ` · ${template.metadata.use_case.replace(/_/g, " ")}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}

const PLAYBOOK_GROUPS = [
  { id: "tension", title: "Scope & pushback", subtitle: "Diplomatic boundaries", items: TENSION_PHRASES },
  { id: "transition", title: "Transitions", subtitle: "Fillers & bridges", items: TRANSITION_PHRASES },
  { id: "emergency", title: "Recovery", subtitle: "Clarity when things break", items: EMERGENCY_PHRASES },
  { id: "accountability", title: "Accountability", subtitle: "Own outcomes calmly", items: ACCOUNTABILITY_PHRASES },
  { id: "advocacy", title: "Growth & reviews", subtitle: "Self-advocacy framing", items: SELF_ADVOCACY_PHRASES },
  { id: "timezone", title: "Timezone", subtitle: "Async handoffs", items: TIMEZONE_PHRASES },
] as const;

function EmptyHint({ message }: { message: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted/60">
      {message}
      <span className="mt-1 block text-[11px] text-muted/40">
        Clear search or set tone to “All tones”.
      </span>
    </p>
  );
}

export default function LearningHackPage() {
  const [tab, setTab] = useState<MainTab>("design");
  const [q, setQ] = useState("");
  const [tone, setTone] = useState<TemplateTone | "all">("all");
  const query = q.trim().toLowerCase();

  const filteredDesign = useMemo(() => {
    return DESIGN_REVIEW_PHRASES.filter((p) => {
      if (!tonesMatch(p.metadata, tone)) return false;
      if (!query) return true;
      return (
        p.en.toLowerCase().includes(query) ||
        p.fa.includes(query) ||
        p.id.toLowerCase().includes(query)
      );
    });
  }, [query, tone]);

  const fluentTemplateCount = useMemo(() => {
    let n = 0;
    for (const cat of FLUENT_FLOW_CATEGORIES) {
      for (const t of cat.templates) {
        if (!tonesMatch(t.metadata, tone)) continue;
        if (
          query &&
          !t.pattern_en.toLowerCase().includes(query) &&
          !t.pattern_fa.includes(query) &&
          !t.id.toLowerCase().includes(query) &&
          !cat.title_en.toLowerCase().includes(query) &&
          !cat.title_fa.includes(query)
        )
          continue;
        n++;
      }
    }
    return n;
  }, [query, tone]);

  const filteredPowerRows = useMemo(
    () =>
      POWER_VERB_ROWS.filter(
        (r) =>
          !query ||
          r.weak.toLowerCase().includes(query) ||
          r.strong.toLowerCase().includes(query) ||
          r.category_en.toLowerCase().includes(query) ||
          r.category_fa.includes(query)
      ),
    [query]
  );

  const glossaryVisibleCount = useMemo(
    () =>
      GLOSSARY_ENTRIES.filter(
        (e) =>
          !query ||
          e.term.toLowerCase().includes(query) ||
          e.definition_en.toLowerCase().includes(query) ||
          e.definition_fa.includes(query)
      ).length,
    [query]
  );

  const tabCounts = useMemo(
    () => ({
      design: DESIGN_REVIEW_PHRASES.length,
      fluent: FLUENT_FLOW_CATEGORIES.reduce((acc, c) => acc + c.templates.length, 0),
      playbooks: PLAYBOOK_GROUPS.reduce((acc, g) => acc + g.items.length, 0),
      power: POWER_VERB_ROWS.length,
      glossary: GLOSSARY_ENTRIES.length,
    }),
    []
  );

  const mainTabs: { id: MainTab; label: string }[] = [
    { id: "design", label: "Review" },
    { id: "fluent", label: "Templates" },
    { id: "playbooks", label: "Playbooks" },
    { id: "power", label: "Verbs" },
    { id: "glossary", label: "Glossary" },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {/* Page header — aligned with Settings */}
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8">
              <Lightbulb size={15} className="text-primary/60" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-foreground">Learning Hack</h1>
              <p className="mt-0.5 text-sm text-muted">
                Design-review language, templates, and glossary—same layout as the rest of lii.
              </p>
            </div>
          </div>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted/60">
            Library
          </p>
          <div className="mb-5 flex gap-0.5 border-b border-border">
            {mainTabs.map(({ id, label }) => {
              const active = tab === id;
              const count = tabCounts[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-colors",
                    active ? "text-primary" : "text-muted hover:text-foreground"
                  )}
                >
                  <span>{label}</span>
                  <span
                    className={cn(
                      "ml-1 tabular-nums text-[10px] font-semibold",
                      active ? "text-primary/50" : "text-muted/40"
                    )}
                  >
                    {count}
                  </span>
                  {active ? (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted/60">
            Search & tone
          </p>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted/50"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/10"
                aria-label="Search"
              />
            </div>
            <Select
              value={tone}
              onValueChange={(v) => setTone(v as TemplateTone | "all")}
              options={TONE_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
              aria-label="Tone filter"
              className="w-full shrink-0 sm:w-40"
            />
          </div>

          {tab === "design" && (
            <div className="space-y-3">
              {DESIGN_REVIEW_SECTIONS.map((sec) => {
                const items = filteredDesign.filter((p) => p.section_id === sec.id);
                if (items.length === 0) return null;
                return (
                  <HackSection
                    key={sec.id}
                    title={sec.title_en}
                    subtitle={sec.title_fa}
                    badge={items.length}
                    defaultOpen={sec.id === "opening_context"}
                  >
                    <div className="divide-y divide-border/30">
                      {items.map((p) => (
                        <div key={p.id} className="py-3.5 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-mono text-[9px] text-muted/45">{p.id}</span>
                            <div className="flex shrink-0 gap-1">
                              <CopyMini text={p.en} label="EN" />
                              <CopyMini text={`${p.en}\n\n${p.fa}`} label="Both" />
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-foreground">{p.en}</p>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted/70" dir="rtl">
                            {p.fa}
                          </p>
                        </div>
                      ))}
                    </div>
                  </HackSection>
                );
              })}
              {filteredDesign.length === 0 ? (
                <EmptyHint message="No phrases match." />
              ) : null}
            </div>
          )}

          {tab === "fluent" && (
            <div className="space-y-3">
              {FLUENT_FLOW_CATEGORIES.map((cat) => {
                const templates = cat.templates.filter(
                  (t) =>
                    tonesMatch(t.metadata, tone) &&
                    (!query ||
                      t.pattern_en.toLowerCase().includes(query) ||
                      t.pattern_fa.includes(query) ||
                      t.id.toLowerCase().includes(query) ||
                      cat.title_en.toLowerCase().includes(query) ||
                      cat.title_fa.includes(query))
                );
                if (templates.length === 0) return null;
                return (
                  <HackSection
                    key={cat.id}
                    title={cat.title_en}
                    subtitle={[cat.title_fa, cat.source].filter(Boolean).join(" · ")}
                    badge={templates.length}
                  >
                    <div className="divide-y divide-border/30">
                      {templates.map((t) => (
                        <TemplateBlock key={t.id} template={t} />
                      ))}
                    </div>
                  </HackSection>
                );
              })}
              {fluentTemplateCount === 0 ? (
                <EmptyHint message="No templates match." />
              ) : null}
            </div>
          )}

          {tab === "playbooks" && (
            <div className="space-y-3">
              {PLAYBOOK_GROUPS.map((g) => {
                const filtered = g.items.filter(
                  (p) =>
                    tonesMatch(p.metadata, tone) &&
                    (!query || p.en.toLowerCase().includes(query) || p.fa.includes(query))
                );
                if (filtered.length === 0) return null;
                return (
                  <HackSection key={g.id} title={g.title} subtitle={g.subtitle} badge={filtered.length}>
                    <div className="divide-y divide-border/30">
                      {filtered.map((p) => (
                        <div key={p.id} className="py-3.5 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-mono text-[9px] text-muted/45">{p.id}</span>
                            <div className="flex gap-1">
                              <CopyMini text={p.en} label="EN" />
                              <CopyMini text={`${p.en}\n\n${p.fa}`} label="Both" />
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-foreground">{p.en}</p>
                          <div className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted/70" dir="rtl">
                            <Languages size={12} className="mt-0.5 shrink-0 opacity-40" />
                            <span>{p.fa}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </HackSection>
                );
              })}
              {PLAYBOOK_GROUPS.every((g) =>
                g.items.every(
                  (p) =>
                    !tonesMatch(p.metadata, tone) ||
                    (query && !p.en.toLowerCase().includes(query) && !p.fa.includes(query))
                )
              ) ? (
                <EmptyHint message="No playbook lines match." />
              ) : null}
            </div>
          )}

          {tab === "power" && (
            <div className="rounded-2xl border border-border/60 bg-card">
              <div className="divide-y divide-border/40">
                {filteredPowerRows.map((r) => (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted/50">
                          {r.category_en}
                        </p>
                        <p className="text-[10px] text-muted/40" dir="rtl">
                          {r.category_fa}
                        </p>
                      </div>
                      <CopyMini text={r.strong} label="Copy" />
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm">
                      <p className="text-muted/55 line-through decoration-muted-foreground/35">
                        {r.weak}
                      </p>
                      <p className="font-medium leading-relaxed text-foreground/95">{r.strong}</p>
                    </div>
                  </div>
                ))}
              </div>
              {filteredPowerRows.length === 0 ? (
                <div className="px-5 py-10">
                  <EmptyHint message="No verbs match." />
                </div>
              ) : null}
            </div>
          )}

          {tab === "glossary" && (
            <div className="space-y-3">
              {Object.keys(GLOSSARY_PACK_LABELS).map((packId) => {
                const entries = GLOSSARY_ENTRIES.filter(
                  (e) =>
                    e.pack_id === packId &&
                    (!query ||
                      e.term.toLowerCase().includes(query) ||
                      e.definition_en.toLowerCase().includes(query) ||
                      e.definition_fa.includes(query))
                );
                if (entries.length === 0) return null;
                const lab = GLOSSARY_PACK_LABELS[packId];
                return (
                  <HackSection key={packId} title={lab.en} subtitle={lab.fa} badge={entries.length}>
                    <div className="divide-y divide-border/30">
                      {entries.map((e) => (
                        <div key={e.id} className="py-3.5 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-foreground/95">{e.term}</p>
                            <CopyMini
                              text={`${e.term}\n${e.definition_en}${e.example_en ? `\n${e.example_en}` : ""}`}
                              label="Copy"
                            />
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted/80">{e.definition_en}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted/60" dir="rtl">
                            {e.definition_fa}
                          </p>
                          {e.example_en ? (
                            <p className="mt-2 text-[11px] italic text-muted/50">e.g. {e.example_en}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </HackSection>
                );
              })}
              {glossaryVisibleCount === 0 ? <EmptyHint message="No terms match." /> : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
