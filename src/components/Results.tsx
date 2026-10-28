"use client";

import { useState } from "react";
import { toIcs } from "@/lib/timeline";
import type { AppealResult, Check } from "@/lib/types";

type Tab = "summary" | "letter" | "evidence" | "timeline";

const VERDICT_STYLE: Record<Check["verdict"], string> = {
  supported: "decoration-accent",
  partial: "decoration-warn",
  unsupported: "decoration-bad",
};

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export function Results({ r }: { r: Partial<AppealResult> }) {
  const [tab, setTab] = useState<Tab>("summary");
  const tabs: { id: Tab; label: string; ready: boolean }[] = [
    { id: "summary", label: "What happened", ready: !!r.facts },
    { id: "letter", label: "Appeal letter", ready: !!r.letter },
    { id: "evidence", label: `Evidence${r.sources ? ` (${r.sources.length})` : ""}`, ready: !!r.sources },
    { id: "timeline", label: "Deadlines", ready: !!r.timeline },
  ];

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="no-print flex gap-1 overflow-x-auto border-b border-line px-2 pt-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            disabled={!t.ready}
            onClick={() => setTab(t.id)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t.id ? "border-accent font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"
            } disabled:cursor-not-allowed disabled:text-ink-3/60`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-5 sm:p-7">
        {tab === "summary" && <Summary r={r} onNext={() => r.letter && setTab("letter")} />}
        {tab === "letter" && <Letter r={r} />}
        {tab === "evidence" && <Evidence r={r} />}
        {tab === "timeline" && <Timeline r={r} />}
      </div>
    </div>
  );
}

function Summary({ r, onNext }: { r: Partial<AppealResult>; onNext: () => void }) {
  const f = r.facts;
  if (!f) return <Skeleton />;
  const rows: [string, string | null][] = [
    ["Insurer", f.insurer],
    ["Plan type", f.planType.replace("_", " ")],
    ["Service", f.serviceDenied],
    ["Codes", [...f.procedureCodes, ...f.diagnosisCodes].join(", ") || null],
    ["Denial type", f.denialCategory.replace("_", " ")],
    ["Criteria cited", f.criteriaCited],
    ["Reference #", f.claimNumber],
  ];
  return (
    <div className="rise space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-3">In plain English</p>
        <p className="mt-2 font-display text-xl leading-snug sm:text-2xl">{f.plainEnglish}</p>
      </div>
      <blockquote className="border-l-2 border-line pl-4 text-sm italic text-ink-2">“{f.denialReasonQuote}”</blockquote>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-ink-3">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {r.strategy && (
        <div className="rounded-xl bg-accent-soft/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">How we&apos;ll fight it</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {r.strategy.split("\n").filter((l) => l.trim()).map((l, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">→</span>
                <span>{l.replace(/^[-*•]\s*/, "").replace(/\s*\[S\d+\]/g, "")}</span>
              </li>
            ))}
          </ul>
          {r.letter && (
            <button onClick={onNext} className="mt-3 text-sm font-medium text-accent underline underline-offset-4">
              Read the appeal letter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Letter({ r }: { r: Partial<AppealResult> }) {
  const [copied, setCopied] = useState(false);
  if (!r.letter) return <Skeleton />;
  const checks = new Map((r.checks ?? []).map((c) => [c.sentence, c]));
  const counts = { supported: 0, partial: 0, unsupported: 0 };
  r.checks?.forEach((c) => counts[c.verdict]++);
  const plain = r.letter.replace(/\s*\[S\d+\]/g, "");

  return (
    <div className="rise">
      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(plain).then(() => setCopied(true))}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
        >
          {copied ? "Copied" : "Copy letter"}
        </button>
        <button onClick={() => window.print()} className="rounded-lg border border-line px-3 py-1.5 text-sm">
          Print / PDF
        </button>
        <button
          onClick={() => download("appeal-letter.txt", plain, "text/plain")}
          className="rounded-lg border border-line px-3 py-1.5 text-sm"
        >
          Download .txt
        </button>
        {r.checks && (
          <span className="ml-auto text-xs text-ink-2">
            <span className="text-accent">●</span> {counts.supported} verified ·{" "}
            <span className="text-warn">●</span> {counts.partial} partly ·{" "}
            <span className="text-bad">●</span> {counts.unsupported} unsupported
          </span>
        )}
      </div>
      <article className="mx-auto max-w-[68ch] whitespace-pre-wrap font-display text-[15px] leading-7">
        {r.letter.split(/\n/).map((line, li) => (
          <p key={li} className={line.trim() ? "" : "h-4"}>
            {line.split(/(?<=[.!?])\s+(?=[A-Z[])/).map((s, si) => {
              const c = checks.get(s.trim());
              return (
                <span key={si}>
                  {si > 0 && " "}
                  <span
                    className={c ? `underline decoration-2 underline-offset-4 ${VERDICT_STYLE[c.verdict]}` : ""}
                    title={c ? `${c.verdict}: ${c.note}` : undefined}
                  >
                    {s.split(/(\[S\d+\])/).map((part, pi) =>
                      /^\[S\d+\]$/.test(part) ? (
                        <sup key={pi} className="ml-0.5 rounded bg-surface-2 px-1 font-sans text-[10px] text-ink-2">
                          {part.slice(1, -1)}
                        </sup>
                      ) : (
                        <Placeholder key={pi} text={part} />
                      ),
                    )}
                  </span>
                </span>
              );
            })}
          </p>
        ))}
      </article>
      {r.missing && r.missing.length > 0 && (
        <div className="no-print mt-8 rounded-xl border border-warn/40 bg-warn-soft/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-warn">Attach these to win</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {r.missing.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Highlight [ATTACH: …] placeholders the member must fill in.
function Placeholder({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[ATTACH:[^\]]*\])/).map((p, i) =>
        p.startsWith("[ATTACH:") ? (
          <mark key={i} className="rounded bg-warn-soft px-1 font-sans text-[13px] text-warn">
            {p.slice(8, -1).trim()}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

function Evidence({ r }: { r: Partial<AppealResult> }) {
  if (!r.sources) return <Skeleton />;
  return (
    <div className="rise space-y-6">
      {r.queries && (
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-3">What we searched for</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {r.queries.map((q, i) => (
              <li key={i} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2" title={q.purpose}>
                {q.q}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ol className="space-y-4">
        {r.sources.map((s) => (
          <li key={s.id} className="rounded-xl border border-line p-4">
            <div className="flex items-start gap-3">
              <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">{s.id}</span>
              <div className="min-w-0">
                <a href={s.url} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
                  {s.title}
                </a>
                <p className="truncate text-xs text-ink-3">{s.url}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {s.facts.map((f, i) => (
                <li key={i}>
                  <p>{f.claim}</p>
                  <p className="mt-0.5 border-l-2 border-accent/50 pl-2 text-xs italic text-ink-2">“{f.quote}”</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Timeline({ r }: { r: Partial<AppealResult> }) {
  if (!r.timeline || !r.facts) return <Skeleton />;
  const fmt = (d: string) =>
    new Date(d + "T12:00:00Z").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  return (
    <div className="rise">
      <button
        onClick={() => download("appeal-deadlines.ics", toIcs(r.timeline!, r.facts!.insurer), "text/calendar")}
        className="no-print mb-6 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
      >
        Add all to calendar (.ics)
      </button>
      <ol className="relative space-y-6 border-l border-line pl-6">
        {r.timeline.map((t, i) => (
          <li key={i} className="relative">
            <span
              className={`absolute -left-[31px] top-1 size-3 rounded-full border-2 border-surface ${
                t.kind === "deadline" ? "bg-bad" : t.kind === "action" ? "bg-accent" : "bg-ink-3"
              }`}
            />
            <p className="font-mono text-xs text-ink-3">{fmt(t.date)}</p>
            <p className="font-medium">{t.title}</p>
            <p className="mt-0.5 text-sm text-ink-2">{t.detail}</p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-xs text-ink-3">
        Deadlines follow federal defaults (ACA and ERISA: 180 days to appeal, 4 months for external review; Medicare Advantage: 65 days;
        Medicaid: 60 days). The deadline printed on your letter always takes priority.
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[80, 95, 60, 88].map((w, i) => (
        <div key={i} className="pulse h-3 rounded bg-surface-2" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
