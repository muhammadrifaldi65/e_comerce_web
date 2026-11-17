# Falstore marketplace untuk tugas kuliah

## Kesepakatan
Tema merah–hitam, stack Express/PostgreSQL dan frontend yang ada dipertahankan. QRIS nyata tetap digunakan. Profil pengguna, toko multi-penjual, dashboard, saldo internal, ulasan terverifikasi, dan penyempurnaan UI menjadi cakupan. Tidak membuat pembayaran palsu, rating palsu, atau pencairan bank otomatis. Dokumen ini memperluas spesifikasi storefront-reviews sebelumnya.

## Profil dan toko
Pengguna login dapat mengedit nama, foto, dan alamat pengiriman miliknya. Email, alamat, dan telepon tidak ditampilkan sebagai profil publik. Pendaftaran toko mencakup nama, slug unik, logo, deskripsi; admin menerima atau menolak pengajuan. Hanya toko disetujui dapat menerbitkan produk. Penangguhan mencegah penjualan baru tetapi tidak menghilangkan kewajiban pesanan lama. Profil toko publik hanya menampilkan identitas toko, produk aktif, dan ringkasan rating asli.

Dashboard penjual mengelola produk, stok, serta pesanan milik toko tersebut. Seluruh otorisasi dilakukan di server; ID yang dikirim klien tidak menjadi bukti kepemilikan. Produk lama tetap milik toko platform sehingga migrasi tidak menghilangkan katalog atau mengalihkan produk ke pengguna sembarang.

## Checkout multi-penjual
Keranjang boleh berisi beberapa toko. Server menghitung harga, promo, stok, dan total; checkout menghasilkan kelompok pembelian dan subpesanan per toko. Satu invoice QRIS membayar kelompok tersebut. Alokasi nilai bersih setiap subpesanan disimpan pada saat checkout, bukan dihitung ulang dari harga saat ini. Tidak menambahkan ongkir rekaan atau komisi platform yang belum disepakati; komisi awal nol.

Stok dicadangkan dan dilepas mengikuti perilaku invoice yang sudah ada. Pembayaran terverifikasi mengubah kelompok dan subpesanan secara atomik. Penjual hanya melihat item dan data pengiriman yang dibutuhkan untuk pesanan tokonya, bukan transaksi toko lain. Pengiriman dan penyelesaian terpisah per subpesanan; hanya pemilik pembelian dapat mengonfirmasi penerimaan setelah dikirim. Admin dapat menyelesaikan kasus dengan jejak audit.

## QRIS, persetujuan admin, saldo
Verifikasi server ke penyedia pembayaran tetap menjadi sumber kebenaran. Bukti upload, tombol admin, atau payload browser tidak dapat mengubah invoice belum dibayar menjadi lunas. Setelah lunas, admin boleh menyetujui pengkreditan subpesanan ke saldo penjual.

Persetujuan dan pencatatan ledger dilakukan dalam transaksi database. Unique constraint pada sumber transaksi mencegah kredit ganda akibat klik berulang, request paralel, webhook, atau rekonsiliasi. Nilai kredit berasal dari alokasi subpesanan tersimpan. Saldo dihitung dari ledger atau proyeksi yang diperbarui atomik; tidak tersedia endpoint untuk mengedit saldo bebas. Catat aktor, waktu, subpesanan, jumlah, dan alasan.

Saldo adalah catatan internal, bukan rekening bank. Tidak ada transfer/pencairan otomatis. Pembatalan/refund pembayaran sungguhan tidak ditandai berhasil tanpa konfirmasi penyedia. Pesanan lunas tidak boleh dibatalkan dengan menghapus data atau mengembalikan stok secara buta. UI menjelaskan batas dukungan refund; saldo yang sudah dikreditkan tidak boleh dikoreksi dengan menghapus ledger.

