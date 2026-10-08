/* Fitur belanja Falstore yang berjalan langsung di browser. */
(function () {
  "use strict";
  const key = "falstore-cart",
    wishKey = "falstore-wishlist";
  const read = (name) => JSON.parse(localStorage.getItem(name) || "[]");
  const write = (name, data) =>
    localStorage.setItem(name, JSON.stringify(data));
  const money = (amount) =>
    "Rp " + new Intl.NumberFormat("id-ID").format(Number(amount) || 0);
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[char],
    );
  const productFrom = (button) => {
    const box =
      button.closest(".product, .product-widget, .product-details") || document;
    const name =
      (box.querySelector(".product-name") || {}).textContent ||
      "Produk Falstore";
    const priceText =
      (box.querySelector(".product-price") || {}).textContent || "980";
    const price =
      Number((priceText.match(/[\d.]+/) || ["980"])[0].replace(/\./g, "")) ||
      980000;
    const image =
      (box.querySelector("img") || {}).getAttribute("src") ||
      "img/product01.png";
    return {
      id:
        button.dataset.productId ||
        name.trim().toLowerCase().replace(/\W+/g, "-") ||
        "produk-falstore",
      name: name.trim(),
      price,
      image,
    };
  };
  const updateBadges = () => {
    const cart = read(key),
      wishlist = read(wishKey);
    document
      .querySelectorAll(".header-ctn .fa-shopping-cart")
      .forEach((icon) => {
        const badge = icon.parentElement.querySelector(".qty");
        if (badge)
          badge.textContent = cart.reduce((n, item) => n + item.qty, 0);
      });
    document.querySelectorAll(".header-ctn .fa-heart-o").forEach((icon) => {
      const badge = icon.parentElement.querySelector(".qty");
      if (badge) badge.textContent = wishlist.length;
    });
    document.querySelectorAll(".cart-dropdown").forEach((dropdown) => {
      const list = dropdown.querySelector(".cart-list"),
        summary = dropdown.querySelector(".cart-summary");
      const total = cart.reduce((n, item) => n + item.price * item.qty, 0);
      if (list)
        list.innerHTML = cart.length
          ? cart
              .map(
                (item) =>
                  `<div class="product-widget"><div class="product-img"><img src="${item.image}" alt="${item.name}"></div><div class="product-body"><h3 class="product-name">${item.name}</h3><h4 class="product-price"><span class="qty">${item.qty}x</span>${money(item.price)}</h4></div></div>`,
              )
              .join("")
          : '<p class="text-center">Keranjang masih kosong.</p>';
      if (summary)
        summary.innerHTML = `<small>${cart.reduce((n, item) => n + item.qty, 0)} produk dipilih</small><h5>SUBTOTAL: ${money(total)}</h5>`;
    });
  };
  const addCart = (product) => {
    const cart = read(key),
      item = cart.find((p) => p.id === product.id);
    if (item) item.qty += 1;
    else cart.push({ ...product, qty: 1 });
    write(key, cart);
    updateBadges();
    notice(product.name + " ditambahkan ke keranjang");
  };
  const addWishlist = (product) => {
    const list = read(wishKey);
    if (!list.some((p) => p.id === product.id)) {
      list.push(product);
      write(wishKey, list);
      notice(product.name + " disimpan di daftar keinginan");
    } else notice("Produk sudah ada di daftar keinginan");
    updateBadges();
  };
  const renderCart = () => {
    if (!location.pathname.endsWith("cart.html")) return;
    const cart = read(key),
      target = document.querySelector("main .row");
    if (!target) return;
    const total = cart.reduce((n, item) => n + item.price * item.qty, 0);
    const lines = cart.length
      ? cart
          .map(
            (item) =>
              `<div class="product-widget"><div class="product-img"><img src="${item.image}" alt="${item.name}"></div><div class="product-body"><h3 class="product-name"><a href="product.html">${item.name}</a></h3><h4 class="product-price">${item.qty} × ${money(item.price)}</h4><button class="primary-btn falstore-remove" data-id="${item.id}">Hapus</button></div></div>`,
          )
          .join("")
      : '<p>Keranjang Anda masih kosong. <a href="store.html">Mulai belanja</a>.</p>';
    target.innerHTML = `<div class="col-md-8">${lines}</div><div class="col-md-4"><div class="order-summary"><div class="order-col"><div><strong>Total</strong></div><div><strong class="order-total">${money(total)}</strong></div></div>${cart.length ? '<a class="primary-btn order-submit" href="checkout.html">Lanjut ke Pembayaran</a>' : ""}</div></div>`;
    target.querySelectorAll(".falstore-remove").forEach(
      (btn) =>
        (btn.onclick = () => {
          write(
            key,
            read(key).filter((item) => item.id !== btn.dataset.id),
          );
          renderCart();
          updateBadges();
        }),
    );
  };
  const renderWishlist = () => {
    if (!location.pathname.endsWith("wishlist.html")) return;
    const list = read(wishKey),
      target = document.querySelector("main .row");
    if (!target) return;
    target.innerHTML = list.length
      ? list
          .map(
            (item) =>
              `<div class="col-md-4 col-sm-6 col-xs-12"><div class="product wishlist-product"><div class="product-img"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"></div><div class="product-body"><h3 class="product-name">${escapeHtml(item.name)}</h3><h4 class="product-price">${money(item.price)}</h4><div class="wishlist-actions"><button class="primary-btn wishlist-cart" data-id="${escapeHtml(item.id)}">Tambah ke Keranjang</button><button class="wishlist-remove" data-id="${escapeHtml(item.id)}">Hapus</button></div></div></div></div>`,
          )
          .join("")
      : '<div class="col-md-12"><div class="wishlist-empty"><i class="fa fa-heart-o"></i><h3>Daftar keinginan masih kosong</h3><p>Simpan produk favorit Anda agar mudah ditemukan kembali.</p><a class="primary-btn" href="store.html">Lihat Produk</a></div></div>';
    target.querySelectorAll(".wishlist-cart").forEach(
      (btn) =>
        (btn.onclick = () => {
          const product = list.find(
            (item) => String(item.id) === String(btn.dataset.id),
          );
          if (product) addCart(product);
        }),
    );
    target.querySelectorAll(".wishlist-remove").forEach(
      (btn) =>
        (btn.onclick = () => {
          write(
            wishKey,
            read(wishKey).filter(
              (item) => String(item.id) !== String(btn.dataset.id),
            ),
          );
          renderWishlist();
          updateBadges();
          notice("Produk dihapus dari daftar keinginan");
        }),
    );
  };
  const debounce = (callback, delay = 350) => {
    let timeoutId;

    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    };
  };
  const navigateToSearch = (form) => {
    const input = form.querySelector("input");
    const category = form.querySelector("select")?.value || "";
    const params = new URLSearchParams();

    if (input?.value.trim()) params.set("q", input.value.trim());
    if (category) params.set("kategori", category);

    location.href =
      "store.html" + (params.toString() ? "?" + params.toString() : "");
  };
  const wireSearchForms = () => {
    document.querySelectorAll(".header-search form").forEach((form) => {
      const debouncedSearch = debounce(() => navigateToSearch(form));

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        debouncedSearch();
      });
    });
  };
  const wireForms = () => {
    wireSearchForms();
    document.querySelectorAll(".newsletter form").forEach((form) =>
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = form.querySelector('input[type="email"]');
        if (email && email.checkValidity()) {
          localStorage.setItem("falstore-newsletter", email.value);
          email.value = "";
          notice("Terima kasih, Anda sudah berlangganan.");
        } else notice("Masukkan alamat email yang valid.");
      }),
    );
    document.querySelectorAll(".order-submit").forEach((button) => {
      if (button.closest("main"))
        button.addEventListener("click", (event) => {
          if (location.pathname.endsWith("checkout.html")) {
            event.preventDefault();
            const required = [
              ...document.querySelectorAll(".billing-details input"),
            ].filter((input) => input.type !== "checkbox");
            if (required.some((input) => !input.value.trim()))
              return notice("Lengkapi alamat dan kontak Anda terlebih dahulu.");
            if (!document.querySelector('input[name="payment"]:checked'))
              return notice("Pilih metode pembayaran terlebih dahulu.");
            if (!document.querySelector("#terms:checked"))
              return notice("Setujui syarat dan ketentuan terlebih dahulu.");
            write("falstore-last-order", {
              date: new Date().toISOString(),
              items: read(key),
            });
            write(key, []);
            updateBadges();
            notice("Pesanan berhasil dibuat. Terima kasih!");
            setTimeout(() => (location.href = "index.html"), 900);
          }
        });
    });
    document.querySelectorAll("main button.primary-btn").forEach((button) =>
      button.addEventListener("click", (event) => {
        if (button.closest("form") || button.classList.contains("order-submit"))
          return;
        const inputs = [
          ...button.parentElement.querySelectorAll("input, textarea"),
        ];
        if (inputs.length && inputs.some((input) => !input.value.trim())) {
          event.preventDefault();
          notice("Mohon lengkapi semua kolom.");
        } else if (inputs.length) {
          event.preventDefault();
          notice("Data berhasil dikirim. Terima kasih!");
          inputs.forEach((input) => (input.value = ""));
        }
      }),
    );
  };
  window.FalstoreCartAdd = addCart;
  window.FalstoreWishlistAdd = addWishlist;

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".add-to-cart-btn").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.preventDefault();
        addCart(productFrom(button));
      }),
    );
    document.querySelectorAll(".add-to-wishlist").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.preventDefault();
        addWishlist(productFrom(button));
      }),
    );
    updateBadges();
    renderCart();
    renderWishlist();
    wireForms();
  });
})();
