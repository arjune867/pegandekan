# Pegandekan News

Portal berita responsif dengan halaman depan, Cloudflare Pages Functions, dan Cloudflare D1 sebagai basis data artikel.

## Fitur portal dan redaksi
- Halaman depan responsif: `index.html`; memuat artikel dari D1 bila database terhubung.
- API publik: `GET /api/articles` dengan filter kategori `?category=daerah`, pencarian `?q=...`, pagination `?limit=20&offset=0`.
- Detail JSON: `GET /api/articles/:slug`.
- Halaman artikel SEO: `/artikel/:slug/`, canonical URL, Open Graph, schema `NewsArticle`.
- Panel redaksi `/admin.html`: membuat artikel, pratinjau judul/ringkasan/gambar, edit artikel, filter draf/terbit, terbitkan, kembalikan ke draf, hapus artikel.
- API admin dilindungi bearer token dari Cloudflare Pages secret/variable `ADMIN_TOKEN`.
- Sitemap dinamis: `/sitemap.xml`; robots: `/robots.txt`.
- Skema database: `migrations/0001_init.sql`.

## Deploy ke Cloudflare Pages
1. Buka Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Pilih repository `arjune867/pegandekan`, branch `main`.
3. Framework preset **None**, build command kosong, output directory `/`.
4. Buat database D1 bernama `pegandekan-news-db`.
5. Pada Pages project, Settings → Functions → D1 database bindings, tambahkan binding name `DB` dan arahkan ke database D1 tersebut.
6. Jalankan SQL dari `migrations/0001_init.sql` di D1 Console.
7. Tambahkan `ADMIN_TOKEN` sebagai secret/variable pada Pages project. Gunakan token acak panjang dan jangan commit token ke GitHub.
8. Redeploy. Uji `/api/articles`, `/sitemap.xml`, dan `/admin.html`.

File `wrangler.toml` masih berisi placeholder `REPLACE_WITH_YOUR_D1_DATABASE_ID`; ganti dengan ID D1 akun Anda jika memakai Wrangler. Jika menggunakan Dashboard, pastikan binding `DB` terhubung ke database yang benar.

## Alur publikasi
1. Buka `/admin.html` pada domain Pages yang sudah terpasang.
2. Masukkan token `ADMIN_TOKEN`, lalu klik **Hubungkan & Muat Artikel**.
3. Isi judul, slug, kategori, ringkasan, isi, URL gambar HTTPS, dan penulis.
4. Pilih **Simpan sebagai draf** untuk menyimpan tanpa menerbitkan, atau **Terbitkan sekarang** setelah editor memeriksa fakta dan sumber.
5. Pada daftar artikel, tombol **Edit** memperbarui artikel, **Terbitkan/Jadikan Draf** mengubah status, dan **Hapus** menghapus artikel secara permanen.

## Catatan keamanan dan editorial
- Token hanya disimpan di sessionStorage tab browser, tetapi tetap rahasia; keluar setelah selesai, khususnya pada perangkat bersama.
- API membatasi akses tulis dengan token dan mengembalikan artikel admin tanpa cache.
- Artikel disimpan sebagai teks biasa dan di-escape ketika dirender; jangan menambahkan rendering HTML mentah tanpa sanitasi.
- Validasi dasar menolak URL gambar non-HTTPS, slug tidak valid, dan isi yang terlalu pendek.
- Artikel contoh pada halaman depan adalah konten demonstrasi; jangan menerbitkannya sebagai berita faktual. Periksa fakta, sumber, tanggal, kutipan, hak foto, dan potensi konflik kepentingan.
- Deployment ke Cloudflare belum dilakukan dari sesi ini. Repository telah diperbarui, tetapi fitur yang menggunakan D1 belum akan berjalan sampai binding dan secret dikonfigurasi.
- Token admin adalah kontrol akses sederhana. Untuk redaksi multi-user atau akses publik yang besar, pertimbangkan autentikasi lebih kuat, audit log, rate limiting, dan proses backup D1.
