// Original line-art for the landing page. Navy outlines, flat fills, one accent.
const INK = "#13213c";
const S = { stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function Bush({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M0 0c-6-22 10-38 28-30 4-20 34-22 40-2 18-10 38 6 30 32z"
        fill="#fff"
        {...S}
      />
      <path d="M30 -6c2-6 6-10 10-12M58 -4c2-5 5-8 9-9" fill="none" {...S} strokeWidth={2} />
    </g>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0c-2-40 2-70 0-96" fill="none" {...S} />
      <path
        d="M-2-96c-34 4-50-26-34-46-14-24 12-50 34-38 12-22 48-14 46 12 26 4 26 42 0 48 2 22-30 32-46 24z"
        fill="#f7e7dc"
        {...S}
      />
    </g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 0h70c10 0 12-16 0-18 0-14-18-20-26-10-6-14-30-12-30 6-12-2-18 14-14 22z"
      fill="#fff"
      {...S}
      strokeWidth={2.5}
    />
  );
}

export function HeroScene() {
  return (
    <svg viewBox="0 0 1200 300" className="block h-auto w-full" role="img" aria-label="A denial letter turning into an appeal letter that gets mailed">
      <Cloud x={160} y={60} s={0.9} />
      <Cloud x={930} y={44} />
      <Cloud x={560} y={30} s={0.7} />

      {/* left: trees, bushes */}
      <Tree x={110} y={270} s={1.05} />
      <Tree x={1110} y={270} s={0.85} />
      <Bush x={40} y={270} />
      <Bush x={180} y={270} s={0.8} />

      {/* denial letter, grumpy */}
      <g transform="translate(296 104) rotate(-7)">
        <path d="M0 0h96l26 26v130H0z" fill="#fff" {...S} />
        <path d="M96 0v26h26" fill="none" {...S} />
        <path d="M18 34h54M18 50h70M18 66h40" fill="none" {...S} strokeWidth={2.5} />
        {/* eyes + frown */}
        <path d="M30 84c5-5 11-5 16 0M70 84c5-5 11-5 16 0" fill="none" {...S} />
        <path d="M46 106c8-7 20-7 28 0" fill="none" {...S} />
        <g transform="translate(24 142) rotate(-14)">
          <rect x="-8" y="-20" width="92" height="28" rx="4" fill="none" stroke="#e5484d" strokeWidth={3} />
          <text x="38" y="0" textAnchor="middle" fontSize="16" fontWeight="800" fill="#e5484d" fontFamily="ui-sans-serif, system-ui" letterSpacing="2">
            DENIED
          </text>
        </g>
      </g>

      {/* dotted path */}
      <path d="M450 150c80-90 200-90 300-10" fill="none" stroke={INK} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
      <path d="M742 128l10 13-16 4" fill="none" {...S} />

      {/* appeal letter, happy */}
      <g transform="translate(780 92) rotate(5)">
        <path d="M0 0h104l26 26v140H0z" fill="#fff" {...S} />
        <path d="M104 0v26h26" fill="none" {...S} />
        <path d="M18 34l6 6 10-12M44 36h56M18 58l6 6 10-12M44 60h46M18 82l6 6 10-12M44 84h52" fill="none" {...S} strokeWidth={2.5} />
        <path d="M18 34l6 6 10-12M18 58l6 6 10-12M18 82l6 6 10-12" fill="none" stroke="#17694f" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* eyes + smile */}
        <circle cx="42" cy="118" r="9" fill="#fff" {...S} />
        <circle cx="80" cy="118" r="9" fill="#fff" {...S} />
        <circle cx="44" cy="120" r="3.5" fill={INK} />
        <circle cx="82" cy="120" r="3.5" fill={INK} />
        <path d="M48 140c8 8 20 8 28 0" fill="none" {...S} />
        {/* citation tabs */}
        <g transform="translate(130 44)">
          <path d="M0 0h26a6 6 0 0 1 0 22H0z" fill="#dcebe3" {...S} strokeWidth={2.5} />
          <text x="14" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK} fontFamily="ui-sans-serif, system-ui">S1</text>
        </g>
        <g transform="translate(130 74)">
          <path d="M0 0h26a6 6 0 0 1 0 22H0z" fill="#dcebe3" {...S} strokeWidth={2.5} />
          <text x="14" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK} fontFamily="ui-sans-serif, system-ui">S2</text>
        </g>
      </g>

      {/* mailbox */}
      <g transform="translate(990 150)">
        <path d="M22 50v70" fill="none" {...S} strokeWidth={4} />
        <path d="M0 50V22a22 22 0 0 1 44 0v28z" fill="#17694f" {...S} />
        <path d="M44 50h28V22a22 22 0 0 0-28-21" fill="#2a8a68" {...S} />
        <path d="M62 30V0h18v10H64" fill="#e5484d" {...S} strokeWidth={2.5} />
      </g>

      {/* ground */}
      <path d="M0 270h1200" fill="none" {...S} />
      <Bush x={880} y={270} s={0.9} />
      <Bush x={1040} y={270} s={0.7} />
      <path d="M560 270c4-10 8-10 12 0M600 270c3-8 6-8 9 0" fill="none" {...S} strokeWidth={2} />
    </svg>
  );
}

export function IconEvidence() {
  return (
    <svg viewBox="0 0 120 100" className="h-24 w-28" aria-hidden>
      <path d="M22 14h46l14 14v62H22z" fill="#fff" {...S} />
      <path d="M68 14v14h14M34 34h28M34 46h36M34 58h22" fill="none" {...S} strokeWidth={2.5} />
      <circle cx="78" cy="62" r="18" fill="#dcebe3" {...S} />
      <path d="M91 75l14 14" fill="none" {...S} strokeWidth={5} />
      <path d="M70 62l6 6 10-12" fill="none" stroke="#17694f" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLetter() {
  return (
    <svg viewBox="0 0 120 100" className="h-24 w-28" aria-hidden>
      <path d="M18 18h60v72H18z" fill="#fff" {...S} />
      <path d="M30 34h36M30 46h36M30 58h24M30 74c6-6 10 6 16 0s10 6 16 0" fill="none" {...S} strokeWidth={2.5} />
      <g transform="translate(70 72) rotate(-45)">
        <path d="M0 0h52l10 7-10 7H0z" fill="#17694f" {...S} />
        <path d="M0 0v14" fill="none" {...S} />
      </g>
    </svg>
  );
}

export function IconCalendar() {
  return (
    <svg viewBox="0 0 120 100" className="h-24 w-28" aria-hidden>
      <rect x="18" y="18" width="84" height="72" rx="8" fill="#fff" {...S} />
      <path d="M18 38h84" fill="none" {...S} />
      <path d="M18 26a8 8 0 0 1 8-8h68a8 8 0 0 1 8 8v12H18z" fill="#17694f" {...S} />
      <path d="M40 10v16M80 10v16" fill="none" {...S} />
      {[0, 1, 2, 3].map((c) =>
        [0, 1, 2].map((r) => <circle key={`${c}${r}`} cx={34 + c * 18} cy={52 + r * 14} r="2.5" fill={INK} />),
      )}
      <circle cx="70" cy="66" r="10" fill="none" stroke="#e5484d" strokeWidth={3.5} />
    </svg>
  );
}

export function Wave({ fill, flip = false }: { fill: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className={`block h-10 w-full sm:h-14 ${flip ? "rotate-180" : ""}`} aria-hidden>
      <path d="M0 40c240-40 480-40 720-10s480 30 720-10v40H0z" fill={fill} />
    </svg>
  );
}
