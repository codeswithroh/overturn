import { promises as fs } from "fs";
import path from "path";
import { runPipeline } from "@/lib/pipeline";
import { SAMPLES } from "@/lib/samples";
import type { AppealInput, PipelineEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const REPLAY_DIR = path.join(process.cwd(), "replays");

async function pdfToText(dataUrl: string) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

export async function POST(req: Request) {
  const body = (await req.json()) as AppealInput & { pdfDataUrl?: string };
  const input: AppealInput = { ...body };
  if (body.sampleId) input.text = SAMPLES.find((s) => s.id === body.sampleId)?.text;
  if (body.pdfDataUrl) input.text = await pdfToText(body.pdfDataUrl);

  const live = Boolean(process.env.NEBIUS_API_KEY && process.env.TAVILY_API_KEY);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: PipelineEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      send({ type: "mode", replay: !live });

      if (!live) {
        // No API keys: replay a recorded run so the UI can be explored.
        const file = path.join(REPLAY_DIR, `${body.sampleId ?? "mri"}.json`);
        const replay = await fs
          .readFile(file, "utf8")
          .then((s) => JSON.parse(s) as { t: number; e: PipelineEvent }[])
          .catch(() => null);
        if (!replay || !body.sampleId) {
          send({ type: "error", message: "Live mode needs NEBIUS_API_KEY and TAVILY_API_KEY. Without keys, only recorded sample runs are available." });
        } else {
          let last = 0;
          for (const { t, e } of replay) {
            await new Promise((r) => setTimeout(r, Math.min(t - last, 2500)));
            last = t;
            send(e.type === "trace" ? { ...e, trace: { ...e.trace, endAt: e.trace.endAt ?? t } } : e);
          }
        }
        send({ type: "done" });
        controller.close();
        return;
      }

      if (!input.text && !input.imageDataUrl) {
        send({ type: "error", message: "Add a denial letter first." });
        send({ type: "done" });
        controller.close();
        return;
      }

      // RECORD_REPLAY=1 saves sample runs so the app can be demoed without keys.
      const t0 = Date.now();
      const log: { t: number; e: PipelineEvent }[] = [];
      const emit = (ev: PipelineEvent) => {
        const t = Date.now() - t0;
        const e = ev.type === "trace" ? { ...ev, trace: { ...ev.trace, endAt: t } } : ev;
        log.push({ t, e });
        send(e);
      };
      try {
        await runPipeline(input, emit);
        if (process.env.RECORD_REPLAY === "1" && body.sampleId) {
          await fs.mkdir(REPLAY_DIR, { recursive: true });
          await fs.writeFile(path.join(REPLAY_DIR, `${body.sampleId}.json`), JSON.stringify(log, null, 1));
        }
      } catch (e) {
        send({ type: "error", message: (e as Error).message });
      }
      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
  });
}
