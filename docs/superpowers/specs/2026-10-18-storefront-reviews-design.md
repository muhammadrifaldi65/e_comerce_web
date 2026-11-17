# Penyempurnaan storefront dan ulasan terverifikasi

## Tujuan dan batas
Memperbaiki UI dan pengalaman belanja Falstore tanpa mengganti tema merah–hitam, framework, penyedia pembayaran, atau penyimpanan gambar ImageKit. Gunakan fitur katalog, promo, stok, pesanan, dan pengiriman yang sudah ada; jangan membuat implementasi kedua. Tidak mengubah data pelanggan atau membuat transaksi production untuk pengujian.

## UI dan alur belanja
- Rapikan header, navigasi, dropdown, jarak, tipografi, kartu produk, dan rasio gambar pada mobile maupun desktop.
- Tampilkan status loading, kosong, gagal, serta tindakan coba lagi pada pengambilan data; jangan biarkan placeholder loading menetap setelah kegagalan.
- Tampilkan filter aktif dan reset filter; pertahankan pencarian, sorting, dan pagination secara konsisten.
- Tampilkan stok dan batasi jumlah keranjang sesuai stok; server tetap otoritas saat checkout.
- Tampilkan subtotal, diskon, dan total berdasarkan quote server. Validasi form dekat input, cegah pengiriman ganda selama request berjalan, pulihkan tombol setelah gagal.
- Pertahankan fitur produk terkait yang sudah ada. Tambahkan produk terakhir dilihat pada perangkat dengan data produk aktual, abaikan produk yang sudah tidak tersedia.
- Tambahkan tampilan cetak ringkasan pesanan milik pengguna; jangan menyebutnya faktur pajak.

## Ulasan produk
- Bintang bilangan bulat 1–5 dan teks ulasan wajib, maksimal 2000 karakter setelah trim.
- Hanya akun yang memiliki item produk tersebut dalam pesanan selesai boleh mengirim ulasan. Status dibuktikan server dari data pesanan, bukan payload browser. Pesanan pending, dibatalkan, atau baru dibayar tidak cukup.
- Satu ulasan per pasangan akun–produk, dijamin unique constraint database. Pemilik dapat mengedit rating dan teks; tidak dapat mengedit ulasan orang lain.
- Identitas pengguna berasal dari autentikasi. Klien tidak dapat memilih user ID, status verifikasi, rata-rata, atau jumlah ulasan.
- API baca menyediakan pagination, rating rata-rata, jumlah ulasan, serta ulasan milik pengguna untuk form edit. Produk tanpa ulasan menampilkan belum ada penilaian, bukan rating palsu.
- Label pembelian terverifikasi hanya berasal dari kelayakan yang diverifikasi server. Tampilkan nama pelanggan, bukan email/alamat/telepon.
- Render teks sebagai teks biasa untuk mencegah HTML/script tersisip.
- Form rating menggunakan kontrol berlabel dan dapat dioperasikan dengan keyboard. Pesan gagal tidak menghapus input pengguna.
- Tampilkan ringkasan rating di detail dan kartu produk tanpa query database per kartu.

## Integrasi dan keamanan
Ikuti pola migrasi, otorisasi, error response, dan transaksi yang sudah ada. Constraint FK, batas rating, dan keunikan melindungi data. Petakan status selesai ke status nyata aplikasi setelah pemeriksaan state machine; jika belum tersedia, tambahkan transisi penyelesaian terotorisasi tanpa menganggap pembayaran sebagai penyelesaian pengiriman. Hindari dependency baru. URL gambar tetap same-origin /uploads/.

## Verifikasi penerimaan
- Browser: beranda, toko, detail produk, keranjang, checkout, akun pada 320, 375, 768, dan 1440px; tidak ada overflow horizontal atau kontrol bertumpuk.
- Uji loading, hasil kosong, gagal request, retry, dan tombol submit selama request.
- Ulasan: tolak anonim, bukan pembeli, pesanan belum selesai, rating di luar batas, teks kosong/terlalu panjang, edit lintas akun; tangani dua kiriman serentak tanpa duplikat.
- Ulasan valid tersimpan, edit mengganti nilai tanpa menambah jumlah; agregat rating sesuai data; teks berbahaya tidak dijalankan.
- Pastikan alur katalog, quote, checkout, gambar, dan pesanan lama tidak rusak. Pengujian transaksi menggunakan database pengujian terisolasi, bukan data production.
- Dokumentasikan perubahan dan batas verifikasi. Deploy tidak diklaim berhasil sebelum endpoint production diverifikasi.

## Tidak termasuk
Integrasi kurir baru, rating contoh, klaim garansi, newsletter palsu, perubahan tema, payment gateway baru, atau penggantian arsitektur frontend.
