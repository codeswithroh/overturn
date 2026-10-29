// Shared by the verifier and the letter renderer so highlights line up.
export function splitLine(line: string): string[] {
  return line.split(/(?<=[.!?]["”)]?)\s+(?=[A-Z[“"])/);
}

export function splitSentences(text: string): string[] {
  return text
    .split("\n")
    .flatMap(splitLine)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Models sometimes group citations as "[S5, S8]"; expand to "[S5][S8]".
export function normalizeCites(text: string): string {
  return text.replace(/\[(S\d+(?:\s*[,;]\s*S\d+)+)\]/g, (_, g: string) =>
    g
      .split(/\s*[,;]\s*/)
      .map((x) => `[${x}]`)
      .join(""),
  );
}
