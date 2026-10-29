"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { StepId, Tier, TimelineItem, Trace } from "@/lib/types";

export const TIER: Record<Tier, { label: string; short: string; color: string }> = {
  nano: { label: "Nemotron 3 Nano", short: "Nano", color: "var(--t-nano)" },
  super: { label: "Nemotron 3 Super", short: "Super", color: "var(--t-super)" },
  ultra: { label: "Nemotron 3 Ultra", short: "Ultra", color: "var(--t-ultra)" },
  vision: { label: "Nemotron 3.5 Super VL", short: "Super VL", color: "var(--t-vision)" },
  tavily: { label: "Tavily Search", short: "Tavily", color: "var(--t-tavily)" },
};
export const TIER_ORDER: Tier[] = ["nano", "super", "ultra", "vision", "tavily"];

export const usd = (n: number) => `$${n < 0.1 ? n.toFixed(4) : n.toFixed(2)}`;

/* ---------- tooltip ---------- */

type Tip = { x: number; y: number; body: ReactNode } | null;

function TipBox({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg"
      style={{ left: tip.x, top: tip.y - 10 }}
    >
      {tip.body}
    </div>
  );
}

/* ---------- ring (progress) ---------- */

export function Ring({
  value,
  size = 56,
  stroke = 6,
  color = "currentColor",
  track = "rgb(255 255 255 / 0.25)",
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ---------- donut: tokens by model ---------- */

export function ModelDonut({ traces }: { traces: Trace[] }) {
  const [tip, setTip] = useState<Tip>(null);
  const [hover, setHover] = useState<Tier | null>(null);
  const rows = TIER_ORDER.filter((t) => t !== "tavily")
    .map((tier) => {
      const ts = traces.filter((t) => t.tier === tier);
      return {
        tier,
        calls: ts.length,
        tok: ts.reduce((a, t) => a + t.inTok + t.outTok, 0),
        cost: ts.reduce((a, t) => a + t.cost, 0),
      };
    })
    .filter((r) => r.calls);
  const total = rows.reduce((a, r) => a + r.tok, 0);
  const size = 168;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = rows.length > 1 ? 3 : 0;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative" onMouseLeave={() => (setTip(null), setHover(null))}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--soft)" strokeWidth={stroke} />
          {rows.map((row) => {
            const len = (row.tok / (total || 1)) * c;
            const seg = (
              <circle
                key={row.tier}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={TIER[row.tier].color}
                strokeWidth={hover === row.tier ? stroke + 4 : stroke}
                strokeDasharray={`${Math.max(len - gap, 0.5)} ${c}`}
                strokeDashoffset={-offset}
                className="cursor-pointer transition-[stroke-width]"
                onMouseMove={(e) => {
                  const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                  setHover(row.tier);
                  setTip({
                    x: e.clientX - box.left,
                    y: e.clientY - box.top,
                    body: (
                      <>
                        <b>{TIER[row.tier].label}</b>
                        <br />
                        {row.tok.toLocaleString()} tokens · {Math.round((row.tok / total) * 100)}% · {usd(row.cost)}
                      </>
                    ),
                  });
                }}
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl font-semibold tabular-nums">{(total / 1000).toFixed(1)}k</div>
            <div className="text-[11px] text-ink-3">tokens</div>
          </div>
        </div>
        <TipBox tip={tip} />
      </div>
      <ul className="w-full flex-1 space-y-2.5 text-sm">
        {rows.map((row) => (
          <li
            key={row.tier}
            className={`flex items-center gap-2 rounded-lg px-1 transition-opacity ${hover && hover !== row.tier ? "opacity-40" : ""}`}
            onMouseEnter={() => setHover(row.tier)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="size-2.5 rounded-full" style={{ background: TIER[row.tier].color }} />
            <span className="text-ink-2">{TIER[row.tier].short}</span>
            <span className="ml-auto font-medium tabular-nums">{Math.round((row.tok / (total || 1)) * 100)}%</span>
            <span className="w-16 text-right text-xs text-ink-3 tabular-nums">{usd(row.cost)}</span>
          </li>
        ))}
        {!rows.length && <li className="text-ink-3">No model calls yet</li>}
      </ul>
    </div>
  );
}

/* ---------- run chart: every call on a time axis, one row per step ---------- */

const ROWS: { id: StepId; label: string }[] = [
  { id: "read", label: "Read" },
  { id: "plan", label: "Plan" },
  { id: "research", label: "Research" },
  { id: "argue", label: "Argue" },
  { id: "verify", label: "Verify" },
];

export function RunChart({ traces, elapsed, running }: { traces: Trace[]; elapsed: number; running: boolean }) {
  const [tip, setTip] = useState<Tip>(null);
  const lanes = useMemo(() => {
    // Within a step, calls run in parallel: pack them into sub-lanes.
    return ROWS.map((row) => {
      const calls = traces
        .filter((t) => t.step === row.id)
        .map((t) => {
          const end = t.endAt ?? 0;
          return { t, start: Math.max(0, end - t.ms), end };
        })
        .sort((a, b) => a.start - b.start);
      const laneEnds: number[] = [];
      const placed = calls.map((c) => {
        let lane = laneEnds.findIndex((e) => e <= c.start);
        if (lane === -1) lane = laneEnds.length;
        laneEnds[lane] = c.end;
        return { ...c, lane };
      });
      return { ...row, placed, n: Math.max(1, laneEnds.length) };
    });
  }, [traces]);

  const maxEnd = Math.max(elapsed, ...traces.map((t) => t.endAt ?? 0), 1000);
  const span = Math.ceil(maxEnd / 5000) * 5000;
  const W = 640;
  const L = 74;
  const laneH = 7;
  const rowGap = 14;
  let y = 8;
  const rowsY = lanes.map((r) => {
    const top = y;
    y += r.n * laneH + (r.n - 1) * 2 + rowGap;
    return top;
  });
  const H = y + 16;
  const x = (ms: number) => L + (ms / span) * (W - L - 8);
  const ticks = Array.from({ length: span / 5000 + 1 }, (_, i) => i * 5000);

  return (
    <div className="relative" onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={0} y2={H - 16} stroke="var(--line)" strokeWidth={1} />
            <text x={x(t)} y={H - 3} textAnchor="middle" fontSize="10" fill="var(--ink-3)">
              {t / 1000}s
            </text>
          </g>
        ))}
        {running && <line x1={x(elapsed)} x2={x(elapsed)} y1={0} y2={H - 16} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="3 3" />}
        {lanes.map((row, ri) => (
          <g key={row.id}>
            <text x={0} y={rowsY[ri] + (row.n * laneH + (row.n - 1) * 2) / 2 + 4} fontSize="11" fill="var(--ink-2)">
              {row.label}
            </text>
            {row.placed.map((c, i) => (
              <rect
                key={i}
                className="grow cursor-pointer"
                x={x(c.start)}
                y={rowsY[ri] + c.lane * (laneH + 2)}
                width={Math.max(x(c.end) - x(c.start), 3)}
                height={laneH}
                rx={3.5}
                fill={TIER[c.t.tier].color}
                onMouseMove={(e) => {
                  const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                  setTip({
                    x: e.clientX - box.left,
                    y: e.clientY - box.top,
                    body: (
                      <>
                        <b>{TIER[c.t.tier].label}</b>
                        <br />
                        {(c.t.ms / 1000).toFixed(1)}s
                        {c.t.inTok + c.t.outTok ? ` · ${(c.t.inTok + c.t.outTok).toLocaleString()} tokens` : ""} · {usd(c.t.cost)}
                      </>
                    ),
                  });
                }}
              />
            ))}
          </g>
        ))}
      </svg>
      <TipBox tip={tip} />
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {TIER_ORDER.filter((t) => traces.some((x) => x.tier === t)).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm" style={{ background: TIER[t].color }} />
            {TIER[t].short}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- calendar with deadline markers ---------- */

const KIND_COLOR: Record<TimelineItem["kind"], string> = {
  deadline: "var(--bad)",
  action: "var(--accent)",
  expected: "var(--t-super)",
};

export function Calendar({ items, compact }: { items: TimelineItem[]; compact?: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const first = items.find((i) => i.date >= today)?.date ?? today;
  const [cursor, setCursor] = useState(() => first.slice(0, 7));
  const [sel, setSel] = useState<string | null>(null);
  const [yy, mm] = cursor.split("-").map(Number);
  const start = new Date(Date.UTC(yy, mm - 1, 1));
  const days = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const lead = (start.getUTCDay() + 6) % 7; // Monday first
  const byDate = new Map<string, TimelineItem[]>();
  items.forEach((i) => byDate.set(i.date, [...(byDate.get(i.date) ?? []), i]));
  const shift = (d: number) => {
    const n = new Date(Date.UTC(yy, mm - 1 + d, 1));
    setCursor(n.toISOString().slice(0, 7));
  };
  const selected = sel ? byDate.get(sel) : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold">
          {start.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })}{" "}
          <span className="font-normal text-ink-3">{yy}</span>
        </span>
        <div className="flex gap-1">
          {[-1, 1].map((d) => (
            <button
              key={d}
              onClick={() => shift(d)}
              aria-label={d < 0 ? "Previous month" : "Next month"}
              className="grid size-7 place-items-center rounded-full text-ink-2 hover:bg-soft"
            >
              {d < 0 ? "‹" : "›"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d} className="pb-1 text-[10px] font-medium text-ink-3 uppercase">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`l${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = `${cursor}-${String(i + 1).padStart(2, "0")}`;
          const ev = byDate.get(d);
          const isToday = d === today;
          return (
            <button
              key={d}
              onClick={() => ev && setSel(sel === d ? null : d)}
              className={`relative mx-auto grid ${compact ? "size-8" : "size-10"} place-items-center rounded-full tabular-nums transition-colors ${
                ev ? "font-semibold text-white" : isToday ? "font-semibold text-accent ring-1 ring-accent" : "text-ink-2"
              } ${sel === d ? "ring-2 ring-ink/20 ring-offset-1" : ""}`}
              style={ev ? { background: KIND_COLOR[ev[0].kind] } : undefined}
              title={ev?.map((e) => e.title).join("\n")}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-2">
        {(
          [
            ["action", "To do"],
            ["expected", "Decision due"],
            ["deadline", "Deadline"],
          ] as const
        ).map(([k, l]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: KIND_COLOR[k] }} />
            {l}
          </span>
        ))}
      </div>
      {selected && (
        <div className="rise mt-3 space-y-1 rounded-xl bg-soft p-3 text-sm">
          {selected.map((s, i) => (
            <p key={i} className="font-medium">
              {s.title}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function daysUntil(date: string) {
  const ms = new Date(date + "T12:00:00Z").getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export function fmtDate(d: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}
