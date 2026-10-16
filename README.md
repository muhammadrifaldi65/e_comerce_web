# Falstore

Aplikasi web e-commerce sederhana untuk penjualan alat elektronik. Proyek ini dibuat sebagai tugas kuliah untuk menerapkan konsep pengembangan aplikasi web full-stack, mulai dari perancangan antarmuka, pengelolaan data, autentikasi pengguna, pengelolaan produk, hingga proses pembuatan pesanan.

## Identitas Mahasiswa

| No. | Nama Mahasiswa             | NIM          | Kelas |
| --- | -------------------------- | ------------ | ----- |
| 1   | _Muhammad Rifaldi_         | _2410010153_ | _5 A_ |
| 2   | _Muhammad Ivanda Stevhany_ | _2410010190_ | _5 A_ |
| 3   | _Fachri Albar_             | _2410010211_ | _5 A_ |


## Deskripsi Proyek

Falstore menyediakan katalog produk elektronik dengan halaman beranda, katalog, detail produk, keranjang belanja, wishlist, checkout, akun pengguna, dan dashboard admin.

Aplikasi menggunakan frontend berbasis HTML, CSS, dan JavaScript serta backend Node.js dengan Express. Data pengguna, produk, pesanan, dan item pesanan disimpan di Neon PostgreSQL melalui driver `pg`. Gambar produk diunggah ke ImageKit dan frontend menggunakan URL delivery ImageKit langsung untuk sementara. File SQLite lokal tidak digunakan oleh server.

## Tujuan Pembelajaran

Proyek ini dirancang untuk menunjukkan penerapan:

- Struktur aplikasi web multi-halaman.
- Integrasi frontend dengan REST API.
- Operasi CRUD produk.
- Autentikasi dan otorisasi berbasis JWT.
- Hash kata sandi menggunakan bcrypt.
- Pengelolaan keranjang dan wishlist per akun menggunakan `localStorage` dengan namespace berdasarkan ID pengguna.
- Upload gambar produk.
- Transaksi database untuk pembuatan pesanan dan pengurangan stok.
- Pengujian alur utama menggunakan smoke test.

## Fitur Utama

### Fitur pelanggan

- Melihat katalog produk elektronik.
- Mencari produk berdasarkan nama atau deskripsi.
- Menunggu 350 ms setelah tombol pencarian ditekan atau Enter digunakan, menggunakan debounce untuk mencegah navigasi ganda.
- Memfilter produk berdasarkan kategori.
- Melihat detail produk dan produk terkait.
- Menambahkan produk ke keranjang belanja.
- Menyimpan produk ke wishlist.
- Melihat subtotal dan ringkasan keranjang.
- Membuat akun pelanggan dan login.
- Membuat pesanan setelah login.
- Memvalidasi stok sebelum pesanan disimpan.
- Melihat informasi akun.
- Menggunakan antarmuka berbahasa Indonesia.
- Gambar katalog tetap di dalam kartu, termasuk gambar yang dibungkus tautan produk; desain asli dipertahankan.
- Sesudah checkout atau membuka kembali pesanan, halaman langsung memfokuskan panel pembayaran QRIS; tombol pembuatan pesanan disembunyikan.

### Fitur admin

- Login sebagai administrator.
- Melihat statistik jumlah produk, pelanggan, pesanan, dan pendapatan.
- Menambahkan produk.
- Mengubah produk.
- Menghapus produk.
- Menandai produk sebagai produk unggulan.
- Mengunggah gambar produk ke ImageKit dengan batas ukuran 4 MB agar aman terhadap batas body request Vercel.
- Melihat daftar pesanan.
- Kelola kategori dan merek dari database; penghapusan data yang masih dipakai ditolak.
- Kelola banner dan promo otomatis: target produk/kategori, persen/rupiah, jadwal, urutan, aktif/nonaktif.
- Cari/filter produk, pesanan, pelanggan; lihat riwayat pelanggan, stok menipis, dan ringkasan status pesanan.
- Proses pengiriman pesanan lunas dengan kurir dan nomor resi.

### Aturan promo

Harga dasar produk menjadi dasar perhitungan. Harga coret hanya pembanding. Promo berlaku saat waktu mulai tercapai sampai sebelum waktu selesai; waktu disimpan UTC dan form admin menampilkan zona waktu perangkat. Potongan persen dibulatkan ke bawah, harga akhir minimum Rp1. Promo tidak ditumpuk: harga terendah menang, ID terkecil memecahkan hasil seri. Katalog, filter harga, detail, quote keranjang, checkout dan QRIS menggunakan perhitungan server yang sama. Invoice yang telah dibuat tetap menyimpan harga lama walaupun promo berubah.

