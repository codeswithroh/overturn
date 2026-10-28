import { TAVILY_COST_PER_SEARCH } from "./models";
import type { Trace } from "./types";

export interface TavilyHit {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function tavilySearch(
  query: string,
  onTrace: (t: Trace) => void,
): Promise<TavilyHit[]> {
  const t0 = Date.now();
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "advanced",
      max_results: 4,
      chunks_per_source: 3,
      include_answer: false,
    }),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { results: TavilyHit[] };
  onTrace({
    step: "research",
    tier: "tavily",
    model: "tavily/search:advanced",
    ms: Date.now() - t0,
    inTok: 0,
    outTok: 0,
    cost: TAVILY_COST_PER_SEARCH,
  });
  return data.results ?? [];
}
