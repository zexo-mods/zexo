import { requireSupabase } from "./supabase";

type ModRow = {
  id: string; title: string; slug: string; description: string; version: string;
  thumbnail_url: string | null; download_count: number; creator_id: string;
  category_id: number | null; categories?: { name: string } | null;
};

const slugify = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

async function creatorNames(rows: ModRow[]) {
  const client = requireSupabase();
  const ids = [...new Set(rows.map((row) => row.creator_id).filter(Boolean))];
  if (!ids.length) return new Map<string, string>();
  const { data, error } = await client.from("profiles").select("id,username,display_name").in("id", ids);
  if (error) throw error;
  return new Map((data || []).map((p) => [p.id, p.display_name || p.username]));
}

function shape(row: ModRow, names: Map<string, string>) {
  return {
    ...row,
    category: row.categories?.name || "Add-ons",
    creator_name: names.get(row.creator_id) || "Community creator",
  };
}

async function currentUser() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in to continue.");
  return data.user;
}

async function hasRole(role: "creator" | "admin") {
  const client = requireSupabase();
  const user = await currentUser();
  const { data, error } = await client.from("user_roles").select("role").eq("user_id", user.id).eq("role", role).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(role === "admin" ? "Admin access required." : "Creator access is not enabled for this account yet. Ask a ZEXO admin to grant creator access.");
  return user;
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const client = requireSupabase();
  const method = (options.method || "GET").toUpperCase();
  const body = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
  const cleanPath = path.split("?")[0];

  if (cleanPath === "/mods" && method === "GET") {
    const params = new URLSearchParams(path.split("?")[1] || "");
    const q = (params.get("q") || "").trim().slice(0, 80);
    const sort = params.get("sort");
    let query = client.from("mods")
      .select("id,title,slug,description,version,thumbnail_url,download_count,creator_id,category_id,categories(name)")
      .eq("status", "published")
      .limit(40);
    if (q) query = query.or(`title.ilike.%${q.replace(/[%(),]/g, " ")}%,description.ilike.%${q.replace(/[%(),]/g, " ")}%`);
    if (sort === "downloads") query = query.order("download_count", { ascending: false });
    else if (sort === "updated") query = query.order("updated_at", { ascending: false });
    else query = query.order("published_at", { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data || []) as unknown as ModRow[];
    const names = await creatorNames(rows);
    return { items: rows.map((row) => shape(row, names)) } as T;
  }

  if (cleanPath.startsWith("/mods/") && method === "GET") {
    const slug = decodeURIComponent(cleanPath.slice("/mods/".length));
    const { data, error } = await client.from("mods")
      .select("id,title,slug,description,version,thumbnail_url,download_count,creator_id,category_id,categories(name)")
      .eq("slug", slug).eq("status", "published").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Content not found.");
    const row = data as unknown as ModRow;
    const names = await creatorNames([row]);
    return { item: shape(row, names) } as T;
  }

  if (cleanPath === "/auth/register" && method === "POST") {
    const { username, email, password } = body as { username: string; email: string; password: string };
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { data: { username, display_name: username } },
    });
    if (error) throw error;
    return { user: data.user, needsEmailConfirmation: !data.session } as T;
  }

  if (cleanPath === "/auth/login" && method === "POST") {
    const { email, password } = body as { email: string; password: string };
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user } as T;
  }

  if (cleanPath === "/auth/logout" && method === "POST") {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    return { ok: true } as T;
  }

  if (cleanPath === "/auth/me" && method === "GET") {
    const user = await currentUser();
    return { user } as T;
  }

  if (cleanPath === "/creator/overview" && method === "GET") {
    const user = await hasRole("creator");
    const { data, error } = await client.from("mods").select("status").eq("creator_id", user.id);
    if (error) throw error;
    const rows = data || [];
    return {
      total_uploads: rows.length,
      published_uploads: rows.filter((row) => row.status === "published").length,
      pending_submissions: rows.filter((row) => ["pending_review", "under_review"].includes(row.status)).length,
    } as T;
  }

  if (cleanPath === "/creator/submissions" && method === "POST") {
    const user = await hasRole("creator");
    const input = body as { title: string; description: string; category: string; version: string; minecraft_versions: string; credits: string };
    if (!input.title || !input.description || !input.version) throw new Error("Title, description and version are required.");
    const { data: category, error: categoryError } = await client.from("categories").select("id").eq("name", input.category || "Add-ons").maybeSingle();
    if (categoryError) throw categoryError;
    const slug = `${slugify(input.title)}-${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await client.from("mods").insert({
      creator_id: user.id,
      category_id: category?.id ?? null,
      title: input.title,
      slug,
      description: input.description,
      version: input.version,
      minecraft_versions: (input.minecraft_versions || "").split(",").map((v) => v.trim()).filter(Boolean),
      credits: input.credits || "",
      status: "draft",
    }).select("id,status").single();
    if (error) throw error;
    return data as T;
  }

  if (cleanPath === "/admin/overview" && method === "GET") {
    await hasRole("admin");
    const count = async (table: string, filters?: [string, string][]) => {
      let q = client.from(table).select("*", { count: "exact", head: true });
      for (const [column, value] of filters || []) q = q.eq(column, value);
      const { count, error } = await q;
      if (error) throw error;
      return count || 0;
    };
    const [total_users, total_creators, total_mods, published_content, pending_submissions] = await Promise.all([
      count("profiles"), count("user_roles", [["role", "creator"]]), count("mods"),
      count("mods", [["status", "published"]]), count("mods", [["status", "pending_review"]]),
    ]);
    return { total_users, total_creators, total_mods, published_content, pending_submissions } as T;
  }

  if (cleanPath === "/admin/moderation" && method === "GET") {
    await hasRole("admin");
    const { data, error } = await client.from("mods")
      .select("id,title,slug,description,status,created_at,categories(name),creator_id")
      .in("status", ["pending_review", "under_review"])
      .order("created_at", { ascending: true }).limit(100);
    if (error) throw error;
    const rows = (data || []) as unknown as ModRow[];
    const names = await creatorNames(rows);
    return { items: rows.map((row) => shape(row, names)) } as T;
  }

  if (cleanPath.startsWith("/admin/mods/") && method === "POST") {
    await hasRole("admin");
    const parts = cleanPath.split("/");
    const modId = parts[3];
    const action = parts[4];
    const reason = (body as { reason?: string })?.reason || "";
    const status = action === "approve" ? "published" : action === "reject" ? "rejected" : action === "request-changes" ? "changes_requested" : null;
    if (!status) throw new Error("Unknown moderation action.");
    const { data: updated, error } = await client.from("mods").update({
      status, moderation_feedback: reason, updated_at: new Date().toISOString(),
      ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
    }).eq("id", modId).select("id,creator_id").single();
    if (error) throw error;
    const { error: logError } = await client.from("moderation_logs").insert({
      admin_id: (await currentUser()).id, mod_id: modId, action, reason,
    });
    if (logError) throw logError;
    const { error: activityError } = await client.from("admin_activity_logs").insert({
      admin_id: (await currentUser()).id, action, target_type: "mod", target_id: modId,
    });
    if (activityError) throw activityError;
    return { ok: true, status: updated ? status : null } as T;
  }

  if (cleanPath.startsWith("/downloads/") && method === "POST") {
    const user = await currentUser();
    const modId = cleanPath.slice("/downloads/".length);
    const { data: file, error } = await client.from("mod_files")
      .select("id,storage_path").eq("mod_id", modId).eq("scan_status", "clean").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!file) throw new Error("No approved download file is available yet.");
    const { data: signed, error: signError } = await client.storage.from("mod-files").createSignedUrl(file.storage_path, 60);
    if (signError) throw signError;
    const { error: logError } = await client.from("downloads").insert({ user_id: user.id, mod_id: modId, file_id: file.id });
    if (logError) throw logError;
    return { url: signed.signedUrl } as T;
  }

  throw new Error(`Unsupported ZEXO API operation: ${method} ${path}`);
}
