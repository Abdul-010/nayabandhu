import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PhoneCall, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { DISCLAIMER, HELPLINES, LANGUAGES, TOPICS } from "@/lib/legal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nayabandhu — AI Legal Rights Assistant for India" },
      { name: "description", content: "Understand your rights, file an FIR or RTI, and resolve consumer or tenant issues — in English, Kannada, Hindi, Tamil, Telugu and Malayalam." },
      { property: "og:title", content: "Nayabandhu — AI Legal Rights Assistant for India" },
      { property: "og:description", content: "Plain-language legal guidance in six Indian languages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.3fr_1fr] md:pt-24">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Nyaya · Bandhu — a friend in justice</p>
            <h1 className="mt-5 text-4xl leading-tight md:text-6xl">
              Know your rights.<br />
              <span className="italic text-gold">In your language.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base opacity-80 md:text-lg">
              Ask about FIRs, RTI, consumer complaints, tenant disputes, cyber fraud and women's safety — and get a clear, step-by-step answer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/chat">Ask a question <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gold/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/emergency"><ShieldCheck className="mr-1 h-4 w-4" /> Emergency rights</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <span key={l.code} className="rounded-full border border-primary-foreground/20 px-3 py-1 text-sm opacity-90">{l.label}</span>
              ))}
            </div>
          </div>
          <aside className="self-end rounded-xl border border-gold/40 bg-primary/60 p-6 backdrop-blur">
            <p className="flex items-center gap-2 font-display text-gold"><PhoneCall className="h-4 w-4" /> In danger right now?</p>
            <ul className="mt-4 divide-y divide-primary-foreground/10">
              {HELPLINES.slice(0, 4).map((h) => (
                <li key={h.number} className="flex items-baseline justify-between py-2.5">
                  <span className="text-sm opacity-85">{h.name}</span>
                  <a href={`tel:${h.number}`} className="font-display text-2xl text-gold">{h.number}</a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl md:text-3xl">What can I help with?</h2>
        <div className="rule-gold mt-4 max-w-xs" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOPICS.map((t, i) => (
            <Link
              key={t.title}
              to="/chat"
              search={{ q: t.prompt }}
              className="group rounded-lg border bg-card p-5 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-seal"
            >
              <span className="font-display text-sm text-gold">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-lg">{t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.prompt}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{DISCLAIMER}</p>
          <p className="mt-2">Nayabandhu is an AI assistant, not a lawyer. For your specific case, consult an advocate or your District Legal Services Authority.</p>
        </div>
      </footer>
    </div>
  );
}
