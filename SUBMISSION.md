# Devpost submission — copy/paste

**Project name:** Overturn
**Tagline:** Your insurer said no. Make them read the evidence.
**Track:** Best Apps and Agents
**Demo:** https://overturn-eight.vercel.app
**Repo:** https://github.com/codeswithroh/overturn

## Inspiration
Health insurers deny a large share of claims, yet almost nobody appeals, even though many appeals succeed. The barrier isn't the right to appeal; it's the work: decoding the letter, finding the insurer's own policy, the clinical guideline and the federal appeal rules, then writing a formal rebuttal before a deadline. That is exactly the kind of work an agent can do in a minute.

## What it does
Upload a photo, PDF or the text of a denial letter. Overturn:
1. Explains the denial in plain English and pulls out the exact reason, codes and criteria.
2. Researches live with Tavily: the insurer's clinical policy, professional-society guidelines, clinical evidence, and appeal rights for that plan type and state.
3. Writes a formal appeal that rebuts the insurer's stated reason point by point, citing only sources it found, and marks patient-specific facts it can't know as `[ATTACH: …]` instead of inventing them.
4. Checks every cited sentence against its source quote and underlines it green, yellow or red.
5. Builds a deadline timeline (internal appeal, decision due, external review) you can add to your calendar.

## How we built it
Next.js app with a streaming agent pipeline on **Nebius Token Factory**, routing each step to the smallest **NVIDIA Nemotron** model that does it well:
- **Nemotron 3 Nano** (thinking off): letter extraction, per-source verbatim quote extraction, citation checking.
- **Nemotron 3.5 Super VL**: reads photographed letters directly.
- **Nemotron 3 Super**: plans the research queries for the specific denial type.
- **Nemotron 3 Ultra** (thinking on): writes the argument, called exactly once.
- **Tavily** advanced search is the evidence layer.

The "Engine room" panel shows every call live: model, latency, tokens and cost. Measured: 21 calls, ~22 seconds and under 1 cent of Nemotron spend per appeal. Nano handles ~70% of tokens; Ultra accounts for ~80% of model spend, on the one step that matters most. Every Token Factory call is also traced in LangSmith.

## Challenges
Keeping the letter honest. Our first verifier passes marked most citations "partial" because sentence splitting merged letter headers with claims. Splitting per line and giving the verifier both the extracted claim and the verbatim quote fixed it. We also force the letter to use placeholders for anything about the patient's history.

## Accomplishments
A complete product, not a demo script: upload to printable, cited letter plus calendar in ~20 seconds, for under a cent of inference.

## What we learned
Model routing matters more than model size. Spending Ultra once and Nano everywhere else gave better letters, faster, than using one large model for everything.

## What's next
Fax/mail sending, second-level and external-review letters, state-specific rules for all 50 states, and a clinician mode that drafts letters of medical necessity.

## Built with
nvidia-nemotron, nebius-token-factory, tavily, next.js, typescript, tailwindcss, langsmith, vercel

---

# 3-minute video script

| Time | Show | Say |
|---|---|---|
| 0:00–0:15 | Landing page | "Insurers deny claims every day, and almost nobody appeals, even though many appeals win. The problem is the paperwork. This is Overturn." |
| 0:15–0:30 | Click the ER sample, then Build my appeal | "Here's a real-looking denial: a $38,000 emergency appendectomy denied for no prior authorization." |
| 0:30–1:15 | Pipeline + Engine room filling in | "Nemotron Nano reads the letter. Super plans the research. Tavily searches live, and Nano pulls verbatim quotes from each source. Watch the engine room: every call, its model, latency and cost." |
| 1:15–1:45 | Ultra step finishes; open Appeal letter | "Only now do we call Nemotron Ultra, once, to write the argument. It rebuts the exact reason given and cites only what we found." |
| 1:45–2:10 | Hover underlined sentences, show ATTACH highlights | "Nano then checks every citation against its source. Green is verified. Anything about the patient that we can't know is a placeholder, never a guess." |
| 2:10–2:30 | Evidence tab, then Deadlines tab + .ics | "Every source with its quote. Every deadline, straight to your calendar." |
| 2:30–3:00 | Engine room totals; README routing table | "Twenty-one calls, about twenty seconds, under one cent of Nemotron spend. Nano does most of the work; Ultra does the part that wins. Built on NVIDIA Nemotron and Nebius Token Factory." |
