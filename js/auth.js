// js/auth.js
"use strict";

const ROLE_LABELS = {
  owner: "Owner",
  admin: "Administrator",
  kepala_toko: "Kepala Toko",
  kasir: "Kasir",
  gudang: "Staf Gudang",
};

const ROLE_PERMISSIONS = {
  owner: [
    "dashboard",
    "inputBarang",
    "globalStok",
    "stockOut",
    "linkedData",
    "laporan",
    "export",
    "barangKadaluarsa",
    "user_management",
  ],
  admin: [
    "dashboard",
    "inputBarang",
    "globalStok",
    "stockOut",
    "linkedData",
    "laporan",
    "export",
    "barangKadaluarsa",
    "user_management",
  ],
  kepala_toko: [
    "dashboard",
    "inputBarang",
    "globalStok",
    "stockOut",
    "linkedData",
    "laporan",
    "export",
    "barangKadaluarsa",
  ],
  kasir: [
    "dashboard",
    "globalStok",
    "stockOut",
    "linkedData",
    "laporan",
    "barangKadaluarsa",
  ],
  gudang: [
    "dashboard",
    "inputBarang",
    "globalStok",
    "linkedData",
    "barangKadaluarsa",
  ],
};

function hashPassword(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0;
  }
  return "h_" + Math.abs(h).toString(36);
}

const INVENZ = {
  get role() {
    return sessionStorage.getItem("loggedRole") || "";
  },
  get user() {
    return sessionStorage.getItem("loggedUser") || "Admin";
  },
  get isLoggedIn() {
    return sessionStorage.getItem("isLoggedIn") === "true";
  },
  can(feature) {
    const perms = ROLE_PERMISSIONS[this.role] || [];
    return perms.includes(feature);
  },
  logout() {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("loggedUser");
    sessionStorage.removeItem("loggedRole");
    window.location.href = "login.html";
  },
};
window.INVENZ = INVENZ;

// ================= ROUTE GUARD =================
const PUBLIC_PAGES = ["login.html", "index.html", ""];

// Halaman -> permission yang dibutuhkan (dipakai untuk guard & sidebar)
const PAGE_PERMISSION = {
  "dashboard.html": "dashboard",
  "inputBarang.html": "inputBarang",
  "invoice.html": "inputBarang",
  "globalStok.html": "globalStok",
  "stockOut.html": "stockOut",
  "invoiceKeluar.html": "stockOut",
  "linkedData.html": "linkedData",
  "laporan.html": "laporan",
  "barangKadaluarsa.html": "barangKadaluarsa",
  "userManagement.html": "user_management",
};

(function guard() {
  const path = window.location.pathname.split("/").pop();
  if (PUBLIC_PAGES.includes(path)) return;

  if (!INVENZ.isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  const needed = PAGE_PERMISSION[path];
  if (needed && !INVENZ.can(needed)) {
    window.location.href = "dashboard.html";
  }
})();

// ================= SIDEBAR PERMISSION FILTER =================
// Menyembunyikan menu/tombol sidebar yang halamannya tidak
// diizinkan untuk role user yang sedang login.
function applySidebarPermissions() {
  if (!INVENZ.isLoggedIn) return;

  document.querySelectorAll(".sidebar-menu a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    const perm = PAGE_PERMISSION[href];
    if (perm && !INVENZ.can(perm)) {
      const li = a.closest("li") || a;
      li.style.display = "none";
    }
  });

  // Jika section "Admin" jadi kosong semua (misal userManagement
  // tersembunyi), sembunyikan juga label section-nya.
  document.querySelectorAll(".sidebar-menu").forEach((menu) => {
    const visibleItems = Array.from(menu.querySelectorAll("li")).filter(
      (li) => li.style.display !== "none",
    );
    if (visibleItems.length === 0) {
      menu.style.display = "none";
      const prevLabel = menu.previousElementSibling;
      if (
        prevLabel &&
        (prevLabel.classList.contains("sidebar-section-label") ||
          prevLabel.classList.contains("sidebar-section"))
      ) {
        prevLabel.style.display = "none";
      }
    }
  });
}

if (document.readyState !== "loading") {
  applySidebarPermissions();
} else {
  document.addEventListener("DOMContentLoaded", applySidebarPermissions);
}
window.applySidebarPermissions = applySidebarPermissions;
