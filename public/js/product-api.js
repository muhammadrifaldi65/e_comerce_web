(function () {
  'use strict';
  const money = n => 'Rp '+new Intl.NumberFormat('id-ID').format(n);
  document.addEventListener('DOMContentLoaded', async () => {
    const details=document.querySelector('.product-details'), id=new URLSearchParams(location.search).get('id');
    const button=details.querySelector('.add-to-cart-btn'); button.disabled=true;
    const fail=text=>{details.querySelector('.product-name').textContent=text;details.querySelector(':scope > p').textContent='Pilih produk dari katalog untuk melihat detail yang tersedia.';};
    if(!id){fail('Produk belum dipilih');return;}
    try{
      const response=await fetch('/api/products/'+encodeURIComponent(id));if(!response.ok)throw Error('Produk tidak ditemukan');
      const {product:p}=await response.json();
      document.title=p.name+' | Falstore';
      document.querySelectorAll('#product-main-img img, #product-imgs img').forEach(image=>{image.src=p.image;image.alt=p.name;});
      details.querySelector('.product-name').textContent=p.name;
      details.querySelector('.product-price').textContent=money(p.price);
      const comparison=Math.max(p.basePrice || 0,p.oldPrice || 0);
      if(comparison>p.price){const del=document.createElement('del');del.className='product-old-price';del.textContent=money(comparison);details.querySelector('.product-price').append(' ',del);}
      details.querySelector(':scope > p').textContent=p.description;
      details.querySelector('.product-available').textContent=p.stock>0?'Tersedia ('+p.stock+')':'Stok habis';
      const qty=details.querySelector('input[type="number"]');qty.min='1';qty.max=String(Math.min(99,p.stock));qty.value='1';qty.setAttribute('aria-label','Jumlah produk');
      button.disabled=p.stock<=0;button.onclick=()=>{if(qty.checkValidity())window.FalstoreCartAdd(p,Number(qty.value));else qty.reportValidity();};
      details.querySelector('.add-to-wishlist').onclick=e=>{e.preventDefault();window.FalstoreWishlistAdd(p);};
      details.querySelector('.product-options').remove();
      details.querySelectorAll('.product-rating,.review-link').forEach(el=>el.remove());
      details.querySelector('.fa-exchange')?.closest('li').remove();
      const links=details.querySelectorAll('.product-links');
      if(links[0]){links[0].textContent='Kategori: ';const link=document.createElement('a');link.href='store.html?categoryId='+p.categoryId;link.textContent=p.categoryName;links[0].append(link);if(p.brandName)links[0].append(' · Merek: '+p.brandName);}
      links[1]?.remove();
      document.querySelector('#tab1 p').textContent=p.description;
      document.querySelector('#tab2 p').textContent=`Kategori: ${p.categoryName}.${p.brandName ? ' Merek: '+p.brandName+'.' : ''} Stok tersedia: ${p.stock}.`;
      document.querySelector('[href="#tab3"]')?.closest('li').remove();document.querySelector('#tab3')?.remove();
    }catch(error){fail(error.message);}
  });
})();
