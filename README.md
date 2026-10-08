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

Aplikasi menggunakan frontend berbasis HTML, CSS, dan JavaScript serta backend Node.js dengan Express. Data pengguna, produk, pesanan, dan item pesanan disimpan dalam database SQLite melalui `sql.js`, sehingga proyek dapat dijalankan tanpa memasang server database terpisah.

## Tujuan Pembelajaran

Proyek ini dirancang untuk menunjukkan penerapan:

- Struktur aplikasi web multi-halaman.
- Integrasi frontend dengan REST API.
- Operasi CRUD produk.
- Autentikasi dan otorisasi berbasis JWT.
- Hash kata sandi menggunakan bcrypt.
- Pengelolaan keranjang dan wishlist menggunakan `localStorage`.
- Upload gambar produk.
- Transaksi database untuk pembuatan pesanan dan pengurangan stok.
- Pengujian alur utama menggunakan smoke test.

## Fitur Utama

### Fitur pelanggan

- Melihat katalog produk elektronik.
- Mencari produk berdasarkan nama atau deskripsi.
- Menunggu 350 ms setelah input pencarian atau kategori berubah sebelum membuka hasil pencarian, menggunakan debounce agar navigasi tidak berjalan pada setiap ketikan.
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
| Database        | SQLite melalui `sql.js`                                     |
| Autentikasi     | JSON Web Token (`jsonwebtoken`)                             |
| Hash kata sandi | `bcryptjs`                                                  |
| Upload file     | `multer`                                                    |
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

Database akan dibuat atau digunakan dari file `data/falstore.sqlite`. Folder `uploads/` digunakan untuk menyimpan gambar yang diunggah melalui dashboard admin.

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

2. Buka file `.env`, lalu isi nilai konfigurasi:

   | Variable         | Contoh                     | Keterangan                            |
   | ---------------- | -------------------------- | ------------------------------------- |
   | `PORT`           | `3000`                     | Port HTTP server                      |
   | `JWT_SECRET`     | `secret-jwt-yang-kuat`     | Secret untuk menandatangani token JWT |
   | `ADMIN_EMAIL`    | `admin@example.com`        | Email akun admin awal                 |
   | `ADMIN_PASSWORD` | `password-admin-yang-kuat` | Kata sandi akun admin awal            |

3. Jalankan server:

   ```bash
   npm start
   ```

File `.env.example` boleh di-upload karena hanya berisi nama variable dan contoh nilai. File `.env` sudah masuk `.gitignore`.

## Akun Demo

Pada konfigurasi lokal contoh, akun admin dibuat otomatis saat server pertama kali dijalankan:

```text
Email    : admin@falstore.local
Password : admin12345
```

Kredensial tersebut hanya ditujukan untuk demonstrasi lokal. Gunakan nilai yang berbeda pada `.env` untuk pengumpulan tugas atau deployment.

Pelanggan baru dapat membuat akun melalui halaman `account.html`.

## Struktur Direktori

```text
.
├── admin.html                # Dashboard administrator
├── account.html              # Login, registrasi, dan profil pengguna
├── cart.html                 # Keranjang belanja
├── checkout.html             # Form checkout
├── contact.html              # Halaman kontak
├── index.html                # Halaman beranda
├── product.html              # Halaman detail produk
├── store.html                # Halaman katalog
├── wishlist.html             # Daftar keinginan
├── server.js                 # Server Express, database, auth, dan API
├── package.json               # Konfigurasi proyek dan dependency
├── .env.example              # Template konfigurasi environment
├── data/
│   └── falstore.sqlite        # Database SQLite aplikasi
├── uploads/                  # Gambar hasil upload admin
├── css/
│   ├── style.css             # Style utama aplikasi
│   └── *.min.css              # Library CSS pendukung
├── js/
│   ├── auth.js               # Login, registrasi, dan sesi pengguna
│   ├── catalog-api.js        # Pengambilan dan render katalog dari API
│   ├── checkout-api.js       # Pengiriman pesanan ke API
│   ├── falstore.js           # Keranjang dan wishlist berbasis browser
│   ├── product-api.js        # Data detail produk dari API
│   ├── search-ui.js          # Form pencarian dan kategori
│   ├── bahasa-indonesia.js   # Lokalisasi antarmuka
│   ├── currency.js           # Format mata uang Rupiah
│   └── main.js               # Interaksi UI dan plugin frontend
├── img/                      # Logo dan aset gambar produk
├── fonts/                    # Font yang digunakan UI
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
- `sort=popular`: mengurutkan berdasarkan jumlah penjualan.
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
- Upload gambar produk.

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
- Keranjang dan wishlist disimpan di `localStorage` browser, bukan di database.
- Belum tersedia fitur reset kata sandi, verifikasi email, dan manajemen status pesanan melalui UI.
- SQLite melalui `sql.js` sesuai untuk tugas dan aplikasi kecil, tetapi deployment berskala besar sebaiknya menggunakan database server yang sesuai.
- Validasi produksi tambahan, rate limiting, logging terstruktur, dan konfigurasi HTTPS masih diperlukan untuk deployment publik.

## Lisensi

Proyek ini dibuat untuk kebutuhan tugas kuliah dan pembelajaran. Aset template frontend dan library pihak ketiga tetap mengikuti lisensi masing-masing.
