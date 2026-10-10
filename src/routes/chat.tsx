import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useT, useI18n } from "@/lib/i18n";
import { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Map, Menu, MessageSquare, Plus, Scale, ShieldAlert, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/chat")({
  validateSearch: z.object({ q: z.string().max(2000).optional() }),
  head: () => ({
    meta: [
      { title: "Legal Assistant Chat — Nayabandhu" },
      { name: "description", content: "Chat with Nayabandhu about your legal rights and procedures in India." },
      { property: "og:title", content: "Legal Assistant Chat — Nayabandhu" },
      { property: "og:description", content: "Ask legal questions in six Indian languages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatLayout,
});

export const convosKey = ["conversations"] as const;

function ChatLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const [open, setOpen] = useState(false);
  const tr = useT();


  const { data: convos = [] } = useQuery({
    queryKey: convosKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function remove(id: string) {
    await supabase.from("conversations").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: convosKey });
    if (params.threadId === id) navigate({ to: "/chat" });
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!user) return <GuestChat />;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-30 w-72 flex-col bg-sidebar text-sidebar-foreground md:static md:flex`}>
        <Link to="/" className="flex items-center gap-2 px-5 py-5">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-sidebar-primary text-sidebar-primary"><Scale className="h-4 w-4" /></span>
          <span className="font-display">Nayabandhu</span>
        </Link>
        <div className="px-3">
          <Button asChild className="w-full justify-start bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
            <Link to="/chat" onClick={() => setOpen(false)}><Plus className="mr-1 h-4 w-4" /> {tr("New conversation")}</Link>
          </Button>
        </div>
        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
          {convos.map((c) => (
            <div key={c.id} className={`group flex items-center rounded-md ${params.threadId === c.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"}`}>
              <Link to="/chat/$threadId" params={{ threadId: c.id }} onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="truncate">{c.title}</span>
              </Link>
              <button aria-label="Delete conversation" onClick={() => remove(c.id)} className="px-2 opacity-0 group-hover:opacity-70 hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </nav>
        <div className="space-y-1 border-t border-sidebar-border p-3 text-sm">
          <Link to="/roadmap" className="flex items-center gap-2 rounded-md px-3 py-2 text-sidebar-primary hover:bg-sidebar-accent"><Map className="h-4 w-4" /> {tr("Roadmap generator")}</Link>
          <Link to="/emergency" className="flex items-center gap-2 rounded-md px-3 py-2 text-sidebar-primary hover:bg-sidebar-accent"><ShieldAlert className="h-4 w-4" /> {tr("Emergency rights")}</Link>
          <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-2 rounded-md px-3 py-2 opacity-80 hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" /> <span className="truncate">{tr("Sign out")} · {user.email}</span>
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-primary/40 md:hidden" onClick={() => setOpen(false)} />}
      <main className="flex min-w-0 flex-1 flex-col">
        <button className="m-3 self-start rounded-md border p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open conversations"><Menu className="h-4 w-4" /></button>
        <Outlet />
      </main>
    </div>
  );
}

function GuestChat() {
  const { q } = Route.useSearch();
  const tr = useT();
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between bg-primary px-5 py-3 text-primary-foreground">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-gold text-gold"><Scale className="h-4 w-4" /></span>
          <span className="font-display">Nayabandhu</span>
          <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs text-gold-foreground">{tr("Demo")}</span>
        </Link>
        <Link to="/auth" className="text-sm underline opacity-90">{tr("Sign in to save chats")}</Link>
      </header>
      <ChatWindow threadId="guest" initialMessages={[]} initialPrompt={q} guest />
    </div>
  );
}
