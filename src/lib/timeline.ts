import type { DenialFacts, TimelineItem } from "./types";

// Federal defaults. A deadline printed on the letter always wins.
// - ACA marketplace & employer plans: 180 days to file an internal appeal
//   (45 CFR 147.136, 29 CFR 2560.503-1); decision within 30 days pre-service,
//   60 days post-service, 72h if urgent; 4 months to request external review.
// - Medicare Advantage: 65 days to request reconsideration.
// - Medicaid managed care: 60 days to appeal to the plan.
const FILE_WINDOW: Record<DenialFacts["planType"], number> = {
  employer: 180,
  marketplace: 180,
  unknown: 180,
  medicare_advantage: 65,
  medicaid: 60,
};

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildTimeline(f: DenialFacts, today = new Date()): TimelineItem[] {
  const now = today.toISOString().slice(0, 10);
  const denial = f.denialDate ?? now;
  const window = f.statedAppealDeadlineDays ?? FILE_WINDOW[f.planType];
  const fileBy = addDays(denial, window);
  const sendOn = now > denial ? now : denial;
  const decisionDays = f.urgent ? 3 : f.denialCategory === "prior_authorization" ? 30 : 60;
  const decision = addDays(sendOn, decisionDays);
  const items: TimelineItem[] = [
    {
      date: sendOn,
      title: "Send the appeal + request your claim file",
      detail:
        "Mail or fax the letter with medical records attached. Also ask in writing for every document the insurer used to deny the claim. They must provide it free of charge.",
      kind: "action",
    },
    {
      date: addDays(sendOn, 7),
      title: "Ask your doctor for a letter of medical necessity",
      detail: "A one-page letter from the treating clinician that addresses the specific criteria is the strongest attachment you can add.",
      kind: "action",
    },
    {
      date: decision,
      title: f.urgent ? "Expedited decision due (72 hours)" : `Insurer decision due (~${decisionDays} days)`,
      detail: "If you hear nothing by this date, call and ask for the decision in writing. Silence past the deadline can count as a denial you can escalate.",
      kind: "expected",
    },
    {
      date: fileBy,
      title: "Last day to file the internal appeal",
      detail: f.statedAppealDeadlineDays
        ? `Your letter gives ${window} days from the denial date.`
        : `Default window for ${f.planType.replace("_", " ")} plans is ${window} days. Confirm on your letter.`,
      kind: "deadline",
    },
  ];
  if (f.planType !== "medicare_advantage") {
    items.push({
      date: addDays(decision, 120),
      title: "External review deadline (if the appeal is denied)",
      detail:
        "You have 4 months after a final internal denial to ask for an independent external review. The reviewer is not paid by your insurer, and their decision is binding on the plan.",
      kind: "deadline",
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export function toIcs(items: TimelineItem[], insurer: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const events = items.map((it, i) => {
    const d = it.date.replace(/-/g, "");
    return [
      "BEGIN:VEVENT",
      `UID:overturn-${d}-${i}@overturn.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`,
      `SUMMARY:${it.title} (${insurer})`.replace(/[,;]/g, "\\$&"),
      `DESCRIPTION:${it.detail}`.replace(/[,;]/g, "\\$&"),
      it.kind === "deadline" ? "BEGIN:VALARM\r\nTRIGGER:-P7D\r\nACTION:DISPLAY\r\nDESCRIPTION:Deadline in 7 days\r\nEND:VALARM" : "",
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Overturn//EN", ...events, "END:VCALENDAR"].join("\r\n");
}