Kategori lama dimigrasikan menjadi relasi database; merek lama kosong sampai admin mengisinya. Menu dan jumlah produk mengikuti data aktual. Tampilan merah-hitam tetap; kontrol sentuh, fokus keyboard, reduced-motion dan layout responsif diperbaiki tanpa mengganti framework.
Produk lama dengan harga Rp0 dinormalisasi menjadi Rp1 saat migrasi agar memenuhi minimum QRIS; harga pesanan historis tidak diubah. Update detail produk mengunci baris agar stok yang sedang dicadangkan checkout tidak tertimpa oleh perubahan nama/deskripsi.

## Teknologi yang Digunakan

| Bagian          | Teknologi                                                   |
| --------------- | ----------------------------------------------------------- |
| Runtime         | Node.js 20 atau lebih baru                                  |
| Backend         | Express 5                                                   |
| Database        | Neon PostgreSQL melalui `pg`                       |
| Autentikasi     | JSON Web Token (`jsonwebtoken`)                             |
| Hash kata sandi | `bcryptjs`                                                  |
| Upload file     | `multer` dan ImageKit REST API                           |
| Frontend        | HTML5, CSS3, JavaScript browser                             |
| UI pendukung    | Bootstrap, Font Awesome, jQuery, Slick Carousel, noUiSlider |

## Persyaratan Sistem

Sebelum menjalankan proyek, pastikan perangkat telah memiliki:

- Node.js versi 20 atau lebih baru.
- npm.
- Browser modern seperti Chrome, Edge, atau Firefox.

Versi Node.js dapat diperiksa dengan perintah berikut:

```bash
node --version
npm --version
```

## Instalasi

1. Clone repository atau salin folder proyek ke komputer.

2. Masuk ke folder proyek:

   ```bash
   cd "C:/WEBSITE E-COMERCE ALAT ELECTRONIC"
   ```

3. Install dependency:

   ```bash
   npm install
   ```

4. Jalankan server:

   ```bash
   npm start
   ```

5. Buka aplikasi melalui browser:

   ```text
   http://localhost:3000
   ```

Saat pertama kali dijalankan, server membuat tabel dan seed katalog di database Neon, lalu membuat atau menyinkronkan akun admin dari environment. Gambar yang diunggah melalui dashboard disimpan di ImageKit.
Gambar baru dikirim langsung menggunakan URL delivery ImageKit agar tidak bergantung pada proxy backend. Path internal `/uploads/<nama-file>` tetap tersedia sebagai fallback untuk data lama, tetapi dapat mengalami timeout jika server tidak dapat mengakses CDN ImageKit.


## Perintah yang Tersedia

| Perintah        | Fungsi                                       |
| --------------- | -------------------------------------------- |
| `npm start`     | Menjalankan server dalam mode normal         |
| `npm run dev`   | Menjalankan server dengan Node.js watch mode |
| `npm run smoke` | Menjalankan pengujian alur utama API         |

## Konfigurasi Environment

Konfigurasi aplikasi disimpan di file `.env` dan tidak boleh di-upload ke repository. Server memuat file tersebut menggunakan `dotenv`.

1. Salin template environment:

   ```bash
   cp .env.example .env
   ```

   Pada Windows PowerShell, gunakan:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Buat project di Neon, salin connection string PostgreSQL dari dashboard Neon, lalu isi file `.env`:

   | Variable         | Contoh                                                  | Keterangan                             |
   | ---------------- | -------------------------------------------------------- | -------------------------------------- |
   | `PORT`           | `3000`                                                   | Port HTTP server                       |
   | `DATABASE_URL`   | `postgresql://user:password@host/neondb?sslmode=require` | Connection string database Neon        |
   | `JWT_SECRET`     | `secret-jwt-yang-kuat`                                   | Secret untuk menandatangani token JWT  |
   | `ADMIN_EMAIL`    | `admin@example.com`                                      | Email akun admin awal                  |
   | `ADMIN_PASSWORD`       | `password-admin-yang-kuat`                              | Kata sandi akun admin awal                  |
   | `IMAGEKIT_PRIVATE_KEY` | `private-key-imagekit`                                  | Private key ImageKit untuk upload dan hapus |
   | `IMAGEKIT_FOLDER`      | `/falstore/products`                                    | Folder penyimpanan di ImageKit              |
   | `AXIOM_API_KEY` | Secret API key pelanggan Axiom | Hanya di server; wajib untuk membuat QRIS |
   | `CRON_SECRET` | Secret acak khusus scheduler | Otorisasi rekonsiliasi pembayaran terjadwal |

