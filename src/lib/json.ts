// Reasoning models sometimes wrap answers in <think> blocks or ```json fences.
export function stripThinking(s: string): string {
  return s.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*?<\/think>/i, "").trim();
}

export function parseJson<T>(raw: string): T {
  const s = stripThinking(raw).replace(/```(?:json)?/gi, "");
  const start = s.search(/[[{]/);
  if (start === -1) throw new Error("Model returned no JSON");
  const open = s[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return JSON.parse(s.slice(start, i + 1)) as T;
  }
  throw new Error("Model returned truncated JSON");
}

export function section(raw: string, tag: string): string {
  const m = stripThinking(raw).match(new RegExp(`<${tag}>([\\s\\S]*?)(?:</${tag}>|$)`, "i"));
  return m ? m[1].trim() : "";
}
