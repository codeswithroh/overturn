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
