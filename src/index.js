import { onRequestGet as listArticles } from "../functions/api/articles.js";
import { onRequestGet as getArticleJson } from "../functions/api/articles/[slug].js";
import {
  onRequestGet as adminGet,
  onRequestPost as adminPost,
  onRequestPatch as adminPatch,
  onRequestDelete as adminDelete
} from "../functions/api/admin/articles.js";
import { onRequestGet as articlePage } from "../functions/artikel/[slug].js";
import { onRequestGet as sitemap } from "../functions/sitemap.xml.js";
import { onRequestGet as robots } from "../functions/robots.txt.js";

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname.replace(/\/{2,}/g, "/");
    const method = request.method.toUpperCase();

    try {
      if (path === "/api/articles" && method === "GET") {
        return await listArticles({ request, env, params: {} });
      }

      const apiArticle = path.match(/^\/api\/articles\/([^/]+)\/?$/);
      if (apiArticle && method === "GET") {
        return await getArticleJson({ request, env, params: { slug: decodeURIComponent(apiArticle[1]) } });
      }

      if (path === "/api/admin/articles") {
        const handlers = { GET: adminGet, POST: adminPost, PATCH: adminPatch, DELETE: adminDelete };
        if (handlers[method]) return await handlers[method]({ request, env, params: {} });
        return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST, PATCH, DELETE" } });
      }

      const article = path.match(/^\/artikel\/([^/]+)\/?$/);
      if (article && method === "GET") {
        return await articlePage({ request, env, params: { slug: decodeURIComponent(article[1]) } });
      }

      if (path === "/sitemap.xml" && method === "GET") return await sitemap({ request, env, params: {} });
      if (path === "/robots.txt" && method === "GET") return await robots({ request, env, params: {} });

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Pegandekan News request failed", error);
      return new Response("Terjadi kesalahan pada server.", {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }
  }
};
