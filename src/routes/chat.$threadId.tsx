import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { convosKey } from "./chat";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Saved Legal Conversation — Nayabandhu" },
      { name: "description", content: "Continue a saved conversation about legal rights and procedures in India." },
      { property: "og:title", content: "Saved Legal Conversation — Nayabandhu" },
      { property: "og:description", content: "Continue your legal-awareness conversation in Nayabandhu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setInitial(null);
    (async () => {
      const { data: convo } = await supabase.from("conversations").select("id").eq("id", threadId).maybeSingle();
      if (!convo) {
        if (!cancelled) setMissing(true);
        return;
      }
      const { data, error } = await supabase
        .from("messages")
        .select("id, sdk_id, role, parts")
        .eq("conversation_id", threadId)
        .order("created_at");
      if (error) toast.error("Could not load messages.");
      if (!cancelled)
        setInitial((data ?? []).map((m) => ({ id: m.sdk_id ?? m.id, role: m.role as UIMessage["role"], parts: m.parts as UIMessage["parts"] })));
    })();
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: convosKey }), [qc]);
  const consumed = useCallback(() => {
    navigate({ to: "/chat/$threadId", params: { threadId }, search: {}, replace: true });
    setTimeout(refresh, 1500);
  }, [navigate, threadId, refresh]);

  if (missing) return <div className="grid flex-1 place-items-center text-muted-foreground">Conversation not found.</div>;
  if (!initial) return <div className="grid flex-1 place-items-center text-muted-foreground">Loading…</div>;
  return <ChatWindow key={threadId} threadId={threadId} initialMessages={initial} initialPrompt={q} onPromptConsumed={consumed} onFinished={refresh} />;
}
