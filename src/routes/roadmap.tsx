import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Map, Scale } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { DISCLAIMER, LANGUAGES, TOPICS } from "@/lib/legal";
import { useLanguage } from "@/components/chat/useLanguage";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Legal Roadmap Generator — Nayabandhu" },
      { name: "description", content: "Get a step-by-step filing roadmap for your legal issue in India — where to go, documents, fees and timelines." },
      { property: "og:title", content: "Legal Roadmap Generator — Nayabandhu" },
      { property: "og:description", content: "Step-by-step filing roadmaps for Indian legal issues, in six languages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const [language, setLanguage] = useLanguage();
  const [issue, setIssue] = useState("");
  const [details, setDetails] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate(issueText: string) {
    if (!issueText.trim() || busy) return;
    setBusy(true);
    setOutput("");
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue: issueText.trim(), details: details.trim() || undefined, language }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not generate the roadmap.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setOutput(text);
      }
    } catch (e) {
      toast.error((e as Error).message || "Could not generate the roadmap.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Step by step</p>
        <h1 className="mt-2 text-3xl md:text-4xl">Legal Roadmap Generator</h1>
        <p className="mt-3 text-muted-foreground">
          Describe your issue and get a clear filing roadmap: where to go, which documents you need, fees, timelines, and what to do if you are refused.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
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

        <div className="mt-6 space-y-3">
          <input
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Your issue, e.g. Landlord not returning my security deposit"
            className="w-full rounded-md border bg-card px-4 py-2.5 text-sm outline-none focus:border-gold"
            maxLength={300}
          />
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Optional details: your state, what happened so far, dates, amounts…"
            className="h-24 w-full resize-none rounded-md border bg-card px-4 py-2.5 text-sm outline-none focus:border-gold"
            maxLength={2000}
          />
          <Button onClick={() => generate(issue)} disabled={busy || issue.trim().length < 3} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Map className="mr-1 h-4 w-4" /> {busy ? "Generating…" : "Generate roadmap"}
          </Button>
        </div>

        {!output && !busy && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {TOPICS.slice(1, 5).map((t) => (
              <button
                key={t.title}
                onClick={() => {
                  setIssue(t.title);
                  generate(t.title);
                }}
                className="rounded-lg border bg-card p-4 text-left transition hover:border-gold hover:shadow-seal"
              >
                <span className="font-display text-sm text-gold">{t.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{t.prompt}</span>
              </button>
            ))}
          </div>
        )}

        {busy && !output && (
          <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-gold text-gold"><Scale className="h-4 w-4 animate-pulse" /></span>
            Drawing up your roadmap…
          </div>
        )}

        {output && (
          <div className="prose-legal mt-8 rounded-lg border bg-card p-6 text-sm">
            <ReactMarkdown>{output}</ReactMarkdown>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">{DISCLAIMER}</p>
      </main>
    </div>
  );
}
