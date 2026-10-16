/* Lokalisasi antarmuka Falstore */
(function () {
  "use strict";

  const translations = {
    "All Categories": "Semua Kategori",
    "Search here": "Cari di sini",
    Search: "Cari",
    "My Account": "Akun Saya",
    "Your Wishlist": "Daftar Keinginan",
    "Your Cart": "Keranjang Anda",
    "product name goes here": "Nama produk di sini",
    "Product name goes here": "Nama Produk di Sini",
    "Product Name Goes Here": "Nama Produk di Sini",
    "3 Item(s) selected": "3 produk dipilih",
    "SUBTOTAL:": "SUBTOTAL:",
    "View Cart": "Lihat Keranjang",
    Checkout: "Pembayaran",
    Menu: "Menu",
    Home: "Beranda",
    "Hot Deals": "Promo Spesial",
    "Hot deals": "Promo Spesial",
    Categories: "Kategori",
    Collection: "Koleksi",
    "Shop now": "Belanja sekarang",
    "New Products": "Produk Terbaru",
    "Top selling": "Terlaris",
    "Top Selling": "Terlaris",
    Category: "Kategori",
    "add to wishlist": "tambah ke daftar keinginan",
    "add to compare": "bandingkan produk",
    "add to cart": "tambah ke keranjang",
    Days: "Hari",
    Hours: "Jam",
    Mins: "Menit",
    Secs: "Detik",
    NEWSLETTER: "NEWSLETTER",
    "Sign Up for the": "Daftar untuk",
    "Enter Your Email": "Masukkan Email Anda",
    Subscribe: "Berlangganan",
    "About Us": "Tentang Kami",
    Information: "Informasi",
    "Privacy Policy": "Kebijakan Privasi",
    "Contact Us": "Hubungi Kami",
    "Orders and Returns": "Pesanan dan Pengembalian",
    "Terms & Conditions": "Syarat & Ketentuan",
    Service: "Layanan",
    "Track My Order": "Lacak Pesanan Saya",
    Help: "Bantuan",
    Wishlist: "Daftar Keinginan",
    Price: "Harga",
    Brand: "Merek",
    "Sort By:": "Urutkan:",
    "Show:": "Tampilkan:",
    "Regular Page": "Halaman Biasa",
    "Billing address": "Alamat Penagihan",
    "First Name": "Nama Depan",
    "Last Name": "Nama Belakang",
    Address: "Alamat",
    City: "Kota",
    Country: "Negara",
    "ZIP Code": "Kode Pos",
    Telephone: "Telepon",
    "Create Account?": "Buat Akun?",
    "Enter Your Password": "Masukkan Kata Sandi Anda",
    "Shiping address": "Alamat Pengiriman",
    "Ship to a diffrent address?": "Kirim ke alamat lain?",
    "Order Notes": "Catatan Pesanan",
    "Your Order": "Pesanan Anda",
    PRODUCT: "PRODUK",
    TOTAL: "TOTAL",
    Shiping: "Pengiriman",
    FREE: "GRATIS",
    "Direct Bank Transfer": "Transfer Bank Langsung",
    "Cheque Payment": "Pembayaran Cek",
    "I've read and accept the": "Saya telah membaca dan menyetujui",
    "terms & conditions": "syarat & ketentuan",
    "Place order": "Buat Pesanan",
    "10 Review(s) | Add your review": "10 Ulasan | Tambahkan ulasan Anda",
    "In Stock": "Tersedia",
    Size: "Ukuran",
    Color: "Warna",
    Red: "Merah",
    Qty: "Jml.",
    "Share:": "Bagikan:",
    "Category:": "Kategori:",
    Description: "Deskripsi",
    Details: "Detail",
    "Reviews (3)": "Ulasan (3)",
    "Your Name": "Nama Anda",
    "Your Email": "Email Anda",
    "Your Review": "Ulasan Anda",
    "Your Rating:": "Penilaian Anda:",
    "Related Products": "Produk Terkait",
    USD: "Rupiah (Rp)",
    "+021-95-51-84": "+62 812-3456-7890",
    "email@email.com": "info@falstore.com",
    "1734 Stonecoal Road": "Banjarmasin, Kalimantan Selatan",
    "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut.":
      "Falstore menyediakan pilihan produk elektronik berkualitas untuk kebutuhan Anda.",
    "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt.":
      "Buat akun untuk menikmati proses belanja yang lebih mudah di Falstore.",
    "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.":
      "Pembayaran Anda akan diproses dengan aman setelah pesanan dikonfirmasi.",
    "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua":
      "Produk berkualitas, pengiriman aman, dan layanan pelanggan yang siap membantu.",
    "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.":
      "Nikmati produk pilihan dengan kualitas terbaik, harga kompetitif, dan layanan belanja yang nyaman dari Falstore.",
    "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.":
      "Falstore berkomitmen menyediakan produk elektronik pilihan dengan informasi yang jelas, proses pemesanan mudah, pembayaran aman, dan dukungan pelanggan yang responsif.",
  };

  function translate(value) {
    return translations[value.trim()] || value;
  }

  function localize() {
    document.documentElement.lang = "id";
    document.title = "Falstore";
    document
      .querySelectorAll("input[placeholder], textarea[placeholder]")
      .forEach(function (el) {
        el.placeholder = translate(el.placeholder);
      });
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      const original = node.nodeValue;
      const replacement = translate(original);
      if (replacement !== original)
        node.nodeValue = original.replace(original.trim(), replacement);
    });
    document.querySelectorAll("footer .footer-title").forEach(function (title) {
      if (title.textContent.trim() === "Tentang Kami")
        title.textContent = "Falstore";
    });
    document.querySelectorAll("footer .footer-title").forEach(function (title) {
      if (title.textContent.trim() === "Falstore") {
        const description = title.parentElement.querySelector("p");
        if (description) description.textContent = "Email: info@falstore.com";
      }
    });

    const links = {
      Beranda: "index.html",
      "Promo Spesial": "store.html?promo=1",
      Kategori: "store.html",
      "Daftar Keinginan": "wishlist.html",
      "Keranjang Anda": "cart.html",
      "Lihat Keranjang": "cart.html",
      Pembayaran: "checkout.html",
      "Akun Saya": "account.html",
      "Produk Terkait": "product.html",
      "Kontak Kami": "contact.html",
      "Hubungi Kami": "contact.html",
      Bantuan: "contact.html",
      "Lacak Pesanan Saya": "account.html",
    };
    document.querySelectorAll("a").forEach(function (link) {
      const destination = links[link.textContent.trim()];
      if (destination) link.href = destination;
    });
    document.querySelectorAll(".header-logo .logo").forEach(function (link) {
      link.href = "index.html";
    });
  }

  document.addEventListener("DOMContentLoaded", localize);
})();