Penyedia QRIS yang dipakai harus diperiksa kemampuan dan ketentuannya untuk agregasi marketplace. Ketidaktersediaan sandbox atau fitur settlement tidak boleh disamarkan dengan implementasi palsu; pengujian tidak membuat pembayaran live tanpa tindakan pengguna.

## Ulasan
Rating integer 1–5 dan teks wajib 1–2000 karakter. Satu ulasan per akun–produk dengan unique constraint. Kelayakan berasal dari item subpesanan selesai milik pengguna. Pemilik dapat mengedit; akun lain tidak. Teks dirender sebagai teks biasa. Tampilkan rata-rata, jumlah, pagination, label pembelian terverifikasi, dan status belum ada ulasan. Agregat katalog diperoleh secara batch, bukan satu query per kartu. Email dan alamat pelanggan tidak dipublikasikan.

## UI dan fitur belanja
Pertahankan tema, benahi layout header, navigasi, kartu, gambar, dropdown, tabel dashboard, dan form pada ponsel/desktop. Loading berakhir pada sukses/gagal; sediakan keadaan kosong, pesan error, retry, dan proteksi submit ganda. Filter aktif dapat direset; stok dan validasi jumlah konsisten dengan server. Tampilkan rincian harga dan per-toko pada checkout. Produk terkait memakai fitur yang sudah ada. Tambahkan riwayat produk dilihat pada perangkat dan cetak ringkasan pesanan tanpa klaim faktur pajak. Kontrol berlabel, keyboard, dan fokus harus tetap berfungsi.

## Migrasi dan kompatibilitas data
Migrasi bersifat aditif terhadap data nyata, transaksional bila memungkinkan, dan dapat dijalankan kembali. Pertahankan invoice/pesanan historis; pemetaan pesanan lama harus eksplisit. Jangan reseed, menghapus akun, atau membuat transaksi pengujian pada database production. Upload tetap ImageKit, URL publik same-origin /uploads/. Gunakan pola modul dan validasi yang sudah ada serta query parameterized.

## Verifikasi penerimaan
- Isolasi tenant: penjual A tidak dapat membaca/mengubah produk, pesanan, saldo, atau toko B; pengguna tidak dapat menaikkan hak akses sendiri.
- Checkout dua toko: total alokasi tepat sama dengan invoice, stok konsisten, retry tidak menggandakan pesanan.
- Pembayaran: pending/expired/paid, callback dan rekonsiliasi berulang tidak menggandakan transisi maupun kredit.
- Saldo: admin menolak invoice belum lunas; dua persetujuan bersamaan menghasilkan satu kredit; jumlah tidak bisa dipilih klien.
- Ulasan: anonim, bukan pembeli, pesanan belum selesai, rating tidak valid, edit lintas akun ditolak; edit sah memperbarui rata-rata tanpa menambah jumlah.
- Browser: home, katalog, produk, profil, toko, penjual, admin, keranjang, checkout diuji pada 320/375/768/1440px; loading/error/empty dan interaksi nyata diamati.
- Jalankan regression suite existing serta smoke real server dengan database terisolasi. Integrasi QRIS live hanya diamati tanpa pembayaran otomatis.
- Dokumentasi mencakup setup, migrasi, alur demo, batas saldo/refund, dan verifikasi yang benar-benar dilakukan. Produksi tidak dinyatakan selesai sebelum deployment terbaru diperiksa.

## Tahapan implementasi
1. Audit skema, otorisasi, pembayaran, UI, dan fasilitas database pengujian; tetapkan migrasi serta kontrak API.
2. Profil, toko, persetujuan penjual, kepemilikan produk.
3. Checkout kelompok/subpesanan dan integrasi QRIS yang mempertahankan invariant stok dan pembayaran.
4. Ledger saldo dan persetujuan admin idempoten.
5. Ulasan terverifikasi dan agregat rating.
6. Dashboard, penyempurnaan storefront, fitur belanja, dan uji end-to-end.