`DATABASE_URL` wajib menggunakan connection string Neon. `IMAGEKIT_PRIVATE_KEY` hanya boleh disimpan sebagai environment variable rahasia. Server tidak lagi membaca `data/falstore.sqlite`. Jangan commit connection string atau secret.

3. Jalankan server:

   ```bash
   npm start
   ```

   Pada startup pertama, schema, lima produk demo, dan akun admin dibuat di Neon. Jika akun admin sudah ada, `ADMIN_PASSWORD` akan disinkronkan saat server dijalankan ulang. Setelah mengubah `.env`, restart server sebelum mencoba login.

File `.env.example` boleh di-upload karena hanya berisi nama variable dan contoh nilai. File `.env` sudah masuk `.gitignore`.
## Deployment ke Vercel

Project mengekspor aplikasi Express langsung dari `server.js`, sedangkan `public/` berisi asset statis dan `vercel.json` mempertahankan konfigurasi deployment. Semua endpoint `/api/*` ditangani oleh Express Vercel.

1. Push repository ke GitHub, lalu import repository tersebut di Vercel.
2. Atau gunakan CLI:

   ```bash
   npx vercel
   ```

Pada Vercel, isi environment variables berikut di Project Settings → Environment Variables:

```text
DATABASE_URL
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
IMAGEKIT_PRIVATE_KEY
IMAGEKIT_FOLDER
AXIOM_API_KEY
CRON_SECRET
```

`PORT` tidak wajib di Vercel karena server menggunakan port default saat dijalankan sebagai Function. Jangan upload `.env` ke Vercel atau repository. Neon menyimpan data secara persisten, sedangkan upload gambar menggunakan ImageKit sehingga tidak bergantung pada filesystem Vercel. Ukuran file upload dibatasi 4 MB karena Vercel memiliki batas payload request Function.

Setelah deployment selesai, buka URL Vercel dan uji login admin, katalog, checkout, serta upload gambar.

Atur scheduler hosting setiap menit untuk `GET /api/payments/reconcile` dengan header `Authorization: Bearer <CRON_SECRET>`. Endpoint memeriksa maksimal 10 invoice yang paling lama belum diperiksa per panggilan. Tanpa scheduler, pembayaran diperiksa ketika halaman pembayaran atau admin dibuka. Origin Axiom ditetapkan ke `https://portal.axiomcreative.xyz`; tidak ada opsi base URL alternatif.


## Akun Demo

Isi `ADMIN_EMAIL` dan `ADMIN_PASSWORD` pada `.env` digunakan untuk membuat atau menyinkronkan akun admin di Neon:

```text
Email    : sesuai ADMIN_EMAIL
Password : sesuai ADMIN_PASSWORD
```

Gunakan kredensial yang berbeda untuk deployment publik. Pelanggan baru dapat membuat akun melalui halaman `account.html`.


## Struktur Direktori

```text
.
├── public/
│   ├── admin.html            # Dashboard administrator
│   ├── account.html          # Login, registrasi, dan profil pengguna
│   ├── cart.html             # Keranjang belanja
│   ├── checkout.html         # Form checkout
│   ├── contact.html          # Halaman kontak
│   ├── index.html            # Halaman beranda
│   ├── product.html          # Halaman detail produk
│   ├── store.html            # Halaman katalog
│   ├── wishlist.html         # Daftar keinginan
│   ├── css/                  # Style aplikasi
│   ├── js/                   # JavaScript frontend
│   ├── img/                  # Logo dan aset gambar produk
│   └── fonts/                # Font yang digunakan UI
├── server.js                 # Server Express, database, auth, dan API
├── package.json              # Konfigurasi proyek dan dependency
├── .env.example              # Template konfigurasi environment
├── vercel.json               # Routing deployment Vercel
└── scripts/
    └── smoke-test.js         # Pengujian alur utama backend
```

## Alur Penggunaan

