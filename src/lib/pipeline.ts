import { chat } from "./llm";
import { parseJson, section } from "./json";
import { tavilySearch, type TavilyHit } from "./tavily";
import { buildTimeline } from "./timeline";
import type {
  AppealInput,
  Check,
  DenialFacts,
  PipelineEvent,
  ResearchQuery,
  Source,
  StepId,
  Trace,
} from "./types";

type Emit = (e: PipelineEvent) => void;

const FACTS_SCHEMA = `{
  "insurer": string,
  "planType": "employer" | "marketplace" | "medicare_advantage" | "medicaid" | "unknown",
  "state": two-letter US state or null,
  "memberName": string or null,
  "claimNumber": string or null,
  "serviceDenied": string,
  "procedureCodes": string[] (CPT/HCPCS),
  "diagnosisCodes": string[] (ICD-10),
  "denialDate": "YYYY-MM-DD" or null,
  "denialCategory": "medical_necessity" | "experimental" | "out_of_network" | "prior_authorization" | "coding_error" | "not_covered" | "other",
  "denialReasonQuote": exact sentence(s) from the letter giving the reason,
  "criteriaCited": the clinical policy / guideline the insurer cites, or null,
  "statedAppealDeadlineDays": number of days to appeal printed on the letter, or null,
  "urgent": true if delay could seriously harm the patient's health,
  "plainEnglish": 2-3 sentence explanation for the patient, no jargon
}`;

async function readLetter(input: AppealInput, onTrace: (t: Trace) => void): Promise<DenialFacts> {
  const instruction = `Extract the facts from this health insurance denial letter. Respond with JSON only, matching:\n${FACTS_SCHEMA}`;
  if (input.imageDataUrl) {
    // Photo or scan: Nemotron Super VL reads the image directly.
    const raw = await chat({
      step: "read",
      tier: "vision",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: instruction },
            { type: "image_url", image_url: { url: input.imageDataUrl } },
          ],
        },
      ],
      maxTokens: 1500,
      json: true,
      onTrace,
    });
    return parseJson<DenialFacts>(raw);
  }
  // Text: Nano is plenty for structured extraction.
  const raw = await chat({
    step: "read",
    tier: "nano",
    messages: [
      { role: "system", content: "You extract structured data from documents. Output JSON only." },
      { role: "user", content: `${instruction}\n\nLETTER:\n"""\n${input.text}\n"""` },
    ],
    maxTokens: 1500,
    json: true,
    thinking: false,
    onTrace,
  });
  return parseJson<DenialFacts>(raw);
}

async function planResearch(f: DenialFacts, onTrace: (t: Trace) => void): Promise<ResearchQuery[]> {
  const raw = await chat({
    step: "plan",
    tier: "super",
    messages: [
      {
        role: "system",
        content:
          "You are a patient advocate who wins insurance appeals. You plan web research that finds the evidence needed to overturn a specific denial.",
      },
      {
        role: "user",
        content: `Denial facts:\n${JSON.stringify(f, null, 2)}\n\nWrite 5 web search queries. Cover:\n1. The insurer's own published medical/clinical policy for this service (by name if cited).\n2. The professional-society clinical guideline that supports the service for this diagnosis.\n3. Peer-reviewed evidence of effectiveness, if the denial is medical necessity or experimental.\n4. The appeal and external-review rights for this plan type${f.state ? ` in ${f.state}` : ""}.\n5. Anything specific to the denial reason (e.g. prior-auth retro rules, network adequacy, coding).\n\nRespond with JSON only: {"queries":[{"q": string, "purpose": string}]}`,
      },
    ],
    maxTokens: 1200,
    json: true,
    thinking: false,
    onTrace,
  });
  return parseJson<{ queries: ResearchQuery[] }>(raw).queries.slice(0, 5);
}

async function distill(
  hit: TavilyHit,
  f: DenialFacts,
  onTrace: (t: Trace) => void,
): Promise<{ claim: string; quote: string }[]> {
  const raw = await chat({
    step: "research",
    tier: "nano",
    messages: [
      {
        role: "user",
        content: `A patient is appealing a denial of "${f.serviceDenied}" (${f.denialCategory.replace("_", " ")}). Reason given: "${f.denialReasonQuote}".\n\nFrom the source below, pull at most 2 facts that would help the appeal. Each "quote" MUST be copied verbatim from the source. If nothing is useful, return an empty list.\n\nSOURCE: ${hit.title} (${hit.url})\n"""\n${hit.content.slice(0, 6000)}\n"""\n\nJSON only: {"facts":[{"claim": string, "quote": string}]}`,
      },
    ],
    maxTokens: 600,
    json: true,
    thinking: false,
    onTrace,
  });
  try {
    return parseJson<{ facts: { claim: string; quote: string }[] }>(raw).facts ?? [];
  } catch {
    return [];
  }
}

async function research(
  queries: ResearchQuery[],
  f: DenialFacts,
  onTrace: (t: Trace) => void,
): Promise<Source[]> {
  const batches = await Promise.all(queries.map((q) => tavilySearch(q.q, onTrace).catch(() => [])));
  const seen = new Set<string>();
  const hits = batches
    .flat()
    .sort((a, b) => b.score - a.score)
    .filter((h) => (seen.has(h.url) ? false : (seen.add(h.url), true)))
    .slice(0, 12);
  const distilled = await Promise.all(hits.map((h) => distill(h, f, onTrace)));
  return hits
    .map((h, i) => ({ title: h.title, url: h.url, facts: distilled[i] }))
    .filter((s) => s.facts.length > 0)
    .slice(0, 8)
    .map((s, i) => ({ ...s, id: `S${i + 1}` }));
}

