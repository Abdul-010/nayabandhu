import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { getAdminOverview, setAdminRole } from "@/lib/admin.functions";
import { useT } from "@/lib/i18n";

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

  async function toggle(userId: string, admin: boolean) {
    try {
      await setRole({ data: { userId, admin } });
      toast.success(t(admin ? "Admin access granted." : "Admin access removed."));
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (e) {
      toast.error((e as Error).message);
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
      </main>
    </div>
  );
}
