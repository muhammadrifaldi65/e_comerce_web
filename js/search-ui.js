(function () {
  "use strict";
  const categories = [
    { value: "", label: "Semua Kategori" },
    { value: "laptop", label: "Laptop" },
    { value: "smartphone", label: "Smartphone" },
    { value: "kamera", label: "Kamera" },
    { value: "aksesori", label: "Aksesori" },
  ];
  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(location.search);
    document.querySelectorAll(".header-search form").forEach((form) => {
      const select = form.querySelector("select");
      const input = form.querySelector('input[type="search"], input.input');
      const button = form.querySelector(".search-btn");
      if (select) {
        select.innerHTML = categories
          .map(
            (category) =>
              `<option value="${category.value}">${category.label}</option>`,
          )
          .join("");
        select.value = params.get("kategori") || params.get("category") || "";
        select.setAttribute("aria-label", "Pilih kategori produk");
      }
      if (input) {
        input.type = "search";
        input.name = "q";
        input.value = params.get("q") || "";
        input.setAttribute("autocomplete", "off");
        input.setAttribute("aria-label", "Cari produk");
      }
      if (button) button.type = "submit";
      form.classList.add("falstore-search-form");
    });
  });
})();
