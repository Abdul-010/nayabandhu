import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";

const LANGS = ["English", "Kannada", "Hindi", "Tamil", "Telugu", "Malayalam"];

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  language: z.string().refine((l) => LANGS.includes(l)),
  messages: z.array(z.any()).min(1).max(200),
});

function systemPrompt(language: string) {
  return `You are Nayabandhu, an AI legal-awareness assistant for people in India.
- You are NOT a lawyer and must never claim or imply to be one. Never say "as your lawyer".
- Give clear, practical, educational information on Indian law: fundamental rights, consumer rights, tenant disputes, cyber crime, women's safety, FIR filing, RTI, free legal aid.
- Cite relevant laws where helpful (e.g. Constitution articles, BNS/BNSS 2023, Consumer Protection Act 2019, RTI Act 2005, IT Act 2000, state rent laws) and say when rules vary by state.
- For procedures, give a numbered step-by-step roadmap: where to go, documents needed, fees, timelines, and what to do if refused.
- If the user may be in danger, first give emergency numbers (112, women 1091/181, cyber fraud 1930).
- Suggest consulting a qualified advocate or the District Legal Services Authority (free legal aid, 15100) for their specific case.
- Use simple language and markdown formatting. Keep answers focused.
- Reply in ${language}${language === "English" ? "" : ` (use the ${language} script)`}, unless the user writes in another language.
- End every answer with this line, translated into the reply language: "This information is educational and not a substitute for professional legal advice."`;
}

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return json(401, "Please sign in.");

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json(400, "Invalid request.");
        const { conversationId, language } = parsed.data;
        const messages = parsed.data.messages as UIMessage[];

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) return json(401, "Session expired. Please sign in again.");
        const userId = userData.user.id;

        const { data: convo } = await supabase
          .from("conversations")
          .select("id, title")
          .eq("id", conversationId)
          .maybeSingle();
        if (!convo) return json(404, "Conversation not found.");

        const last = messages[messages.length - 1];
        if (last?.role === "user") {
          const { error } = await supabase
            .from("messages")
            .insert({ conversation_id: conversationId, user_id: userId, sdk_id: last.id, role: "user", parts: last.parts as never });
          if (error) console.error("save user message", error);
          if (convo.title === "New conversation") {
            const text = last.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim();
            await supabase
              .from("conversations")
              .update({ title: text.slice(0, 60) || "New conversation", language })
              .eq("id", conversationId);
          }
        }

        const apiKey = process.env.LOVABLE_API_KEY;
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
          instructions: systemPrompt(language),
          messages: await convertToModelMessages(messages),
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

        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: messages,
            sendReasoning: true,
            onFinish: async ({ responseMessage }) => {
              const { error } = await supabase.from("messages").insert({
                conversation_id: conversationId,
                user_id: userId,
                sdk_id: responseMessage.id,
                role: "assistant",
                parts: responseMessage.parts as never,
              });
              if (error) console.error("save assistant message", error);
              await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
            },
            onError: (e) => {
              console.error(e);
              const msg = String((e as Error)?.message ?? "");
              if (msg.includes("429")) return "Too many requests — please wait a moment and try again.";
              if (msg.includes("402")) return "AI credits are exhausted for this workspace.";
              return "Something went wrong generating the answer.";
            },
          }),
          runIdFetch,
        );
      },
    },
  },
});