async function argue(f: DenialFacts, sources: Source[], onTrace: (t: Trace) => void) {
  const evidence = sources
    .map((s) => `[${s.id}] ${s.title} — ${s.url}\n${s.facts.map((x) => `  • ${x.claim} ("${x.quote}")`).join("\n")}`)
    .join("\n\n");
  const raw = await chat({
    step: "argue",
    tier: "ultra",
    messages: [
      {
        role: "system",
        content:
          "You are an expert health-insurance appeals advocate. You write appeal letters that rebut the insurer's exact stated reason, point by point, using only the evidence provided. You never invent facts, studies, laws or medical history. Where patient-specific facts are needed, insert a clearly marked placeholder like [ATTACH: physical therapy notes, dates] instead of guessing.",
      },
      {
        role: "user",
        content: `DENIAL\n${JSON.stringify(f, null, 2)}\n\nEVIDENCE (cite as [S1], [S2]…; cite only these)\n${evidence || "(no external evidence found)"}\n\nProduce three sections, exactly in this format:\n\n<strategy>\n3-5 bullet points: the insurer's weakest point and how the letter attacks it.\n</strategy>\n\n<letter>\nA formal first-level internal appeal letter from the member, ready to print. Include: date line, insurer appeals address placeholder, member/claim identifiers, a clear request ("I request that you reverse…"), a rebuttal of each part of the stated reason with citations, a request for the full claim file and the reviewer's credentials, a request for a peer-to-peer review with the treating physician, and a statement that the member will pursue external review if denied. Keep it under 650 words. Every factual claim drawn from evidence must carry its [S#] citation.\n</letter>\n\n<missing>\nOne line per document the member should attach to strengthen the appeal.\n</missing>`,
      },
    ],
    maxTokens: 6000,
    temperature: 0.5,
    thinking: true,
    onTrace,
  });
  return {
    strategy: section(raw, "strategy"),
    letter: section(raw, "letter"),
    missing: section(raw, "missing")
      .split("\n")
      .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
      .filter(Boolean),
  };
}

async function verify(letter: string, sources: Source[], onTrace: (t: Trace) => void): Promise<Check[]> {
  const sentences = letter
    .split(/(?<=[.!?])\s+(?=[A-Z[])/)
    .map((s) => s.trim())
    .filter((s) => /\[S\d+\]/.test(s));
  if (!sentences.length) return [];
  const byId = Object.fromEntries(sources.map((s) => [s.id, s]));
  const items = sentences.map((s, i) => {
    const cites = [...new Set([...s.matchAll(/\[(S\d+)\]/g)].map((m) => m[1]))];
    const ev = cites
      .map((c) => byId[c] ? `${c}: ${byId[c].facts.map((x) => `"${x.quote}"`).join(" ")}` : `${c}: (no such source)`)
      .join("\n");
    return { i, sentence: s, cites, ev };
  });
  const raw = await chat({
    step: "verify",
    tier: "nano",
    messages: [
      {
        role: "user",
        content: `For each numbered sentence, decide if the cited evidence supports it. "supported" = evidence states it; "partial" = evidence is related but the sentence overreaches; "unsupported" = evidence does not say this.\n\n${items.map((x) => `#${x.i}\nSENTENCE: ${x.sentence}\nEVIDENCE:\n${x.ev}`).join("\n\n")}\n\nJSON only: {"checks":[{"i": number, "verdict": "supported"|"partial"|"unsupported", "note": short reason}]}`,
      },
    ],
    maxTokens: 2000,
    json: true,
    thinking: false,
    onTrace,
  });
  const verdicts = new Map(parseJson<{ checks: { i: number; verdict: Check["verdict"]; note: string }[] }>(raw).checks.map((c) => [c.i, c]));
  return items.map((x) => ({
    sentence: x.sentence,
    cites: x.cites,
    verdict: verdicts.get(x.i)?.verdict ?? "partial",
    note: verdicts.get(x.i)?.note ?? "Not checked",
  }));
}

export async function runPipeline(input: AppealInput, emit: Emit) {
  const onTrace = (trace: Trace) => emit({ type: "trace", trace });
  const step = async <T,>(id: StepId, fn: () => Promise<T>, detail?: (r: T) => string) => {
    emit({ type: "step", id, status: "running" });
    try {
      const r = await fn();
      emit({ type: "step", id, status: "done", detail: detail?.(r) });
      return r;
    } catch (e) {
      emit({ type: "step", id, status: "error", detail: (e as Error).message });
      throw e;
    }
  };

  const facts = await step("read", () => readLetter(input, onTrace), (f) => `${f.insurer} · ${f.denialCategory.replace("_", " ")}`);
  emit({ type: "partial", key: "facts", value: facts });

  const queries = await step("plan", () => planResearch(facts, onTrace), (q) => `${q.length} queries`);
  emit({ type: "partial", key: "queries", value: queries });

  const sources = await step("research", () => research(queries, facts, onTrace), (s) => `${s.length} usable sources`);
  emit({ type: "partial", key: "sources", value: sources });

  const draft = await step("argue", () => argue(facts, sources, onTrace), (d) => `${d.letter.split(/\s+/).length} words`);
  emit({ type: "partial", key: "strategy", value: draft.strategy });
  emit({ type: "partial", key: "letter", value: draft.letter });
  emit({ type: "partial", key: "missing", value: draft.missing });

  const checks = await step("verify", () => verify(draft.letter, sources, onTrace), (c) => `${c.filter((x) => x.verdict === "supported").length}/${c.length} citations supported`);
  emit({ type: "partial", key: "checks", value: checks });

  const timeline = await step("timeline", async () => buildTimeline(facts), (t) => `${t.length} dates`);
  emit({ type: "partial", key: "timeline", value: timeline });
}
