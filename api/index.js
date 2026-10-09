let app;
let loadError;

try {
  app = require("../server");
} catch (error) {
  loadError = error;
}

module.exports = async function handler(req, res) {
  try {
    if (loadError) throw loadError;
    await app.ready;
    return app(req, res);
  } catch (error) {
    console.error(error);
    if (res.headersSent) return;
    const required = [
      "DATABASE_URL",
      "JWT_SECRET",
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD",
    ];
    const missing = required.filter((key) => !process.env[key]);
    res.status(500).json({
      error: missing.length
        ? "Environment Vercel belum lengkap."
        : "Server gagal melakukan inisialisasi.",
      missing,
    });
  }
};
