import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Nayabandhu" },
      { name: "description", content: "Choose a new password for your Nayabandhu account." },
      { property: "og:title", content: "Set a new password — Nayabandhu" },
      { property: "og:description", content: "Reset your Nayabandhu password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    navigate({ to: "/chat" });
  }
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-3xl">Set a new password</h1>
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border bg-card p-6">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" minLength={6} maxLength={72} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button className="w-full" type="submit">Update password</Button>
        </form>
      </main>
    </div>
  );
}
