"use strict";
// ===== USERMANAGEMENT.JS =====
// Halaman manajemen akun — hanya bisa diakses role "admin"

const UM_KEY = "invenz_users";

// ── Default built-in admin (tidak bisa dihapus) ──
const BUILTIN = [
  {
    id: "builtin_admin",
    username: "admin",
    nama: "Administrator",
    role: "admin",
    aktif: true,
    isBuiltin: true,
  },
  {
    id: "builtin_invenz",
    username: "invenz",
    nama: "Invenz Owner",
    role: "admin",
    aktif: true,
    isBuiltin: true,
  },
];

function loadUsers() {
  try {
    const raw = localStorage.getItem(UM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(list) {
  localStorage.setItem(UM_KEY, JSON.stringify(list));
}

function getAllUsers() {
  const custom = loadUsers();
  // Gabung builtin + custom, hindari duplikat username builtin
  const customFiltered = custom.filter(
    (u) => !BUILTIN.some((b) => b.username === u.username),
  );
  return [...BUILTIN, ...customFiltered];
}

function generateId() {
  return "usr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
}

function hashPassword(pw) {
  // Sederhana — produksi gunakan bcrypt di server
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0;
  }
  return "h_" + Math.abs(h).toString(36);
}

// ───────────────────────────────────────────────
// INIT
// ───────────────────────────────────────────────
const loggedUser = localStorage.getItem("loggedUser") || "Admin";
const loggedRole = localStorage.getItem("loggedRole") || "admin";

// Sidebar info
document
  .querySelectorAll("[data-bind-user]")
  .forEach((el) => (el.textContent = loggedUser));
document.querySelectorAll("[data-bind-role]").forEach((el) => {
  const labels = {
    admin: "Administrator",
    kasir: "Kasir",
    gudang: "Staf Gudang",
  };
  el.textContent = labels[loggedRole] || loggedRole;
});

// Sidebar avatar initial
document.querySelectorAll(".sidebar-avatar").forEach((el) => {
  el.textContent = loggedUser.charAt(0).toUpperCase();
});

// Sidebar toggle
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
document.getElementById("hamburger")?.addEventListener("click", () => {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("active");
});
document
  .getElementById("sidebarClose")
  ?.addEventListener("click", closeSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);
function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
}

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("loggedUser");
  localStorage.removeItem("loggedRole");
  window.location.href = "login.html";
});

// ───────────────────────────────────────────────
// RENDER TABLE
// ───────────────────────────────────────────────
const ROLE_LABELS = {
  admin: "Administrator",
  kasir: "Kasir",
  gudang: "Staf Gudang",
};
const ROLE_CLASS = {
  admin: "role-admin",
  kasir: "role-kasir",
  gudang: "role-gudang",
};

function renderTable(filterRole = "all", filterSearch = "") {
  const tbody = document.getElementById("userTableBody");
  let users = getAllUsers();

  if (filterRole !== "all") users = users.filter((u) => u.role === filterRole);
  if (filterSearch) {
    const kw = filterSearch.toLowerCase();
    users = users.filter(
      (u) =>
        u.nama.toLowerCase().includes(kw) ||
        u.username.toLowerCase().includes(kw),
    );
  }

  updateStats(getAllUsers());

  if (!users.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Tidak ada akun ditemukan</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  users.forEach((u, i) => {
    const isMe = u.username === loggedUser;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="color:var(--text2);font-size:11px">${i + 1}</td>
      <td>
        <div class="user-cell">
          <div class="user-avatar-sm">${u.nama.charAt(0).toUpperCase()}</div>
          <div>
            <div class="user-cell-name">${u.nama}</div>
            <div class="user-cell-user">@${u.username}</div>
          </div>
        </div>
      </td>
      <td><span class="role-badge ${ROLE_CLASS[u.role]}">${ROLE_LABELS[u.role] || u.role}</span></td>
      <td>
        ${
          u.isBuiltin
            ? `<span class="builtin-badge">Built-in</span>`
            : `<label class="toggle-wrap">
               <input type="checkbox" ${u.aktif ? "checked" : ""}
                 onchange="toggleAktif('${u.id}', this.checked)">
               <span class="toggle-slider"></span>
             </label>`
        }
      </td>
      <td><span class="status-dot-cell ${u.aktif ? "aktif" : "nonaktif"}">${u.aktif ? "Aktif" : "Nonaktif"}</span></td>
      <td>
        <div class="action-btns">
          ${
            u.isBuiltin
              ? `<span style="font-size:11px;color:var(--text3)">—</span>`
              : `
            <button class="btn-action btn-edit-user"   onclick="openEditModal('${u.id}')" title="Edit">
              <i class="bx bx-edit"></i>
            </button>
            <button class="btn-action btn-pass-user"   onclick="openPassModal('${u.id}')" title="Ganti password">
              <i class="bx bx-lock-alt"></i>
            </button>
            <button class="btn-action btn-delete-user ${isMe ? "disabled" : ""}"
              onclick="${isMe ? "" : `confirmDelete('${u.id}')`}" title="${isMe ? "Tidak bisa hapus akun sendiri" : "Hapus akun"}">
              <i class="bx bx-trash"></i>
            </button>
          `
          }
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateStats(users) {
  document.getElementById("statTotal").textContent = users.length;
  document.getElementById("statAdmin").textContent = users.filter(
    (u) => u.role === "admin",
  ).length;
  document.getElementById("statKasir").textContent = users.filter(
    (u) => u.role === "kasir",
  ).length;
  document.getElementById("statGudang").textContent = users.filter(
    (u) => u.role === "gudang",
  ).length;
  document.getElementById("statAktif").textContent = users.filter(
    (u) => u.aktif !== false,
  ).length;
}

// ───────────────────────────────────────────────
// FILTER & SEARCH
// ───────────────────────────────────────────────
let activeFilter = "all";
let searchKw = "";

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-chip")
      .forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.role;
    renderTable(activeFilter, searchKw);
  });
});

