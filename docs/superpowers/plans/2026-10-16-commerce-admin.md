# Falstore Commerce Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin operasional, promo otomatis, kategori/merek database, dan UI responsif tanpa mengganti tema.

**Architecture:** Pertahankan Express/PostgreSQL dan frontend yang ada. Tambahkan modul commerce untuk metadata dan promo; satu fungsi harga dipakai semua endpoint harga dan checkout. Migrasikan data tanpa menghapus produk/pesanan; invoice yang ada tetap immutable.

**Tech Stack:** Node.js 24, Express 5, pg, HTML/CSS/JavaScript, Bootstrap/jQuery yang sudah terpasang.

**Spec:** `docs/superpowers/specs/2026-10-16-commerce-admin-design.md`

## Global Constraints
- Tema merah-hitam, logo, font, dan susunan utama dipertahankan.
- Tidak mengganti framework atau menambah dependency untuk fungsi yang tersedia di platform.
- Tidak membuat transaksi gateway nyata selama pengujian.
- Harga integer rupiah, minimum Rp1; promo tidak ditumpuk.
- Invoice lama tidak berubah; harga checkout dihitung server.
- Semua endpoint admin memerlukan otorisasi server; jangan mengekspos secret/hash.
- Tidak mengubah `.env` pengguna atau melakukan commit tanpa permintaan.

## Review Focus
- Promo berakhir saat keranjang terbuka: quote diperbarui, checkout menghitung harga saat transaksi.
- Dua promo identik: harga tidak ditumpuk, ID terkecil menang.
- Metadata masih dipakai: DELETE mendapat 409, relasi tetap utuh.
- Update promo setelah invoice terbit: order_items.price dan total tidak berubah.
- Mobile tanpa hover: tombol beli/menu tetap dapat digunakan, halaman tidak melebar.

## Task 1: Metadata dan pricing server
**Files:** `server.js`, `api/commerce.js` (baru), `api/payments.js`, `scripts/commerce-regression.js` (baru).
**Interfaces:** `migrate(db)`, `install(app, db, auth, adminOnly)`, `priceProduct(product, promotions, now)`; hasil pricing `{price, basePrice, promotionId, discountAmount}`.

- [ ] Buat regression node:assert sebelum implementasi untuk harga, batas waktu, tumpang tindih dan pembulatan. Contoh wajib:
```js
const product = {id: 1, category_id: 2, price: 10001};
const promo = {id: 3, enabled: true, targetType: 'product', targetId: 1, discountType: 'percent', discountValue: 10, startsAt: '2026-10-16T00:00:00Z', endsAt: '2026-10-17T00:00:00Z'};
assert.deepEqual(priceProduct(product, [promo], new Date('2026-10-16T00:00:00Z')), {price: 9001, basePrice: 10001, promotionId: 3, discountAmount: 1000});
assert.equal(priceProduct(product, [promo], new Date(promo.endsAt)).price, 10001);
assert.equal(priceProduct(product, [{...promo, id: 4}, promo], new Date(promo.startsAt)).promotionId, 3);
```
- [ ] Jalankan `node scripts/commerce-regression.js`; simpan kegagalan yang membuktikan fitur belum ada.
- [ ] Buat tabel categories/brands dengan ID, name, slug unik serta indeks lower(name). Migrasikan nilai products.category ke categories dan category_id; tambah brand_id nullable. Setelah seluruh query/caller berpindah, hapus kolom kategori teks lama. Tidak menebak merek produk lama.
- [ ] Buat promotions dengan judul, keterangan, image, internal link, sort_order, enabled, starts_at, ends_at, target product/category, discount_type/value. Target relasional memiliki FK; validasi eksklusif product/category. Metadata yang dipakai produk/promo ditolak penghapusannya dengan 409.
- [ ] Fungsi harga hanya memilih promo aktif dan target cocok. Potongan persen `Math.floor(basePrice * value / 100)`, fixed rupiah, hasil `Math.max(1, basePrice - discount)`. Pilih minimum, tie ID terkecil. Validasi nominal aman dan persen 0 < value < 100.
- [ ] Public API: `GET /api/catalog/meta` menghasilkan `{categories:[{id,name,slug,productCount}],brands:[{id,name,slug,productCount}]}`; `GET /api/promotions` hanya promo aktif. CRUD admin `/api/admin/categories`, `/brands`, `/promotions` dengan POST/PUT/:id/DELETE/:id dan envelope sesuai nama resource.
- [ ] Ubah produk admin memakai categoryId/brandId dan harga dasar. Public product mempertahankan `price` sebagai harga efektif, menambahkan basePrice/promotionId/categoryId/categoryName/brandId/brandName. Filter/sort harga menggunakan harga efektif sebelum limit; jangan memilih halaman berdasarkan harga dasar.
- [ ] `POST /api/cart/quote` menerima `{items:[{id,quantity}]}` tervalidasi, membaca harga/stok sekarang dan mengembalikan `{items,total}`. Checkout memanggil fungsi harga yang sama setelah kunci produk, dengan satu waktu evaluasi untuk semua item. Simpan base_price/promotion_id/discount_amount snapshot pada order_items tanpa FK yang menghapus riwayat.
- [ ] Jalankan regresi harga dan pembayaran pada schema terisolasi; pastikan ulang invoice tidak melakukan create gateway baru.

