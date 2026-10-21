export async function onRequestGet({ request }) {
  const origin = new URL(request.url).origin;
  const body = "User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /api/admin/\nSitemap: " + origin + "/sitemap.xml\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
