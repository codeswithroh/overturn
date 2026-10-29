import Link from "next/link";
import { HeroScene, IconCalendar, IconEvidence, IconLetter, Wave } from "@/components/landing/art";
import { Icon, Logo } from "@/components/dash/ui";
import { SAMPLES } from "@/lib/samples";

const CREAM = "#fbf4ee";

const FEATURES = [
  { art: <IconEvidence />, title: "Evidence", text: "Your insurer's own policy, the clinical guideline and your appeal rights, found live and quoted word for word." },
  { art: <IconLetter />, title: "Letter", text: "A formal appeal that answers the exact reason you were denied. Every claim cites a source." },
  { art: <IconCalendar />, title: "Deadlines", text: "Your filing window, when the insurer must reply and when to ask for an outside review. One tap to your calendar." },
];

// Measured on the three sample letters (see replays/ in the repo).
const SPLIT = [
  { label: "Tokens", rows: [["Nano", 70, "var(--t-nano)"], ["Super", 5, "var(--t-super)"], ["Ultra", 25, "var(--t-ultra)"]] },
  { label: "Cost", rows: [["Nano", 13, "var(--t-nano)"], ["Super", 5, "var(--t-super)"], ["Ultra", 82, "var(--t-ultra)"]] },
] as const;

function Rule() {
  return <span className="mx-auto mb-6 block h-0.5 w-12 rounded bg-[#e5484d]" />;
}

export default function Landing() {
  return (
    <div className="overflow-x-hidden bg-white text-[#13213c]">
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-lg font-semibold tracking-tight text-accent">overturn</span>
        </Link>
        <nav className="mx-auto hidden gap-8 text-sm md:flex">
          <a href="#what" className="hover:text-accent">What you get</a>
          <a href="#how" className="hover:text-accent">How it works</a>
          <a href="#samples" className="hover:text-accent">Samples</a>
          <a href="https://github.com/codeswithroh/overturn" className="hover:text-accent">Source</a>
        </nav>
        <div className="ml-auto flex gap-2 md:ml-0">
          <Link href="/app" className="hidden rounded-lg border-2 border-[#13213c] px-4 py-1.5 text-sm font-medium sm:block">
            Dashboard
          </Link>
          <Link href="/app" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
            Start an appeal
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="pt-14 text-center sm:pt-20">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="font-display text-5xl leading-[1.04] font-semibold tracking-tight sm:text-7xl">
            Your insurer said no.
            <br />
            Write back.
          </h1>
          <p className="mt-5 text-lg text-[#13213c]/75">Upload the denial letter. Get a cited appeal in 20 seconds.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/app" className="w-full rounded-xl bg-accent px-10 py-3.5 font-medium text-white sm:w-auto">
              Start an appeal
            </Link>
            <Link href="/app?sample=er" className="w-full rounded-xl px-6 py-3.5 font-medium underline decoration-2 underline-offset-4 sm:w-auto">
              Try a sample
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-[#13213c]/70">
            <li className="flex items-center gap-2"><Icon name="check" className="size-4 text-accent" /> Every citation checked</li>
            <li className="flex items-center gap-2"><Icon name="shield" className="size-4 text-accent" /> Free and open source</li>
            <li className="flex items-center gap-2"><Icon name="clock" className="size-4 text-accent" /> Federal deadlines built in</li>
          </ul>
        </div>
        <div className="mx-auto mt-6 max-w-6xl px-2">
          <HeroScene />
        </div>
      </section>

      {/* what you get */}
      <section id="what" style={{ background: CREAM }} className="pt-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <Rule />
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Three things, ready to send.</h2>
          <div className="mt-14 grid gap-12 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-center">
                {f.art}
                <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#13213c]/75">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-20">
          <Wave fill="#ffffff" />
        </div>
      </section>

      {/* dashboard row (illustration left, text right) */}
      <section id="how" className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2">
        <div className="relative mx-auto grid aspect-square w-full max-w-md place-items-center">
          <div className="absolute inset-4 rounded-full border-[48px] border-accent" />
          <div className="relative w-[86%] rounded-2xl bg-white p-4 shadow-[0_24px_48px_-20px_rgb(19_33_60/0.35)]">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["165", "days left", "#17694f"],
                ["4/5", "verified", "#2563eb"],
              ].map(([v, l, c]) => (
                <div key={l} className="rounded-xl p-3 text-white" style={{ background: c }}>
                  <div className="text-xl font-semibold">{v}</div>
                  <div className="text-[11px] opacity-85">{l}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {[
                [0, 14, "var(--t-nano)"],
                [14, 30, "var(--t-super)"],
                [30, 60, "var(--t-tavily)"],
                [60, 90, "var(--t-ultra)"],
                [90, 100, "var(--t-nano)"],
              ].map(([a, b, c], i) => (
                <div key={i} className="relative h-2 rounded-full bg-[#f1f4f8]">
                  <span className="absolute h-2 rounded-full" style={{ left: `${a}%`, width: `${(b as number) - (a as number)}%`, background: c as string }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Watch it work.</h2>
          <p className="mt-4 max-w-md leading-relaxed text-[#13213c]/75">
            The dashboard draws every step as it happens: each model call on a timeline, the sources it found, which sentences passed
            the check, and the days you have left.
          </p>
          <Link href="/app?sample=mri" className="mt-6 inline-flex items-center gap-1.5 font-medium text-accent">
            Open the dashboard <Icon name="arrow" className="size-4" />
          </Link>
        </div>
      </section>

      {/* models row (text left, chart right) */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 sm:px-6 lg:grid-cols-2">
        <div className="lg:order-2">
          <div className="rounded-3xl bg-[#13213c] p-8 text-white">
            {SPLIT.map((s) => (
              <div key={s.label} className="mb-6 last:mb-0">
                <div className="mb-2 text-sm text-white/60">{s.label}</div>
                <div className="flex h-4 gap-0.5 overflow-hidden rounded-full">
                  {s.rows.map(([k, v, c]) => (
                    <div key={k} style={{ width: `${v}%`, background: c }} />
                  ))}
                </div>
                <div className="mt-2 flex gap-5 text-xs text-white/75">
                  {s.rows.map(([k, v, c]) => (
                    <span key={k} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: c }} />
                      {k} {v}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:order-1">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Small models read. The big one argues.</h2>
          <p className="mt-4 max-w-md leading-relaxed text-[#13213c]/75">
            NVIDIA Nemotron Nano reads letters and checks citations. Ultra is called once, to write the argument. A full appeal costs
            under one cent in model time on Nebius Token Factory.
          </p>
        </div>
      </section>

      {/* samples, Oscar-style ruled columns on a green field */}
      <section id="samples" className="bg-accent text-white">
        <Wave fill="#ffffff" flip />
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-20 sm:px-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Try one of these.</h2>
          <p className="mt-2 text-white/70">Fictional letters, real research.</p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {SAMPLES.map((s) => (
              <Link key={s.id} href={`/app?sample=${s.id}`} className="group border-t-2 border-white/80 pt-4">
                <p className="text-[11px] font-semibold tracking-widest uppercase opacity-75">{s.label.split(" · ")[1]}</p>
                <p className="mt-2 text-xl font-semibold">{s.label.split(" · ")[0]}</p>
                <p className="mt-1 text-sm text-white/75">{s.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                  Run it <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#13213c] text-white/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-sm sm:px-6">
          <span className="font-semibold text-white">overturn</span>
          <span>Drafting help, not legal or medical advice.</span>
          <span className="sm:ml-auto">NVIDIA Nemotron · Nebius Token Factory · Tavily · MIT</span>
        </div>
      </footer>
    </div>
  );
}
