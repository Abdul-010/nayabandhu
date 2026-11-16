import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, RotateCcw, ShieldCheck, ShieldOff, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { createKnowledgeSource, getAdminOverview, getKnowledgeIndexStatus, listKnowledgeSources, removeKnowledgeSource, resumeKnowledgeIndexing, setAdminRole } from "@/lib/admin.functions";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { extractPdfText } from "@/lib/extract-pdf";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Nayabandhu" },
      { name: "description", content: "Manage Nayabandhu users, admins and usage." },
      { property: "og:title", content: "Admin Dashboard — Nayabandhu" },
      { property: "og:description", content: "Nayabandhu administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const t = useT();
  const qc = useQueryClient();
  const fetchOverview = useServerFn(getAdminOverview);
  const setRole = useServerFn(setAdminRole);
  const { data, error, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview(), retry: false });
  const fetchSources = useServerFn(listKnowledgeSources);
  const addSource = useServerFn(createKnowledgeSource);
  const deleteSource = useServerFn(removeKnowledgeSource);
  const fetchIndexStatus = useServerFn(getKnowledgeIndexStatus);
  const resumeIndexing = useServerFn(resumeKnowledgeIndexing);
  const sourcesQuery = useQuery({ queryKey: ["knowledge-sources"], queryFn: () => fetchSources(), enabled: !!data, retry: false });
  const statusQuery = useQuery({ queryKey: ["knowledge-index-status"], queryFn: () => fetchIndexStatus(), enabled: !!data, retry: false });
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceBusy, setSourceBusy] = useState(false);
  const pdfInput = useRef<HTMLInputElement>(null);

  async function toggle(userId: string, admin: boolean) {
    try {
      await setRole({ data: { userId, admin } });
      toast.success(t(admin ? "Admin access granted." : "Admin access removed."));
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function uploadKnowledgeSource() {
    if (sourceBusy) return;
    const title = sourceTitle.trim() || sourceFile?.name.replace(/\.pdf$/iu, "").trim() || "";
    if (!title) {
      toast.error(t("Enter a document title."));
      return;
    }
    setSourceBusy(true);
    try {
      const content = sourceFile ? await extractPdfText(sourceFile) : sourceText.trim();
      if (!content) throw new Error(t("Choose a PDF or enter document text."));
      const result = await addSource({ data: { title, kind: sourceFile ? "pdf" : "text", content } });
      toast.success(`${t("Document added and indexed.")} ${result.chunkCount} ${t("searchable passages")}`);
      setSourceTitle("");
      setSourceText("");
      setSourceFile(null);
      if (pdfInput.current) pdfInput.current.value = "";
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["knowledge-sources"] }),
        qc.invalidateQueries({ queryKey: ["knowledge-index-status"] }),
      ]);
    } catch (e) {
      toast.error((e as Error).message || t("Could not index this document."));
      await qc.invalidateQueries({ queryKey: ["knowledge-index-status"] });
    } finally {
      setSourceBusy(false);
    }
  }

  async function removeSource(sourceId: string) {
    try {
      await deleteSource({ data: { sourceId } });
      toast.success(t("Document removed."));
      await qc.invalidateQueries({ queryKey: ["knowledge-sources"] });
    } catch (e) {
      toast.error((e as Error).message || t("Could not remove this document."));
    }
  }

  async function resumeIndex() {
    try {
      await resumeIndexing();
      await qc.invalidateQueries({ queryKey: ["knowledge-index-status"] });
      toast.success(t("Document indexing resumed."));
    } catch (e) {
      toast.error((e as Error).message || t("Could not resume indexing."));
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("Administration")}</p>
        <h1 className="mt-3 text-3xl md:text-4xl">{t("Admin dashboard")}</h1>

        {isLoading && <p className="mt-8 text-muted-foreground">{t("Loading…")}</p>}
        {error && (
          <div className="mt-8 rounded-lg border bg-card p-6">
            <p className="font-medium">{t("This page is only for administrators.")}</p>
            <Link to="/" className="mt-2 inline-block text-sm underline">{t("Home")}</Link>
          </div>
        )}

        {data && (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              {([
                ["Users", data.stats.users],
                ["Conversations", data.stats.conversations],
                ["Messages", data.stats.messages],
                ["Admins", data.stats.admins],
              ] as const).map(([label, n]) => (
                <div key={label} className="rounded-lg border bg-card p-5">
                  <p className="text-sm text-muted-foreground">{t(label)}</p>
                  <p className="mt-1 font-display text-3xl text-gold">{n}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-12 text-2xl">{t("Users")}</h2>
            <div className="rule-gold mt-3 max-w-xs" />
            <div className="mt-5 overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="p-3">{t("Email")}</th>
                    <th className="p-3">{t("Joined")}</th>
                    <th className="p-3">{t("Last sign-in")}</th>
                    <th className="p-3">{t("Conversations")}</th>
                    <th className="p-3">{t("Role")}</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">{u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString() : "—"}</td>
                      <td className="p-3">{u.conversations}</td>
                      <td className="p-3">{u.isAdmin ? <span className="rounded-full bg-gold px-2 py-0.5 text-xs text-gold-foreground">{t("Admin")}</span> : t("User")}</td>
                      <td className="p-3 text-right">
                        {u.isAdmin ? (
                          u.id !== data.me && (
                            <Button size="sm" variant="outline" onClick={() => toggle(u.id, false)}><ShieldOff className="mr-1 h-3.5 w-3.5" /> {t("Remove admin")}</Button>
                          )
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => toggle(u.id, true)}><ShieldCheck className="mr-1 h-3.5 w-3.5" /> {t("Make admin")}</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <section>
                <h2 className="text-2xl">{t("Languages used")}</h2>
                <ul className="mt-4 space-y-2">
                  {data.languages.length === 0 && <li className="text-sm text-muted-foreground">{t("No conversations yet.")}</li>}
                  {data.languages.map((l) => (
                    <li key={l.language} className="flex justify-between rounded-md border bg-card px-4 py-2 text-sm"><span>{l.language}</span><span className="text-gold">{l.count}</span></li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="text-2xl">{t("Recent conversations")}</h2>
                <ul className="mt-4 space-y-2">
                  {data.recent.map((c) => (
                    <li key={c.id} className="rounded-md border bg-card px-4 py-2 text-sm">
                      <p className="truncate font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.email} · {c.language} · {new Date(c.updated_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}

        {data && (
          <section className="mt-16 border-t pt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gold">{t("Reference library")}</p>
                <h2 className="mt-2 text-2xl">{t("Legal documents for chat")}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("Add trusted legal materials. Chat searches relevant passages and cites their document titles.")}</p>
              </div>
              {statusQuery.data?.blocked && (
                <Button variant="outline" onClick={resumeIndex}>
                  <RotateCcw className="mr-2 h-4 w-4" /> {t("Resume indexing")}
                </Button>
              )}
            </div>

            {statusQuery.data?.blocked && (
              <div role="alert" className="mt-5 border-l-2 border-destructive bg-muted px-4 py-3 text-sm">
                <p className="font-medium">{t("Document indexing is paused.")}</p>
                <p className="mt-1 text-muted-foreground">{statusQuery.data.safe_message || t("Restore AI access, then resume indexing.")}</p>
              </div>
            )}

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <Input value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} placeholder={t("Document title")} maxLength={160} aria-label={t("Document title")} />
                <div className="flex flex-wrap items-center gap-3">
                  <input ref={pdfInput} type="file" accept="application/pdf,.pdf" className="sr-only" aria-label={t("Choose a legal PDF")} onChange={(event) => setSourceFile(event.target.files?.[0] ?? null)} />
                  <Button type="button" variant="outline" onClick={() => pdfInput.current?.click()} disabled={sourceBusy}>
                    <FileText className="mr-2 h-4 w-4" /> {sourceFile ? sourceFile.name : t("Choose a legal PDF")}
                  </Button>
                  {sourceFile && <Button type="button" variant="ghost" size="sm" onClick={() => { setSourceFile(null); if (pdfInput.current) pdfInput.current.value = ""; }}>{t("Clear PDF")}</Button>}
                </div>
                <p className="text-xs text-muted-foreground">{t("Selectable text PDFs only, up to 50 pages and 10 MB. Scanned-image PDFs are not supported yet.")}</p>
                <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("or paste text")}<span className="h-px flex-1 bg-border" /></div>
                <Textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder={t("Paste legal guidance or source text here")} maxLength={200_000} rows={8} disabled={!!sourceFile || sourceBusy} aria-label={t("Legal source text")} />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{sourceText.length.toLocaleString()} / 200,000</span>
                  <Button onClick={uploadKnowledgeSource} disabled={sourceBusy || (!!sourceFile && sourceFile.size > 10 * 1024 * 1024) || (!sourceFile && !sourceText.trim())}>
                    <Upload className="mr-2 h-4 w-4" /> {t(sourceBusy ? "Reading and indexing…" : "Add to library")}
                  </Button>
                </div>
              </div>

              <div className="lg:border-l lg:pl-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg">{t("Library sources")}</h3>
                  <span className="text-sm text-muted-foreground">{sourcesQuery.data?.length ?? 0}</span>
                </div>
                {sourcesQuery.isLoading && <p className="mt-4 text-sm text-muted-foreground">{t("Loading…")}</p>}
                {sourcesQuery.error && <p role="alert" className="mt-4 text-sm text-destructive">{t("Could not load library sources.")}</p>}
                {sourcesQuery.data?.length === 0 && <p className="mt-4 text-sm text-muted-foreground">{t("No documents have been added yet.")}</p>}
                <ul className="mt-3 divide-y">
                  {sourcesQuery.data?.map((source) => (
                    <li key={source.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-4 w-4 shrink-0 text-gold" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{source.title}</p>
                          <p className="text-xs text-muted-foreground">{source.kind.toUpperCase()} · {source.chunk_count} {t("passages")}</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" aria-label={`${t("Remove")} ${source.title}`} onClick={() => removeSource(source.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
