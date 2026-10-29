import Link from "next/link";
import { Icon, Logo } from "@/components/dash/ui";
import { SAMPLES } from "@/lib/samples";

const STEPS = [
  { n: 1, title: "Read", text: "Pulls the reason, codes and deadline from your letter.", model: "Nano · Super VL for photos", color: "var(--t-nano)" },
  { n: 2, title: "Research", text: "Searches the insurer's policy, clinical guidelines and federal appeal rules.", model: "Super + Tavily", color: "var(--t-tavily)" },
  { n: 3, title: "Argue", text: "Answers the insurer's exact reason, point by point, with citations.", model: "Ultra", color: "var(--t-ultra)" },
  { n: 4, title: "Check", text: "Tests every cited sentence against the source before you see it.", model: "Nano", color: "var(--t-nano)" },
];

// Measured on the three sample letters (see replays/ in the repo).
const SPLIT = {
  tokens: [
    { k: "Nano", v: 70, c: "var(--t-nano)" },
    { k: "Super", v: 5, c: "var(--t-super)" },
    { k: "Ultra", v: 25, c: "var(--t-ultra)" },
  ],
  cost: [
    { k: "Nano", v: 13, c: "var(--t-nano)" },
    { k: "Super", v: 5, c: "var(--t-super)" },
    { k: "Ultra", v: 82, c: "var(--t-ultra)" },
  ],
};

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">Overturn</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-7 text-sm text-ink-2 md:flex">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#samples" className="hover:text-ink">Samples</a>
          <a href="https://github.com/codeswithroh/overturn" className="hover:text-ink">GitHub</a>
        </nav>
        <Link href="/app" className="ml-auto rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white md:ml-0">
          Open dashboard
        </Link>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs text-ink-2 shadow-sm">
            <span className="size-1.5 rounded-full bg-[var(--t-ultra)]" /> NVIDIA Nemotron on Nebius Token Factory
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
            Your claim was denied.
            <br />
            <span className="text-accent">Appeal it today.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">
            Upload the denial letter. Get an appeal letter with sources, plus every deadline on your calendar. It takes about 20
            seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app" className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-medium text-white shadow-[0_12px_24px_-12px_var(--accent)]">
              Start an appeal <Icon name="arrow" className="size-4" />
            </Link>
            <Link href="/app?sample=er" className="rounded-2xl bg-card px-6 py-3.5 font-medium shadow-sm">
              Try a sample
            </Link>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {[
              ["~20s", "per appeal"],
              ["<1¢", "model cost"],
              ["100%", "citations checked"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="text-2xl font-semibold tabular-nums">{v}</dt>
                <dd className="text-sm text-ink-3">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroMock />
      </section>

      {/* how */}
      <section id="how" className="bg-card py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Four steps, one minute</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-3xl bg-bg p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-2xl bg-card text-sm font-semibold shadow-sm">{s.n}</span>
                  <span className="flex items-center gap-1.5 text-xs text-ink-3">
                    <span className="size-2 rounded-full" style={{ background: s.color }} />
                    {s.model}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* model split */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 rounded-[32px] bg-ink p-8 text-white sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Small models read. The big one argues.</h2>
            <p className="mt-4 max-w-md text-white/65">
              Nano handles most of the reading and checking. Ultra is called once, to write the argument.
            </p>
          </div>
          <div className="space-y-7">
            {(
              [
                ["Tokens", SPLIT.tokens],
                ["Cost", SPLIT.cost],
              ] as const
            ).map(([label, rows]) => (
              <div key={label}>
                <div className="mb-2 text-sm text-white/60">{label}</div>
                <div className="flex h-4 gap-0.5 overflow-hidden rounded-full">
                  {rows.map((r) => (
                    <div key={r.k} style={{ width: `${r.v}%`, background: r.c }} />
                  ))}
                </div>
                <div className="mt-2 flex gap-5 text-xs text-white/70">
                  {rows.map((r) => (
                    <span key={r.k} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: r.c }} />
                      {r.k} {r.v}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* samples */}
      <section id="samples" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Try a real-looking denial</h2>
        <p className="mt-2 text-ink-2">Fictional letters. Live research.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {SAMPLES.map((s) => (
            <Link key={s.id} href={`/app?sample=${s.id}`} className="card group p-6 transition-transform hover:-translate-y-0.5">
              <p className="text-xs font-medium tracking-wide text-bad uppercase">{s.label.split(" · ")[1]}</p>
              <p className="mt-2 text-lg font-semibold">{s.label.split(" · ")[0]}</p>
              <p className="mt-2 text-sm text-ink-2">{s.blurb}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Run it <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-8 text-sm text-ink-3 sm:px-6">
          <Logo size={22} />
          <span>Drafting help, not legal or medical advice.</span>
          <span className="ml-auto">NVIDIA Nemotron · Nebius Token Factory · Tavily · MIT</span>
        </div>
      </footer>
    </div>
  );
}

/* A static picture of the dashboard, drawn with the same parts. */
function HeroMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-accent-soft via-transparent to-[#dbeafe]" />
      <div className="card p-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["152", "Days left", "linear-gradient(135deg,#1f8a66,#17694f)"],
            ["4/5", "Citations verified", "linear-gradient(135deg,#3b82f6,#1d4ed8)"],
            ["8", "Sources", "linear-gradient(135deg,#8b5cf6,#6d28d9)"],
            ["$0.009", "Model cost", "linear-gradient(135deg,#1e293b,#0f172a)"],
          ].map(([v, l, g]) => (
            <div key={l} className="rounded-2xl p-4 text-white" style={{ background: g }}>
              <div className="text-2xl font-semibold tabular-nums">{v}</div>
              <div className="mt-1 text-xs opacity-85">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-soft p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-ink-3">
            <span className="font-medium text-ink">Agent run</span>
            <span>21 calls · 22s</span>
          </div>
          {[
            ["Read", [[0, 12, "var(--t-nano)"]]],
            ["Plan", [[12, 28, "var(--t-super)"]]],
            ["Research", [[28, 44, "var(--t-tavily)"], [44, 62, "var(--t-nano)"]]],
            ["Argue", [[62, 90, "var(--t-ultra)"]]],
            ["Verify", [[90, 99, "var(--t-nano)"]]],
          ].map(([label, bars]) => (
            <div key={label as string} className="flex items-center gap-3 py-1">
              <span className="w-16 text-[11px] text-ink-2">{label as string}</span>
              <div className="relative h-2 flex-1">
                {(bars as [number, number, string][]).map(([a, b, c], i) => (
                  <span key={i} className="absolute h-2 rounded-full" style={{ left: `${a}%`, width: `${b - a}%`, background: c }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-soft p-4 font-display text-[13px] leading-6 text-ink-2">
          The American College of Radiology rates this MRI as{" "}
          <span className="underline decoration-[var(--ok)] decoration-2 underline-offset-4">Usually Appropriate</span> after 6 weeks of
          therapy<sup className="ml-0.5 rounded bg-white px-1 font-sans text-[10px]">S1</sup>. I completed{" "}
          <mark className="rounded bg-warn-soft px-1 font-sans text-[12px] text-warn">number</mark> sessions…
        </div>
      </div>
    </div>
  );
}
