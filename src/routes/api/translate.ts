import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

const bodySchema = z.object({
  language: z.enum(["Kannada", "Hindi", "Tamil", "Telugu", "Malayalam"]),
  strings: z.array(z.string().max(1000)).min(1).max(80),
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json(400, { error: "Invalid request." });
        const { language, strings } = parsed.data;
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json(500, { error: "AI is not configured." });

        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });

        const { text } = await generateText({
          model: provider.responses("openai/gpt-6-astra"),
          instructions: `Translate website UI text for an Indian legal-awareness app into ${language} (native script). Keep it natural and simple. Keep numbers, phone numbers, brand name "Nayabandhu", and legal citations (e.g. Article 22, BNSS, RTI) recognisable. Return ONLY a JSON array of strings, same length and order as the input.`,
          prompt: JSON.stringify(strings),
          providerOptions: { openai: { store: false } },
        });

        try {
          const match = text.match(/\[[\s\S]*\]/);
          const arr = JSON.parse(match ? match[0] : text);
          if (!Array.isArray(arr)) throw new Error();
          return json(200, { translations: strings.map((_, i) => (typeof arr[i] === "string" ? arr[i] : "")) });
        } catch {
          return json(502, { error: "Translation failed." });
        }
      },
    },
  },
});
