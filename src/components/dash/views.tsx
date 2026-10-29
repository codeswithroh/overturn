"use client";

import { useMemo, useState } from "react";
import { SAMPLES } from "@/lib/samples";
import { splitLine } from "@/lib/sentences";
import { toIcs } from "@/lib/timeline";
import type { AppealResult, Check, StepId, Trace } from "@/lib/types";
import { Calendar, daysUntil, fmtDate, ModelDonut, Ring, RunChart, TIER, usd } from "./charts";
import { Card, Chip, Favicon, Icon, Skeleton, VERDICT, domainOf, download } from "./ui";
import type { AppealBody, SavedAppeal, StepStatus } from "./useAppeal";

type R = Partial<AppealResult>;
export type View = "overview" | "letter" | "evidence" | "deadlines" | "history";

/* ---------- shared derivations ---------- */

function fileBy(r: R) {
  return r.timeline?.find((t) => t.kind === "deadline")?.date ?? null;
}

function verdictCounts(checks: Check[] = []) {
  const c = { supported: 0, partial: 0, unsupported: 0 };
  checks.forEach((x) => c[x.verdict]++);
  return c;
}

function citeCounts(letter = "") {
  const m = new Map<string, number>();
  for (const x of letter.matchAll(/\[(S\d+)\]/g)) m.set(x[1], (m.get(x[1]) ?? 0) + 1);
  return m;
}

/* ---------- intake (empty state) ---------- */

const SAMPLE_ICON: Record<string, string> = { mri: "doc", cgm: "bolt", er: "shield" };

