// ===== AUTH.JS — Multi-Role Guard (v2) =====
// 5 Roles: owner, admin, kepala_toko, kasir, gudang
// Jalankan di SETIAP halaman sebagai script pertama.

(function () {
  // ── 1. Pastikan ada sesi aktif ──
  if (!localStorage.getItem("isLoggedIn")) {
    window.location.href = "login.html";
    return;
  }

  // ── 2. Ambil info user aktif ──
  const loggedUser = localStorage.getItem("loggedUser") || "Admin";
  const loggedRole = localStorage.getItem("loggedRole") || "owner";

  // ── 3. Cek akun masih aktif di daftar users ──
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem("invenz_users") || "[]");
    } catch {
      return [];
    }
  }

  const users = getUsers();
  if (users.length > 0) {
    const me = users.find(
      (u) => u.username.toLowerCase() === loggedUser.toLowerCase(),
    );
    if (me && me.aktif === false) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("loggedUser");
      localStorage.removeItem("loggedRole");
      window.location.href = "login.html";
      return;
    }
  }

  // ── 4. Permission Matrix ──
  //
  // owner       : Pemilik — akses penuh absolut
  // admin       : Administrator sistem — akses penuh (akun contoh, tidak untuk kerja harian)
  // kepala_toko : Manajer toko — akses penuh operasional + laporan, tanpa user management
  // kasir       : Staf penjualan — stock out, laporan, baca stok/linked data
  // gudang      : Staf gudang — input barang masuk, kelola stok, baca linked data

  const PERMISSIONS = {
    owner: [
      "dashboard",
      "input_barang",
      "global_stok",
      "global_stok_read",
      "stock_out",
      "linked_data",
      "linked_data_read",
      "laporan",
      "user_management",
      "settings",
    ],
    admin: [
      "dashboard",
      "input_barang",
      "global_stok",
      "global_stok_read",
      "stock_out",
      "linked_data",
      "linked_data_read",
      "laporan",
      "user_management",
      "settings",
    ],
    kepala_toko: [
      "dashboard",
      "input_barang",
      "global_stok",
      "global_stok_read",
      "stock_out",
      "linked_data",
      "linked_data_read",
      "laporan",
    ],
    kasir: [
      "dashboard",
      "global_stok_read",
      "stock_out",
      "laporan",
      "linked_data_read",
    ],
    gudang: [
      "dashboard",
      "input_barang",
      "global_stok",
      "global_stok_read",
      "linked_data_read",
    ],
  };

  // ── 5. Expose helper global ──
  window.INVENZ = window.INVENZ || {};
  window.INVENZ.user = loggedUser;
  window.INVENZ.role = loggedRole;

  window.INVENZ.can = function (permission) {
    const perms = PERMISSIONS[loggedRole] || [];
    return perms.includes(permission);
  };

  window.INVENZ.require = function (permission, redirect) {
    if (!window.INVENZ.can(permission)) {
      window.location.href = redirect || "dashboard.html";
    }
  };

  window.INVENZ.applyVisibility = function () {
    document.querySelectorAll("[data-require]").forEach((el) => {
      const perm = el.getAttribute("data-require");
      if (!window.INVENZ.can(perm)) {
        el.style.display = "none";
      }
    });

    const ROLE_LABELS = {
      owner: "Owner",
      admin: "Administrator",
      kepala_toko: "Kepala Toko",
      kasir: "Kasir",
      gudang: "Staf Gudang",
    };

    document.querySelectorAll("[data-bind-user]").forEach((el) => {
      el.textContent = loggedUser;
    });
    document.querySelectorAll("[data-bind-role]").forEach((el) => {
      el.textContent = ROLE_LABELS[loggedRole] || loggedRole;
    });

    // Sembunyikan menu sidebar yang tidak punya akses
    _applyMenuGuards();
  };

  function _applyMenuGuards() {
    const menuGuards = {
      "inputBarang.html": "input_barang",
      "globalStok.html": "global_stok_read",
      "stockOut.html": "stock_out",
      "linkedData.html": "linked_data_read",
      "laporan.html": "laporan",
      "userManagement.html": "user_management",
    };

    document.querySelectorAll(".sidebar-menu li a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const filename = href.split("/").pop().split("?")[0];
      if (menuGuards[filename]) {
        if (!window.INVENZ.can(menuGuards[filename])) {
          const li = link.closest("li");
          if (li) li.style.display = "none";
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      window.INVENZ.applyVisibility,
    );
  } else {
    window.INVENZ.applyVisibility();
  }

  window.INVENZ.logout = function () {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("loggedRole");
    window.location.href = "login.html";
  };
})();
