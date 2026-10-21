import { onRequestPost as createAdminArticle } from "../admin/articles.js";

/**
 * Endpoint intended for a configured ChatGPT GPT Action.
 * Authorization uses the same ADMIN_TOKEN secret as the editorial panel.
 * Requires a hosted HTTPS thumbnail URL; raw image upload is handled separately.
 */
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_TOKEN) {
    return json({ error: "ADMIN_TOKEN belum disetel pada Worker." }, 503);
  }
  if (request.headers.get("authorization") !== "Bearer " + env.ADMIN_TOKEN) {
    return json({ error: "Akses ditolak. Token publikasi tidak valid." }, 401);
  }
  if (!env.DB) return json({ error: "Database D1 belum terhubung." }, 503);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Body harus berupa JSON yang valid." }, 400);
  }

  const title = String(data.title || "").trim();
  const body = String(data.body || "").trim();
  const imageUrl = String(data.thumbnail_url || data.image_url || "").trim();
  if (!title || !body) return json({ error: "title dan body wajib diisi." }, 400);
  if (!/^https:\/\//i.test(imageUrl)) {
    return json({ error: "thumbnail_url wajib berupa URL gambar HTTPS." }, 400);
  }
  if (body.length < 40) return json({ error: "Isi artikel terlalu pendek." }, 400);

  const payload = {
    title,
    slug: data.slug,
    excerpt: data.excerpt || body.slice(0, 220),
    body,
    image_url: imageUrl,
    category_slug: data.category_slug || "daerah",
    author: data.author || "Redaksi Pegandekan News",
    status: "published",
    is_featured: Boolean(data.is_featured)
  };

  const internalRequest = new Request(request.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + env.ADMIN_TOKEN
    },
    body: JSON.stringify(payload)
  });

  const response = await createAdminArticle({ request: internalRequest, env, params: {} });
  if (!response.ok) return response;

  const result = await response.json();
  return json({
    ok: true,
    message: "Artikel berhasil diterbitkan.",
    slug: result.slug,
    status: result.status,
    url: new URL("/artikel/" + result.slug + "/", request.url).toString(),
    thumbnail_url: imageUrl
  }, 201);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