export function Intake({ onRun, history, onOpen }: { onRun: (b: AppealBody) => void; history: SavedAppeal[]; onOpen: (a: SavedAppeal) => void }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ name: string; body: AppealBody } | null>(null);
  const [drag, setDrag] = useState(false);

  function onFile(f: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFile({ name: f.name, body: f.type === "application/pdf" ? { pdfDataUrl: dataUrl } : { imageDataUrl: dataUrl } });
    };
    reader.readAsDataURL(f);
  }

  const ready = file || text.trim().length > 40;

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card className="xl:col-span-2" title="New appeal">
        <label
          onDragOver={(e) => (e.preventDefault(), setDrag(true))}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-5 transition-colors ${
            drag ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50"
          }`}
        >
          <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon name="upload" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{file ? file.name : "Upload denial letter"}</span>
            <span className="text-sm text-ink-3">{file ? "Ready" : "Photo, scan or PDF"}</span>
          </span>
          {file && <Chip tone="accent">✓</Chip>}
        </label>

        <textarea
          value={text}
          onChange={(e) => (setText(e.target.value), setFile(null))}
          placeholder="…or paste the letter text"
          className="mt-3 h-28 w-full resize-none rounded-2xl bg-soft p-4 font-mono text-xs leading-5 outline-none focus:ring-2 focus:ring-accent/30"
        />

        <button
          disabled={!ready}
          onClick={() => onRun(file ? file.body : { text })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 font-medium text-white transition-opacity disabled:opacity-35"
        >
          Build appeal <Icon name="arrow" className="size-4" />
        </button>

        <p className="mt-6 mb-3 text-xs font-medium tracking-wide text-ink-3 uppercase">Samples</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => onRun({ sampleId: s.id })}
              className="group rounded-2xl bg-soft p-4 text-left transition-colors hover:bg-accent-soft"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-white text-accent shadow-sm">
                <Icon name={SAMPLE_ICON[s.id]} className="size-4" />
              </span>
              <span className="mt-3 block text-sm leading-tight font-medium">{s.label.split(" · ")[0]}</span>
              <span className="text-xs text-ink-3">{s.label.split(" · ")[1]}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Recent">
        {history.length === 0 ? (
          <div className="grid h-40 place-items-center text-center text-sm text-ink-3">
            <div>
              <Icon name="clock" className="mx-auto mb-2 size-6" />
              No appeals yet
            </div>
          </div>
        ) : (
          <ul className="-mx-2 space-y-1">
            {history.slice(0, 6).map((h) => (
              <HistoryRow key={h.id} a={h} onOpen={onOpen} compact />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------- overview ---------- */

const STEP_META: { id: StepId; label: string; tier?: keyof typeof TIER }[] = [
  { id: "read", label: "Read", tier: "nano" },
  { id: "plan", label: "Plan", tier: "super" },
  { id: "research", label: "Research", tier: "tavily" },
  { id: "argue", label: "Argue", tier: "ultra" },
  { id: "verify", label: "Verify", tier: "nano" },
  { id: "timeline", label: "Deadlines" },
];

function Stepper({ steps }: { steps: Record<StepId, StepStatus> }) {
  return (
    <ol className="flex items-start">
      {STEP_META.map((s, i) => {
        const st = steps[s.id];
        return (
          <li key={s.id} className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : st === "idle" ? "bg-line" : "bg-accent"}`} />
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  st === "done"
                    ? "bg-accent text-white"
                    : st === "running"
                      ? "pulse bg-accent-soft text-accent ring-2 ring-accent"
                      : st === "error"
                        ? "bg-bad text-white"
                        : "bg-soft text-ink-3"
                }`}
              >
                {st === "done" ? "✓" : st === "error" ? "!" : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === STEP_META.length - 1 ? "opacity-0" : steps[STEP_META[i + 1]?.id] === "idle" ? "bg-line" : "bg-accent"}`} />
            </div>
            <span className={`text-[11px] font-medium ${st === "idle" ? "text-ink-3" : ""}`}>{s.label}</span>
            {s.tier && (
              <span className="hidden items-center gap-1 text-[10px] text-ink-3 sm:flex">
                <span className="size-1.5 rounded-full" style={{ background: TIER[s.tier].color }} />
                {TIER[s.tier].short}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Stat({
  label,
  value,
  sub,
  gradient,
  icon,
  side,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  gradient: string;
  icon: string;
  side?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] p-5 text-white shadow-[0_10px_24px_-14px_rgb(15_23_42/0.5)]" style={{ background: gradient }}>
      <Icon name={icon} className="absolute -right-4 -bottom-5 size-28 opacity-15" />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[34px] leading-none font-semibold tracking-tight tabular-nums">{value}</div>
          <div className="mt-2 text-sm opacity-90">{label}</div>
        </div>
        {side}
      </div>
      {sub && <div className="relative mt-4 text-xs opacity-80">{sub}</div>}
    </div>
  );
}

export function Overview({
  r,
  steps,
  traces,
  elapsed,
  running,
  go,
}: {
  r: R;
  steps: Record<StepId, StepStatus>;
  traces: Trace[];
  elapsed: number;
  running: boolean;
  go: (v: View) => void;
}) {
  const deadline = fileBy(r);
  const left = deadline ? daysUntil(deadline) : null;
  const vc = verdictCounts(r.checks);
  const totalChecks = r.checks?.length ?? 0;
  const cost = traces.reduce((a, t) => a + t.cost, 0);
  const searches = traces.filter((t) => t.tier === "tavily").length;
  const cites = citeCounts(r.letter);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Days left to appeal"
          value={left ?? "—"}
          sub={deadline ? `File by ${fmtDate(deadline, { month: "short", day: "numeric", year: "numeric" })}` : "Reading deadline…"}
          gradient={left !== null && left < 30 ? "linear-gradient(135deg,#f97316,#dc2626)" : "linear-gradient(135deg,#1f8a66,#17694f)"}
          icon="calendar"
        />
        <Stat
          label="Citations verified"
          value={totalChecks ? `${vc.supported}/${totalChecks}` : "—"}
          sub={totalChecks ? `${vc.partial} partly · ${vc.unsupported} unsupported` : "Checked after drafting"}
          gradient="linear-gradient(135deg,#3b82f6,#1d4ed8)"
          icon="check"
          side={totalChecks ? <Ring value={vc.supported / totalChecks} size={52} color="white" /> : undefined}
        />
        <Stat
          label="Sources found"
          value={r.sources?.length ?? "—"}
          sub={searches ? `${searches} live searches` : "Searching…"}
          gradient="linear-gradient(135deg,#8b5cf6,#6d28d9)"
          icon="search"
          side={
            r.sources?.length ? (
              <div className="flex -space-x-2">
                {r.sources.slice(0, 3).map((s) => (
                  <Favicon key={s.id} url={s.url} size={26} />
                ))}
              </div>
            ) : undefined
          }
        />
        <Stat
          label="Model cost"
          value={traces.length ? usd(cost) : "—"}
          sub={`${traces.length} calls · ${(elapsed / 1000).toFixed(0)}s`}
          gradient="linear-gradient(135deg,#1e293b,#0f172a)"
          icon="bolt"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Agent run" action={running ? <Chip tone="accent">● Live</Chip> : <Chip>{(elapsed / 1000).toFixed(1)}s</Chip>}>
          <Stepper steps={steps} />
          <div className="mt-6">
            {traces.length ? <RunChart traces={traces} elapsed={elapsed} running={running} /> : <Skeleton lines={5} />}
          </div>
        </Card>

        <Card title="Deadlines" action={r.timeline && <LinkBtn onClick={() => go("deadlines")}>All</LinkBtn>}>
          {r.timeline ? (
            <>
              <Calendar items={r.timeline} compact />
              {deadline && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-bad-soft p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-center leading-none text-bad">
                    <span>
                      <span className="block text-[10px] uppercase">{fmtDate(deadline, { month: "short" })}</span>
                      <span className="text-sm font-semibold">{fmtDate(deadline, { day: "numeric" })}</span>
                    </span>
                  </span>
                  <span className="text-sm font-medium text-bad">Last day to file</span>
                </div>
              )}
            </>
          ) : (
            <Skeleton lines={6} />
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Denial">
          {r.facts ? (
            <div className="rise space-y-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-soft text-lg font-semibold text-ink-2">
                  {r.facts.insurer.trim()[0]}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.facts.insurer}</p>
                  <p className="truncate text-sm text-ink-3">{r.facts.serviceDenied}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="bad">{r.facts.denialCategory.replace(/_/g, " ")}</Chip>
                <Chip>{r.facts.planType.replace(/_/g, " ")}</Chip>
                {r.facts.state && <Chip>{r.facts.state}</Chip>}
                {r.facts.urgent && <Chip tone="warn">urgent</Chip>}
              </div>
              <p className="line-clamp-4 text-sm leading-relaxed text-ink-2">{r.facts.plainEnglish}</p>
              <div className="flex flex-wrap gap-1.5">
                {[...r.facts.procedureCodes, ...r.facts.diagnosisCodes].map((c) => (
                  <span key={c} className="rounded-md bg-soft px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <Skeleton lines={5} />
          )}
        </Card>

        <Card title="Appeal letter" action={r.letter && <LinkBtn onClick={() => go("letter")}>Open</LinkBtn>}>
          {r.letter ? (
            <div className="rise">
              <VerdictBar checks={r.checks} />
              <button onClick={() => go("letter")} className="relative mt-4 block w-full text-left">
                <div className="h-44 overflow-hidden rounded-2xl bg-soft p-4 font-display text-[12px] leading-5 whitespace-pre-line text-ink-2">
                  {r.letter.replace(/\s*\[S\d+\]/g, "").slice(0, 700)}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-20 rounded-b-2xl bg-gradient-to-t from-soft to-transparent" />
              </button>
              <div className="mt-3 flex gap-2 text-xs text-ink-3">
                <span>{r.letter.split(/\s+/).length} words</span>·<span>{cites.size} sources cited</span>·
                <span>{(r.letter.match(/\[ATTACH:/g) ?? []).length} to fill in</span>
              </div>
            </div>
          ) : (
            <Skeleton lines={7} />
          )}
        </Card>

        <Card title="Model mix" className="lg:col-span-2 xl:col-span-1">
          {traces.length ? <ModelDonut traces={traces} /> : <Skeleton lines={5} />}
        </Card>
      </div>

      <Card title="Evidence" action={r.sources && <LinkBtn onClick={() => go("evidence")}>All</LinkBtn>}>
        {r.sources ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[...r.sources].sort((a, b) => (cites.get(b.id) ?? 0) - (cites.get(a.id) ?? 0)).slice(0, 4).map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="rise rounded-2xl bg-soft p-4 transition-colors hover:bg-accent-soft">
                <div className="flex items-center gap-2">
                  <Favicon url={s.url} />
                  <span className="truncate text-xs text-ink-3">{domainOf(s.url)}</span>
                  <span className="ml-auto font-mono text-[11px] text-ink-3">{s.id}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium">{s.title}</p>
                <p className="mt-2 text-xs text-ink-3">Cited {cites.get(s.id) ?? 0}×</p>
              </a>
            ))}
          </div>
        ) : (
          <Skeleton lines={3} />
        )}
      </Card>
    </div>
  );
}

function LinkBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm font-medium text-accent">
      {children} <Icon name="arrow" className="size-3.5" />
    </button>
  );
}

function VerdictBar({ checks }: { checks?: Check[] }) {
  if (!checks?.length) return <div className="pulse h-2 rounded-full bg-soft" />;
  const c = verdictCounts(checks);
  const n = checks.length;
  return (
    <div>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {(["supported", "partial", "unsupported"] as const).map((k) =>
          c[k] ? <div key={k} className="grow" style={{ width: `${(c[k] / n) * 100}%`, background: VERDICT[k].color }} /> : null,
        )}
      </div>
      <div className="mt-2 flex gap-3 text-[11px] text-ink-2">
        {(["supported", "partial", "unsupported"] as const).map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ background: VERDICT[k].color }} />
            {VERDICT[k].label} {c[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- letter ---------- */

export function LetterView({ r }: { r: R }) {
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const checks = useMemo(() => new Map((r.checks ?? []).map((c) => [c.sentence, c])), [r.checks]);
  if (!r.letter) return <Card><Skeleton lines={10} /></Card>;
  const plain = r.letter.replace(/\s*\[S\d+\]/g, "");
  const vc = verdictCounts(r.checks);
  const n = r.checks?.length ?? 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <section className="card p-6 sm:p-10">
        <div className="no-print mb-6 flex flex-wrap gap-2">
          <ActionBtn icon="copy" primary onClick={() => navigator.clipboard.writeText(plain).then(() => setCopied(true))}>
            {copied ? "Copied" : "Copy"}
          </ActionBtn>
          <ActionBtn icon="print" onClick={() => window.print()}>
            Print
          </ActionBtn>
          <ActionBtn icon="download" onClick={() => download("appeal-letter.txt", plain, "text/plain")}>
            .txt
          </ActionBtn>
        </div>
        <article className="mx-auto max-w-[66ch] font-display text-[15px] leading-7 whitespace-pre-wrap">
          {r.letter.split("\n").map((line, li) => (
            <p key={li} className={line.trim() ? "" : "h-4"}>
              {splitLine(line).map((s, si) => {
                const c = checks.get(s.trim());
                return (
                  <span key={si}>
                    {si > 0 && " "}
                    <span
                      className={c ? "underline decoration-2 underline-offset-4" : ""}
                      style={c ? { textDecorationColor: VERDICT[c.verdict].color } : undefined}
                      title={c ? `${VERDICT[c.verdict].label}: ${c.note}` : undefined}
                    >
                      {s.split(/(\[S\d+\]|\[ATTACH:[^\]]*\])/).map((part, pi) =>
                        /^\[S\d+\]$/.test(part) ? (
                          <sup key={pi} className="ml-0.5 rounded bg-soft px-1 font-sans text-[10px] text-ink-2">
                            {part.slice(1, -1)}
                          </sup>
                        ) : part.startsWith("[ATTACH:") ? (
                          <mark key={pi} className="rounded bg-warn-soft px-1 font-sans text-[13px] text-warn">
                            {part.slice(8, -1).trim()}
                          </mark>
                        ) : (
                          part
                        ),
                      )}
                    </span>
                  </span>
                );
              })}
            </p>
          ))}
        </article>
      </section>

      <aside className="no-print space-y-5">
        <Card title="Citation check">
          <div className="flex items-center gap-4">
            <Ring value={n ? vc.supported / n : 0} size={76} stroke={8} color="var(--ok)" track="var(--soft)">
              <span className="text-lg font-semibold tabular-nums">
                {vc.supported}/{n}
              </span>
            </Ring>
            <ul className="space-y-1.5 text-sm">
              {(["supported", "partial", "unsupported"] as const).map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <span className="h-0.5 w-4 rounded" style={{ background: VERDICT[k].color }} />
                  <span className="text-ink-2">{VERDICT[k].label}</span>
                  <span className="font-medium tabular-nums">{vc[k]}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        {r.missing && r.missing.length > 0 && (
          <Card title="Attach" action={<Chip tone="warn">{r.missing.length - Object.values(done).filter(Boolean).length} left</Chip>}>
            <ul className="space-y-2">
              {r.missing.map((m, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={!!done[i]}
                      onChange={(e) => setDone((d) => ({ ...d, [i]: e.target.checked }))}
                      className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                    />
                    <span className={done[i] ? "text-ink-3 line-through" : "text-ink-2"}>{m}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {r.strategy && (
          <Card title="Angle of attack">
            <ol className="space-y-3">
              {r.strategy
                .split("\n")
                .filter((l) => l.trim())
                .slice(0, 5)
                .map((l, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{i + 1}</span>
                    <span className="text-ink-2">{l.replace(/^[-*•\d.)\s]+/, "").replace(/\s*\[S\d+\]/g, "").replace(/\*\*/g, "")}</span>
                  </li>
                ))}
            </ol>
          </Card>
        )}
      </aside>
    </div>
  );
}

function ActionBtn({ icon, children, onClick, primary }: { icon: string; children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium ${primary ? "bg-accent text-white" : "bg-soft text-ink-2 hover:text-ink"}`}
    >
      <Icon name={icon} className="size-4" />
      {children}
    </button>
  );
}

/* ---------- evidence ---------- */

export function EvidenceView({ r }: { r: R }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!r.sources) return <Card><Skeleton lines={8} /></Card>;
  const cites = citeCounts(r.letter);
  const verdictsBySource = new Map<string, Check["verdict"][]>();
  r.checks?.forEach((c) => c.cites.forEach((id) => verdictsBySource.set(id, [...(verdictsBySource.get(id) ?? []), c.verdict])));

  return (
    <div className="space-y-5">
      {r.queries && (
        <Card title="Searches">
          <div className="flex flex-wrap gap-2">
            {r.queries.map((q, i) => (
              <span key={i} title={q.purpose} className="flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 text-xs text-ink-2">
                <Icon name="search" className="size-3.5 text-[var(--t-tavily)]" />
                {q.q}
              </span>
            ))}
          </div>
        </Card>
      )}
      <section className="card overflow-hidden">
        <div className="grid grid-cols-[44px_1fr_70px] gap-3 border-b border-line px-5 py-3 text-[11px] font-medium tracking-wide text-ink-3 uppercase sm:grid-cols-[44px_1fr_90px_110px]">
          <span>ID</span>
          <span>Source</span>
          <span className="text-right sm:text-left">Cited</span>
          <span className="hidden sm:block">Check</span>
        </div>
        <ul>
          {r.sources.map((s) => {
            const vs = verdictsBySource.get(s.id) ?? [];
            return (
              <li key={s.id} className="border-b border-line last:border-0">
                <button
                  onClick={() => setOpen(open === s.id ? null : s.id)}
                  className="grid w-full grid-cols-[44px_1fr_70px] items-center gap-3 px-5 py-3.5 text-left hover:bg-soft/60 sm:grid-cols-[44px_1fr_90px_110px]"
                >
                  <span className="font-mono text-xs text-ink-3">{s.id}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <Favicon url={s.url} size={24} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{s.title}</span>
                      <span className="block truncate text-xs text-ink-3">{domainOf(s.url)}</span>
                    </span>
                  </span>
                  <span className="text-right text-sm tabular-nums sm:text-left">{cites.get(s.id) ?? 0}×</span>
                  <span className="hidden gap-1 sm:flex">
                    {vs.length
                      ? vs.map((v, i) => <span key={i} title={VERDICT[v].label} className="size-2.5 rounded-full" style={{ background: VERDICT[v].color }} />)
                      : <span className="text-xs text-ink-3">—</span>}
                  </span>
                </button>
                {open === s.id && (
                  <div className="rise space-y-3 bg-soft/60 px-5 pt-1 pb-4 sm:pl-[76px]">
                    {s.facts.map((f, i) => (
                      <blockquote key={i} className="border-l-2 border-accent pl-3 text-sm text-ink-2 italic">
                        “{f.quote}”
                      </blockquote>
                    ))}
                    <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                      <Icon name="link" className="size-3.5" /> Open source
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ---------- deadlines ---------- */

export function DeadlinesView({ r }: { r: R }) {
  if (!r.timeline || !r.facts) return <Card><Skeleton lines={8} /></Card>;
  const color = { deadline: "var(--bad)", action: "var(--accent)", expected: "var(--t-super)" };
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <Card title="Calendar">
        <Calendar items={r.timeline} />
        <button
          onClick={() => download("appeal-deadlines.ics", toIcs(r.timeline!, r.facts!.insurer), "text/calendar")}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-2.5 text-sm font-medium text-white"
        >
          <Icon name="calendar" className="size-4" /> Add to calendar
        </button>
      </Card>
      <Card title="Timeline">
        <ol className="space-y-3">
          {r.timeline.map((t, i) => {
            const d = daysUntil(t.date);
            return (
              <li key={i} className="flex items-center gap-4 rounded-2xl bg-soft p-3">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-center leading-tight shadow-sm">
                  <span>
                    <span className="block text-[10px] font-medium uppercase" style={{ color: color[t.kind] }}>
                      {fmtDate(t.date, { month: "short" })}
                    </span>
                    <span className="text-lg font-semibold">{fmtDate(t.date, { day: "numeric" })}</span>
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{t.title}</span>
                  <span className="line-clamp-1 text-xs text-ink-3" title={t.detail}>
                    {t.detail}
                  </span>
                </span>
                <Chip tone={t.kind === "deadline" ? "bad" : t.kind === "action" ? "accent" : "neutral"}>
                  {d <= 0 ? "Today" : `${d}d`}
                </Chip>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}

/* ---------- history ---------- */

function HistoryRow({ a, onOpen, compact }: { a: SavedAppeal; onOpen: (a: SavedAppeal) => void; compact?: boolean }) {
  const f = a.result.facts!;
  const dl = fileBy(a.result);
  const left = dl ? daysUntil(dl) : null;
  const vc = verdictCounts(a.result.checks);
  const n = a.result.checks?.length ?? 0;
  return (
    <li>
      <button onClick={() => onOpen(a)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-soft">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft font-semibold text-ink-2">{f.insurer.trim()[0]}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{f.serviceDenied}</span>
          <span className="block truncate text-xs text-ink-3">
            {f.insurer} · {fmtDate(a.createdAt.slice(0, 10))}
          </span>
        </span>
        {!compact && n > 0 && (
          <Ring value={vc.supported / n} size={34} stroke={4} color="var(--ok)" track="var(--soft)">
            <span className="text-[9px] font-semibold">{vc.supported}</span>
          </Ring>
        )}
        {left !== null && <Chip tone={left < 30 ? "bad" : "accent"}>{left}d</Chip>}
      </button>
    </li>
  );
}

export function HistoryView({ history, onOpen }: { history: SavedAppeal[]; onOpen: (a: SavedAppeal) => void }) {
  return (
    <Card title="Appeals">
      {history.length ? (
        <ul className="-mx-2 space-y-1">
          {history.map((h) => (
            <HistoryRow key={h.id} a={h} onOpen={onOpen} />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-ink-3">No appeals yet</p>
      )}
    </Card>
  );
}
