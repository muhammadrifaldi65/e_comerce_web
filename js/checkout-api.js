(function () {
  'use strict';
  const money = amount => 'Rp ' + new Intl.NumberFormat('id-ID').format(Number(amount) || 0);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const cart = () => JSON.parse(localStorage.getItem('falstore-cart') || '[]');
  const renderOrder = () => {
    const items = cart();
    const target = document.querySelector('.order-products');
    const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
    if (target) target.innerHTML = items.length ? items.map(item => `<div class="order-col"><div>${escapeHtml(item.qty)}x ${escapeHtml(item.name)}</div><div>${money(Number(item.price) * Number(item.qty))}</div></div>`).join('') : '<div class="order-col"><div>Keranjang kosong</div><div>' + money(0) + '</div></div>';
    const totalElement = document.querySelector('.order-total');
    if (totalElement) totalElement.textContent = money(total);
  };
  document.addEventListener('DOMContentLoaded', () => {
    renderOrder();
    document.querySelectorAll('.order-submit').forEach(button => { button.addEventListener('click', async event => {
      if (!location.pathname.endsWith('checkout.html')) return;
      event.preventDefault();
      const token = localStorage.getItem('falstore-token');
      const itemsInCart = cart();
      if (!token) { alert('Silakan masuk ke akun customer sebelum membuat pesanan.'); location.href = 'account.html'; return; }
      const value = name => document.querySelector(`.billing-details [name="${name}"]`)?.value.trim() || '';
      const payment = document.querySelector('input[name="payment"]:checked');
      const terms = document.querySelector('#terms:checked');
      if (!itemsInCart.length || !payment || !terms) return;
      const items = itemsInCart.map(item => ({ id: Number(item.id), quantity: Number(item.qty) })).filter(item => Number.isInteger(item.id) && item.id > 0);
      if (items.length !== itemsInCart.length) { alert('Keranjang berisi produk lama. Silakan tambahkan ulang produk dari katalog.'); return; }
      try {
        const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ customerName: `${value('first-name')} ${value('last-name')}`.trim(), email: value('email'), address: value('address'), city: value('city'), country: value('country'), zipCode: value('zip-code'), telephone: value('tel'), paymentMethod: payment.id, notes: document.querySelector('.order-notes textarea')?.value || '', items }) });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || 'Pesanan gagal dibuat.');
        localStorage.removeItem('falstore-cart');
        alert(`Pesanan #${result.orderId} berhasil dibuat.`);
        location.href = 'account.html';
      } catch (error) { alert(error.message); }
    }, { capture: true }); });
  });
}());
