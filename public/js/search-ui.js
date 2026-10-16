(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  document.addEventListener('DOMContentLoaded', async () => {
    const section=document.querySelector('#hot-deal');if(!section)return;
    let promotions=[];
    const render=()=>{
      const now=Date.now(), active=promotions.filter(p=>new Date(p.startsAt).getTime()<=now && now<new Date(p.endsAt).getTime());
      section.hidden=!active.length;
      section.querySelectorAll('[data-promotion-id]').forEach(banner=>{
        const promo=active.find(p=>String(p.id)===banner.dataset.promotionId);banner.hidden=!promo;if(!promo)return;
        let seconds=Math.max(0,Math.floor((new Date(promo.endsAt).getTime()-now)/1000));
        const values=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];
        banner.querySelectorAll('.hot-deal-countdown h3').forEach((el,index)=>{el.textContent=String(values[index]).padStart(2,'0');});
      });
    };
    async function refresh() { try {
      const response=await fetch('/api/promotions');if(!response.ok)throw Error('Promo gagal dimuat.');
      ({promotions}=await response.json());
      section.querySelector('.row').innerHTML=promotions.map(p=>`<div class="col-md-12" data-promotion-id="${p.id}"><div class="hot-deal">${p.image ? `<img class="promotion-image" src="${esc(p.image)}" alt="">` : ''}<ul class="hot-deal-countdown" aria-label="Waktu tersisa">${['Hari','Jam','Menit','Detik'].map(label=>`<li><div><h3>00</h3><span>${label}</span></div></li>`).join('')}</ul><h2 class="text-uppercase">${esc(p.title)}</h2><p>${esc(p.description)}</p><a class="primary-btn cta-btn" href="${esc(p.link || 'store.html')}">Belanja sekarang</a></div></div>`).join('');
      render();
    } catch {promotions=[];section.hidden=true;} }
    refresh();
    const timer=setInterval(render,1000), refreshTimer=setInterval(()=>{if(!document.hidden)refresh();},30000);
    window.addEventListener('focus',refresh);
    window.addEventListener('pagehide',()=>{clearInterval(timer);clearInterval(refreshTimer);});
  });
  document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(location.search);
    const categoryLists = [...document.querySelectorAll('.main-nav, .section-tab-nav')];
    document.querySelectorAll('.footer-title').forEach(title => {
      if (/^(Categories|Kategori)$/.test(title.textContent.trim())) categoryLists.push(title.nextElementSibling);
    });
    categoryLists.forEach(list => { list.textContent = 'Memuat kategori…'; });
    const filters = document.querySelectorAll('#aside .checkbox-filter');
    filters.forEach(filter => { filter.textContent = 'Memuat pilihan…'; });
    document.querySelectorAll('.header-search form').forEach(form => {
      const select = form.querySelector('select'), input = form.querySelector('input'), button = form.querySelector('.search-btn');
      if (select) { select.innerHTML = '<option value="">Semua Kategori</option>'; select.setAttribute('aria-label','Pilih kategori produk'); }
      if (input) { input.type='search'; input.name='q'; input.value=params.get('q') || ''; input.setAttribute('aria-label','Cari produk'); }
      if (button) button.type='submit';
      form.classList.add('falstore-search-form');
    });
    try {
      const response = await fetch('/api/catalog/meta');
      if (!response.ok) throw Error('Kategori dan merek gagal dimuat. Muat ulang halaman.');
      const {categories, brands} = await response.json();
      const links = categories.map(c => `<li><a href="store.html?categoryId=${c.id}">${esc(c.name)} <small>(${c.productCount})</small></a></li>`).join('');
      categoryLists.forEach(list => { list.innerHTML = (list.classList.contains('main-nav') ? '<li><a href="index.html">Beranda</a></li><li><a href="store.html">Semua Produk</a></li>' : '') + links; });
      document.querySelectorAll('.header-search select').forEach(select => {
        select.innerHTML += categories.map(c => `<option value="${esc(c.slug)}">${esc(c.name)} (${c.productCount})</option>`).join('');
        select.value = categories.find(c => String(c.id) === params.get('categoryId'))?.slug || params.get('kategori') || params.get('category') || '';
      });
      [categories, brands].forEach((items, index) => {
        const target = filters[index]; if (!target) return;
        const key = index ? 'brandId' : 'categoryId';
        target.innerHTML = items.map(item => `<div class="input-checkbox"><input type="checkbox" id="${key}-${item.id}" value="${item.id}" ${params.get(key) === String(item.id) || (!index && [params.get('kategori'),params.get('category')].includes(item.slug)) ? 'checked' : ''}><label for="${key}-${item.id}"><span></span>${esc(item.name)} <small>(${item.productCount})</small></label></div>`).join('') || '<p>Belum tersedia.</p>';
        target.querySelectorAll('input').forEach(input => input.addEventListener('change', () => {
          params.delete('offset');
          if (!index) {params.delete('kategori');params.delete('category');}
          if (input.checked) params.set(key,input.value); else params.delete(key);
          location.href='store.html?'+params.toString();
        }));
      });
      document.querySelectorAll('.shop').forEach((shop,index) => {
        const category=categories[index]; shop.hidden=!category;
        if (category) {shop.querySelector('h3').textContent='Koleksi '+category.name;shop.querySelector('a').href='store.html?categoryId='+category.id;}
      });
    } catch(error) {
      categoryLists.forEach(list => {list.innerHTML='<li><a href="store.html">Semua Produk</a></li>';});
      filters.forEach(filter => {filter.textContent=error.message;});
      document.querySelectorAll('.shop').forEach(shop=>{shop.hidden=true;});
    }
  });
})();