document.getElementById("searchUser")?.addEventListener("input", function () {
  searchKw = this.value.trim();
  renderTable(activeFilter, searchKw);
});

// ───────────────────────────────────────────────
// TOGGLE AKTIF / NONAKTIF
// ───────────────────────────────────────────────
window.toggleAktif = function (id, val) {
  const list = loadUsers();
  const idx = list.findIndex((u) => u.id === id);
  if (idx === -1) return;
  list[idx].aktif = val;
  saveUsers(list);
  renderTable(activeFilter, searchKw);
  showToast(
    val ? "Akun diaktifkan" : "Akun dinonaktifkan",
    val ? "success" : "warn",
  );
};

// ───────────────────────────────────────────────
// MODAL TAMBAH / EDIT
// ───────────────────────────────────────────────
let _editId = null;

window.openAddModal = function () {
  _editId = null;
  document.getElementById("modalUserTitle").textContent = "Tambah Akun";
  document.getElementById("fNama").value = "";
  document.getElementById("fUsername").value = "";
  document.getElementById("fRole").value = "kasir";
  document.getElementById("fPass").value = "";
  document.getElementById("fPass2").value = "";
  document.getElementById("passRow").style.display = "";
  document.getElementById("pass2Row").style.display = "";
  document.getElementById("passRequired").style.display = "";
  document.getElementById("errUser").textContent = "";
  document.getElementById("modalUserOverlay").classList.add("active");
  document.getElementById("fNama").focus();
};

window.openEditModal = function (id) {
  const all = getAllUsers();
  const u = all.find((x) => x.id === id);
  if (!u) return;
  _editId = id;
  document.getElementById("modalUserTitle").textContent = "Edit Akun";
  document.getElementById("fNama").value = u.nama;
  document.getElementById("fUsername").value = u.username;
  document.getElementById("fRole").value = u.role;
  document.getElementById("fPass").value = "";
  document.getElementById("fPass2").value = "";
  document.getElementById("passRow").style.display = "none";
  document.getElementById("pass2Row").style.display = "none";
  document.getElementById("passRequired").style.display = "none";
  document.getElementById("errUser").textContent = "";
  document.getElementById("modalUserOverlay").classList.add("active");
  document.getElementById("fNama").focus();
};

function closeUserModal() {
  document.getElementById("modalUserOverlay").classList.remove("active");
  _editId = null;
}

document
  .getElementById("btnCloseUserModal")
  ?.addEventListener("click", closeUserModal);
document
  .getElementById("btnBatalUser")
  ?.addEventListener("click", closeUserModal);
document.getElementById("modalUserOverlay")?.addEventListener("click", (e) => {
  if (e.target === document.getElementById("modalUserOverlay"))
    closeUserModal();
});

document.getElementById("btnSimpanUser")?.addEventListener("click", saveUser);

