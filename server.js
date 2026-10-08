require("dotenv").config();
const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "falstore.sqlite");
const UPLOAD_DIR = path.join(ROOT, "uploads");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

class SqliteDatabase {
  constructor(file) {
    this.file = file;
    this.database = null;
    this.inTransaction = false;
  }
  async init() {
    const initSqlJs = require("sql.js");
    const SQL = await initSqlJs({
      locateFile: (file) => require.resolve(`sql.js/dist/${file}`),
    });
    this.database = fs.existsSync(this.file)
      ? new SQL.Database(fs.readFileSync(this.file))
      : new SQL.Database();
    return this;
  }
  exec(sql) {
    this.database.run(sql);
    this.save();
  }
  pragma() {}
  save() {
    fs.writeFileSync(this.file, Buffer.from(this.database.export()));
  }
  prepare(sql) {
    return new SqliteStatement(this, sql);
  }
  transaction(callback) {
    this.database.run("BEGIN");
    this.inTransaction = true;
    try {
      const value = callback();
      this.inTransaction = false;
      this.database.run("COMMIT");
      this.save();
      return value;
    } catch (error) {
      this.inTransaction = false;
      this.database.run("ROLLBACK");
      throw error;
    }
  }
}
class SqliteStatement {
  constructor(owner, sql) {
    this.owner = owner;
    this.sql = sql;
  }
  rows(params) {
    const statement = this.owner.database.prepare(this.sql);
    statement.bind(params);
    const rows = [];
    while (statement.step()) rows.push(statement.getAsObject());
    statement.free();
    return rows;
  }
  all(...params) {
    return this.rows(params);
  }
  get(...params) {
    return this.rows(params)[0];
  }
  run(...params) {
    this.owner.database.run(this.sql, params);
    const id =
      this.owner.database.exec("SELECT last_insert_rowid() AS id")[0]
        ?.values[0]?.[0] || 0;
    const changes = this.owner.database.getRowsModified();
    if (!this.owner.inTransaction) this.owner.save();
    return { lastInsertRowid: id, changes };
  }
}

