(function () {
  "use strict";

  const tokenKey = "falstore-token";
  const userKey = "falstore-user";
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
      return JSON.parse(localStorage.getItem(userKey) || "null");
    },
    setSession(payload) {
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
      profile.innerHTML = `<h3 class="title">Halo, ${current.name}</h3><p>${current.email}</p><p>Role: ${current.role}</p><button id="logout-btn" class="primary-btn">Keluar</button>`;
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
