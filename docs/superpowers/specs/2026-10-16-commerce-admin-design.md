# Falstore: admin, promo otomatis, dan UI responsif

## Batas desain
Tema merah-hitam, logo, font, dan susunan utama dipertahankan. Gunakan Express, PostgreSQL, HTML/CSS/JavaScript yang sudah ada. Tidak mengganti framework. Perubahan UI hanya kerapian, responsivitas, aksesibilitas, feedback, dan transisi singkat yang menghormati reduced-motion.

## Kategori dan merek
Kategori dan merek dikelola admin dan disimpan dalam database. Migrasikan kategori produk yang ada tanpa kehilangan relasi; merek produk lama boleh kosong, jangan menebak merek. Menu, pilihan formulir, filter dan jumlah produk menggunakan data database. Penghapusan kategori/merek yang masih dipakai ditolak dengan pesan jelas. Nama unik tanpa membedakan kapitalisasi.

## Produk
Admin mengelola nama, deskripsi, gambar, harga dasar, harga coret, stok, kategori, merek, dan produk unggulan. Sediakan pencarian/filter. Validasi server mempertahankan integritas harga dan stok. Harga coret hanya informasi pembanding, bukan dasar diskon.

## Banner dan diskon otomatis
Admin mengelola judul, keterangan, gambar, tautan internal toko, urutan, aktif/nonaktif, waktu mulai/selesai, target produk atau kategori, jenis diskon persen atau rupiah, dan nilai diskon. Waktu disimpan UTC, formulir menampilkan zona waktu jelas. Promo aktif jika enabled dan mulai <= sekarang < selesai. Validasi akhir sesudah mulai, target ada, persen lebih dari 0 dan kurang dari 100, nominal potongan positif. Harga akhir minimum Rp1 sesuai batas QRIS. Pembulatan potongan persen ke bawah dalam rupiah penuh.

Beberapa promo tidak ditumpuk: pilih harga akhir terendah; jika sama pilih ID promo terkecil untuk hasil deterministik. Banner hanya tampil dalam jadwal aktif; tidak ada hitung mundur palsu. Promo dihapus/dinonaktifkan tidak mengubah pesanan lama.

## Konsistensi harga dan QRIS
Satu perhitungan harga server digunakan katalog, detail, ringkasan keranjang, checkout dan invoice. Keranjang menyegarkan harga database; server tetap otoritas saat checkout. Harga item dan promo dibekukan saat pesanan dibuat. Jika promo kedaluwarsa sebelum checkout, server memakai harga saat checkout dan UI menunjukkan total aktual. Jangan mengganti atau membuat ulang invoice lama saat promo berubah. Pertahankan idempotensi, verifikasi pembayaran, dan pencegahan oversell yang ada.

## Admin operasional
Dashboard menampilkan pendapatan dari pembayaran terverifikasi, ringkasan status pesanan dan stok menipis. Pesanan memiliki pencarian/filter, rincian barang/pelanggan, status QRIS, proses pemenuhan berurutan, kurir dan nomor resi. Pengiriman hanya untuk pesanan lunas; status lunas tidak dapat diisi manual. Daftar pelanggan menyediakan riwayat pesanan tanpa password/hash/token. Semua endpoint admin wajib otorisasi server.

## UI pelanggan dan admin
Perbaiki header, pencarian, menu mobile, kartu produk, filter, formulir, keranjang, checkout, QRIS dan tabel admin pada HP/tablet/desktop. Tombol pembelian tersedia pada perangkat sentuh tanpa hover. Tidak boleh ada overflow horizontal halaman; tabel lebar memiliki scroll lokal. Sediakan loading, kosong, gagal, disabled saat proses, fokus keyboard terlihat, dan konfirmasi penghapusan. Panel QRIS langsung terlihat setelah checkout seperti perilaku yang sudah diperbaiki.

## Kriteria verifikasi
Jalankan regresi pembayaran yang ada dan pemeriksaan promo: batas waktu, pembulatan, tumpang tindih, target produk/kategori, harga minimum, perubahan harga, snapshot invoice, kategori terpakai, dan akses admin ditolak bagi pelanggan. Gunakan database terisolasi untuk data uji. Browser memeriksa halaman utama, katalog, produk, keranjang, akun, checkout, serta admin pada 390, 768, dan 1366 piksel; amati gambar, menu, fokus, form dan tidak adanya overflow. Tidak membuat tagihan pembayaran nyata untuk pengujian.

## Prasyarat produksi
API key Axiom tetap server-only. Scheduler rekonsiliasi dan CRON_SECRET mengikuti konfigurasi deployment yang ada. Pembuatan fitur tidak menyatakan scheduler eksternal atau settlement nyata telah diverifikasi.
