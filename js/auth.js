// js/auth.js
// Menjaga akses halaman berdasarkan status login & role.
// Status SESSION (isLoggedIn / loggedUser / loggedRole) tetap disimpan di
// localStorage -- ini hanya menyimpan "siapa yang sedang login di browser
// ini", BUKAN data bisnis. Data akun sesungguhnya ada di tabel app_users
// di Supabase (lihat login.js).

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

// Hash password super-simple (SAMA seperti versi lama) hanya supaya
// password tidak plaintext di kolom password_hash. Ini BUKAN hashing
// yang aman secara kriptografi -- cukup untuk tugas/demo.
function hashPassword(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0;
  }
  return "h_" + Math.abs(h).toString(36);
}

const INVENZ = {
  get role() {
    return localStorage.getItem("loggedRole") || "";
  },
  get user() {
    return localStorage.getItem("loggedUser") || "Admin";
  },
  get isLoggedIn() {
    return localStorage.getItem("isLoggedIn") === "true";
  },
  can(feature) {
    const perms = ROLE_PERMISSIONS[this.role] || [];
    return perms.includes(feature);
  },
  logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("loggedRole");
    window.location.href = "login.html";
  },
};
window.INVENZ = INVENZ;

// ================= ROUTE GUARD =================
// Halaman publik yang tidak butuh login:
const PUBLIC_PAGES = ["login.html", "index.html", ""];

(function guard() {
  const path = window.location.pathname.split("/").pop();
  if (PUBLIC_PAGES.includes(path)) return;

  if (!INVENZ.isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  // Halaman -> permission yang dibutuhkan
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

  const needed = PAGE_PERMISSION[path];
  if (needed && !INVENZ.can(needed)) {
    window.location.href = "dashboard.html";
  }
})();
