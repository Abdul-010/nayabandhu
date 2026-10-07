import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { DISCLAIMER, EMERGENCY_RIGHTS, HELPLINES } from "@/lib/legal";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency Rights & Helplines — Nayabandhu" },
      { name: "description", content: "Your rights on arrest, Zero FIR, and the national helplines for police, women, children and cyber fraud in India." },
      { property: "og:title", content: "Emergency Rights & Helplines — Nayabandhu" },
      { property: "og:description", content: "Know your rights on arrest and who to call in an emergency." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Emergency,
});

function Emergency() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Keep this page handy</p>
        <h1 className="mt-3 text-3xl md:text-5xl">Emergency rights</h1>
        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HELPLINES.map((h) => (
            <a key={h.number} href={`tel:${h.number}`} className="flex items-center gap-4 rounded-lg bg-primary p-5 text-primary-foreground transition hover:shadow-seal">
              <span className="font-display text-3xl text-gold">{h.number}</span>
              <span>
                <span className="block font-medium">{h.name}</span>
                <span className="text-sm opacity-75">{h.note}</span>
              </span>
            </a>
          ))}
        </section>
        <h2 className="mt-14 text-2xl">Your rights if detained or arrested</h2>
        <div className="rule-gold mt-4 max-w-xs" />
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {EMERGENCY_RIGHTS.map((r, i) => (
            <li key={r.title} className="rounded-lg border bg-card p-5">
              <span className="font-display text-gold">{i + 1}.</span>
              <h3 className="mt-1 text-lg">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-12 border-t pt-6 text-sm font-medium">{DISCLAIMER}</p>
      </main>
    </div>
  );
}
