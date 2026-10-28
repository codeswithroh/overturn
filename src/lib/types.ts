export type Tier = "vision" | "nano" | "super" | "ultra" | "tavily";

export type PlanType =
  | "employer"
  | "marketplace"
  | "medicare_advantage"
  | "medicaid"
  | "unknown";

export type DenialCategory =
  | "medical_necessity"
  | "experimental"
  | "out_of_network"
  | "prior_authorization"
  | "coding_error"
  | "not_covered"
  | "other";

export interface DenialFacts {
  insurer: string;
  planType: PlanType;
  state: string | null;
  memberName: string | null;
  claimNumber: string | null;
  serviceDenied: string;
  procedureCodes: string[];
  diagnosisCodes: string[];
  denialDate: string | null; // YYYY-MM-DD
  denialCategory: DenialCategory;
  denialReasonQuote: string;
  criteriaCited: string | null;
  statedAppealDeadlineDays: number | null;
  urgent: boolean;
  plainEnglish: string;
}

export interface ResearchQuery {
  q: string;
  purpose: string;
}

export interface Source {
  id: string; // "S1"
  title: string;
  url: string;
  facts: { claim: string; quote: string }[];
}

export interface Check {
  sentence: string;
  cites: string[];
  verdict: "supported" | "partial" | "unsupported";
  note: string;
}

export interface TimelineItem {
  date: string; // YYYY-MM-DD
  title: string;
  detail: string;
  kind: "deadline" | "expected" | "action";
}

export interface Trace {
  step: string;
  tier: Tier;
  model: string;
  ms: number;
  inTok: number;
  outTok: number;
  cost: number; // USD
}

export interface AppealResult {
  facts: DenialFacts;
  queries: ResearchQuery[];
  sources: Source[];
  strategy: string;
  letter: string;
  missing: string[];
  checks: Check[];
  timeline: TimelineItem[];
}

export type StepId = "read" | "plan" | "research" | "argue" | "verify" | "timeline";

export type PipelineEvent =
  | { type: "step"; id: StepId; status: "running" | "done" | "error"; detail?: string }
  | { type: "trace"; trace: Trace }
  | { type: "partial"; key: keyof AppealResult; value: unknown }
  | { type: "mode"; replay: boolean }
  | { type: "error"; message: string }
  | { type: "done" };

export interface AppealInput {
  text?: string;
  imageDataUrl?: string;
  sampleId?: string;
}
