(function () {
  "use strict";
  const money = (amount) =>
    "Rp " + new Intl.NumberFormat("id-ID").format(Number(amount) || 0);
  document.addEventListener("DOMContentLoaded", async () => {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) return;
    try {
      const response = await fetch("/api/products/" + encodeURIComponent(id));
      if (!response.ok) return;
      const { product } = await response.json();
      const details = document.querySelector(".product-details");
      if (!details) return;
      const mainImage = document.querySelector("#product-main-img img");
      if (mainImage) {
        mainImage.src = product.image;
        mainImage.alt = product.name;
      }
      document.querySelectorAll("#product-imgs img").forEach((image) => {
        image.src = product.image;
        image.alt = product.name;
      });
      const name = details.querySelector(".product-name");
      const price = details.querySelector(".product-price");
      const description = details.querySelector(":scope > p");
      const category = details.querySelector(".product-category");
      if (name) name.textContent = product.name;
      if (price)
        price.innerHTML =
          money(product.price) +
          (product.old_price
            ? ` <del class="product-old-price">${money(product.old_price)}</del>`
            : "");
      if (description) description.textContent = product.description;
      if (category) category.textContent = product.category;
      const button = details.querySelector(".add-to-cart-btn");
      if (button) button.dataset.productId = String(product.id);
      const stock = details.querySelector(".product-available");
      if (stock)
        stock.textContent =
          product.stock > 0 ? `Tersedia (${product.stock})` : "Stok habis";
    } catch (error) {
      console.warn("Detail produk API tidak tersedia:", error.message);
    }
  });
})();
