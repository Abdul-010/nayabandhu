import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";

const bodySchema = z.object({
  issue: z.string().min(3).max(300),
  details: z.string().max(2000).optional(),
  language: z.string().max(30),
});

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/roadmap")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json(400, "Invalid request.");
        const { issue, details, language } = parsed.data;

        const apiKey = process.env['LOVABLE_API_KEY'];
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
Generate a practical step-by-step filing roadmap for the user's issue under Indian law.
Format in markdown exactly like this:
## Roadmap: <short title>
**Applies under:** <relevant acts/sections, e.g. Consumer Protection Act 2019, BNSS 2023, RTI Act 2005; note if rules vary by state>
### Step 1 — <action>
What to do, where to go (office/portal/court), documents needed, fees, and expected timeline.
### Step 2 — ...
(continue 4-8 steps, ordered from first action to escalation)
### If you are refused or ignored
What to do next (appeal, higher authority, legal aid).
### Where to get free help
District Legal Services Authority (15100), relevant helplines.
Rules: simple language, realistic fees and timelines, no guarantees of outcome. Reply in ${language}${language === "English" ? "" : ` (use the ${language} script)`}.
End with this line, translated into the reply language: "This information is educational and not a substitute for professional legal advice."`,
          messages: [
            {
              role: "user",
              content: `Issue: ${issue}${details ? `\nDetails: ${details}` : ""}`,
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
