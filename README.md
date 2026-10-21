# Pegandekan News

Portal berita responsif untuk Cloudflare Workers, dengan aset statis, API berita, halaman artikel SEO, sitemap, dan panel redaksi.

## Deploy Cloudflare Workers

Repository ini memakai **Cloudflare Workers**, bukan Pages. Jangan gunakan `npx wrangler pages deploy` untuk target `workers.dev`.

- Worker name: `pegandekan`
- Entry point: `src/index.js`
- Static assets: `public/`
- Deploy command: `npx wrangler deploy`
- Website: `https://pegandekan.lagulawas7080.workers.dev`

Di Cloudflare Workers Builds, hubungkan repository `arjune867/pegandekan`, branch `main`, lalu gunakan perintah deploy `npx wrangler deploy`. File `wrangler.toml` menentukan entry point dan folder aset.

## Fitur

- Halaman depan responsif di `public/index.html`.
- Panel redaksi di `public/admin.html`.
- API publik: `GET /api/articles` dengan filter kategori `?category=daerah`, pencarian `?q=...`, dan pagination `?limit=20&offset=0`.
- Detail JSON: `GET /api/articles/:slug`.
- Endpoint publikasi untuk ChatGPT GPT Actions: `POST /api/chat/publish`.
- Halaman artikel SEO: `/artikel/:slug/`, canonical, Open Graph, dan schema `NewsArticle`.
- Panel redaksi: buat, edit, draf, terbitkan, dan hapus artikel.
- Sitemap dinamis: `/sitemap.xml`; robots: `/robots.txt`.
- Skema database: `migrations/0001_init.sql`.

## Aktifkan database dan admin

Deployment aset dan Worker dapat berjalan tanpa D1, tetapi API berita dan panel redaksi membutuhkan database.

1. Buat database D1 bernama `pegandekan-news-db` di Cloudflare Dashboard.
2. Jalankan SQL pada `migrations/0001_init.sql` melalui D1 Console.
3. Salin database ID D1. Tambahkan konfigurasi ini ke `wrangler.toml` dan ganti nilai ID dengan ID asli:

```toml
[[d1_databases]]
binding = "DB"
database_name = "pegandekan-news-db"
database_id = "MASUKKAN_D1_DATABASE_ID_ASLI"
migrations_dir = "migrations"
```

4. Commit perubahan `wrangler.toml`, lalu deploy ulang.
5. Atur secret `ADMIN_TOKEN` pada konfigurasi Worker di Cloudflare Dashboard (Settings → Variables and Secrets). Gunakan token acak yang panjang; jangan simpan token di GitHub.
6. Buka `/admin.html`, masukkan token, lalu klik **Hubungkan & Muat Artikel**.

Tanpa binding D1, endpoint API berita mengembalikan status 503. Tanpa secret `ADMIN_TOKEN`, panel admin tidak bisa mengelola artikel.

## Posting langsung lewat ChatGPT

Endpoint khusus untuk GPT Actions tersedia di `/api/chat/publish`. Endpoint ini **langsung menerbitkan** artikel, bukan menyimpannya sebagai draf. Ia menggunakan secret `ADMIN_TOKEN` yang sama dengan panel admin dan membutuhkan D1 aktif.

1. Pastikan D1 dan secret `ADMIN_TOKEN` telah dikonfigurasi dan Worker berhasil di-deploy.
2. Di ChatGPT, buat atau buka GPT milik Anda di GPT Builder yang mendukung **Actions**.
3. Tambahkan Action dengan mengimpor spesifikasi [chatgpt-action-openapi.json](./chatgpt-action-openapi.json).
4. Pada Authentication pilih **API Key**, tipe **Bearer**, lalu masukkan nilai secret `ADMIN_TOKEN`. Jangan menaruh token pada schema atau file GitHub.
5. Simpan GPT. Gunakan GPT tersebut untuk menulis dan menerbitkan berita.

Properti wajib untuk action: `title`, `body`, dan `thumbnail_url`. `thumbnail_url` harus merupakan URL HTTPS yang dapat diakses publik. Action saat ini menerima URL thumbnail yang sudah di-host; ia **belum mengunggah file gambar ke Cloudflare R2 secara otomatis**. Buat atau siapkan thumbnail, host di layanan gambar yang dapat diakses publik, lalu berikan URL-nya. Periksa fakta, sumber, hak cipta gambar, dan isi artikel sebelum memerintahkan penerbitan. Jangan memasukkan token ke percakapan biasa.

Spesifikasi Action: `chatgpt-action-openapi.json`.

## Alur redaksi manual

1. Buka `/admin.html`.
2. Masukkan secret `ADMIN_TOKEN`.
3. Isi judul, slug, kategori, ringkasan, isi artikel, URL gambar HTTPS, dan penulis.
4. Simpan sebagai draf atau terbitkan setelah memeriksa fakta dan sumber.
5. Gunakan daftar artikel untuk edit, ubah status, atau hapus artikel.

## Catatan

- `public/index.html` dan `public/admin.html` adalah versi yang disajikan oleh Workers. Jika mengubah desain, sinkronkan file tersebut dengan `index.html` dan `admin.html` di root repository.
- Artikel contoh di halaman depan merupakan konten demonstrasi. Ganti dengan berita yang telah diverifikasi sebelum dipublikasikan.
- API admin memakai bearer token sederhana. Untuk redaksi multi-user, pertimbangkan autentikasi lebih kuat, rate limiting, audit log, dan backup D1.
