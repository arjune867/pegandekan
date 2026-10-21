export async function onRequestGet({ params, env }) {
  if (!env.DB) return json({ error: "Database belum terhubung." }, 503);
  const article = await env.DB.prepare("SELECT id,title,slug,excerpt,body,image_url,category_slug,author,is_featured,published_at,created_at,updated_at FROM articles WHERE slug=? AND status='published' LIMIT 1").bind(params.slug).first();
  if (!article) return json({ error: "Artikel tidak ditemukan." }, 404);
  return json({ article });
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=60" } });
}
