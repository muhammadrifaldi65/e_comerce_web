const assert = require('node:assert/strict');
const { normalizeCheckout, verifiedPayment, publicOrder } = require('../api/payments');
const body = { requestId: '11111111-1111-4111-8111-111111111111', customerName: 'Pembeli', email: 'buyer@example.com', address: 'Jalan Merdeka 1', city: 'Jakarta', country: 'Indonesia', zipCode: '12345', telephone: '08123456789', paymentMethod: 'qris', items: [{id: 2, quantity: 2}, {id: 2, quantity: 3}] };
assert.deepEqual(normalizeCheckout(body).items, [{id: 2, quantity: 5}]);
for (const items of [[{id: 2, quantity: '1'}], [{id: -1, quantity: 1}], [{id: 1, quantity: 0}], [{id: 1, quantity: 1}, {}]]) assert.throws(() => normalizeCheckout({...body, items}));
assert.throws(() => normalizeCheckout({...body, paymentMethod: 'cash'}));
assert.throws(() => normalizeCheckout({...body, requestId: 'bad'}));
const order = { id: 1, total: 100000, qris_id: 'invoice-1', trx_id: 'trx-1', payment_status: 'pending', status: 'pending' };
const result = {success: true, paid: true, status: 'PAID', data: {qris_id: 'invoice-1', trx_id: 'trx-1', amount: 100000, status: 'PAID'}, transaction: {order_id: 'trx-1', amount: 100000}};
assert.equal(verifiedPayment(order, result), 'paid');
for (const change of [{qris_id: 'other'}, {trx_id: 'other'}, {amount: 100001}]) assert.throws(() => verifiedPayment(order, {...result, data: {...result.data, ...change}}));
assert.throws(() => verifiedPayment(order, {...result, success: false}));
assert.throws(() => verifiedPayment(order, {...result, transaction: {...result.transaction, amount: 1}}));
assert.equal(verifiedPayment(order, {success: true, paid: false, status: 'EXPIRED', data: {...result.data, status: 'EXPIRED'}}), 'expired');
assert.equal(publicOrder({...order, payment_status: 'paid'}).payment.qrImageUrl, null);
assert.equal(publicOrder({...order, payment_status: 'unknown'}).payment.qrUrl, null);
console.log('Payment invariants passed (offline; no gateway/database calls).');

