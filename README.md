# Overturn

**Your insurer said no. Make them read the evidence.**

Overturn turns a health-insurance denial letter into a cited, ready-to-send appeal in about a minute. Upload a photo, PDF or the text of the letter. Overturn explains the denial in plain English, researches the insurer's policy, clinical guidelines and your appeal rights live on the web, writes an appeal that rebuts the insurer's exact reason, checks every citation against its source, and gives you a calendar of every deadline.

Built for the **Nebius × NVIDIA Global AI Hackathon** — Best Apps and Agents track.

## Why

In the US, insurers deny a large share of in-network claims, yet only a tiny fraction of denials are ever appealed, even though many appeals succeed (see KFF's analyses of ACA marketplace claims data). People don't appeal because it means reading plan policies, clinical guidelines and federal rules, then writing a formal letter under a deadline. Overturn does that work.

## How it uses NVIDIA Nemotron on Nebius Token Factory

Overturn routes each step to the smallest Nemotron model that can do it well, and shows the routing live in the "Engine room" panel (model, latency, tokens and cost for every call).

| Step | Model (Token Factory) | Why this model |
|---|---|---|
| Read the letter (text/PDF) | `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`, thinking off | Structured extraction is cheap, fast work |
| Read the letter (photo/scan) | `nvidia/Nemotron-3.5-Super-VL` | Reads the image directly, no separate OCR |
| Plan the research | `nvidia/nemotron-3-super-120b-a12b` | Knows which evidence beats which denial type |
| Find the evidence | Tavily Search (advanced) + Nano per source | Many parallel calls; Nano pulls verbatim quotes only |
| Write the argument | `nvidia/Nemotron-3-Ultra-550b-a55b`, thinking on | The one step that needs deep reasoning |
| Check every citation | Nano | Each cited sentence is checked against its source quote |
| Deadlines | Deterministic rules | ACA/ERISA/Medicare/Medicaid appeal windows |

Measured on the three sample letters (recorded runs in `replays/`):

| | Lumbar MRI | Glucose monitor | ER surgery |
|---|---|---|---|
| Model calls (incl. 5 Tavily searches) | 21 | 21 | 21 |
| Nemotron spend | $0.0098 | $0.0091 | $0.0076 |
| End-to-end time | 23s | 22s | 21s |
| Share of tokens handled by Nano | 69% | 74% | 69% |

Nano handles about 70% of the tokens; Ultra is called once and accounts for about 80% of model spend. That is the point: the expensive reasoning is spent on the one step that wins or loses the appeal.

**Live demo:** https://overturn-eight.vercel.app

**Token Factory features used:** OpenAI-compatible chat completions, Nemotron 3 Nano / Super / Ultra and Nemotron 3.5 Super VL (vision), `chat_template_kwargs.enable_thinking` to switch reasoning per call, JSON mode.

### How Tavily is used

Tavily is the evidence layer. Super writes five targeted queries (the insurer's own clinical policy, the professional-society guideline, clinical evidence, federal/state appeal rights, and the specific denial reason). Results are de-duplicated and ranked, then Nano extracts at most two **verbatim** quotes per source. The letter may only cite those sources, and the verify step flags any sentence that overreaches.

## Architecture

```
Browser (Next.js) ──POST /api/appeal──▶ Node route (streams NDJSON events)
                                         │
   read ── Nano / Super VL ──────────────┤  Nebius Token Factory
   plan ── Super ────────────────────────┤  (api.tokenfactory.nebius.com)
   research ── Tavily ×5 ─▶ Nano ×N ─────┤
   argue ── Ultra (reasoning) ───────────┤
   verify ── Nano ───────────────────────┤
   timeline ── rules engine ─────────────┘
```

Key files: `src/lib/pipeline.ts` (agent steps), `src/lib/llm.ts` (Token Factory client and cost tracing), `src/lib/models.ts` (model IDs and prices), `src/lib/timeline.ts` (appeal deadlines and .ics export).

## Run it

```bash
cp .env.example .env.local   # add NEBIUS_API_KEY and TAVILY_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Without API keys the app runs in **replay mode** and plays back real recorded runs of the three sample letters, so you can explore the UI. To record fresh runs from the live models, set `RECORD_REPLAY=1` and run each sample once; they are saved to `replays/`.

### Deploy

- **Nebius Serverless Endpoint:** `docker build -t overturn .` then push the image and create an endpoint on port 3000 with the two API keys as environment variables.
- **Vercel:** import the repo and set the two environment variables.

## Limits

Overturn drafts documents for a person to review and send. It is not legal or medical advice. The letter marks any patient-specific fact it cannot know with an `[ATTACH: …]` placeholder instead of guessing. The sample letters are fictional.

## Feedback on Nebius Token Factory and NVIDIA models

- **Drop-in OpenAI compatibility worked first try.** Pointing the OpenAI SDK at `api.tokenfactory.nebius.com/v1/` was the whole integration. `/v1/models` made it easy to confirm IDs from code.
- **Model ID casing is inconsistent**, which cost time: `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`, `nvidia/nemotron-3-super-120b-a12b`, `nvidia/Nemotron-3-Ultra-550b-a55b`, and `nvidia/Nemotron-3_5-Lightning` (shown as "Nemotron-3.5-Lightning" in the catalog UI). A consistent scheme, or a copy button on each catalog card, would prevent 404s.
- **Ultra was faster than expected**: about 6–8s for a ~500-word reasoned letter, which made it practical to keep Ultra in an interactive flow instead of a background job.
- **Nano is a strong default for high-volume structured extraction.** It produced valid JSON for letter extraction and per-source quote extraction across every run.
- **Wish list:** per-request cost returned in the API response (we compute it from the price list), and documented support for the Nemotron `enable_thinking` switch and JSON mode per model on the model card.
- **Tavily:** `search_depth: advanced` with `chunks_per_source` returned content focused enough that Nano could pull verbatim quotes without fetching full pages.

## License

MIT
