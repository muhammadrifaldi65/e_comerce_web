(function () {
  "use strict";
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
  const productCard = (product) =>
    `<div class="col-md-4 col-xs-6"><div class="product"><div class="product-img"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></div><div class="product-body"><p class="product-category">${escapeHtml(product.category)}</p><h3 class="product-name"><a href="product.html?id=${product.id}">${escapeHtml(product.name)}</a></h3><h4 class="product-price">${money(product.price)}${product.old_price ? ` <del class="product-old-price">${money(product.old_price)}</del>` : ""}</h4><div class="product-rating"><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star-o"></i></div><div class="product-btns"><button class="add-to-wishlist" data-product-id="${product.id}"><i class="fa fa-heart-o"></i><span class="tooltipp">simpan</span></button></div></div><div class="add-to-cart"><button class="add-to-cart-btn" data-product-id="${product.id}"><i class="fa fa-shopping-cart"></i> tambah ke keranjang</button></div></div></div>`;
  const widget = (product) =>
    `<div><div class="product-widget"><div class="product-img"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></div><div class="product-body"><p class="product-category">${escapeHtml(product.category)}</p><h3 class="product-name"><a href="product.html?id=${product.id}">${escapeHtml(product.name)}</a></h3><h4 class="product-price">${money(product.price)}</h4></div></div></div>`;
  const bind = (products) => {
    document.querySelectorAll("[data-product-id]").forEach(
      (button) =>
        (button.onclick = (event) => {
          event.preventDefault();
          const product = products.find(
            (item) => item.id === Number(button.dataset.productId),
          );
          if (!product) return;
          const cartProduct = {
            id: String(product.id),
            name: product.name,
            price: product.price,
            image: product.image,
          };
          if (button.classList.contains("add-to-wishlist"))
            window.FalstoreWishlistAdd?.(cartProduct);
          else window.FalstoreCartAdd?.(cartProduct);
        }),
    );
  };
  const renderPopularWidgets = async () => {
    const sliders = document.querySelectorAll(".backend-products-widget");
    const lists = document.querySelectorAll(".backend-popular-list");
    if (!sliders.length && !lists.length) return;
    const response = await fetch("/api/products?sort=popular&limit=9");
    if (!response.ok) return;
    const { products } = await response.json();
    const markup = products.length
      ? products.map(widget).join("")
      : '<p class="text-center">Belum ada produk dari backend.</p>';
    lists.forEach((list) => {
      list.innerHTML = markup;
    });
    sliders.forEach((slider) => {
      if (window.jQuery && jQuery(slider).hasClass("slick-initialized"))
        jQuery(slider).slick("unslick");
      slider.innerHTML = markup;
      if (window.jQuery && slider.dataset.nav && products.length)
        jQuery(slider).slick({
          infinite: true,
          autoplay: true,
          speed: 300,
          dots: false,
          arrows: true,
          appendArrows: slider.dataset.nav,
        });
    });
  };
  document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(location.search);
    const query = new URLSearchParams();
    const category = params.get("kategori") || params.get("category");
    if (category) query.set("category", category);
    if (params.get("q")) query.set("search", params.get("q"));
    try {
      const response = await fetch("/api/products?" + query.toString());
      if (!response.ok) return;
      const { products } = await response.json();
      const store = document.querySelector("#store > .row");
      const related = document.querySelector("#related-products");
      if (related) {
        const currentId = params.get("id");
        const relatedProducts = products
          .filter((product) => String(product.id) !== String(currentId))
          .slice(0, 8);
        related.innerHTML =
          relatedProducts.map(productCard).join("") ||
          '<div class="col-md-12"><p>Belum ada produk terkait dari backend.</p></div>';
      }
      if (store)
        store.innerHTML =
          products.map(productCard).join("") ||
          '<div class="col-md-12"><p>Produk belum tersedia.</p></div>';
      if (store) {
        const summary = document.createElement("p");
        summary.className = "api-result-summary";
        summary.textContent = products.length
          ? `${products.length} produk ditemukan${params.get("q") ? ` untuk "${params.get("q")}"` : ""}.`
          : "Tidak ada produk yang cocok dengan pencarian Anda.";
        store.parentElement.insertBefore(summary, store);
      }
      document.querySelectorAll(".products-slick").forEach((slider) => {
        if (window.jQuery && jQuery(slider).hasClass("slick-initialized"))
          jQuery(slider).slick("unslick");
        slider.innerHTML = products.slice(0, 8).map(productCard).join("");
        if (window.jQuery && slider.dataset.nav)
          jQuery(slider).slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            arrows: true,
            appendArrows: slider.dataset.nav,
            responsive: [
              { breakpoint: 991, settings: { slidesToShow: 2 } },
              { breakpoint: 480, settings: { slidesToShow: 1 } },
            ],
          });
      });
      bind(products);
      renderPopularWidgets().catch((error) =>
        console.warn("Produk populer API tidak tersedia:", error.message),
      );
    } catch (error) {
      console.warn("Katalog API tidak tersedia:", error.message);
    }
  });
})();
