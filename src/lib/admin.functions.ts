import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin access only");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: !!data };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: usersRes }, convos, msgs, roles, recent] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 200 }),
      supabaseAdmin.from("conversations").select("user_id, language"),
      supabaseAdmin.from("messages").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("user_roles").select("user_id, role").eq("role", "admin"),
      supabaseAdmin.from("conversations").select("id, title, language, updated_at, user_id").order("updated_at", { ascending: false }).limit(10),
    ]);
    const users = usersRes?.users ?? [];
    const admins = new Set((roles.data ?? []).map((r) => r.user_id));
    const perUser = new Map<string, number>();
    const perLang = new Map<string, number>();
    for (const c of convos.data ?? []) {
      perUser.set(c.user_id, (perUser.get(c.user_id) ?? 0) + 1);
      perLang.set(c.language, (perLang.get(c.language) ?? 0) + 1);
    }
    const emailOf = new Map(users.map((u) => [u.id, u.email ?? ""]));
    return {
      stats: { users: users.length, conversations: convos.data?.length ?? 0, messages: msgs.count ?? 0, admins: admins.size },
      languages: [...perLang.entries()].map(([language, count]) => ({ language, count })).sort((a, b) => b.count - a.count),
      users: users.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at ?? null,
        conversations: perUser.get(u.id) ?? 0,
        isAdmin: admins.has(u.id),
      })),
      recent: (recent.data ?? []).map((c) => ({ ...c, email: emailOf.get(c.user_id) ?? "" })),
      me: context.userId,
    };
  });

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid(), admin: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    if (data.userId === context.userId && !data.admin) throw new Error("You cannot remove your own admin access.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = data.admin
      ? await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role", ignoreDuplicates: true })
      : await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    if (res.error) throw new Error(res.error.message);
    return { ok: true };
  });
