import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Scale, Upload } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { DISCLAIMER, LANGUAGES } from "@/lib/legal";
import { useLanguage } from "@/components/chat/useLanguage";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Legal Document Analyzer — Nayabandhu" },
      { name: "description", content: "Upload an RTI form, FIR, notice or agreement as a PDF and get a plain-language summary in your language." },
      { property: "og:title", content: "Legal Document Analyzer — Nayabandhu" },
      { property: "og:description", content: "Plain-language summaries of legal PDFs in six Indian languages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  const [language, setLanguage] = useLanguage();
  const tr = useT();
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function pick(f: File | undefined) {
    if (!f) return;
    if (f.type !== "application/pdf") return toast.error(tr("Only PDF files are supported."));
    if (f.size > 10 * 1024 * 1024) return toast.error(tr("The PDF must be under 10 MB."));
    setFile(f);
    setOutput("");
  }

  async function analyze() {
    if (!file || busy) return;
    setBusy(true);
    setOutput("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("language", language);
      if (question.trim()) fd.append("question", question.trim());
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not analyse the document.");
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
      toast.error((e as Error).message || "Could not analyse the document.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{tr("Read it for me")}</p>
        <h1 className="mt-2 text-3xl md:text-4xl">{tr("Legal Document Analyzer")}</h1>
        <p className="mt-3 text-muted-foreground">
          {tr("Upload an RTI form, FIR, legal notice, agreement or court order as a PDF and get a plain-language summary: key points, deadlines and next steps.")}
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

        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files[0]);
          }}
          className="mt-6 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-card px-6 py-10 text-center transition hover:border-gold"
        >
          {file ? <FileText className="h-8 w-8 text-gold" /> : <Upload className="h-8 w-8 text-gold" />}
          <span className="font-medium">{file ? file.name : tr("Click or drop a PDF here")}</span>
          <span className="text-xs text-muted-foreground">{file ? `${(file.size / 1024).toFixed(0)} KB` : tr("PDF only, up to 10 MB")}</span>
        </button>
        <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={tr("Optional: ask a specific question about this document")}
          className="mt-3 h-20 w-full resize-none rounded-md border bg-card px-4 py-2.5 text-sm outline-none focus:border-gold"
          maxLength={1000}
        />
        <Button onClick={analyze} disabled={!file || busy} className="mt-3">
          <FileText className="mr-1 h-4 w-4" /> {tr(busy ? "Analysing…" : "Analyse document")}
        </Button>

        {busy && !output && (
          <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-gold text-gold"><Scale className="h-4 w-4 animate-pulse" /></span>
            {tr("Reading your document…")}
          </div>
        )}

        {output && (
          <div className="prose-legal mt-8 rounded-lg border bg-card p-6 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">{tr(DISCLAIMER)}</p>
      </main>
    </div>
  );
}
