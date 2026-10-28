import type { Tier } from "./types";

// Model IDs as listed in the Nebius Token Factory catalog (Oct 2026).
// Override any of them with env vars if the catalog changes.
export const MODELS: Record<Exclude<Tier, "tavily">, string> = {
  vision: process.env.MODEL_VISION ?? "nvidia/Nemotron-3.5-Super-VL",
  nano: process.env.MODEL_NANO ?? "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  super: process.env.MODEL_SUPER ?? "nvidia/nemotron-3-super-120b-a12b",
  ultra: process.env.MODEL_ULTRA ?? "nvidia/Nemotron-3-Ultra-550b-a55b",
};

// USD per 1M tokens [input, output], from the Token Factory public price list.
const PRICES: Record<Exclude<Tier, "tavily">, [number, number]> = {
  vision: [0.3, 0.9],
  nano: [0.06, 0.24],
  super: [0.3, 0.9],
  ultra: [1.0, 3.0],
};

// Tavily: ~1 credit per basic search, 2 per advanced; ~$0.008/credit on pay-as-you-go.
export const TAVILY_COST_PER_SEARCH = 0.016;

export function tokenCost(tier: Exclude<Tier, "tavily">, inTok: number, outTok: number) {
  const [i, o] = PRICES[tier];
  return (inTok * i + outTok * o) / 1_000_000;
}
