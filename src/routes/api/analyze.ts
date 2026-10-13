import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";

const LANGS = ["English", "Kannada", "Hindi", "Tamil", "Telugu", "Malayalam"];
const MAX_BYTES = 10 * 1024 * 1024;

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json" } });

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        const language = String(form?.get("language") ?? "English");
        const question = String(form?.get("question") ?? "").slice(0, 1000);
        if (!(file instanceof File)) return json(400, "Please upload a PDF file.");
        if (file.type !== "application/pdf") return json(400, "Only PDF files are supported.");
        if (file.size === 0) return json(400, "The file is empty.");
        if (file.size > MAX_BYTES) return json(400, "The PDF must be under 10 MB.");
        if (!LANGS.includes(language)) return json(400, "Unsupported language.");

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json(500, "AI is not configured.");

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          instructions: `You are Nayabandhu, an AI legal-awareness assistant for India. You are NOT a lawyer.
Analyse the uploaded legal document (e.g. RTI application/reply, FIR, notice, agreement, court order) and explain it in plain language.
Format in markdown:
## What this document is
## Key points (bullets: parties, dates, amounts, sections/acts cited)
## Deadlines and obligations
## Possible concerns or missing information
## Suggested next steps
If the user asked a question, answer it in a final section "## Your question".
If the file is not a legal document, say so briefly. Never guarantee outcomes.
Reply entirely in ${language}${language === "English" ? "" : ` (use the ${language} script)`}.
End with this line, translated into the reply language: "This information is educational and not a substitute for professional legal advice."`,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: question ? `My question: ${question}` : "Please summarise this document." },
                { type: "file", filename: file.name.slice(0, 120), data: toBase64(await file.arrayBuffer()), mediaType: "application/pdf" },
              ],
            },
          ],
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return withLovableAiGatewayRunIdHeader(result.toTextStreamResponse(), runIdFetch);
      },
    },
  },
});
