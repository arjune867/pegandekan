export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  let rows = [];
  if (env.DB) {
    try {
      const result = await env.DB.prepare("SELECT slug, COALESCE(updated_at,published_at,created_at) AS updated FROM articles WHERE status='published' ORDER BY published_at DESC LIMIT 5000").all();
      rows = result.results || [];
    } catch {}
  }
  const urls = [
    `<url><loc>${escapeXml(origin + "/")}</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
    ...rows.map(row => `<url><loc>${escapeXml(origin + "/artikel/" + encodeURIComponent(row.slug) + "/")}</loc><lastmod>${escapeXml(new Date(row.updated).toISOString().slice(0,10))}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
function escapeXml(v) { return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"); }