const PORT = Number(process.env.PORT);
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!Number.isInteger(PORT) || PORT <= 0) {
  throw new Error("PORT harus berupa angka positif.");
}
if (!JWT_SECRET || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    "Konfigurasi environment belum lengkap. Isi PORT, JWT_SECRET, ADMIN_EMAIL, dan ADMIN_PASSWORD.",
  );
}
const db = new SqliteDatabase(DB_FILE);
const ready = db.init().then(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'aksesori',
      price INTEGER NOT NULL CHECK (price >= 0), old_price INTEGER,
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0), image TEXT NOT NULL DEFAULT '/img/product01.png',
      is_featured INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, customer_name TEXT NOT NULL,
      email TEXT NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL, country TEXT NOT NULL,
      zip_code TEXT NOT NULL, telephone TEXT NOT NULL, payment_method TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '', total INTEGER NOT NULL CHECK (total >= 0),
      status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product_id INTEGER,
      product_name TEXT NOT NULL, price INTEGER NOT NULL, quantity INTEGER NOT NULL CHECK (quantity > 0),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);
  const seedProducts = [
    [
      "Laptop Pro 14 inci",
      "laptop-pro-14-inci",
      "Laptop tipis untuk pekerjaan dan hiburan.",
      "laptop",
      14999000,
      15999000,
      12,
      "/img/product01.png",
      1,
    ],
    [
      "Headphone Nirkabel",
      "headphone-nirkabel",
      "Audio jernih dengan koneksi nirkabel stabil.",
      "aksesori",
      899000,
      1099000,
      35,
      "/img/product02.png",
      1,
    ],
    [
      "Laptop Ultra Slim",
      "laptop-ultra-slim",
      "Performa cepat dalam bodi ringan.",
      "laptop",
      12999000,
      13999000,
      9,
      "/img/product03.png",
      1,
    ],
    [
      "Tablet Android 10 inci",
      "tablet-android-10-inci",
      "Tablet serbaguna untuk aktivitas sehari-hari.",
      "smartphone",
      3299000,
      null,
      20,
      "/img/product04.png",
      0,
    ],
    [
      "Kamera Mirrorless",
      "kamera-mirrorless",
      "Kamera ringkas untuk foto dan video berkualitas.",
      "kamera",
      7499000,
      7999000,
      7,
      "/img/product05.png",
      1,
    ],
  ];
  if (db.prepare("SELECT COUNT(*) AS count FROM products").get().count === 0) {
    const insert = db.prepare(
      "INSERT INTO products (name, slug, description, category, price, old_price, stock, image, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    db.transaction(() =>
      seedProducts.forEach((product) => insert.run(...product)),
    );
  }
  if (!db.prepare("SELECT id FROM users WHERE email = ?").get(ADMIN_EMAIL)) {
    db.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    ).run(
      "Administrator",
      ADMIN_EMAIL,
      bcrypt.hashSync(ADMIN_PASSWORD, 12),
      "admin",
    );
  }
  return db;
});

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_DIR, { fallthrough: false }));
app.use((req, res, next) => {
  const blocked =
    /^\/(?:data|server\.js|package(?:\.json|-lock\.json)?|scripts)(?:\/|$)/i;
  if (blocked.test(req.path) || req.path.startsWith("/."))
    return res.status(404).end();
  next();
});
app.use(express.static(ROOT, { index: "index.html" }));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) =>
      cb(
        null,
        `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
      ),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(
      null,
      new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]).has(
        file.mimetype,
      ),
    ),
});

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
}
function publicProduct(product) {
  const { sales_count, ...rest } = product;
  return {
    ...rest,
    salesCount: Number(sales_count || 0),
    isFeatured: Boolean(product.is_featured),
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}
function signUser(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
}
function auth(required = true) {
  return (req, res, next) => {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token)
      return required
        ? res.status(401).json({ error: "Autentikasi diperlukan." })
        : next();
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db
        .prepare(
          "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
        )
        .get(payload.sub);
      if (!user) return res.status(401).json({ error: "Sesi tidak valid." });
      req.user = user;
      next();
    } catch {
      return res
        .status(401)
        .json({ error: "Token tidak valid atau sudah kedaluwarsa." });
    }
  };
}
function adminOnly(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Akses admin diperlukan." });
  next();
}
function validateProduct(body) {
  const name = String(body.name || "").trim();
  const category = String(body.category || "aksesori")
    .trim()
    .toLowerCase();
  const price = Number(body.price);
  const oldPrice =
    body.oldPrice === "" || body.oldPrice == null
      ? null
      : Number(body.oldPrice);
  const stock = Number(body.stock);
  if (
    !name ||
    !Number.isInteger(price) ||
    price < 0 ||
    (oldPrice !== null && (!Number.isInteger(oldPrice) || oldPrice < 0)) ||
    !Number.isInteger(stock) ||
    stock < 0
  )
    return {
      error:
        "Nama, harga, harga lama, dan stok harus diisi dengan angka yang valid.",
    };
  return {
    value: {
      name,
      slug: String(body.slug || name)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      description: String(body.description || "").trim(),
      category,
      price,
      oldPrice,
      stock,
      image: String(body.image || "/img/product01.png").trim(),
      isFeatured: Boolean(body.isFeatured),
    },
  };
}
function removeUploadedImage(image) {
  if (!image?.startsWith("/uploads/")) return;
  const file = path.join(UPLOAD_DIR, path.basename(image));
  if (file.startsWith(UPLOAD_DIR) && fs.existsSync(file)) fs.unlinkSync(file);
}

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "falstore-api" }),
);
app.post("/api/auth/register", (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8)
      return res.status(400).json({
        error:
          "Nama, email valid, dan kata sandi minimal 8 karakter diperlukan.",
      });
    const result = db
      .prepare(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      )
      .run(name, email, bcrypt.hashSync(password, 12), "customer");
    const user = db
      .prepare(
        "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      )
      .get(result.lastInsertRowid);
    res.status(201).json({ token: signUser(user), user: publicUser(user) });
  } catch (error) {
    if (String(error.message).includes("UNIQUE"))
      return res.status(409).json({ error: "Email sudah terdaftar." });
    next(error);
  }
});
app.post("/api/auth/login", (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  const user = db
    .prepare(
      "SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?",
    )
    .get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: "Email atau kata sandi salah." });
  res.json({ token: signUser(user), user: publicUser(user) });
});
app.get("/api/auth/me", auth(), (req, res) =>
  res.json({ user: publicUser(req.user) }),
);

app.get("/api/products", (req, res) => {
  const params = [];
  const conditions = [];
  if (req.query.category) {
    conditions.push("p.category = ?");
    params.push(String(req.query.category).toLowerCase());
  }
  if (req.query.search) {
    conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
    const q = `%${String(req.query.search)}%`;
    params.push(q, q);
  }
  if (req.query.featured === "1") conditions.push("p.is_featured = 1");
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const popular = req.query.sort === "popular";
  const select = popular
    ? "SELECT p.*, COALESCE(SUM(oi.quantity), 0) AS sales_count FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id"
    : "SELECT p.* FROM products p";
  const order = popular
    ? "ORDER BY sales_count DESC, p.created_at DESC, p.id DESC"
    : "ORDER BY p.created_at DESC, p.id DESC";
  const limit =
    Number.isInteger(Number(req.query.limit)) && Number(req.query.limit) > 0
      ? Math.min(Number(req.query.limit), 50)
      : null;
  const sql = `${select} ${where} ${popular ? "GROUP BY p.id" : ""} ${order}${limit ? " LIMIT ?" : ""}`;
  if (limit) params.push(limit);
  const products = db
    .prepare(sql)
    .all(...params)
    .map(publicProduct);
  res.json({ products });
});
app.get("/api/products/:idOrSlug", (req, res) => {
  const key = req.params.idOrSlug;
  const product = /^\d+$/.test(key)
    ? db.prepare("SELECT * FROM products WHERE id = ?").get(Number(key))
    : db.prepare("SELECT * FROM products WHERE slug = ?").get(key);
  if (!product)
    return res.status(404).json({ error: "Produk tidak ditemukan." });
  res.json({ product: publicProduct(product) });
});

app.use("/api/admin", auth(), adminOnly);
app.get("/api/admin/stats", (_req, res) =>
  res.json({
    stats: {
      products: db.prepare("SELECT COUNT(*) AS count FROM products").get()
        .count,
      customers: db
        .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'")
        .get().count,
      orders: db.prepare("SELECT COUNT(*) AS count FROM orders").get().count,
      revenue: db
        .prepare(
          "SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status != 'cancelled'",
        )
        .get().total,
    },
  }),
);
app.get("/api/admin/products", (_req, res) =>
  res.json({
    products: db
      .prepare("SELECT * FROM products ORDER BY id DESC")
      .all()
      .map(publicProduct),
  }),
);
app.post("/api/admin/products", (req, res, next) => {
  try {
    const parsed = validateProduct(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const p = parsed.value;
    const result = db
      .prepare(
        "INSERT INTO products (name, slug, description, category, price, old_price, stock, image, is_featured, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
      )
      .run(
        p.name,
        p.slug,
        p.description,
        p.category,
        p.price,
        p.oldPrice,
        p.stock,
        p.image,
        p.isFeatured ? 1 : 0,
      );
    res.status(201).json({
      product: publicProduct(
        db
          .prepare("SELECT * FROM products WHERE id = ?")
          .get(result.lastInsertRowid),
      ),
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE"))
      return res.status(409).json({ error: "Slug produk sudah digunakan." });
    next(error);
  }
});
app.put("/api/admin/products/:id", (req, res, next) => {
  try {
    const current = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(Number(req.params.id));
    if (!current)
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    const parsed = validateProduct({
      ...current,
      ...req.body,
      oldPrice: req.body.oldPrice ?? current.old_price,
      isFeatured: req.body.isFeatured ?? Boolean(current.is_featured),
    });
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const p = parsed.value;
    db.prepare(
      "UPDATE products SET name = ?, slug = ?, description = ?, category = ?, price = ?, old_price = ?, stock = ?, image = ?, is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(
      p.name,
      p.slug,
      p.description,
      p.category,
      p.price,
      p.oldPrice,
      p.stock,
      p.image,
      p.isFeatured ? 1 : 0,
      current.id,
    );
    if (current.image !== p.image) removeUploadedImage(current.image);
    res.json({
      product: publicProduct(
        db.prepare("SELECT * FROM products WHERE id = ?").get(current.id),
      ),
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE"))
      return res.status(409).json({ error: "Slug produk sudah digunakan." });
    next(error);
  }
});
app.delete("/api/admin/products/:id", (req, res) => {
  const product = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(Number(req.params.id));
  if (!product)
    return res.status(404).json({ error: "Produk tidak ditemukan." });
  db.prepare("DELETE FROM products WHERE id = ?").run(product.id);
  removeUploadedImage(product.image);
  res.status(204).end();
});
app.post("/api/admin/uploads/image", upload.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({
      error: "File gambar wajib diunggah (JPG, PNG, WEBP, atau GIF).",
    });
  res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size,
  });
});
app.get("/api/admin/orders", (_req, res) =>
  res.json({
    orders: db
      .prepare(
        "SELECT o.*, u.name AS account_name FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.id DESC",
      )
      .all(),
  }),
);

app.post("/api/orders", auth(), (req, res) => {
  const {
    customerName,
    email,
    address,
    city,
    country,
    zipCode,
    telephone,
    paymentMethod,
    notes = "",
    items,
  } = req.body;
  if (
    !customerName ||
    !email ||
    !address ||
    !city ||
    !country ||
    !zipCode ||
    !telephone ||
    !paymentMethod ||
    !Array.isArray(items) ||
    !items.length
  )
    return res.status(400).json({ error: "Data checkout belum lengkap." });
  const requested = items
    .map((item) => ({ id: Number(item.id), quantity: Number(item.quantity) }))
    .filter(
      (item) =>
        Number.isInteger(item.id) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  if (!requested.length)
    return res.status(400).json({ error: "Item pesanan tidak valid." });
  const products = requested.map((item) => ({
    ...item,
    product: db.prepare("SELECT * FROM products WHERE id = ?").get(item.id),
  }));
  if (
    products.some((item) => !item.product || item.quantity > item.product.stock)
  )
    return res
      .status(400)
      .json({ error: "Produk tidak tersedia atau stok tidak mencukupi." });
  const total = products.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const createOrder = db.transaction(() => {
    const order = db
      .prepare(
        "INSERT INTO orders (user_id, customer_name, email, address, city, country, zip_code, telephone, payment_method, notes, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        req.user.id,
        String(customerName),
        String(email),
        String(address),
        String(city),
        String(country),
        String(zipCode),
        String(telephone),
        String(paymentMethod),
        String(notes),
        total,
      );
    const addItem = db.prepare(
      "INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)",
    );
    const reduceStock = db.prepare(
      "UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    );
    products.forEach((item) => {
      addItem.run(
        order.lastInsertRowid,
        item.product.id,
        item.product.name,
        item.product.price,
        item.quantity,
      );
      reduceStock.run(item.quantity, item.product.id);
    });
    return order.lastInsertRowid;
  });
  res.status(201).json({ orderId: createOrder(), total });
});

app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Endpoint tidak ditemukan." }),
);
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

async function start() {
  await ready;
  return app.listen(PORT, () =>
    console.log(`Falstore berjalan di http://localhost:${PORT}`),
  );
}
if (require.main === module) start();
module.exports = { app, db, ready, start, UPLOAD_DIR };
