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

A typical run makes about 20 calls. Most are Nano; Ultra is called once. Model spend is a few cents per appeal.

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

Without API keys the app runs in **replay mode** and plays back a recorded run of the first sample letter, so you can explore the UI. To record fresh runs from the live models, set `RECORD_REPLAY=1` and run each sample once; they are saved to `replays/`.

### Deploy

- **Nebius Serverless Endpoint:** `docker build -t overturn .` then push the image and create an endpoint on port 3000 with the two API keys as environment variables.
- **Vercel:** import the repo and set the two environment variables.

## Limits

Overturn drafts documents for a person to review and send. It is not legal or medical advice. The letter marks any patient-specific fact it cannot know with an `[ATTACH: …]` placeholder instead of guessing. The sample letters are fictional.

## Feedback on Nebius Token Factory and NVIDIA models

_(Fill in after testing: what worked, what was confusing, latency/quality notes per model.)_

## License

MIT
