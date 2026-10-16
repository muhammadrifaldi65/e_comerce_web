const crypto = require('node:crypto');
const commerce = require('./commerce');
const BASE = 'https://portal.axiomcreative.xyz';
function fail(message, statusCode = 400) { return Object.assign(new Error(message), {statusCode, publicMessage: message}); }
function normalizeCheckout(body) {
  if (!body || typeof body !== 'object') throw fail('Data checkout tidak valid.');
  const value = {};
  for (const [key, max] of Object.entries({customerName:120,email:254,address:1000,city:120,country:120,zipCode:20,telephone:30,notes:1000})) {
    const input = body[key] ?? (key === 'notes' ? '' : null);
    if (typeof input !== 'string' || input.length > max || /[\x00-\x1f\x7f]/.test(input) || (key !== 'notes' && !input.trim())) throw fail(`Field ${key} tidak valid.`);
    value[key] = input.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw fail('Email tidak valid.');
  if (body.paymentMethod !== 'qris') throw fail('Pembayaran hanya melalui QRIS.');
  if (typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId)) throw fail('requestId UUID wajib diisi.');
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 100) throw fail('Item pesanan tidak valid.');
  const quantities = new Map();
  for (const item of body.items) {
    if (!item || !Number.isSafeInteger(item.id) || item.id < 1 || item.id > 2147483647 || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000) throw fail('Item pesanan tidak valid.');
    const quantity = (quantities.get(item.id) || 0) + item.quantity;
    if (quantity > 1000) throw fail('Jumlah produk maksimal 1000.');
    quantities.set(item.id, quantity);
  }
  return {...value, paymentMethod:'qris', requestId:body.requestId.toLowerCase(), items:[...quantities].sort((a,b) => a[0]-b[0]).map(([id,quantity]) => ({id,quantity}))};
}
function verifiedPayment(order, result) {
  const data = result?.data;
  if (result?.success !== true || !data || data.qris_id !== order.qris_id || !data.trx_id || (order.trx_id && data.trx_id !== order.trx_id) || data.amount !== order.total) throw fail('Identitas atau nominal pembayaran belum terverifikasi.', 502);
  if (data.status === 'PAID' && result.status === 'PAID' && result.paid === true) {
    if (!result.transaction || result.transaction.order_id !== data.trx_id || result.transaction.amount !== order.total) throw fail('Settlement pembayaran belum terverifikasi.', 502);
    return 'paid';
  }
  if (result.paid !== false || result.status !== data.status || !['PENDING','EXPIRED'].includes(data.status)) throw fail('Status pembayaran belum terverifikasi.', 502);
  return data.status.toLowerCase();
}
function feeSnapshot(data) {
  return Number.isSafeInteger(data.fee_amount) && data.fee_amount >= 0 && Number.isSafeInteger(data.net_amount) && data.net_amount >= 0 && data.fee_amount + data.net_amount === data.amount ? [data.fee_amount,data.net_amount] : [null,null];
}
function publicOrder(order) {
  const active = order.payment_status === 'pending' && order.qris_id && order.payment_expires_at && new Date(order.payment_expires_at).getTime() > Date.now();
  return {orderId:order.id, id:order.id, requestId:order.request_id, total:order.total, status:order.status, customerName:order.customer_name, email:order.email, address:order.address, city:order.city, country:order.country, zipCode:order.zip_code, telephone:order.telephone, notes:order.notes, createdAt:order.created_at,
    carrier:order.carrier || '',trackingNumber:order.tracking_number || '',
    payment:{qrisId:order.qris_id || null, qrUrl:active ? `${BASE}/qr/${encodeURIComponent(order.qris_id)}` : null, qrImageUrl:active ? `${BASE}/api/qr-image/${encodeURIComponent(order.qris_id)}` : null, expiresAt:order.payment_expires_at || null, status:order.payment_status || 'unknown'}, stockReserved:order.stock_reserved === true};
}
async function migrate(db) {
  await db.exec(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS request_id TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS request_hash TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unknown';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS qris_id TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS trx_id TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_checked_at TIMESTAMPTZ;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_fee_amount INTEGER;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_net_amount INTEGER;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_reserved BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier TEXT NOT NULL DEFAULT '';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT NOT NULL DEFAULT '';
    CREATE UNIQUE INDEX IF NOT EXISTS orders_user_request_unique ON orders(user_id, request_id);
    CREATE UNIQUE INDEX IF NOT EXISTS orders_qris_unique ON orders(qris_id);
    CREATE UNIQUE INDEX IF NOT EXISTS orders_trx_unique ON orders(trx_id);
    CREATE INDEX IF NOT EXISTS orders_user_id_index ON orders(user_id);
    CREATE INDEX IF NOT EXISTS order_items_order_id_index ON order_items(order_id);`);
}
function install(app, db, auth, adminOnly) {
  const apiKey = process.env.AXIOM_API_KEY?.trim();
  async function provider(route, body) {
    if (!apiKey) throw fail('Pembayaran QRIS belum tersedia. Hubungi pengelola.', 503);
    const response = await fetch(`${BASE}${route}`, {method:body ? 'POST' : 'GET', headers:{'x-api-key':apiKey, ...(body ? {'Content-Type':'application/json'} : {})}, ...(body ? {body:JSON.stringify(body)} : {}), signal:AbortSignal.timeout(15000), redirect:'error'});
    const result = await response.json();
    return {ok:response.ok, result};
  }
  async function getOrder(id, userId) {
    if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) > 2147483647) throw fail('Pesanan tidak ditemukan.',404);
    const order = await db.prepare(`SELECT * FROM orders WHERE id = ?${userId == null ? '' : ' AND user_id = ?'}`).get(...(userId == null ? [Number(id)] : [Number(id),userId]));
    if (!order) throw fail('Pesanan tidak ditemukan.',404);
    return order;
  }
  async function present(order) {
    const items = await db.prepare('SELECT product_id AS id, product_name AS name, price, quantity, base_price AS "basePrice", promotion_id AS "promotionId", discount_amount AS "discountAmount" FROM order_items WHERE order_id = ? ORDER BY id').all(order.id);
    return {...publicOrder(order), items};
  }
  async function apply(order, result) {
    const status = verifiedPayment(order,result);
    const expires = result.data.expires_at && Number.isFinite(Date.parse(result.data.expires_at)) ? result.data.expires_at : null;
    return db.transaction(async tx => {
      const current = await tx.prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE').get(order.id);
      if (current.payment_status === 'paid') return current;
      if (current.qris_id && current.qris_id !== result.data.qris_id) throw fail('Invoice berbeda.',409);
      if (current.payment_status === 'expired' && status === 'pending') return current;
      if (current.trx_id && current.trx_id !== result.data.trx_id) throw fail('Referensi transaksi berbeda.',409);
      await tx.prepare("UPDATE orders SET qris_id = ?, trx_id = ?, payment_status = ?, payment_expires_at = COALESCE(?, payment_expires_at), status = ?, payment_fee_amount = COALESCE(payment_fee_amount, ?), payment_net_amount = COALESCE(payment_net_amount, ?) WHERE id = ?").run(result.data.qris_id,result.data.trx_id,status,expires,status === 'paid' ? 'paid' : status === 'expired' ? 'expired' : 'pending',...feeSnapshot(result.data),order.id);
      return tx.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    });
  }
  async function poll(order) {
    if (!order.qris_id || order.payment_status === 'paid' || !apiKey) return order;
    const claim = await db.prepare("UPDATE orders SET payment_checked_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_status != 'paid' AND (payment_checked_at IS NULL OR payment_checked_at < CURRENT_TIMESTAMP - INTERVAL '15 seconds') RETURNING *").get(order.id);
    if (!claim) return getOrder(order.id);
    try {
      const {ok,result} = await provider(`/check-payment?qris_id=${encodeURIComponent(claim.qris_id)}`);
      if (ok) return await apply(claim,result);
    } catch { /* Unknown is not proof of nonpayment; retain reservation and invoice. */ }
    return getOrder(order.id);
  }
  const route = handler => async (req,res,next) => { try { res.set('Cache-Control','no-store'); await handler(req,res); } catch(error) { next(error); } };
  app.get('/api/payments/reconcile',route(async (req,res) => {
    const secret = process.env.CRON_SECRET;
    const supplied = req.headers.authorization || '';
    const expected = `Bearer ${secret || ''}`;
    if (!secret || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(expected))) throw fail('Autentikasi diperlukan.',401);
    const orders = await db.prepare("SELECT * FROM orders WHERE qris_id IS NOT NULL AND payment_status != 'paid' AND (payment_checked_at IS NULL OR payment_checked_at < CURRENT_TIMESTAMP - INTERVAL '15 seconds') ORDER BY payment_checked_at ASC NULLS FIRST, id LIMIT 10").all();
    await Promise.all(orders.map(poll));
    res.json({checked:orders.length});
  }));
  app.post('/api/orders',auth(),route(async (req,res) => {
    const input = normalizeCheckout(req.body);
    const hash = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
    let created = false;
    const order = await db.transaction(async tx => {
      // Serialize submissions for this customer, including concurrent identical request IDs.
      await tx.prepare('SELECT id FROM users WHERE id = ? FOR UPDATE').get(req.user.id);
      const existing = await tx.prepare('SELECT * FROM orders WHERE user_id = ? AND request_id = ?').get(req.user.id,input.requestId);
      if (existing) {
        if (existing.request_hash !== hash) throw fail('requestId sudah digunakan dengan rincian berbeda.',409);
        return existing;
      }
      if (!apiKey) throw fail('Pembayaran QRIS belum tersedia. Hubungi pengelola.',503);
      const products = [];
      let total = 0;
      for (const item of input.items) {
        const product = await tx.prepare('SELECT * FROM products WHERE id = ? FOR UPDATE').get(item.id);
        if (!product || product.stock < item.quantity) throw fail('Produk tidak tersedia atau stok tidak mencukupi.',409);
        products.push({...item,product});
      }
      const promotions = await commerce.loadPromotions(tx), now = new Date();
      for (const item of products) {
        item.pricing = commerce.priceProduct(item.product,promotions,now);
        total += item.pricing.price * item.quantity;
      }
      if (!Number.isSafeInteger(total) || total < 1 || total > 10000000) throw fail('Total QRIS harus Rp1 sampai Rp10.000.000.');
      const saved = await tx.prepare("INSERT INTO orders (user_id,customer_name,email,address,city,country,zip_code,telephone,payment_method,notes,total,request_id,request_hash,payment_status,stock_reserved) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'unknown',TRUE)").run(req.user.id,input.customerName,input.email,input.address,input.city,input.country,input.zipCode,input.telephone,'qris',input.notes,total,input.requestId,hash);
      for (const item of products) {
        await tx.prepare('INSERT INTO order_items (order_id,product_id,product_name,price,quantity,base_price,promotion_id,discount_amount) VALUES (?,?,?,?,?,?,?,?)').run(saved.lastInsertRowid,item.id,item.product.name,item.pricing.price,item.quantity,item.pricing.basePrice,item.pricing.promotionId,item.pricing.discountAmount);
        await tx.prepare('UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(item.quantity,item.id);
      }
      created = true;
      return tx.prepare('SELECT * FROM orders WHERE id = ?').get(saved.lastInsertRowid);
    });
    if (!created) return res.json(await present(await poll(order)));
    // Durable unknown precedes network I/O. A crash or timeout must NEVER retry create.
    let response;
    try { response = await provider('/create-qris',{amount:order.total}); } catch { return res.status(201).json(await present(order)); }
    const data = response.result?.data;
    if (typeof data?.qris_id === 'string' && data.qris_id.length > 0 && data.qris_id.length <= 200) {
      await db.prepare('UPDATE orders SET qris_id = ?, trx_id = COALESCE(trx_id, ?) WHERE id = ? AND (qris_id IS NULL OR qris_id = ?)').run(data.qris_id,typeof data.trx_id === 'string' && data.trx_id.length <= 200 ? data.trx_id : null,order.id,data.qris_id);
      order.qris_id = data.qris_id;
      if (response.ok && response.result.success === true && data.amount === order.total && typeof data.trx_id === 'string' && data.trx_id && data.status === 'PENDING' && Number.isFinite(Date.parse(data.expires_at))) {
        await db.prepare("UPDATE orders SET trx_id = ?, payment_status = 'pending', payment_expires_at = ?, payment_fee_amount = ?, payment_net_amount = ? WHERE id = ? AND payment_status = 'unknown' AND qris_id = ?").run(data.trx_id,data.expires_at,...feeSnapshot(data),order.id,data.qris_id);
      }
    }
    res.status(201).json(await present(await getOrder(order.id)));
  }));
  app.get('/api/orders',auth(),route(async (req,res) => {
    const orders = await db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
    res.json({orders:await Promise.all(orders.map(present))});
  }));
  app.get('/api/orders/:id/payment',auth(),route(async (req,res) => res.json(await present(await poll(await getOrder(req.params.id,req.user.id))))));
  async function orderList(query, userId) {
    const page = commerce.paging(query), params = [], conditions = [];
    if (userId != null) { conditions.push('user_id = ?'); params.push(userId); }
    if (query.search) { conditions.push('(customer_name ILIKE ? OR email ILIKE ? OR id::text ILIKE ? OR tracking_number ILIKE ?)'); const value = `%${query.search}%`; params.push(value,value,value,value); }
    if (query.status) { conditions.push('status = ?'); params.push(String(query.status)); }
    const where = conditions.length ? ' WHERE '+conditions.join(' AND ') : '';
    const count = await db.prepare('SELECT COUNT(*)::int AS total FROM orders'+where).get(...params);
    const orders = await db.prepare('SELECT * FROM orders'+where+' ORDER BY id DESC LIMIT ? OFFSET ?').all(...params,page.limit,page.offset);
    return {orders:await Promise.all(orders.map(present)),total:count.total,...page};
  }
  app.get('/api/admin/orders',auth(),adminOnly,route(async (req,res) => res.json(await orderList(req.query))));
  app.get('/api/admin/orders/:id',auth(),adminOnly,route(async (req,res) => res.json(await present(await getOrder(req.params.id)))));
  app.get('/api/admin/customers',auth(),adminOnly,route(async (req,res) => {
    const page = commerce.paging(req.query), params = [], search = req.query.search ? ' AND (u.name ILIKE ? OR u.email ILIKE ?)' : '';
    if (search) params.push(`%${req.query.search}%`,`%${req.query.search}%`);
    const count = await db.prepare("SELECT COUNT(*)::int AS total FROM users u WHERE u.role = 'customer'"+search).get(...params);
    const customers = await db.prepare(`SELECT u.id,u.name,u.email,u.created_at AS "createdAt",(SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS "orderCount" FROM users u WHERE u.role = 'customer'${search} ORDER BY u.id DESC LIMIT ? OFFSET ?`).all(...params,page.limit,page.offset);
    res.json({customers,total:count.total,...page});
  }));
  app.get('/api/admin/customers/:id/orders',auth(),adminOnly,route(async (req,res) => {
    const customer = await db.prepare("SELECT id,name,email,created_at AS \"createdAt\" FROM users WHERE id = ? AND role = 'customer'").get(commerce.integer(req.params.id));
    if (!customer) throw fail('Pelanggan tidak ditemukan.',404);
    res.json({customer,...await orderList(req.query,customer.id)});
  }));
  app.get('/api/admin/orders/:id/payment',auth(),adminOnly,route(async (req,res) => res.json(await present(await poll(await getOrder(req.params.id))))));
  app.patch('/api/admin/orders/:id',auth(),adminOnly,route(async (req,res) => {
    const transitions = {paid:'processing',processing:'shipped',shipped:'completed'};
    if (!['processing','shipped','completed'].includes(req.body.status)) throw fail('Status pemenuhan tidak valid.');
    const updated = await db.transaction(async tx => {
      const order = await tx.prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE').get(commerce.integer(req.params.id));
      if (!order) throw fail('Pesanan tidak ditemukan.',404);
      if (order.payment_status !== 'paid' || (order.status !== req.body.status && transitions[order.status] !== req.body.status)) throw fail('Hanya pesanan lunas yang dapat diproses berurutan.',409);
      const carrier = req.body.carrier ?? order.carrier, trackingNumber = req.body.trackingNumber ?? order.tracking_number;
      if (typeof carrier !== 'string' || carrier.length > 120 || /[\x00-\x1f\x7f]/.test(carrier) || typeof trackingNumber !== 'string' || trackingNumber.length > 120 || /[\x00-\x1f\x7f]/.test(trackingNumber)) throw fail('Kurir atau resi tidak valid.');
      if (['shipped','completed'].includes(req.body.status) && (!carrier.trim() || !/^[A-Za-z0-9][A-Za-z0-9 ._\/-]{0,119}$/.test(trackingNumber.trim()))) throw fail('Kurir dan nomor resi valid wajib diisi.');
      return tx.prepare('UPDATE orders SET status = ?,carrier = ?,tracking_number = ? WHERE id = ? RETURNING *').get(req.body.status,carrier.trim(),trackingNumber.trim(),order.id);
    });
    res.json(await present(updated));
  }));
  app.post('/api/admin/orders/:id/payment/reconcile',auth(),adminOnly,route(async (req,res) => {
    const order = await getOrder(req.params.id);
    const qrisId = req.body.qrisId;
    if (typeof qrisId !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(qrisId)) throw fail('ID invoice tidak valid.');
    if (order.qris_id && order.qris_id !== qrisId) throw fail('Invoice pesanan tidak boleh diganti.',409);
    const {ok,result} = await provider(`/check-payment?qris_id=${encodeURIComponent(qrisId)}`);
    if (!ok) throw fail('Invoice belum dapat diverifikasi.',502);
    // An operator must identify the original invoice in Axiom, never match amount alone.
    if (!order.qris_id && req.body.confirmOriginalInvoice !== true) throw fail('Konfirmasi invoice asli diperlukan.');
    res.json(await present(await apply({...order,qris_id:qrisId},result)));
  }));
}
module.exports = {migrate,install,normalizeCheckout,verifiedPayment,publicOrder};