1. Pengunjung membuka halaman beranda atau katalog.
2. Pengunjung mencari produk atau memilih kategori.
3. Produk ditambahkan ke keranjang atau wishlist.
4. Pengunjung membuat akun atau login.
5. Pengunjung mengisi data checkout dan memilih metode pembayaran.
6. Backend memeriksa produk serta ketersediaan stok.
7. Pesanan dan item pesanan disimpan dalam satu transaksi database.
8. Stok produk dikurangi setelah pesanan berhasil dibuat.
9. Admin dapat mengelola produk dan memantau data pesanan melalui dashboard.

## REST API

Base URL API: `http://localhost:3000/api`

### Endpoint umum

| Method | Endpoint              | Auth         | Keterangan                    |
| ------ | --------------------- | ------------ | ----------------------------- |
| `GET`  | `/health`             | Tidak        | Memeriksa status API          |
| `POST` | `/auth/register`      | Tidak        | Membuat akun pelanggan        |
| `POST` | `/auth/login`         | Tidak        | Login pelanggan atau admin    |
| `GET`  | `/auth/me`            | Bearer token | Mengambil data pengguna aktif |
| `GET`  | `/products`           | Tidak        | Mengambil katalog produk      |
| `GET`  | `/products/:idOrSlug` | Tidak        | Mengambil detail produk       |
| `POST` | `/orders`             | Bearer token | Membuat pesanan pelanggan     |
| `GET` | `/orders` | Bearer token | Riwayat pesanan milik akun |
| `GET` | `/orders/:id/payment` | Bearer token | Detail dan pemeriksaan pembayaran milik akun |
| `GET` | `/catalog/meta` | Tidak | Kategori/merek dan jumlah produk aktual |
| `GET` | `/promotions` | Tidak | Banner dan promo aktif |
| `POST` | `/cart/quote` | Tidak | Harga dan stok terbaru untuk `{items:[{id,quantity}]}` |

Parameter yang tersedia pada `GET /products`:

- `category`: filter kategori, misalnya `laptop` atau `kamera`.
- `categoryId`, `brandId`: filter ID metadata database; `brand` menerima slug merek.
- `search`: pencarian berdasarkan nama atau deskripsi.
- `featured=1`: hanya menampilkan produk unggulan.
- `minPrice` dan `maxPrice`: membatasi harga minimum dan maksimum dalam rupiah.
- `sort`: `popular`, `latest`, `price_asc`, atau `price_desc`.
- `limit`: membatasi jumlah hasil, maksimal 50.

### Endpoint admin

Semua endpoint berikut memerlukan header:

```http
Authorization: Bearer <token>
```

| Method   | Endpoint               | Keterangan                    |
| -------- | ---------------------- | ----------------------------- |
| `GET`    | `/admin/stats`         | Mengambil statistik dashboard |
| `GET`    | `/admin/products`      | Mengambil seluruh produk      |
| `POST`   | `/admin/products`      | Menambahkan produk            |
| `PUT`    | `/admin/products/:id`  | Mengubah produk               |
| `DELETE` | `/admin/products/:id`  | Menghapus produk              |
| `POST`   | `/admin/uploads/image` | Mengunggah gambar produk      |
| `GET`    | `/admin/orders`        | Mengambil daftar pesanan      |
| `GET` | `/admin/orders/:id/payment` | Memeriksa pembayaran pesanan |
| `PATCH` | `/admin/orders/:id` | Pemenuhan berurutan: `processing`, `shipped`, `completed`; hanya pesanan lunas |
| `POST` | `/admin/orders/:id/payment/reconcile` | Hubungkan invoice asli dengan `qrisId` dan `confirmOriginalInvoice: true` setelah pemeriksaan operator |
| `GET/POST` | `/admin/categories`, `/admin/brands`, `/admin/promotions` | Daftar/tambah metadata dan promo |
| `PUT/DELETE` | `/admin/categories/:id`, `/admin/brands/:id`, `/admin/promotions/:id` | Ubah/hapus dengan validasi relasi |
| `GET` | `/admin/customers`, `/admin/customers/:id/orders` | Pelanggan dan riwayat tanpa kredensial |

Contoh request produk:

```json
{
  "name": "Keyboard Mekanis",
  "slug": "keyboard-mekanis",
  "categoryId": 1,
  "brandId": null,
  "price": 750000,
  "oldPrice": 850000,
  "stock": 10,
  "description": "Keyboard mekanis untuk kebutuhan kerja dan gaming.",
  "image": "/img/product01.png",
  "isFeatured": true
}
```

