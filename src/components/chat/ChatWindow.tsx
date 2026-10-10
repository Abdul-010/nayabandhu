import { useEffect, useMemo, useRef } from "react";
import { useT, useI18n } from "@/lib/i18n";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Composer } from "@/components/chat/Composer";
import { useLanguage } from "@/components/chat/useLanguage";
import { DISCLAIMER, LANGUAGES, TOPICS } from "@/lib/legal";

export function ChatWindow({
  threadId,
  initialMessages,
  initialPrompt,
  onPromptConsumed,
  onFinished,
  guest,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  initialPrompt?: string | undefined;
  onPromptConsumed?: () => void;
  onFinished?: () => void;
  guest?: boolean;
}) {
  const [language, setLanguage] = useLanguage();
  const tr = useT();
  const langRef = useRef(language);
  langRef.current = language;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          if (guest) return {};
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
        body: () => ({ conversationId: threadId, language: langRef.current }),
      }),
    [threadId, guest],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message || "Request failed."),
    onFinish: () => onFinished?.(),
  });

  const sentInitial = useRef(false);
  useEffect(() => {
    if (initialPrompt && !sentInitial.current && initialMessages.length === 0) {
      sentInitial.current = true;
      sendMessage({ text: initialPrompt });
      onPromptConsumed?.();
    }
  }, [initialPrompt, initialMessages.length, sendMessage, onPromptConsumed]);

  const busy = status === "submitted" || status === "streaming";
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-end gap-2 border-b px-5 py-2">
        <label className="text-xs text-muted-foreground" htmlFor="lang">{tr("Reply in")}</label>
        <select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-md border bg-card px-2 py-1 text-sm">
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-5 py-8">
          {messages.length === 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">{tr("Namaste")}</p>
              <h1 className="mt-2 text-3xl md:text-4xl">{tr("How can I help you today?")}</h1>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {TOPICS.slice(0, 6).map((t) => (
                  <button key={t.title} onClick={() => sendMessage({ text: tr(t.prompt) })} className="rounded-lg border bg-card p-4 text-left transition hover:border-gold hover:shadow-seal">
                    <span className="font-display text-sm text-gold">{tr(t.title)}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{tr(t.prompt)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
                    {m.parts.map((p, i) => (p.type === "text" ? <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{p.text}</ReactMarkdown> : null))}
                  </div>
                </>
              )}
            </div>
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-gold text-gold"><Scale className="h-4 w-4 animate-pulse" /></span>
              {tr("Looking into the law…")}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{tr("The answer could not be completed. Please try again.")}</p>}
          <div ref={bottom} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-5 pb-4">
        <Composer busy={busy} onSend={(text) => sendMessage({ text })} onStop={stop} />
        <p className="mt-2 text-center text-xs text-muted-foreground">{tr(DISCLAIMER)}</p>
      </div>
    </div>
  );
}
