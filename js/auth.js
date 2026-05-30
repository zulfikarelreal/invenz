// ===== AUTH.JS — Multi-Role Guard (v3) =====
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
      "expired_items",
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
      "expired_items",
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
      "expired_items",
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
      "expired_items",
    ],
  };

  // ── 5. Mapping halaman → permission ──
  const PAGE_GUARDS = {
    "dashboard.html": "dashboard",
    "inputBarang.html": "input_barang",
    "globalStok.html": "global_stok_read",
    "stockOut.html": "stock_out",
    "linkedData.html": "linked_data_read",
    "laporan.html": "laporan",
    "userManagement.html": "user_management",
    "settings.html": "settings",
    "barangKadaluarsa.html": "expired_items",
  };

  // ── 6. Expose helper global ──
  window.INVENZ = window.INVENZ || {};

  window.INVENZ.user = loggedUser;
  window.INVENZ.role = loggedRole;

  window.INVENZ.can = function (permission) {
    const perms = PERMISSIONS[loggedRole] || [];
    return perms.includes(permission);
  };

  // ── 7. ACCESS DENIED PAGE GUARD ──
  function showAccessDenied() {
    document.body.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        width:100%;
        align-items:center;
        justify-content:center;
        background:#0f172a;
        color:white;
        font-family:Arial,sans-serif;
        padding:20px;
      ">
        <div style="
          text-align:center;
          max-width:500px;
        ">
          <h1 style="
            font-size:64px;
            margin-bottom:10px;
            color:#ef4444;
          ">
            ACCESS DENIED
          </h1>

          <p style="
            font-size:18px;
            color:#cbd5e1;
            margin-bottom:25px;
          ">
            Anda tidak memiliki wewenang untuk mengakses halaman ini.
          </p>

          <button id="backDashboardBtn" style="
            padding:12px 20px;
            border:none;
            border-radius:10px;
            background:#3b82f6;
            color:white;
            cursor:pointer;
            font-size:16px;
          ">
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    `;

    const btn = document.getElementById("backDashboardBtn");

    if (btn) {
      btn.addEventListener("click", () => {
        window.location.href = "dashboard.html";
      });
    }
  }

  // ── 8. Auto guard current page ──
  function protectCurrentPage() {
    const currentPage = window.location.pathname.split("/").pop();

    const requiredPermission = PAGE_GUARDS[currentPage];

    if (!requiredPermission) return;

    if (!window.INVENZ.can(requiredPermission)) {
      showAccessDenied();

      // hentikan loading page
      document.body.style.pointerEvents = "none";

      // aktifkan lagi tombol access denied
      setTimeout(() => {
        const btn = document.getElementById("backDashboardBtn");
        if (btn) btn.style.pointerEvents = "auto";
      }, 0);

      return;
    }
  }

  protectCurrentPage();

  // ── 9. Helper require manual ──
  window.INVENZ.require = function (permission, redirect) {
    if (!window.INVENZ.can(permission)) {
      if (redirect) {
        window.location.href = redirect;
      } else {
        showAccessDenied();
      }

      return false;
    }

    return true;
  };

  // ── 10. Visibility Handler ──
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

    _applyMenuGuards();
  };

  // ── 11. Sidebar Menu Guard ──
  function _applyMenuGuards() {
    const menuGuards = {
      "inputBarang.html": "input_barang",
      "globalStok.html": "global_stok_read",
      "stockOut.html": "stock_out",
      "linkedData.html": "linked_data_read",
      "laporan.html": "laporan",
      "userManagement.html": "user_management",
      "settings.html": "settings",
    };

    document.querySelectorAll(".sidebar-menu li a").forEach((link) => {
      const href = link.getAttribute("href") || "";

      const filename = href.split("/").pop().split("?")[0];

      if (menuGuards[filename]) {
        if (!window.INVENZ.can(menuGuards[filename])) {
          const li = link.closest("li");

          if (li) {
            li.style.display = "none";
          }
        }
      }
    });
  }

  // ── 12. Init ──
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      window.INVENZ.applyVisibility,
    );
  } else {
    window.INVENZ.applyVisibility();
  }

  // ── 13. Logout ──
  window.INVENZ.logout = function () {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("loggedRole");

    window.location.href = "login.html";
  };
})();
