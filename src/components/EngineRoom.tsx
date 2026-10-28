"use client";

import type { StepId, Tier, Trace } from "@/lib/types";

export const TIER_LABEL: Record<Tier, string> = {
  vision: "Nemotron 3.5 Super VL",
  nano: "Nemotron 3 Nano",
  super: "Nemotron 3 Super",
  ultra: "Nemotron 3 Ultra",
  tavily: "Tavily Search",
};

export const STEPS: { id: StepId; title: string; who: string; why: string }[] = [
  { id: "read", title: "Read the letter", who: "Nano · or Super VL for photos", why: "Structured extraction is cheap work" },
  { id: "plan", title: "Plan the research", who: "Super", why: "Knows what evidence beats this denial type" },
  { id: "research", title: "Find the evidence", who: "Tavily + Nano per source", why: "Many small calls, verbatim quotes only" },
  { id: "argue", title: "Write the argument", who: "Ultra, reasoning on", why: "The one step worth the expensive model" },
  { id: "verify", title: "Check every citation", who: "Nano", why: "Each cited sentence vs. its source" },
  { id: "timeline", title: "Set the deadlines", who: "Rules engine", why: "Federal appeal windows, no model needed" },
];

export type StepState = { status: "idle" | "running" | "done" | "error"; detail?: string };

function Dot({ tier }: { tier: Tier }) {
  return <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: `var(--t-${tier})` }} />;
}

export function Pipeline({ steps }: { steps: Record<StepId, StepState> }) {
  return (
    <ol className="space-y-1">
      {STEPS.map((s, i) => {
        const st = steps[s.id];
        return (
          <li key={s.id} className="flex gap-3 rounded-lg px-2 py-2">
            <span
              className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-xs font-medium ${
                st.status === "done"
                  ? "border-accent bg-accent text-accent-ink"
                  : st.status === "running"
                    ? "border-accent text-accent"
                    : st.status === "error"
                      ? "border-bad text-bad"
                      : "border-line text-ink-3"
              }`}
            >
              {st.status === "done" ? "✓" : st.status === "error" ? "!" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-sm font-medium ${st.status === "idle" ? "text-ink-3" : ""}`}>{s.title}</span>
                {st.status === "running" && <span className="pulse text-xs text-accent">working</span>}
              </div>
              <div className="text-xs text-ink-3">
                {st.detail && st.status !== "running" ? (
                  <span className={st.status === "error" ? "text-bad" : "text-ink-2"}>{st.detail}</span>
                ) : (
                  <>
                    {s.who} — {s.why}
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function EngineRoom({ traces, elapsed }: { traces: Trace[]; elapsed: number }) {
  const total = traces.reduce((a, t) => a + t.cost, 0);
  const tokens = traces.reduce((a, t) => a + t.inTok + t.outTok, 0);
  const byTier = (["vision", "nano", "super", "ultra", "tavily"] as Tier[])
    .map((tier) => {
      const ts = traces.filter((t) => t.tier === tier);
      return { tier, n: ts.length, cost: ts.reduce((a, t) => a + t.cost, 0), tok: ts.reduce((a, t) => a + t.inTok + t.outTok, 0) };
    })
    .filter((x) => x.n);
  const llm = byTier.filter((x) => x.tier !== "tavily");
  const llmTok = llm.reduce((a, x) => a + x.tok, 0) || 1;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Cost so far" value={`$${total.toFixed(total < 0.1 ? 4 : 3)}`} strong />
        <Stat label="Model calls" value={String(traces.length)} />
        <Stat label="Elapsed" value={`${(elapsed / 1000).toFixed(1)}s`} />
      </div>

      {llm.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-ink-3">
            <span>Tokens by model</span>
            <span className="font-mono">{tokens.toLocaleString()}</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
            {llm.map((x) => (
              <div key={x.tier} style={{ width: `${(x.tok / llmTok) * 100}%`, background: `var(--t-${x.tier})` }} title={TIER_LABEL[x.tier]} />
            ))}
          </div>
          <ul className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
            {byTier.map((x) => (
              <li key={x.tier} className="flex items-center gap-1.5 text-ink-2">
                <Dot tier={x.tier} />
                <span className="truncate">{TIER_LABEL[x.tier]}</span>
                <span className="ml-auto font-mono text-ink-3">
                  {x.n}× · ${x.cost.toFixed(4)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-line bg-surface-2/50 font-mono text-[11px] leading-5">
        {traces.length === 0 ? (
          <div className="px-3 py-3 text-ink-3">Model calls will appear here as they happen.</div>
        ) : (
          traces.map((t, i) => (
            <div key={i} className="rise flex items-center gap-2 border-b border-line/60 px-3 py-1 last:border-0">
              <Dot tier={t.tier} />
              <span className="w-16 shrink-0 text-ink-3">{t.step}</span>
              <span className="min-w-0 flex-1 truncate">{t.model}</span>
              <span className="w-12 shrink-0 text-right text-ink-3">{(t.ms / 1000).toFixed(1)}s</span>
              <span className="hidden w-14 shrink-0 text-right text-ink-3 sm:inline">{t.inTok + t.outTok ? `${t.inTok + t.outTok}t` : "—"}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-ink-3">{label}</div>
      <div className={`font-mono text-lg tabular-nums ${strong ? "text-accent" : ""}`}>{value}</div>
    </div>
  );
}
