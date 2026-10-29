import OpenAI from "openai";
import { wrapOpenAI } from "langsmith/wrappers";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { MODELS, tokenCost } from "./models";
import { stripThinking } from "./json";
import type { Tier, Trace } from "./types";

const base = new OpenAI({
  baseURL: process.env.NEBIUS_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY ?? "missing",
  // A stuck call should fail fast and retry, not stall the whole appeal.
  timeout: 60_000,
  maxRetries: 2,
});
// Trace every Token Factory call to LangSmith when a key is configured.
const client = process.env.LANGSMITH_API_KEY ? (wrapOpenAI(base as never) as unknown as OpenAI) : base;

export interface CallOpts {
  step: string;
  tier: Exclude<Tier, "tavily">;
  messages: ChatCompletionMessageParam[];
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
  thinking?: boolean;
  onTrace: (t: Trace) => void;
}

// Nemotron 3 chat templates accept an enable_thinking switch. We turn reasoning
// off for cheap extraction calls and on for Ultra. If the endpoint rejects the
// extra fields we retry without them.
export async function chat(o: CallOpts): Promise<string> {
  const model = MODELS[o.tier];
  const base = {
    model,
    messages: o.messages,
    max_tokens: o.maxTokens ?? 2048,
    temperature: o.temperature ?? 0.2,
  };
  const extras: Record<string, unknown> = {};
  if (o.thinking !== undefined) extras.chat_template_kwargs = { enable_thinking: o.thinking };
  if (o.json) extras.response_format = { type: "json_object" };

  const t0 = Date.now();
  let res;
  try {
    res = await client.chat.completions.create({ ...base, ...extras } as never);
  } catch (e) {
    if (Object.keys(extras).length && e instanceof OpenAI.APIError && e.status === 400) {
      res = await client.chat.completions.create(base);
    } else throw e;
  }
  const r = res as OpenAI.Chat.Completions.ChatCompletion;
  const inTok = r.usage?.prompt_tokens ?? 0;
  const outTok = r.usage?.completion_tokens ?? 0;
  o.onTrace({
    step: o.step,
    tier: o.tier,
    model,
    ms: Date.now() - t0,
    inTok,
    outTok,
    cost: tokenCost(o.tier, inTok, outTok),
  });
  return stripThinking(r.choices[0]?.message?.content ?? "");
}
