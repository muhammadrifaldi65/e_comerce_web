const assert = require('node:assert/strict');

(async () => {
  let app, server;
  try {
    let base = process.argv[2];
    if (!base) {
      app = require('../server');
      await app.ready;
      server = app.listen(0, '127.0.0.1');
      await new Promise(resolve => server.once('listening', resolve));
      base = `http://127.0.0.1:${server.address().port}`;
    }
    async function get(path) {
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) });
      assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
      return response;
    }
    for (const [path, keys] of [
      ['/api/products?sort=popular&limit=20&offset=0', ['products']],
      ['/api/promotions', ['promotions']],
      ['/api/catalog/meta', ['categories', 'brands']],
    ]) {
      const response = await get(path);
      assert.match(response.headers.get('content-type'), /application\/json/);
      const body = await response.json();
      for (const key of keys) assert.ok(Array.isArray(body[key]), `${path}: ${key} bukan array`);
      console.log(`OK ${path}`);
    }
    for (const path of ['/', '/store.html', '/favicon.ico']) await get(path);
    const cssPath = '/css/slick-theme.css';
    const css = await (await get(cssPath)).text();
    for (const match of css.matchAll(/url\(['"]?([^'"\s)]+)['"]?\)/g)) {
      await get(new URL(match[1], new URL(cssPath, base)).href);
    }
    console.log('OK halaman, favicon, seluruh aset slick-theme.css');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (app) await app.db.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