Gunakan `categoryId`/`brandId` aktual dari `/api/catalog/meta`; ID contoh bukan nilai tetap.

## Pengujian

Smoke test menjalankan server sementara dan memeriksa alur penting berikut:

- Health check API.
- Katalog memiliki data awal.
- Endpoint admin menolak request tanpa autentikasi.
- Login admin.
- Create, update, dan delete produk.
- Upload ImageKit hanya jika `SMOKE_IMAGEKIT_UPLOAD=1`; opsi ini menggunakan penyimpanan eksternal nyata.

Jalankan dengan:

```bash
npm run smoke
```

Output yang diharapkan:

```text
Smoke test lulus: health, katalog, proteksi admin, login, CRUD produk (upload eksternal dilewati).
```

Regresi pembayaran: `node scripts/payment-regression.js`. Integrasi HTTP dan transaksi PostgreSQL: `node scripts/payment-regression.js --database`. Pemeriksaan database menggunakan schema acak terisolasi yang dihapus sesudahnya; panggilan gateway dicegat oleh fixture lokal, bukan transaksi uang nyata.

Regresi promo: `node scripts/commerce-regression.js`. Integrasi metadata, promo, quote, checkout dan snapshot invoice: `node scripts/commerce-integration.js`; schema terisolasi dibersihkan dan gateway tidak dihubungi.

## Keamanan dan Batasan

Proyek ini dibuat untuk pembelajaran dan demonstrasi lokal. Beberapa hal yang perlu diperhatikan:

- Kredensial admin bawaan harus diganti pada penggunaan nyata.
- `JWT_SECRET` bawaan tidak boleh digunakan di production.
- Pembayaran menggunakan QRIS dinamis Axiom. Nominal berasal dari harga database saat checkout; secret tidak dikirim ke browser. Aktivasi memerlukan `AXIOM_API_KEY` milik merchant.
- Keranjang dan wishlist setiap akun dipisahkan berdasarkan ID pengguna di `localStorage` browser; data tamu memakai namespace terpisah.
- Reset kata sandi dan verifikasi email belum tersedia; jangan menganggap akun telah memverifikasi kepemilikan email.
- Neon PostgreSQL digunakan sebagai database terpusat; SQLite lokal tidak digunakan saat login maupun operasi API.
- URL delivery ImageKit digunakan langsung oleh frontend untuk sementara; endpoint proxy internal tetap tersedia untuk kompatibilitas data lama.

### Pembayaran QRIS Axiom

Dokumentasi provider: https://portal.axiomcreative.xyz/docs.

- Server membuat invoice melalui `POST /create-qris` dengan header `x-api-key`. Batas nominal Rp1–Rp10.000.000 per invoice.
- Harga pesanan dibekukan saat checkout; perubahan harga produk tidak mengubah tagihan yang sudah dibuat.
- Komisi provider 2% dipotong dari penerimaan merchant, bukan ditambahkan kepada pembeli. Simpan snapshot biaya dari respons provider.
- Axiom belum menyediakan webhook pembayaran pelanggan. Status diperiksa melalui `/check-payment` menggunakan identitas invoice; pencocokan nominal saja tidak cukup.
- Invoice hanya dianggap lunas setelah identitas dan nominal cocok dengan konfirmasi pembayaran dari provider. Gangguan jaringan bukan bukti pembayaran gagal.
- Axiom tidak mendukung idempotency key untuk pembuatan invoice. Jangan mengulang pembuatan invoice saat hasil permintaan ambigu; rekonsiliasi referensi yang sama.
- Reservasi stok untuk invoice kedaluwarsa atau hasil ambigu tetap ditahan: Axiom masih dapat mengonfirmasi pembayaran terlambat. Jangan mengembalikan stok otomatis tanpa penyelesaian dengan provider. Admin perlu merekonsiliasi invoice asli, bukan membuat tagihan pengganti berdasarkan nominal saja.
- API key disimpan di `.env` lokal atau environment hosting. Jangan menaruh secret dalam HTML, JavaScript browser, URL, log, atau repository.
- Verifikasi pembayaran nyata memerlukan akun merchant aktif dan API key. Tanpa kredensial, pengujian lokal tidak membuktikan settlement produksi.

## Lisensi

Proyek ini dibuat untuk kebutuhan tugas kuliah dan pembelajaran. Aset template frontend dan library pihak ketiga tetap mengikuti lisensi masing-masing.
