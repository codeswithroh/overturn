"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TIER } from "./charts";
import { Chip, Icon, Logo } from "./ui";
import { useAppeal } from "./useAppeal";
import { DeadlinesView, EvidenceView, HistoryView, Intake, LetterView, Overview, type View } from "./views";

const NAV: { id: View; label: string; icon: string; needsCase?: boolean }[] = [
  { id: "overview", label: "Dashboard", icon: "grid" },
  { id: "letter", label: "Letter", icon: "letter", needsCase: true },
  { id: "evidence", label: "Evidence", icon: "search", needsCase: true },
  { id: "deadlines", label: "Deadlines", icon: "calendar", needsCase: true },
  { id: "history", label: "History", icon: "clock" },
];

const TITLES: Record<View, string> = {
  overview: "Dashboard",
  letter: "Appeal letter",
  evidence: "Evidence",
  deadlines: "Deadlines",
  history: "History",
};

export default function Dashboard() {
  const a = useAppeal();
  const [view, setView] = useState<View>("overview");
  const params = useSearchParams();
  const autoRan = useRef(false);

  // Landing page "Try a sample" links open /app?sample=<id> and start immediately.
  useEffect(() => {
    const s = params.get("sample");
    if (s && !autoRan.current) {
      autoRan.current = true;
      a.run({ sampleId: s });
    }
  }, [params, a]);

  const hasCase = a.phase !== "empty";
  const facts = a.result.facts;

  const newAppeal = () => {
    a.reset();
    setView("overview");
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-card px-4 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">Overturn</span>
        </Link>
        <nav className="mt-10 space-y-1">
          {NAV.map((n) => {
            const disabled = n.needsCase && !hasCase;
            const active = view === n.id;
            return (
              <button
                key={n.id}
                disabled={disabled}
                onClick={() => setView(n.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-accent font-medium text-white shadow-[0_8px_16px_-10px_var(--accent)]" : "text-ink-2 hover:bg-soft"
                } disabled:cursor-not-allowed disabled:opacity-35`}
              >
                <Icon name={n.icon} className="size-[18px]" />
                {n.label}
                {n.id === "history" && a.history.length > 0 && (
                  <span className={`ml-auto text-xs ${active ? "text-white/80" : "text-ink-3"}`}>{a.history.length}</span>
                )}
              </button>
            );
          })}
        </nav>
        <button
          onClick={newAppeal}
          className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-sm font-medium text-ink-2 hover:border-accent hover:text-accent"
        >
          <Icon name="plus" className="size-4" /> New appeal
        </button>
        <div className="mt-auto rounded-2xl bg-ink p-4 text-white">
          <p className="text-xs text-white/60">Running on</p>
          <p className="mt-1 text-sm font-medium">NVIDIA Nemotron</p>
          <p className="text-xs text-white/60">via Nebius Token Factory</p>
          <div className="mt-3 flex gap-1">
            {(["nano", "super", "ultra", "vision", "tavily"] as const).map((t) => (
              <span key={t} title={TIER[t].label} className="h-1.5 flex-1 rounded-full" style={{ background: TIER[t].color }} />
            ))}
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-4 sm:px-8">
            <Link href="/" className="lg:hidden">
              <Logo size={26} />
            </Link>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{TITLES[view]}</h1>
            {facts && (
              <span className="hidden min-w-0 items-center gap-2 md:flex">
                <span className="text-ink-3">/</span>
                <span className="truncate text-sm text-ink-2">{facts.insurer}</span>
                {facts.claimNumber && <span className="font-mono text-xs text-ink-3">#{facts.claimNumber}</span>}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {a.replay && <Chip tone="warn">Recorded run</Chip>}
              {hasCase && (
                <button onClick={newAppeal} className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-white">
                  <Icon name="plus" className="size-4" />
                  <span className="hidden sm:inline">New appeal</span>
                </button>
              )}
            </div>
          </div>
          {/* mobile nav */}
          <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
            {NAV.map((n) => (
              <button
                key={n.id}
                disabled={n.needsCase && !hasCase}
                onClick={() => setView(n.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${
                  view === n.id ? "bg-accent text-white" : "bg-card text-ink-2"
                } disabled:opacity-35`}
              >
                <Icon name={n.icon} className="size-4" />
                {n.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-8">
          {a.error && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-bad-soft px-4 py-3 text-sm text-bad">
              <span className="font-semibold">!</span>
              {a.error}
            </div>
          )}
          {view === "overview" &&
            (hasCase ? (
              <Overview
                r={a.result}
                steps={a.steps}
                traces={a.traces}
                elapsed={a.elapsed}
                running={a.phase === "running"}
                go={setView}
              />
            ) : (
              <Intake onRun={a.run} history={a.history} onOpen={a.open} />
            ))}
          {view === "letter" && <LetterView r={a.result} />}
          {view === "evidence" && <EvidenceView r={a.result} />}
          {view === "deadlines" && <DeadlinesView r={a.result} />}
          {view === "history" && (
            <HistoryView
              history={a.history}
              onOpen={(x) => {
                a.open(x);
                setView("overview");
              }}
            />
          )}
          <p className="no-print mt-10 text-center text-xs text-ink-3">Drafting help, not legal or medical advice.</p>
        </main>
      </div>
    </div>
  );
}
