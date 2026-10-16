(function () {
  'use strict';
  const money = value => 'Rp '+new Intl.NumberFormat('id-ID').format(Number(value)||0);
  const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  document.addEventListener('DOMContentLoaded', () => {
    const box = document.querySelector('.order-details'), button = document.querySelector('.order-submit');
    const message = document.createElement('p'); message.setAttribute('role','alert'); box.prepend(message);
    const panel = document.createElement('section'); panel.setAttribute('aria-live','polite'); box.append(panel);
    panel.id = 'order-payment'; panel.tabIndex = -1;
    let paymentShown = false;
    const token = localStorage.getItem('falstore-token');
    let user; try { user = JSON.parse(localStorage.getItem('falstore-user')||'null'); } catch {}
    const storageKey = 'falstore-checkout-request:'+ (user?.id || 'guest');
    let orderId = new URLSearchParams(location.search).get('order'), timer, busy = false;
    let cart = window.FalstoreStorage?.getCart() || [];
    const scope=window.FalstoreStorage.getScope();
    const sameAccount=()=>scope===window.FalstoreStorage.getScope() && token===localStorage.getItem('falstore-token');
    const cartSnapshot=items=>JSON.stringify(items.map(p=>[String(p.id),Number(p.qty)]).sort((a,b)=>a[0].localeCompare(b[0])));
    let quotedSnapshot='';
    let quoteBusy=false, quoteReady=false;
    document.querySelector('.order-products').textContent='Memuat harga terbaru…';
    document.querySelector('.order-total').textContent='—';
    async function refreshQuote() {
      if(orderId || busy || quoteBusy) return;
      quoteBusy=true;quoteReady=false;button.setAttribute('aria-disabled','true');
      try {
        if(!sameAccount())throw Error('Akun berubah. Muat ulang halaman sebelum melanjutkan.');
        cart=window.FalstoreStorage?.getCart() || [];
        const snapshot=cartSnapshot(cart);
        const quote=cart.length ? await api('/api/cart/quote',{method:'POST',body:JSON.stringify({items:cart.map(p=>({id:Number(p.id),quantity:Number(p.qty)}))})}) : {items:[],total:0};
        if(orderId) return;
        if(!sameAccount() || snapshot!==cartSnapshot(window.FalstoreStorage.getCart()))throw Error('Keranjang atau akun berubah. Perbarui pesanan sebelum melanjutkan.');
        quotedSnapshot=snapshot;
        document.querySelector('.order-products').innerHTML=quote.items.length ? quote.items.map(p=>`<div class="order-col"><div>${esc(p.quantity)} × ${esc(p.name)}</div><div>${money(p.lineTotal)}</div></div>`).join('') : '<p>Keranjang kosong. <a href="store.html">Lihat produk</a>.</p>';
        document.querySelector('.order-total').textContent=money(quote.total);quoteReady=true;message.textContent='Harga diperbarui. Total akhir ditentukan saat pesanan dibuat.';
      } catch(error) {message.textContent=error.message;}
      finally {quoteBusy=false;if(quoteReady)button.removeAttribute('aria-disabled');}
    }
    const quoteTimer=setInterval(()=>{if(!document.hidden)refreshQuote();},30000);
    window.addEventListener('focus',refreshQuote);
    window.addEventListener('storage',()=>{if(!orderId){quoteReady=false;button.setAttribute('aria-disabled','true');refreshQuote();}});
    window.addEventListener('pagehide',()=>clearInterval(quoteTimer));
    document.querySelector('.payment-method').innerHTML = '<div class="input-radio"><input type="radio" name="payment" id="qris" checked><label for="qris"><span></span>QRIS</label><p>Bayar sesuai total pesanan. Biaya gateway tidak ditambahkan ke tagihan Anda. Maksimum Rp10.000.000.</p></div>';
    document.querySelector('label[for="terms"]').innerHTML = '<span></span>Saya telah memeriksa pesanan dan alamat pengiriman.';
    document.querySelector('#create-account')?.closest('.form-group')?.remove();
    document.querySelector('.shiping-details')?.remove();
    document.querySelectorAll('.billing-details input').forEach(input => { input.required = input.name !== 'last-name'; input.setAttribute('aria-label', input.placeholder || input.name); });
    const country = document.querySelector('[name="country"]'); if (country) country.value = 'Indonesia';
    if (user) { document.querySelector('[name="email"]').value = user.email || ''; document.querySelector('[name="first-name"]').value = user.name || ''; }
    async function api(path, options={}) {
      const response = await fetch(path,{...options,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token}});
      const data = await response.json().catch(()=>({}));
      if (!response.ok) { const e = new Error(data.error || 'Permintaan gagal. Periksa kembali pesanan Anda.'); e.data=data; e.status=response.status; throw e; } return data;
    }
    function render(order) {
      orderId=order.orderId; const p=order.payment || {}, paid=p.status==='paid';
      const expired=p.status==='expired' || (p.expiresAt && new Date(p.expiresAt).getTime()<=Date.now());
      const labels={pending:'Menunggu pembayaran',paid:'Pembayaran terverifikasi',processing:'Sedang diproses',shipped:'Dikirim',completed:'Selesai',expired:'QRIS kedaluwarsa',unknown:'Status belum dapat dipastikan'};
      document.querySelector('.order-total').textContent=money(order.total);
      if (order.items) document.querySelector('.order-products').innerHTML = order.items.map(item => `<div class="order-col"><div>${esc(item.quantity)} × ${esc(item.name)}</div><div>${money(item.price * item.quantity)}</div></div>`).join('');
      document.querySelectorAll('.billing-details input').forEach(input => { input.disabled = true; });
      const shipping = {'first-name':order.customerName,'last-name':'',email:order.email,address:order.address,city:order.city,country:order.country,'zip-code':order.zipCode,tel:order.telephone};
      for (const [name,value] of Object.entries(shipping)) { const input = document.querySelector(`.billing-details [name="${name}"]`); if(input) input.value = value || ''; }
      button.hidden=true; document.querySelector('.payment-method').hidden=true; document.querySelector('#terms').closest('.input-checkbox').hidden=true;
      button.style.display='none';
      panel.innerHTML=`<hr><h3>Pesanan #${esc(orderId)}</h3><p><strong>${esc(labels[paid ? order.status : expired ? 'expired' : p.status] || order.status)}</strong></p><h3>${money(order.total)}</h3>${!paid && !expired && p.status==='pending' && (p.qrImageUrl || p.qrUrl) ? `<img id="payment-qr" src="${esc(p.qrImageUrl || p.qrUrl)}" alt="Kode QRIS pesanan ${esc(orderId)}" style="display:block;max-width:100%;width:280px;margin:16px auto"><p>Pindai menggunakan aplikasi bank atau dompet digital.</p>` : ''}${p.expiresAt ? `<p>Berlaku sampai ${esc(new Date(p.expiresAt).toLocaleString('id-ID'))}</p>` : ''}${!paid && (expired || p.status==='unknown') ? '<p>Jangan membayar ulang atau membuat pesanan pengganti sebelum status dipastikan. Pembayaran terlambat perlu diperiksa; stok tidak dilepas otomatis.</p>' : ''}<p id="payment-check-message" role="status"></p>${!paid ? '<button type="button" class="primary-btn" id="check-payment">Periksa status</button>' : ''}<p style="margin-top:15px"><a href="account.html">Lihat riwayat pesanan</a></p>`;
      const image=panel.querySelector('#payment-qr'); if(image) image.onerror=()=>{image.hidden=true;panel.querySelector('#payment-check-message').textContent='Gambar QRIS tidak tersedia atau sudah tidak aktif. Periksa status pesanan.';};
      panel.querySelector('#check-payment')?.addEventListener('click',poll);
      if (!paymentShown) {
        paymentShown = true;
        panel.focus({preventScroll:true});
        panel.scrollIntoView({block:'start'});
      }
      clearTimeout(timer); if(!paid && !expired && p.status==='pending') timer=setTimeout(poll,16000);
    }
    async function poll() {
      if(busy || !orderId) return; busy=true; clearTimeout(timer);
      const check=panel.querySelector('#check-payment'); if(check) check.disabled=true;
      try { render(await api('/api/orders/'+encodeURIComponent(orderId)+'/payment')); message.textContent=''; }
      catch(e) { message.textContent=e.message; timer=setTimeout(poll,30000); }
      finally {busy=false; const check=panel.querySelector('#check-payment'); if(check)check.disabled=false;}
    }
    window.addEventListener('pagehide',()=>clearTimeout(timer));
    button.addEventListener('click', async event => {
      event.preventDefault(); if(busy)return;
      if(!sameAccount()){quoteReady=false;message.textContent='Akun berubah. Muat ulang halaman sebelum melanjutkan.';return;}
      if(quotedSnapshot!==cartSnapshot(window.FalstoreStorage.getCart())){quoteReady=false;refreshQuote();message.textContent='Keranjang berubah. Periksa kembali ringkasan pesanan.';return;}
      if(!quoteReady || quoteBusy){message.textContent='Tunggu pembaruan harga dan stok sebelum melanjutkan.';refreshQuote();return;}
      if(!token){message.innerHTML='Silakan <a href="account.html">masuk atau daftar</a> sebelum membuat pesanan. Keranjang tetap tersimpan.';return;}
      if(!cart.length){message.textContent='Keranjang masih kosong.';return;}
      const invalid=[...document.querySelectorAll('.billing-details input')].find(input=>!input.checkValidity()); if(invalid){invalid.reportValidity();return;}
      if(!document.querySelector('#terms').checked){message.textContent='Periksa alamat dan centang persetujuan pesanan.';return;}
      const value=name=>document.querySelector(`.billing-details [name="${name}"]`)?.value.trim() || '';
      let requestId=localStorage.getItem(storageKey); if(!requestId){requestId=crypto.randomUUID();localStorage.setItem(storageKey,requestId);}
      const body={requestId,customerName:(value('first-name')+' '+value('last-name')).trim(),email:value('email'),address:value('address'),city:value('city'),country:value('country'),zipCode:value('zip-code'),telephone:value('tel'),notes:document.querySelector('.order-notes textarea')?.value || '',paymentMethod:'qris',items:cart.map(p=>({id:Number(p.id),quantity:Number(p.qty)}))};
      busy=true;button.setAttribute('aria-disabled','true');message.textContent='Membuat pesanan. Jangan tutup halaman…';
      try { const order=await api('/api/orders',{method:'POST',body:JSON.stringify(body)}); if(!sameAccount()){message.textContent='Pesanan tersimpan pada akun sebelumnya. Muat ulang dan buka riwayat akun tersebut.';return;} window.FalstoreStorage.removePurchased(body.items,scope); localStorage.removeItem(storageKey); history.replaceState(null,'','checkout.html?order='+encodeURIComponent(order.orderId)); render(order); message.textContent='Pesanan tersimpan. Pembayaran belum selesai sampai terverifikasi.'; }
      catch(e){ message.textContent=e.message+' Pesanan tidak akan ditandai lunas dari halaman ini. Periksa riwayat pesanan sebelum mencoba kembali.'; if(sameAccount() && e.data?.orderId){orderId=e.data.orderId;history.replaceState(null,'','checkout.html?order='+encodeURIComponent(orderId));timer=setTimeout(poll,1000);} }
      finally{busy=false;button.removeAttribute('aria-disabled');}
    });
    if(orderId){button.hidden=true;if(!token)message.innerHTML='Silakan <a href="account.html">masuk</a> untuk membuka pembayaran ini.';else poll();}
    else refreshQuote();
  });
})();
