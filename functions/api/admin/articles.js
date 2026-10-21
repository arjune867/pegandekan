export async function onRequestGet({ request, env }) {
  const denied = authorize(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: "Database belum terhubung." }, 503);
  const { results = [] } = await env.DB.prepare("SELECT * FROM articles ORDER BY updated_at DESC LIMIT 100").all();
  return json({ articles: results });
}

export async function onRequestPost({ request, env }) {
  const denied = authorize(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: "Database belum terhubung." }, 503);
  let data;
  try { data = await request.json(); } catch { return json({ error: "JSON tidak valid." }, 400); }
  const title = clean(data.title, 180);
  const slug = clean(data.slug || slugify(title), 180);
  const body = String(data.body || "").trim();
  const excerpt = clean(data.excerpt || body.slice(0, 220), 300);
  const image_url = clean(data.image_url, 1000);
  const category_slug = clean(data.category_slug || "nasional", 80);
  const author = clean(data.author || "Redaksi Pegandekan News", 120);
  const status = data.status === "published" ? "published" : "draft";
  const is_featured = data.is_featured ? 1 : 0;
  if (!title || !slug || !body) return json({ error: "Judul, slug, dan isi artikel wajib diisi." }, 400);
  if (image_url && !/^https:\/\//i.test(image_url)) return json({ error: "URL gambar harus menggunakan HTTPS." }, 400);
  const now = new Date().toISOString();
  try {
    await env.DB.prepare("INSERT INTO articles (title,slug,excerpt,body,image_url,category_slug,author,status,is_featured,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(title, slug, excerpt, body, image_url, category_slug, author, status, is_featured, status === "published" ? now : null, now, now).run();
    return json({ ok: true, slug, status }, 201);
  } catch (e) {
    return json({ error: "Artikel gagal disimpan. Pastikan slug belum dipakai dan kategori tersedia.", detail: String(e.message || e) }, 409);
  }
}

export async function onRequestPatch({ request, env }) {
  const denied = authorize(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: "Database belum terhubung." }, 503);
  let data;
  try { data = await request.json(); } catch { return json({ error: "JSON tidak valid." }, 400); }
  const id = Number(data.id);
  if (!Number.isInteger(id) || id < 1) return json({ error: "ID artikel tidak valid." }, 400);
  const status = data.status === "published" ? "published" : "draft";
  const now = new Date().toISOString();
  const result = await env.DB.prepare("UPDATE articles SET status=?, published_at=CASE WHEN ?='published' THEN COALESCE(published_at, ?) ELSE NULL END, updated_at=? WHERE id=?")
    .bind(status, status, now, now, id).run();
  if (!result.meta?.changes) return json({ error: "Artikel tidak ditemukan." }, 404);
  return json({ ok: true, id, status });
}

function authorize(request, env) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) return json({ error: "ADMIN_TOKEN belum disetel di Cloudflare Pages Variables." }, 503);
  if (request.headers.get("authorization") !== "Bearer " + expected) return json({ error: "Akses ditolak. Token admin tidak valid." }, 401);
  return null;
}
function clean(value, max) { return String(value || "").trim().slice(0, max); }
function slugify(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