function saveUser() {
  const nama = document.getElementById("fNama").value.trim();
  const username = document
    .getElementById("fUsername")
    .value.trim()
    .toLowerCase();
  const role = document.getElementById("fRole").value;
  const pass = document.getElementById("fPass").value;
  const pass2 = document.getElementById("fPass2").value;
  const errEl = document.getElementById("errUser");
  errEl.textContent = "";

  if (!nama || !username || !role) {
    errEl.textContent = "Nama, username, dan role wajib diisi.";
    return;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    errEl.textContent = "Username hanya huruf kecil, angka, dan underscore.";
    return;
  }

  const list = loadUsers();

  if (_editId === null) {
    // Tambah baru
    if (!pass) {
      errEl.textContent = "Password wajib diisi untuk akun baru.";
      return;
    }
    if (pass.length < 6) {
      errEl.textContent = "Password minimal 6 karakter.";
      return;
    }
    if (pass !== pass2) {
      errEl.textContent = "Konfirmasi password tidak cocok.";
      return;
    }
    // Cek duplikat username (builtin + custom)
    const allNames = getAllUsers().map((u) => u.username);
    if (allNames.includes(username)) {
      errEl.textContent = "Username sudah digunakan.";
      return;
    }
    list.push({
      id: generateId(),
      username,
      nama,
      role,
      aktif: true,
      passwordHash: hashPassword(pass),
    });
  } else {
    // Edit
    const idx = list.findIndex((u) => u.id === _editId);
    if (idx === -1) return;
    // Cek duplikat username kecuali diri sendiri
    const others = getAllUsers()
      .filter((u) => u.id !== _editId)
      .map((u) => u.username);
    if (others.includes(username)) {
      errEl.textContent = "Username sudah digunakan.";
      return;
    }
    list[idx].nama = nama;
    list[idx].username = username;
    list[idx].role = role;
  }

  saveUsers(list);
  closeUserModal();
  renderTable(activeFilter, searchKw);
  showToast(
    _editId ? "Akun berhasil diperbarui" : "Akun baru berhasil dibuat",
    "success",
  );
}

// ───────────────────────────────────────────────
// MODAL GANTI PASSWORD
// ───────────────────────────────────────────────
let _passUserId = null;

window.openPassModal = function (id) {
  _passUserId = id;
  const all = getAllUsers();
  const u = all.find((x) => x.id === id);
  document.getElementById("passModalName").textContent = u ? u.nama : "";
  document.getElementById("fNewPass").value = "";
  document.getElementById("fNewPass2").value = "";
  document.getElementById("errPass").textContent = "";
  document.getElementById("modalPassOverlay").classList.add("active");
  document.getElementById("fNewPass").focus();
};

function closePassModal() {
  document.getElementById("modalPassOverlay").classList.remove("active");
  _passUserId = null;
}

document
  .getElementById("btnClosePassModal")
  ?.addEventListener("click", closePassModal);
document
  .getElementById("btnBatalPass")
  ?.addEventListener("click", closePassModal);
document.getElementById("modalPassOverlay")?.addEventListener("click", (e) => {
  if (e.target === document.getElementById("modalPassOverlay"))
    closePassModal();
});

document.getElementById("btnSimpanPass")?.addEventListener("click", () => {
  const np = document.getElementById("fNewPass").value;
  const np2 = document.getElementById("fNewPass2").value;
  const errEl = document.getElementById("errPass");
  errEl.textContent = "";
  if (np.length < 6) {
    errEl.textContent = "Password minimal 6 karakter.";
    return;
  }
  if (np !== np2) {
    errEl.textContent = "Konfirmasi tidak cocok.";
    return;
  }
  const list = loadUsers();
  const idx = list.findIndex((u) => u.id === _passUserId);
  if (idx === -1) return;
  list[idx].passwordHash = hashPassword(np);
  saveUsers(list);
  closePassModal();
  showToast("Password berhasil diubah", "success");
});

// ───────────────────────────────────────────────
// KONFIRMASI HAPUS
// ───────────────────────────────────────────────
let _deleteId = null;

window.confirmDelete = function (id) {
  _deleteId = id;
  const all = getAllUsers();
  const u = all.find((x) => x.id === id);
  document.getElementById("deleteUserName").textContent = u ? u.nama : "";
  document.getElementById("confirmDeleteOverlay").classList.add("active");
};

document.getElementById("btnCancelDelete")?.addEventListener("click", () => {
  _deleteId = null;
  document.getElementById("confirmDeleteOverlay").classList.remove("active");
});

document.getElementById("btnConfirmDelete")?.addEventListener("click", () => {
  if (!_deleteId) return;
  const list = loadUsers().filter((u) => u.id !== _deleteId);
  saveUsers(list);
  _deleteId = null;
  document.getElementById("confirmDeleteOverlay").classList.remove("active");
  renderTable(activeFilter, searchKw);
  showToast("Akun berhasil dihapus", "danger");
});

// ───────────────────────────────────────────────
// TOAST
// ───────────────────────────────────────────────
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove("show"), 2800);
}

// ───────────────────────────────────────────────
// INIT
// ───────────────────────────────────────────────
renderTable();