// Optional real Postgres transactions, isolated schema; gateway transport is synthetic.
// Run: node scripts/payment-regression.js --database
if (process.argv.includes('--database')) integration().catch(error => { console.error(error.message); process.exitCode = 1; });
async function integration() {
  require('dotenv').config();
  const {Pool} = require('pg');
  const crypto = require('node:crypto');
  const jwt = require('jsonwebtoken');
  const schema = `payment_check_${crypto.randomBytes(8).toString('hex')}`;
  const url = new URL(process.env.DATABASE_URL);
  // Neon transaction pooling rejects startup search_path; tests require a direct session.
  if (url.hostname.endsWith('.neon.tech')) url.hostname = url.hostname.replace(/-pooler(?=\.)/, '');
  const control = new Pool({connectionString:url.toString(), ssl:{rejectUnauthorized:false}});
  const originalFetch = global.fetch;
  let app, listener, calls = 0, mode = 'pending';
  const invoices = new Map();
  try {
    await control.query(`CREATE SCHEMA ${schema}`);
    url.searchParams.set('options',`-c search_path=${schema}`);
    process.env.DATABASE_URL = url.toString();
    process.env.AXIOM_API_KEY = 'offline-regression-key';
    process.env.JWT_SECRET = 'offline-regression-jwt-secret-not-for-deployment';
    process.env.ADMIN_EMAIL = 'regression@example.com';
    process.env.ADMIN_PASSWORD = 'regression-only-password';
    global.fetch = async (target,options) => {
      if (!String(target).startsWith('https://portal.axiomcreative.xyz/')) return originalFetch(target,options);
      if (String(target).endsWith('/create-qris')) {
        calls++;
        if (mode === 'timeout') throw new Error('Synthetic timeout');
        const amount = JSON.parse(options.body).amount;
        const data = {qris_id:`test-${calls}`,trx_id:`trx-${calls}`,amount,status:'PENDING',expires_at:new Date(Date.now()+900000).toISOString()};
        invoices.set(data.qris_id,data);
        return Response.json({success:true,data});
      }
      const id = new URL(target).searchParams.get('qris_id');
      const data = {...invoices.get(id)};
      if (mode === 'paid' || mode === 'mismatch') data.status = 'PAID';
      if (mode === 'mismatch') data.amount++;
      return Response.json({success:true,paid:data.status === 'PAID',status:data.status,data,transaction:{order_id:data.trx_id,amount:data.amount}});
    };
    app = require('../server');
    await app.ready;
    listener = app.listen(0,'127.0.0.1');
    await new Promise(resolve => listener.once('listening',resolve));
    const base = `http://127.0.0.1:${listener.address().port}`;
    const user = await app.db.prepare('SELECT id FROM users WHERE email = ?').get(process.env.ADMIN_EMAIL);
    const token = jwt.sign({sub:user.id},process.env.JWT_SECRET);
    const other = await app.db.prepare("INSERT INTO users(name,email,password_hash) VALUES ('Other','other@example.com','unused')").run();
    const otherToken = jwt.sign({sub:other.lastInsertRowid},process.env.JWT_SECRET);
    const request = async (route,method='GET',payload,access=token) => {
      const response = await originalFetch(base+route,{method,headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},...(payload ? {body:JSON.stringify(payload)} : {})});
      return {status:response.status,body:await response.json()};
    };
    const stock = async () => (await app.db.prepare('SELECT stock FROM products WHERE id = 2').get()).stock;
    const initial = await stock();
    const submitted = await request('/api/orders','POST',{...body,total:1});
    assert.equal(submitted.status,201);
    assert.equal(submitted.body.total,899000*5);
    assert.equal(await stock(),initial-5);
    const id = submitted.body.orderId;
    assert.equal((await request('/api/orders','POST',body)).body.orderId,id);
    assert.equal(calls,1);
    assert.equal((await request('/api/orders','POST',{...body,city:'Bandung'})).status,409);
    assert.equal((await request(`/api/orders/${id}/payment`,'GET',null,otherToken)).status,404);
    assert.equal((await request('/api/orders','GET',null,otherToken)).body.orders.length,0);
    mode = 'mismatch';
    await app.db.prepare('UPDATE orders SET payment_checked_at = NULL WHERE id = ?').run(id);
    assert.equal((await request(`/api/orders/${id}/payment`)).body.payment.status,'pending');
    mode = 'paid';
    await app.db.prepare('UPDATE orders SET payment_checked_at = NULL WHERE id = ?').run(id);
    assert.equal((await request(`/api/orders/${id}/payment`)).body.payment.status,'paid');
    await request(`/api/orders/${id}/payment`);
    assert.equal(await stock(),initial-5);
    assert.equal((await request(`/api/admin/orders/${id}`,'PATCH',{status:'shipped'})).status,409);
    assert.equal((await request(`/api/admin/orders/${id}`,'PATCH',{status:'processing'})).status,200);
    assert.equal((await request(`/api/admin/orders/${id}`,'PATCH',{status:'shipped'})).status,400);
    assert.equal((await request(`/api/admin/orders/${id}`,'PATCH',{status:'shipped',carrier:'JNE',trackingNumber:'REG-123'})).body.trackingNumber,'REG-123');
    assert.equal((await request(`/api/admin/orders/${id}`,'PATCH',{status:'completed'})).body.status,'completed');
    mode = 'timeout';
    const uncertainBody = {...body,requestId:crypto.randomUUID(),items:[{id:2,quantity:1}]};
    const uncertain = await request('/api/orders','POST',uncertainBody);
    assert.equal(uncertain.body.payment.status,'unknown');
    await request('/api/orders','POST',uncertainBody);
    assert.equal(calls,2);
    mode = 'pending';
    await app.db.prepare('UPDATE products SET stock = 1 WHERE id = 2').run();
    const races = await Promise.all([1,2].map(() => request('/api/orders','POST',{...body,requestId:crypto.randomUUID(),items:[{id:2,quantity:1}]})));
    assert.deepEqual(races.map(r=>r.status).sort(),[201,409]);
    assert.equal(await stock(),0);
    // A separate route installation proves absent key rejects before writes.
    const express = require('express');
    const missing = express();
    missing.use(express.json());
    delete process.env.AXIOM_API_KEY;
    require('../api/payments').install(missing,app.db,() => (req,res,next) => {req.user=user;next();},(req,res,next)=>next());
    missing.use((error,req,res,next)=>res.status(error.statusCode || 500).json({error:error.message}));
    const noKey = missing.listen(0,'127.0.0.1');
    await new Promise(resolve => noKey.once('listening',resolve));
    try {
      const count = await app.db.prepare('SELECT COUNT(*) AS count FROM orders').get();
      const response = await originalFetch(`http://127.0.0.1:${noKey.address().port}/api/orders`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,requestId:crypto.randomUUID()})});
      assert.equal(response.status,503);
      assert.deepEqual(await app.db.prepare('SELECT COUNT(*) AS count FROM orders').get(),count);
      assert.equal(await stock(),0);
    } finally { await new Promise(resolve => noKey.close(resolve)); }
    console.log('Isolated Postgres payment regression passed; no real gateway requests.');
  } finally {
    global.fetch = originalFetch;
    if (listener) await new Promise(resolve => listener.close(resolve));
    if (app) await app.db.close();
    await control.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await control.end();
  }
}
