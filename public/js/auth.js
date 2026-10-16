(function () {
  "use strict";

  const tokenKey = "falstore-token";
  const userKey = "falstore-user";
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api = (path, options = {}) =>
    fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Permintaan gagal.");
      return payload;
    });

  window.FalstoreAuth = {
    get token() {
      return localStorage.getItem(tokenKey);
    },
    get user() {
      try { return JSON.parse(localStorage.getItem(userKey) || 'null'); } catch { return null; }
    },
    setSession(payload) {
      for (const name of ['cart','wishlist']) {
        const guestKey = 'falstore-'+name+':guest', userKey = 'falstore-'+name+':user-'+payload.user.id;
        try {
          const guest = JSON.parse(localStorage.getItem(guestKey) || '[]'), existing = JSON.parse(localStorage.getItem(userKey) || '[]');
          for (const item of guest) if (!existing.some(p => String(p.id) === String(item.id))) existing.push(item);
          localStorage.setItem(userKey, JSON.stringify(existing)); localStorage.removeItem(guestKey);
        } catch {}
      }
      localStorage.setItem(tokenKey, payload.token);
      localStorage.setItem(userKey, JSON.stringify(payload.user));
    },
    clear() {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
    },
    request(path, options = {}) {
      return api(path, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
      });
    },
  };

  const notice = (text) => {
    let el = document.querySelector(".falstore-auth-notice");
    if (!el) {
      el = document.createElement("p");
      el.className = "falstore-auth-notice";
      document.querySelector("main")?.prepend(el);
    }
    el.textContent = text;
  };
  const redirectFor = (user) => {
    window.location.href =
      user.role === "admin" ? "admin.html" : "account.html";
  };

  document.addEventListener("DOMContentLoaded", () => {
    const login = document.querySelector("#login-form");
    const register = document.querySelector("#register-form");
    const profile = document.querySelector("#account-profile");
    const current = FalstoreAuth.user;
    if (profile && current) {
      profile.innerHTML = `<h3 class="title">Halo, ${esc(current.name)}</h3><p>${esc(current.email)}</p>${current.role === 'admin' ? '<p><a href="admin.html">Buka dashboard admin</a></p>' : ''}<button id="logout-btn" class="primary-btn">Keluar</button><hr><h3>Riwayat pesanan</h3><button id="refresh-orders" class="primary-btn" type="button">Perbarui</button><div id="account-orders" aria-live="polite" style="margin-top:20px"></div>`;
      login.closest('.col-md-6').hidden = true;
      register.closest('.col-md-6').hidden = true;
      const loadOrders = async () => {
        const target = profile.querySelector('#account-orders'), refresh = profile.querySelector('#refresh-orders');
        refresh.disabled = true;
        try {
          const {orders} = await FalstoreAuth.request('/api/orders');
          const labels = {pending:'Menunggu pembayaran',paid:'Lunas',processing:'Diproses',shipped:'Dikirim',completed:'Selesai',expired:'Kedaluwarsa',unknown:'Perlu pemeriksaan'};
          target.innerHTML = orders.length ? orders.map(order => `<article style="border-top:1px solid #ddd;padding:20px 0"><h4>Pesanan #${esc(order.orderId)} — ${esc(labels[order.status] || order.status)}</h4><p>${esc(new Date(order.createdAt).toLocaleString('id-ID'))} | Rp ${new Intl.NumberFormat('id-ID').format(order.total)}</p><ul>${order.items.map(p => `<li>${esc(p.quantity)} × ${esc(p.name)}</li>`).join('')}</ul><p>Pembayaran: ${esc(labels[order.payment?.status] || order.payment?.status || 'Belum tersedia')}</p><a class="primary-btn" href="checkout.html?order=${encodeURIComponent(order.orderId)}">Detail pembayaran</a></article>`).join('') : '<p>Belum ada pesanan. <a href="store.html">Mulai belanja</a>.</p>';
        } catch (error) { target.textContent = error.message; }
        finally { refresh.disabled = false; }
      };
      profile.querySelector('#refresh-orders').onclick = loadOrders;
      loadOrders();
      profile.querySelector("#logout-btn").onclick = () => {
        FalstoreAuth.clear();
        window.location.reload();
      };
    } else if (profile) {
      profile.innerHTML =
        "<p>Belum masuk. Silakan gunakan formulir di samping.</p>";
    }
    login?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(login));
      try {
        const payload = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(data),
        });
        FalstoreAuth.setSession(payload);
        redirectFor(payload.user);
      } catch (error) {
        notice(error.message);
      }
    });
    register?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(register));
      try {
        const payload = await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });
        FalstoreAuth.setSession(payload);
        window.location.href = "account.html";
      } catch (error) {
        notice(error.message);
      }
    });
  });
})();
