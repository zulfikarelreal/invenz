// ===== AUTH.JS — Multi-Role Guard =====
// Jalankan di SETIAP halaman sebagai script pertama.
// Contoh pemakaian di atas tag </body>:
//   <script src="js/auth.js"></script>

(function () {
  // ── 1. Pastikan ada sesi aktif ──
  if (!localStorage.getItem("isLoggedIn")) {
    window.location.href = "login.html";
    return;
  }

  // ── 2. Ambil info user aktif ──
  const loggedUser = localStorage.getItem("loggedUser") || "Admin";
  const loggedRole = localStorage.getItem("loggedRole") || "admin";

  // ── 3. Cek akun masih aktif di daftar users ──
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem("invenz_users") || "[]");
    } catch {
      return [];
    }
  }

  const users = getUsers();
  // Selain akun bawaan "admin", cek aktif/nonaktif
  if (users.length > 0) {
    const me = users.find((u) => u.username === loggedUser);
    if (me && me.aktif === false) {
      // Akun dinonaktifkan, paksa logout
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("loggedUser");
      localStorage.removeItem("loggedRole");
      window.location.href = "login.html";
      return;
    }
  }

  // ── 4. Expose helper global ──
  window.INVENZ = window.INVENZ || {};
  window.INVENZ.user = loggedUser;
  window.INVENZ.role = loggedRole;

  /**
   * Cek apakah role aktif punya permission.
   * @param {string} permission
   * @returns {boolean}
   */
  window.INVENZ.can = function (permission) {
    const matrix = {
      admin: [
        "dashboard",
        "input_barang",
        "global_stok",
        "stock_out",
        "linked_data",
        "laporan",
        "user_management",
        "settings",
      ],
      kasir: [
        "dashboard",
        "global_stok_read",
        "stock_out",
        "laporan",
        "linked_data_read",
      ],
      gudang: ["dashboard", "input_barang", "global_stok", "linked_data_read"],
    };
    const perms = matrix[loggedRole] || [];
    return perms.includes(permission);
  };

  /**
   * Redirect ke halaman tertentu jika tidak punya akses.
   * @param {string} permission
   * @param {string} [redirect="dashboard.html"]
   */
  window.INVENZ.require = function (permission, redirect) {
    if (!window.INVENZ.can(permission)) {
      window.location.href = redirect || "dashboard.html";
    }
  };

  /**
   * Sembunyikan semua elemen dengan atribut data-require="<permission>"
   * jika user tidak punya permission tersebut.
   */
  window.INVENZ.applyVisibility = function () {
    document.querySelectorAll("[data-require]").forEach((el) => {
      const perm = el.getAttribute("data-require");
      if (!window.INVENZ.can(perm)) {
        el.style.display = "none";
      }
    });
    // Juga isi semua elemen data-username / data-role
    document.querySelectorAll("[data-bind-user]").forEach((el) => {
      el.textContent = loggedUser;
    });
    document.querySelectorAll("[data-bind-role]").forEach((el) => {
      const labels = {
        admin: "Administrator",
        kasir: "Kasir",
        gudang: "Staf Gudang",
      };
      el.textContent = labels[loggedRole] || loggedRole;
    });
  };

  // Auto-apply setelah DOM siap
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      window.INVENZ.applyVisibility,
    );
  } else {
    window.INVENZ.applyVisibility();
  }

  // ── 5. Pasang logout global ──
  window.INVENZ.logout = function () {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("loggedRole");
    window.location.href = "login.html";
  };
})();
