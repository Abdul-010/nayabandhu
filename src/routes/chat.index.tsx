import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useT, useI18n } from "@/lib/i18n";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Composer } from "@/components/chat/Composer";
import { DISCLAIMER, LANGUAGES, TOPICS } from "@/lib/legal";
import { useLanguage } from "@/components/chat/useLanguage";
import { convosKey } from "./chat";

export const Route = createFileRoute("/chat/")({
  head: () => ({
    meta: [
      { title: "Start a Legal Chat — Nayabandhu" },
      { name: "description", content: "Ask Nayabandhu about legal rights and procedures in India, in your chosen language." },
      { property: "og:title", content: "Start a Legal Chat — Nayabandhu" },
      { property: "og:description", content: "Start a multilingual legal-awareness conversation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewChat,
});

function NewChat() {
  const { user } = useAuth();
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [language, setLanguage] = useLanguage();
  const tr = useT();
  const [busy, setBusy] = useState(false);

  async function start(text: string) {
    if (!user || busy) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, language })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      toast.error("Could not start a conversation.");
      return;
    }
    qc.invalidateQueries({ queryKey: convosKey });
    navigate({ to: "/chat/$threadId", params: { threadId: data.id }, search: { q: text } });
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{tr("Namaste")}</p>
        <h1 className="mt-2 text-3xl md:text-4xl">{tr("How can I help you today?")}</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`rounded-full border px-3 py-1 text-sm transition ${language === l.code ? "border-primary bg-primary text-primary-foreground" : "hover:border-gold"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {TOPICS.slice(0, 6).map((t) => (
            <button key={t.title} onClick={() => start(tr(t.prompt))} disabled={busy} className="rounded-lg border bg-card p-4 text-left transition hover:border-gold hover:shadow-seal">
              <span className="font-display text-sm text-gold">{tr(t.title)}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{tr(t.prompt)}</span>
            </button>
          ))}
        </div>
        <div className="mt-8">
          <Composer {...(q ? { initial: q } : {})} busy={busy} onSend={(t) => void start(t)} />
          <p className="mt-3 text-center text-xs text-muted-foreground">{tr(DISCLAIMER)}</p>
        </div>
      </div>
    </div>
  );
}
