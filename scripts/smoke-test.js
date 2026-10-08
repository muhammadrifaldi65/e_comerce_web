require("dotenv").config();
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminEmail || !adminPassword) {
  throw new Error(
    "Konfigurasi environment belum lengkap. Isi ADMIN_EMAIL dan ADMIN_PASSWORD.",
  );
}

const port = 3310;
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["server.js"], {
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
const waitForServer = new Promise((resolve, reject) => {
  let output = "";
  const timer = setTimeout(
    () => reject(new Error("Server tidak siap dalam batas waktu.")),
    15000,
  );
  child.stdout.on("data", (chunk) => {
    output += chunk;
    if (output.includes("Falstore berjalan")) {
      clearTimeout(timer);
      resolve();
    }
  });
  child.once("error", reject);
});
const request = async (url, options) => {
  const response = await fetch(base + url, options);
  const body = await response.json().catch(() => null);
  return { response, body };
};
(async () => {
  try {
    await waitForServer;
    const health = await request("/api/health");
    if (!health.body?.ok) throw new Error("Health check gagal.");
    const catalog = await request("/api/products");
    if (!catalog.body?.products?.length)
      throw new Error("Seed katalog kosong.");
    const unauthorized = await request("/api/admin/stats");
    if (unauthorized.response.status !== 401)
      throw new Error("Endpoint admin tidak terlindungi.");
    const login = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });
    if (!login.body?.token) throw new Error("Login admin gagal.");
    const headers = {
      Authorization: `Bearer ${login.body.token}`,
      "content-type": "application/json",
    };
    const suffix = Date.now();
    const created = await request("/api/admin/products", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: `Smoke ${suffix}`,
        slug: `smoke-${suffix}`,
        category: "aksesori",
        price: 1000,
        stock: 2,
        description: "smoke",
      }),
    });
    if (created.response.status !== 201)
      throw new Error("Create produk gagal.");
    const updated = await request(
      `/api/admin/products/${created.body.product.id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          ...created.body.product,
          name: `Smoke Updated ${suffix}`,
          price: 2000,
          oldPrice: null,
          isFeatured: false,
        }),
      },
    );
    if (updated.response.status !== 200)
      throw new Error("Update produk gagal.");
    const form = new FormData();
    form.append(
      "image",
      new Blob([Buffer.from("smoke")], { type: "image/png" }),
      "smoke.png",
    );
    const uploaded = await request("/api/admin/uploads/image", {
      method: "POST",
      headers: { Authorization: `Bearer ${login.body.token}` },
      body: form,
    });
    if (uploaded.response.status !== 201)
      throw new Error("Upload gambar gagal.");
    const imageFile = path.join(
      __dirname,
      "..",
      uploaded.body.url.replace("/uploads/", "uploads/"),
    );
    if (fs.existsSync(imageFile)) fs.unlinkSync(imageFile);
    const removed = await request(
      `/api/admin/products/${created.body.product.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${login.body.token}` },
      },
    );
    if (removed.response.status !== 204)
      throw new Error("Delete produk gagal.");
    console.log(
      "Smoke test lulus: health, katalog, proteksi admin, login, CRUD produk, dan upload.",
    );
  } finally {
    child.kill();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
