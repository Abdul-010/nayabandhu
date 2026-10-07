import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Composer } from "@/components/chat/Composer";
import { useLanguage } from "@/components/chat/useLanguage";
import { DISCLAIMER, LANGUAGES } from "@/lib/legal";
import { convosKey } from "./chat";

export const Route = createFileRoute("/chat/$threadId")({
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setInitial(null);
    (async () => {
      const { data: convo } = await supabase.from("conversations").select("id").eq("id", threadId).maybeSingle();
      if (!convo) return !cancelled && setMissing(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id, sdk_id, role, parts")
        .eq("conversation_id", threadId)
        .order("created_at");
      if (error) toast.error("Could not load messages.");
      if (!cancelled)
        setInitial(
          (data ?? []).map((m) => ({ id: m.sdk_id ?? m.id, role: m.role as UIMessage["role"], parts: m.parts as UIMessage["parts"] })),
        );
    })();
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  if (missing) return <div className="grid flex-1 place-items-center text-muted-foreground">Conversation not found.</div>;
  if (!initial) return <div className="grid flex-1 place-items-center text-muted-foreground">Loading…</div>;
  return <ChatWindow key={threadId} threadId={threadId} initialMessages={initial} />;
}

function ChatWindow({ threadId, initialMessages }: { threadId: string; initialMessages: UIMessage[] }) {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [language, setLanguage] = useLanguage();
  const langRef = useRef(language);
  langRef.current = language;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
        body: () => ({ conversationId: threadId, language: langRef.current }),
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message || "Request failed."),
    onFinish: () => qc.invalidateQueries({ queryKey: convosKey }),
  });

  const sentInitial = useRef(false);
  useEffect(() => {
    if (q && !sentInitial.current && initialMessages.length === 0) {
      sentInitial.current = true;
      sendMessage({ text: q });
      navigate({ to: "/chat/$threadId", params: { threadId }, search: {}, replace: true });
      setTimeout(() => qc.invalidateQueries({ queryKey: convosKey }), 1500);
    }
  }, [q, initialMessages.length, sendMessage, navigate, threadId, qc]);

  const busy = status === "submitted" || status === "streaming";
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-end gap-2 border-b px-5 py-2">
        <label className="text-xs text-muted-foreground" htmlFor="lang">Reply in</label>
        <select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-md border bg-card px-2 py-1 text-sm">
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-5 py-8">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex gap-3"}>
              {m.role === "user" ? (
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
                </div>
              ) : (
                <>
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold text-gold"><Scale className="h-4 w-4" /></span>
                  <div className="prose-legal min-w-0 flex-1 text-sm">
                    {m.parts.map((p, i) =>
                      p.type === "text" ? <ReactMarkdown key={i}>{p.text}</ReactMarkdown> : null,
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-gold text-gold"><Scale className="h-4 w-4 animate-pulse" /></span>
              Looking into the law…
            </div>
          )}
          {error && <p className="text-sm text-destructive">The answer could not be completed. Please try again.</p>}
          <div ref={bottom} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-5 pb-4">
        <Composer busy={busy} onSend={(text) => sendMessage({ text })} onStop={stop} />
        <p className="mt-2 text-center text-xs text-muted-foreground">{DISCLAIMER}</p>
      </div>
    </div>
  );
}
