(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money = value => 'Rp' + new Intl.NumberFormat('id-ID').format(Number(value || 0));
  const date = value => value ? new Date(value).toLocaleString('id-ID') : '—';
  const token = localStorage.getItem('falstore-token');
  let user;
  try { user = JSON.parse(localStorage.getItem('falstore-user') || 'null'); } catch { user = null; }
  if (!token || user?.role !== 'admin') { location.href = 'account.html'; return; }
  $('#admin-user').textContent = user.name + ' · ' + user.email;
  $('#timezone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
  $('#logout').onclick = () => { localStorage.removeItem('falstore-token'); localStorage.removeItem('falstore-user'); location.href = 'account.html'; };
  const state = {categories:[], brands:[], products:[], promotions:[], targets:[], orders:[], customers:[], offsets:{products:0,orders:0,customers:0,history:0}, requests:{}, customerId:null};
  const limit = 20;
  function show(text, error = false) { const node = $('#message'); node.className = error ? 'error' : 'success'; node.textContent = text; node.focus({preventScroll:true}); }
  async function api(url, options = {}) {
    const response = await fetch(url, {...options, headers:{...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}), Authorization:'Bearer ' + token}});
    const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) throw Error(data.error || (response.status === 401 ? 'Sesi berakhir. Silakan masuk kembali.' : 'Permintaan gagal (' + response.status + ').'));
    return data;
  }
  async function busy(element, action) {
    const controls = element.matches('button') ? [element] : [...element.querySelectorAll('button, input, select, textarea')];
    if(element.matches('.admin-form')) controls.push(...element.closest('section').querySelectorAll('[data-edit], [data-delete]'));
    const disabled = controls.map(control => control.disabled);
    controls.forEach(control => { control.disabled = true; }); element.setAttribute('aria-busy','true');
    try { await action(); } catch (error) { show(error.message, true); }
    finally { controls.forEach((control,i) => { control.disabled = disabled[i]; }); element.removeAttribute('aria-busy'); }
  }
  function table(headings, rows) { return '<div class="table-scroll" tabindex="0" role="region" aria-label="Tabel ' + esc(headings[0]) + '"><table class="admin-table"><thead><tr>' + headings.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function actions(resource, id) { return '<div class="admin-actions"><button type="button" class="primary-btn" data-edit="'+resource+'" data-id="'+esc(id)+'">Edit</button><button type="button" class="primary-btn" data-delete="'+resource+'" data-id="'+esc(id)+'">Hapus</button></div>'; }
  function options(select, rows, placeholder) {
    const value = select.value;
    select.innerHTML = '<option value="">'+esc(placeholder)+'</option>' + rows.map(row => '<option value="'+esc(row.id)+'">'+esc(row.name)+'</option>').join('');
    select.value = value;
  }
  function pager(resource, total, count, load) {
    const node = $('#'+resource+'-pager'), offset = state.offsets[resource];
    node.innerHTML = '<span>'+(count ? offset+1 : 0)+'–'+(offset+count)+' dari '+esc(total)+'</span><button type="button" class="primary-btn" '+(!offset?'disabled':'')+' data-step="-1">Sebelumnya</button><button type="button" class="primary-btn" '+(offset+count>=total?'disabled':'')+' data-step="1">Berikutnya</button>';
    node.querySelectorAll('button').forEach(button => { button.onclick = () => { state.offsets[resource] = Math.max(0,offset+Number(button.dataset.step)*limit); load(); }; });
  }
  async function list(resource, target, filter, render, endpoint = '/api/admin/'+resource) {
    const request = (state.requests[resource] || 0)+1; state.requests[resource] = request;
    const node = $(target); node.setAttribute('aria-busy','true'); node.textContent = 'Memuat…';
    const params = new URLSearchParams(filter ? new FormData($(filter)) : undefined);
    params.set('limit',limit); params.set('offset',state.offsets[resource] || 0);
    const submit = filter ? $(filter).querySelector('[type=submit]') : null;
    if(submit) submit.disabled=true;
    $('#'+resource+'-pager').querySelectorAll('button').forEach(button=> {button.disabled=true;});
    try {
      const data = await api(endpoint+'?'+params);
      if (state.requests[resource] !== request) return;
      render(data);
    } catch (error) {
      if (state.requests[resource] !== request) return;
      node.innerHTML = '<p class="error">'+esc(error.message)+'</p><button class="primary-btn" type="button">Coba lagi</button>';
      node.querySelector('button').onclick = () => list(resource,target,filter,render,endpoint);
    } finally { if (state.requests[resource] === request) {node.removeAttribute('aria-busy');if(submit) submit.disabled=false;} }
  }
  async function dashboard() {
    return busy($('#refresh-dashboard'), async () => {
      $('#stats').textContent = 'Memuat…';
      try {
        const {stats} = await api('/api/admin/stats');
        $('#stats').innerHTML = [['Produk',stats.products],['Pelanggan',stats.customers],['Pesanan',stats.orders],['Pendapatan terverifikasi',money(stats.revenue)]].map(([label,value]) => '<div class="stat"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>').join('');
        $('#order-counts').innerHTML = Object.entries(stats.orderCounts).map(([status,count]) => '<p>'+esc(status)+': <strong>'+esc(count)+'</strong></p>').join('') || '<p>Belum ada pesanan.</p>';
        $('#low-stock').innerHTML = stats.lowStock.length ? table(['Produk','Stok'],stats.lowStock.map(p => '<tr><td>'+esc(p.name)+'</td><td>'+esc(p.stock)+'</td></tr>')) : '<p>Tidak ada stok menipis.</p>';
      } catch(error) { $('#stats').textContent = 'Ringkasan gagal dimuat. Gunakan Perbarui untuk mencoba lagi.'; throw error; }
    });
  }
  async function metadata() {
    const [categories, brands] = await Promise.all([api('/api/admin/categories'),api('/api/admin/brands')]);
    for (const [resource,data] of [['categories',categories],['brands',brands]]) {
      state[resource] = data[resource];
      $('#'+resource).innerHTML = state[resource].length ? table(['Nama','Slug','Jumlah produk','Tindakan'],state[resource].map(row => '<tr><td>'+esc(row.name)+'</td><td>'+esc(row.slug)+'</td><td>'+esc(row.productCount)+'</td><td>'+actions(resource,row.id)+'</td></tr>')) : '<p>Belum ada '+(resource==='categories'?'kategori':'merek')+'.</p>';
    }
    options($('#product-form').elements.categoryId,state.categories,'Pilih kategori');
    options($('#product-form').elements.brandId,state.brands,'Tanpa merek');
    options($('#product-filter').elements.categoryId,state.categories,'Semua kategori');
    options($('#product-filter').elements.brandId,state.brands,'Semua merek');
    targetOptions();
  }
  function products() { return list('products','#products','#product-filter',data => {
    state.products = data.products;
    $('#products').innerHTML = data.products.length ? table(['Produk','Kategori / Merek','Harga dasar / Stok','Tindakan'],data.products.map(p => '<tr><td>'+(p.image?'<img src="'+esc(p.image)+'" alt="" loading="lazy"> ':'')+esc(p.name)+(p.isFeatured?' <strong>(Unggulan)</strong>':'')+'</td><td>'+esc(p.categoryName)+' / '+esc(p.brandName || 'Tanpa merek')+'</td><td>'+money(p.price)+'<br>Stok '+esc(p.stock)+'</td><td>'+actions('products',p.id)+'</td></tr>')) : '<p>Tidak ada produk sesuai pencarian.</p>';
    pager('products',data.total,data.products.length,products);
  }); }
  async function targets() {
    const rows = []; let offset = 0;
    while (true) {
      const data = await api('/api/admin/products?limit=100&offset='+offset);
      rows.push(...data.products); offset += data.products.length;
      if (!data.products.length || offset >= data.total) break;
    }
    state.targets = rows; targetOptions();
  }
  function targetOptions() { const form = $('#promotion-form'); options(form.elements.targetId,form.elements.targetType.value==='category'?state.categories:state.targets,'Pilih target'); }
  function discountConstraint() { const form = $('#promotion-form'), percent = form.elements.discountType.value==='percent'; form.elements.discountValue.min = percent?'0.01':'1'; form.elements.discountValue.step = percent?'0.01':'1'; if(percent) form.elements.discountValue.max='99.99'; else form.elements.discountValue.removeAttribute('max'); }
  async function promotions() {
    const node = $('#promotions'); node.textContent = 'Memuat…';
    try {
      const data = await api('/api/admin/promotions'); state.promotions = data.promotions;
      node.innerHTML = data.promotions.length ? table(['Promo','Target / Diskon','Jadwal lokal','Status / Urutan','Tindakan'],data.promotions.map(p => {
        const target = (p.targetType==='category'?state.categories:state.targets).find(row => Number(row.id)===Number(p.targetId));
        const status = !p.enabled?'Nonaktif':Date.now()<Date.parse(p.startsAt)?'Terjadwal':Date.now()>=Date.parse(p.endsAt)?'Berakhir':'Aktif';
        return '<tr><td>'+esc(p.title)+'</td><td>'+esc(target?.name || (p.targetType+' #'+p.targetId))+'<br>'+esc(p.discountType==='percent'?p.discountValue+'%':money(p.discountValue))+'</td><td>'+esc(date(p.startsAt))+'<br>s.d. '+esc(date(p.endsAt))+'</td><td>'+status+' / '+esc(p.sortOrder)+'</td><td>'+actions('promotions',p.id)+'</td></tr>';
      })) : '<p>Belum ada promo.</p>';
    } catch(error) { node.innerHTML = '<p class="error">'+esc(error.message)+'</p><button type="button" class="primary-btn">Coba lagi</button>'; node.querySelector('button').onclick = promotions; }
  }
  function localDate(value) { const d = new Date(value); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16); }
  function edit(resource,id) {
    const row = state[resource].find(item => Number(item.id)===Number(id)); if(!row) return;
    const form = $(resource==='products'?'#product-form':resource==='promotions'?'#promotion-form':'#'+resource+'-form');
    if(form.getAttribute('aria-busy')==='true') return;
    form.reset();
    if(resource==='promotions') { form.elements.targetType.value=row.targetType; targetOptions(); form.elements.discountType.value=row.discountType; discountConstraint(); }
    for(const control of form.elements) {
      if(!control.name || control.type==='file' || !(control.name in row)) continue;
      if(control.type==='checkbox') control.checked=Boolean(row[control.name]);
      else control.value = ['startsAt','endsAt'].includes(control.name)?localDate(row[control.name]):row[control.name] ?? '';
    }
    const preview = form.querySelector('.image-preview'); if(preview) { preview.hidden=!row.image; if(row.image) preview.src=row.image; }
    form.scrollIntoView({block:'start'}); form.querySelector('input:not([type=hidden])').focus({preventScroll:true});
  }
  async function upload(form) {
    const file = form.elements.imageFile.files[0];
    if(!file) return form.elements.image.value;
    if(file.size>4*1024*1024) throw Error('Ukuran gambar maksimal 4 MB.');
    if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) throw Error('Pilih gambar JPEG, PNG, WebP, atau GIF.');
    const data = new FormData(); data.append('image',file);
    const result = await api('/api/admin/uploads/image',{method:'POST',body:data});
    form.elements.image.value=result.url; form.elements.imageFile.value=''; return result.url;
  }
  async function save(form,resource,id,body) {
    await api('/api/admin/'+resource+(id?'/'+encodeURIComponent(id):''),{method:id?'PUT':'POST',body:JSON.stringify(body)});
    form.reset(); show('Data berhasil disimpan.');
    if(resource==='products') { await Promise.all([products(),targets(),metadata(),dashboard()]); }
    else if(resource==='promotions') await promotions();
    else await metadata();
  }
  $('#product-form').onsubmit = event => {
    event.preventDefault(); const form=event.currentTarget, f=form.elements;
    busy(form,async () => {
      const id=f.id.value;
      const body={name:f.name.value.trim(),slug:f.slug.value.trim(),categoryId:Number(f.categoryId.value),brandId:f.brandId.value?Number(f.brandId.value):null,price:Number(f.price.value),oldPrice:f.oldPrice.value?Number(f.oldPrice.value):null,stock:Number(f.stock.value),description:f.description.value,isFeatured:f.isFeatured.checked};
      body.image=await upload(form); await save(form,'products',id,body);
    });
  };
  document.querySelectorAll('.metadata-form').forEach(form => { form.onsubmit = event => { event.preventDefault(); busy(form,()=>save(form,form.dataset.resource,form.elements.id.value,{name:form.elements.name.value.trim(),slug:form.elements.slug.value.trim()})); }; });
  $('#promotion-form').onsubmit = event => {
    event.preventDefault(); const form=event.currentTarget, f=form.elements;
    busy(form,async () => {
      const id=f.id.value;
      const startsAt=new Date(f.startsAt.value), endsAt=new Date(f.endsAt.value);
      if(!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt<=startsAt) throw Error('Waktu selesai harus setelah waktu mulai.');
      const link=f.link.value.trim();
      if(!link.startsWith('/') || link.startsWith('//') || /[\\\s]/.test(link) || /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(link) || new URL(link,location.origin).origin!==location.origin) throw Error('Gunakan tautan internal toko yang diawali /, misalnya /store.html.');
      const body={title:f.title.value.trim(),description:f.description.value,link,sortOrder:Number(f.sortOrder.value),enabled:f.enabled.checked,startsAt:startsAt.toISOString(),endsAt:endsAt.toISOString(),targetType:f.targetType.value,targetId:Number(f.targetId.value),discountType:f.discountType.value,discountValue:Number(f.discountValue.value)};
      body.image=await upload(form); await save(form,'promotions',id,body);
    });
  };
  $('#promotion-form').elements.targetType.onchange=targetOptions;
  $('#promotion-form').elements.discountType.onchange=discountConstraint;
  document.querySelectorAll('.admin-form').forEach(form => form.addEventListener('reset',()=> {
    if(form.elements.id) form.elements.id.value='';
    if(form.elements.image) form.elements.image.value='';
    const preview=form.querySelector('.image-preview');
    if(preview) {preview.hidden=true;preview.removeAttribute('src');}
    if(form.id==='promotion-form') queueMicrotask(()=> {if(!form.elements.id.value) {targetOptions();discountConstraint();}});
  }));
  function orderDetails(o, operational) {
    const next={paid:'processing',processing:'shipped',shipped:'completed'}[o.status];
    return '<details class="order-detail"><summary>Pesanan #'+esc(o.orderId)+' · '+esc(o.status)+' · '+money(o.total)+'</summary><p>'+esc(date(o.createdAt))+' · '+esc(o.customerName)+' · '+esc(o.email)+'</p><p>'+esc(o.address)+', '+esc(o.city)+', '+esc(o.zipCode)+' · '+esc(o.telephone)+'</p><p>Catatan: '+esc(o.notes || '—')+'</p>'+table(['Barang','Jumlah','Harga snapshot'],o.items.map(item=>'<tr><td>'+esc(item.name)+'</td><td>'+esc(item.quantity)+'</td><td>'+money(item.price)+'</td></tr>'))+'<p>QRIS: '+esc(o.payment?.qrisId || 'Belum diketahui')+' · Status pembayaran: '+esc(o.payment?.status || 'unknown')+'</p><p>Kurir: '+esc(o.carrier || '—')+' · Resi: '+esc(o.trackingNumber || '—')+'</p>'+(o.stockReserved && ['expired','unknown'].includes(o.payment?.status)?'<p>Stok tetap dicadangkan sampai pembayaran terlambat dipastikan. Tidak dilepas otomatis.</p>':'')+(operational?'<button type="button" class="primary-btn" data-payment="'+esc(o.orderId)+'">Periksa pembayaran QRIS</button>'+(next && o.payment?.status==='paid'?'<form class="admin-form fulfillment" data-id="'+esc(o.orderId)+'" data-next="'+next+'"><h4>Pemenuhan pesanan</h4>'+(next==='shipped'?'<div class="form-grid"><label>Kurir<input class="input" name="carrier" required maxlength="100" value="'+esc(o.carrier || '')+'"></label><label>Nomor resi<input class="input" name="trackingNumber" required maxlength="200" value="'+esc(o.trackingNumber || '')+'"></label></div>':'')+'<button class="primary-btn" type="submit">'+({processing:'Proses pesanan',shipped:'Tandai dikirim',completed:'Tandai selesai'}[next])+'</button></form>':'')+(!o.payment?.qrisId?'<form class="admin-form reconcile" data-id="'+esc(o.orderId)+'"><h4>Rekonsiliasi invoice asli</h4><p>Gunakan hanya ID invoice asli pesanan dari Axiom. Jangan cocokkan berdasarkan nominal saja.</p><label>ID invoice QRIS<input class="input" name="qrisId" pattern="[A-Za-z0-9_-]{1,200}" required maxlength="200"></label><label><input type="checkbox" name="confirmed" required>Saya telah memeriksa bahwa invoice ini benar-benar invoice asli pesanan ini.</label><button class="primary-btn" type="submit">Verifikasi invoice asli</button></form>':''):'')+'</details>';
  }
  function orders() { return list('orders','#admin-orders','#order-filter',data=> {state.orders=data.orders;$('#admin-orders').innerHTML=data.orders.length?data.orders.map(o=>orderDetails(o,true)).join(''):'<p>Tidak ada pesanan sesuai pencarian.</p>';pager('orders',data.total,data.orders.length,orders);}); }
  function customers() { return list('customers','#customers','#customer-filter',data=> {state.customers=data.customers;$('#customers').innerHTML=data.customers.length?table(['Pelanggan','Email','Terdaftar','Pesanan'],data.customers.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(c.email)+'</td><td>'+esc(date(c.createdAt))+'</td><td>'+esc(c.orderCount)+' <button class="primary-btn" type="button" data-customer="'+esc(c.id)+'">Riwayat</button></td></tr>')):'<p>Tidak ada pelanggan sesuai pencarian.</p>';pager('customers',data.total,data.customers.length,customers);}); }
  function history() { return list('history','#customer-history',null,data=> {$('#customer-history').innerHTML='<h3>Riwayat '+esc(data.customer.name)+'</h3>'+(data.orders.length?data.orders.map(o=>orderDetails(o,false)).join(''):'<p>Belum ada pesanan.</p>');pager('history',data.total,data.orders.length,history);},'/api/admin/customers/'+encodeURIComponent(state.customerId)+'/orders'); }
  document.addEventListener('click',event=> {
    const button=event.target.closest('button'); if(!button) return;
    if(button.dataset.edit) edit(button.dataset.edit,button.dataset.id);
    if(button.dataset.delete) {
      const resource=button.dataset.delete, id=button.dataset.id;
      if(!confirm('Hapus data ini? Tindakan ini tidak dapat dibatalkan.')) return;
      busy(button,async()=> {await api('/api/admin/'+resource+'/'+encodeURIComponent(id),{method:'DELETE'});show('Data dihapus.');if(resource==='products') await Promise.all([products(),targets(),metadata(),dashboard()]);else if(resource==='promotions') await promotions();else await metadata();});
    }
    if(button.dataset.payment) busy(button,async()=> {await api('/api/admin/orders/'+encodeURIComponent(button.dataset.payment)+'/payment');show('Status pembayaran diperbarui dari server.');await Promise.all([orders(),dashboard()]);});
    if(button.dataset.customer) {state.customerId=button.dataset.customer;state.offsets.history=0;history();}
  });
  document.addEventListener('submit',event=> {
    const form=event.target;
    if(form.matches('.fulfillment')) {event.preventDefault();busy(form,async()=> {const body={status:form.dataset.next};if(form.elements.carrier) {body.carrier=form.elements.carrier.value.trim();body.trackingNumber=form.elements.trackingNumber.value.trim();}await api('/api/admin/orders/'+encodeURIComponent(form.dataset.id),{method:'PATCH',body:JSON.stringify(body)});show('Pemenuhan pesanan diperbarui.');await Promise.all([orders(),dashboard()]);});}
    if(form.matches('.reconcile')) {event.preventDefault();busy(form,async()=> {await api('/api/admin/orders/'+encodeURIComponent(form.dataset.id)+'/payment/reconcile',{method:'POST',body:JSON.stringify({qrisId:form.elements.qrisId.value.trim(),confirmOriginalInvoice:form.elements.confirmed.checked})});show('Invoice asli telah diverifikasi.');await Promise.all([orders(),dashboard()]);});}
  });
  for(const [id,resource,load] of [['product-filter','products',products],['order-filter','orders',orders],['customer-filter','customers',customers]]) $('#'+id).onsubmit=event=> {event.preventDefault();state.offsets[resource]=0;load();};
  $('#refresh-dashboard').onclick=dashboard;
  async function initializeMetadata() {
    const forms=[$('#product-form'),$('#promotion-form')];
    forms.forEach(form=> {form.querySelector('[type=submit]').disabled=true;});
    try {await Promise.all([metadata(),targets()]);await promotions();forms.forEach(form=> {form.querySelector('[type=submit]').disabled=false;});}
    catch(error) {show(error.message,true);$('#promotions').innerHTML='<p class="error">Data kategori, merek, atau target gagal dimuat.</p><button type="button" class="primary-btn">Coba lagi</button>';$('#promotions button').onclick=initializeMetadata;}
  }
  dashboard();products();orders();customers();initializeMetadata();
})();