## Task 2: Admin operasional
**Files:** `server.js`, `api/commerce.js`, `api/payments.js`, `public/admin.html`, `public/js/admin.js` (ekstraksi script admin jika dibutuhkan).
**Interfaces:** API metadata/promo Task 1; daftar pesanan memakai pencarian/status/limit/offset; pelanggan memakai proyeksi field aman.

- [ ] Dashboard tambahan `lowStock` (stok <= 5), `orderCounts`, pendapatan lunas. Jangan menghitung pending sebagai revenue.
- [ ] `GET /api/admin/customers?search=&limit=&offset=` dan `/api/admin/customers/:id/orders`: hanya identitas publik dan pesanan; limit 1..100, offset integer nonnegatif. Admin products/orders mendukung pencarian/filter/paginasi dengan urutan deterministik.
- [ ] Tambah orders.carrier/tracking_number. PATCH fulfillment menerima `{status,carrier,trackingNumber}`; shipped memerlukan kurir/resi valid; tetap paid->processing->shipped->completed dan idempoten pada status sama. Tidak menyediakan edit status paid manual.
- [ ] Susun bagian admin dashboard/produk/kategori/merek/promo/pesanan/pelanggan dengan tema yang sama. Form promo mendukung gambar melalui upload yang ada, target, tipe/nilai diskon, jadwal zona waktu eksplisit, urutan dan aktif. Tangani loading/empty/error, tombol proses, validasi dan konfirmasi hapus.
- [ ] Regresi HTTP: pelanggan mendapat 403 dari semua keluarga endpoint admin; kategori terpakai 409; resi kosong ditolak untuk shipped; customer response tidak berisi password_hash. Jalankan pemeriksaan DB terisolasi, tidak mutasi data pengguna untuk tes.

## Task 3: Storefront database dan UI responsif
**Files:** `public/js/catalog-api.js`, `product-api.js`, `falstore.js`, `checkout-api.js`, `search-ui.js`, `bahasa-indonesia.js`, `main.js`; halaman HTML terkait; `public/css/style.css`.
**Interfaces:** metadata, promo aktif, product pricing dan cart quote Task 1.

- [ ] Hapus kategori/merek/angka hitung hardcoded dari navigasi, pencarian, filter dan admin. Render metadata database dengan escaping. Pertahankan parameter kategori lama sebagai input navigasi bila dipakai tautan, bukan sumber data statis; semua caller menggunakan kontrak baru.
- [ ] Render banner pada area promo yang ada dengan kelas tema asli. Countdown berasal endsAt; tidak tampil bila tidak aktif. Tautan internal tervalidasi server. Hindari kilatan banner contoh sebelum fetch selesai.
- [ ] Produk/katalog menampilkan harga efektif, harga pembanding yang valid dan merek database. Keranjang quote ulang saat dibuka/diubah; cegah respons quote lama menimpa perubahan terbaru. Checkout menunjukkan total server dan QRIS seperti alur yang sudah ada.
- [ ] Perbaiki layout responsif: gambar tetap di kartu, judul panjang tidak melebar, header/search/menu tidak bertabrakan, tabel admin scroll lokal, form/input/tombol nyaman disentuh. Pertahankan warna/font/logo/struktur utama.
- [ ] Transisi hanya properti relevan; reduced-motion menonaktifkan animasi. Tombol beli terlihat pada touch; menu memiliki aria-expanded dan dapat ditutup keyboard. Loading/empty/error jelas tanpa alert berulang.
- [ ] Browser smoke 390/768/1366 px: beranda, katalog, produk, keranjang, akun, checkout, admin; periksa `document.documentElement.scrollWidth <= innerWidth`, navigasi, filter database, promo, quantity, form, panel QRIS. Gunakan fixture pembayaran terisolasi, bukan invoice nyata.

## Task 4: Integrasi dan dokumentasi
**Files:** `README.md`, `.env.example` hanya jika konfigurasi benar-benar bertambah, scripts regresi yang sudah ada.

- [ ] Jalankan `node scripts/commerce-regression.js`, `node scripts/payment-regression.js --database`, `npm run smoke`. Update kontrak test yang berubah, jangan pin teks/struktur implementasi.
- [ ] Verifikasi HTTP/browser: buat metadata dan promo pada database isolasi, ubah harga, buka katalog/keranjang, checkout fixture, ubah promo, buktikan invoice lama tetap sama. Verifikasi penolakan akses admin, stok bersaing dan cleanup schema uji.
- [ ] Review perubahan pricing/otorisasi dan visual. Perbaiki temuan sebelum klaim selesai.
- [ ] Update README berisi aturan promo, migrasi metadata, pengelolaan admin, prosedur verifikasi dan batas produksi/scheduler. Laporkan hanya hasil yang benar-benar dijalankan.
