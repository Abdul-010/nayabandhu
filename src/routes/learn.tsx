import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { DISCLAIMER } from "@/lib/legal";
import { KNOWLEDGE } from "@/lib/knowledge";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Legal Knowledge Base — RTI, FIR, Bail, Arrest Rights | Nayabandhu" },
      { name: "description", content: "Plain-language guides to RTI, FIR, bail, rights on arrest and detention, and free legal aid in India." },
      { property: "og:title", content: "Legal Knowledge Base — Nayabandhu" },
      { property: "og:description", content: "Learn about RTI, FIR, bail, detention rights and legal aid in six Indian languages." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const t = useT();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("Know the law")}</p>
        <h1 className="mt-3 text-3xl md:text-5xl">{t("Legal knowledge base")}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("Short, plain-language guides to the topics people ask about most.")}</p>

        <div className="mt-12 grid gap-10 md:grid-cols-[200px_1fr]">
          <nav className="top-6 h-fit space-y-1 text-sm md:sticky">
            {KNOWLEDGE.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block rounded-md px-3 py-2 hover:bg-secondary">{t(s.title)}</a>
            ))}
          </nav>

          <div className="space-y-14">
            {KNOWLEDGE.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-6">
                <h2 className="flex items-center gap-2 text-2xl md:text-3xl"><BookOpen className="h-5 w-5 text-gold" /> {t(s.title)}</h2>
                <div className="rule-gold mt-3 max-w-xs" />
                <p className="mt-4">{t(s.summary)}</p>
                <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{t("Law")}: {t(s.law)}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {s.points.map((p) => (
                    <div key={p.title} className="rounded-lg border bg-card p-5">
                      <h3 className="text-lg">{t(p.title)}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{t(p.body)}</p>
                    </div>
                  ))}
                </div>
                <Link to="/chat" search={{ q: t(s.ask) }} className="mt-4 inline-flex items-center gap-2 text-sm text-gold underline-offset-4 hover:underline">
                  <MessageSquare className="h-4 w-4" /> {t("Ask the assistant about this")}
                </Link>
              </section>
            ))}
          </div>
        </div>
        <p className="mt-14 border-t pt-6 text-sm font-medium">{t(DISCLAIMER)}</p>
      </main>
    </div>
  );
}
