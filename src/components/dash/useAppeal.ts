"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeCites } from "@/lib/sentences";
import { buildTimeline } from "@/lib/timeline";
import type { AppealResult, PipelineEvent, StepId, Trace } from "@/lib/types";

export type StepStatus = "idle" | "running" | "done" | "error";
export type Phase = "empty" | "running" | "done";
export type AppealBody = { sampleId?: string; text?: string; imageDataUrl?: string; pdfDataUrl?: string };

export interface SavedAppeal {
  id: string;
  createdAt: string;
  result: Partial<AppealResult>;
  traces: Trace[];
  elapsed: number;
}

export const STEP_IDS: StepId[] = ["read", "plan", "research", "argue", "verify", "timeline"];
const HISTORY_KEY = "overturn.history.v1";

const idle = () => Object.fromEntries(STEP_IDS.map((s) => [s, "idle"])) as Record<StepId, StepStatus>;

export function loadHistory(): SavedAppeal[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as SavedAppeal[];
  } catch {
    return [];
  }
}

function saveHistory(items: SavedAppeal[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
  } catch {
    /* storage unavailable: history is a convenience only */
  }
}

export function useAppeal() {
  const [phase, setPhase] = useState<Phase>("empty");
  const [steps, setSteps] = useState(idle);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [result, setResult] = useState<Partial<AppealResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [replay, setReplay] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<SavedAppeal[]>([]);
  const started = useRef(0);
  const live = useRef({ result: {} as Partial<AppealResult>, traces: [] as Trace[] });

  useEffect(() => setHistory(loadHistory()), []);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setElapsed(Date.now() - started.current), 100);
    return () => clearInterval(id);
  }, [phase]);

  const handle = useCallback((e: PipelineEvent) => {
    switch (e.type) {
      case "mode":
        setReplay(e.replay);
        break;
      case "step":
        setSteps((s) => ({ ...s, [e.id]: e.status }));
        if (e.id === "timeline" && e.status === "done" && !live.current.result.timeline && live.current.result.facts) {
          live.current.result = { ...live.current.result, timeline: buildTimeline(live.current.result.facts) };
          setResult(live.current.result);
        }
        if (e.status === "error" && e.detail) setError(e.detail);
        break;
      case "trace":
        live.current.traces = [...live.current.traces, e.trace];
        setTraces(live.current.traces);
        break;
      case "partial":
        live.current.result = { ...live.current.result, [e.key]: e.key === "letter" ? normalizeCites(e.value as string) : e.value };
        setResult(live.current.result);
        break;
      case "error":
        setError(e.message);
        break;
    }
  }, []);

  const run = useCallback(
    async (body: AppealBody) => {
      setPhase("running");
      setSteps(idle());
      setTraces([]);
      setResult({});
      setError(null);
      setElapsed(0);
      live.current = { result: {}, traces: [] };
      started.current = Date.now();
      try {
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
      } catch (e) {
        setError((e as Error).message);
      }
      const total = Date.now() - started.current;
      setElapsed(total);
      setPhase("done");
      const r = live.current.result;
      if (r.facts && r.letter) {
        const item: SavedAppeal = {
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
          result: r,
          traces: live.current.traces,
          elapsed: total,
        };
        setHistory((h) => {
          const next = [item, ...h];
          saveHistory(next);
          return next;
        });
      }
    },
    [handle],
  );

  const open = useCallback((a: SavedAppeal) => {
    live.current = { result: a.result, traces: a.traces };
    setResult(a.result);
    setTraces(a.traces);
    setElapsed(a.elapsed);
    setSteps(Object.fromEntries(STEP_IDS.map((s) => [s, "done"])) as Record<StepId, StepStatus>);
    setError(null);
    setReplay(false);
    setPhase("done");
  }, []);

  const reset = useCallback(() => {
    setPhase("empty");
    setResult({});
    setTraces([]);
    setError(null);
  }, []);

  return { phase, steps, traces, result, error, replay, elapsed, history, run, open, reset };
}
