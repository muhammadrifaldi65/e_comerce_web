/* Fitur belanja Falstore yang berjalan langsung di browser. */
(function () {
  "use strict";
  const cartKey = "falstore-cart",
    wishKey = "falstore-wishlist";
  const accountScope = () => {
    try {
      const user = JSON.parse(localStorage.getItem("falstore-user") || "null");
      return user?.id ? `user-${user.id}` : "guest";
    } catch {
      return "guest";
    }
  };
  const scopedKey = (name) => `${name}:${accountScope()}`;
  const read = (name) => {
    try {
      const value = JSON.parse(localStorage.getItem(scopedKey(name)) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const write = (name, data) =>
    localStorage.setItem(scopedKey(name), JSON.stringify(data));
  const migrateLegacyStorage = () => {
    [cartKey, wishKey].forEach((name) => {
      const legacyKey = name;
      const guestKey = `${name}:guest`;
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue !== null && localStorage.getItem(guestKey) === null)
        localStorage.setItem(guestKey, legacyValue);
      if (legacyValue !== null) localStorage.removeItem(legacyKey);
    });
  };
  migrateLegacyStorage();
  const clearCart = () => {++quoteVersion;write(cartKey, []);quoteMessage='';updateBadges();};
  window.FalstoreStorage = {
    getCart: () => read(cartKey),
    getScope: accountScope,
    removePurchased: (items, scope) => {
      if(scope!==accountScope()) return;
      ++quoteVersion;
      write(cartKey,read(cartKey).map(item=>({...item,qty:Math.max(0,item.qty-(items.find(p=>String(p.id)===String(item.id))?.quantity || 0))})).filter(item=>item.qty>0));
      quoteMessage='';updateBadges();renderCart();
    },
    clearCart,
  };
  let quoteVersion = 0;
  let quoteMessage = '';
  async function quoteCart() {
    const version = ++quoteVersion, scope = accountScope(), cart = read(cartKey), snapshot = JSON.stringify(cart);
    if (!cart.length) {quoteMessage='';updateBadges();renderCart();return {items:[],total:0};}
    quoteMessage='Memperbarui harga dan stok…'; updateBadges(); renderCart();
    try {
      const response=await fetch('/api/cart/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart.map(item=>({id:Number(item.id),quantity:Number(item.qty)}))})});
      const data=await response.json();
      if(!response.ok) throw Error(data.error || 'Harga dan stok gagal diperbarui. Periksa keranjang.');
      if(version!==quoteVersion || scope!==accountScope() || snapshot!==JSON.stringify(read(cartKey))) return null;
      write(cartKey,data.items.map(item=>({...item,id:String(item.id),qty:item.quantity})));
      quoteMessage='';updateBadges();renderCart();return data;
    } catch(error) {
      if(version!==quoteVersion || scope!==accountScope() || snapshot!==JSON.stringify(read(cartKey))) return null;
      quoteMessage=error.message;updateBadges();renderCart();throw error;
    }
  }
  const refreshCart = () => quoteCart().catch(()=>{});
  window.FalstoreStorage.quoteCart=quoteCart;
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
  const notice = (text) => {
    let element = document.querySelector(".falstore-notice");
    if (!element) {
      element = document.createElement("p");
      element.className = "falstore-notice";
      element.setAttribute('role', 'status');
      document.body.append(element);
    }
    element.textContent = text;
    element.classList.add("show");
    clearTimeout(element.hideTimer);
    element.hideTimer = setTimeout(
      () => element.classList.remove("show"),
      2500,
    );
  };
  const updateBadges = () => {
    const cart = read(cartKey),
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
                  `<div class="product-widget"><div class="product-img"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"></div><div class="product-body"><h3 class="product-name">${escapeHtml(item.name)}</h3><h4 class="product-price"><span class="qty">${item.qty}x</span>${money(item.price)}</h4></div></div>`,
              )
              .join("")
          : '<p class="text-center">Keranjang masih kosong.</p>';
      if (summary)
        summary.innerHTML = `<small>${cart.reduce((n, item) => n + item.qty, 0)} produk dipilih</small><h5>SUBTOTAL: ${money(total)}</h5>`;
      if(summary && quoteMessage){const status=document.createElement('p');status.setAttribute('role','status');status.textContent=quoteMessage;summary.append(status);}
    });
  };
  const addCart = (product, quantity = 1) => {
    quantity = Number(quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return notice('Jumlah harus 1 sampai 99.');
    const cart = read(cartKey), item = cart.find((p) => String(p.id) === String(product.id));
    if ((item?.qty || 0) + quantity > Math.min(product.stock ?? 99, 99)) return notice('Jumlah melebihi stok tersedia.');
    if (item) item.qty += quantity;
    else cart.push({ ...product, id: String(product.id), qty: quantity });
    write(cartKey, cart);
    updateBadges();
    refreshCart();
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
    const cart = read(cartKey),
      target = document.querySelector("main .row");
    if (!target) return;
    const total = cart.reduce((n, item) => n + item.price * item.qty, 0);
    const lines = cart.length
      ? cart
          .map(
            (item) =>
              `<div class="product-widget"><div class="product-img"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"></div><div class="product-body"><h3 class="product-name"><a href="product.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a></h3><h4 class="product-price">${money(item.price)}</h4><label>Jumlah <input class="cart-quantity" aria-label="Jumlah ${escapeHtml(item.name)}" type="number" min="1" max="99" value="${escapeHtml(item.qty)}" data-id="${escapeHtml(item.id)}" style="width:65px;margin:8px"></label><button class="primary-btn falstore-remove" data-id="${escapeHtml(item.id)}">Hapus</button></div></div>`,
          )
          .join("")
      : '<p>Keranjang Anda masih kosong. <a href="store.html">Mulai belanja</a>.</p>';
    target.innerHTML = `<div class="col-md-8">${lines}</div><div class="col-md-4"><div class="order-summary"><div class="order-col"><div><strong>Total</strong></div><div><strong class="order-total">${money(total)}</strong></div></div>${cart.length ? '<a class="primary-btn order-submit" href="checkout.html">Lanjut ke Pembayaran</a>' : ""}</div></div>`;
    if(quoteMessage){const status=document.createElement('p');status.setAttribute('role','status');status.textContent=quoteMessage;target.prepend(status);target.querySelector('.order-submit')?.setAttribute('aria-disabled','true');target.querySelector('.order-submit')?.removeAttribute('href');}
    target.querySelectorAll('.cart-quantity').forEach(input => input.onchange = () => {
      const qty = Number(input.value);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) { notice('Jumlah harus 1 sampai 99.'); renderCart(); return; }
      const items = read(cartKey);
      items.find(item => String(item.id) === input.dataset.id).qty = qty;
      write(cartKey, items); renderCart(); updateBadges(); refreshCart();
    });
    target.querySelectorAll(".falstore-remove").forEach(
      (btn) =>
        (btn.onclick = () => {
          write(
            cartKey,
            read(cartKey).filter((item) => String(item.id) !== btn.dataset.id),
          );
          renderCart();
          updateBadges();
          refreshCart();
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
    const params = new URLSearchParams(location.search);
    params.delete("id");
    params.delete("q");
    params.delete("kategori");
    params.delete("category");
    params.delete('categoryId');
    params.delete('offset');
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
    document.querySelectorAll('.newsletter-follow a[href="#"], .footer-links a[href="#"]').forEach(link => { link.removeAttribute('href'); link.setAttribute('aria-disabled','true'); });
    document.querySelectorAll('.newsletter form').forEach(form => {
      const button = form.querySelector('button');
      if (button) { button.disabled = true; button.textContent = 'Belum tersedia'; }
      form.addEventListener('submit', event => event.preventDefault());
    });
  };
  window.FalstoreCartAdd = addCart;
  window.FalstoreWishlistAdd = addWishlist;

  document.addEventListener("DOMContentLoaded", () => {
    updateBadges();
    renderCart();
    renderWishlist();
    wireForms();
    refreshCart();
    document.querySelectorAll('.header-ctn .dropdown-toggle').forEach(button=>button.addEventListener('click',refreshCart));
    window.addEventListener('focus',refreshCart);
    setInterval(()=>{if(!document.hidden && (location.pathname.endsWith('cart.html') || document.querySelector('.header-ctn .dropdown.open')))refreshCart();},30000);
  });
})();
