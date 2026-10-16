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
    `<div class="col-md-4 col-xs-6"><div class="product"><div class="product-img"><a href="product.html?id=${product.id}"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></a></div><div class="product-body"><p class="product-category">${escapeHtml(product.categoryName)}${product.brandName ? ' · '+escapeHtml(product.brandName) : ''}</p><h3 class="product-name"><a href="product.html?id=${product.id}">${escapeHtml(product.name)}</a></h3><h4 class="product-price">${money(product.price)}${Math.max(product.basePrice || 0,product.oldPrice || 0) > product.price ? ` <del class="product-old-price">${money(Math.max(product.basePrice || 0,product.oldPrice || 0))}</del>` : ''}</h4><div class="product-rating">${product.stock > 0 ? 'Tersedia' : 'Stok habis'}</div><div class="product-btns"><button class="add-to-wishlist" aria-label="Simpan ${escapeHtml(product.name)}" data-product-id="${product.id}"><i class="fa fa-heart-o"></i><span class="tooltipp">simpan</span></button></div></div><div class="add-to-cart"><button class="add-to-cart-btn" data-product-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}><i class="fa fa-shopping-cart"></i> tambah ke keranjang</button></div></div></div>`;
  const widget = (product) =>
    `<div><div class="product-widget"><div class="product-img"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></div><div class="product-body"><p class="product-category">${escapeHtml(product.categoryName)}</p><h3 class="product-name"><a href="product.html?id=${product.id}">${escapeHtml(product.name)}</a></h3><h4 class="product-price">${money(product.price)}</h4></div></div></div>`;
  const bind = (products) => {
    document.querySelectorAll(".product .add-to-wishlist, .product .add-to-cart-btn").forEach(
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
            stock: product.stock,
          };
          if (button.classList.contains("add-to-wishlist"))
            window.FalstoreWishlistAdd?.(cartProduct);
          else window.FalstoreCartAdd?.(cartProduct);
        }),
    );
  };
  const navigateWithFilters = (changes) => {
    const params = new URLSearchParams(location.search);
    params.delete('offset');
    Object.entries(changes).forEach(([name, value]) => {
      if (name === "category") {
        params.delete("kategori");
        params.delete("category");
        if (value) params.set("kategori", value);
        return;
      }
      if (value == null || value === "") params.delete(name);
      else params.set(name, String(value));
    });
    const query = params.toString();
    location.href = "store.html" + (query ? `?${query}` : "");
  };
  const setupFilters = () => {
    const store = document.querySelector("#store");
    if (!store) return;
    const params = new URLSearchParams(location.search);
    const selects = store.querySelectorAll(".store-sort select");
    const sortSelect = selects[0];
    const limitSelect = selects[1];
    if (sortSelect) {
      sortSelect.value = params.get("sort") || "popular";
      sortSelect.addEventListener("change", () =>
        navigateWithFilters({ sort: sortSelect.value }),
      );
    }
    if (limitSelect) {
      limitSelect.value = params.get("limit") || "20";
      limitSelect.addEventListener("change", () =>
        navigateWithFilters({ limit: limitSelect.value }),
      );
    }
    const minInput = document.querySelector("#price-min");
    const maxInput = document.querySelector("#price-max");
    const priceSlider = document.querySelector("#price-slider");
    const minPrice = params.has("minPrice")
      ? Number(params.get("minPrice"))
      : NaN;
    const maxPrice = params.has("maxPrice")
      ? Number(params.get("maxPrice"))
      : NaN;
    const rangeMin = 0;
    const rangeMax = 20000000;
    const boundedMin = Number.isFinite(minPrice)
      ? Math.max(rangeMin, Math.min(rangeMax, minPrice))
      : rangeMin;
    const boundedMax = Number.isFinite(maxPrice)
      ? Math.max(rangeMin, Math.min(rangeMax, maxPrice))
      : rangeMax;
    const selectedMin = Math.min(boundedMin, boundedMax);
    const selectedMax = Math.max(boundedMin, boundedMax);
    if (minInput) minInput.value = selectedMin;
    if (maxInput) maxInput.value = selectedMax;
    const applyPrice = () => {
      const min = Number(minInput?.value);
      const max = Number(maxInput?.value);
      if (!Number.isFinite(min) || !Number.isFinite(max)) return;
      navigateWithFilters({
        minPrice: Math.min(min, max),
        maxPrice: Math.max(min, max),
      });
    };
    minInput?.addEventListener("change", applyPrice);
    maxInput?.addEventListener("change", applyPrice);
    if (priceSlider?.noUiSlider) {
      priceSlider.noUiSlider.set([selectedMin, selectedMax]);
      priceSlider.noUiSlider.on("set", (values) =>
        navigateWithFilters({
          minPrice: Math.round(Number(values[0])),
          maxPrice: Math.round(Number(values[1])),
        }),
      );
    }
  };
  const renderPopularWidgets = async () => {
    const sliders = document.querySelectorAll(".backend-products-widget");
    const lists = document.querySelectorAll(".backend-popular-list");
    if (!sliders.length && !lists.length) return;
    const response = await fetch("/api/products?sort=popular&limit=9");
    if (!response.ok) throw Error('Produk populer gagal dimuat.');
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
          autoplay: !matchMedia('(prefers-reduced-motion: reduce)').matches,
          speed: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
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
    ['categoryId','brandId'].forEach(key => {if(params.has(key)) query.set(key,params.get(key));});
    if (params.get("q")) query.set("search", params.get("q"));
    if (params.has("minPrice")) query.set("minPrice", params.get("minPrice"));
    if (params.has("maxPrice")) query.set("maxPrice", params.get("maxPrice"));
    query.set("sort", params.get("sort") || "popular");
    query.set("limit", params.get("limit") || "20");
    query.set('offset',params.get('offset') || '0');
    setupFilters();
    document.querySelectorAll('#store > .row, #related-products').forEach(target=>{target.textContent='Memuat produk…';target.setAttribute('role','status');});
    try {
      const response = await fetch("/api/products?" + query.toString());
      if (!response.ok) throw Error('Katalog belum dapat dimuat. Silakan muat ulang halaman.');
      const { products, total, limit, offset } = await response.json();
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
          ? `${total} produk ditemukan${params.get("q") ? ` untuk "${params.get("q")}"` : ""}.`
          : "Tidak ada produk yang cocok dengan pencarian Anda.";
        store.parentElement.insertBefore(summary, store);
        document.querySelectorAll(".store-qty").forEach(
          (element) =>
            (element.textContent = `Menampilkan ${products.length ? offset+1 : 0}–${offset+products.length} dari ${total} produk`),
        );
        document.querySelectorAll('.store-pagination').forEach(list=>{
          const page=Math.floor(offset/limit), pages=Math.ceil(total/limit);
          const link=(index,label)=>{const next=new URLSearchParams(params);next.set('offset',String(index*limit));next.set('limit',String(limit));return `<li><a href="store.html?${escapeHtml(next.toString())}" aria-label="Halaman ${index+1}">${label}</a></li>`;};
          let markup=page>0 ? link(page-1,'‹') : '';
          const start=Math.max(0,Math.min(page-2,pages-5));
          for(let index=start;index<Math.min(pages,start+5);index++)markup+=index===page ? `<li class="active" aria-current="page">${index+1}</li>` : link(index,index+1);
          if(page+1<pages)markup+=link(page+1,'›');
          list.innerHTML=markup;
        });
      }
      document.querySelectorAll(".products-slick").forEach((slider) => {
        if (window.jQuery && jQuery(slider).hasClass("slick-initialized"))
          jQuery(slider).slick("unslick");
        slider.innerHTML = products.slice(0, 8).map(productCard).join('') || '<p>Produk belum tersedia.</p>';
        if (window.jQuery && slider.dataset.nav && products.length)
          jQuery(slider).slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            speed: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
            arrows: true,
            appendArrows: slider.dataset.nav,
            responsive: [
              { breakpoint: 991, settings: { slidesToShow: 2 } },
              { breakpoint: 480, settings: { slidesToShow: 1 } },
            ],
          });
      });
      bind(products);
      renderPopularWidgets().catch(() => document.querySelectorAll('.backend-products-widget,.backend-popular-list').forEach(target => {target.textContent='Produk populer gagal dimuat.';}));
    } catch (error) {
      console.warn("Katalog API tidak tersedia:", error.message);
      document.querySelectorAll('#store > .row, .products-slick, #related-products').forEach(target => { target.textContent = error.message; });
    }
  });
})();
