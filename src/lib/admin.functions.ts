import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chunkKnowledgeText, embedKnowledgeChunks, KnowledgeEmbeddingError } from "@/lib/knowledge-indexing.server";

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

export const listKnowledgeSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("knowledge_sources")
      .select("id, title, kind, chunk_count, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const removeKnowledgeSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sourceId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("knowledge_sources").delete().eq("id", data.sourceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const knowledgeSourceInput = z.object({
  title: z.string().trim().min(1).max(160),
  kind: z.enum(["pdf", "text"]),
  content: z.string().trim().min(1).max(200_000),
});

export const createKnowledgeSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => knowledgeSourceInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: status, error: statusError } = await supabaseAdmin
      .from("knowledge_embedding_status")
      .select("blocked, safe_message")
      .eq("singleton", true)
      .maybeSingle();
    if (statusError) throw new Error("Could not check document indexing status.");
    if (status?.blocked) throw new Error(status.safe_message || "Document indexing is paused until access is restored.");

    const chunks = chunkKnowledgeText(data.content);
    if (!chunks.length) throw new Error("No readable text was found in this document.");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI indexing is not configured.");
    let vectors: number[][];
    try {
      vectors = await embedKnowledgeChunks(apiKey, chunks);
    } catch (error) {
      if (error instanceof KnowledgeEmbeddingError && (error.status === 402 || error.status === 403)) {
        await supabaseAdmin.from("knowledge_embedding_status").upsert({
          singleton: true,
          blocked: true,
          status_code: error.status,
          safe_message: error.message,
          updated_at: new Date().toISOString(),
        }, { onConflict: "singleton" });
      }
      throw error;
    }

    const { data: source, error: sourceError } = await supabaseAdmin
      .from("knowledge_sources")
      .insert({ title: data.title, kind: data.kind, content: data.content, chunk_count: chunks.length, created_by: context.userId })
      .select("id")
      .single();
    if (sourceError || !source) throw new Error(sourceError?.message || "Could not save this document.");

    const rows = chunks.map((content, chunk_index) => ({
      source_id: source.id,
      chunk_index,
      content,
      embedding: `[${vectors[chunk_index]?.join(",") ?? ""}]`,
    }));
    for (let start = 0; start < rows.length; start += 100) {
      const { error } = await supabaseAdmin.from("knowledge_chunks").insert(rows.slice(start, start + 100));
      if (error) {
        await supabaseAdmin.from("knowledge_sources").delete().eq("id", source.id);
        throw new Error(error.message);
      }
    }
    return { ok: true, sourceId: source.id, chunkCount: chunks.length };
  });

export const getKnowledgeIndexStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("knowledge_embedding_status")
      .select("blocked, status_code, safe_message, updated_at")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? { blocked: false, status_code: null, safe_message: null, updated_at: null };
  });

export const resumeKnowledgeIndexing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("knowledge_embedding_status").upsert({
      singleton: true,
      blocked: false,
      status_code: null,
      safe_message: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "singleton" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
