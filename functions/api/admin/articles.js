export async function onRequestGet({ request, env }) {
  const denied = authorize(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: "Database belum terhubung." }, 503);
  const { results = [] } = await env.DB.prepare("SELECT * FROM articles ORDER BY updated_at DESC LIMIT 200").all();
  return json({ articles: results });
}

export async function onRequestPost({ request, env }) {
  const denied = authorize(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: "Database belum terhubung." }, 503);
  let data;
  try { data = await request.json(); } catch { return json({ error: "JSON tidak valid." }, 400); }
  const article = normalize(data);
  const error = validate(article);
  if (error) return json({ error }, 400);
  const now = new Date().toISOString();
  try {
    await env.DB.prepare("INSERT INTO articles (title,slug,excerpt,body,image_url,category_slug,author,status,is_featured,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(article.title, article.slug, article.excerpt, article.body, article.image_url, article.category_slug, article.author, article.status, article.is_featured, article.status === "published" ? now : null, now, now).run();
    return json({ ok: true, slug: article.slug, status: article.status }, 201);
  } catch (e) {
    return json({ error: "Artikel gagal disimpan. Periksa apakah slug sudah digunakan dan kategori tersedia.", detail: String(e.message || e) }, 409);
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
  const now = new Date().toISOString();

  // Status-only patch, used by the one-click publish action.
  if (data.status !== undefined && data.title === undefined) {
    const status = data.status === "published" ? "published" : "draft";
    const result = await env.DB.prepare("UPDATE articles SET status=?, published_at=CASE WHEN ?='published' THEN COALESCE(published_at, ?) ELSE NULL END, updated_at=? WHERE id=?")
      .bind(status, status, now, now, id).run();
    if (!result.meta?.changes) return json({ error: "Artikel tidak ditemukan." }, 404);
    return json({ ok: true, id, status });
  }

  const article = normalize(data);
  const error = validate(article);
  if (error) return json({ error }, 400);
  try {
    const result = await env.DB.prepare("UPDATE articles SET title=?,slug=?,excerpt=?,body=?,image_url=?,category_slug=?,author=?,status=?,is_featured=?,published_at=CASE WHEN ?='published' THEN COALESCE(published_at, ?) ELSE NULL END,updated_at=? WHERE id=?")
      .bind(article.title, article.slug, article.excerpt, article.body, article.image_url, article.category_slug, article.author, article.status, article.is_featured, article.status, now, now, id).run();
    if (!result.meta?.changes) return json({ error: "Artikel tidak ditemukan." }, 404);
    return json({ ok: true, id, slug: article.slug, status: article.status });
  } catch (e) {
    return json({ error: "Artikel gagal diperbarui. Periksa slug dan kategori.", detail: String(e.message || e) }, 409);
  }
}

export async function onRequestDelete({ request, env }) {
  const denied = authorize(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: "Database belum terhubung." }, 503);
  let data;
  try { data = await request.json(); } catch { return json({ error: "JSON tidak valid." }, 400); }
  const id = Number(data.id);
  if (!Number.isInteger(id) || id < 1) return json({ error: "ID artikel tidak valid." }, 400);
  const result = await env.DB.prepare("DELETE FROM articles WHERE id=?").bind(id).run();
  if (!result.meta?.changes) return json({ error: "Artikel tidak ditemukan." }, 404);
  return json({ ok: true, id, deleted: true });
}

function normalize(data) {
  const title = clean(data.title, 180);
  return {
    title,
    slug: clean(data.slug || slugify(title), 180),
    body: String(data.body || "").trim().slice(0, 200000),
    excerpt: clean(data.excerpt || String(data.body || "").trim().slice(0, 220), 300),
    image_url: clean(data.image_url, 1000),
    category_slug: clean(data.category_slug || "nasional", 80),
    author: clean(data.author || "Redaksi Pegandekan News", 120),
    status: data.status === "published" ? "published" : "draft",
    is_featured: data.is_featured ? 1 : 0
  };
}
function validate(a) {
  if (!a.title || !a.slug || !a.body) return "Judul, slug, dan isi artikel wajib diisi.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug)) return "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.";
  if (a.image_url && !/^https:\/\//i.test(a.image_url)) return "URL gambar harus menggunakan HTTPS.";
  if (a.body.length < 40) return "Isi artikel terlalu pendek. Tambahkan informasi yang memadai.";
  return null;
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
