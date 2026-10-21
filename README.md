# Pegandekan News

Portal berita responsif dengan halaman depan, Cloudflare Pages Functions, dan Cloudflare D1 sebagai basis data artikel.

## Fitur
- Halaman depan responsif: `index.html`; memuat artikel dari D1 bila database sudah terhubung dan tetap menampilkan konten demonstrasi jika belum ada artikel.
- API artikel publik: `GET /api/articles`, filter kategori `?category=daerah`, pencarian `?q=...`.
- API detail JSON: `GET /api/articles/:slug`.
- Halaman artikel HTML SEO-friendly: `/artikel/:slug/`, canonical URL, Open Graph, dan schema `NewsArticle`.
- Panel redaksi: `/admin.html` untuk menulis artikel, menyimpan draf, menerbitkan, dan menerbitkan draf.
- Endpoint admin menggunakan bearer token dari Cloudflare Pages variable/secret `ADMIN_TOKEN`.
- Sitemap dinamis: `/sitemap.xml`; robots: `/robots.txt`.
- Skema database: `migrations/0001_init.sql`.

## Deploy ke Cloudflare Pages
1. Buka Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Pilih repository `arjune867/pegandekan`, branch `main`.
3. Framework preset **None**, build command kosong, output directory `/`.
4. Buat database D1 bernama `pegandekan-news-db`.
5. Pada Pages project, Settings → Functions → D1 database bindings, tambahkan binding name `DB` ke database D1 tersebut.
6. Jalankan SQL dari `migrations/0001_init.sql` di D1 Console.
7. Tambahkan `ADMIN_TOKEN` sebagai secret/variable pada Pages project. Gunakan token acak panjang dan jangan commit token ke GitHub.
8. Redeploy. Uji `/api/articles`, `/sitemap.xml`, dan `/admin.html`.

File `wrangler.toml` berisi placeholder `REPLACE_WITH_YOUR_D1_DATABASE_ID`; ganti dengan ID D1 milik akun Anda jika memakai Wrangler. Untuk setup lewat Dashboard, binding `DB` di Pages harus diarahkan ke database yang benar.

## Catatan editorial dan keamanan
- Artikel contoh di halaman depan hanyalah demonstrasi; jangan menerbitkannya sebagai berita faktual.
- Verifikasi sumber, tanggal, kutipan, foto, dan fakta sebelum publikasi.
- Artikel disimpan sebagai teks biasa dan di-escape saat dirender; jangan menambahkan rendering HTML mentah tanpa sanitasi.
- Token admin adalah kontrol akses sederhana. Untuk redaksi multi-user, gunakan autentikasi dan pembatasan akses yang lebih kuat.
- Deployment ke Cloudflare belum dilakukan dari sesi ini; repository sudah berisi kode, tetapi tetap perlu konfigurasi D1 dan Pages sesuai langkah di atas.
