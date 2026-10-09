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

### Fitur admin

- Login sebagai administrator.
- Melihat statistik jumlah produk, pelanggan, pesanan, dan pendapatan.
- Menambahkan produk.
- Mengubah produk.
- Menghapus produk.
- Menandai produk sebagai produk unggulan.
- Mengunggah gambar produk dengan batas ukuran 5 MB.
- Melihat daftar pesanan.

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
```

`PORT` tidak wajib di Vercel karena server menggunakan port default saat dijalankan sebagai Function. Jangan upload `.env` ke Vercel atau repository. Neon menyimpan data secara persisten, sedangkan upload gambar menggunakan ImageKit sehingga tidak bergantung pada filesystem Vercel.

Setelah deployment selesai, buka URL Vercel dan uji login admin, katalog, checkout, serta upload gambar.


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

Parameter yang tersedia pada `GET /products`:

- `category`: filter kategori, misalnya `laptop` atau `kamera`.
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

Contoh request produk:

```json
{
  "name": "Keyboard Mekanis",
  "slug": "keyboard-mekanis",
  "category": "aksesori",
  "price": 750000,
  "oldPrice": 850000,
  "stock": 10,
  "description": "Keyboard mekanis untuk kebutuhan kerja dan gaming.",
  "image": "/img/product01.png",
  "isFeatured": true
}
```

## Pengujian

Smoke test menjalankan server sementara dan memeriksa alur penting berikut:

- Health check API.
- Katalog memiliki data awal.
- Endpoint admin menolak request tanpa autentikasi.
- Login admin.
- Create, update, dan delete produk.
- Upload gambar ke ImageKit melalui endpoint admin.

Jalankan dengan:

```bash
npm run smoke
```

Output yang diharapkan:

```text
Smoke test lulus: health, katalog, proteksi admin, login, CRUD produk, dan upload.
```

## Keamanan dan Batasan

Proyek ini dibuat untuk pembelajaran dan demonstrasi lokal. Beberapa hal yang perlu diperhatikan:

- Kredensial admin bawaan harus diganti pada penggunaan nyata.
- `JWT_SECRET` bawaan tidak boleh digunakan di production.
- Proses pembayaran masih berupa simulasi; belum terhubung ke payment gateway.
- Keranjang dan wishlist setiap akun dipisahkan berdasarkan ID pengguna di `localStorage` browser; data tamu memakai namespace terpisah.
- Belum tersedia fitur reset kata sandi, verifikasi email, dan manajemen status pesanan melalui UI.
- Neon PostgreSQL digunakan sebagai database terpusat; SQLite lokal tidak digunakan saat login maupun operasi API.
- URL delivery ImageKit digunakan langsung oleh frontend untuk sementara; endpoint proxy internal tetap tersedia untuk kompatibilitas data lama.

## Lisensi

Proyek ini dibuat untuk kebutuhan tugas kuliah dan pembelajaran. Aset template frontend dan library pihak ketiga tetap mengikuti lisensi masing-masing.
