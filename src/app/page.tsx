"use client";

import { useEffect, useRef, useState } from "react";
import { EngineRoom, Pipeline, STEPS, type StepState } from "@/components/EngineRoom";
import { Results } from "@/components/Results";
import { SAMPLES } from "@/lib/samples";
import { buildTimeline } from "@/lib/timeline";
import type { AppealResult, PipelineEvent, StepId, Trace } from "@/lib/types";

type Phase = "input" | "running" | "done";
type Upload = { name: string; kind: "image" | "pdf"; dataUrl: string };

const idleSteps = () => Object.fromEntries(STEPS.map((s) => [s.id, { status: "idle" }])) as Record<StepId, StepState>;

export default function Home() {
  const [phase, setPhase] = useState<Phase>("input");
  const [text, setText] = useState("");
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [steps, setSteps] = useState(idleSteps);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [result, setResult] = useState<Partial<AppealResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [replay, setReplay] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(0);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setElapsed(Date.now() - started.current), 100);
    return () => clearInterval(id);
  }, [phase]);

  function pickSample(id: string) {
    const s = SAMPLES.find((x) => x.id === id)!;
    setSampleId(id);
    setText(s.text);
    setUpload(null);
  }

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () =>
      setUpload({ name: file.name, kind: file.type === "application/pdf" ? "pdf" : "image", dataUrl: reader.result as string });
    reader.readAsDataURL(file);
    setSampleId(null);
    setText("");
  }

  async function run() {
    setPhase("running");
    setSteps(idleSteps());
    setTraces([]);
    setResult({});
    setError(null);
    started.current = Date.now();
    setElapsed(0);

    const body = upload
      ? upload.kind === "pdf"
        ? { pdfDataUrl: upload.dataUrl }
        : { imageDataUrl: upload.dataUrl }
      : sampleId && SAMPLES.find((s) => s.id === sampleId)?.text === text
        ? { sampleId }
        : { text };

    const res = await fetch("/api/appeal", { method: "POST", body: JSON.stringify(body) });
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop()!;
      for (const line of lines) if (line.trim()) handle(JSON.parse(line) as PipelineEvent);
    }
    setElapsed(Date.now() - started.current);
    setPhase("done");
  }

  function handle(e: PipelineEvent) {
    switch (e.type) {
      case "mode":
        setReplay(e.replay);
        break;
      case "step":
        setSteps((s) => ({ ...s, [e.id]: { status: e.status, detail: e.detail } }));
        // Deadlines are deterministic, so recorded runs can rebuild them locally.
        if (e.id === "timeline" && e.status === "done")
          setResult((r) => (r.timeline || !r.facts ? r : { ...r, timeline: buildTimeline(r.facts) }));
        break;
      case "trace":
        setTraces((t) => [...t, e.trace]);
        break;
      case "partial":
        setResult((r) => ({ ...r, [e.key]: e.value }));
        break;
      case "error":
        setError(e.message);
        break;
    }
  }

  const canRun = Boolean(upload || text.trim().length > 40);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <header className="no-print flex items-center justify-between py-5">
        <button onClick={() => setPhase("input")} className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-xl font-semibold tracking-tight">Overturn</span>
        </button>
        <span className="hidden text-xs text-ink-3 sm:block">NVIDIA Nemotron · Nebius Token Factory · Tavily</span>
      </header>

      {phase === "input" ? (
        <section className="grid gap-10 pt-6 lg:grid-cols-[1fr_1.1fr] lg:pt-14">
          <div>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
              Your insurer said no.
              <br />
              <span className="text-accent">Make them read the evidence.</span>
            </h1>
            <p className="mt-5 max-w-md text-ink-2">
              Fewer than 1 in 100 denied claims are ever appealed, yet many appeals succeed. Upload your denial letter. In about a minute
              you get a plain-English explanation, a cited appeal letter and every deadline that matters.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-ink-2">
              {[
                ["Reads", "the letter, photo or PDF, and finds the exact reason you were denied"],
                ["Researches", "your insurer's policy, clinical guidelines and your legal appeal rights, live"],
                ["Argues", "point by point against that reason, citing only sources it actually found"],
                ["Checks", "every cited sentence against its source before you send it"],
              ].map(([b, t]) => (
                <li key={b} className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span>
                    <b className="font-medium text-ink">{b}</b> {t}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_0_var(--line)] sm:p-6">
            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-2/50 px-4 py-6 text-center transition-colors hover:border-accent"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) onFile(f);
              }}
            >
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
              {upload ? (
                <span className="text-sm">
                  <b className="font-medium">{upload.name}</b>
                  <span className="text-ink-3"> · {upload.kind === "image" ? "read by Nemotron Super VL" : "PDF"}</span>
                </span>
              ) : (
                <>
                  <span className="text-sm font-medium">Drop a photo or PDF of your denial letter</span>
                  <span className="mt-1 text-xs text-ink-3">or paste the text below</span>
                </>
              )}
            </label>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setUpload(null);
              }}
              placeholder="Paste your denial letter or Explanation of Benefits here…"
              className="mt-3 h-44 w-full resize-none rounded-xl border border-line bg-surface p-3 font-mono text-xs leading-5 outline-none focus:border-accent"
            />

            <p className="mt-4 text-xs uppercase tracking-wide text-ink-3">Or try a sample (fictional)</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {SAMPLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pickSample(s.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    sampleId === s.id ? "border-accent bg-accent-soft/50" : "border-line hover:border-ink-3"
                  }`}
                >
                  <span className="block text-sm font-medium leading-tight">{s.label}</span>
                  <span className="mt-1 block text-xs leading-snug text-ink-3">{s.blurb}</span>
                </button>
              ))}
            </div>

            <button
              onClick={run}
              disabled={!canRun}
              className="mt-5 w-full rounded-xl bg-accent px-4 py-3 font-medium text-accent-ink transition-opacity disabled:opacity-40"
            >
              Build my appeal
            </button>
            <p className="mt-3 text-center text-[11px] leading-4 text-ink-3">
              Overturn drafts documents for you to review. It is not legal or medical advice. Don&apos;t upload letters you aren&apos;t
              allowed to share.
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 pt-4 lg:grid-cols-[340px_1fr]">
          <aside className="no-print space-y-6 lg:sticky lg:top-4 lg:self-start">
            {replay && (
              <div className="rounded-xl border border-warn/40 bg-warn-soft/50 p-3 text-xs text-warn">
                Replay mode: no API keys are set, so this is a recorded run (sped up). Add NEBIUS_API_KEY and TAVILY_API_KEY for live results.
              </div>
            )}
            <div className="rounded-2xl border border-line bg-surface p-3">
              <Pipeline steps={steps} />
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-3">Engine room</p>
              <EngineRoom traces={traces} elapsed={elapsed} />
            </div>
            {phase === "done" && (
              <button onClick={() => setPhase("input")} className="w-full rounded-xl border border-line px-4 py-2.5 text-sm">
                Start another appeal
              </button>
            )}
          </aside>
          <div className="min-w-0 space-y-4">
            {error && <div className="rounded-xl border border-bad/40 bg-bad-soft p-4 text-sm text-bad">{error}</div>}
            <Results r={result} />
          </div>
        </section>
      )}
    </main>
  );
}

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path d="M10 19.5a6.5 6.5 0 1 0 2-9.4" stroke="var(--accent-ink)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M9 7.5v5h5" stroke="var(--accent-ink)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
