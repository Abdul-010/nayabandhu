import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useT, useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Nayabandhu" },
      { name: "description", content: "Sign in to save your legal questions and conversations." },
      { property: "og:title", content: "Sign in — Nayabandhu" },
      { property: "og:description", content: "Sign in to Nayabandhu AI Law Assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const tr = useT();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/chat" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/chat" } });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Password reset link sent to your email.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(String(result.error.message ?? result.error));
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-3xl">{tr(mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tr("Your conversations are private and saved to your account.")}</p>
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border bg-card p-6 shadow-seal">
          <div className="space-y-1.5">
            <Label htmlFor="email">{tr("Email")}</Label>
            <Input id="email" type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">{tr("Password")}</Label>
              <Input id="password" type="password" required minLength={6} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {tr(mode === "signin" ? "Sign in" : mode === "signup" ? "Sign up" : "Send reset link")}
          </Button>
          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
              <Button type="button" variant="outline" className="w-full" onClick={google}>{tr("Continue with Google")}</Button>
            </>
          )}
        </form>
        <div className="mt-5 flex justify-between text-sm">
          {mode === "signin" ? (
            <>
              <button className="underline" onClick={() => setMode("signup")}>Create account</button>
              <button className="text-muted-foreground underline" onClick={() => setMode("forgot")}>Forgot password?</button>
            </>
          ) : (
            <button className="underline" onClick={() => setMode("signin")}>Back to sign in</button>
          )}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground"><Link to="/">← Home</Link></p>
      </main>
    </div>
  );
}
