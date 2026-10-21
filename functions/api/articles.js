export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "Database belum terhubung." }, 503);
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 50);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
  let sql = "SELECT id,title,slug,excerpt,image_url,category_slug,author,is_featured,published_at,created_at FROM articles WHERE status='published'";
  const params = [];
  if (category) { sql += " AND category_slug=?"; params.push(category); }
  if (q) { sql += " AND (title LIKE ? OR excerpt LIKE ?)"; params.push("%" + q + "%", "%" + q + "%"); }
  sql += " ORDER BY is_featured DESC, COALESCE(published_at, created_at) DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const { results = [] } = await env.DB.prepare(sql).bind(...params).all();
  return json({ articles: results, limit, offset });
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=60" } });
}
