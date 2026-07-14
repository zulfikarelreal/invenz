"use strict";
// ===== USERMANAGEMENT.JS — v2 (Supabase) =====

const ROLE_CLASS = {
  owner: "role-owner",
  admin: "role-admin",
  kepala_toko: "role-kepala",
  kasir: "role-kasir",
  gudang: "role-gudang",
};

// ── INIT ──
const loggedUser = INVENZ.user;
const loggedRole = INVENZ.role;

// Sidebar info
document.querySelectorAll("[data-bind-user]").forEach((el) => {
  el.textContent = loggedUser;
});
document.querySelectorAll("[data-bind-role]").forEach((el) => {
  el.textContent = ROLE_LABELS[loggedRole] || loggedRole;
});
document.querySelectorAll(".sidebar-avatar").forEach((el) => {
  el.textContent = loggedUser.charAt(0).toUpperCase();
});

// Avatar navbar
const navAvatar = document.getElementById("navAvatar");
if (navAvatar) navAvatar.textContent = loggedUser.charAt(0).toUpperCase();

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
  INVENZ.logout();
});

// ── RENDER TABLE ──
async function renderTable(filterRole = "all", filterSearch = "") {
  const tbody = document.getElementById("userTableBody");
  
  let query = sb.from("app_users").select("*").order("created_at");
  if (filterRole !== "all") query = query.eq("role", filterRole);
  
  const { data: usersData, error } = await query;
  let users = usersData || [];
  
  if (filterSearch) {
    const kw = filterSearch.toLowerCase();
    users = users.filter(
      (u) =>
        (u.nama || "").toLowerCase().includes(kw) ||
        (u.username || "").toLowerCase().includes(kw),
    );
  }

  updateStats(users);

  if (!users.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Tidak ada akun ditemukan</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  users.forEach((u, i) => {
    const isMe = u.username === loggedUser;
    const tr = document.createElement("tr");

    const canEdit = !u.is_builtin;
    const canDelete = !u.is_builtin && !isMe;

    tr.innerHTML = `
      <td style="color:var(--text2);font-size:11px">${i + 1}</td>
      <td>
        <div class="user-cell">
          <div class="user-avatar-sm">${(u.nama || "?").charAt(0).toUpperCase()}</div>
          <div>
            <div class="user-cell-name">${u.nama}</div>
            <div class="user-cell-user">@${u.username}</div>
          </div>
        </div>
      </td>
      <td><span class="role-badge ${ROLE_CLASS[u.role] || "role-admin"}">${ROLE_LABELS[u.role] || u.role}</span></td>
      <td>
        ${
          u.is_builtin
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
            canEdit
              ? `
            <button class="btn-action btn-edit-user" onclick="openEditModal('${u.id}')" title="Edit">
              <i class="bx bx-edit"></i>
            </button>
            <button class="btn-action btn-pass-user" onclick="openPassModal('${u.id}')" title="Ganti password">
              <i class="bx bx-key"></i>
            </button>
            ${
              canDelete
                ? `<button class="btn-action btn-delete-user" onclick="confirmDelete('${u.id}')" title="Hapus akun">
                     <i class="bx bx-trash"></i>
                   </button>`
                : `<button class="btn-action disabled" title="Tidak bisa hapus akun sendiri" style="pointer-events:none;opacity:.35">
                     <i class="bx bx-trash"></i>
                   </button>`
            }
          `
              : `<span style="font-size:11px;color:var(--text3)">—</span>`
          }
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateStats(users) {
  const el = (id) => document.getElementById(id);
  if (el("statTotal")) el("statTotal").textContent = users.length;
  if (el("statOwner"))
    el("statOwner").textContent = users.filter(
      (u) => u.role === "owner",
    ).length;
  if (el("statAdmin"))
    el("statAdmin").textContent = users.filter(
      (u) => u.role === "admin",
    ).length;
  if (el("statKepala"))
    el("statKepala").textContent = users.filter(
      (u) => u.role === "kepala_toko",
    ).length;
  if (el("statKasir"))
    el("statKasir").textContent = users.filter(
      (u) => u.role === "kasir",
    ).length;
  if (el("statGudang"))
    el("statGudang").textContent = users.filter(
      (u) => u.role === "gudang",
    ).length;
  if (el("statAktif"))
    el("statAktif").textContent = users.filter((u) => u.aktif !== false).length;
}

// ── FILTER & SEARCH ──
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

// ── TOGGLE AKTIF ──
window.toggleAktif = async function (id, val) {
  const { error } = await sb.from("app_users").update({ aktif: val }).eq("id", id);
  if (error) {
    showToast("Gagal update status", "danger");
    return;
  }
  renderTable(activeFilter, searchKw);
  showToast(
    val ? "Akun diaktifkan" : "Akun dinonaktifkan",
    val ? "success" : "warn",
  );
};

// ── MODAL TAMBAH / EDIT ──
let _editId = null;

window.openAddModal = function () {
  _editId = null;
  const el = (id) => document.getElementById(id);
  el("modalUserTitle").textContent = "Tambah Akun";
  el("fNama").value = "";
  el("fUsername").value = "";
  el("fRole").value = "kasir";
  el("fPass").value = "";
  el("fPass2").value = "";
  if (el("passRow")) el("passRow").style.display = "";
  if (el("pass2Row")) el("pass2Row").style.display = "";
  if (el("passRequired")) el("passRequired").style.display = "";
  el("errUser").textContent = "";
  el("modalUserOverlay").classList.add("active");
  el("fNama").focus();
};

window.openEditModal = async function (id) {
  const { data: u } = await sb.from("app_users").select("*").eq("id", id).single();
  if (!u) return;
  _editId = id;
  const el = (id) => document.getElementById(id);
  el("modalUserTitle").textContent = "Edit Akun";
  el("fNama").value = u.nama;
  el("fUsername").value = u.username;
  el("fRole").value = u.role;
  el("fPass").value = "";
  el("fPass2").value = "";
  if (el("passRow")) el("passRow").style.display = "none";
  if (el("pass2Row")) el("pass2Row").style.display = "none";
  if (el("passRequired")) el("passRequired").style.display = "none";
  el("errUser").textContent = "";
  el("modalUserOverlay").classList.add("active");
  el("fNama").focus();
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

async function saveUser() {
  const el = (id) => document.getElementById(id);
  const nama = el("fNama").value.trim();
  const username = el("fUsername").value.trim().toLowerCase();
  const role = el("fRole").value;
  const pass = el("fPass").value;
  const pass2 = el("fPass2").value;
  const errEl = el("errUser");
  errEl.textContent = "";

  if (!nama || !username || !role) {
    errEl.textContent = "Nama, username, dan role wajib diisi.";
    return;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    errEl.textContent = "Username hanya huruf kecil, angka, dan underscore.";
    return;
  }

  // Cegah custom user membuat akun owner jika bukan owner
  if (role === "owner" && loggedRole !== "owner") {
    errEl.textContent = "Hanya Owner yang dapat membuat akun role Owner.";
    return;
  }

  if (_editId === null) {
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
    const { data: existing } = await sb.from("app_users").select("id").eq("username", username).maybeSingle();
    if (existing) {
      errEl.textContent = "Username sudah digunakan.";
      return;
    }
    
    const { error } = await sb.from("app_users").insert({
      username,
      nama,
      role,
      aktif: true,
      password_hash: hashPassword(pass),
      is_builtin: false
    });
    
    if (error) {
      errEl.textContent = "Gagal menyimpan: " + error.message;
      return;
    }
  } else {
    const { data: existing } = await sb.from("app_users").select("id").eq("username", username).neq("id", _editId).maybeSingle();
    if (existing) {
      errEl.textContent = "Username sudah digunakan.";
      return;
    }
    
    const { error } = await sb.from("app_users").update({
      nama,
      username,
      role
    }).eq("id", _editId);
    
    if (error) {
      errEl.textContent = "Gagal menyimpan: " + error.message;
      return;
    }
  }

  closeUserModal();
  renderTable(activeFilter, searchKw);
  showToast(
    _editId !== null ? "Akun berhasil diperbarui" : "Akun baru berhasil dibuat",
    "success",
  );
}

// ── MODAL GANTI PASSWORD ──
let _passUserId = null;

window.openPassModal = async function (id) {
  _passUserId = id;
  const { data: u } = await sb.from("app_users").select("nama").eq("id", id).single();
  const el = (id) => document.getElementById(id);
  el("passModalName").textContent = u ? u.nama : "";
  el("fNewPass").value = "";
  el("fNewPass2").value = "";
  el("errPass").textContent = "";
  el("modalPassOverlay").classList.add("active");
  el("fNewPass").focus();
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

document.getElementById("btnSimpanPass")?.addEventListener("click", async () => {
  const el = (id) => document.getElementById(id);
  const np = el("fNewPass").value;
  const np2 = el("fNewPass2").value;
  const errEl = el("errPass");
  errEl.textContent = "";
  if (np.length < 6) {
    errEl.textContent = "Password minimal 6 karakter.";
    return;
  }
  if (np !== np2) {
    errEl.textContent = "Konfirmasi tidak cocok.";
    return;
  }
  
  const { error } = await sb.from("app_users").update({ password_hash: hashPassword(np) }).eq("id", _passUserId);
  if (error) {
    errEl.textContent = "Gagal update: " + error.message;
    return;
  }
  
  closePassModal();
  showToast("Password berhasil diubah", "success");
});

// ── KONFIRMASI HAPUS ──
let _deleteId = null;

window.confirmDelete = async function (id) {
  _deleteId = id;
  const { data: u } = await sb.from("app_users").select("nama").eq("id", id).single();
  document.getElementById("deleteUserName").textContent = u ? u.nama : "";
  document.getElementById("confirmDeleteOverlay").classList.add("active");
};

document.getElementById("btnCancelDelete")?.addEventListener("click", () => {
  _deleteId = null;
  document.getElementById("confirmDeleteOverlay").classList.remove("active");
});

document.getElementById("btnConfirmDelete")?.addEventListener("click", async () => {
  if (!_deleteId) return;
  
  const { error } = await sb.from("app_users").delete().eq("id", _deleteId);
  if (error) {
    showToast("Gagal hapus: " + error.message, "danger");
    return;
  }
  
  _deleteId = null;
  document.getElementById("confirmDeleteOverlay").classList.remove("active");
  renderTable(activeFilter, searchKw);
  showToast("Akun berhasil dihapus", "danger");
});

document
  .getElementById("confirmDeleteOverlay")
  ?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("confirmDeleteOverlay")) {
      _deleteId = null;
      document
        .getElementById("confirmDeleteOverlay")
        .classList.remove("active");
    }
  });

// ── TOAST ──
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove("show"), 2800);
}

// ── INIT ──
renderTable();
