import type { ReactNode } from "react";

const PATHS: Record<string, string> = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  letter: "M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7",
  search: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
  clock: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v5l3 2",
  plus: "M12 5v14M5 12h14",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  check: "M5 12l4 4 10-10",
  copy: "M8 8h11v12H8zM5 16V4h11",
  print: "M7 9V3h10v6M6 18H4v-7h16v7h-2M7 14h10v7H7z",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  bolt: "M13 3L5 13h6l-1 8 8-10h-6z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 6l-6 6 6 6",
  link: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1",
  doc: "M7 3h10v18H7zM10 8h4M10 12h4",
};

export function Icon({ name, className = "size-5" }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M10 19.5a6.5 6.5 0 1 0 2-9.4" stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M9 7.5v5h5" stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Card({ title, action, className = "", children }: { title?: ReactNode; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`card min-w-0 p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Skeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="pulse h-2.5 rounded-full bg-soft" style={{ width: `${90 - i * 17}%` }} />
      ))}
    </div>
  );
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" | "accent" }) {
  const t = {
    neutral: "bg-soft text-ink-2",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    bad: "bg-bad-soft text-bad",
    accent: "bg-accent-soft text-accent",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export const VERDICT = {
  supported: { label: "Verified", tone: "ok" as const, color: "var(--ok)", icon: "✓" },
  partial: { label: "Partly", tone: "warn" as const, color: "var(--warn)", icon: "~" },
  unsupported: { label: "Unsupported", tone: "bad" as const, color: "var(--bad)", icon: "!" },
};

export function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function Favicon({ url, size = 20 }: { url: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domainOf(url)}&sz=64`}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-md bg-white ring-1 ring-line"
    />
  );
}

export function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}
